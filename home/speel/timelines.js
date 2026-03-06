/**
 * GSAP timelines: intro (blob/tunnel/post), hero content, hero scroll.
 */

// import gsap from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// import { SplitText } from "gsap/SplitText";
import { scene, camera, vectors } from "./three/scene.js";
import { introGradientMaterial, introMaskMaterial, rectCenterEnd } from "./three/introMaterials.js";
import { postProcessMaterial } from "./three/postProcess.js";
import { heroGradientMesh, heroGradientUniforms, heroMaskMaterial } from "./three/heroScene.js";
import { unlockScroll } from "./scroll.js";
import { SVGSETTINGS } from "./config.js";
import { cameraOffset } from "./config.js";
import { markNeedsRender } from "./renderState.js";

let introTimeline;
let heroContentTimeline;
let _heroTitleSplit = null;
let _heroDescriptionSplit = null;
let _heroScrollTrigger = null;
let _heroTl = null;

export function getIntroTimeline() {
  return introTimeline;
}

export function getHeroContentTimeline() {
  return heroContentTimeline;
}

export function disposeTimelines() {
  if (_heroTitleSplit) { _heroTitleSplit.revert(); _heroTitleSplit = null; }
  if (_heroDescriptionSplit) { _heroDescriptionSplit.revert(); _heroDescriptionSplit = null; }
  if (_heroScrollTrigger) { _heroScrollTrigger.kill(); _heroScrollTrigger = null; }
  if (_heroTl) {
    if (_heroTl.scrollTrigger) _heroTl.scrollTrigger.kill();
    _heroTl.kill();
    _heroTl = null;
  }
  if (introTimeline) {
    introTimeline.kill();
    introTimeline = null;
  }
  if (heroContentTimeline) {
    heroContentTimeline.kill();
    heroContentTimeline = null;
  }
}

export function createTimelines(updateSvgOpacity) {
  const firstVectorZ = vectors[0].position.z;
  const lastVectorZ = vectors[vectors.length - 1].position.z;
  const cameraStartZ = firstVectorZ + cameraOffset;
  const cameraEndZ = lastVectorZ - cameraOffset;

  camera.position.z = cameraStartZ;
  updateSvgOpacity();

  introTimeline = gsap.timeline({ paused: true });

  introTimeline.to(
    introMaskMaterial.uniforms.uProgress,
    {
      value: 1,
      duration: 1.5,
      ease: "power1.in",
      onUpdate: markNeedsRender,
      onComplete: () => {
        document.querySelector("[data-hero='wrapper']")?.classList.remove("u-mouse-none");
      },
    },
    "init"
  );

  introTimeline.addLabel("blobEnd");

  introTimeline.to(
    camera.position,
    {
      z: cameraEndZ,
      duration: SVGSETTINGS.duration,
      ease: "expo.out",
      onUpdate() { updateSvgOpacity(); markNeedsRender(); },
    },
    "init+=0.25"
  );

  introTimeline.to(
    postProcessMaterial.uniforms.uBulge,
    {
      value: 0.8,
      duration: 1.5,
      ease: "expo.out",
      onUpdate: markNeedsRender,
    },
    "init+=0.5"
  );

  introTimeline.to(
    introGradientMaterial.uniforms.topRectCenterY,
    {
      value: 1.0 - rectCenterEnd,
      duration: 1,
      ease: "expo.in",
      onUpdate: markNeedsRender,
    },
    "blobEnd"
  );

  introTimeline.to(
    introGradientMaterial.uniforms.bottomRectCenterY,
    {
      value: rectCenterEnd,
      duration: 1.2,
      ease: "expo.in",
      onUpdate: markNeedsRender,
      onComplete: () => unlockScroll(),
    },
    "blobEnd"
  );

  introTimeline.add(() => {
    heroContentTimeline.play();
  }, "init+=1.7");

  // HERO CONTENT TIMELINE
  heroContentTimeline = gsap.timeline({ paused: true });
  gsap.set("[data-hero='content']", { autoAlpha: 1 });

  heroContentTimeline.from(
    "[data-hero='content']",
    {
      duration: 1.5,
      x: "-100%",
      y: 0,
      z: 500,
      scale: 1,
      ease: "power3.out",
      stagger: { each: 0.08, from: "start" },
    },
    0
  );
  heroContentTimeline.from(
    "[data-hero='content']",
    {
      duration: 1,
      filter: "blur(20px)",
      opacity: 0,
      ease: "power3.out",
      stagger: { each: 0.08, from: "start" },
    },
    0
  );
  heroContentTimeline.from(
    "[data-hero-element-in='scroll-hint']",
    {
      duration: 1.5,
      x: "150%",
      y: "-250%",
      scale: 1.5,
      ease: "power3.out",
    },
    0
  );
  heroContentTimeline.from(
    "[data-hero-element-in='scroll-hint']",
    {
      duration: 1,
      filter: "blur(20px)",
      opacity: 0,
      ease: "power3.out",
    },
    0
  );

  heroContentTimeline.from(
    "[data-navbar]",
    {
      duration: 1.5,
      y: "-120%",
      scale: 1.5,
      ease: "power3.out",
    },
    0.1
  );
  heroContentTimeline.from(
    "[data-navbar]",
    {
      duration: 1,
      filter: "blur(20px)",
      opacity: 0,
      ease: "power3.out",
    },
    0.2
  );

  heroContentTimeline.add(() => {
    heroGradientMesh.visible = true;
    heroGradientUniforms.u_isPaused.value = 0;
  }, 0.2);

  heroContentTimeline.fromTo(
    heroGradientUniforms.u_opacity,
    { value: 0 },
    {
      value: 1,
      duration: 1.5,
      ease: "power3.in",
      onUpdate: markNeedsRender,
    },
    0.2
  );

  

  setupHeroScrollTimeline();
}

