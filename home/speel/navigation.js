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

export const skipIntro = isInternalNavigation();
// export const skipIntro = true;
