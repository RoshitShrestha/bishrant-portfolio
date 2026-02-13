
document.addEventListener("DOMContentLoaded", () => { 
gsap.registerPlugin(Flip);
  const transitionDiv = document.querySelector("[data-folder-transition-container]");
//   data-folder-transition-img
  const folderAnchors = document.querySelectorAll("[data-folder-anchor]");
  const transitionWrapper = document.querySelector("[data-folder-transition-wrapper]");

  gsap.set(transitionWrapper, { width: window.clientWidth });

  folderAnchors.forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      
      let destination = anchor.getAttribute("href");

      const currentImg = anchor.querySelector("[data-folder-transition-img]");

      gsap.set(currentImg, { opacity: 1, borderRadius: 10 });

      const state = Flip.getState(currentImg);
      transitionDiv.appendChild(currentImg);

      const tl = gsap.timeline({
        onComplete: () => {
          window.location = destination;
        }
      });
      tl.from(currentImg, { opacity: 1, borderRadius: 10, duration: 0.5, ease: "power1.inOut" });

      tl.add(
        Flip.from(state, {
            duration: 0.5,
            ease: "power1.inOut",
            absolute: true,
          }),
          "<"
      )
    });
  });
});
