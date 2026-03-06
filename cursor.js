gsap.registerPlugin(MorphSVGPlugin);

// ── Element refs ─────────────────────────────────────────────────────
const NS = 'http://www.w3.org/2000/svg';
const cursorEl = document.getElementById('customCursor');
const cursorSvg = document.getElementById('cursorSvg');
const oS = document.getElementById('outerShape');
const iS = document.getElementById('innerShape');
const dot = document.getElementById('centerDot');
const blurD = document.getElementById('blurDisc');
const sTop = document.getElementById('serifTop');
const sBot = document.getElementById('serifBot');
const hz = document.getElementById('outerHaze');
const pRipple = document.getElementById('pressRipple');
const pFlash = document.getElementById('pressFlash');
const outerGrad = document.getElementById('ringGrad');
const ringGroup = document.getElementById('ringGroup');
const jitterGroup = document.getElementById('jitterGroup');

// ── MorphSVG shape library ───────────────────────────────────────────
// All paths share the same 4-arc topology → no point-count mismatch.
const SHAPES = {
    outer: {
        default: 'M40,26 C47.732,26 54,32.268 54,40 C54,47.732 47.732,54 40,54 C32.268,54 26,47.732 26,40 C26,32.268 32.268,26 40,26 Z',
        text: 'M40,22 C40.276,22 40.5,30.059 40.5,40 C40.5,49.941 40.276,58 40,58 C39.724,58 39.5,49.941 39.5,40 C39.5,30.059 39.724,22 40,22 Z',
        button: 'M40,22 C49.941,22 58,30.059 58,40 C58,49.941 49.941,58 40,58 C30.059,58 22,49.941 22,40 C22,30.059 30.059,22 40,22 Z',
    },
    inner: {
        default: 'M40,31 C44.971,31 49,35.029 49,40 C49,44.971 44.971,49 40,49 C35.029,49 31,44.971 31,40 C31,35.029 35.029,31 40,31 Z',
        text: 'M40,39.9 C40.055,39.9 40.1,39.945 40.1,40 C40.1,40.055 40.055,40.1 40,40.1 C39.945,40.1 39.9,40.055 39.9,40 C39.9,39.945 39.945,39.9 40,39.9 Z',
        button: 'M40,28 C46.627,28 52,33.373 52,40 C52,46.627 46.627,52 40,52 C33.373,52 28,46.627 28,40 C28,33.373 33.373,28 40,28 Z',
    },
};

// ── Mode config (non-shape properties only) ──────────────────────────
const MODES = {
    default: { haze: 0, outerOp: 1, innerOp: 1, dotOp: 1, svgW: 80, svgH: 80, bR: 14, bO: 1, dotR: 1.5, serifOp: 0 },
    text: { haze: 0.15, outerOp: 1, innerOp: 0, dotOp: 0, svgW: 80, svgH: 80, bR: 1, bO: 0, dotR: 0, serifOp: 1 },
    button: { haze: 0.4, outerOp: 1, innerOp: 1, dotOp: 1, svgW: 100, svgH: 100, bR: 18, bO: 1, dotR: 2, serifOp: 0 },
};

// Proxy object GSAP tweens for smooth scalar transitions
const anim = { ...MODES.default };

// ── quickSetters ─────────────────────────────────────────────────────
const setLeft = gsap.quickSetter(cursorEl, 'left', 'px');
const setTop = gsap.quickSetter(cursorEl, 'top', 'px');

// ── State ────────────────────────────────────────────────────────────
let mode = 'default';
let mx = innerWidth / 2, my = innerHeight / 2, px = mx, py = my;
let pressed = false, holdDuration = 0, releaseCharge = 0;
const MAX_HOLD = 120; // frames ≈ 2 s at 60 fps

// Press spring — drives squeeze & brightness in the ticker
let pressVal = 0, pressVel = 0;

// Vibration — builds during hold
let vibrateAmp = 0, vibratePhase = 0;

// Idle breathing — kicks in after IDLE_FRAMES of stillness
let idleFrames = 0, idleAmp = 0, idleTargetAmp = 0, idlePhase = 0;
const IDLE_FRAMES = 300;

// Directional segments
const segOp = new Float32Array(6);
const segTg = new Float32Array(6);

// Rotating gradient angle
let gradAngle = 0;

// Active mode tween reference
let modeTween = null;

