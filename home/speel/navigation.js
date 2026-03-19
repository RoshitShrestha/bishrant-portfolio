/**
 * Detect internal vs external navigation for intro skip behavior.
 */

export function isInternalNavigation() {
  try {
    const referrer = document.referrer;
    if (!referrer) return false;

    const referrerUrl = new URL(referrer);
    const currentUrl = new URL(window.location.href);

    if (referrerUrl.origin !== currentUrl.origin) return false;

    const referrerPath = referrerUrl.pathname.replace(/\/$/, "") || "/";
    const currentPath = currentUrl.pathname.replace(/\/$/, "") || "/";

    if (referrerPath === currentPath) return false;

    return true;
  } catch (e) {
    return false;
  }
}

function shouldForceSkipIntroFromReload() {
  try {
    if (typeof window === "undefined") return false;
    const key = "home_force_skip_intro_once";
    const shouldForce = sessionStorage.getItem(key) === "1";
    if (shouldForce) sessionStorage.removeItem(key);
    return shouldForce;
  } catch (e) {
    return false;
  }
}

export const skipIntro = isInternalNavigation() || shouldForceSkipIntroFromReload();
// export const skipIntro = true;

/**
 * If URL has ?scroll=projects (or other targets), scroll to that section.
 * Assumes global `lenis` is available. Call after scroll is unlocked.
 */
export function scrollToTargetFromUrl() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const scrollTarget = params.get("scroll");

  if (scrollTarget === "projects" && typeof lenis !== "undefined") {
    const section = document.querySelector("#projects-section");
    if (section) {
      lenis.scrollTo(section, {
        offset: window.innerHeight * 1.7,
        // duration: 0,
        immediate: true,
      });
    }
  } else {
    
  }
}
