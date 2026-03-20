gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {

  const metroMatterAnim = () => {
    const imageDimensionCache = new Map();

    function getScale() {
      const width = window.innerWidth;
      return Math.min(1, Math.max(0.8, 0.8 + (1 - 0.8) * ((width - 1024) / (1440 - 1024))));
    }
    
    let scale = getScale();
    

    const CONFIG = {
      wallThickness: 200,

      gravity: 1,            // was 1.15
      restitution: 0.85,       // was 0.15
      friction: 0.3,           // slightly less sticky

      frictionAirRect: 0.01,   // was 0.005
      frictionAirCircle: 0.015,

      densityRect: 0.002,      // was 0.003
      densityCircle: 0.0025,

      mouseStiffness: 0.5,
      spawnForce: 0.0018
    };

    function loadImageDimensions(src) {
      if (imageDimensionCache.has(src)) return imageDimensionCache.get(src);

      const dimensionPromise = new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight
          });
        };
        img.onerror = () => {
          resolve({ width: 1, height: 1 });
        };
        img.src = src;
      });

      imageDimensionCache.set(src, dimensionPromise);
      return dimensionPromise;
    }

    function createMatterWorld(containerId, shapeType = "circle") {
      const container = document.querySelector(containerId);

      const {
        Engine,
        Render,
        Runner,
        Bodies,
        Composite,
        Mouse,
        MouseConstraint,
        Body
      } = Matter;

      const TAGS = [
        {
          w: 321 * scale,
          h: 54 * scale,
          texture:
            "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/6997e9518745d531a220b8d0_trigger-mechanism.webp"
        },
        {
          w: 459 * scale,
          h: 54 * scale,
          texture:
            "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/6997e951b748a92ff675e0db_fun-educational-replayable.webp"
        },
        {
          w: 258 * scale,
          h: 54 * scale,
          texture:
            "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/69a671354c472314821911ec_507a9a0ad599447f743bccd31813c3d0_sound-%26-touch.webp"
        },
        {
          w: 207 * scale,
          h: 54 * scale,
          texture:
            "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/69a671352f73b2bb145423ca_b9b8185f899027ba509050a4d876bd3c_tactile-toy.webp"
        },
        {
          w: 507 * scale,
          h: 54 * scale,
          texture:
            "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/69a67135976911792b254d93_a21de5721c3f9f9907a57be8e0adb4f8_challenging.webp"
        },
        {
          w: 354 * scale,
          h: 54 * scale,
          texture:
            "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/69a671352a6168ee19b30d21_f1f8cb0c9dab50f8c2554898a0df167c_motor-skills.webp"
        },
        {
          w: 323 * scale,
          h: 54 * scale,
          texture:
            "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/69a671359185895c3e0eb7f2_2022cb1744018590fc733f2a8639935e_early-independence.webp"
        },
        
      ];

      const CIRCLE_TAGS = [
        {
          size: 251 * scale,
          texture:
            "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/69a17a9aeab9868f33c6e32e_simon-says.webp"
        },
        {
          size: 95 * scale,
          texture:
            "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/69a17b190a4b0ae70492b03c_red-95.webp"
        },
        {
          size: 246 * scale,
          texture:
            "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/69a6735ee3ef875bb5317ac6_fidget-toys.webp"
        },
        {
          size: 220 * scale,
          texture:
            "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/69a6735e1abe7cf2c6281977_tamagotchi.webp"
        },
        {
          size: 246 * scale,
          texture:
            "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/69a6735e858ad3db211fa199_tactile.webp"
        },
        {
          size: 52 * scale,
          texture:
            "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/69a6735e9185895c3e0ee48e_yellow-52.webp"
        },
      ];

      const engine = Engine.create();
      engine.positionIterations = 8;
      engine.velocityIterations = 6;
      engine.constraintIterations = 2;
      engine.world.gravity.y = CONFIG.gravity;

      const render = Render.create({
        element: container,
        engine,
        options: {
          width: container.offsetWidth,
          height: container.offsetHeight,
          wireframes: false,
          background: "transparent",
          pixelRatio: 1
        }
      });

      const runner = Runner.create();
      const MAX_SPEED = 20;
      const MAX_SPEED_SQ = MAX_SPEED * MAX_SPEED;
      let containerWidth = container.offsetWidth;

      const ACTIVE_TAGS = shapeType === "circle" ? CIRCLE_TAGS : TAGS;

      const thickness = CONFIG.wallThickness;

      function createWalls(width, height) {
        return {
          ground: Bodies.rectangle(
            width / 2,
            height + thickness / 2 + 0.5,
            width + thickness * 2,
            thickness,
            { isStatic: true }
          ),
          left: Bodies.rectangle(
            -thickness / 2,
            height / 2,
            thickness,
            height * 5,
            { isStatic: true }
          ),
          right: Bodies.rectangle(
            width + thickness / 2,
            height / 2,
            thickness,
            height * 5,
            { isStatic: true }
          )
        };
      }

      let { ground, left, right } = createWalls(
        container.offsetWidth,
        container.offsetHeight
      );

      Composite.add(engine.world, [ground, left, right]);

      async function createTagBody(tag, x, y) {
        const { width: imgW, height: imgH } =
          await loadImageDimensions(tag.texture);

        let body;

        if (shapeType === "circle") {
          const radius = tag.size / 2;
          const scale = tag.size / imgW;

          body = Bodies.circle(x, y, radius, {
            restitution: CONFIG.restitution,
            friction: CONFIG.friction,
            frictionAir: CONFIG.frictionAirCircle,
            density: CONFIG.densityCircle,
            render: {
              sprite: {
                texture: tag.texture,
                xScale: scale,
                yScale: scale
              }
            }
          });
        } else {
          const scaleX = tag.w / imgW;
          const scaleY = tag.h / imgH;

          body = Bodies.rectangle(x, y, tag.w, tag.h, {
            chamfer: { radius: tag.h / 2 },
            restitution: CONFIG.restitution,
            friction: CONFIG.friction,
            frictionAir: CONFIG.frictionAirRect,
            density: CONFIG.densityRect,
            render: {
              sprite: {
                texture: tag.texture,
                xScale: scaleX,
                yScale: scaleY
              }
            }
          });

          // limiting max velocity
          body.plugin.wrap = false;
        }

        // Body.setAngle(body, Math.random() * Math.PI);
        const maxRotation = 15 * (Math.PI / 180);
        Body.setAngle(
          body,
          (Math.random() * 2 - 1) * maxRotation
        );

        Body.applyForce(body, body.position, {
          x: (Math.random() - 0.5) * CONFIG.spawnForce,
          y: 0
        });

        return body;
      }

      Matter.Events.on(engine, "beforeUpdate", () => {
        engine.world.bodies.forEach((b) => {
          if (b.isStatic) return;

          const velocityX = b.velocity.x;
          const velocityY = b.velocity.y;
          const speedSq = velocityX * velocityX + velocityY * velocityY;

          if (speedSq > MAX_SPEED_SQ) {
            const speed = Math.sqrt(speedSq);
            const ratio = MAX_SPEED / speed;
            Matter.Body.setVelocity(b, {
              x: velocityX * ratio,
              y: velocityY * ratio
            });
          }
        });
      });

      Matter.Events.on(engine, "afterUpdate", () => {
        engine.world.bodies.forEach((b) => {
          if (b.isStatic) return;
          if (b.position.x < 0) {
            Matter.Body.setPosition(b, { x: 10, y: b.position.y });
          } else if (b.position.x > containerWidth) {
            Matter.Body.setPosition(b, { x: containerWidth - 10, y: b.position.y });
          }
        });
      });

      async function spawnBodies() {
        const createTasks = ACTIVE_TAGS.map((tag, i) => {
          const x = Math.random() * containerWidth;
          const y = -100 - i * 40;
          return createTagBody(tag, x, y);
        });
        const bodies = await Promise.all(createTasks);
        Composite.add(engine.world, bodies);
      }

      spawnBodies();

      const mouse = Mouse.create(render.canvas);
      const mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: {
          stiffness: CONFIG.mouseStiffness,
          render: { visible: false }
        }
      });

      mouse.element.removeEventListener("wheel", mouse.mousewheel);
      mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);

      Composite.add(engine.world, mouseConstraint);
      render.mouse = mouse;

      function updateBounds() {
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        containerWidth = width;

        render.canvas.width = width;
        render.canvas.height = height;
        render.options.width = width;
        render.options.height = height;

        Composite.remove(engine.world, [ground, left, right]);

        const newWalls = createWalls(width, height);
        ground = newWalls.ground;
        left = newWalls.left;
        right = newWalls.right;

        Composite.add(engine.world, [ground, left, right]);
      }

      window.addEventListener("resize", () => {
        updateBounds();
        scale = getScale();
      });

      function start() {
        Render.run(render);
        Runner.run(runner, engine);
      }

      function stop() {
        Render.stop(render);
        Runner.stop(runner);
      }

      return { start, stop };
    }

    let leftWorld;
    let rightWorld;

    ScrollTrigger.create({
      trigger: "[data-metro-matter='usability']",
      start: "top 75%",
      onEnter: () => {
        if (!leftWorld) {
          leftWorld = createMatterWorld("[data-metro-matter='usability']", "rectangle");
          leftWorld.start();
        }
      },
      onLeave: () => {
        if (leftWorld) leftWorld.stop();
      },
      onEnterBack: () => {
        if (leftWorld) leftWorld.start();
      }
    });

    ScrollTrigger.create({
      trigger: "[data-metro-matter='research']",
      start: "top 75%",
      // markers: true,
      onEnter: () => {
        if (!rightWorld) {
          rightWorld = createMatterWorld("[data-metro-matter='research']", "circle");
          rightWorld.start();
        }
      },
      onLeave: () => {
        if (rightWorld) rightWorld.stop();
      },
      onEnterBack: () => {
        if (rightWorld) rightWorld.start();
      }
    });

  };

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
  metroMatterAnim();
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