// ── Generate directional segment arcs ────────────────────────────────
const segPts = [
    [40, 26, 52.12, 32], [52.12, 32, 52.12, 48], [52.12, 48, 40, 54],
    [40, 54, 27.88, 48], [27.88, 48, 27.88, 32], [27.88, 32, 40, 26],
];
const segs = segPts.map(([x1, y1, x2, y2]) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', `M${x1} ${y1} A14 14 0 0 1 ${x2} ${y2}`);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'url(#segGrad)');
    p.setAttribute('stroke-width', '1');
    p.style.opacity = 0;
    document.getElementById('dirSegs').appendChild(p);
    return p;
});

// ── Generate dust circles ─────────────────────────────────────────────
const dustEls = Array.from({ length: 10 }, () => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', '40'); c.setAttribute('cy', '40'); c.setAttribute('r', '1');
    c.setAttribute('fill', 'rgba(160,175,255,0.7)');
    c.setAttribute('filter', 'url(#glow)');
    c.style.opacity = 0;
    document.getElementById('dustGroup').appendChild(c);
    return c;
});

// ── Mode switching ────────────────────────────────────────────────────
function switchMode(newMode) {
    if (mode === newMode) return;
    mode = newMode;
    if (modeTween) modeTween.kill();

    modeTween = gsap.timeline();

    // Scalar properties via proxy
    modeTween.to(anim, { duration: 0.45, ease: 'power3.out', ...MODES[newMode] }, 0);

    // Shape morph via MorphSVG
    modeTween.to(oS, {
        duration: 0.45, ease: 'power3.out',
        morphSVG: { shape: SHAPES.outer[newMode], type: 'rotational' },
    }, 0);
    modeTween.to(iS, {
        duration: 0.4, ease: 'power3.out',
        morphSVG: { shape: SHAPES.inner[newMode], type: 'rotational' },
    }, 0);

    // SVG canvas size
    gsap.to(cursorSvg, { duration: 0.3, ease: 'power2.out', width: MODES[newMode].svgW, height: MODES[newMode].svgH });
}

// ── Mouse ─────────────────────────────────────────────────────────────
/* document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    idleFrames = 0; idleTargetAmp = 0;
    cursorEl.style.display = 'none';
    const el = document.elementFromPoint(mx, my);
    cursorEl.style.display = '';
    const tag = el ? el.tagName : '';
    if (tag === 'P' || tag === 'H2') switchMode('text');
    else if (tag === 'BUTTON') switchMode('button');
    else switchMode('default');
}); */
document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    idleFrames = 0;
    idleTargetAmp = 0;

    cursorEl.style.display = 'none';
    const el = document.elementFromPoint(mx, my);
    cursorEl.style.display = '';

    // Find nearest ancestor (including itself) with data-cursor-type
    const cursorTarget = el?.closest('[data-cursor-type]');
    const cursorType = cursorTarget?.dataset.cursorType;

    if (cursorType === 'text') {
        switchMode('text');
    } else if (cursorType === 'button') {
        switchMode('button');
    } else {
        switchMode('default');
    }
});

// ── Press / Release ───────────────────────────────────────────────────
document.addEventListener('mousedown', () => {
    pressed = true;
    holdDuration = 0;
    // Flash in immediately on click
    gsap.fromTo(pFlash, { opacity: 0 }, { opacity: 0.35, duration: 0.08, ease: 'power2.out' });
});

document.addEventListener('mouseup', () => {
    releaseCharge = Math.min(holdDuration / MAX_HOLD + vibrateAmp * 0.4, 1);
    pressed = false;
    holdDuration = 0;

    // Ripple expands and fades — radius and duration scale with charge
    gsap.fromTo(pRipple,
        {
            attr: { r: 16 }, opacity: 0.5 + releaseCharge * 0.5,
            'stroke-width': 1.2 + releaseCharge * 1.8
        },
        {
            attr: { r: 14 + 14 + releaseCharge * 36 }, opacity: 0,
            'stroke-width': 0.3,
            duration: 0.55 + releaseCharge * 0.35, ease: 'power3.out'
        }
    );

    // Flash out
    gsap.to(pFlash, { opacity: 0, duration: 0.25, ease: 'power2.out' });

    if (releaseCharge > 0.3) emitDust(releaseCharge);
});

