gsap.registerPlugin(ScrollTrigger);

let flipTitleCtx;
let flipHeadlineCtx;

document.addEventListener("DOMContentLoaded", () => {
    ScrollTrigger.refresh();
    const createTitleAnimTimeline = () => {
        flipTitleCtx && flipTitleCtx.revert();

        flipTitleCtx = gsap.context(() => {
            const animTitles = document.querySelectorAll("[data-case-anim='title']");

            document.fonts.ready.then(() => {
                animTitles.forEach((title, index) => {
                    const underlinedWords = title.querySelectorAll(".u-text-style-underline");
                    if (underlinedWords) {
                        gsap.set(underlinedWords, {
                            textDecorationColor: "rgba(224, 224, 0, 0)"
                        });
                    }

                    const animTitleTl = gsap.timeline({
                        scrollTrigger: {
                            trigger: title,
                            start: "top 60%",
                            // markers: true,
                        },
                    });

                    const animTitleSplit = new SplitText(title, {
                        type: "words",
                        wordsClass: "anim-title-word",
                    });

                    const allWords = title.querySelectorAll(".anim-title-word");
                    gsap.set(allWords, { willChange: "transform, opacity, filter" });

                    animTitleTl.fromTo(
                        allWords,
                        {
                            opacity: 0,
                            filter: "blur(20px)",
                            yPercent: -100,
                        },
                        {
                            opacity: 1,
                            filter: "blur(0px)",
                            yPercent: 0,
                            duration: 0.6,
                            ease: "power3.out",
                            stagger: {
                                each: 0.04,
                            },
                        });
                    animTitleTl.call(() => {
                        animTitleSplit.revert();
                    });
                    if (underlinedWords) {
                        animTitleTl.add(() => {
                            const freshUnderlinedWords = title.querySelectorAll(".u-text-style-underline");
                            gsap.fromTo(freshUnderlinedWords,
                                {
                                    textDecorationColor: "rgba(224, 224, 0, 0)",
                                },
                                {
                                    textDecorationColor: "rgba(224, 224, 0, 1)",
                                    duration: 0.4,
                                    ease: "power2.out",
                                    stagger: {
                                        each: 0.03,
                                    },
                                });
                        });
                    }

                    // GSDevTools.create({ animation: heroTl });
                });
            });
        });
    };

    const createHeadlineAnimTimeline = () => {
        flipHeadlineCtx && flipHeadlineCtx.revert();

        flipHeadlineCtx = gsap.context(() => {
            const animHeadline = document.querySelector("[data-case-anim='headline']");
            const cardGradient = document.querySelector("[data-case-anim='hero-card-gradient']");
            const cardOverlay = document.querySelector("[data-case-anim='hero-card-overlay']");
            const caseNav = document.querySelector("[data-case-anim='nav']");

            document.fonts.ready.then(() => {
                const animeHeroCardTl = gsap.timeline({
                    // paused: true,
                });

                const animHeadlineSplit = new SplitText(animHeadline, {
                    type: "words",
                    wordsClass: "anim-headline-word",
                });

                const allWords = animHeadlineSplit.words;
                gsap.set(allWords, { willChange: "transform, opacity, filter" });
                gsap.set(animHeadline, { opacity: 1 });

                animeHeroCardTl.fromTo(cardGradient, {
                    opacity: 0,
                }, {
                    opacity: 1,
                    duration: 0.5,
                    ease: "power1.out",
                });
                
                animeHeroCardTl.fromTo(caseNav, {
                    opacity: 0,
                    yPercent: -100,
                }, {
                    opacity: 1,
                    yPercent: 0,
                    duration: 0.5,
                    ease: "power1.out",
                }, 0.1);
                animeHeroCardTl.fromTo(cardOverlay, {
                    opacity: 0,
                }, {
                    opacity: 1,
                    duration: 0.5,
                    ease: "power1.out",
                }, 0.1);
                

                animeHeroCardTl.fromTo(
                    allWords,
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
                    onComplete: () => {
                            animHeadlineSplit.revert();
                        },
                    },
                    "-=0.25"
                );

                    // GSDevTools.create({ animation: animeHeroCardTl });
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

    createTitleAnimTimeline();
    createHeadlineAnimTimeline();

    window.addEventListener(
        "resize",
        debounce(() => {
            ScrollTrigger.refresh();
            createTitleAnimTimeline();
            createHeadlineAnimTimeline();
        }, 150),
    );

    window.addEventListener("load", () => {
        ScrollTrigger.refresh();
    });
});