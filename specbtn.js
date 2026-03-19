document.addEventListener('DOMContentLoaded', () => {
const THEMES = {
    dark: {
      specularHues:[{r:245,g:246,b:248},{r:235,g:238,b:242},{r:250,g:250,b:252},{r:232,g:234,b:238},{r:242,g:244,b:247},{r:228,g:230,b:235}],
      rimHues:[{r:250,g:251,b:252},{r:242,g:244,b:246},{r:255,g:255,b:255},{r:238,g:240,b:243},{r:246,g:247,b:248},{r:236,g:238,b:240}],
      chromaticColor:{r:235,g:238,b:242},
      bgGlowColor:'210,214,222', outerGlowColor:'195,200,210',
      bgIntensity:0.25, diffuseIntensity:0.45, hazeIntensity:0.42,
      bodyIntensity:0.8, bodyDotScale:0.95,
      rimIntensity:0.7, rimFalloffPower:2.6, rimEdgeMinBoost:0.055, rimDetectionRange:0.48,
      chromaticIntensity:0.3, chromaticFalloff:2.8, chromaticEdgeWidth:2.0,
      surfaceIntensity:0.38, surfaceLineWidth:0.9, surfaceShadowBlur:4,
      outerGlowIntensity:0.3,
      rimOuterAlphas:[0.06,0.022], rimMidAlphas:[0.085,0.032], rimInnerAlphas:[0.12,0.045],
      rimShadowEnabled:true,
      rimShadow:{inset:3,radius:5,falloff:2.0,minBoost:0.20,colors:[{r:80,g:20,b:15,a:0.20},{r:90,g:25,b:20,a:0.08},{r:100,g:30,b:25,a:0.00}]},
      hotspotEnabled:false, ambientGlowEnabled:false,
      hoverGlow:{hazeColor:'195,200,210',hazeAlpha:[0.005,0.0022,0.0010],hazeRadius:0.85,depthColor:'180,185,195',depthAlpha:[0.006,0.0026,0.0012],depthRadius:0.6},
    },
    yellow: {
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
      rimOuterAlphas:[0.50,0.20], rimMidAlphas:[0.70,0.30], rimInnerAlphas:[0.90,0.40],
      rimShadowEnabled:true,
      rimShadow:{inset:4,radius:6,falloff:1.8,minBoost:0.25,colors:[{r:160,g:148,b:30,a:0.15},{r:170,g:158,b:40,a:0.06},{r:180,g:168,b:50,a:0.00}]},
      hotspotEnabled:true,
      hotspot:{coreRadius:16,coreAlpha:0.09,washRadius:7,washAlpha:0.045,streakWidth:8,streakHeight:4,streakAlpha:0.03,
        colors:[{r:255,g:252,b:215},{r:255,g:250,b:200},{r:255,g:248,b:180},{r:255,g:245,b:165},{r:255,g:242,b:145},{r:252,g:245,b:170},{r:250,g:240,b:150}]},
      ambientGlowEnabled:true,
      ambientGlow:{color:'245,242,120',radius:0.7,coreAlpha:0.06,midAlpha:0.03,edgeAlpha:0.01},
    },
  };
  
  /* ==========================================================================
     MATH
     ========================================================================== */
  const lerp=(a,b,t)=>a+(b-a)*t;
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const smoothstep=(lo,hi,v)=>{const t=clamp((v-lo)/(hi-lo),0,1);return t*t*(3-2*t);};
  function seededRandom(n){n=Math.sin(n*127.1+311.7)*43758.5453;return n-Math.floor(n);}
  function samplePalette(hues,angle){
    const n=hues.length,t=((angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
    const idx=(t/(Math.PI*2))*n,i=Math.floor(idx),f=idx-i;
    const a=hues[i%n],b=hues[(i+1)%n],sf=f*f*(3-2*f);
    return{r:Math.round(lerp(a.r,b.r,sf)),g:Math.round(lerp(a.g,b.g,sf)),b:Math.round(lerp(a.b,b.b,sf))};
  }
  
  const allInstances = [];
  
  /* ==========================================================================
     PILL GEOMETRY
     ========================================================================== */
  class PillGeometry {
    constructor(w,h){this.w=w;this.h=h;this.r=h/2;}
    sdf(px,py){const lc=this.r,rc=this.w-this.r,cy=this.h/2;if(px<lc)return this.r-Math.hypot(px-lc,py-cy);if(px>rc)return this.r-Math.hypot(px-rc,py-cy);return this.r-Math.abs(py-cy);}
    borderInfo(px,py){const lc=this.r,rc=this.w-this.r,cy=this.h/2;if(px<lc){const a=Math.atan2(py-cy,px-lc);return{bx:lc+Math.cos(a)*this.r,by:cy+Math.sin(a)*this.r,tx:-Math.sin(a),ty:Math.cos(a),angle:a};}if(px>rc){const a=Math.atan2(py-cy,px-rc);return{bx:rc+Math.cos(a)*this.r,by:cy+Math.sin(a)*this.r,tx:-Math.sin(a),ty:Math.cos(a),angle:a+Math.PI};}const s=py<cy?-1:1;return{bx:px,by:cy+s*this.r,tx:1,ty:0,angle:s>0?Math.PI/2:-Math.PI/2};}
    clip(ctx){ctx.beginPath();ctx.moveTo(this.r,0);ctx.lineTo(this.w-this.r,0);ctx.arc(this.w-this.r,this.r,this.r,-Math.PI/2,Math.PI/2);ctx.lineTo(this.r,this.h);ctx.arc(this.r,this.r,this.r,Math.PI/2,Math.PI*1.5);ctx.closePath();}
    perimeterPoint(t){if(t<0.25){const tt=t/0.25;return{x:this.r+tt*(this.w-2*this.r),y:0,nx:0,ny:-1,angle:0};}if(t<0.5){const a=-Math.PI/2+((t-0.25)/0.25)*Math.PI;return{x:this.w-this.r+Math.cos(a)*this.r,y:this.r+Math.sin(a)*this.r,nx:Math.cos(a),ny:Math.sin(a),angle:a+Math.PI/2};}if(t<0.75){const tt=(t-0.5)/0.25;return{x:this.w-this.r-tt*(this.w-2*this.r),y:this.h,nx:0,ny:1,angle:Math.PI};}const a=Math.PI/2+((t-0.75)/0.25)*Math.PI;return{x:this.r+Math.cos(a)*this.r,y:this.r+Math.sin(a)*this.r,nx:Math.cos(a),ny:Math.sin(a),angle:a+Math.PI/2};}
  }
  
  /* ==========================================================================
     SCRATCH BUFFER
     ========================================================================== */
  class ScratchBuffer {
    constructor(){this.canvas=document.createElement('canvas');this.ctx=this.canvas.getContext('2d');}
    ensure(w,h,dpr){const pw=Math.ceil(w*dpr),ph=Math.ceil(h*dpr);if(this.canvas.width!==pw||this.canvas.height!==ph){this.canvas.width=pw;this.canvas.height=ph;}this.ctx.setTransform(dpr,0,0,dpr,0,0);this.ctx.clearRect(0,0,w,h);this.ctx.filter='none';return this.ctx;}
    stampTo(target,blur,opacity,dx,dy,w,h,dpr){if(opacity<0.003)return;target.save();target.filter=`blur(${blur}px)`;target.globalAlpha=opacity;target.drawImage(this.canvas,0,0,Math.ceil(w*dpr),Math.ceil(h*dpr),dx,dy,w,h);target.restore();}
  }
  const scratch=new ScratchBuffer(), scratchLarge=new ScratchBuffer();
  
  /* ==========================================================================
     LAYER DEFS
     ========================================================================== */
  const LAYER_DEFS={background:{blur:55,opacity:0.2},outerGlow:{blur:40,opacity:0.5},ambientGlow:{blur:25,opacity:0},diffuse:{blur:35,opacity:0.6},hoverHaze:{blur:18,opacity:0.7},hoverDepth:{blur:8,opacity:0.5},haze:{blur:22,opacity:0.85},rimShadow:{blur:4,opacity:0},body:{blur:6,opacity:0.8},rimOuter:{blur:8,opacity:0.9},rimMid:{blur:5,opacity:0.85},rimInner:{blur:2,opacity:0.95},surface:{blur:1,opacity:1},chromatic:{blur:1.5,opacity:1},hotspot:{blur:2,opacity:1}};
  const THEME_LAYER_OVERRIDES={dark:{rimShadow:{blur:3,opacity:0.7},hoverHaze:{blur:18,opacity:0.6},hoverDepth:{blur:8,opacity:0.4}},yellow:{body:{blur:8,opacity:0.95},rimShadow:{blur:3,opacity:0.9},rimOuter:{blur:8,opacity:1},rimMid:{blur:5,opacity:1},rimInner:{blur:2,opacity:1},chromatic:{blur:0.5,opacity:1},surface:{blur:0.5,opacity:1},hotspot:{blur:30,opacity:1},hoverHaze:{blur:20,opacity:0.8},hoverDepth:{blur:10,opacity:0.6},ambientGlow:{blur:28,opacity:1}}};
  const BP=180,GP=120,AP=80,DP=20,HHP=12,HDP=6,HP=120,PS=240,SN=100;
  
  /* ==========================================================================
     SPECULAR BUTTON
     ========================================================================== */
  class SpecularButton {
    constructor(el,themeName){
      this.el=el;this.themeName=themeName;this.theme=THEMES[themeName];this.pill=null;this.dpr=1;
      const ov=THEME_LAYER_OVERRIDES[themeName]||{};
      this.layers={};for(const[k,v]of Object.entries(LAYER_DEFS))this.layers[k]={...v,...(ov[k]||{})};
      this.bgCanvas=el.querySelector('.c-bg-zone');this.glowCanvas=el.querySelector('.c-glow-zone');this.mainCanvas=el.querySelector('.c-main');
      this.bgCtx=this.bgCanvas.getContext('2d');this.glowCtx=this.glowCanvas.getContext('2d');this.mainCtx=this.mainCanvas.getContext('2d');
      this.btnW=0;this.btnH=0;
      this.target={x:0.5,y:0.5,intensity:0};
      this.cursor={fast:{x:0.5,y:0.5,i:0},slow:{x:0.5,y:0.5,i:0},haze:{x:0.5,y:0.5,i:0},diff:{x:0.5,y:0.5,i:0},bg:{x:0.5,y:0.5,i:0},rim:{x:0.5,y:0.5,i:0},chrom:{x:0.5,y:0.5,i:0}};
  
      // Durations derived from original lerp factors (95% convergence time)
      const dur={fast:{p:0.25,i:0.7},slow:{p:1.6,i:1.2},haze:{p:1.1,i:1.0},diff:{p:0.8,i:0.9},bg:{p:2.5,i:1.6},rim:{p:0.55,i:0.6},chrom:{p:0.7,i:0.75}};
      this.qFns={};
      for(const[k,g]of Object.entries(this.cursor)){
        const d=dur[k];
        this.qFns[k]={
          x:gsap.quickTo(g,'x',{duration:d.p,ease:'power3'}),
          y:gsap.quickTo(g,'y',{duration:d.p,ease:'power3'}),
          i:gsap.quickTo(g,'i',{duration:d.i,ease:'power3'})
        };
      }
      this._tilt={rx:0,ry:0};
      this._qRx=gsap.quickTo(this._tilt,'rx',{duration:0.2,ease:'power2'});
      this._qRy=gsap.quickTo(this._tilt,'ry',{duration:0.2,ease:'power2'});
  
      this.active=false;this.samples=[];
      this._onEnter=this._handleEnter.bind(this);this._onMove=this._handleMove.bind(this);this._onLeave=this._handleLeave.bind(this);
      this.el.addEventListener('mouseenter',this._onEnter);this.el.addEventListener('mousemove',this._onMove);this.el.addEventListener('mouseleave',this._onLeave);
      this.resize();
    }
    destroy(){this.el.removeEventListener('mouseenter',this._onEnter);this.el.removeEventListener('mousemove',this._onMove);this.el.removeEventListener('mouseleave',this._onLeave);for(const g of Object.values(this.cursor))gsap.killTweensOf(g);gsap.killTweensOf(this._tilt);this.active=false;}
    specularColor(a){return samplePalette(this.theme.specularHues,a);}
    rimColor(a){return samplePalette(this.theme.rimHues||this.theme.specularHues,a);}
    chromaticColor(a){if(this.theme.chromaticColor)return this.theme.chromaticColor;const t=((a%(Math.PI*2))+Math.PI*2)%(Math.PI*2),n=t/(Math.PI*2);return{r:Math.round(lerp(255,255,n)),g:Math.round(lerp(240,200,n)),b:Math.round(lerp(200,150,n))};}
  
    _handleEnter(e){
      const r=this.el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
      // Snap all cursor groups to entry position so quickTo tweens start from here
      for(const g of Object.values(this.cursor)){g.x=x;g.y=y;}
      this.target.x=x;this.target.y=y;this.target.intensity=1;
      for(const fns of Object.values(this.qFns)){fns.x(x);fns.y(y);fns.i(1);}
      this._qRx((y-0.5)*-5);this._qRy((x-0.5)*5);
      this.active=true;
    }
    _handleMove(e){
      const r=this.el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
      this.target.x=x;this.target.y=y;this.target.intensity=1;
      for(const fns of Object.values(this.qFns)){fns.x(x);fns.y(y);fns.i(1);}
      this._qRx((y-0.5)*-5);this._qRy((x-0.5)*5);
      this.active=true;
    }
    _handleLeave(){
      this.target.intensity=0;
      for(const fns of Object.values(this.qFns))fns.i(0);
      this._qRx(0);this._qRy(0);
    }
  
    resize(){this.dpr=devicePixelRatio||1;const rect=this.el.getBoundingClientRect();this.btnW=rect.width;this.btnH=rect.height;this.pill=new PillGeometry(this.btnW,this.btnH);const s=(c,w,h)=>{c.width=Math.ceil(w*this.dpr);c.height=Math.ceil(h*this.dpr);c.getContext('2d').setTransform(this.dpr,0,0,this.dpr,0,0);};s(this.bgCanvas,this.btnW+BP,this.btnH+BP);s(this.glowCanvas,this.btnW+GP,this.btnH+GP);s(this.mainCanvas,this.btnW,this.btnH);this._generateSamples();}
    _generateSamples(){this.samples=[];const g=Math.PI*(3-Math.sqrt(5));for(let i=0;i<SN;i++){const t=(i+0.5)/SN;this.samples.push({radius:clamp(Math.sqrt(t)+(0.5-seededRandom(i*13))*0.04,0,1),angle:i*g+(0.5-seededRandom(i*7+3))*0.3,sizeMul:lerp(0.75,1.3,seededRandom(i*17+5)),alphaMul:lerp(0.7,1.3,seededRandom(i*23+11))});}}
  
    tick(){
      if(!this.active)return;
      this.el.style.transform=`perspective(1000px) rotateX(${this._tilt.rx}deg) rotateY(${this._tilt.ry}deg)`;
      this._drawAll();
      if(this.target.intensity===0){
        let maxI=0;for(const g of Object.values(this.cursor))maxI=Math.max(maxI,Math.abs(g.i));
        if(maxI<0.001){this.active=false;this._drawAll();}
      }
    }
  
    _drawAll(){
      const w=this.btnW,h=this.btnH,dpr=this.dpr,bgW=w+BP,bgH=h+BP,glW=w+GP,glH=h+GP;
      this.bgCtx.clearRect(0,0,bgW,bgH);this.glowCtx.clearRect(0,0,glW,glH);this.mainCtx.clearRect(0,0,w,h);
      this._drawBg(bgW,bgH);this._stamp(scratchLarge,this.bgCtx,'background',bgW,bgH,0,0);
      this._drawOuterGlow(glW,glH);this._stamp(scratchLarge,this.glowCtx,'outerGlow',glW,glH,0,0);
      if(this.theme.ambientGlowEnabled){const aw=w+AP,ah=h+AP;this._drawAmbientGlow(aw,ah);this._stamp(scratch,this.glowCtx,'ambientGlow',aw,ah,(GP-AP)/2,(GP-AP)/2);}
      const dw=w+DP,dh=h+DP;this._drawDiffuse(dw,dh);this._stamp(scratch,this.glowCtx,'diffuse',dw,dh,(GP-DP)/2,(GP-DP)/2);
      const hhW=w+HHP,hhH=h+HHP;this._drawHoverHaze(hhW,hhH);this._stamp(scratch,this.glowCtx,'hoverHaze',hhW,hhH,(GP-HHP)/2,(GP-HHP)/2);
      const hdW=w+HDP,hdH=h+HDP;this._drawHoverDepth(hdW,hdH);this._stamp(scratch,this.glowCtx,'hoverDepth',hdW,hdH,(GP-HDP)/2,(GP-HDP)/2);
      this._drawHaze();this._stamp(scratch,this.mainCtx,'haze',w,h,0,0);
      this._drawRimShadow();this._stamp(scratch,this.mainCtx,'rimShadow',w,h,0,0);
      this._drawBody();this._stamp(scratch,this.mainCtx,'body',w,h,0,0);
      this._drawRimLayer(3,this.theme.rimOuterAlphas);this._stamp(scratch,this.mainCtx,'rimOuter',w,h,0,0);
      this._drawRimLayer(2,this.theme.rimMidAlphas);this._stamp(scratch,this.mainCtx,'rimMid',w,h,0,0);
      this._drawRimLayer(1.2,this.theme.rimInnerAlphas);this._stamp(scratch,this.mainCtx,'rimInner',w,h,0,0);
      this._drawChromatic();this._stamp(scratch,this.mainCtx,'chromatic',w,h,0,0);
      this._drawSurface();this._stamp(scratch,this.mainCtx,'surface',w,h,0,0);
      if(this.theme.hotspotEnabled){const hw=w+HP,hh=h+HP;this._drawHotspot(hw,hh);this._stamp(scratchLarge,this.glowCtx,'hotspot',hw,hh,(GP-HP)/2,(GP-HP)/2);}
    }
    _stamp(buf,target,name,w,h,dx,dy){const L=this.layers[name];buf.stampTo(target,L.blur,L.opacity,dx,dy,w,h,this.dpr);}
  
    _drawBg(bw,bh){const ctx=scratchLarge.ensure(bw,bh,this.dpr);const p=this.pill,hp=BP/2,I=this.cursor.bg.i;if(I<0.003)return;const m=this.theme.bgIntensity,cr=this.theme.bgGlowColor,px=hp+this.cursor.bg.x*p.w,py=hp+this.cursor.bg.y*p.h;const g=ctx.createRadialGradient(px,py,0,px,py,bw*0.7);g.addColorStop(0,`rgba(${cr},${0.008*I*m})`);g.addColorStop(0.3,`rgba(${cr},${0.004*I*m})`);g.addColorStop(0.6,`rgba(${cr},${0.002*I*m})`);g.addColorStop(1,`rgba(${cr},0)`);ctx.fillStyle=g;ctx.fillRect(0,0,bw,bh);}
  
    _drawOuterGlow(ow,oh){const ctx=scratchLarge.ensure(ow,oh,this.dpr);const p=this.pill,hp=GP/2,I=this.cursor.slow.i;if(I<0.003)return;const px=hp+this.cursor.slow.x*p.w,py=hp+this.cursor.slow.y*p.h;if(this.theme.outerGlowColor){const cr=this.theme.outerGlowColor,m=this.theme.outerGlowIntensity;const g=ctx.createRadialGradient(px,py,0,px,py,ow*0.6);g.addColorStop(0,`rgba(${cr},${0.006*I*m})`);g.addColorStop(0.3,`rgba(${cr},${0.003*I*m})`);g.addColorStop(0.6,`rgba(${cr},${0.001*I*m})`);g.addColorStop(1,`rgba(${cr},0)`);ctx.fillStyle=g;ctx.fillRect(0,0,ow,oh);}else{const ca=Math.atan2(this.cursor.slow.y-0.5,this.cursor.slow.x-0.5);for(let i=0;i<8;i++){const a0=(i/8)*Math.PI*2,a1=((i+1)/8)*Math.PI*2,br=ow*0.6;const c=this.specularColor((a0+a1)/2+ca);const g=ctx.createRadialGradient(px,py,0,px,py,br);g.addColorStop(0,`rgba(${c.r},${c.g},${c.b},${0.006*I})`);g.addColorStop(0.3,`rgba(${c.r},${c.g},${c.b},${0.003*I})`);g.addColorStop(0.6,`rgba(${c.r},${c.g},${c.b},${0.001*I})`);g.addColorStop(1,`rgba(${c.r},${c.g},${c.b},0)`);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+Math.cos(a0)*br,py+Math.sin(a0)*br);ctx.lineTo(px+Math.cos(a1)*br,py+Math.sin(a1)*br);ctx.closePath();ctx.fillStyle=g;ctx.fill();}}}
  
    _drawAmbientGlow(aw,ah){const ctx=scratch.ensure(aw,ah,this.dpr);const p=this.pill,hp=AP/2,I=this.cursor.fast.i;if(I<0.003)return;const cfg=this.theme.ambientGlow,px=hp+this.target.x*p.w,py=hp+this.target.y*p.h,rad=aw*cfg.radius;const g=ctx.createRadialGradient(px,py,0,px,py,rad);g.addColorStop(0,`rgba(${cfg.color},${cfg.coreAlpha*I})`);g.addColorStop(0.35,`rgba(${cfg.color},${cfg.midAlpha*I})`);g.addColorStop(0.7,`rgba(${cfg.color},${cfg.edgeAlpha*I})`);g.addColorStop(1,`rgba(${cfg.color},0)`);ctx.fillStyle=g;ctx.fillRect(0,0,aw,ah);}
  
    _drawDiffuse(dw,dh){const ctx=scratch.ensure(dw,dh,this.dpr);const p=this.pill,hp=DP/2,I=this.cursor.diff.i;if(I<0.003)return;const m=this.theme.diffuseIntensity,px=hp+this.cursor.diff.x*p.w,py=hp+this.cursor.diff.y*p.h,ca=Math.atan2(this.cursor.diff.y-0.5,this.cursor.diff.x-0.5);for(let i=0;i<8;i++){const a0=(i/8)*Math.PI*2,a1=((i+1)/8)*Math.PI*2,br=dw*0.8;const c=this.specularColor((a0+a1)/2+ca+Math.PI*0.25);const g=ctx.createRadialGradient(px,py,0,px,py,br);g.addColorStop(0,`rgba(${c.r},${c.g},${c.b},${0.004*I*m})`);g.addColorStop(0.25,`rgba(${c.r},${c.g},${c.b},${0.002*I*m})`);g.addColorStop(0.55,`rgba(${c.r},${c.g},${c.b},${0.001*I*m})`);g.addColorStop(1,`rgba(${c.r},${c.g},${c.b},0)`);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+Math.cos(a0)*br,py+Math.sin(a0)*br);ctx.lineTo(px+Math.cos(a1)*br,py+Math.sin(a1)*br);ctx.closePath();ctx.fillStyle=g;ctx.fill();}}
  
    _drawHoverHaze(cw,ch){const ctx=scratch.ensure(cw,ch,this.dpr);const hg=this.theme.hoverGlow;if(!hg)return;const p=this.pill,hp=HHP/2,I=this.cursor.haze.i;if(I<0.003)return;const cx=hp+p.w/2,cy=hp+p.h/2,rad=cw*hg.hazeRadius;const g=ctx.createRadialGradient(cx,cy,0,cx,cy,rad);g.addColorStop(0,`rgba(${hg.hazeColor},${hg.hazeAlpha[0]*I})`);g.addColorStop(0.45,`rgba(${hg.hazeColor},${hg.hazeAlpha[1]*I})`);g.addColorStop(1,`rgba(${hg.hazeColor},${hg.hazeAlpha[2]*I})`);ctx.fillStyle=g;ctx.fillRect(0,0,cw,ch);}
  
    _drawHoverDepth(cw,ch){const ctx=scratch.ensure(cw,ch,this.dpr);const hg=this.theme.hoverGlow;if(!hg)return;const p=this.pill,hp=HDP/2,I=this.cursor.fast.i;if(I<0.003)return;const cx=hp+p.w/2,cy=hp+p.h/2,rad=cw*hg.depthRadius;const g=ctx.createRadialGradient(cx,cy,0,cx,cy,rad);g.addColorStop(0,`rgba(${hg.depthColor},${hg.depthAlpha[0]*I})`);g.addColorStop(0.4,`rgba(${hg.depthColor},${hg.depthAlpha[1]*I})`);g.addColorStop(1,`rgba(${hg.depthColor},${hg.depthAlpha[2]*I})`);ctx.fillStyle=g;ctx.fillRect(0,0,cw,ch);}
  
    _drawHaze(){const p=this.pill,ctx=scratch.ensure(p.w,p.h,this.dpr),I=this.cursor.haze.i;if(I<0.003)return;const m=this.theme.hazeIntensity,px=this.cursor.haze.x*p.w,py=this.cursor.haze.y*p.h,ca=Math.atan2(py-p.h/2,px-p.w/2);ctx.save();p.clip(ctx);ctx.clip();for(let i=0;i<12;i++){const a0=(i/12)*Math.PI*2,a1=((i+1)/12)*Math.PI*2,br=p.w*0.7;const c=this.specularColor((a0+a1)/2+ca);const g=ctx.createRadialGradient(px,py,0,px,py,br);g.addColorStop(0,`rgba(${c.r},${c.g},${c.b},${0.004*I*m})`);g.addColorStop(0.3,`rgba(${c.r},${c.g},${c.b},${0.002*I*m})`);g.addColorStop(0.65,`rgba(${c.r},${c.g},${c.b},${0.0007*I*m})`);g.addColorStop(1,`rgba(${c.r},${c.g},${c.b},0)`);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+Math.cos(a0)*br,py+Math.sin(a0)*br);ctx.lineTo(px+Math.cos(a1)*br,py+Math.sin(a1)*br);ctx.closePath();ctx.fillStyle=g;ctx.fill();}ctx.restore();}
  
    _drawBody(){const p=this.pill,ctx=scratch.ensure(p.w,p.h,this.dpr),I=this.cursor.fast.i;if(I<0.003)return;const m=this.theme.bodyIntensity,px=this.cursor.fast.x*p.w,py=this.cursor.fast.y*p.h,cn=clamp(p.sdf(px,py)/p.r,0,1),edge=smoothstep(0.65,0.05,cn),ca=Math.atan2(py-p.h/2,px-p.w/2);ctx.save();p.clip(ctx);ctx.clip();const c0=this.specularColor(ca),gb=ctx.createRadialGradient(px,py,0,px,py,p.w*0.5);gb.addColorStop(0,`rgba(${c0.r},${c0.g},${c0.b},${0.03*I*m})`);gb.addColorStop(0.4,`rgba(${c0.r},${c0.g},${c0.b},${0.012*I*m})`);gb.addColorStop(1,`rgba(${c0.r},${c0.g},${c0.b},0)`);ctx.fillStyle=gb;ctx.fillRect(0,0,p.w,p.h);const ms=lerp(p.r*0.9,p.r*1.5,edge),ds=this.theme.bodyDotScale;for(const sp of this.samples){const sr=sp.radius*ms*0.6,ax=px+Math.cos(sp.angle)*sr,ay=py+Math.sin(sp.angle)*sr,mx=lerp(ax,px,0.5),my=lerp(ay,py,0.5),b=p.borderInfo(mx,my),to=(sp.radius-0.5)*2*ms,dt=lerp(0.2,0.95,sp.radius),bxx=lerp(px,b.bx,dt)+b.tx*to,byy=lerp(py,b.by,dt)+b.ty*to,dx=lerp(ax,bxx,edge),dy=lerp(ay,byy,edge);if(p.sdf(dx,dy)<-4)continue;const df=Math.hypot(dx-px,dy-py)/ms,fall=Math.exp(-df*df*1.2),bn=clamp(p.sdf(dx,dy)/p.r,0,1),rb=edge*(1-smoothstep(0,0.3,bn))*0.35,al=fall*(1+rb)*sp.alphaMul*I*0.04*m;if(al<0.003)continue;const da=Math.atan2(dy-py,dx-px),c=this.specularColor(da+ca),dr=lerp(14,28,sp.radius)*sp.sizeMul*ds,gr=ctx.createRadialGradient(dx,dy,0,dx,dy,dr);gr.addColorStop(0,`rgba(${c.r},${c.g},${c.b},${al})`);gr.addColorStop(0.35,`rgba(${c.r},${c.g},${c.b},${al*0.35})`);gr.addColorStop(1,`rgba(${c.r},${c.g},${c.b},0)`);ctx.fillStyle=gr;ctx.fillRect(dx-dr-1,dy-dr-1,dr*2+2,dr*2+2);}ctx.restore();}
  
    _drawRimShadow(){if(!this.theme.rimShadowEnabled)return;const p=this.pill,ctx=scratch.ensure(p.w,p.h,this.dpr),I=this.cursor.rim.i;if(I<0.003)return;const cfg=this.theme.rimShadow,px=this.cursor.rim.x*p.w,py=this.cursor.rim.y*p.h,edgeProx=1-clamp(Math.abs(p.sdf(px,py))/p.r,0,1),edgeBoost=smoothstep(0.3,1,edgeProx);ctx.save();p.clip(ctx);ctx.clip();for(let i=0;i<PS;i++){const pt=p.perimeterPoint(i/PS),ix=pt.x-pt.nx*cfg.inset,iy=pt.y-pt.ny*cfg.inset,dist=Math.hypot(ix-px,iy-py),prox=1-clamp(dist/(Math.hypot(p.w,p.h)*0.55),0,1),ci=Math.pow(prox,cfg.falloff),cI=ci*lerp(cfg.minBoost,1,edgeBoost)*I;if(cI<0.01)continue;const g=ctx.createRadialGradient(ix,iy,0,ix,iy,cfg.radius);cfg.colors.forEach((col,idx)=>{g.addColorStop(idx/(cfg.colors.length-1),`rgba(${col.r},${col.g},${col.b},${col.a*cI})`);});ctx.fillStyle=g;ctx.beginPath();ctx.arc(ix,iy,cfg.radius,0,Math.PI*2);ctx.fill();}ctx.restore();}
  
    _drawRimLayer(w,alphas){const p=this.pill,T=this.theme,ctx=scratch.ensure(p.w,p.h,this.dpr),I=this.cursor.rim.i;if(I<0.003)return;const px=this.cursor.rim.x*p.w,py=this.cursor.rim.y*p.h,ca=Math.atan2(py-p.h/2,px-p.w/2),edgeBoost=smoothstep(0.3,1,1-clamp(Math.abs(p.sdf(px,py))/p.r,0,1)),m=T.rimIntensity,pw=T.rimFalloffPower,maxDist=Math.hypot(p.w,p.h)*T.rimDetectionRange;ctx.save();p.clip(ctx);ctx.clip();for(let i=0;i<PS;i++){const pt=p.perimeterPoint(i/PS),prox=1-clamp(Math.hypot(pt.x-px,pt.y-py)/maxDist,0,1),cI=Math.pow(prox,pw)*lerp(T.rimEdgeMinBoost,1,edgeBoost)*I;if(cI<0.01)continue;const c=this.rimColor(pt.angle+ca),g=ctx.createRadialGradient(pt.x,pt.y,0,pt.x,pt.y,w);g.addColorStop(0,`rgba(${c.r},${c.g},${c.b},${alphas[0]*cI*m})`);g.addColorStop(0.6,`rgba(${c.r},${c.g},${c.b},${alphas[1]*cI*m})`);g.addColorStop(1,`rgba(${c.r},${c.g},${c.b},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(pt.x,pt.y,w,0,Math.PI*2);ctx.fill();}ctx.restore();}
  
    _drawChromatic(){const p=this.pill,ctx=scratch.ensure(p.w,p.h,this.dpr),I=this.cursor.chrom.i;if(I<0.003)return;const T=this.theme,m=T.chromaticIntensity,pw=T.chromaticFalloff,ew=T.chromaticEdgeWidth,px=this.cursor.chrom.x*p.w,py=this.cursor.chrom.y*p.h,edgeBoost=smoothstep(0.3,1,1-clamp(Math.abs(p.sdf(px,py))/p.r,0,1));ctx.save();p.clip(ctx);ctx.clip();for(const{off,a:alpha}of[{off:-0.8,a:0.35},{off:0,a:0.45},{off:0.8,a:0.35}]){for(let i=0;i<200;i++){const pt=p.perimeterPoint(i/200),ox=pt.x+pt.nx*off,oy=pt.y+pt.ny*off,prox=1-clamp(Math.hypot(ox-px,oy-py)/(Math.hypot(p.w,p.h)*0.45),0,1),cI=Math.pow(prox,pw)*(0.25+0.75*edgeBoost)*I*alpha;if(cI<0.006)continue;const c=this.chromaticColor(pt.angle),g=ctx.createRadialGradient(ox,oy,0,ox,oy,ew);g.addColorStop(0,`rgba(${c.r},${c.g},${c.b},${0.25*cI*m})`);g.addColorStop(0.7,`rgba(${c.r},${c.g},${c.b},${0.10*cI*m})`);g.addColorStop(1,`rgba(${c.r},${c.g},${c.b},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(ox,oy,ew,0,Math.PI*2);ctx.fill();}}ctx.restore();}
  
    _drawSurface(){const p=this.pill,ctx=scratch.ensure(p.w,p.h,this.dpr),I=this.cursor.fast.i;if(I<0.003)return;const T=this.theme,m=T.surfaceIntensity,px=this.cursor.fast.x*p.w,py=this.cursor.fast.y*p.h,edge=smoothstep(0.65,0.05,clamp(p.sdf(px,py)/p.r,0,1)),ca=Math.atan2(py-p.h/2,px-p.w/2),c=this.rimColor(ca);ctx.save();p.clip(ctx);const ba=lerp(0.02,0.1,edge)*I*m,bg=ctx.createRadialGradient(px,py,0,px,py,p.w*0.4);bg.addColorStop(0,`rgba(${c.r},${c.g},${c.b},${ba})`);bg.addColorStop(0.4,`rgba(${c.r},${c.g},${c.b},${ba*0.3})`);bg.addColorStop(1,`rgba(${c.r},${c.g},${c.b},0)`);ctx.lineWidth=T.surfaceLineWidth;ctx.strokeStyle=bg;ctx.shadowColor=`rgba(${c.r},${c.g},${c.b},${0.1*edge*I*m})`;ctx.shadowBlur=T.surfaceShadowBlur;ctx.stroke();ctx.restore();}
  
    _drawHotspot(cw,ch){const ctx=scratchLarge.ensure(cw,ch,this.dpr);const p=this.pill,hp=HP/2,I=this.cursor.fast.i;if(I<0.003)return;const cfg=this.theme.hotspot,col=cfg.colors,px=hp+this.target.x*p.w,py=hp+this.target.y*p.h;const colAt=(t)=>{const idx=t*(col.length-1),i=Math.floor(idx),f=idx-i,a=col[Math.min(i,col.length-1)],b=col[Math.min(i+1,col.length-1)];return{r:Math.round(lerp(a.r,b.r,f)),g:Math.round(lerp(a.g,b.g,f)),b:Math.round(lerp(a.b,b.b,f))};};const r1=p.r*cfg.coreRadius,g1=ctx.createRadialGradient(px,py,0,px,py,r1);for(let i=0;i<=16;i++){const t=i/16,c=colAt(t);g1.addColorStop(t,`rgba(${c.r},${c.g},${c.b},${cfg.coreAlpha*Math.exp(-t*t*4.5)*I})`);}ctx.fillStyle=g1;ctx.fillRect(0,0,cw,ch);const r2=cw*cfg.washRadius,g2=ctx.createRadialGradient(px,py,0,px,py,r2);for(let i=0;i<=18;i++){const t=i/18,c=colAt(t);g2.addColorStop(t,`rgba(${c.r},${c.g},${c.b},${cfg.washAlpha*Math.exp(-t*t*3.8)*I})`);}ctx.fillStyle=g2;ctx.fillRect(0,0,cw,ch);const sw=cw*cfg.streakWidth,sh=p.r*cfg.streakHeight;ctx.save();ctx.translate(px,py);ctx.scale(sw/sh,1);ctx.translate(-px,-py);const g3=ctx.createRadialGradient(px,py,0,px,py,sh);for(let i=0;i<=14;i++){const t=i/14,c=colAt(t);g3.addColorStop(t,`rgba(${c.r},${c.g},${c.b},${cfg.streakAlpha*Math.exp(-t*t*4.0)*I})`);}ctx.fillStyle=g3;ctx.fillRect(px-sw,py-sh,sw*2,sh*2);ctx.restore();}
  }
  
  /* ==========================================================================
     INIT
     ========================================================================== */
  document.querySelectorAll('.spec-btn--dark').forEach(btn => {
    allInstances.push(new SpecularButton(btn, 'dark'));
  });

  document.querySelectorAll('.spec-btn--yellow').forEach(btn => {
    allInstances.push(new SpecularButton(btn, 'yellow'));
  });
  
  // Single shared ticker — all instances draw on one RAF instead of 8 separate ones
  gsap.ticker.add(() => {
    for(const inst of allInstances) inst.tick();
  });
  
  window.addEventListener('resize', () => {
    allInstances.forEach(inst => inst.resize());
  });
});