/**
 * Peel (strip) interaction and auto-complete animation.
 */

// import gsap from "gsap";
import { SVGPath } from "./config.js";

// Shared GSAP matchMedia instance for responsive behavior
const mm = gsap.matchMedia();

let _introTimeline = null;

console.log("peel.js loaded");

export function setPeelIntroTimeline(timeline) {
  _introTimeline = timeline;
}

function autoCompletePeel(peelInstance, { x, y }, WIDTH, HEIGHT) {
  const proxy = { x, y };
  const tl = gsap.timeline();

  tl.to(proxy, {
    duration: 2.5,
    ease: "power2.out",
    x: -WIDTH,
    y: -HEIGHT,
    onUpdate() {
      peelInstance.setPeelPosition(proxy.x, proxy.y);
    },
    onComplete() {
      peelInstance.remove?.();
    },
  });

  tl.to(
    "[data-zoom-wrapper]",
    {
      duration: 2,
      y: "-18vh",
      z: "999",
      ease: "power4.in",
    },
    0
  );

  tl.to(
    ".intro_perspective",
    {
      ease: "none",
      duration: 0,
      opacity: 0,
      display: "none",
    },
    2
  );

  tl.add(() => _introTimeline?.play(), 1.5);
}

const SVG_SIZE = { width: 1341, height: 111 };

let stripHTMLCache = "";
let currentStripPeel = null;
let currentStripMouseEnter = null;
let currentStripMouseLeave = null;

export function handleResize() {
  let didDrag = false;
  const peelEl = document.querySelector("#strip");
  if (!peelEl) return;

  if (currentStripPeel) {
    if (currentStripMouseEnter) peelEl.removeEventListener("mouseenter", currentStripMouseEnter);
    if (currentStripMouseLeave) peelEl.removeEventListener("mouseleave", currentStripMouseLeave);
    currentStripPeel.remove?.();
    currentStripPeel = null;
    currentStripMouseEnter = null;
    currentStripMouseLeave = null;
  }

  if (!stripHTMLCache) {
    stripHTMLCache = peelEl.innerHTML;
  } else {
    peelEl.innerHTML = stripHTMLCache;
  }
  let peel = null;

  const rect = peelEl.getBoundingClientRect();
  const WIDTH = rect.width;
  const HEIGHT = rect.height;
  const CORNER = { x: WIDTH, y: HEIGHT };
  const MAX_DISTANCE = Math.hypot(WIDTH, HEIGHT);
  const AUTO_PEEL_AT = MAX_DISTANCE * 0.2;

  let autoPeeling = false;
  let currentPos = { ...CORNER };
  let stripHoverEnabled = true;

  const scaleX = WIDTH / SVG_SIZE.width;
  const scaleY = HEIGHT / SVG_SIZE.height;

  peel = new Peel("#strip", {
    path: { d: SVGPath, transform: `scale(${scaleX} ${scaleY})` },
    backShadowSize: 0.1,
    backShadowAlpha: 0.1,
    backReflection: true,
    backReflectionAlpha: 0.3,
  });
  peel.setMode("book");
  currentStripPeel = peel;

  const initialPos = { x: WIDTH, y: HEIGHT / 2 };
  const hoverPos = { x: WIDTH * 0.98, y: HEIGHT * 0.4 };
  peel.setCorner(initialPos.x, initialPos.y);
  peel.setPeelPosition(initialPos.x, initialPos.y);

  const peelHoverTL = gsap.timeline({
    paused: true,
    defaults: { duration: 0.4, ease: "power1.out" },
  });
  peelHoverTL.to(initialPos, {
    x: hoverPos.x,
    y: hoverPos.y,
    onUpdate: () => peel.setPeelPosition(initialPos.x, initialPos.y),
  });
  peelHoverTL.eventCallback("onReverseComplete", () =>
    peel.setPeelPosition(WIDTH, HEIGHT / 2)
  );
  // Attach hover listeners only on viewports wider than 1024px.
  mm.add("(min-width: 1025px)", () => {
    currentStripMouseEnter = () => stripHoverEnabled && peelHoverTL.play();
    currentStripMouseLeave = () => stripHoverEnabled && peelHoverTL.reverse();
    peelEl.addEventListener("mouseenter", currentStripMouseEnter);
    peelEl.addEventListener("mouseleave", currentStripMouseLeave);

    // Cleanup when the media query no longer matches
    return () => {
      if (currentStripMouseEnter) {
        peelEl.removeEventListener("mouseenter", currentStripMouseEnter);
      }
      if (currentStripMouseLeave) {
        peelEl.removeEventListener("mouseleave", currentStripMouseLeave);
      }
      currentStripMouseEnter = null;
      currentStripMouseLeave = null;
    };
  });

  peel.handleDrag(function (_, x, y) {
    didDrag = true;
    if (autoPeeling) return;
    stripHoverEnabled = false;

    const transform = getComputedStyle(this.el).transform;
    const matrix = new DOMMatrix(transform === "none" ? undefined : transform);
    const localPoint = matrix.inverse().transformPoint(new DOMPoint(x, y));

    currentPos = { x: localPoint.x, y: localPoint.y };
    this.setPeelPosition(localPoint.x, localPoint.y);

    const dx = CORNER.x - localPoint.x;
    const dy = CORNER.y - localPoint.y;

    if (dx < 0) return;
    if (Math.hypot(dx, dy) >= AUTO_PEEL_AT) {
      autoPeeling = true;
      autoCompletePeel(this, currentPos, WIDTH, HEIGHT);
    }
  });

  peel.handlePress(function (evt) {
    didDrag = false;
    requestAnimationFrame(() => {
      if (didDrag || autoPeeling) return;

      stripHoverEnabled = false;
      autoPeeling = true;

      const pressPos = {
        x: WIDTH * 0.95,
        y: HEIGHT * 0.5,
      };

      peel.setPeelPosition(pressPos.x, pressPos.y);
      autoCompletePeel(peel, pressPos, WIDTH, HEIGHT);
    });
  });
}

