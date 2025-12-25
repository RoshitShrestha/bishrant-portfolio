// ==============================
// IMPORTS
// ==============================
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
// import gsap from "gsap";

// ==============================
// LOG
// ==============================
console.log("integration");

// ==============================
// SVG PATH
// ==============================
const path =
  "M1341 55.55V57.5518C1340.92 71.7201 1335.26 85.2841 1325.24 95.2934C1315.22 105.303 1301.66 110.947 1287.5 111H1239.8L1227.8 89.9811H1223.2L1211.2 111H1193.8L1181.8 89.9811H1177.2L1165.2 111H1146.8L1134.8 89.9811H1130.2L1118.2 111H1100.8L1088.8 89.9811H1084.2L1072.2 111H1054.8L1042.8 89.9811H1038.2L1026.2 111H1008.8L996.8 89.9811H992.2L980.2 111H962.8L950.8 89.9811H946.2L934.2 111H915.8L903.8 89.9811H899.2L887.2 111H869.8L857.8 89.9811H853.2L841.2 111H823.8L811.8 89.9811H807.2L795.2 111H777.8L765.8 89.9811H761.2L749.2 111H730.8L718.8 89.9811H714.2L702.2 111H684.8L672.8 89.9811H668.2L656.2 111H638.8L626.8 89.9811H622.2L610.2 111H591.8L579.8 89.9811H575.2L563.2 111H545.8L533.8 89.9811H529.2L517.2 111H499.8L487.8 89.9811H483.2L471.2 111H453.8L441.8 89.9811H437.2L425.2 111H406.8L394.8 89.9811H390.2L378.2 111H360.8L348.8 89.9811H344.2L332.2 111H314.8L302.8 89.9811H298.2L286.2 111H268.8L256.8 89.9811H252.2L240.2 111H222.8L210.8 89.9811H206.2L194.2 111H175.8L163.8 89.9811H159.2L147.2 111H129.8L117.8 89.9811H113.2L101.2 111H53.5C39.3444 110.947 25.782 105.303 15.7631 95.2934C5.7441 85.2841 0.0789849 71.7201 0 57.5518V53.4482C0.0528252 39.2718 5.70955 25.6926 15.7342 15.6777C25.7588 5.66276 39.3363 0.0263501 53.5 0H101.2L113.2 21.0189H117.8L129.8 0H147.2L159.2 21.0189H163.8L175.8 0H194.2L206.2 21.0189H210.8L222.8 0H240.2L252.2 21.0189H256.8L268.8 0H286.2L298.2 21.0189H302.8L314.8 0H332.2L344.2 21.0189H348.8L360.8 0H378.2L390.2 21.0189H394.8L406.8 0H425.2L437.2 21.0189H441.8L453.8 0H471.2L483.2 21.0189H487.8L499.8 0H517.2L529.2 21.0189H533.8L545.8 0H563.2L575.2 21.0189H579.8L591.8 0H610.2L622.2 21.0189H626.8L638.8 0H656.2L668.2 21.0189H672.8L684.8 0H702.2L714.2 21.0189H718.8L730.8 0H749.2L761.2 21.0189H765.8L777.8 0H795.2L807.2 21.0189H811.8L823.8 0H841.2L853.2 21.0189H857.8L869.8 0H887.2L899.2 21.0189H903.8L915.8 0H934.2L946.2 21.0189H950.8L962.8 0H980.2L992.2 21.0189H996.8L1008.8 0H1026.2L1038.2 21.0189H1042.8L1054.8 0H1072.2L1084.2 21.0189H1088.8L1100.8 0H1118.2L1130.2 21.0189H1134.8L1146.8 0H1165.2L1177.2 21.0189H1181.8L1193.8 0H1211.2L1223.2 21.0189H1227.8L1239.8 0H1287.5C1301.66 0.0263501 1315.24 5.66276 1325.27 15.6777C1335.29 25.6926 1340.95 39.2718 1341 53.4482V55.55Z";

// ==============================
// ELEMENT SETUP
// ==============================
let peel = null;
let stripHTML = "";

const stripContent = document.querySelector("#strip");
if (stripContent) stripHTML = stripContent.innerHTML;

handleResize();
window.addEventListener("resize", handleResize);

