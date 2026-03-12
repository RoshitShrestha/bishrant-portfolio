/**
 * Speel entry point: bootstrap, scroll, intro setup, peel resize, init.
 */

// import gsap from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// import { SplitText } from "gsap/SplitText";
import { skipIntro, scrollToTargetFromUrl } from "./navigation.js";
import { lockScroll } from "./scroll.js";
import { handleResize as peelHandleResize, initStickerPeels, disposeStickerPeels } from "./peel.js";
import { init, dispose as disposeInit } from "./init.js";
import { loaderGridAnimation } from "./timelines.js";

if (typeof history !== "undefined") history.scrollRestoration = "manual";
if (typeof window !== "undefined") window.scrollTo(0, 0);

window.addEventListener("load", () => {
  // document.body.classList.add("loaded");
  if (!skipIntro) lockScroll();

  // Show intro perspective when not skipping intro (run on load so DOM is ready)
  const introPerspective =
    document.querySelector(".intro_perspective") ||
    document.querySelector(".intro__perspective") ||
    document.querySelector(".into__perspective");
  if (!skipIntro && introPerspective) {
    introPerspective.style.display = "flex";
  }
  if (!skipIntro) {
    const heroWrapper = document.querySelector("[data-hero='wrapper']");
    if (heroWrapper) heroWrapper.classList.add("u-mouse-none");
  }

  // Run peel setup after DOM and intro are visible so #strip has real dimensions
  peelHandleResize();
  // Sticker peels need to run after intro is visible so .peel-sticker elements have dimensions
  initStickerPeels();

  // When intro is skipped, scroll to URL target after layout is ready
  if (skipIntro) {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    lenis.scrollTo(0, { immediate: true });
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(() => {
        if (typeof window !== "undefined") {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
      });
    }
    
    setTimeout(() => {
      scrollToTargetFromUrl();
      loaderGridAnimation();
    }, 100);
  } else {
    setTimeout(() => {
      loaderGridAnimation();
    }, 100);
  }
});

window.addEventListener("pageshow", (event) => {
  // Re-run loader reveal when returning via browser history (bfcache restore).
  if (event.persisted) loaderGridAnimation();
});

window.addEventListener("resize", () => {
  peelHandleResize();
  initStickerPeels(true);
});

// gsap.registerPlugin(ScrollTrigger, SplitText);

init();