// ── Dust burst ────────────────────────────────────────────────────────
function emitDust(charge) {
    const count = charge > 0.7 ? 10 : Math.max(3, Math.floor(10 * charge));
    for (let i = 0; i < 10; i++) {
        const el = dustEls[i];
        if (i >= count) { gsap.set(el, { opacity: 0 }); continue; }
        const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.9;
        const speed = (20 + Math.random() * 25) * (0.5 + charge * 0.5);
        const startR = 0.3 + Math.random() * 0.4 + charge * 0.3;
        const dur = 0.7 + Math.random() * 0.4;
        gsap.timeline()
            .set(el, { attr: { cx: 40, cy: 40, r: startR }, opacity: 0 })
            .to(el, {
                attr: {
                    cx: 40 + Math.cos(angle) * speed,
                    cy: 40 + Math.sin(angle) * speed,
                    r: Math.max(0.15, startR * 0.5)
                },
                opacity: 0.75, duration: dur * 0.15, ease: 'power2.out'
            })
            .to(el, { opacity: 0, duration: dur * 0.85, ease: 'power2.in' }, '<+=0.05')
            .set(el, { attr: { cx: 40, cy: 40 } });
    }
}

// ── Ticker ────────────────────────────────────────────────────────────
// Spring constants for press squeeze
const PRESS_STIFF = 120, PRESS_DAMP = 18, DT = 1 / 60;

