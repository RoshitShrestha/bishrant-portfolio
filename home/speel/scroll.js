/**
 * Scroll lock/unlock (Lenis) for intro state.
 * Assumes global `lenis` is available.
 */

let scrollLocked = false;

export function lockScroll() {
  if (scrollLocked) return;
  scrollLocked = true;
  lenis.stop();
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
}

export function unlockScroll() {
  if (!scrollLocked) return;
  scrollLocked = false;
  lenis.start();
}
