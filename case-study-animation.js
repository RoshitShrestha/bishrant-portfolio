gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
    
    const heroCardAnimIn = () => {
        const animHeadline = document.querySelector("[data-case-anim='headline']");
        const cardGradient = document.querySelector("[data-case-anim='hero-card-gradient']");
        const cardOverlay = document.querySelector("[data-case-anim='hero-card-overlay']");
        const caseNav = document.querySelector("[data-case-anim='nav']");
        const caseHeroList = document.querySelectorAll("[data-case-anim='hero-list']");
        const caseHeroScroll = document.querySelectorAll("[data-case-anim='scroll-reveal']");

        document.fonts.ready.then(() => {
            const animHeroCardTl = gsap.timeline();

            const animHeadlineSplit = new SplitText(animHeadline, {
                type: "words",
                wordsClass: "anim-headline-word",
            });

            const caseHeroScrollSplit = new SplitText(caseHeroScroll, {
                type: "chars",
            });

            const allWords = animHeadlineSplit.words;
            gsap.set(allWords, { willChange: "transform, opacity, filter" });
            gsap.set([animHeadline, caseHeroList, caseHeroScroll], { opacity: 1 });

            /* animHeroCardTl.fromTo(cardGradient, {
                opacity: 0,
            }, {
                opacity: 1,
                duration: 0.8,
                ease: "power2.in",
            }); */
            
            animHeroCardTl.fromTo(caseNav, {
                opacity: 0,
                yPercent: -100,
            }, {
                opacity: 1,
                yPercent: 0,
                duration: 1,
                ease: "expo.out",
            }, 0.1);
            
            animHeroCardTl.fromTo(cardOverlay, {
                opacity: 0,
            }, {
                opacity: 1,
                duration: 0.8,
                ease: "power2.in",
            }, 0.1);

            animHeroCardTl.fromTo(
                allWords,
                {
                    yPercent: -50,
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
                0.3
            );

            animHeroCardTl.fromTo(caseHeroScrollSplit.chars, {
                opacity: 0,
            }, {
                opacity: 1,
                duration: 0.1,
                stagger: { each: 0.025 },
                ease: "power1.out",
            },
            0.5
            );

            caseHeroList.forEach((list, indexList) => {
                const listItems = list.querySelectorAll("li");

                listItems.forEach((item, indexItem) => {
                    const itemSplit = new SplitText(item, {
                        type: "chars, words",
                    });

                    animHeroCardTl.fromTo(itemSplit.chars, {
                        opacity: 0,
                    }, {
                        opacity: 1,
                        duration: 0.1,
                        stagger: { each: 0.025 },
                        ease: "power1.out",
                    },
                    0.5 + indexList * 0.1 + indexItem * 0.1
                );

                });
            });
        });
    };

    const titleAnimIn = () => {
        const animTitles = document.querySelectorAll("[data-case-anim='title']");
        
        document.fonts.ready.then(() => {
            animTitles.forEach((title) => {
                const duration = parseFloat(title.dataset.caseAnimDuration) || 0.6;
                const stagger = parseFloat(title.dataset.caseAnimStagger) || 0.015;

                const underlinedWords = title.querySelectorAll(".u-text-style-underline");
                if (underlinedWords.length) {
                    gsap.set(underlinedWords, {
                        textDecorationColor: "rgba(224, 224, 0, 0)"
                    });
                }

                const animTitleTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: title,
                        start: "top 75%",
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
                        duration: duration,
                        ease: "power2.out",
                        stagger: { each: stagger },
                    }
                );
                
                animTitleTl.call(() => {
                    animTitleSplit.revert();
                });
                
                if (underlinedWords.length) {
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
                                stagger: { each: 0.03 },
                            }
                        );
                    });
                }
            });
        });
    };

    /* const numberCardAnimIn = () => {
        const surveyTrigger = document.querySelector("[data-nic-anim='survey-trigger']");
        const surveyCards = document.querySelectorAll("[data-nic-card='survey-card']");
        const surveyParagraph = document.querySelector("[data-nic-anim='survey-paragraph']");

        const mainTl = gsap.timeline({
            delay: 0.3,
            scrollTrigger: {
                trigger: surveyTrigger,
                start: "top 75%",
            },
        });

        mainTl.from(surveyParagraph, {
            y: 16,
            opacity: 0,
            duration: 0.6,
            ease: "sine.in",
        })

        surveyCards.forEach((card, indexCard) => {
            const animNumber = card.querySelectorAll("[data-nic-card='number']");
            const animTexts = card.querySelectorAll("[data-nic-card='num-text']");
            const animBorders = card.querySelectorAll("[data-nic-card='border']");
            
            const animCardTl = gsap.timeline();

            animCardTl.from(card, {
                y: 32,
                opacity: 0,
                duration: 0.6,
                ease: "sine.inOut",
            })
            animCardTl.from(animNumber, {
                innerText: 0,
                duration: 0.8,
                ease: "sine.out",
                stagger: { each: 0.05 },
                snap: {
                    innerText: 1,
                }
            }, 0)
            animCardTl.from(animBorders, {
                scaleX: 0,
                duration: 0.8,
                ease: "power2.out",
                transformOrigin: "left center",
                stagger: { each: 0.05 },
            }, 0.1)

            document.fonts.ready.then(() => {
                animTexts.forEach((animText, indexText) => {
                    const animTextSplit = new SplitText(animText, {
                        type: "chars",
                    });
        
                    animCardTl.fromTo(animTextSplit.chars, {
                        opacity: 0,
                    }, {
                        opacity: 1,
                        duration: 0.1,
                        stagger: { each: 0.02 },
                        ease: "sine.out",
                    },
                    0.1 + indexText * 0.05
                    );
                });
            });
            mainTl.add(animCardTl, indexCard * 0.2 + 0.1);
        });
    }; */

    /* const paragraphAnimIn = () => {
        const animParagraphs = document.querySelectorAll("[data-case-anim='paragraph']");

        document.fonts.ready.then(() => {
            animParagraphs.forEach((paragraph) => {
                const animParagraphTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: paragraph,
                        start: "top 75%",
                        // markers: true,
                    },
                });

                animTitleTl.fromTo(
                    paragraph,
                    {
                        opacity: 0,
                        y: 16,
                    },
                    {
                        opacity: 1,
                        yPercent: 0,
                        duration: 0.6,
                        ease: "sine.in",
                    }
                );
            });
        });
    }; */

    const metroListAnimIn = () => {
        const metroTriggers = document.querySelectorAll("[data-metro-anim='list-trigger']");
        

        metroTriggers.forEach((metroTrigger, indexTrigger) => {
            const lists = metroTrigger.querySelectorAll("[data-metro-list='list']");

            const mainTl = gsap.timeline({
                scrollTrigger: {
                    trigger: metroTrigger,
                    start: "top 75%",
                    // markers: true,
                },
            });

            document.fonts.ready.then(() => {
                lists.forEach((list, indexList) => {
                    const listStrokes = list.querySelectorAll("[data-metro-list='stroke']");
                    const listTexts = list.querySelectorAll("[data-metro-list='text']");
                    const listTitle = list.querySelector("[data-metro-list='title']");

                    const animMetroListTl = gsap.timeline();

                    const listTitleSplit = new SplitText(listTitle, {
                        type: "chars",
                    });

                    animMetroListTl.fromTo(
                        listTitleSplit.chars, 
                    {
                        opacity: 0,
                    },
                    {    
                        opacity: 1,
                        duration: 0.1,
                        stagger: 0.025,
                        ease: "power2.out",
                    });

                    animMetroListTl.fromTo(
                        listStrokes,
                        {
                            drawSVG: "0%",
                        },
                        {
                            drawSVG: "100%",
                            duration: 0.4,
                            ease: "sine",
                            stagger: 0.1,
                        }, 
                        0.05
                    );

                    listTexts.forEach((text, indexText) => {
                        const textSplit = new SplitText(text, {
                            type: "chars",
                        });

                        animMetroListTl.fromTo(textSplit.chars, {
                            opacity: 0,
                        }, {    
                            opacity: 1,
                            duration: 0.1,
                            stagger: 0.025,
                            ease: "power2.out",
                        }, indexText * 0.1 + 0.1);
                    });

                    mainTl.add(animMetroListTl, indexList * 0.1);
                });
            });
        });

        // GSDevTools.create({ animation: mainTl });

    };

    function debounce(fn, ms) {
        let timeout;
        return () => {
            clearTimeout(timeout);
            timeout = setTimeout(fn, ms);
        };
    }

    // Run animations once
    titleAnimIn();
    heroCardAnimIn();
    metroListAnimIn();

    // Only refresh ScrollTrigger on resize
    window.addEventListener(
        "resize",
        debounce(() => {
            ScrollTrigger.refresh();
        }, 150)
    );

    window.addEventListener("load", () => {
        ScrollTrigger.refresh();
    });
});