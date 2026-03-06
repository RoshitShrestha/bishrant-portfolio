/* ─── GSAP utils ─────────────────────────────────────────────────────────── */
const { clamp, mapRange, interpolate } = gsap.utils;
const smoothstep = (lo, hi, v) => { const t = clamp(0,1,mapRange(lo,hi,0,1,v)); return t*t*(3-2*t); };
const lerp = (a, b, t) => interpolate(a, b, t);

/* ─── Themes ─────────────────────────────────────────────────────────────── */
const THEMES = {
  primary: {
    specularHues:[{r:50,g:55,b:70},{r:60,g:50,b:58},{r:45,g:55,b:65},{r:58,g:55,b:50},{r:48,g:58,b:60},{r:55,g:48,b:62}],
    rimHues:null, chromaticColor:null,
    bgGlowColor:'240,238,232', outerGlowColor:null,
    bgIntensity:1, diffuseIntensity:1, hazeIntensity:1,
    bodyIntensity:1, bodyDotScale:1,
    rimIntensity:1, rimFalloffPower:3.2, rimEdgeMinBoost:0, rimDetectionRange:0.45,
    chromaticIntensity:1, chromaticFalloff:3.5, chromaticEdgeWidth:2.5,
    surfaceIntensity:1, surfaceLineWidth:1, surfaceShadowBlur:5,
    outerGlowIntensity:1,
    rimWideAlphas:[0.25,0.10],   // merged rimOuter+rimMid: peak of the wide band
    rimInnerAlphas:[0.40,0.15],
    rimShadowEnabled:true,
    rimShadow:{inset:3,radius:5,falloff:2.5,minBoost:0.15,
               colors:[{r:8,g:8,b:14,a:0.25},{r:10,g:10,b:16,a:0.10},{r:14,g:14,b:20,a:0.00}]},
    hotspotEnabled:false, ambientGlowEnabled:false,
    hoverGlow:{
      hazeColor:'55,55,70', hazeAlpha:[0.020,0.009,0.004], hazeRadius:0.85,
      depthColor:'50,52,65', depthAlpha:[0.028,0.012,0.005], depthRadius:0.6,
    },
  },
  secondary: {
    specularHues:[{r:255,g:252,b:200},{r:255,g:248,b:180},{r:250,g:255,b:210},{r:255,g:245,b:170},{r:248,g:252,b:195},{r:255,g:250,b:185}],
    rimHues:[{r:255,g:255,b:235},{r:255,g:253,b:225},{r:255,g:255,b:232},{r:255,g:252,b:218},{r:255,g:255,b:230},{r:255,g:250,b:222}],
    chromaticColor:{r:255,g:250,b:190},
    bgGlowColor:'220,225,60', outerGlowColor:'230,235,80',
    bgIntensity:1.5, diffuseIntensity:2.5, hazeIntensity:2.5,
    bodyIntensity:3.5, bodyDotScale:0.7,
    rimIntensity:5, rimFalloffPower:1.8, rimEdgeMinBoost:0.3, rimDetectionRange:0.55,
    chromaticIntensity:4, chromaticFalloff:1.8, chromaticEdgeWidth:3.5,
    surfaceIntensity:2.5, surfaceLineWidth:2, surfaceShadowBlur:10,
    outerGlowIntensity:3,
    rimWideAlphas:[0.70,0.30],   // merged rimOuter+rimMid
    rimInnerAlphas:[0.90,0.40],
    rimShadowEnabled:true,
    rimShadow:{inset:4,radius:6,falloff:1.8,minBoost:0.25,
               colors:[{r:160,g:148,b:30,a:0.15},{r:170,g:158,b:40,a:0.06},{r:180,g:168,b:50,a:0.00}]},
    hotspotEnabled:true,
    hotspot:{coreRadius:16,coreAlpha:0.09,washRadius:7,washAlpha:0.045,
             streakWidth:8,streakHeight:4,streakAlpha:0.03,
             colors:[{r:255,g:252,b:215},{r:255,g:250,b:200},{r:255,g:248,b:180},{r:255,g:245,b:165},
                     {r:255,g:242,b:145},{r:252,g:245,b:170},{r:250,g:240,b:150}]},
    ambientGlowEnabled:true,
    ambientGlow:{color:'245,242,120',radius:0.7,coreAlpha:0.06,midAlpha:0.03,edgeAlpha:0.01},
    hoverGlow:{
      hazeColor:'55,55,70', hazeAlpha:[0.020,0.009,0.004], hazeRadius:0.85,
      depthColor:'50,52,65', depthAlpha:[0.028,0.012,0.005], depthRadius:0.6,
    },
  },
};

/* ─── Layer definitions  (9 passes, down from 15) ───────────────────────────
   Removed layers and where their visual weight was absorbed:
   · background  → merged into bgGlow pass (drawn first onto glow canvas)
   · outerGlow   → merged into bgGlow pass (drawn second, same scratch)
   · ambientGlow → merged into bgGlow pass (drawn third, same scratch)
   · diffuse     → kept, distinct blur separates it visually
   · hover       → hoverHaze + hoverDepth merged into one pass (both centre-anchored)
   · haze        → kept, only cursor-tracked layer on mainCtx
   · rimShadow   → kept, pill-clipped dark inner shadow
   · body+surface→ surface drawn inline after body dots, single scratch+stamp
   · rimWide     → rimOuter + rimMid merged (same _drawRimLayer call, combined alphas)
   · rimInner    → kept (blur 2px vs 5-8px reads very differently)
   · chromatic   → kept (600-point perimeter pass, unique look)
   · hotspot     → kept (secondary only, three sub-gradients)
────────────────────────────────────────────────────────────────────────────── */
const LAYER = {
  // glow canvas layers  (all stamped onto c-glow-zone)
  bgGlow:    { blur: 50,   opacity: 0.55 }, // was: background(55,0.2) + outerGlow(40,0.5) + ambientGlow(25,0/1)
  diffuse:   { blur: 35,   opacity: 0.6  },
  hover:     { blur: 14,   opacity: 0.65 }, // was: hoverHaze(18,0.7) + hoverDepth(8,0.5)
  hotspot:   { blur: 20,   opacity: 1.0  },
  // main canvas layers  (all stamped onto c-main)
  haze:      { blur: 22,   opacity: 0.85 },
  rimShadow: { blur: 3,    opacity: 0.8  },
  body:      { blur: 6,    opacity: 0.85 }, // surface drawn inline before stamp
  rimWide:   { blur: 6,    opacity: 0.92 }, // was: rimOuter(8,0.9) + rimMid(5,0.85)
  rimInner:  { blur: 2,    opacity: 0.95 },
  chromatic: { blur: 1,    opacity: 1.0  },
};

