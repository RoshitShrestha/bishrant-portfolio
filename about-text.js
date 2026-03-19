let flipCtx;

function loaderAnimation() {
  const transitionBlock = document.querySelector("[data-transition-page-block]");

  if (!transitionBlock) return Promise.resolve();


  return new Promise((resolve) => {
    const transitionTl = gsap.timeline({
      onComplete: () => {
        gsap.set(transitionBlock, { display: "none" });
        resolve();
      }
    });

    transitionTl.to(transitionBlock, {
      backgroundColor: "hsla(0, 0.00%, 9.00%, 0.00)",
      duration: 0.8,
      ease: "power2.inOut",
    });
    transitionTl.to(transitionBlock, {
      backdropFilter: "blur(0px)",
      duration: 0.4,
      ease: "power2.inOut",
    },  "<+=0.4");
  });
}

const createTimeline = () => {
  flipCtx && flipCtx.revert();

  flipCtx = gsap.context(() => {
    const heroTitles = document.querySelectorAll("[data-about-hero-title]");
    const heroLogo = document.querySelector("[data-about-hero-logo]");

    const heroTl = gsap.timeline({
      paused: true,
      // scrollTrigger: {
      //   trigger: title,
      //   start: "top 50%",
      //   end: "bottom bottom",
      //   scrub: true,
      // },
    });

    heroTl.fromTo(heroLogo, {
      opacity: 0,
      filter: "blur(20px)",
      yPercent: -10,
      z: 600,
    }, {
      opacity: 1,
      filter: "blur(0px)",
      yPercent: 0,
      z: 0,
      duration: 1,
      ease: "power3.out",
    });

    document.fonts.ready.then(() => {
      heroTitles.forEach((title, index) => {
        const titleSplit = new SplitText(title, {
          type: "words",
          wordsClass: "hero-title-word",
        });

        const heroTitleEl = title.querySelectorAll(
          ".hero-title-word, .u-text-style-highlight"
        );

        heroTitleEl.forEach((word) => gsap.set(word.parentNode, { perspective: 1000, display: "inline-block" }));
        // gsap.set(title, { perspective: 1000 });
        // gsap.set(".u-text-style-highlight", { perspective: 1000 });

        heroTl.fromTo(
          heroTitleEl,
          {
            // "will-change": "opacity, transform",
            opacity: 0,
            filter: "blur(20px)",
            xPercent: "random(-100, 100)",
            yPercent: "random(-10, 10)",
            z: "random(500, 950)",
            rotationX: "random(-90, 90)",
          },
          {
            ease: "power3.out",
            opacity: 1,
            filter: "blur(0px)",
            rotationX: 0,
            rotationY: 0,
            xPercent: 0,
            yPercent: 0,
            z: 0,
            duration: 1,
            stagger: {
              each: 0.02,
              from: "random"
            },
            onComplete: () => {
              titleSplit.revert();

              const valuesLink = document.querySelector("[data-scroll-to='values']");
              const valuesSection = document.querySelector("#values");

              valuesLink.addEventListener("click", (e) => {
                // console.log("clicked");
                e.preventDefault();
                lenis.scrollTo(valuesSection, {
                  // offset: -window.innerHeight * 0.5,
                  offset: -128,
                  duration: 1.2,
                  easing: (t) => 1 - Math.pow(1 - t, 3) // optional custom easing
                });
              });
            }
          }, 0
        );

      });

      // GSDevTools.create({ animation: heroTl });
      loaderAnimation().then(() => {
        heroTl.play();
      });
    });


    // ========== EXPERIENCE TITLE ANIMATION ========== //
    const expScrollTrack = document.querySelector("[data-experience-track]");
    const expTitle = document.querySelector("[data-experience-title]");
    const expButtons = document.querySelector("[data-experience-buttons]");
    const expButton = document.querySelectorAll("[data-experience-button]");

    if (!expScrollTrack || !expTitle) return;

    const expTitleSplit = new SplitText(expTitle, {
      type: "words",
      wordsClass: "expTitle__word",
    });

    const expTl = gsap.timeline({
      // paused: true,
      scrollTrigger: {
        trigger: expScrollTrack,
        start: "top 60%",
        end: "bottom bottom",
        // toggleActions: "play none none reverse",
        // scrub: true,
        // pin: true,
        // markers: true,
      },
    });

    expTl.fromTo(expTitleSplit.words,
      {
        yPercent: -30,
        opacity: 0,
        filter: "blur(20px)",
      },
      {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.6,
        stagger: { each: 0.05 },
        ease: "power3.out",
      });

    expTl.fromTo(expButton,
      {
        scale: 0.6,
        opacity: 0,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 1,
        stagger: { each: 0.1 },
        ease: "elastic.out(1, 0.6)"
      }, "<+=0.5");


    // ========== VALUES TITLE ANIMATION ========== //
    const valuesSection = document.querySelector("[data-values-section]");
    const valuesTitle = document.querySelector("[data-values-title]");

    const valuesTitleSplit = new SplitText(valuesTitle, {
      type: "words",
      wordsClass: "valuesTitle__word",
    });

    const valuesTl = gsap.timeline({
      scrollTrigger: {
        trigger: valuesSection,
        start: "top 60%",
        end: "bottom bottom",
        // toggleActions: "play none none reverse",
        // scrub: true,
        // markers: true,
      },
    });

    valuesTl.fromTo(valuesTitleSplit.words,
      {
        yPercent: -30,
        opacity: 0,
        filter: "blur(20px)",
      },
      {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.6,
        stagger: { each: 0.05 },
        ease: "power3.out",
      });

    // ========== VALUES DESCRIPTION ANIMATION ========== //
    const valuesDescription = document.querySelector("[data-values-description]");
    const valuesDescriptionSplit = new SplitText(valuesDescription, {
      type: "words",
    });
    const valuesDescTl = gsap.timeline({
      scrollTrigger: {
        trigger: valuesDescription,
        start: "top 70%",
        // toggleActions: "play none none reverse",
        // markers: true,
      }
    })
    valuesDescTl.fromTo(valuesDescriptionSplit.words,
      {
        yPercent: -100,
        opacity: 0,
        filter: "blur(20px)",
      },
      {
        yPercent: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.6,
        stagger: { amount: 1 },
        ease: "power3.out",
      });

    // GSDevTools.create({animation: valuesDescTl});
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
    // createTimeline();
  }, 150),
);

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});