// ==============================
// PEEL LOGIC
// ==============================
function handleResize() {
  const peelEl = document.querySelector("#strip");
  if (!peelEl) return;

  peelEl.innerHTML = stripHTML;
  peel = null;

  const rect = peelEl.getBoundingClientRect();
  const WIDTH = rect.width;
  const HEIGHT = rect.height;
  const CORNER = { x: WIDTH, y: HEIGHT };
  const MAX_DISTANCE = Math.hypot(WIDTH, HEIGHT);
  const AUTO_PEEL_AT = MAX_DISTANCE * 0.2;

  let autoPeeling = false;
  let currentPos = { ...CORNER };
  let stripHoverEnabled = true;

  const SVG_SIZE = { width: 1341, height: 111 };
  const scaleX = WIDTH / SVG_SIZE.width;
  const scaleY = HEIGHT / SVG_SIZE.height;

  peel = new Peel("#strip", {
    path: { d: path, transform: `scale(${scaleX} ${scaleY})` },
    backShadowSize: 0.1,
    backShadowAlpha: 0.1,
    backReflection: true,
    backReflectionAlpha: 0.3,
  });
  peel.setMode("book");

  const initialPos = { x: WIDTH, y: HEIGHT / 2 };
  const hoverPos = { x: WIDTH * 0.98, y: HEIGHT * 0.4 };
  peel.setCorner(initialPos.x, initialPos.y);

  const peelHoverTL = gsap.timeline({
    paused: true,
    defaults: { duration: 0.4, ease: "power1.out" },
  });
  peelHoverTL.to(initialPos, {
    x: hoverPos.x,
    y: hoverPos.y,
    onUpdate: () => peel.setPeelPosition(initialPos.x, initialPos.y),
  });
  peelHoverTL.eventCallback("onReverseComplete", () =>
    peel.setPeelPosition(WIDTH, HEIGHT / 2)
  );

  peelEl.addEventListener(
    "mouseenter",
    () => stripHoverEnabled && peelHoverTL.play()
  );
  peelEl.addEventListener(
    "mouseleave",
    () => stripHoverEnabled && peelHoverTL.reverse()
  );

  peel.handleDrag(function (_, x, y) {
    if (autoPeeling) return;
    stripHoverEnabled = false;

    const matrix = new DOMMatrix(
      getComputedStyle(this.el).transform === "none"
        ? undefined
        : getComputedStyle(this.el).transform
    );
    const localPoint = matrix.inverse().transformPoint(new DOMPoint(x, y));

    currentPos = { x: localPoint.x, y: localPoint.y };
    this.setPeelPosition(localPoint.x, localPoint.y);

    const dx = CORNER.x - localPoint.x;
    const dy = CORNER.y - localPoint.y;

    if (dx < 0) return;
    if (Math.hypot(dx, dy) >= AUTO_PEEL_AT) {
      autoPeeling = true;
      autoCompletePeel(this, currentPos, WIDTH, HEIGHT);
    }
  });
}

// ==============================
// THREE JS SETUP
// ==============================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const cameraStartZ = 15;
const vectorCount = 8;
const vectorSpacing = 18;
const cameraEndZ = -(vectorCount - 1) * vectorSpacing - 40;
camera.position.z = cameraStartZ;

// ==============================
// GRADIENT MATERIAL
// ==============================
const blobGeometry = new THREE.PlaneGeometry(2, 2);

const blob1StartY = -0.4;
const blob2StartY = -0.5;

const blob1EndY = -0.25;
const blob2EndY = -0.05;

