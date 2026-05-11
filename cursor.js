// ============================================================================
//  ADAPTIVE CURSOR
//  --------------------------------------------------------------------------
//  Sections in order:
//    1. CONFIG           — knobs a developer would want to tune
//    2. MODE_PRESETS     — target values for each visual mode
//    3. DOM refs         — cached element references
//    4. State            — animated values, velocities, event state
//    5. Mode detection   — what the mouse is hovering, which mode applies
//    6. Event handlers   — mousemove, mousedown, mouseup
//    7. Animation loop   — hot path, optimized, driven by gsap.ticker
// ============================================================================
//
//  Requires: GSAP 3.x loaded globally before this script runs.
// ============================================================================


// ============================================================================
//  1. CONFIG
// ============================================================================
const CONFIG = {
    // CSS selectors that decide which mode each element triggers. Extend as needed.
    // Use descendant combinators (e.g. 'p span') to match by ancestor.
    triggers: {
        text:   'h1, h1 *, h2, h2 div, p, p span, p em, p strong',  // text-mode for inline children of <p>
        button: 'button, a.spec-btn',                         // add ', a' to include links
    },
    // Spring physics: [stiffness, damping]. Higher stiffness = snappier.
    springs: {
        inner: [175, 23],             // SVG cursor morphs
        outer: [190, 24],             // CSS div that wraps buttons
        press: [120, 18],             // click-and-hold squeeze
    },
    button: {
        padding: 5,                   // pixels around the wrapped button
        borderAlpha: 0.85,            // wrap-ring border opacity
    },
    press: {
        maxHoldFrames: 120,           // ~2s at 60fps to reach full charge
        dustThreshold: 0.3,           // releases below this emit no dust
        dustMax: 10,
    },
    idleFrames: 300,                  // ~5s still before idle breathing kicks in
    hoverPulseStrength: 2.2,
};


// ============================================================================
//  2. MODE_PRESETS
//  All inner properties listed per mode so springs always have a target.
//  Add a new mode by copying default, editing values, adding a case in detectMode().
// ============================================================================
const MODE_PRESETS = {
    // Default — outer ring + inner ring + filled white core
    default: {
        haze: 0,
        oOp: 1,         // outer stroke opacity
        iOp: 1,         // inner stroke opacity
        iFillOp: 1,     // inner FILLED disc opacity (NEW — solid mass for visibility)
        dot: 0,         // standalone center dot (only used in some modes)
        rx: 11, ry: 11,         // outer ellipse radii
        irx: 7, iry: 7,         // inner ring radii
        iFillR: 3.5,            // inner filled disc radius
        oS: 1.0, iS: 1.0,       // stroke alphas (now full white)
        oSW: 1.1, iSW: 0.9,     // stroke widths
        dotR: 0,
        serifOp: 0, serifW: 0, serifSpan: 0,
        coreR: 11,              // baseline radius for ripple + dust
    },
    // Text — vertical stem with I-beam serifs. Inner hidden.
    text: {
        haze: 0.12,
        oOp: 1, iOp: 0, iFillOp: 0, dot: 0,
        rx: 0.35, ry: 16,
        irx: 0, iry: 0,
        iFillR: 0,
        oS: 1.0, iS: 0,
        oSW: 1.4, iSW: 0,
        dotR: 0,
        serifOp: 1, serifW: 3, serifSpan: 16,
        coreR: 8,
    },
    // Button — SVG outer hides (CSS div takes over), inner becomes precision dot
    button: {
        haze: 0.25,
        oOp: 0,
        iOp: 1, iFillOp: 1, dot: 1,
        rx: 11, ry: 11,
        irx: 4, iry: 4,
        iFillR: 2,                  // smaller filled core
        oS: 1.0, iS: 1.0,
        oSW: 1.1, iSW: 1.0,
        dotR: 1.5,
        serifOp: 0, serifW: 0, serifSpan: 0,
        coreR: 8,
    },
};


