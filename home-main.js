if (typeof window !== "undefined") {
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      try {
        sessionStorage.setItem("home_force_skip_intro_once", "1");
      } catch (e) {
        // no-op
      }
      window.location.reload();
    }
  });
}

import "./home/speel/main.js";
import "./home/folder.js"
import "./home/disc.js"
// import "./global/cta-card.js"