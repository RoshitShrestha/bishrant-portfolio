/**
 * Speel entry point: bootstrap, scroll, intro setup, peel resize, init.
 */

// import gsap from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// import { SplitText } from "gsap/SplitText";
import { skipIntro } from "./navigation.js";
import { lockScroll } from "./scroll.js";
import { handleResize as peelHandleResize, initStickerPeels } from "./peel.js";
import { init, setupResize } from "./init.js";

if (typeof history !== "undefined") history.scrollRestoration = "manual";
if (typeof window !== "undefined") window.scrollTo(0, 0);

window.addEventListener("load", () => {
  document.body.classList.add("loaded");
  lockScroll();

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
});
window.addEventListener("resize", peelHandleResize);

gsap.registerPlugin(ScrollTrigger, SplitText);

init();
