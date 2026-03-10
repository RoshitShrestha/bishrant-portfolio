// gsap.registerPlugin(ScrollTrigger);

let flipCtx;

const createTimeline = () => {
  flipCtx && flipCtx.revert();

  flipCtx = gsap.context(() => {
    const ctaTitle = document.querySelector('[data-cta="title"]');
    const ctaSection = document.querySelector('[data-cta="section"]');
    const ctaLink = document.querySelector('[data-cta="link"]').querySelector('.u-text-style-hero-p');
    const ctaIcons = document.querySelector('[data-cta="link"]').querySelector('.cta__icons');
    const ctaCards = document.querySelectorAll('[data-cta="card"]');
    const flipCard = document.querySelector('[data-cta-card-flip]');
    const flipCardContent = flipCard.querySelector('.cta__card__content');
    

    if (!ctaTitle || !ctaLink) return;

    new SplitText(".cta__title-text", {
        type: "words",
        wordsClass: "cta__title-word",
    });
    const ctaTitleEl = ctaTitle.querySelectorAll(
        ".cta__title-word, .cta__interactive-container"
    );

    const ctaLinkSplit = new SplitText(ctaLink, {
        type: "words",
        wordsClass: "cta__link-word",
    });
    
    const mainTl = gsap.timeline({
      // paused: true,
      scrollTrigger: {
        trigger: ctaSection,
        start: "top top",
        end: "bottom 20%",
        scrub: true,
        pin: true,
        // markers: true,
      },
    });
    
    mainTl.from(ctaTitleEl, {
      yPercent: -30,
      opacity: 0,
      filter: "blur(20px)",
      duration: 0.6,
      stagger: { each: 0.05 },
      ease: "power3.out",
    });
    mainTl.from(ctaIcons, {
      yPercent: -100,
      opacity: 0,
      filter: "blur(20px)",
      duration: 0.4,
      ease: "power3.out",
    }, 0.8);
    mainTl.from(ctaLinkSplit.words, {
      yPercent: -50,
      opacity: 0,
      filter: "blur(20px)",
      duration: 0.4,
      stagger: { each: 0.05 },
      ease: "power3.out",
    }, 0.85);    
    
    [...ctaCards].reverse().forEach((card, i) => { 
      mainTl.from(card, {
        opacity: 0,
        duration: 0.2,
        ease: "power1.out",
      }, i * 0.4);
      mainTl.from(card, {
        yPercent: 120,
        duration: 1.3,
        rotation: 0,
        scale: 1.2,
        ease: "expo.out",
      }, i * 0.4);
    });

    const flipCardTl = gsap.timeline({paused: true, reversed: true});

    flipCardTl.to(flipCardContent, {
      rotationY: -180,
      duration: 0.8,
      ease: "back.inOut(1.5)",
    });
    flipCardTl.to(flipCardContent, {
      scale: 1.1,
      yPercent: -12,
      yoyo: true,
      repeat: 1,
      duration: 0.4,
      ease: "back.inOut(2)",
    },  "<");

    flipCard.addEventListener("click", () => {
      flipCardTl.reversed() ? flipCardTl.play() : flipCardTl.reverse();
    });

    // GSDevTools.create({animation: mainTl});
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