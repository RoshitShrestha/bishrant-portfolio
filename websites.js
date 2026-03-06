document.addEventListener('DOMContentLoaded', () => {
    const baseSliderConfig = {
        loop: true,
        slidesPerView: 2,
        spaceBetween: 30,
        centeredSlides: true,
        grabCursor: true,
        loopedSlides: 6,
        watchSlidesProgress: true,
    };
    
    const topSlider = new Swiper('.swiper.is-top', {
        ...baseSliderConfig,
        slidesOffsetAfter: 500
    });
    
    const botSlider = new Swiper('.swiper.is-bot', {
        ...baseSliderConfig,
        slidesOffsetBefore: 500
    });


    /* const marquee = new Swiper('.swiper.is-bot', {
        slidesPerView: 'auto',
        spaceBetween: 30,
        freeMode: true,
        loop: true,
        // loopedSlides: 6,              // must match real slide count
        // loopAdditionalSlides: 6,      // duplicate extra slides
        allowTouchMove: false,
        speed: 1000,                  // controls smoothness
        autoplay: {
            delay: 1,
            disableOnInteraction: false,
        },
      });

      document.querySelector('.swiper.is-bot').addEventListener('mouseenter', () => {
        marquee.autoplay.stop();
        marquee.allowTouchMove = true;
      });
      
      document.querySelector('.swiper.is-bot').addEventListener('mouseleave', () => {
        marquee.autoplay.start();
        marquee.allowTouchMove = false;
      }); */
});