gsap.ticker.add(() => {
    // ── 1. Position ──
    setLeft(mx); setTop(my);

    // ── 2. Velocity ──
    const vx = mx - px, vy = my - py;
    const spd = Math.sqrt(vx * vx + vy * vy);
    px = mx; py = my;

    // ── 3. Idle breathing ──
    if (spd < 0.1) { idleFrames++; if (idleFrames >= IDLE_FRAMES) idleTargetAmp = 1; }
    else { idleFrames = 0; idleTargetAmp = 0; }
    idleAmp += (idleTargetAmp - idleAmp) * 0.02;
    idlePhase += 0.025;
    const sinV = Math.sin(idlePhase) * 0.5 + 0.5; // 0..1

    // ── 4. Press spring ──
    // Drives squeeze (scale), brightness boost, and flash opacity.
    const pressTarget = pressed ? 1 : 0;
    const acc = (pressTarget - pressVal) * PRESS_STIFF - pressVel * PRESS_DAMP;
    pressVel += acc * DT;
    pressVal += pressVel * DT;
    const sqz = Math.max(0, Math.min(1, pressVal)); // 0..1

    // ── 5. Hold charge & vibration ──
    if (pressed) holdDuration++;
    const holdNorm = Math.min(holdDuration / MAX_HOLD, 1);
    const holdEased = holdNorm * holdNorm * (3 - 2 * holdNorm); // smoothstep

    vibrateAmp += ((pressed ? holdNorm * holdNorm * holdNorm : 0) - vibrateAmp) * 0.025;
    vibratePhase += 0.06 + vibrateAmp * 0.04;

    const vib1 = Math.sin(vibratePhase);
    const vib2 = Math.sin(vibratePhase * 1.7 + 0.8);
    const vib3 = Math.sin(vibratePhase * 0.6 + 2.1);

    // Positional jitter (applied to jitterGroup)
    const vibJX = (vib1 * 0.5 + vib2 * 0.3) * vibrateAmp * 0.7;
    const vibJY = (vib2 * 0.5 - vib1 * 0.3) * vibrateAmp * 0.7;

    // Ring bulge: adds to scale of jitterGroup so MorphSVG shape + bulge coexist
    const vibBulge = (vib3 * 0.5 + vib1 * 0.3) * vibrateAmp * 0.04;

    // Brightness boost during squeeze and hold charge
    const squeezeBright = sqz * (0.25 + holdEased * 0.2) + (vib1 * 0.5 + 0.5) * vibrateAmp * 0.12;

    // ── 6. Rotate outer ring gradient ──
    gradAngle += 0.008;
    const gc = Math.cos(gradAngle) * 14, gs = Math.sin(gradAngle) * 14;
    outerGrad.setAttribute('x1', 40 - gc); outerGrad.setAttribute('y1', 40 - gs);
    outerGrad.setAttribute('x2', 40 + gc); outerGrad.setAttribute('y2', 40 + gs);

    // ── 7. ringGroup: press squeeze scale (spring-driven) ──
    // squeezeFactor < 1 during press, elastic overshoot handled by spring itself.
    const squeezeFactor = 1 - sqz * (0.15 + holdEased * 0.15);
    gsap.set(ringGroup, { scaleX: squeezeFactor, scaleY: squeezeFactor, svgOrigin: '40 40' });

    // ── 8. jitterGroup: vibration jitter + idle breath + ring bulge ──
    const jScale = 1 + sinV * 0.03 * idleAmp + vibBulge;
    gsap.set(jitterGroup, { x: vibJX, y: vibJY, scaleX: jScale, scaleY: jScale, svgOrigin: '40 40' });

    // ── 9. Stroke brightness (squeezeBright boosts stroke opacity on press) ──
    oS.setAttribute('stroke', `rgba(138,158,255,${Math.min(1, 0.22 + squeezeBright).toFixed(3)})`);
    iS.setAttribute('stroke', `rgba(138,158,255,${Math.min(1, 0.35 + squeezeBright).toFixed(3)})`);
    oS.style.opacity = anim.outerOp;
    iS.style.opacity = anim.innerOp;

    // ── 10. Flash pulse during hold charge ──
    if (pressed) {
        const flashOp = sqz * (0.3 + holdEased * 0.25);
        gsap.set(pFlash, { opacity: Math.max(gsap.getProperty(pFlash, 'opacity'), flashOp) });
    }

    // ── 11. Center dot ──
    const dotR = Math.max(0, anim.dotR * (1 + sqz * 0.8 + holdEased * 0.6) + vibrateAmp * (vib1 * 0.5 + 0.5) * 0.8);
    dot.setAttribute('cx', 40 + vibJX); dot.setAttribute('cy', 40 + vibJY);
    dot.setAttribute('r', dotR.toFixed(3));
    dot.style.opacity = anim.dotOp;

    // ── 12. Blur disc ──
    blurD.setAttribute('cx', 40 + vibJX); blurD.setAttribute('cy', 40 + vibJY);
    blurD.setAttribute('r', Math.max(0, anim.bR + sinV * 1.5 * idleAmp));
    blurD.style.opacity = anim.bO;

    // ── 13. Serifs (I-beam crossbars) ──
    // getBBox() ignores ancestor transforms so we can't use it when ringGroup/jitterGroup
    // are scaled. Instead we derive positions by applying both scale factors to the
    // known half-height of the text stem (18px from centre) ourselves.
    if (anim.serifOp > 0.01) {
        // Combined scale from ringGroup (squeeze) × jitterGroup (bulge/breath)
        const totalScale = squeezeFactor * jScale;
        // Text stem top/bottom are ±18 from centre in path coords (y=22 and y=58, centre=40)
        const halfH = 18 * totalScale;
        const cx = 40 + vibJX;
        const ty = 40 + vibJY - halfH;
        const by = 40 + vibJY + halfH;
        const sw = 4 + vibrateAmp * vib2 * 0.8;
        sTop.setAttribute('x1', cx - sw); sTop.setAttribute('x2', cx + sw);
        sTop.setAttribute('y1', ty); sTop.setAttribute('y2', ty);
        sBot.setAttribute('x1', cx - sw); sBot.setAttribute('x2', cx + sw);
        sBot.setAttribute('y1', by); sBot.setAttribute('y2', by);
    }
    sTop.style.opacity = anim.serifOp;
    sBot.style.opacity = anim.serifOp;

    // ── 14. Haze + directional segments ──
    if (spd > 0.5 && mode === 'default') {
        hz.style.opacity = Math.min(spd / 15, 0.5) * 0.35;
        const ai = Math.floor(((Math.atan2(-vy, -vx) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * 6) % 6;
        segTg.fill(0);
        segTg[ai] = Math.min(spd / 8, 1);
        segTg[(ai + 5) % 6] = Math.min(spd / 12, 0.5);
        segTg[(ai + 1) % 6] = Math.min(spd / 12, 0.5);
        hz.setAttribute('cx', 40 + (-vx / spd) * 2);
        hz.setAttribute('cy', 40 + (-vy / spd) * 2);
    } else {
        const hazeP = sinV * 0.12 * idleAmp;
        hz.style.opacity = Math.max(hazeP, anim.haze);
        segTg.fill(0);
        hz.setAttribute('cx', 40); hz.setAttribute('cy', 40);
    }
    for (let i = 0; i < 6; i++) {
        segOp[i] += (segTg[i] - segOp[i]) * 0.15;
        segs[i].style.opacity = segOp[i];
    }
});