const blobMaterial = new THREE.ShaderMaterial({
  depthWrite: false,
  depthTest: false,
  uniforms: {
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    uTime: { value: 0 },

    // blob positions (0–1 screen space)
    blob1: { value: new THREE.Vector2(0.14, blob1StartY) },
    blob2: { value: new THREE.Vector2(0.75, blob2StartY) },
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    precision highp float;

    varying vec2 vUv;
    uniform vec2 blob1;
    uniform vec2 blob2;

    float blob(vec2 uv, vec2 center, float radius) {
      float d = distance(uv, center);
      return smoothstep(radius, 0.0, d);
    }

    void main() {
      // --- Pure black background ---
      vec3 baseColor = vec3(0.0667, 0.0, 0.0);
    
      // --- Large blurry blobs near the bottom ---
      float b1 = blob(vUv, blob1, 0.7);
      float b2 = blob(vUv, blob2, 0.8);
      float blobs = b1 + b2;
    
      // --- Vertical fade so blobs don't reach the top ---
      float bottomFade = smoothstep(0.85, 0.25, vUv.y);
      blobs *= bottomFade;
    
      // --- Red light contribution ---
      vec3 red = vec3(1.0, 0.0, 0.0);
    
      vec3 color = mix(baseColor, red, blobs * 0.5);
    
      gl_FragColor = vec4(color, 1.0);
    }
    
  `,
});
const blobMesh = new THREE.Mesh(blobGeometry, blobMaterial);
blobMesh.frustumCulled = false;
scene.add(blobMesh);

// ==============================
// MASK MATERIAL
// ==============================
const maskMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthTest: false,
  depthWrite: false,
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position =  vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;

    varying vec2 vUv;
    uniform float uProgress;
    
    /* Hash */
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    
    /* Smooth noise */
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
    
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
    
      vec2 u = f * f * (3.0 - 2.0 * f);
    
      return mix(a, b, u.x) +
            (c - a) * u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
    }
    
    /* Fractal Brownian Motion */
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
    
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
    
      return value;
    }
    
    void main() {
      vec2 center = vec2(0.5);
      vec2 p = vUv - center;
    
      float dist = length(p);
    
      /* Static shape distortion */
      float distortion = fbm(p * 6.0) * 0.15;
    
      float radius = uProgress + distortion;
    
      /* Much softer feather */
      float feather = 0.35;
    
      float hole = smoothstep(
        radius,
        radius - feather,
        dist
      );
    
      float alpha = 1.0 - hole;
    
      gl_FragColor = vec4(vec3(0.0), alpha);
    }
  `,
  transparent: true,
  uniforms: {
    uProgress: { value: 0.0 },
  },
});
const maskGeometry = new THREE.PlaneGeometry(2, 2);
const maskMesh = new THREE.Mesh(maskGeometry, maskMaterial);
maskMesh.renderOrder = 999;
maskMesh.frustumCulled = false;
scene.add(maskMesh);

// ==============================
// RENDERER
// ==============================
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
  alpha: true,
});
renderer.setClearColor(0x120c01, 1);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const SETTINGS = {
  svgScale: 0.1,
  fade: { start: 60, end: 5 },
  tail: { count: 6, maxOpacity: 1, minOpacity: 0.3 },
  fillColor: 0xc89e44,
  duration: 7,
};

const svgVariants = [
  "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/694bbb16290488876912b288_vector-stroke-1.svg",
  "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/694bbb163e95ff2ab066a62f_vector-stroke-2.svg",
  "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/694bbb16b352d21ee4e6708d_vector-stroke-3.svg",
  "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/694bbb16c941d26634d897ec_vector-stroke-4.svg",
  "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/694bbb16e2e7cd332e3cacd1_vector-stroke-5.svg",
  "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/694bbb16b7382c9c9e34d0fd_vector-stroke-6.svg",
];

const vectors = [];
const svgCache = {};

// ==============================
// SVG CACHE LOADER
// ==============================
async function loadSVGCached(url) {
  if (!svgCache[url]) {
    const res = await fetch(url);
    const text = await res.text();
    const loader = new SVGLoader();
    svgCache[url] = loader.parse(text).paths;
  }
  return svgCache[url];
}

// ==============================
// CREATE SVG MESH
// ==============================
async function createSVGMesh(zPos, index) {
  const group = new THREE.Group();

  const mainCount = vectorCount - (svgVariants.length - 1);
  let svgIndex =
    index < mainCount
      ? 0
      : Math.min(1 + (index - mainCount), svgVariants.length - 1);

  const svgPaths = await loadSVGCached(svgVariants[svgIndex]);

  const tailStart = Math.max(0, vectorCount - SETTINGS.tail.count);
  const isTail = index >= tailStart;
  const opacityCap = isTail
    ? THREE.MathUtils.lerp(
        SETTINGS.tail.maxOpacity,
        SETTINGS.tail.minOpacity,
        (index - tailStart) / Math.max(1, SETTINGS.tail.count - 1)
      )
    : 1;

  svgPaths.forEach((path) => {
    const shapes = SVGLoader.createShapes(path);
    shapes.forEach((shape) => {
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({
        color: SETTINGS.fillColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      });
      group.add(new THREE.Mesh(geometry, material));
    });
  });

  group.scale.setScalar(SETTINGS.svgScale);
  group.scale.y *= -1;

  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.position.sub(center);
  group.position.z = zPos;
  group.opacityCap = opacityCap;

  scene.add(group);
  vectors.push(group);
}

// ==============================
// INIT FUNCTION
// ==============================
let animationTimeline;

