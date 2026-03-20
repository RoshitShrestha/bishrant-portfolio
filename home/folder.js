// gsap.registerPlugin(Flip, ScrollTrigger);

let flipCtx;
let _scrollListenerCleanup = null;
let _hoverListenerCleanups = [];

const mm = gsap.matchMedia();

const createTimeline = () => {
  flipCtx && flipCtx.revert();

  if (_scrollListenerCleanup) {
    _scrollListenerCleanup();
    _scrollListenerCleanup = null;
  }
  _hoverListenerCleanups.forEach((fn) => fn());
  _hoverListenerCleanups = [];

  flipCtx = gsap.context(() => {
    const section = document.querySelector("[data-home-project='section']");
    const pinEl = document.querySelector("[data-home-project='pin']");
    const cards = gsap.utils.toArray("[data-home-project='card']");
    const cardParents = gsap.utils.toArray("[data-home-project='card-parent']");
    const cardBoxes = gsap.utils.toArray("[data-home-project='card-box']");
    const cardWrapper = document.querySelector("[data-home-project='grid-wrapper']");
    const initialBox = document.querySelector("[data-home-project='initial-box']");
    const finalBox = document.querySelector("[data-home-project='final-box']");

    let scaleFactor = 1;
    if (cards.length) {
      scaleFactor = Math.round(
        (cardWrapper.offsetWidth / cards[0].offsetWidth) * 100
      ) / 100;
    }

    // ========== CACHE CHILD ELEMENT REFS ==========
    // Queried once here so resetCard / resetCardParent / onEnter never touch the DOM again.
    //   _cardRefs   : keyed by .home-project__card element (entry-hover state)
    //   _parentRefs : keyed by card-parent element (placed-hover state)
    const _cardRefs = new Map();
    const _parentRefs = new Map();

    cardParents.forEach((cardParent) => {
      const card = cardParent.querySelector(".home-project__card");
      const cardFolder = cardParent.querySelector(".card-folder");

      if (card) {
        _cardRefs.set(card, {
          hoverBg: card.querySelector("[data-folder-bg='hover']"),
          tag:     card.querySelector("[data-folder='tag']"),
          desc:    card.querySelector("[data-folder='description']"),
        });
      }

      if (cardFolder) {
        _parentRefs.set(cardParent, {
          card,
          cardFolder,
          previewFiles: Array.from(cardParent.querySelectorAll(".folder__preview__file")),
          hoverBg:      cardFolder.querySelector("[data-folder-bg='hover']"),
          tag:          cardFolder.querySelector("[data-folder='tag']"),
          desc:         cardFolder.querySelector("[data-folder='description']"),
        });
      }
    });

    const finalState = Flip.getState(finalBox);

    // ========== REMOVING HOVER ON SCROLL ==========
    let hoveredCard = null;
    let hoveredCardParent = null;

    function resetCardIfHovered() {
      if (hoveredCard) resetCard(hoveredCard);
    }

    function resetCardParentIfHovered() {
      if (hoveredCardParent) resetCardParent(hoveredCardParent);
    }

    let hasPointerMovedSinceInit = false;
    const onFirstPointerMove = () => {
      hasPointerMovedSinceInit = true;
      window.removeEventListener("pointermove", onFirstPointerMove);
    };
    window.addEventListener("pointermove", onFirstPointerMove, { passive: true });

    _scrollListenerCleanup = () => {
      window.removeEventListener("pointermove", onFirstPointerMove);
    };

    const mainTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom top",
        pin: pinEl,
        scrub: true,
        pinSpacing: false,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          if (Math.abs(self.getVelocity()) > 300) {
            resetCardIfHovered();
            resetCardParentIfHovered();
          }
        },
      },
    });

    // ========== CARD ENTRY HOVER ==========
    let baseY = new Map();

    function resetCard(card) {
      if (!card || !card.classList.contains("is-interactive")) return;
      const refs = _cardRefs.get(card);
      if (!refs) return;

      gsap.to(card, {
        y: `${baseY.get(card)}%`,
        duration: 0.5,
        ease: "power3.inOut",
        overwrite: "auto",
      });
      gsap.to(refs.hoverBg, { opacity: 0, ease: "power1.inOut", duration: 0.3 });
      // GSAP cannot interpolate CSS gradients — use set() to snap immediately
      gsap.set(refs.tag, { backgroundImage: "linear-gradient(135deg, #FFF, #FFF)" });
      gsap.to(refs.desc, { color: "#FFF", ease: "power1.inOut", duration: 0.3 });

      if (hoveredCard === card) hoveredCard = null;
    }

    // ========== CARDS ENTRY ==========
    cardParents.forEach((cardParent, i) => {
      mainTl.fromTo(
        cardParent,
        { scale: scaleFactor + 2 },
        { scale: scaleFactor + 0.35, duration: 0.8, ease: "back.out(1.7)" },
        i * 0.05
      );
    });
    cards.forEach((card, i) => {
      const targetY = `${(cardParents.length - i) * -3 - 6}%`;
      baseY.set(card, parseFloat(targetY));
      mainTl.fromTo(
        card,
        { y: 0 },
        { y: targetY, duration: 0.6, ease: "back.out(1.7)" },
        i * 0.05
      );
    });

    mainTl.addLabel("initial", "+=0.1");

    mainTl.fromTo(pinEl, {backgroundColor: "rgba(0, 0, 0, 0)"}, {backgroundColor: "rgba(0, 0, 0, 1)", duration: 0.1, ease: "none"}, mainTl.labels.initial);

    // ========== CARD PLACE ==========
    cardParents.forEach((cardParent, i) => {
      const q = gsap.utils.selector(cardParent);
      const refs = _parentRefs.get(cardParent);
      const card = refs ? refs.card : cardParent.querySelector(".home-project__card");
      const folderImage = cardParent.querySelector(".folder__image-wrapper");
      const folderDescription = cardParent.querySelector(".folder__description-text");

      mainTl.add(
        Flip.fit(cardParent, cardBoxes[i], {
          duration: 0.8,
          fitChild: q(".home-project__card"),
          absolute: true,
          scale: true,
          simple: true,
          ease: "power2.inOut",
          immediateRender: false,
        }),
        mainTl.labels.initial + i * 0.1,
      );

      mainTl.to(
        card,
        { y: 0, duration: 0.8, ease: "power2.inOut" },
        mainTl.labels.initial + i * 0.1,
      );

      mainTl.fromTo(
        folderImage,
        { y: 10, opacity: 0 },
        { y: 0, rotation: 0, scale: 1, opacity: 1, duration: 0.6, ease: "power2.out" },
        mainTl.labels.initial + 0.52 + i * 0.1,
      );
      mainTl.fromTo(
        folderDescription,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: "power2.out" },
        mainTl.labels.initial + 0.62 + i * 0.1,
      );

      mainTl.to(
        {},
        {
          duration: 0.001,
          onStart: () => {
            cardParent.classList.add("is-placed");
            gsap.set(card, { pointerEvents: "auto" });
          },
          onReverseComplete: () => {
            cardParent.classList.remove("is-placed");
            gsap.set(card, { pointerEvents: "none" });
          },
        },
        mainTl.labels.initial + 0.8 + i * 0.1,
      );
    });

    mainTl.addLabel("final", "+=0.0");

    // ========== CARD PLACE HOVER ==========
    function resetCardParent(cardParent) {
      if (!cardParent || !cardParent.classList.contains("is-placed")) return;
      const refs = _parentRefs.get(cardParent);
      if (!refs) return;

      cardParents.forEach((sibling) => sibling.classList.remove("is-disabled"));

      refs.previewFiles.forEach((previewFile, fileIndex) => {
        gsap.to(previewFile, {
          y: "0%",
          rotation: 0,
          scale: 0.8,
          duration: 0.25,
          ease: "back.out(1.7)",
          delay: fileIndex * 0.025,
          overwrite: "auto",
        });
      });

      gsap.to(refs.cardFolder, { transformOrigin: "50% 50%", scale: 1, ease: "power1.inOut", duration: 0.3 });
      gsap.to(refs.hoverBg, { opacity: 0, ease: "power1.inOut", duration: 0.3 });
      gsap.set(refs.tag, { backgroundImage: "linear-gradient(135deg, #FFF, #FFF)" });
      gsap.to(refs.desc, { color: "#FFF", ease: "power1.inOut", duration: 0.3 });

      if (hoveredCardParent === cardParent) hoveredCardParent = null;
    }

    // Run once on initial load to enforce default non-hover state.
    cardParents.forEach((cardParent) => resetCardParent(cardParent));

    mm.add("(min-width: 1025px)", () => {
      cardParents.forEach((cardParent) => {
        const refs = _parentRefs.get(cardParent);
        if (!refs) return;

        const { previewFiles, cardFolder } = refs;

        const onEnter = () => {
          if (!hasPointerMovedSinceInit) return;
          if (!cardParent.classList.contains("is-placed")) return;

          hoveredCardParent = cardParent;

          cardParents.forEach((sibling) => {
            if (sibling !== cardParent) sibling.classList.add("is-disabled");
          });

          previewFiles.forEach((previewFile, fileIndex) => {
            let rotation;
            if (fileIndex === 0) {
              rotation = gsap.utils.random(-20, -10);
            } else if (fileIndex === 1) {
              rotation = gsap.utils.random(-10, 10);
            } else {
              rotation = gsap.utils.random(10, 20);
            }

            gsap.to(previewFile, {
              y: "-90%",
              rotation,
              scale: 1,
              duration: 0.25,
              ease: "back.out(1.7)",
              delay: fileIndex * 0.025,
              overwrite: "auto",
            });
          });

          gsap.to(cardFolder, { transformOrigin: "50% 50%", scale: 1.05, ease: "power1.inOut", duration: 0.3 });
          gsap.to(refs.hoverBg, { opacity: 1, ease: "power1.inOut", duration: 0.3 });
          gsap.set(refs.tag, { backgroundImage: "linear-gradient(135deg, #FFF68D, #FFF14B)" });
          gsap.to(refs.desc, { color: "#FFEBB6", ease: "power1.inOut", duration: 0.3 });
        };

        const onLeave = () => resetCardParent(cardParent);

        cardParent.addEventListener("mouseenter", onEnter);
        cardParent.addEventListener("mouseleave", onLeave);

        _hoverListenerCleanups.push(() => {
          cardParent.removeEventListener("mouseenter", onEnter);
          cardParent.removeEventListener("mouseleave", onLeave);
        });
      });
    });

    // ========== CARD OUT ==========
    cardParents.forEach((cardParent, i) => {
      const refs = _parentRefs.get(cardParent);
      const card = refs ? refs.card : cardParent.querySelector(".home-project__card");

      const targetRotation = [0, 3].includes(i)
        ? 20
        : [2, 5].includes(i)
          ? -20
          : 0;

      mainTl.to(
        {},
        {
          duration: 0.001,
          onStart: () => {
            cardParent.classList.remove("is-placed");
            gsap.set(card, { pointerEvents: "none" });
          },
          onReverseComplete: () => {
            cardParent.classList.add("is-placed");
            gsap.set(card, { pointerEvents: "auto" });
          },
        },
        mainTl.labels.final + i * 0.1 + 0.2,
      );

      mainTl.add(
        Flip.fit(cardParent, finalState, {
          duration: 0.4,
          fitChild: ".home-project__card",
          absolute: true,
          scale: true,
          simple: true,
          ease: "power3.in",
          immediateRender: false,
        }),
        mainTl.labels.final + i * 0.1 + 0.2,
      );

      mainTl.to(
        card,
        { transformOrigin: "center", rotation: targetRotation, duration: 0.4, ease: "power3.in" },
        mainTl.labels.final + i * 0.1 + 0.2,
      );
    });

    // ========== CUSTOM SNAP (bypasses Lenis inertia) ==========
    // Listens to raw user-input events (wheel / touch) so the idle timer
    // starts when the *user* stops, not when Lenis's smooth inertia settles.
    const SNAP_IDLE_DELAY = 600;        // ms after last input before snapping
    const SNAP_COMMIT_THRESHOLD = 0.3;  // zone % to commit forward (below = revert)
    const SNAP_SCROLL_DURATION = 1.2;   // seconds for the snap scroll animation
    const SNAP_REVERT_THRESHOLD_OUT = 0.5;  // zone % to revert to placed state

    const st = mainTl.scrollTrigger;
    let _snapTimer = null;
    let _lastPointerX = 0;
    let _lastPointerY = 0;

    const onPointerMove = (e) => {
      _lastPointerX = e.clientX;
      _lastPointerY = e.clientY;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    function retriggerHoverUnderCursor() {
      ScrollTrigger.update();
      const el = document.elementFromPoint(_lastPointerX, _lastPointerY);
      if (!el) return;
      const parent = el.closest("[data-home-project='card-parent']");
      if (parent) {
        parent.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
      }
    }

    function getSnapTarget() {
      const dur = mainTl.duration();
      if (!dur || !st.isActive) return null;
      const progress = st.progress;
      const initialP = mainTl.labels.initial / dur;
      const finalP = mainTl.labels.final / dur;

      // Card placement zone: snap forward or revert
      if (progress > initialP + 0.01 && progress < finalP - 0.01) {
        const zone = (progress - initialP) / (finalP - initialP);
        const targetP = zone > SNAP_COMMIT_THRESHOLD ? finalP : initialP;
        return st.start + targetP * (st.end - st.start);
      }

      // Card out zone: revert to placed state if < threshold
      if (progress > finalP + 0.01 && progress < 1 - 0.01) {
        const zone = (progress - finalP) / (1 - finalP);
        if (zone < SNAP_REVERT_THRESHOLD_OUT) {
          return st.start + finalP * (st.end - st.start);
        }
      }

      return null;
    }

    function attemptSnap() {
      _snapTimer = null;
      const target = getSnapTarget();
      if (target !== null && typeof lenis !== "undefined") {
        lenis.scrollTo(target, {
          duration: SNAP_SCROLL_DURATION,
          easing: (t) =>
            t < 0.5
              ? 2 * t * t
              : 1 - Math.pow(-2 * t + 2, 2) / 2,
          onComplete: retriggerHoverUnderCursor,
        });
      }
    }

    function scheduleSnap() {
      clearTimeout(_snapTimer);
      _snapTimer = setTimeout(attemptSnap, SNAP_IDLE_DELAY);
    }

    function cancelSnap() {
      clearTimeout(_snapTimer);
      _snapTimer = null;
    }

    window.addEventListener("wheel", scheduleSnap, { passive: true });
    window.addEventListener("touchend", scheduleSnap, { passive: true });
    window.addEventListener("touchstart", cancelSnap, { passive: true });

    const _prevCleanup = _scrollListenerCleanup;
    _scrollListenerCleanup = () => {
      if (_prevCleanup) _prevCleanup();
      cancelSnap();
      window.removeEventListener("wheel", scheduleSnap);
      window.removeEventListener("touchend", scheduleSnap);
      window.removeEventListener("touchstart", cancelSnap);
      window.removeEventListener("pointermove", onPointerMove);
    };
  });
};

function debounce(fn, ms) {
  let timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(fn, ms);
  };
}

createTimeline();

// Only rebuild the full timeline when the viewport width actually changes.
// Height-only changes (e.g. mobile keyboard, scrollbar appearing) just need a refresh.
let _lastResizeWidth = window.innerWidth;
window.addEventListener(
  "resize",
  debounce(() => {
    const newWidth = window.innerWidth;
    ScrollTrigger.refresh();
    if (newWidth !== _lastResizeWidth) {
      _lastResizeWidth = newWidth;
      createTimeline();
    }
  }, 150),
);

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});
