// import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.182.0/build/three.module.js";
// import { HDRLoader } from "https://cdn.jsdelivr.net/npm/three@0.182.0/examples/jsm/loaders/HDRLoader.js";
import * as THREE from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";


gsap.registerPlugin(MotionPathPlugin, SplitText, ScrollTrigger);

// disc array
const discs = [
  {
    text: {
      number: 1,
      titleLine1: "Look &",
      titleLine2: "Understand",
    },
    position: {
      start: { x: -1.55, y: 1, z: 6.2 },
      end: { x: -1.23, y: 0.17, z: 0.25 },
      exit: { x: -2, y: 1.5, z: 3 },
    },
    rotation: {
      start: { x: -0.2, y: -0.3, z: -0.6 },
      end: { x: -0.4, y: 0.75, z: 0.5 },
      exit: { x: -0.55, y: 1, z: 0.3 },
    },
  },
  {
    text: {
      number: 2,
      titleLine1: "Discover &",
      titleLine2: "Validate",
    },
    position: {
      start: { x: 0.05, y: 0.65, z: 5 },
      end: { x: -0.52, y: -0.1, z: -0.43 },
      exit: { x: -0.9, y: 1.5, z: 2.35 },
    },
    rotation: {
      start: { x: -0.15, y: 0.1, z: -0.3 },
      end: { x: 0, y: -0.15, z: -0.05 },
      exit: { x: 0.55, y: -0.4, z: 0.05 },
    },
  },
  {
    text: {
      number: 3,
      titleLine1: "Concept",
      titleLine2: "Exploration",
    },
    position: {
      start: { x: 1.5, y: 1.3, z: 6.8 },
      end: { x: 0.3, y: 0.15, z: 0.1 },
      exit: { x: 0.6, y: 1.3, z: 3.4 },
    },
    rotation: {
      start: { x: 0.05, y: 0.5, z: -0.5 },
      end: { x: 0.25, y: 0.35, z: -0.15 },
      exit: { x: 0.7, y: 0.5, z: -0.2 },
    },
  },

  {
    text: {
      number: 4,
      titleLine1: "Make",
      titleLine2: "Designs",
    },
    position: {
      start: { x: 2.7, y: 1.2, z: 5.4 },
      end: { x: 1.25, y: 0, z: -0.25 },
      exit: { x: 1.6, y: 1.3, z: 2.55 },
    },
    rotation: {
      start: { x: 0.15, y: -0.3, z: -0.45 },
      end: { x: -0.4, y: 0.15, z: 0 },
      exit: { x: -0.2, y: 0.4, z: -0.1 },
    },
  },
  {
    text: {
      number: 5,
      titleLine1: "Listen &",
      titleLine2: "Implement",
    },
    position: {
      start: { x: -1.8, y: -0.85, z: 5.8 },
      end: { x: -0.95, y: -0.82, z: -0.04 },
      exit: { x: -1.5, y: 1.5, z: 2.5 },
    },
    rotation: {
      start: { x: 1.05, y: -0.3, z: 0.3 },
      end: { x: -0.4, y: 0.3, z: -0.25 },
      exit: { x: 0.35, y: -0.15, z: 0.3 },
    },
  },
  {
    text: {
      number: 6,
      titleLine1: "Design",
      titleLine2: "Validation",
    },
    position: {
      start: { x: 0.2, y: -1.35, z: 6.6 },
      end: { x: -0.05, y: -1, z: 0.25 },
      exit: { x: -0.25, y: 1.45, z: 3 },
    },
    rotation: {
      start: { x: 0.4, y: 0.5, z: 0.6 },
      end: { x: -0.55, y: 0.45, z: 0.32 },
      exit: { x: 0.35, y: -0.25, z: 0.25 },
    },
  },
  {
    text: {
      number: 7,
      titleLine1: "Deliver &",
      titleLine2: "Review",
    },
    position: {
      start: { x: 1.85, y: -0.9, z: 5.6 },
      end: { x: 0.75, y: -0.72, z: 0.42 },
      exit: { x: 1.8, y: 1.3, z: 4 },
    },
    rotation: {
      start: { x: 0.8, y: 0.4, z: 0.5 },
      end: { x: -0.4, y: -0.6, z: -0.15 },
      exit: { x: 0.35, y: 0.8, z: -0.4 },
    },
  },
];

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.mm = gsap.matchMedia();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 0); // Transparent background

    // Enable shadow mapping with VSM for natural soft shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // WebGL context loss/restore: avoid black screen and missing text after restore
    this.contextLost = false;
    const canvas = this.renderer.domElement;
    this._onContextLost = (event) => {
      event.preventDefault();
      this.contextLost = true;
    };
    this._onContextRestored = () => {
      this.contextLost = false;
      // Re-upload canvas textures so text meshes appear again
      if (this.chromeStickerMaterials && this.chromeStickerMaterials.length > 0) {
        this.chromeStickerMaterials.forEach((material) => {
          if (material.map) material.map.needsUpdate = true;
        });
      }
      this.render();
    };
    canvas.addEventListener("webglcontextlost", this._onContextLost, false);
    canvas.addEventListener("webglcontextrestored", this._onContextRestored, false);

    this.camera = new THREE.PerspectiveCamera(
      35,
      this.width / this.height,
      0.01,
      1000
    );

    // this.camera.position.set(0, 0, 4.9);

    this.mm.add({
      isDesktop: "(min-height: 1080px)", // arbitrarily named conditions
      isMobile: "(max-height: 1079px)"
    }, (context) => {
      let { isDesktop, isMobile } = context.conditions;
      
      if (isDesktop) {
        this.camera.position.set(0, 0, 4.9);
      } else if (isMobile) {
        this.camera.position.set(0, 0, 5.5);
      }
    });


    this.isPlaying = true;
    this.isScrolling = false;

    // Mouse tilt: raycaster and progress tracking
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.animationComplete = false; // Set true when scroll timeline completes
    this.lastTimelineProgress = 0; // Used to detect scroll so we revert tilt when user scrolls
    this.mainTimeline = null; // Ref to scroll timeline for syncing originalRotation

    // Tilt settings (similar to vanilla-tilt)
    this.maxTiltX = 12; // degrees
    this.maxTiltY = 12; // degrees
    this.lerpAmount = 0.1; // smoothing factor

    // Track currently hovered plane
    this.hoveredPlane = null;

    // Mouse position relative to disc center (normalized -1 to 1)
    this.relativeMouseX = 0;
    this.relativeMouseY = 0;

    // Pre-allocated vectors to avoid GC pressure in mousemove
    this._discCenter = new THREE.Vector3();
    this._centerScreen = new THREE.Vector3();
    this._intersectScreen = new THREE.Vector3();
    this._discEdge = new THREE.Vector3();

    // Initialize planes array (will be populated after font loads)
    this.planes = [];

    // Font loading flag
    this.customFontLoaded = false;

    this._boundResize = this.resize.bind(this);
    this._boundMouseMove = this.onMouseMove.bind(this);
    this._boundMouseLeave = this.onMouseLeave.bind(this);
    this._boundRender = this.render.bind(this);
    this._scrollUnsubscribe = null;
    this._scrollDelayedCall = null;
    this._rafId = null;

    // Load custom font before creating objects
    this.loadCustomFont().then(() => {
      this.addObjects();
      this.animateReveal();
    });
    this.addLights();
    this.resize();
    this.render();

    this.loadEnvironment();

    this.setupResize();
    this.setupMouseEvents();

    if (lenis) {
      const onScroll = () => {
        this.isScrolling = true;
        if (this.hoveredPlane) this.clearHoverOnScroll();
        if (this._scrollDelayedCall) this._scrollDelayedCall.kill();
        this._scrollDelayedCall = gsap.delayedCall(0.12, () => {
          this.isScrolling = false;
          this._scrollDelayedCall = null;
        });
      };
      lenis.on("scroll", onScroll);
      this._scrollUnsubscribe = () => lenis.off("scroll", onScroll);
    }

  }

  setupResize() {
    window.addEventListener("resize", this._boundResize);
  }

  resize() {
    // this.width = this.container.offsetWidth;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    ScrollTrigger.refresh();
  }

  setupMouseEvents() {
    this.container.addEventListener("mousemove", this._boundMouseMove);
    this.container.addEventListener("mouseleave", this._boundMouseLeave);
  }

  onMouseMove(event) {
    if (this.isScrolling) return;
    // Guard: planes may not be ready yet (font still loading)
    if (!this.planes || this.planes.length === 0) return;

    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to check if hovering over any disc
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.planes);

    if (intersects.length > 0) {
      // Find the disc mesh (could be the hit object or its parent if we hit the text)
      let hitPlane = intersects[0].object;

      // Traverse up to find the disc mesh with userData.originalRotation
      while (hitPlane && !hitPlane.userData.originalRotation) {
        hitPlane = hitPlane.parent;
      }

      // If we couldn't find a valid disc, ignore
      if (!hitPlane) return;

      // New hover: leave previous plane, then use current timeline rotation as tilt base
      if (this.hoveredPlane !== hitPlane) {
        if (this.hoveredPlane) {
          this.triggerPlaneLeave(this.hoveredPlane);
        }

        this.hoveredPlane = hitPlane;

        if (hitPlane.userData.leaveAnimation) {
          hitPlane.userData.leaveAnimation.kill();
          hitPlane.userData.leaveAnimation = null;
        }

        // Tilt base = current rotation from timeline (so tilt works in all phases)
        hitPlane.userData.originalRotation.copy(hitPlane.rotation);
        hitPlane.userData.currentTiltX = 0;
        hitPlane.userData.currentTiltY = 0;
      }

      const intersectPoint = intersects[0].point;

      hitPlane.getWorldPosition(this._discCenter);

      this._centerScreen.copy(this._discCenter).project(this.camera);
      this._intersectScreen.copy(intersectPoint).project(this.camera);

      const discRadius = 0.5;
      this._discEdge.copy(this._discCenter);
      this._discEdge.x += discRadius;
      this._discEdge.project(this.camera);
      const radiusScreen = Math.abs(this._discEdge.x - this._centerScreen.x);

      this.relativeMouseX = (this._intersectScreen.x - this._centerScreen.x) / radiusScreen;
      this.relativeMouseY = (this._intersectScreen.y - this._centerScreen.y) / radiusScreen;

      // Clamp to -1, 1 range
      this.relativeMouseX = Math.max(-1, Math.min(1, this.relativeMouseX));
      this.relativeMouseY = Math.max(-1, Math.min(1, this.relativeMouseY));

      this.updateTilt(hitPlane);
    } else {
      // Not hovering any plane
      if (this.hoveredPlane) {
        this.triggerPlaneLeave(this.hoveredPlane);
        this.hoveredPlane = null;
      }
    }
  }

  onMouseLeave() {
    // Check if planes array exists
    if (!this.planes || this.planes.length === 0) return;

    // Trigger leave for currently hovered plane so it animates back to timeline rotation
    if (this.hoveredPlane) {
      this.triggerPlaneLeave(this.hoveredPlane);
      this.hoveredPlane = null;
    }
  }

  triggerPlaneLeave(plane) {
    // Reset target tilt
    plane.userData.targetTiltX = 0;
    plane.userData.targetTiltY = 0;

    if (plane.userData.leaveAnimation) {
      plane.userData.leaveAnimation.kill();
      plane.userData.leaveAnimation = null;
    }

    // Animate back to original (timeline-driven) rotation
    plane.userData.leaveAnimation = gsap.to(plane.rotation, {
      x: plane.userData.originalRotation.x,
      y: plane.userData.originalRotation.y,
      z: plane.userData.originalRotation.z,
      duration: 0.4,
      ease: "power2.out",
      onComplete: () => {
        plane.userData.leaveAnimation = null;
      },
    });
  }

  clearHoverOnScroll() {
    if (!this.hoveredPlane) return;
    const plane = this.hoveredPlane;

    // Kill any existing leave animation
    if (plane.userData.leaveAnimation) {
      plane.userData.leaveAnimation.kill();
      plane.userData.leaveAnimation = null;
    }

    // Animate the plane back to its original rotation
    plane.userData.leaveAnimation = gsap.to(plane.rotation, {
      x: plane.userData.originalRotation.x,
      y: plane.userData.originalRotation.y,
      z: plane.userData.originalRotation.z,
      duration: 0.4,
      ease: "power2.out",
      onComplete: () => {
        plane.userData.leaveAnimation = null;
      },
    });

    // Reset tilt targets too so your hover loop doesn’t fight this animation
    plane.userData.targetTiltX = 0;
    plane.userData.targetTiltY = 0;

    this.hoveredPlane = null;
  }

  updateTilt(plane) {
    // Calculate tilt based on relative mouse position
    // Mouse Y affects rotation around X axis (up/down tilt)
    // Mouse X affects rotation around Y axis (left/right tilt)
    // Invert Y because screen coordinates are inverted
    plane.userData.targetTiltX = -this.relativeMouseY * this.maxTiltX;
    plane.userData.targetTiltY = this.relativeMouseX * this.maxTiltY;
  }

  addObjects() {
    this.material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.4,
      metalness: 0.8,
      side: THREE.DoubleSide,
      flatShading: false,
      envMapIntensity: 0,
    });

    const radius = 0.5;
    const thickness = 0.01;
    const bevel = 0.01;

    // Create circular shape
    const shape = new THREE.Shape();
    shape.absarc(0, 0, radius, 0, Math.PI * 2, false);

    // Extrude with bevel
    this.geometry = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: thickness,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 64,
    });

    // Store all planes in an array
    this.planes = [];
    this.chromeStickerMaterials = [];

    // Create discs from the discs array
    discs.forEach((discData, index) => {
      const plane = new THREE.Mesh(this.geometry, this.material.clone());

      // Enable shadow casting and receiving
      plane.castShadow = true;
      plane.receiveShadow = true;

      // Set position from disc data
      plane.position.set(
        discData.position.start.x,
        discData.position.start.y,
        discData.position.start.z
      );

      // Set rotation from disc data
      plane.rotation.set(
        discData.rotation.start.x,
        discData.rotation.start.y,
        discData.rotation.start.z
      );

      // Create text mesh with disc data
      const textMesh = this.createTextMesh(
        discData.text.number,
        discData.text.titleLine1,
        discData.text.titleLine2
      );

      textMesh.position.set(0, 0, 0.03);

      // Store the material reference
      this.chromeStickerMaterials.push(this.chromeStickerMaterial);

      // Attach text to disc
      plane.add(textMesh);

      plane.userData.discIndex = index;
      plane.userData.discData = discData;

      // Tilt base: start with start rotation; timeline onUpdate + render keep it in sync with current phase
      plane.userData.originalRotation = new THREE.Euler(
        discData.rotation.start.x,
        discData.rotation.start.y,
        discData.rotation.start.z
      );
      plane.userData.currentTiltX = 0;
      plane.userData.currentTiltY = 0;
      plane.userData.targetTiltX = 0;
      plane.userData.targetTiltY = 0;
      plane.userData.leaveAnimation = null;

      this.planes.push(plane);
      this.scene.add(plane);
    });
  }

  addLights() {
    this.ambient = new THREE.AmbientLight(0xffffff, 0);
    this.scene.add(this.ambient);

    this.rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    this.rimLight.position.set(1.8, 0.475, -1);
    this.rimLight.castShadow = false;
    this.scene.add(this.rimLight);

    // Yellow rim light (no shadow)
    this.rimLightYellow = new THREE.DirectionalLight(0xffff00, 0);
    this.rimLightYellow.position.set(-3.3, 3.15, -6);
    this.rimLightYellow.castShadow = false;
    this.scene.add(this.rimLightYellow);

    // Purple rim light (no shadow)
    this.rimLightPurple = new THREE.DirectionalLight(0xdb73ff, 0);
    this.rimLightPurple.position.set(5, -2, -6);
    this.rimLightPurple.castShadow = false;
    this.scene.add(this.rimLightPurple);

    // Key light - positioned in front, top right - ONLY this casts shadows
    this.keyLight = new THREE.DirectionalLight(0xffffff, 0); // Animates to 0.3 in animateReveal
    this.keyLight.position.set(1.3, 0.05, 6); // Front, top right
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 3;
    this.keyLight.shadow.camera.far = 9;
    this.keyLight.shadow.camera.left = -2;
    this.keyLight.shadow.camera.right = 2;
    this.keyLight.shadow.camera.top = 2;
    this.keyLight.shadow.camera.bottom = -2;
    this.keyLight.shadow.bias = -0.00005;
    this.keyLight.shadow.normalBias = 0.01;
    this.keyLight.shadow.radius = 8;
    this.keyLight.shadow.blurSamples = 20;
    this.scene.add(this.keyLight);

    // Key light - positioned in front, top right - ONLY this casts shadows
    this.keyLight2 = new THREE.DirectionalLight(0xffffff, 0);
    this.keyLight2.position.set(-2.35, 0, 0); // Front, top right
    this.keyLight2.castShadow = false;
    this.scene.add(this.keyLight2);
  }

  async loadCustomFont() {
    const fontUrl =
      "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/67edf8c3959a728a35cae0b1_TT%20Neoris%20Trial%20Medium.ttf";
    const fontName = "TT Neoris Trial";

    try {
      const font = new FontFace(fontName, `url(${fontUrl})`);
      await font.load();
      document.fonts.add(font);
      this.customFontLoaded = true;
    } catch (error) {
      console.error("Failed to load custom font:", error);
      this.customFontLoaded = false;
    }
  }

  createTextMesh(number, titleLine1, titleLine2) {
    const canvas = document.createElement("canvas");
    // Match disc width proportionally - disc diameter is 1.0, text mesh is 0.6
    // Increase canvas width to prevent text cutoff (maintain 2:1 aspect ratio)
    canvas.width = 512;
    canvas.height = 256;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f5f5f5";

    // Layout settings
    const gap = 24;
    const numberFontSize = 78;
    const titleFontSize = 42;
    const titleLineHeight = titleFontSize * 1.0; // 100% line-height

    // Use custom font if loaded, fallback to Arial
    const fontFamily = this.customFontLoaded ? "TT Neoris Trial" : "Arial";

    // Measure number width
    ctx.font = `${numberFontSize}px ${fontFamily}`;
    const numberWidth = ctx.measureText(number.toString()).width;

    // Calculate total content width for centering
    ctx.font = `${titleFontSize}px ${fontFamily}`;
    const titleLine1Width = ctx.measureText(titleLine1).width;
    const titleLine2Width = ctx.measureText(titleLine2).width;
    const maxTitleWidth = Math.max(titleLine1Width, titleLine2Width);

    // Starting X position - align to the left with some padding
    const padding = 40;
    const startX = padding;

    // Vertical center
    const centerY = canvas.height / 2;

    // Draw the number (large, left side, vertically centered)
    ctx.font = `${numberFontSize}px ${fontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(number.toString(), startX, centerY);

    // Draw title lines (smaller, right of number)
    ctx.font = `${titleFontSize}px ${fontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const titleX = startX + numberWidth + gap;
    // Position title lines so they're vertically centered as a group
    const titleBlockHeight = titleLineHeight * 2;
    const titleStartY = centerY - titleBlockHeight / 2 + titleFontSize / 2;

    ctx.fillText(titleLine1, titleX, titleStartY);
    ctx.fillText(titleLine2, titleX, titleStartY + titleLineHeight);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    // Use MeshPhysicalMaterial for clearcoat support
    // envMap will be set later when HDR loads
    // clearcoat 0.999 avoids exact 1.0 to prevent shader precision warnings (X4122) on context restore
    this.chromeStickerMaterial = new THREE.MeshPhysicalMaterial({
      map: texture,
      transparent: true,

      // Chrome/metallic sticker look
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.2,

      // Clearcoat for that glossy sticker finish
      clearcoat: 0.999,
      clearcoatRoughness: 0.05,

      // Reflections (envMapIntensity animates from 0 to 1.5 in animateReveal)
      envMapIntensity: 0,
      reflectivity: 1.0,

      side: THREE.DoubleSide,
      alphaTest: 0.1,
    });

    const geometry = new THREE.PlaneGeometry(1.0, 0.5);
    const mesh = new THREE.Mesh(geometry, this.chromeStickerMaterial);

    return mesh;
  }

  loadEnvironment() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();

    new HDRLoader().load(
      "https://cdn.jsdelivr.net/gh/RoshitShrestha/bishrant-portfolio@1.4.0/empty_warehouse.hdr",
      (hdrTexture) => {
        hdrTexture.mapping = THREE.EquirectangularReflectionMapping;

        const envMap = pmrem.fromEquirectangular(hdrTexture).texture;

        // Apply envMap to ALL chrome sticker materials
        // Do NOT set scene.environment as it would light all materials
        if (
          this.chromeStickerMaterials &&
          this.chromeStickerMaterials.length > 0
        ) {
          this.chromeStickerMaterials.forEach((material) => {
            material.envMap = envMap;
            material.needsUpdate = true;
          });
        }

        this.envMap = envMap;

        hdrTexture.dispose();
        pmrem.dispose();
      },
      undefined,
      (err) => {
        console.error("HDR load failed", err);
      }
    );
  }

  animateReveal() {
    const title = document.querySelector("[data-home-process='title']");
    const btn = document.querySelectorAll("[data-home-process='btn']");
    const trigger = document.querySelector("[data-home-process='section']");
    const pinEl = document.querySelector("[data-home-process='pin']");

    this._titleSplit = new SplitText(title, {
      type: "words",
    });
    const titleSplit = this._titleSplit;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: trigger,
        start: "top top",
        end: "bottom top",
        scrub: true,
        pin: pinEl,
        pinSpacing: false,
        // markers: true,
      },
      onUpdate: () => {
        const progress = tl.progress();
        // Sync originalRotation from timeline for non-hovered planes (tilt base follows current phase)
        this.planes.forEach((plane) => {
          if (plane !== this.hoveredPlane) {
            plane.userData.originalRotation.copy(plane.rotation);
          }
        });
        // If user scrolled while hovering, clear hover so tilt reverts to timeline rotation
        /* if (
          this.hoveredPlane &&
          Math.abs(progress - this.lastTimelineProgress) > 0.001
        ) {
          this.clearHoverOnScroll();
        } */
        this.lastTimelineProgress = progress;
      },
      onComplete: () => {
        this.animationComplete = true;
      },
    });
    this.mainTimeline = tl;

    const duration = 4;

    tl.from(this.rimLight, {
      intensity: 0,
      duration: 0.8,
      ease: "sine.inOut",
    });

    // Rim light orbits around planes[1] (disc 2) once
    const disc2Index = 1;
    const disc2Data = discs[disc2Index];
    const orbitRadius = 2;

    // Calculate disc 2's center position (average of start and end for orbit center)
    const disc2CenterX =
      (disc2Data.position.start.x + disc2Data.position.end.x) / 2;
    const disc2CenterY =
      (disc2Data.position.start.y + disc2Data.position.end.y) / 2;

    tl.to(
      this.rimLight.position,
      {
        duration: 3,
        ease: "sine.inOut",
        motionPath: {
          path: (function () {
            const points = [];
            const segments = 32; // higher = smoother
            for (let i = 0; i <= segments; i++) {
              const angle = -(i / segments) * Math.PI * 2;
              points.push({
                x: disc2CenterX + Math.cos(angle) * orbitRadius,
                y: disc2CenterY + Math.sin(angle) * orbitRadius,
              });
            }
            return points;
          })(),
          curviness: 1,
        },
        z: 2,
      },
      0
    );
    tl.addLabel("rim");
    tl.to(
      this.rimLightYellow,
      { intensity: 0.4, duration: 1.8, ease: "sine.inOut" },
      2.2
    );
    tl.to(
      this.rimLightPurple,
      { intensity: 0.4, duration: 1.8, ease: "sine.inOut" },
      2.2
    );

    tl.to(
      this.ambient,
      { intensity: 0.8, duration: 3.9, ease: "sine.inOut" },
      0.1
    );

    // Animate keyLight intensity from 0 to 0.3
    tl.to(
      this.keyLight,
      { intensity: 0.3, duration: 2, ease: "sine.inOut" },
      2
    );
    tl.to(
      this.keyLight2,
      { intensity: 0.3, duration: 2, ease: "sine.inOut" },
      2
    );

    // Animate chromeStickerMaterials envMapIntensity from 0 to 1.5
    if (this.chromeStickerMaterials && this.chromeStickerMaterials.length > 0) {
      this.chromeStickerMaterials.forEach((material) => {
        tl.to(
          material,
          { envMapIntensity: 1.5, duration: 1.5, ease: "sine.inOut" },
          "rim-=1.5"
        );
      });
    }

    // Animate all discs from start to end with stagger
    const totalDiscs = this.planes.length;
    const staggerDelay = 0.25; // Delay between each disc start

    this.planes.forEach((plane, index) => {
      if (plane && discs[index]) {
        const discData = discs[index];
        // Calculate start time so all animations finish within duration
        // Earlier discs start earlier but have same duration
        const startTime = index * staggerDelay;
        const discDuration = duration - (totalDiscs - 1) * staggerDelay;

        // Animate position from start to end
        tl.to(
          plane.position,
          {
            x: discData.position.end.x,
            y: discData.position.end.y,
            z: discData.position.end.z,
            duration: discDuration,
            ease: "power1.inOut",
          },
          startTime
        );

        // Animate rotation from start to end
        tl.to(
          plane.rotation,
          {
            x: discData.rotation.end.x,
            y: discData.rotation.end.y,
            z: discData.rotation.end.z,
            duration: discDuration,
            ease: "sine.out",
          },
          startTime
        );
      }
    });

    tl.addLabel("exit");

    tl.from(
      titleSplit.words,
      {
        yPercent: -30,
        opacity: 0,
        filter: "blur(20px)",
        duration: 0.4,
        stagger: { each: 0.08 },
        ease: "sine.out",
      },
      1.6
    );
    tl.from(
      btn,
      {
        yPercent: -50,
        opacity: 0,
        filter: "blur(20px)",
        duration: 0.8,
        stagger: 0.15,
        ease: "sine.out",
      },
      2.5
    );

    this.planes.forEach((plane, index) => {
      if (plane && discs[index]) {
        const discData = discs[index];
        // Calculate start time so all animations finish within duration
        // Earlier discs start earlier but have same duration
        const startTime = tl.labels.exit + index * 0.1;
        const discDuration = 1.5;

        // Animate position from start to end
        tl.to(
          plane.position,
          {
            x: discData.position.exit.x,
            y: discData.position.exit.y,
            z: discData.position.exit.z,
            duration: discDuration,
            ease: "expo.in",
          },
          startTime
        );

        // Animate rotation from start to end
        tl.to(
          plane.rotation,
          {
            x: discData.rotation.exit.x,
            y: discData.rotation.exit.y,
            z: discData.rotation.exit.z,
            duration: discDuration,
            ease: "sine.in",
          },
          startTime
        );
      }
    });

    tl.to(
      titleSplit.words,
      {
        yPercent: -30,
        opacity: 0,
        filter: "blur(20px)",
        duration: 0.4,
        stagger: { each: 0.03, from: "end" },
        ease: "sine.in",
      },
      4.9
    );
    tl.to(
      btn,
      {
        yPercent: -50,
        opacity: 0,
        filter: "blur(20px)",
        duration: 0.6,
        stagger: { each: 0.15, from: "end" },
        ease: "sine.in",
      },
      4.5
    );
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.render();
    }
  }

  render() {
    if (this.contextLost) {
      this._rafId = requestAnimationFrame(this._boundRender);
      return;
    }
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    if (!this.isPlaying) return;

    // Keep originalRotation in sync with timeline for non-hovered planes (so tilt base is current each frame)
    if (this.mainTimeline) {
      this.planes.forEach((plane) => {
        if (plane !== this.hoveredPlane) {
          plane.userData.originalRotation.copy(plane.rotation);
        }
      });
    }

    // Apply tilt interpolation when hovering a plane
    if (this.hoveredPlane) {
      const plane = this.hoveredPlane;
      const userData = plane.userData;

      // Smoothly interpolate current tilt towards target tilt
      userData.currentTiltX +=
        (userData.targetTiltX - userData.currentTiltX) * this.lerpAmount;
      userData.currentTiltY +=
        (userData.targetTiltY - userData.currentTiltY) * this.lerpAmount;

      // Apply tilt as offset from original rotation (no lookAt - just tilt from current position)
      plane.rotation.set(
        userData.originalRotation.x +
          THREE.MathUtils.degToRad(userData.currentTiltX),
        userData.originalRotation.y +
          THREE.MathUtils.degToRad(userData.currentTiltY),
        userData.originalRotation.z
      );
    }

    this._rafId = requestAnimationFrame(this._boundRender);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.isPlaying = false;
    if (this._rafId != null) cancelAnimationFrame(this._rafId);
    this._rafId = null;

    window.removeEventListener("resize", this._boundResize);
    if (this.container) {
      this.container.removeEventListener("mousemove", this._boundMouseMove);
      this.container.removeEventListener("mouseleave", this._boundMouseLeave);
    }

    const canvas = this.renderer.domElement;
    if (canvas) {
      canvas.removeEventListener("webglcontextlost", this._onContextLost);
      canvas.removeEventListener("webglcontextrestored", this._onContextRestored);
    }

    if (typeof this._scrollUnsubscribe === "function") this._scrollUnsubscribe();
    if (this._scrollDelayedCall) this._scrollDelayedCall.kill();

    if (this.mm) this.mm.revert();

    if (this._titleSplit) this._titleSplit.revert();

    if (this.mainTimeline) {
      if (this.mainTimeline.scrollTrigger) this.mainTimeline.scrollTrigger.kill();
      this.mainTimeline.kill();
    }

    this.planes?.forEach((plane) => {
      if (plane.userData.leaveAnimation) {
        plane.userData.leaveAnimation.kill();
        plane.userData.leaveAnimation = null;
      }
    });

    this.geometry?.dispose();
    this.material?.dispose();
    if (this.envMap) this.envMap.dispose();
    this.chromeStickerMaterials?.forEach((mat) => {
      if (mat.map) mat.map.dispose();
      mat.dispose();
    });
    this.chromeStickerMaterials = [];
    this.planes?.forEach((plane) => {
      plane.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
    });
    this.planes = [];
    this.scene.clear();
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

const discSketchInstance = new Sketch({
  dom: document.getElementById("home__process-canvas"),
});
export { discSketchInstance };