// ——— Independent setup for .peel-sticker elements (no relation to #strip) ———
// Call after intro is visible (e.g. from main.js load handler) so stickers have real dimensions.
let _stickerCleanups = [];
const _stickerHTMLCache = new Map();

export function disposeStickerPeels() {
  _stickerCleanups.forEach((fn) => fn());
  _stickerCleanups = [];
}

export function initStickerPeels(skipIntroAnim = false) {
  disposeStickerPeels();

  if (typeof CustomEase === "undefined") return;
  CustomEase.create("sticker", "M0,0 C0.31,0.73 0.84,0.27 1,1");

  const peelElements = document.querySelectorAll(".peel-sticker");
  if (!peelElements.length) return;

  peelElements.forEach((el, i) => {
    const cacheKey = el.id || `peel-sticker-${i}`;
    if (!_stickerHTMLCache.has(cacheKey)) {
      _stickerHTMLCache.set(cacheKey, el.innerHTML);
    } else {
      el.innerHTML = _stickerHTMLCache.get(cacheKey);
    }

    const width = el.offsetWidth;
    const height = el.offsetHeight;

    const p = new Peel(el, {
      corner: i === 2 ? Peel.Corners.TOP_LEFT : Peel.Corners.BOTTOM_RIGHT,
    });

    let targetX;
    let targetY;
    let peelPos;

    if (i === 0 || i === 1) {
      targetX = width;
      targetY = height;
      peelPos = { x: 0, y: 0 };
    }
    if (i === 2) {
      targetX = 0;
      targetY = 0;
      peelPos = { x: width, y: height };
    }

    // Path must be set before setTimeAlongPath can be used
    if (i === 0 || i === 1) {
      p.setPeelPath(targetX, targetY, 50, targetY, 0, 0, targetX, -targetY);
    }
    if (i === 2) {
      p.setPeelPath(targetX, targetY, width - 50, targetY, width, height, width * 2, height * 2);
    }
    p.setFadeThreshold(0.8);
    p.t = 0;

    // Only allow hover once the intro positioning tween completes (unless skipped).
    let hoverEnabled = skipIntroAnim ? true : false;

    if (skipIntroAnim) {
      // Use the same positioning system as hover/press so there's no offset when they fire
      p.setTimeAlongPath(0);
    } else {
      p.setPeelPosition(peelPos.x, peelPos.y);
      gsap.to(peelPos, {
        duration: 0.8,
        delay: 0.9 + 0.2 * i,
        x: targetX,
        y: targetY,
        onUpdate: function () {
          p.setPeelPosition(peelPos.x, peelPos.y);
        },
        onComplete: function () {
          hoverEnabled = true;
        },
        ease: "sticker",
      });
    }

    const tween = gsap.to(p, {
      t: 1,
      duration: 1,
      paused: true,
      ease: "power2.in",
      onUpdate: function () {
        p.setTimeAlongPath(this.targets()[0].t);
      },
    });

    p.handlePress(function (evt) {
      // gsap.killTweensOf(p, "t");
      // tween.seek(0);
      tween.play();
      hoverEnabled = false;
      this.handlePress(null);
    });

    const hoverIncrement = 0.05;

    const onMouseEnter = () => {
      if (!hoverEnabled) return;
      gsap.to(p, {
        t: hoverIncrement,
        duration: 0.4,
        ease: "power1.out",
        onUpdate: function () {
          p.setTimeAlongPath(this.targets()[0].t);
        },
      });
    };

    const onMouseLeave = () => {
      if (!hoverEnabled) return;
      gsap.to(p, {
        t: 0,
        duration: 0.4,
        ease: "power1.in",
        onUpdate: function () {
          p.setTimeAlongPath(this.targets()[0].t);
        },
      });
    };

    // Enable hover only on viewports wider than 1024px.
    mm.add("(min-width: 1025px)", () => {
      p.el.addEventListener("mouseenter", onMouseEnter);
      p.el.addEventListener("mouseleave", onMouseLeave);

      // Cleanup when the media query no longer matches
      return () => {
        p.el.removeEventListener("mouseenter", onMouseEnter);
        p.el.removeEventListener("mouseleave", onMouseLeave);
      };
    });

    _stickerCleanups.push(() => {
      p.el.removeEventListener("mouseenter", onMouseEnter);
      p.el.removeEventListener("mouseleave", onMouseLeave);
      tween.kill();
      p.remove?.();
    });
  });
}