// ============================================================================
//  3. DOM REFS
// ============================================================================
const outer    = document.getElementById('cursorOuter');
const cur      = document.getElementById('customCursor');
const oS       = document.getElementById('outerShape');
const iS       = document.getElementById('innerShape');
const iFill    = document.getElementById('innerFill');
const dot      = document.getElementById('centerDot');
const sTop     = document.getElementById('serifTop');
const sBot     = document.getElementById('serifBot');
const hz       = document.getElementById('outerHaze');
const pRipple  = document.getElementById('pressRipple');
const pFlash   = document.getElementById('pressFlash');
const segs     = [0,1,2,3,4,5].map(i => document.getElementById('s' + i));
// Direct style refs (saves a property lookup per write in the hot loop)
const outerStyle = outer.style;
const oSStyle    = oS.style;
const iFillStyle = iFill.style;
// Cursor element position is written via gsap.quickSetter — see section 4.


// ============================================================================
//  4. STATE
// ============================================================================
let mx = innerWidth / 2, my = innerHeight / 2;
let px = mx, py = my;

let mode = 'default';
let btnEl = null;
let btnRadius = 12;
let firstMove = true;

// Idle breathing
let idleT = 0;
let idleAmp = 0, idleTargetAmp = 0, idlePhase = 0;

// Press / hold
let pressed = false;
let pressTarget = 0, pressVal = 0, pressVel = 0;
let rippleT = -1;
let holdDuration = 0;
let releaseCharge = 0;
let vibratePhase = 0, vibrateAmp = 0;

// Hover-enter pulse
let hoverPulseT = -1;

// Inner SVG animated state
const TGT = { ...MODE_PRESETS.default };
const CUR = { ...TGT };
const VEL = {};
for (const k in CUR) VEL[k] = 0;
const CUR_KEYS = Object.keys(CUR);
const CUR_KEYS_LEN = CUR_KEYS.length;

// Outer CSS-div animated state
const OUTER_TGT = { x: -9999, y: -9999, w: 22, h: 22, br: 11, op: 0 };
const OUTER_CUR = { ...OUTER_TGT };
const OUTER_VEL = { x: 0, y: 0, w: 0, h: 0, br: 0, op: 0 };
const OUTER_KEYS = Object.keys(OUTER_CUR);
const OUTER_KEYS_LEN = OUTER_KEYS.length;

// Direction segments
const N = 6;
const sg = new Float64Array(N);
const tg = new Float64Array(N);

// Dust particles
const dustEls = [];
const dustParticles = [];
for (let i = 0; i < CONFIG.press.dustMax; i++) {
    dustEls.push(document.getElementById('dust' + i));
    dustParticles.push({ active: false, t: 0, angle: 0, speed: 0, startR: 0, drift: 0 });
}

const DT = 1 / 60;
const [K_IN, D_IN]   = CONFIG.springs.inner;
const [K_OUT, D_OUT] = CONFIG.springs.outer;
const [K_PR, D_PR]   = CONFIG.springs.press;

// gsap.utils — reusable clamp/normalize functions (function-form is the recommended
// pattern when the same range is hit many times per frame; avoids re-parsing args).
const clamp01      = gsap.utils.clamp(0, 1);
const normHold     = gsap.utils.normalize(0, CONFIG.press.maxHoldFrames);

// gsap.quickSetter — caches the property writer for the cursor element. The cursor
// pins to the raw mouse position every frame, so this is the hottest write in the loop.
const setCurLeft = gsap.quickSetter(cur, 'left', 'px');
const setCurTop  = gsap.quickSetter(cur, 'top',  'px');


// ============================================================================
//  5. MODE DETECTION & APPLICATION
// ============================================================================
function detectMode(el) {
    if (!el || el.nodeType !== 1) return 'default';
    if (el.matches(CONFIG.triggers.text))   return 'text';
    if (el.matches(CONFIG.triggers.button)) return 'button';
    return 'default';
}

function applyInnerMode(name) {
    const p = MODE_PRESETS[name];
    for (let i = 0; i < CUR_KEYS_LEN; i++) {
        const k = CUR_KEYS[i];
        TGT[k] = p[k];
    }
}

