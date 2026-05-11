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

  loaderAnimation()