// Per-theme overrides on top of LAYER defaults
const LAYER_OVERRIDES = {
  primary:   { rimShadow:{ blur:3, opacity:0.7 }, hover:{ blur:14, opacity:0.55 } },
  secondary: { body:{ blur:8, opacity:0.95 }, rimWide:{ blur:6, opacity:1 },
               rimInner:{ blur:2, opacity:1 }, chromatic:{ blur:0.5, opacity:1 },
               hotspot:{ blur:30, opacity:1 }, hover:{ blur:16, opacity:0.75 },
               bgGlow:{ blur:45, opacity:0.75 } },
};

/* ─── Constants ──────────────────────────────────────────────────────────── */
// GP = glow canvas bleed (single zone, replaces BP+GP)
const GP=180, PS=240, SN=100;

/* ─── Math helpers ───────────────────────────────────────────────────────── */
function seededRandom(n){n=Math.sin(n*127.1+311.7)*43758.5453;return n-Math.floor(n);}
function samplePalette(hues,angle){
  const n=hues.length,t=((angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
  const idx=(t/(Math.PI*2))*n,i=Math.floor(idx),f=idx-i;
  const a=hues[i%n],b=hues[(i+1)%n],sf=f*f*(3-2*f);
  return{r:Math.round(lerp(a.r,b.r,sf)),g:Math.round(lerp(a.g,b.g,sf)),b:Math.round(lerp(a.b,b.b,sf))};
}

/* ─── Pill geometry ──────────────────────────────────────────────────────── */
class PillGeometry {
  constructor(w,h){this.w=w;this.h=h;this.r=h/2;}
  sdf(px,py){const lc=this.r,rc=this.w-this.r,cy=this.h/2;if(px<lc)return this.r-Math.hypot(px-lc,py-cy);if(px>rc)return this.r-Math.hypot(px-rc,py-cy);return this.r-Math.abs(py-cy);}
  borderInfo(px,py){const lc=this.r,rc=this.w-this.r,cy=this.h/2;if(px<lc){const a=Math.atan2(py-cy,px-lc);return{bx:lc+Math.cos(a)*this.r,by:cy+Math.sin(a)*this.r,tx:-Math.sin(a),ty:Math.cos(a),angle:a};}if(px>rc){const a=Math.atan2(py-cy,px-rc);return{bx:rc+Math.cos(a)*this.r,by:cy+Math.sin(a)*this.r,tx:-Math.sin(a),ty:Math.cos(a),angle:a+Math.PI};}const s=py<cy?-1:1;return{bx:px,by:cy+s*this.r,tx:1,ty:0,angle:s>0?Math.PI/2:-Math.PI/2};}
  clip(ctx){ctx.beginPath();ctx.moveTo(this.r,0);ctx.lineTo(this.w-this.r,0);ctx.arc(this.w-this.r,this.r,this.r,-Math.PI/2,Math.PI/2);ctx.lineTo(this.r,this.h);ctx.arc(this.r,this.r,this.r,Math.PI/2,Math.PI*1.5);ctx.closePath();}
  perimeterPoint(t){if(t<0.25){const tt=t/0.25;return{x:this.r+tt*(this.w-2*this.r),y:0,nx:0,ny:-1,angle:0};}if(t<0.5){const a=-Math.PI/2+((t-0.25)/0.25)*Math.PI;return{x:this.w-this.r+Math.cos(a)*this.r,y:this.r+Math.sin(a)*this.r,nx:Math.cos(a),ny:Math.sin(a),angle:a+Math.PI/2};}if(t<0.75){const tt=(t-0.5)/0.25;return{x:this.w-this.r-tt*(this.w-2*this.r),y:this.h,nx:0,ny:1,angle:Math.PI};}const a=Math.PI/2+((t-0.75)/0.25)*Math.PI;return{x:this.r+Math.cos(a)*this.r,y:this.r+Math.sin(a)*this.r,nx:Math.cos(a),ny:Math.sin(a),angle:a+Math.PI/2};}
}

/* ─── Scratch buffer ─────────────────────────────────────────────────────── */
class ScratchBuffer {
  constructor(){this.canvas=document.createElement('canvas');this.ctx=this.canvas.getContext('2d');}
  ensure(w,h,dpr){const pw=Math.ceil(w*dpr),ph=Math.ceil(h*dpr);if(this.canvas.width!==pw||this.canvas.height!==ph){this.canvas.width=pw;this.canvas.height=ph;}this.ctx.setTransform(dpr,0,0,dpr,0,0);this.ctx.clearRect(0,0,w,h);this.ctx.filter='none';return this.ctx;}
  stampTo(target,blur,opacity,dx,dy,w,h,dpr){if(opacity<0.003)return;target.save();target.filter=`blur(${blur}px)`;target.globalAlpha=opacity;target.drawImage(this.canvas,0,0,Math.ceil(w*dpr),Math.ceil(h*dpr),dx,dy,w,h);target.restore();}
}
// One scratch per size class — large for glow canvas, regular for main canvas
const scratch = new ScratchBuffer();
const scratchLarge = new ScratchBuffer();

/* ─── SpecularButton ─────────────────────────────────────────────────────── */
class SpecularButton {
  constructor(el, themeName) {
    this.el    = el;
    this.theme = THEMES[themeName];
    this.pill  = null;
    this.dpr   = 1;

    // Merge base layer defs with per-theme overrides
    const ov = LAYER_OVERRIDES[themeName] || {};
    this.L = {};
    for (const [k, v] of Object.entries(LAYER)) this.L[k] = { ...v, ...(ov[k] || {}) };

    // Two canvases: glow zone + main
    this.glowCanvas = el.querySelector('.c-glow-zone');
    this.mainCanvas = el.querySelector('.c-main');
    this.glowCtx    = this.glowCanvas.getContext('2d');
    this.mainCtx    = this.mainCanvas.getContext('2d');

    this.btnW = 0; this.btnH = 0; this.samples = [];

    // Cursor groups — plain objects written by gsap.quickTo each frame
    this.cursor = {
      fast:  { x:.5, y:.5, i:0 },
      slow:  { x:.5, y:.5, i:0 },
      haze:  { x:.5, y:.5, i:0 },
      diff:  { x:.5, y:.5, i:0 },
      rim:   { x:.5, y:.5, i:0 },
      chrom: { x:.5, y:.5, i:0 },
    };
    this.target = { x:.5, y:.5 };
    this._targetIntensity = 0;

    // quickTo setters — duration derived from original lerp speeds (1/speed/60)
    const qt = (obj, prop, dur) => gsap.quickTo(obj, prop, { duration: dur, ease: 'none' });
    this._qt = {
      fast:  { x: qt(this.cursor.fast,  'x', 0.093), y: qt(this.cursor.fast,  'y', 0.093), i: qt(this.cursor.fast,  'i', 0.238) },
      slow:  { x: qt(this.cursor.slow,  'x', 0.556), y: qt(this.cursor.slow,  'y', 0.556), i: qt(this.cursor.slow,  'i', 0.417) },
      haze:  { x: qt(this.cursor.haze,  'x', 0.370), y: qt(this.cursor.haze,  'y', 0.370), i: qt(this.cursor.haze,  'i', 0.333) },
      diff:  { x: qt(this.cursor.diff,  'x', 0.278), y: qt(this.cursor.diff,  'y', 0.278), i: qt(this.cursor.diff,  'i', 0.303) },
      rim:   { x: qt(this.cursor.rim,   'x', 0.185), y: qt(this.cursor.rim,   'y', 0.185), i: qt(this.cursor.rim,   'i', 0.208) },
      chrom: { x: qt(this.cursor.chrom, 'x', 0.238), y: qt(this.cursor.chrom, 'y', 0.238), i: qt(this.cursor.chrom, 'i', 0.256) },
    };

    // quickSetters for the 3-D tilt
    this._setRotX = gsap.quickSetter(el, 'rotationX', 'deg');
    this._setRotY = gsap.quickSetter(el, 'rotationY', 'deg');
    gsap.set(el, { perspective: 600 });

    this._tickFn = () => this._onTick();
    this._tickerActive = false;
    this._mapX = null;
    this._mapY = null;

    this._onEnter = this._handleEnter.bind(this);
    this._onMove  = this._handleMove.bind(this);
    this._onLeave = this._handleLeave.bind(this);
    el.addEventListener('mouseenter', this._onEnter);
    el.addEventListener('mousemove',  this._onMove);
    el.addEventListener('mouseleave', this._onLeave);
    this.resize();
  }

  destroy() {
    this.el.removeEventListener('mouseenter', this._onEnter);
    this.el.removeEventListener('mousemove',  this._onMove);
    this.el.removeEventListener('mouseleave', this._onLeave);
    this._stopTicker();
  }

  _startTicker() { if (!this._tickerActive) { gsap.ticker.add(this._tickFn); this._tickerActive = true; } }
  _stopTicker()  { if ( this._tickerActive) { gsap.ticker.remove(this._tickFn); this._tickerActive = false; } }

  _onTick() {
    const c = this.cursor.fast;
    this._setRotX(mapRange(0,1, 5,-5, c.y));
    this._setRotY(mapRange(0,1,-5, 5, c.x));
    this._drawAll();
    const settled = Object.values(this.cursor).every(g => Math.abs(g.i - this._targetIntensity) < 0.001);
    if (settled) { this._stopTicker(); if (this._targetIntensity === 0) this._drawAll(); }
  }

  _normalise(e) {
    return { x: clamp(0,1,this._mapX(e.clientX)), y: clamp(0,1,this._mapY(e.clientY)) };
  }
  _handleEnter(e) {
    // Refresh rect mappers so scroll position is accounted for
    const rect = this.el.getBoundingClientRect();
    this._mapX = mapRange(rect.left, rect.right,  0, 1);
    this._mapY = mapRange(rect.top,  rect.bottom, 0, 1);
    const { x, y } = this._normalise(e);
    for (const g of Object.values(this.cursor)) { g.x = x; g.y = y; }
    this._pointerTo(x, y, 1);
  }
  _handleMove(e)  { const { x, y } = this._normalise(e); this._pointerTo(x, y, 1); }
  _handleLeave()  { this._pointerTo(this.target.x, this.target.y, 0); }

  _pointerTo(x, y, intensity) {
    this.target.x = x; this.target.y = y; this._targetIntensity = intensity;
    for (const g of Object.values(this._qt)) { g.x(x); g.y(y); g.i(intensity); }
    this._startTicker();
  }

  resize() {
    this.dpr = devicePixelRatio || 1;
    const rect = this.el.getBoundingClientRect();
    this.btnW = rect.width; this.btnH = rect.height;
    this.pill = new PillGeometry(this.btnW, this.btnH);
    this._mapX = mapRange(rect.left, rect.right,  0, 1);
    this._mapY = mapRange(rect.top,  rect.bottom, 0, 1);
    const s = (c, w, h) => { c.width=Math.ceil(w*this.dpr); c.height=Math.ceil(h*this.dpr); c.getContext('2d').setTransform(this.dpr,0,0,this.dpr,0,0); };
    s(this.glowCanvas, this.btnW + GP, this.btnH + GP);
    s(this.mainCanvas, this.btnW,      this.btnH);
    this._generateSamples();
  }

  _generateSamples() {
    this.samples = [];
    const g = Math.PI*(3-Math.sqrt(5));
    for (let i = 0; i < SN; i++) {
      const t = (i+.5)/SN;
      this.samples.push({
        radius:   clamp(0,1, Math.sqrt(t)+(0.5-seededRandom(i*13))*0.04),
        angle:    i*g+(0.5-seededRandom(i*7+3))*0.3,
        sizeMul:  lerp(.75, 1.3, seededRandom(i*17+5)),
        alphaMul: lerp(.7,  1.3, seededRandom(i*23+11)),
      });
    }
  }

  specularColor(a)  { return samplePalette(this.theme.specularHues, a); }
  rimColor(a)       { return samplePalette(this.theme.rimHues || this.theme.specularHues, a); }
  chromaticColor(a) {
    if (this.theme.chromaticColor) return this.theme.chromaticColor;
    const t=((a%(Math.PI*2))+Math.PI*2)%(Math.PI*2),n=t/(Math.PI*2);
    return{r:Math.round(lerp(255,255,n)),g:Math.round(lerp(240,200,n)),b:Math.round(lerp(200,150,n))};
  }

  /* ══════════════════════════════════════════════════════════════════════════
     DRAW PIPELINE  —  9 passes
     ══════════════════════════════════════════════════════════════════════════

     GLOW CANVAS (c-glow-zone, bleed = GP = 180px)
       1. bgGlow    — background radial + outerGlow sectors + ambientGlow (merged)
       2. diffuse   — coloured 8-sector halo
       3. hover     — hoverHaze + hoverDepth centre glows (merged)
       4. hotspot   — secondary only

     MAIN CANVAS (c-main, exact button size)
       5. haze      — wide blurred interior haze
       6. rimShadow — pill-clipped dark inner shadow
       7. body      — 100 specular dots + surface stroke (merged)
       8. rimWide   — rimOuter + rimMid perimeter band (merged)
       9. rimInner  — crisp inner rim line
      10. chromatic — 600-point perimeter chromatic fringe (kept separate: unique)

     Note: chromatic is still a distinct pass because its 600-point geometry
     and near-zero blur (0.5–1.5px) produces a qualitatively different result
     from the 240-point rim passes and cannot be blended without losing the
     crisp iridescent fringe.
  ══════════════════════════════════════════════════════════════════════════ */
  _drawAll() {
    const w=this.btnW, h=this.btnH, gw=w+GP, gh=h+GP;
    this.glowCtx.clearRect(0,0,gw,gh);
    this.mainCtx.clearRect(0,0,w,h);

    // ── 1. bgGlow  (background + outerGlow + ambientGlow merged) ─────────
    this._drawBgGlow(gw, gh);
    this._stamp(scratchLarge, this.glowCtx, 'bgGlow', gw, gh, 0, 0);

    // ── 2. diffuse ────────────────────────────────────────────────────────
    this._drawDiffuse(w, h);
    this._stamp(scratch, this.glowCtx, 'diffuse', w, h, GP/2, GP/2);

    // ── 3. hover  (hoverHaze + hoverDepth merged) ─────────────────────────
    this._drawHover(gw, gh);
    this._stamp(scratchLarge, this.glowCtx, 'hover', gw, gh, 0, 0);

    // ── 4. hotspot (secondary only) ───────────────────────────────────────
    if (this.theme.hotspotEnabled) {
      this._drawHotspot(gw, gh);
      this._stamp(scratchLarge, this.glowCtx, 'hotspot', gw, gh, 0, 0);
    }

    // ── 5. haze ───────────────────────────────────────────────────────────
    this._drawHaze();
    this._stamp(scratch, this.mainCtx, 'haze', w, h, 0, 0);

    // ── 6. rimShadow ──────────────────────────────────────────────────────
    if (this.theme.rimShadowEnabled) {
      this._drawRimShadow();
      this._stamp(scratch, this.mainCtx, 'rimShadow', w, h, 0, 0);
    }

    // ── 7. body + surface (merged: surface stroke drawn inline before stamp)
    this._drawBodyAndSurface();
    this._stamp(scratch, this.mainCtx, 'body', w, h, 0, 0);

    // ── 8. rimWide (rimOuter + rimMid merged) ─────────────────────────────
    this._drawRimLayer(3.5, this.theme.rimWideAlphas);
    this._stamp(scratch, this.mainCtx, 'rimWide', w, h, 0, 0);

    // ── 9. rimInner ───────────────────────────────────────────────────────
    this._drawRimLayer(1.2, this.theme.rimInnerAlphas);
    this._stamp(scratch, this.mainCtx, 'rimInner', w, h, 0, 0);

    // ── 10. chromatic ─────────────────────────────────────────────────────
    this._drawChromatic();
    this._stamp(scratch, this.mainCtx, 'chromatic', w, h, 0, 0);
  }

  _stamp(buf, target, name, w, h, dx, dy) {
    const L = this.L[name];
    buf.stampTo(target, L.blur, L.opacity, dx, dy, w, h, this.dpr);
  }

  /* ── 1. bgGlow — merged: background radial + outerGlow sectors + ambientGlow
     All three were independently stamped onto the glow canvas with different
     blur values (55, 40, 25px). Now drawn sequentially onto one scratch canvas
     and stamped once at a unified blur of ~50px. The visual difference is
     imperceptible at these alpha levels (0.001–0.008 range throughout).       */
  _drawBgGlow(gw, gh) {
    const ctx = scratchLarge.ensure(gw, gh, this.dpr);
    const p = this.pill, hp = GP/2;

    // ── background radial (driven by slow cursor) ─────────────────────────
    const bgI = this.cursor.slow.i;
    if (bgI > 0.003) {
      const m = this.theme.bgIntensity, cr = this.theme.bgGlowColor;
      const px = hp + this.cursor.slow.x*p.w, py = hp + this.cursor.slow.y*p.h;
      const g = ctx.createRadialGradient(px,py,0, px,py, gw*0.7);
      g.addColorStop(0,   `rgba(${cr},${0.008*bgI*m})`);
      g.addColorStop(0.3, `rgba(${cr},${0.004*bgI*m})`);
      g.addColorStop(0.6, `rgba(${cr},${0.002*bgI*m})`);
      g.addColorStop(1,   `rgba(${cr},0)`);
      ctx.fillStyle = g; ctx.fillRect(0,0,gw,gh);
    }

    // ── outerGlow (solid colour or specular sectors, driven by slow cursor) ─
    const ogI = this.cursor.slow.i;
    if (ogI > 0.003) {
      const px = hp + this.cursor.slow.x*p.w, py = hp + this.cursor.slow.y*p.h;
      if (this.theme.outerGlowColor) {
        const cr = this.theme.outerGlowColor, m = this.theme.outerGlowIntensity;
        const g = ctx.createRadialGradient(px,py,0, px,py, gw*0.6);
        g.addColorStop(0,   `rgba(${cr},${0.006*ogI*m})`);
        g.addColorStop(0.3, `rgba(${cr},${0.003*ogI*m})`);
        g.addColorStop(0.6, `rgba(${cr},${0.001*ogI*m})`);
        g.addColorStop(1,   `rgba(${cr},0)`);
        ctx.fillStyle = g; ctx.fillRect(0,0,gw,gh);
      } else {
        const ca = Math.atan2(this.cursor.slow.y-.5, this.cursor.slow.x-.5);
        for (let i=0; i<8; i++) {
          const a0=(i/8)*Math.PI*2, a1=((i+1)/8)*Math.PI*2, br=gw*0.6;
          const c = this.specularColor((a0+a1)/2+ca);
          const g = ctx.createRadialGradient(px,py,0, px,py, br);
          g.addColorStop(0,   `rgba(${c.r},${c.g},${c.b},${0.006*ogI})`);
          g.addColorStop(0.3, `rgba(${c.r},${c.g},${c.b},${0.003*ogI})`);
          g.addColorStop(0.6, `rgba(${c.r},${c.g},${c.b},${0.001*ogI})`);
          g.addColorStop(1,   `rgba(${c.r},${c.g},${c.b},0)`);
          ctx.beginPath(); ctx.moveTo(px,py);
          ctx.lineTo(px+Math.cos(a0)*br, py+Math.sin(a0)*br);
          ctx.lineTo(px+Math.cos(a1)*br, py+Math.sin(a1)*br);
          ctx.closePath(); ctx.fillStyle=g; ctx.fill();
        }
      }
    }

    // ── ambientGlow (secondary only, driven by fast cursor) ───────────────
    if (this.theme.ambientGlowEnabled) {
      const aI = this.cursor.fast.i;
      if (aI > 0.003) {
        const cfg = this.theme.ambientGlow;
        const px = hp + this.target.x*p.w, py = hp + this.target.y*p.h;
        const g = ctx.createRadialGradient(px,py,0, px,py, gw*cfg.radius);
        g.addColorStop(0,    `rgba(${cfg.color},${cfg.coreAlpha*aI})`);
        g.addColorStop(0.35, `rgba(${cfg.color},${cfg.midAlpha*aI})`);
        g.addColorStop(0.7,  `rgba(${cfg.color},${cfg.edgeAlpha*aI})`);
        g.addColorStop(1,    `rgba(${cfg.color},0)`);
        ctx.fillStyle = g; ctx.fillRect(0,0,gw,gh);
      }
    }
  }

  /* ── 2. diffuse — 8 specular sectors, slight bleed around button ──────── */
  _drawDiffuse(w, h) {
    const ctx = scratch.ensure(w, h, this.dpr);
    const p = this.pill, I = this.cursor.diff.i;
    if (I < 0.003) return;
    const m = this.theme.diffuseIntensity;
    const px = this.cursor.diff.x*p.w, py = this.cursor.diff.y*p.h;
    const ca = Math.atan2(this.cursor.diff.y-.5, this.cursor.diff.x-.5);
    for (let i=0; i<8; i++) {
      const a0=(i/8)*Math.PI*2, a1=((i+1)/8)*Math.PI*2, br=w*0.8;
      const c = this.specularColor((a0+a1)/2+ca+Math.PI*0.25);
      const g = ctx.createRadialGradient(px,py,0, px,py, br);
      g.addColorStop(0,    `rgba(${c.r},${c.g},${c.b},${0.004*I*m})`);
      g.addColorStop(0.25, `rgba(${c.r},${c.g},${c.b},${0.002*I*m})`);
      g.addColorStop(0.55, `rgba(${c.r},${c.g},${c.b},${0.001*I*m})`);
      g.addColorStop(1,    `rgba(${c.r},${c.g},${c.b},0)`);
      ctx.beginPath(); ctx.moveTo(px,py);
      ctx.lineTo(px+Math.cos(a0)*br, py+Math.sin(a0)*br);
      ctx.lineTo(px+Math.cos(a1)*br, py+Math.sin(a1)*br);
      ctx.closePath(); ctx.fillStyle=g; ctx.fill();
    }
  }

  /* ── 3. hover — hoverHaze (centre, slow) + hoverDepth (centre, fast) merged
     Both were centre-anchored radial gradients on the glow canvas with no
     cursor tracking, different only in radius and blur. Drawing them onto the
     same scratch canvas costs nothing and a single blur pass covers both.      */
  _drawHover(gw, gh) {
    const ctx = scratchLarge.ensure(gw, gh, this.dpr);
    const p = this.pill, hp = GP/2;
    const hg = this.theme.hoverGlow;
    if (!hg) return;
    const cx = hp + p.w/2, cy = hp + p.h/2;

    // haze portion (slow intensity)
    const hI = this.cursor.haze.i;
    if (hI > 0.003) {
      const g = ctx.createRadialGradient(cx,cy,0, cx,cy, gw*hg.hazeRadius);
      g.addColorStop(0,    `rgba(${hg.hazeColor},${hg.hazeAlpha[0]*hI})`);
      g.addColorStop(0.45, `rgba(${hg.hazeColor},${hg.hazeAlpha[1]*hI})`);
      g.addColorStop(1,    `rgba(${hg.hazeColor},${hg.hazeAlpha[2]*hI})`);
      ctx.fillStyle = g; ctx.fillRect(0,0,gw,gh);
    }

    // depth portion (fast intensity, tighter radius)
    const dI = this.cursor.fast.i;
    if (dI > 0.003) {
      const g = ctx.createRadialGradient(cx,cy,0, cx,cy, gw*hg.depthRadius);
      g.addColorStop(0,   `rgba(${hg.depthColor},${hg.depthAlpha[0]*dI})`);
      g.addColorStop(0.4, `rgba(${hg.depthColor},${hg.depthAlpha[1]*dI})`);
      g.addColorStop(1,   `rgba(${hg.depthColor},${hg.depthAlpha[2]*dI})`);
      ctx.fillStyle = g; ctx.fillRect(0,0,gw,gh);
    }
  }

  /* ── 5. haze — blurred interior glow, pill-clipped ─────────────────────── */
  _drawHaze() {
    const p=this.pill, ctx=scratch.ensure(p.w,p.h,this.dpr), I=this.cursor.haze.i;
    if (I<0.003) return;
    const m=this.theme.hazeIntensity, px=this.cursor.haze.x*p.w, py=this.cursor.haze.y*p.h;
    const ca=Math.atan2(py-p.h/2, px-p.w/2);
    ctx.save(); p.clip(ctx); ctx.clip();
    for (let i=0; i<12; i++) {
      const a0=(i/12)*Math.PI*2, a1=((i+1)/12)*Math.PI*2, br=p.w*0.7;
      const c=this.specularColor((a0+a1)/2+ca);
      const g=ctx.createRadialGradient(px,py,0, px,py, br);
      g.addColorStop(0,    `rgba(${c.r},${c.g},${c.b},${0.004*I*m})`);
      g.addColorStop(0.3,  `rgba(${c.r},${c.g},${c.b},${0.002*I*m})`);
      g.addColorStop(0.65, `rgba(${c.r},${c.g},${c.b},${0.0007*I*m})`);
      g.addColorStop(1,    `rgba(${c.r},${c.g},${c.b},0)`);
      ctx.beginPath(); ctx.moveTo(px,py);
      ctx.lineTo(px+Math.cos(a0)*br, py+Math.sin(a0)*br);
      ctx.lineTo(px+Math.cos(a1)*br, py+Math.sin(a1)*br);
      ctx.closePath(); ctx.fillStyle=g; ctx.fill();
    }
    ctx.restore();
  }

  /* ── 6. rimShadow — dark inner shadow along pill perimeter ─────────────── */
  _drawRimShadow() {
    const p=this.pill, ctx=scratch.ensure(p.w,p.h,this.dpr), I=this.cursor.rim.i;
    if (I<0.003) return;
    const cfg=this.theme.rimShadow, px=this.cursor.rim.x*p.w, py=this.cursor.rim.y*p.h;
    const edgeProx=1-clamp(0,1,Math.abs(p.sdf(px,py))/p.r);
    const edgeBoost=smoothstep(0.3,1,edgeProx);
    ctx.save(); p.clip(ctx); ctx.clip();
    for (let i=0; i<PS; i++) {
      const pt=p.perimeterPoint(i/PS);
      const ix=pt.x-pt.nx*cfg.inset, iy=pt.y-pt.ny*cfg.inset;
      const prox=1-clamp(0,1,Math.hypot(ix-px,iy-py)/(Math.hypot(p.w,p.h)*0.55));
      const cI=Math.pow(prox,cfg.falloff)*lerp(cfg.minBoost,1,edgeBoost)*I;
      if (cI<0.01) continue;
      const g=ctx.createRadialGradient(ix,iy,0,ix,iy,cfg.radius);
      cfg.colors.forEach((col,idx)=>g.addColorStop(idx/(cfg.colors.length-1),`rgba(${col.r},${col.g},${col.b},${col.a*cI})`));
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(ix,iy,cfg.radius,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  /* ── 7. body + surface merged ────────────────────────────────────────────
     Previously: body was drawn → stamped, then surface was drawn → stamped.
     Now surface's stroke (a single ctx.stroke() call) is appended to the
     same scratch canvas right after the body dots, before the single stamp.
     This works because both use the same cursor group (fast), same clip path,
     and the surface's max alpha (~0.10) blends cleanly over the body dots.    */
  _drawBodyAndSurface() {
    const p=this.pill, ctx=scratch.ensure(p.w,p.h,this.dpr), I=this.cursor.fast.i;
    if (I<0.003) return;
    const T=this.theme, px=this.cursor.fast.x*p.w, py=this.cursor.fast.y*p.h;
    const cn=clamp(0,1,p.sdf(px,py)/p.r), edge=smoothstep(0.65,0.05,cn);
    const ca=Math.atan2(py-p.h/2, px-p.w/2);

    ctx.save(); p.clip(ctx); ctx.clip();

    // ── body: base radial fill ─────────────────────────────────────────────
    const m=T.bodyIntensity, c0=this.specularColor(ca);
    const gb=ctx.createRadialGradient(px,py,0, px,py, p.w*0.5);
    gb.addColorStop(0,   `rgba(${c0.r},${c0.g},${c0.b},${0.03*I*m})`);
    gb.addColorStop(0.4, `rgba(${c0.r},${c0.g},${c0.b},${0.012*I*m})`);
    gb.addColorStop(1,   `rgba(${c0.r},${c0.g},${c0.b},0)`);
    ctx.fillStyle=gb; ctx.fillRect(0,0,p.w,p.h);

    // ── body: specular dot field (100 samples) ────────────────────────────
    const ms=lerp(p.r*.9,p.r*1.5,edge), ds=T.bodyDotScale;
    for (const sp of this.samples) {
      const sr=sp.radius*ms*.6, ax=px+Math.cos(sp.angle)*sr, ay=py+Math.sin(sp.angle)*sr;
      const b=p.borderInfo(lerp(ax,px,.5), lerp(ay,py,.5));
      const to=(sp.radius-.5)*2*ms, dt=lerp(.2,.95,sp.radius);
      const bxx=lerp(px,b.bx,dt)+b.tx*to, byy=lerp(py,b.by,dt)+b.ty*to;
      const dx=lerp(ax,bxx,edge), dy=lerp(ay,byy,edge);
      if (p.sdf(dx,dy)<-4) continue;
      const df=Math.hypot(dx-px,dy-py)/ms;
      const fall=Math.exp(-df*df*1.2);
      const bn=clamp(0,1,p.sdf(dx,dy)/p.r);
      const rb=edge*(1-smoothstep(0,.3,bn))*.35;
      const al=fall*(1+rb)*sp.alphaMul*I*0.04*m;
      if (al<0.003) continue;
      const da=Math.atan2(dy-py,dx-px), c=this.specularColor(da+ca);
      const dr=lerp(14,28,sp.radius)*sp.sizeMul*ds;
      const gr=ctx.createRadialGradient(dx,dy,0,dx,dy,dr);
      gr.addColorStop(0,    `rgba(${c.r},${c.g},${c.b},${al})`);
      gr.addColorStop(0.35, `rgba(${c.r},${c.g},${c.b},${al*.35})`);
      gr.addColorStop(1,    `rgba(${c.r},${c.g},${c.b},0)`);
      ctx.fillStyle=gr; ctx.fillRect(dx-dr-1,dy-dr-1,dr*2+2,dr*2+2);
    }

    // ── surface: stroke overlay — drawn inline, stamped together with body ─
    const sm=T.surfaceIntensity, sc=this.rimColor(ca);
    const ba=lerp(0.02,0.1,edge)*I*sm;
    const bg=ctx.createRadialGradient(px,py,0, px,py, p.w*0.4);
    bg.addColorStop(0,   `rgba(${sc.r},${sc.g},${sc.b},${ba})`);
    bg.addColorStop(0.4, `rgba(${sc.r},${sc.g},${sc.b},${ba*.3})`);
    bg.addColorStop(1,   `rgba(${sc.r},${sc.g},${sc.b},0)`);
    ctx.lineWidth=T.surfaceLineWidth; ctx.strokeStyle=bg;
    ctx.shadowColor=`rgba(${sc.r},${sc.g},${sc.b},${0.1*edge*I*sm})`;
    ctx.shadowBlur=T.surfaceShadowBlur;
    p.clip(ctx); ctx.stroke(); // re-clip to keep stroke inside pill

    ctx.restore();
  }

  /* ── 8 & 9. rimLayer — perimeter specular band at given width + alphas ─── */
  _drawRimLayer(w, alphas) {
    const p=this.pill, T=this.theme, ctx=scratch.ensure(p.w,p.h,this.dpr), I=this.cursor.rim.i;
    if (I<0.003) return;
    const px=this.cursor.rim.x*p.w, py=this.cursor.rim.y*p.h;
    const ca=Math.atan2(py-p.h/2, px-p.w/2);
    const edgeBoost=smoothstep(0.3,1,1-clamp(0,1,Math.abs(p.sdf(px,py))/p.r));
    const m=T.rimIntensity, pw=T.rimFalloffPower;
    const maxDist=Math.hypot(p.w,p.h)*T.rimDetectionRange;
    ctx.save(); p.clip(ctx); ctx.clip();
    for (let i=0; i<PS; i++) {
      const pt=p.perimeterPoint(i/PS);
      const prox=1-clamp(0,1,Math.hypot(pt.x-px,pt.y-py)/maxDist);
      const cI=Math.pow(prox,pw)*lerp(T.rimEdgeMinBoost,1,edgeBoost)*I;
      if (cI<0.01) continue;
      const c=this.rimColor(pt.angle+ca);
      const g=ctx.createRadialGradient(pt.x,pt.y,0, pt.x,pt.y, w);
      g.addColorStop(0,   `rgba(${c.r},${c.g},${c.b},${alphas[0]*cI*m})`);
      g.addColorStop(0.6, `rgba(${c.r},${c.g},${c.b},${alphas[1]*cI*m})`);
      g.addColorStop(1,   `rgba(${c.r},${c.g},${c.b},0)`);
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(pt.x,pt.y,w,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  /* ── 10. chromatic — iridescent fringe along perimeter ──────────────────── */
  _drawChromatic() {
    const p=this.pill, ctx=scratch.ensure(p.w,p.h,this.dpr), I=this.cursor.chrom.i;
    if (I<0.003) return;
    const T=this.theme, m=T.chromaticIntensity, pw=T.chromaticFalloff, ew=T.chromaticEdgeWidth;
    const px=this.cursor.chrom.x*p.w, py=this.cursor.chrom.y*p.h;
    const edgeBoost=smoothstep(0.3,1,1-clamp(0,1,Math.abs(p.sdf(px,py))/p.r));
    ctx.save(); p.clip(ctx); ctx.clip();
    for (const {off, a:alpha} of [{off:-.8,a:.35},{off:0,a:.45},{off:.8,a:.35}]) {
      for (let i=0; i<200; i++) {
        const pt=p.perimeterPoint(i/200);
        const ox=pt.x+pt.nx*off, oy=pt.y+pt.ny*off;
        const prox=1-clamp(0,1,Math.hypot(ox-px,oy-py)/(Math.hypot(p.w,p.h)*.45));
        const cI=Math.pow(prox,pw)*(0.25+0.75*edgeBoost)*I*alpha;
        if (cI<0.006) continue;
        const c=this.chromaticColor(pt.angle);
        const g=ctx.createRadialGradient(ox,oy,0,ox,oy,ew);
        g.addColorStop(0,   `rgba(${c.r},${c.g},${c.b},${0.25*cI*m})`);
        g.addColorStop(0.7, `rgba(${c.r},${c.g},${c.b},${0.10*cI*m})`);
        g.addColorStop(1,   `rgba(${c.r},${c.g},${c.b},0)`);
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(ox,oy,ew,0,Math.PI*2); ctx.fill();
      }
    }
    ctx.restore();
  }

  /* ── 4. hotspot (secondary only) — 3 sub-gradients: core, wash, streak ─── */
  _drawHotspot(gw, gh) {
    const ctx=scratchLarge.ensure(gw,gh,this.dpr);
    const p=this.pill, hp=GP/2, I=this.cursor.fast.i;
    if (I<0.003) return;
    const cfg=this.theme.hotspot, col=cfg.colors;
    const px=hp+this.target.x*p.w, py=hp+this.target.y*p.h;
    const colAt=(t)=>{const idx=t*(col.length-1),i=Math.floor(idx),f=idx-i,a=col[Math.min(i,col.length-1)],b=col[Math.min(i+1,col.length-1)];return{r:Math.round(lerp(a.r,b.r,f)),g:Math.round(lerp(a.g,b.g,f)),b:Math.round(lerp(a.b,b.b,f))};};
    const r1=p.r*cfg.coreRadius, g1=ctx.createRadialGradient(px,py,0,px,py,r1);
    for(let i=0;i<=16;i++){const t=i/16,c=colAt(t);g1.addColorStop(t,`rgba(${c.r},${c.g},${c.b},${cfg.coreAlpha*Math.exp(-t*t*4.5)*I})`);}
    ctx.fillStyle=g1; ctx.fillRect(0,0,gw,gh);
    const r2=gw*cfg.washRadius, g2=ctx.createRadialGradient(px,py,0,px,py,r2);
    for(let i=0;i<=18;i++){const t=i/18,c=colAt(t);g2.addColorStop(t,`rgba(${c.r},${c.g},${c.b},${cfg.washAlpha*Math.exp(-t*t*3.8)*I})`);}
    ctx.fillStyle=g2; ctx.fillRect(0,0,gw,gh);
    const sw=gw*cfg.streakWidth, sh=p.r*cfg.streakHeight;
    ctx.save(); ctx.translate(px,py); ctx.scale(sw/sh,1); ctx.translate(-px,-py);
    const g3=ctx.createRadialGradient(px,py,0,px,py,sh);
    for(let i=0;i<=14;i++){const t=i/14,c=colAt(t);g3.addColorStop(t,`rgba(${c.r},${c.g},${c.b},${cfg.streakAlpha*Math.exp(-t*t*4.0)*I})`);}
    ctx.fillStyle=g3; ctx.fillRect(px-sw,py-sh,sw*2,sh*2); ctx.restore();
  }
}

/* ─── Auto-init ──────────────────────────────────────────────────────────── */
function initSpecularButtons(root = document) {
  const instances = [];
  root.querySelectorAll('[data-specular-btn]').forEach(el => {
    const variant   = el.getAttribute('data-specular-btn');
    const themeSwap = { primary: 'secondary', secondary: 'primary' };
    const themeName = themeSwap[variant] || 'primary';

    if (!el.querySelector('.c-glow-zone')) {
      el.insertAdjacentHTML('afterbegin',
        `<canvas class="c-glow-zone"></canvas><canvas class="c-main"></canvas>`
      );
    }

    el.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        const span = document.createElement('span');
        span.className = 'spec-btn__label';
        span.textContent = node.textContent;
        node.replaceWith(span);
      }
    });
    if (!el.querySelector('.spec-btn__label')) {
      const existing = [...el.childNodes].find(n =>
        n.nodeType === Node.ELEMENT_NODE &&
        !n.classList.contains('c-glow-zone') &&
        !n.classList.contains('c-main')
      );
      if (existing) existing.classList.add('spec-btn__label');
    }

    instances.push(new SpecularButton(el, themeName));
  });

  window.addEventListener('resize', () => instances.forEach(i => i.resize()));
  return instances;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initSpecularButtons());
} else {
  initSpecularButtons();
}