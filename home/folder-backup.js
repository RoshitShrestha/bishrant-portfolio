// gsap.registerPlugin(Flip, ScrollTrigger);

let flipCtx;
let _scrollListenerCleanup = null;
let _hoverListenerCleanups = [];

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
    const cardGrid = document.querySelector("[data-home-project='card-grid']");

    const cardWrapper = document.querySelector(
      "[data-home-project='grid-wrapper']",
    );

    const initialBox = document.querySelector(
      "[data-home-project='initial-box']",
    );
    const finalBox = document.querySelector("[data-home-project='final-box']");
    const title = document.querySelector("[data-home-project='title']");

    let scaleFactor = 1;

    if (cards.length) {
      // scaleFactor = cardWrapper.offsetWidth / cards[0].offsetWidth;
      scaleFactor = Math.round(
        (cardWrapper.offsetWidth / cards[0].offsetWidth) * 100
      ) / 100;
    }

    const titleSplit = new SplitText(title, {
      type: "words",
    });

    const mainTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom top",
        pin: pinEl,
        scrub: true,
				// markers: true,
				pinSpacing: false,
        invalidateOnRefresh: true, // 👈 REQUIRED for Flip
        anticipatePin: 1,  
      },
    });

    const finalState = Flip.getState(finalBox);

    // ========== TITLE ANIMATION ========== //
    mainTl.from(titleSplit.words, {
      yPercent: -30,
      opacity: 0,
      filter: "blur(20px)",
      duration: 0.2,
      stagger: { each: 0.05 },
      ease: "none",
    });

    mainTl.addLabel("textEnter", "+=0.3");

    mainTl.to(
      titleSplit.words,
      {
        // yPercent: -30,
        opacity: 0,
        filter: "blur(20px)",
        // stagger: { start: "end", each: 0.01 },
        ease: "none",
        // duration: 0.2,
        duration: 0.4,
      },
      "textEnter",
    );
    

    mainTl.addLabel("textEnd");

    // ========== REMOVING HOVER ON SCROLL ========== //
    let hoveredCard = null;
    let hoveredCardParent = null;
    let isScrolling = false;

    function resetCardIfHovered() {
      if (hoveredCard) resetCard(hoveredCard);
    }

    function resetCardParentIfHovered() {
      if (hoveredCardParent) resetCardParent(hoveredCardParent);
    }

    let scrollDebounce;
    let hasPointerMovedSinceInit = false;
    const onFirstPointerMove = () => {
      hasPointerMovedSinceInit = true;
      window.removeEventListener("pointermove", onFirstPointerMove);
    };
    window.addEventListener("pointermove", onFirstPointerMove, { passive: true });

    function onPhysicalScroll() {
      // Clear previous debounce
      clearTimeout(scrollDebounce);

      // Set new debounce to trigger after 50ms of no physical scroll
      scrollDebounce = setTimeout(() => {
        resetCardIfHovered();
        resetCardParentIfHovered();
      }, 50);
    }

    window.addEventListener("wheel", onPhysicalScroll, { passive: true });
    window.addEventListener("touchmove", onPhysicalScroll, { passive: true });

    _scrollListenerCleanup = () => {
      window.removeEventListener("wheel", onPhysicalScroll);
      window.removeEventListener("touchmove", onPhysicalScroll);
      window.removeEventListener("pointermove", onFirstPointerMove);
      clearTimeout(scrollDebounce);
    };


    // ========== CARD ENTRY HOVER ========== //
    let baseY = new Map();
    /* cards.forEach((card, i) => {
      const cardFolderHoverBg = card.querySelector("[data-folder-bg = 'hover']");
      const cardFolderTag = card.querySelector("[data-folder = 'tag']");
      const cardFolderDesc = card.querySelector("[data-folder = 'description']");

      if (!card.classList.contains("is-interactive")) return;
      const hoverOffset = -4.5;

      card.addEventListener("mouseenter", () => {
        if (!card.classList.contains("is-interactive")) return;

        hoveredCard = card;

        gsap.to(card, {
          y: `${baseY.get(card) + hoverOffset}%`,
          duration: 0.5,
          ease: "back.out(2)",
          overwrite: "auto",
          force3D: true, // GPU acceleration
        });
        gsap.to(cardFolderHoverBg, {
          opacity: 1,
          ease: "power1.inOut",
          duration: 0.3,
        })
        gsap.to(cardFolderTag, {
          backgroundImage: "linear-gradient(135deg, #FFF68D, #FFF14B)",
          // color: "#FFEBB6",
          ease: "power1.inOut",
          duration: 0.3,
        })
        gsap.to(cardFolderDesc, {
          color: "#FFEBB6",
          ease: "power1.inOut",
          duration: 0.3,
        })
      });

      card.addEventListener("mouseleave", () => {
        resetCard(card);
      });
    }); */

    function resetCard(card) {
      const cardFolderHoverBg = card.querySelector("[data-folder-bg = 'hover']");
      const cardFolderTag = card.querySelector("[data-folder = 'tag']");
      const cardFolderDesc = card.querySelector("[data-folder = 'description']");

      if (!card || !card.classList.contains("is-interactive")) return;

      gsap.to(card, {
        y: `${baseY.get(card)}%`,
        duration: 0.5,
        ease: "power3.inOut",
        overwrite: "auto",
        force3D: true, // GPU acceleration
      });
      gsap.to(cardFolderHoverBg, {
        opacity: 0,
        ease: "power1.inOut",
        duration: 0.3,
      })
      gsap.to(cardFolderTag, {
        backgroundImage: "linear-gradient(135deg, #FFF, #FFF)",
        // color: "#FFEBB6",
        ease: "power1.inOut",
        duration: 0.3,
      })
      gsap.to(cardFolderDesc, {
        color: "#FFF",
        ease: "power1.inOut",
        duration: 0.3,
      })

      if (hoveredCard === card) {
        hoveredCard = null;
      }
    }
    
    // gsap.set(cardParents, { scale: `${scaleFactor + 2}` });

    // ========== CARDS ENTRY ========== //
    cardParents.forEach((cardParent, i) => {
      mainTl.fromTo(
        cardParent,
        { scale: scaleFactor + 2 },
        {
          scale: scaleFactor + 0.35,
          duration: 0.8,
          ease: "back.out(1.7)",
        },
        `textEnter+=${i * 0.05}`,
      );
    });
    cards.forEach((card, i) => {
      const targetY = `${(cardParents.length - i) * -3 - 6}%`;
      // Calculate and store baseY immediately (target value after animation)
      baseY.set(card, parseFloat(targetY));
      mainTl.fromTo(
        card,
        { y: 0 },
        {
          y: targetY,
          duration: 0.6,
          ease: "back.out(1.7)",
          // force3D: true, // GPU acceleration
        },
        `textEnter+=${i * 0.05}`,
      );
    });

    // mainTl.set(cards, { pointerEvents: "auto" });

    mainTl.addLabel("initial", "+=0.3");

    // DISABLING HOVER WHILE ANIMATING
    // mainTl.set(cards, { pointerEvents: "none" }, mainTl.labels.initial - 0.2);

    // ========== REMOVE HOVER ========== //
    /* mainTl.to(
      {},
      {
        duration: 0.001,
        onStart: () => {
          cards.forEach((card) => card.classList.remove("is-interactive"));
        },
        onReverseComplete: () => {
          cards.forEach((card) => card.classList.add("is-interactive"));
        },
      },
      mainTl.labels.initial + 0.1,
    ); */

    // ========== CARD PLACE ========== //
    cardParents.forEach((cardParent, i) => {
      const q = gsap.utils.selector(cardParent);
      const card = cardParent.querySelector(".home-project__card");
      const cardFolder = cardParent.querySelector(".card-folder");
      const folderImage = cardParent.querySelector(".folder__image-wrapper");
      const folderDescription = cardParent.querySelector(
        ".folder__description-text",
      );

      mainTl.add(
        Flip.fit(cardParent, cardBoxes[i], {
          duration: 0.8,
          fitChild: q(".home-project__card"),
          absolute: true,
          scale: true,
          simple: true,
          ease: "power3.inOut",
          immediateRender: false,
        }),
        mainTl.labels.initial + i * 0.1,
      );

      mainTl.to(
        card,
        {
          y: 0,
          duration: 0.8,
          ease: "power3.inOut",
        },
        mainTl.labels.initial + i * 0.1,
      );

      mainTl.fromTo(
        folderImage,
        {
          y: 10,
          opacity: 0,
        },
        {
          y: 0,
          rotation: 0,
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: "power3.out",
        },
        mainTl.labels.initial + 0.52 + i * 0.1,
      );
      mainTl.fromTo(
        folderDescription,
        {
          opacity: 0,
        },
        {
          opacity: 1,
          duration: 0.6,
          ease: "power3.out",
        },
        mainTl.labels.initial + 0.62 + i * 0.1,
      );

      mainTl.to(
        {},
        {
          duration: 0.001,
          onStart: () => {
            cardParent.classList.add("is-placed")
            gsap.set(card, { pointerEvents: "auto" });
          },
          onReverseComplete: () => {
            cardParent.classList.remove("is-placed")
            gsap.set(card, { pointerEvents: "none" });
          },
        },
        mainTl.labels.initial + 0.8 + i * 0.1,
      );
    });

    mainTl.addLabel("final", "+=0.3");

    // ========== CARD PLACE HOVER ========== //
    function resetCardParent(cardParent) {
      if (!cardParent || !cardParent.classList.contains("is-placed")) return;

      const previewFiles = cardParent.querySelectorAll(".folder__preview__file");
      const cardFolder = cardParent.querySelector(".card-folder");
      const cardFolderHoverBg = cardFolder.querySelector("[data-folder-bg = 'hover']");
      const cardFolderTag = cardFolder.querySelector("[data-folder = 'tag']");
      const cardFolderDesc = cardFolder.querySelector("[data-folder = 'description']");

      cardParents.forEach((siblingCardparent) => {
          siblingCardparent.classList.remove("is-disabled");
      })

      previewFiles.forEach((previewFile, fileIndex) => {
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

      gsap.to(cardFolder, {
        transformOrigin: "50% 50%",
        scale: 1,
        ease: "power1.inOut",
        duration: 0.3,
      })
      gsap.to(cardFolderHoverBg, {
        opacity: 0,
        ease: "power1.inOut",
        duration: 0.3,
      })
      gsap.to(cardFolderTag, {
        backgroundImage: "linear-gradient(135deg, #FFF, #FFF)",
        // color: "#FFEBB6",
        ease: "power1.inOut",
        duration: 0.3,
      })
      gsap.to(cardFolderDesc, {
        color: "#FFF",
        ease: "power1.inOut",
        duration: 0.3,
      })

      if (hoveredCardParent === cardParent) {
        hoveredCardParent = null;
      }
    }

		cardParents.forEach((cardParent, i) => {
      const previewFiles = cardParent.querySelectorAll(".folder__preview__file");
      const cardFolder = cardParent.querySelector(".card-folder");

      const cardFolderHoverBg = cardFolder.querySelector("[data-folder-bg = 'hover']")
      const cardFolderTag = cardFolder.querySelector("[data-folder = 'tag']");
      const cardFolderDesc = cardFolder.querySelector("[data-folder = 'description']");

      const onEnter = () => {
        if (!hasPointerMovedSinceInit) return;
        if (!cardParent.classList.contains("is-placed")) return;

        hoveredCardParent = cardParent;

        cardParents.forEach((siblingCardparent) => {
          if(siblingCardparent !== cardParent) {
            siblingCardparent.classList.add("is-disabled");
          }
        })

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
            rotation: rotation,
            scale: 1,
            duration: 0.25,
            ease: "back.out(1.7)",
            delay: fileIndex * 0.025,
            overwrite: "auto",
          });
        });

        gsap.to(cardFolder, {
          transformOrigin: "50% 50%",
          scale: 1.05,
          ease: "power1.inOut",
          duration: 0.3,
        })
        gsap.to(cardFolderHoverBg, {
          opacity: 1,
          ease: "power1.inOut",
          duration: 0.3,
        })
        gsap.to(cardFolderTag, {
          backgroundImage: "linear-gradient(135deg, #FFF68D, #FFF14B)",
          // color: "#FFEBB6",
          ease: "power1.inOut",
          duration: 0.3,
        })
        gsap.to(cardFolderDesc, {
          color: "#FFEBB6",
          ease: "power1.inOut",
          duration: 0.3,
        })
      };

      const onLeave = () => {
        resetCardParent(cardParent);
      };

      cardParent.addEventListener("mouseenter", onEnter);
      cardParent.addEventListener("mouseleave", onLeave);

      _hoverListenerCleanups.push(() => {
        cardParent.removeEventListener("mouseenter", onEnter);
        cardParent.removeEventListener("mouseleave", onLeave);
      });
    });

    // ========== CARD OUT ========== //
    cardParents.forEach((cardParent, i) => {
      const card = cardParent.querySelector(".home-project__card");

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
            cardParent.classList.remove("is-placed")
            gsap.set(card, { pointerEvents: "none" });
          },
          onReverseComplete: () => {
            cardParent.classList.add("is-placed")
            gsap.set(card, { pointerEvents: "auto" });
          },
        },
        mainTl.labels.final + i * 0.1,
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
        mainTl.labels.final + i * 0.1,
      );

      mainTl.to(
        card,
        {
          transformOrigin: "center",
          rotation: targetRotation,
          duration: 0.4,
          ease: "power3.in",
        },
        mainTl.labels.final + i * 0.1,
      );
    });
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

window.addEventListener(
  "resize",
  debounce(() => {
    ScrollTrigger.refresh();
    createTimeline();
  }, 150),
);

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});
