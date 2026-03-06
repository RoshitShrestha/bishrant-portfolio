
document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(Flip);
  const transitionDiv = document.querySelector("[data-folder-transition-container]");
  //   data-folder-transition-img
  const folderAnchors = document.querySelectorAll("[data-folder-anchor]");
  const transitionWrapper = document.querySelector("[data-folder-transition-wrapper]");

  const transitionAnchors = document.querySelectorAll("[data-project-transition-anchor]");
  const loadGrid = document.querySelector("[data-load-grid]");

  console.log(transitionAnchors);

  gsap.set(transitionWrapper, { width: window.clientWidth });

  folderAnchors.forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      e.preventDefault();

      let destination = anchor.getAttribute("href");

      const currentBg = anchor.querySelector("[data-folder-transition-img]");
      const currentLogo = anchor.querySelector("[data-folder-img]");
      const project = currentBg.getAttribute('data-wf--card--folder-gradient--variant');

      let initialGradient, finalGradient;

      if (project === "ncell") {
        initialGradient = "linear-gradient(180deg, hsl(282, 100%, 95%), hsl(300, 83%, 94%) 40%, hsl(336, 100%, 93%))";
        finalGradient = "linear-gradient(135deg, hsl(291, 49%, 49%), hsl(279, 39%, 40%) 40%, hsl(259, 72%, 22%))";
      } else if (project === "nic") {
        initialGradient = "linear-gradient(180deg, hsl(0, 100%, 18%), hsl(0, 63%, 50%))";
        finalGradient = "linear-gradient(hsl(0, 79%, 40%), hsl(0, 79%, 18%))";
      } else if (project === "metro-mates") {
        initialGradient = "linear-gradient(180deg, hsl(40, 100%, 99%), hsl(35, 100%, 87%))";
        finalGradient = "linear-gradient(135deg, hsl(22, 88%, 39%), hsl(23, 100%, 38%))";
      } else if (project === "febris") {
        initialGradient = "linear-gradient(180deg, hsl(210, 100%, 68%), hsl(210, 90%, 45%))";
        finalGradient = "linear-gradient(135deg, hsl(210, 80%, 55%), hsl(210, 94%, 41%))";
      } else if (project === "soul-story") {
        initialGradient = "linear-gradient(135deg, hsl(10, 69%, 55%), hsl(8, 72%, 44%))";
        finalGradient = "linear-gradient(135deg, hsl(10, 69%, 55%), hsl(8, 72%, 44%))";
      } else if (project === "websites") {
        initialGradient = "linear-gradient(135deg, hsl(312, 74%, 55%), hsl(311, 66%, 45%))";
        finalGradient = "linear-gradient(135deg, hsl(312, 57%, 50%), hsl(313, 88%, 36%))";
      } else {
        initialGradient = "linear-gradient(180deg, hsl(0, 0%, 100%), hsl(0, 0%, 100%))";
        finalGradient = "linear-gradient(180deg, hsl(0, 0%, 100%), hsl(0, 0%, 100%))";
      }

      // gsap.set(currentBg, { borderRadius: 10 });
      gsap.set(transitionDiv, { opacity: 0 });
      const state = Flip.getState(currentBg, {
        props: "borderRadius"
      });
      transitionDiv.appendChild(currentBg);

      const tl = gsap.timeline({
        onComplete: () => {
          window.location = destination;
        }
      });
      
      tl.to(currentLogo, { 
        opacity: 0, 
        duration: 0.3, 
        ease: "power2.in",
      });
      tl.to(transitionDiv, { 
        opacity: 1, 
        duration: 0.3, 
        ease: "power2",
      }, "<");

      tl.add(
        Flip.from(state, {
          duration: 0.8,
          ease: "power2.out",
          absolute: true,
        }),
      )

      tl.fromTo(currentBg, {
        backgroundImage: initialGradient,
        borderRadius: 5,
      }, { 
        opacity: 1,
        backgroundImage: finalGradient,
        borderRadius: 10,
        duration: 0.8, 
        ease: "power3.in" 
      }, "<");

    });
  });

  function transitionPage(e, transitionAnchor) {
    e.preventDefault();

    let destination = transitionAnchor.getAttribute("href");
    let q = gsap.utils.selector(loadGrid);

    gsap.set(loadGrid, { display: "grid" });
    gsap.fromTo(q(".load_grid-item"), {
      opacity: 0,
    }, {
      opacity: 1,
      duration: 0.001,
      stagger: { amount: 0.5, from: "random"},
      onComplete: () => {
        window.location = destination;
      }
    });
  }

  transitionAnchors.forEach((transitionAnchor) => {
    transitionAnchor.addEventListener("click", (e) => {
      transitionPage(e, transitionAnchor);
    });
  });

});
