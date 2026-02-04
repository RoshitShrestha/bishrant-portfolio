gsap.registerPlugin(Flip, ScrollTrigger);

let flipCtx;

const createTimeline = () => {
  flipCtx && flipCtx.revert();

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
      scaleFactor = cardWrapper.offsetWidth / cards[0].offsetWidth;
    }

    const titleSplit = new SplitText(title, {
      type: "words",
    });

    const mainTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom top",
        scrub: true,
        pin: pinEl,
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

    mainTl.addLabel("textEnter", "+=0.6");

    mainTl.to(
      titleSplit.words,
      {
        yPercent: -30,
        opacity: 0,
        filter: "blur(20px)",
        stagger: { start: "end", each: 0.05 },
        ease: "none",
      },
      "textEnter",
    );

    mainTl.addLabel("textEnd");

    // ========== REMOVING HOVER ON SCROLL ========== //
    let hoveredCard = null;
    let hoveredCardParent = null;
    let isScrolling = false;

    /* lenis.on("scroll", () => {
      if (isScrolling) return;
      isScrolling = true;

      if (hoveredCard) resetCard(hoveredCard);
      if (hoveredCardParent) resetCardParent(hoveredCardParent);

      // throttle resets
      gsap.delayedCall(0.15, () => {
        isScrolling = false;
      });
    }); */
    function resetCardIfHovered() {
      if (hoveredCard) resetCard(hoveredCard);
    }

    function resetCardParentIfHovered() {
      if (hoveredCardParent) resetCardParent(hoveredCardParent);
    }

    let scrollDebounce;
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


    // ========== CARD ENTRY HOVER ========== //
    let baseY = new Map();
    cards.forEach((card, i) => {
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
    });

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


    // ========== CARDS ENTRY ========== //
    cardParents.forEach((cardParent, i) => {
      mainTl.fromTo(
        cardParent,
        { scale: `${scaleFactor + 2}` },
        {
          scale: `${scaleFactor + 0.35}`,
          duration: 0.8,
          ease: "back.out(1.7)",
        },
        `textEnd+=${i * 0.05}`,
      );
    });
    cards.forEach((card, i) => {
      mainTl.fromTo(
        card,
        { y: 0 },
        {
          y: `${(cardParents.length - i) * -3 - 6}%`,
          duration: 0.6,
          ease: "back.out(1.7)",
          onUpdate: () => {
            baseY.set(card, gsap.getProperty(card, "y") || 0);
          },
        },
        `textEnd+=${i * 0.05}`,
      );
    });

    mainTl.set(cards, { pointerEvents: "auto" });

    mainTl.addLabel("initial", "+=0.5");

    // DISABLING HOVER WHILE ANIMATING
    mainTl.set(cards, { pointerEvents: "none" }, mainTl.labels.initial - 0.2);

    // ========== REMOVE HOVER ========== //
    mainTl.to(
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
    );

    // ========== CARD PLACE ========== //
    cardParents.forEach((cardParent, i) => {
      const card = cardParent.querySelector(".home-project__card");
      const cardFolder = cardParent.querySelector(".card-folder");
      const folderImage = cardParent.querySelector(".folder__image-wrapper");
      const folderDescription = cardParent.querySelector(
        ".folder__description-text",
      );

      mainTl.add(
        Flip.fit(cardParent, cardBoxes[i], {
          duration: 0.8,
          fitChild: ".home-project__card",
          absolute: true,
          scale: true,
          simple: true,
          ease: "power3.inOut",
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
    });

    mainTl.addLabel("final", "+=0.5");
    mainTl.set(
      cards,
      { pointerEvents: "auto" },
      mainTl.labels.final - 0.9,
    );

    // ADDING CLASS FOR HOVER AFTER PLACED
    mainTl.to(
      {},
      {
        duration: 0.001,
        onStart: () => {
          cardParents.forEach((card) => card.classList.add("is-placed"));
        },
        onReverseComplete: () => {
          cardParents.forEach((card) => card.classList.remove("is-placed"));
        },
      },
      mainTl.labels.final - 1,
    );

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

      cardParent.addEventListener("mouseenter", () => {
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
      });

      cardParent.addEventListener("mouseleave", () => {
        resetCardParent(cardParent);
      });
    });
    

    // DISABLING HOVER WHILE CARD OUT
    mainTl.set(cards, { pointerEvents: "none" }, mainTl.labels.final - 0.2);
    mainTl.to(
      {},
      {
        duration: 0.001,
        onStart: () => {
          cardParents.forEach((card) => card.classList.remove("is-placed"));
        },
        onReverseComplete: () => {
          cardParents.forEach((card) => card.classList.add("is-placed"));
        },
      },
      mainTl.labels.final,
    );

    // ========== CARD OUT ========== //
    cardParents.forEach((cardParent, i) => {
      const card = cardParent.querySelector(".home-project__card");

      const targetRotation = [0, 3].includes(i)
        ? 20
        : [2, 5].includes(i)
          ? -20
          : 0;

      mainTl.add(
        Flip.fit(cardParent, finalState, {
          duration: 0.4,
          fitChild: ".home-project__card",
          absolute: true,
          scale: true,
          simple: true,
          ease: "power3.in",
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