async function init() {
  await Promise.all(svgVariants.map(loadSVGCached));

  for (let i = 0; i < vectorCount; i++) {
    await createSVGMesh(-i * vectorSpacing, i);
  }

  animationTimeline = gsap.timeline({ paused: true });
  const easeQuartOut = (t) => 1 - Math.pow(1 - t, 4);

  // ========== REVEAL ANIMATION ==========
  animationTimeline.to(
    maskMaterial.uniforms.uProgress,
    {
      value: 1,
      duration: 1.5,
      ease: "power1.in",
      onComplete: () => {
        document.querySelector("[data-hero='wrapper']").classList.remove("u-mouse-none");
      },
    },
    "init"
  );
  // ========== BLOB 1 ANIMATION ==========
  animationTimeline.to(
    blobMaterial.uniforms.blob1.value,
    {
      y: blob1EndY,
      duration: 1.8,
      ease: "expo.out",
    },
    "init+=0.5"
  );
  // ========== BLOB 2 ANIMATION ==========
  animationTimeline.to(
    blobMaterial.uniforms.blob2.value,
    {
      y: blob2EndY,
      duration: 1.5,
      ease: "expo.out",
    },
    "init+=0.8"
  );
  animationTimeline.addLabel("blobEnd");
  // ========== INFINITE TUNNEL ANIMATION ==========
  animationTimeline.to(
    { progress: 0 },
    {
      progress: 1,
      duration: SETTINGS.duration,
      ease: "none",
      onUpdate() {
        const eased = easeQuartOut(this.targets()[0].progress);
        camera.position.z = THREE.MathUtils.lerp(
          cameraStartZ,
          cameraEndZ,
          eased
        );
        updateSvgOpacity();
      },
    },
    "init+=0.5"
  );

  animationTimeline.to(
    "[data-hero='content']", 
    {
      duration: 3, 
      x: 0, 
      y:0, 
      z: 0, 
      ease: "expo.out"
    },
    "init+=1.7"
  ).to(
    "[data-hero='content']",
    {
      duration: 1,
      filter:"blur(0px)", 
      opacity: 1, 
    },
    "init+=1"
  );

  // ========== BLOB 1 ANIMATION OUT ==========
  animationTimeline.to(
    blobMaterial.uniforms.blob1.value,
    {
      y: -0.7,
      duration: 1,
      ease: "expo.in",
    },
    // "init+=2.3"
    "blobEnd"
  );
  // ========== BLOB 2 ANIMATION OUT ==========
  animationTimeline.to(
    blobMaterial.uniforms.blob2.value,
    {
      y: -0.8,
      duration: 1.2,
      ease: "expo.in",
    },
    // "init+=2.3"
    "blobEnd"
  );

  animate();
}

// ==============================
// UPDATE SVG OPACITY
// ==============================
function updateSvgOpacity() {
  vectors.forEach((vector) => {
    const distance = Math.abs(camera.position.z - vector.position.z);
    let opacity = 0;
    if (distance <= SETTINGS.fade.start) {
      const t = THREE.MathUtils.clamp(
        1 -
          (distance - SETTINGS.fade.end) /
            (SETTINGS.fade.start - SETTINGS.fade.end),
        0,
        1
      );
      opacity = THREE.MathUtils.smoothstep(t, 0, 1);
    }
    vector.children.forEach(
      (child) =>
        child.material && (child.material.opacity = opacity * vector.opacityCap)
    );
  });
}

// ==============================
// RENDER LOOP
// ==============================
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// ==============================
// RESIZE HANDLER
// ==============================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  blobMaterial.uniforms.uResolution.value.set(
    window.innerWidth,
    window.innerHeight
  );
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==============================
// START
// ==============================
init(); // Timeline stays paused, only plays after peel

// ==============================
// AUTO PEEL ANIMATION (optimized)
// ==============================
function autoCompletePeel(peelInstance, { x, y }, WIDTH, HEIGHT) {
  const proxy = { x, y };
  const tl = gsap.timeline();

  

  // Peel movement off-screen
  tl.to(proxy, {
    duration: 2.5,
    ease: "power2.out",
    x: -WIDTH,
    y: -HEIGHT,
    onUpdate() {
      peelInstance.setPeelPosition(proxy.x, proxy.y);
    },
    onComplete() {
      peelInstance.remove?.(); // remove the peel element after animation
    },
  });

  // ========== ZOOM WRAPPER ANIMATION ==========
  tl.to(
    "[data-zoom-wrapper]",
    {
      duration: 2.5,
      y: "-18vh",
      z: "999",
      ease: "power4.in",
    },
    "<" // start simultaneously with last animation
  ).to("[data-zoom-wrapper]", {
    ease: "none",
    duration: 0,
    opacity: 0,
    display: "none",
  });

  // Start the main camera + SVG animation after peel finishes
  tl.add(() => animationTimeline.play(), "-=0.5");
  
}