function wrapOuterAround(el) {
    const r = el.getBoundingClientRect();
    const pad = CONFIG.button.padding;
    OUTER_TGT.x  = r.left + r.width / 2;
    OUTER_TGT.y  = r.top  + r.height / 2;
    OUTER_TGT.w  = r.width  + pad * 2;
    OUTER_TGT.h  = r.height + pad * 2;
    OUTER_TGT.br = Math.min(btnRadius + pad, Math.min(OUTER_TGT.w, OUTER_TGT.h) / 2);
    OUTER_TGT.op = CONFIG.button.borderAlpha;
}

function parkOuterAtMouse() {
    OUTER_TGT.x = mx; OUTER_TGT.y = my;
    OUTER_TGT.w = 22; OUTER_TGT.h = 22;
    OUTER_TGT.br = 11; OUTER_TGT.op = 0;
}


// ============================================================================
//  6. EVENT HANDLERS
// ============================================================================
document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    idleT = 0; idleTargetAmp = 0;

    if (firstMove) { OUTER_CUR.x = mx; OUTER_CUR.y = my; firstMove = false; }

    const el = document.elementFromPoint(mx, my);
    const newMode = detectMode(el);

    if (newMode !== mode) {
        mode = newMode;
        applyInnerMode(newMode);
        hoverPulseT = 0;
        if (newMode !== 'button') btnEl = null;
    }

    if (newMode === 'button') {
        if (btnEl !== el) {
            btnEl = el;
            // Read border-radius once per button entry (style recalc is expensive)
            btnRadius = parseFloat(getComputedStyle(el).borderRadius) || 12;
        }
        wrapOuterAround(el);
    } else {
        parkOuterAtMouse();
    }
});

document.addEventListener('mousedown', () => {
    pressed = true; pressTarget = 1;
    rippleT = -1; holdDuration = 0;
});
document.addEventListener('mouseup', () => {
    const baseCharge = clamp01(normHold(holdDuration));
    releaseCharge = clamp01(baseCharge + vibrateAmp * 0.4);
    pressed = false; pressTarget = 0;
    rippleT = 0;
    if (releaseCharge > CONFIG.press.dustThreshold) emitDust(releaseCharge);
    holdDuration = 0;
});

function emitDust(charge) {
    const max = CONFIG.press.dustMax;
    const count = charge > 0.7 ? max : Math.max(3, Math.floor(max * charge));
    const step = (Math.PI * 2) / count;
    for (let i = 0; i < max; i++) {
        const p = dustParticles[i];
        if (i >= count) { p.active = false; continue; }
        p.active = true;
        p.t      = 0;
        p.angle  = step * i + (Math.random() - 0.5) * 0.9;
        p.speed  = (16 + Math.random() * 22) * (0.5 + charge * 0.5);
        p.startR = 0.25 + Math.random() * 0.35 + charge * 0.3;
        p.drift  = (Math.random() - 0.5) * 0.015;
    }
}


// ============================================================================
//  7. ANIMATION LOOP  (driven by gsap.ticker — see bottom of file)
// ============================================================================
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

function dirSeg(vx, vy) {
    const a = (Math.atan2(vy, vx) + Math.PI/2 + Math.PI*2) % (Math.PI*2);
    return Math.floor((a / (Math.PI*2)) * N) % N;
}