function setupHeroScrollTimeline() {
  const heroTitle = document.querySelector('[data-hero-element="title"]');
  const heroTag = document.querySelectorAll('[data-hero-element="tag"]');
  const heroDescription = document.querySelector('[data-hero-element="description"]');
  const heroButton = document.querySelectorAll('[data-hero-element="button"]');
  const heroScroll = document.querySelector('[data-hero-element-out="scroll-hint"]');

  if (!heroTitle || !heroDescription) return;

  _heroTitleSplit = new SplitText(heroTitle, { type: "chars" });
  _heroDescriptionSplit = new SplitText(heroDescription, {
    type: "words",
    wordsClass: "hero-desc-word",
    tag: "span",
  });
  const heroDescriptionEl = heroDescription.querySelectorAll(
    ".hero-desc-word, .u-text-style-highlight"
  );

  _heroTl = gsap.timeline({
    scrollTrigger: {
      trigger: "[data-hero='wrapper']",
      start: "top top",
      end: "bottom center",
      scrub: true,
      invalidateOnRefresh: true,
      pin: "[data-hero='container']",
      pinSpacing: false,
  },
  });

  _heroTl
    .to(heroScroll, {
      yPercent: -100,
      opacity: 0,
      filter: "blur(20px)",
      ease: "none",
    }, 0.05)
    .to(heroButton, {
      yPercent: -100,
      opacity: 0,
      filter: "blur(20px)",
      stagger: { from: "end", each: 0.01 },
      ease: "none",
    }, 0.05)
    .to(heroDescriptionEl, {
      yPercent: -100,
      opacity: 0,
      filter: "blur(20px)",
      stagger: { from: "end", each: 0.01 },
      ease: "none",
    }, 0.1)
    .to(heroButton, {
      yPercent: -100,
      opacity: 0,
      filter: "blur(20px)",
      ease: "none",
    })
    .to(heroTag, {
      yPercent: -100,
      opacity: 0,
      filter: "blur(20px)",
      stagger: { from: "end", each: 0.01 },
      ease: "none",
    }, 0.65)
    .to(_heroTitleSplit.chars, {
      yPercent: -30,
      opacity: 0,
      filter: "blur(20px)",
      stagger: { from: "end", each: 0.08 },
      ease: "none",
    }, 0.8);

  _heroScrollTrigger = ScrollTrigger.create({
    trigger: "[data-hero='wrapper']",
    start: "top top",
    end: "bottom top",
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      heroMaskMaterial.uniforms.uProgress.value = self.progress;
      markNeedsRender();
    },
  });

  // GSDevTools.create({animation: heroTl}); 
}

export function loaderGridAnimation() {

  const loadGrid = document.querySelector("[data-load-grid]");

  if (!loadGrid) return;

  let q = gsap.utils.selector(loadGrid);

  // gsap.set(loadGrid, { display: "grid" });

  gsap.to(
    q(".load_grid-item"), 
    {
      opacity: 0,
      duration: 0.001,
      stagger: { amount: 0.75, from: "random"},
      onComplete: () => {
        gsap.set(loadGrid, { display: "none" });
      },
    },
  );
}