function animate() {
    // ---- Position & velocity ----
    setCurLeft(mx);
    setCurTop(my);
    const vx = mx - px, vy = my - py;
    const spd = Math.sqrt(vx * vx + vy * vy);
    px = mx; py = my;

    // ---- Idle breathing ----
    if (spd < 0.1) { idleT++; if (idleT >= CONFIG.idleFrames) idleTargetAmp = 1; }
    else { idleT = 0; idleTargetAmp = 0; }
    idleAmp += (idleTargetAmp - idleAmp) * 0.02;
    idlePhase += 0.025;
    const sinV = Math.sin(idlePhase) * 0.5 + 0.5;
    const pso = sinV * 1.2 * idleAmp;
    const psi = sinV * 0.8 * idleAmp;
    const po  = sinV * 0.1 * idleAmp;

    // ---- Press spring (inlined) ----
    {
        const acc = (pressTarget - pressVal) * K_PR - pressVel * D_PR;
        pressVel += acc * DT;
        pressVal += pressVel * DT;
    }

    // ---- Hover-enter pulse ----
    let hoverPulseAdd = 0;
    if (hoverPulseT >= 0 && hoverPulseT <= 1) {
        hoverPulseT += 0.055;
        hoverPulseAdd = (1 - easeOutQuart(clamp01(hoverPulseT))) * CONFIG.hoverPulseStrength;
        if (hoverPulseT > 1) hoverPulseT = -1;
    }

    // ---- Press hold charge & vibration ----
    if (pressed) holdDuration++;
    const holdNorm  = clamp01(normHold(holdDuration));
    const holdEased = holdNorm * holdNorm * (3 - 2 * holdNorm);
    const vibrateTarget = pressed ? holdNorm * holdNorm * holdNorm : 0;
    vibrateAmp += (vibrateTarget - vibrateAmp) * 0.025;
    vibratePhase += 0.06 + vibrateAmp * 0.04;
    const vib1 = Math.sin(vibratePhase);
    const vib2 = Math.sin(vibratePhase * 1.7 + 0.8);
    const vib3 = Math.sin(vibratePhase * 0.6 + 2.1);
    const vibJitterX    = (vib1 * 0.5 + vib2 * 0.3) * vibrateAmp * 0.7;
    const vibJitterY    = (vib2 * 0.5 - vib1 * 0.3) * vibrateAmp * 0.7;
    const vibBulgeOuter = (vib3 * 0.5 + vib1 * 0.3) * vibrateAmp * 1.8;
    const vibBulgeInner = (vib3 * 0.4 + vib2 * 0.2) * vibrateAmp * 1.2;
    const vibStrokePulse = (vib1 * 0.5 + 0.5) * vibrateAmp * 0.12;

    // ---- Press-derived modulation ----
    const sqz = clamp01(pressVal);
    const squeezeFactor = 1 - sqz * (0.15 + holdEased * 0.15);
    const squeezeBright = sqz * (0.25 + holdEased * 0.2) + vibStrokePulse;
    const squeezeFlash  = sqz * (0.3 + holdEased * 0.25);
    const dotScale      = 1 + sqz * (0.8 + holdEased * 0.6);

    // ---- Ripple progression ----
    let rR = 0, rO = 0, fO = 0;
    if (rippleT >= 0 && rippleT <= 1) {
        rippleT += 0.025 - releaseCharge * 0.015;
        const re = easeOutQuart(clamp01(rippleT));
        rR = CUR.coreR + re * (12 + releaseCharge * 32);
        rO = (1 - re) * (0.5 + releaseCharge * 0.5);
        fO = Math.max(0, (1 - rippleT * (1.8 - releaseCharge))) * (0.35 + releaseCharge * 0.4);
        if (rippleT > 1) rippleT = -1;
    }

    // ---- Spring step: INNER (inlined, indexed) ----
    for (let i = 0; i < CUR_KEYS_LEN; i++) {
        const k = CUR_KEYS[i];
        const c = CUR[k], v = VEL[k];
        const nv = v + ((TGT[k] - c) * K_IN - v * D_IN) * DT;
        CUR[k] = c + nv * DT;
        VEL[k] = nv;
    }
    // ---- Spring step: OUTER ----
    for (let i = 0; i < OUTER_KEYS_LEN; i++) {
        const k = OUTER_KEYS[i];
        const c = OUTER_CUR[k], v = OUTER_VEL[k];
        const nv = v + ((OUTER_TGT[k] - c) * K_OUT - v * D_OUT) * DT;
        OUTER_CUR[k] = c + nv * DT;
        OUTER_VEL[k] = nv;
    }

    // ---- Render: CSS-div outer ----
    const pressShrink = sqz * 2;
    const ow = Math.max(0, OUTER_CUR.w - pressShrink);
    const oh = Math.max(0, OUTER_CUR.h - pressShrink);
    const outerOp = OUTER_CUR.op > 0 ? OUTER_CUR.op : 0;
    outerStyle.width  = ow + 'px';
    outerStyle.height = oh + 'px';
    outerStyle.borderRadius = OUTER_CUR.br + 'px';
    outerStyle.transform    = `translate3d(${(OUTER_CUR.x - ow/2)|0}px, ${(OUTER_CUR.y - oh/2)|0}px, 0)`;
    outerStyle.borderColor  = `rgba(255,255,255,${outerOp.toFixed(2)})`;
    // Two-layer outline: solid 1px line + 3px soft falloff for visibility on bright surfaces
    outerStyle.boxShadow =
        `0 0 0 1px rgba(0,0,0,${(outerOp * 0.95).toFixed(2)}),` +
        `0 0 4px rgba(0,0,0,${(outerOp * 0.5).toFixed(2)})`;

    // ---- Render: SVG inner shapes ----
    const vcx = 40 + vibJitterX;
    const vcy = 40 + vibJitterY;

    // Outer ring — gate writes when fully faded (button mode)
    if (CUR.oOp > 0.005) {
        const isText = mode === 'text';
        const orx = Math.max(0, (CUR.rx + pso + hoverPulseAdd) * squeezeFactor + (isText ? 0 : vibBulgeOuter));
        const ory = Math.max(0, (CUR.ry + pso + (isText ? 0 : hoverPulseAdd)) * squeezeFactor + vibBulgeOuter * 0.8);
        oS.setAttribute('cx', vcx);
        oS.setAttribute('cy', vcy);
        oS.setAttribute('rx', orx);
        oS.setAttribute('ry', ory);
        oSStyle.opacity = CUR.oOp;
        oS.setAttribute('stroke-width', CUR.oSW);
        oS.setAttribute('stroke', `rgba(255,255,255,${Math.min(1, CUR.oS + squeezeBright).toFixed(2)})`);
    } else {
        oSStyle.opacity = 0;
    }

    // Inner ring
    const irx = Math.max(0, (CUR.irx + psi + hoverPulseAdd * 0.4) * squeezeFactor + vibBulgeInner);
    const iry = Math.max(0, (CUR.iry + psi + hoverPulseAdd * 0.4) * squeezeFactor + vibBulgeInner * 0.8);
    iS.setAttribute('cx', vcx);
    iS.setAttribute('cy', vcy);
    iS.setAttribute('rx', irx);
    iS.setAttribute('ry', iry);
    iS.style.opacity = CUR.iOp;
    iS.setAttribute('stroke-width', CUR.iSW);
    iS.setAttribute('stroke', `rgba(255,255,255,${Math.min(1, CUR.iS + squeezeBright).toFixed(2)})`);

    // Inner FILLED disc — the solid mass that makes the cursor read on bright bg
    if (CUR.iFillOp > 0.005 && CUR.iFillR > 0.05) {
        const fillR = Math.max(0, CUR.iFillR * squeezeFactor + vibBulgeInner * 0.4);
        iFill.setAttribute('cx', vcx);
        iFill.setAttribute('cy', vcy);
        iFill.setAttribute('r', fillR);
        iFillStyle.opacity = CUR.iFillOp;
    } else {
        iFillStyle.opacity = 0;
    }

    // Standalone center dot (only used in button mode press, mostly)
    if (CUR.dot > 0.005 && CUR.dotR > 0.05) {
        const dotR = Math.max(0, CUR.dotR * dotScale + vibrateAmp * (vib1 * 0.5 + 0.5) * 0.8);
        dot.setAttribute('cx', vcx);
        dot.setAttribute('cy', vcy);
        dot.setAttribute('r', dotR);
        dot.style.opacity = CUR.dot;
    } else {
        dot.style.opacity = 0;
    }

    // Serifs
    if (CUR.serifOp > 0.005 || CUR.serifSpan > 0.1) {
        const span = CUR.serifSpan;
        const sw = CUR.serifW + vibrateAmp * vib2 * 0.8;
        const serifTopY = vcy - span, serifBotY = vcy + span;
        sTop.setAttribute('x1', vcx - sw); sTop.setAttribute('x2', vcx + sw);
        sTop.setAttribute('y1', serifTopY); sTop.setAttribute('y2', serifTopY);
        sTop.style.opacity = CUR.serifOp;
        sBot.setAttribute('x1', vcx - sw); sBot.setAttribute('x2', vcx + sw);
        sBot.setAttribute('y1', serifBotY); sBot.setAttribute('y2', serifBotY);
        sBot.style.opacity = CUR.serifOp;
    } else {
        sTop.style.opacity = 0;
        sBot.style.opacity = 0;
    }

    // Press flash
    pFlash.setAttribute('r', iry > 0 ? iry : 4);
    pFlash.style.opacity = Math.max(squeezeFlash, fO);
    if (fO > 0 && rippleT >= 0) {
        pFlash.setAttribute('r', (iry > 0 ? iry : 4) + easeOutQuart(clamp01(rippleT)) * (3 + releaseCharge * 8));
    }

    // Press ripple
    if (rippleT >= 0 || rO > 0.005) {
        pRipple.setAttribute('r', rR);
        pRipple.style.opacity = rO;
        const baseStroke = 1 + releaseCharge * 1.6;
        pRipple.setAttribute('stroke-width', (baseStroke * Math.max(0.1, 1 - easeOutQuart(clamp01(rippleT)))).toFixed(2));
    } else {
        pRipple.style.opacity = 0;
    }

    // Motion haze + directional segments (default mode only)
    hz.style.opacity = po;
    if (spd > 0.5 && mode === 'default') {
        const ti = Math.min(spd / 15, 0.5);
        hz.style.opacity = Math.max(po, ti * 0.35);
        const ai = dirSeg(-vx, -vy);
        tg.fill(0);
        tg[ai]               = Math.min(spd / 8, 1);
        tg[(ai - 1 + N) % N] = Math.min(spd / 12, 0.5);
        tg[(ai + 1) % N]     = Math.min(spd / 12, 0.5);
        const invSpd = 1 / spd;
        hz.setAttribute('cx', 40 + (-vx * invSpd) * 2);
        hz.setAttribute('cy', 40 + (-vy * invSpd) * 2);
    } else if (idleAmp < 0.01) {
        hz.style.opacity = CUR.haze;
        tg.fill(0);
        hz.setAttribute('cx', 40);
        hz.setAttribute('cy', 40);
    }
    for (let i = 0; i < N; i++) {
        sg[i] += (tg[i] - sg[i]) * 0.15;
        segs[i].style.opacity = sg[i];
    }

    // Dust particles
    for (let i = 0; i < CONFIG.press.dustMax; i++) {
        const p = dustParticles[i];
        const el = dustEls[i];
        if (!p.active) { el.style.opacity = 0; continue; }
        p.t += 0.008 + releaseCharge * 0.004;
        p.angle += p.drift;
        const progress = easeOutQuart(clamp01(p.t));
        const dist = CUR.coreR + progress * p.speed;
        const dx = Math.cos(p.angle) * dist;
        const dy = Math.sin(p.angle) * dist;
        const fadeIn  = clamp01(p.t / 0.08);
        const fadeOut = Math.max(0, 1 - easeOutQuart(Math.max(0, (p.t - 0.1) / 0.9)));
        const size = p.startR * (1 - progress * 0.5);
        el.setAttribute('cx', 40 + dx);
        el.setAttribute('cy', 40 + dy);
        el.setAttribute('r', size < 0.15 ? 0.15 : size);
        el.style.opacity = (fadeIn * fadeOut * 0.75).toFixed(2);
        if (p.t >= 1) p.active = false;
    }

}

// gsap.ticker — single batched render loop shared with every other GSAP animation
// on the page. Avoids a separate rAF cycle and lets GSAP coordinate writes for us.
// (The ticker calls animate with (time, deltaTime, frame, elapsed); extra args are ignored.)
gsap.ticker.add(animate);