// ==============================
// IMPORTS
// ==============================
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

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

// ==============================
// SETTINGS
// ==============================
const cameraOffset = 20; //20 was
const vectorCount = 16;  //8 was
const vectorSpacing =  18;

const SETTINGS = {
  svgScale: 0.1,
  fade: { start: 60, end: 5 },
  tail: { count: 6, maxOpacity: 1, minOpacity: 0.15 },
  duration: 7, //7 was
};

const svgVariants = [
  // "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/694bbb16290488876912b288_vector-stroke-1.svg",
  "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/694bbb163e95ff2ab066a62f_vector-stroke-2.svg",
  "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/694bbb16b352d21ee4e6708d_vector-stroke-3.svg",
  "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/694bbb16c941d26634d897ec_vector-stroke-4.svg",
  "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/694bbb16e2e7cd332e3cacd1_vector-stroke-5.svg",
  "https://cdn.prod.website-files.com/66d46ff703091f83e3abce17/694bbb16b7382c9c9e34d0fd_vector-stroke-6.svg",
];

const vectors = [];
const svgCache = {};

/* const cameraStartZ = 15;
const lastVectorZ = -(vectorCount - 1) * vectorSpacing;
const cameraEndZ = lastVectorZ - 40; // buffer past last SVG
camera.position.z = cameraStartZ; */

// ==============================
// GRADIENT MATERIAL
// ==============================
const bgGradientGeometry = new THREE.PlaneGeometry(2, 2);

const rectHeight = 0.4;
const rectCenterStart = rectHeight/2;
const rectCenterEnd = -rectHeight/2;

const bgGradientMaterial = new THREE.ShaderMaterial({
  depthWrite: false,
  depthTest: false,
  uniforms: {
    rectHeight: { value: rectHeight },
    topRectCenterY: { value: 1.0 - rectCenterStart },
    bottomRectCenterY: { value: rectCenterStart },
  
    // Top rectangle: 2 colors
    topColorStart: { value: new THREE.Vector3(0.0667, 0.0, 0.0) },    // bot
    topColorEnd: { value: new THREE.Vector3(0.2627, 0.0, 0.0) },    // top

    // Bottom rectangle: 2 colors
    bottomColorStart: { value: new THREE.Vector3(0.4431, 0.0157, 0.0157) },   // top
    bottomColorEnd: { value: new THREE.Vector3(0.0667, 0.0, 0.0) },   // bot

    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  },

  vertexShader: `
    uniform vec2 uResolution;
    varying vec2 vUv;
    void main() {
      // Map positions to clip space, scale full width based on screen
      vec2 scaledPosition = position.xy;
      scaledPosition.x *= uResolution.x / uResolution.y; // stretch width to match screen
      vUv = position.xy * 0.5 + 0.5;
      gl_Position = vec4(scaledPosition, 0.0, 1.0);
    }

  `,

  fragmentShader: `
    precision highp float;

    varying vec2 vUv;
    uniform float rectHeight;
    uniform float topRectCenterY;
    uniform float bottomRectCenterY;

    uniform vec3 topColorStart;
    uniform vec3 topColorEnd;
    uniform vec3 bottomColorStart;
    uniform vec3 bottomColorEnd;

    // Returns 1 inside rectangle, 0 outside
    float rectMask(float uvY, float centerY, float height) {
        float halfH = height * 0.5;
        return step(centerY - halfH, uvY) * step(uvY, centerY + halfH);
    }

    void main() {
        vec3 baseColor = vec3(0.0667, 0.0, 0.0);

        float topMask = rectMask(vUv.y, topRectCenterY, rectHeight);
        float bottomMask = rectMask(vUv.y, bottomRectCenterY, rectHeight);

        float topGradientPos = clamp((vUv.y - (topRectCenterY - rectHeight * 0.5)) / rectHeight, 0.0, 1.0);
        float bottomGradientPos = clamp((vUv.y - (bottomRectCenterY - rectHeight * 0.5)) / rectHeight, 0.0, 1.0);

        vec3 topColor = mix(topColorStart, topColorEnd, topGradientPos);
        vec3 bottomColor = mix(bottomColorStart, bottomColorEnd, bottomGradientPos);

        vec3 color = baseColor;
        color = mix(color, topColor, topMask);
        color = mix(color, bottomColor, bottomMask);

        gl_FragColor = vec4(color, 1.0);
    }
  `,
});
const bgGradientMesh = new THREE.Mesh(bgGradientGeometry, bgGradientMaterial);
bgGradientMesh.frustumCulled = false;
scene.add(bgGradientMesh);

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
// POST PROCESS FISHEYE
// ==============================
const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const postProcessMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },      // Scene texture
    uBulge: { value: 0.0 },         // Bulge intensity
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;

    varying vec2 vUv;

    uniform sampler2D tDiffuse;
    uniform float uBulge;       // 0.0 → 1.0
    uniform vec2 uResolution;   // screen resolution

    const int SAMPLES = 15;      // number of blur samples
    const float SIGMA = 0.03;    // blur intensity

    // 1D Gaussian function
    float gaussian(float x, float sigma) {
        return exp(-0.5 * (x * x) / (sigma * sigma)) / (sigma * sqrt(6.2831853));
    }

    // Radial Gaussian blur
    vec4 radialBlur(sampler2D tex, vec2 uv, vec2 center, float strength, float rOriginal) {
      vec4 color = vec4(0.0);
      float total = 0.0;

      // Precompute chromatic offsets once using the original r
      float ca = uBulge * 0.015 * rOriginal;
      vec2 offsetR = vec2(ca, 0.0);
      vec2 offsetG = vec2(0.0, ca);
      vec2 offsetB = vec2(-ca, 0.0);

      for (int i = 0; i < 31; i++) {
          float t = (float(i) - 15.0) / 15.0; // -SAMPLES..SAMPLES
          float weight = gaussian(t, SIGMA);

          vec2 sampleUV = mix(center, uv, 1.0 + t * strength);

          vec4 sampleColor;
          sampleColor.r = texture2D(tex, sampleUV + offsetR).r;
          sampleColor.g = texture2D(tex, sampleUV + offsetG).g;
          sampleColor.b = texture2D(tex, sampleUV + offsetB).b;
          sampleColor.a = 1.0;

          color += sampleColor * weight;
          total += weight;
      }

      return color / total;
    }


    void main() {
        // Convert to normalized [-1,1] coordinates
        vec2 uv = vUv * 2.0 - 1.0;
        uv.x *= uResolution.x / uResolution.y;

        float r = length(uv);
        float theta = 0.0;

        if (r > 0.0) {
            theta = atan(uv.y, uv.x);

            // Bulge effect
            float bulgeStrength = uBulge * 0.5;
            float bulgeRadius = r + r * (1.0 - r) * bulgeStrength;

            uv = vec2(cos(theta), sin(theta)) * bulgeRadius;
        }

        // Convert back to [0,1]
        uv.x /= uResolution.x / uResolution.y;
        vec2 finalUV = uv * 0.5 + 0.5;

        // Radial blur mask (applied only on distorted edges)
        float innerRadius = 0.3;       // where blur starts
        float outerRadius = 0.7;       // full blur at this distance
        float bulgeMask = smoothstep(innerRadius, outerRadius, r);

        // Apply radial Gaussian blur **with chromatic aberration inside**
        vec4 blurredColor = radialBlur(tDiffuse, finalUV, vec2(0.5), uBulge, r);

        // Output
        gl_FragColor = blurredColor * bulgeMask + texture2D(tDiffuse, finalUV) * (1.0 - bulgeMask);
    }
  `
});

// Fullscreen quad geometry
const postProcessGeometry = new THREE.PlaneGeometry(2, 2);
const postProcessMesh = new THREE.Mesh(postProcessGeometry, postProcessMaterial);
postProcessMesh.frustumCulled = false;
const postProcessScene = new THREE.Scene();
postProcessScene.add(postProcessMesh);

// Create a render target
const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);


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

  // Determine SVG variant
  const mainCount = vectorCount - (svgVariants.length - 1);
  let svgIndex;
  if (index < mainCount) {
    svgIndex = 0;
  } else {
    svgIndex = 1 + (index - mainCount);
    svgIndex = Math.min(svgIndex, svgVariants.length - 1);
  }

  const svgPaths = await loadSVGCached(svgVariants[svgIndex]);

  // Tail opacity
  const tailStart = Math.max(0, vectorCount - SETTINGS.tail.count);
  const isTail = index >= tailStart;
  let opacityCap = 1;
  if (isTail) {
    const t = (index - tailStart) / Math.max(1, SETTINGS.tail.count - 1);
    opacityCap = THREE.MathUtils.lerp(
      SETTINGS.tail.maxOpacity,
      SETTINGS.tail.minOpacity,
      t
    );
  }

  // Create meshes
  svgPaths.forEach((path) => {
    const shapes = SVGLoader.createShapes(path);
    shapes.forEach((shape) => {
      const geometry = new THREE.ShapeGeometry(shape);
      geometry.computeBoundingBox();

      const bbox = geometry.boundingBox;
      const size = new THREE.Vector2(
        bbox.max.x - bbox.min.x,
        bbox.max.y - bbox.min.y
      );

      const uvs = [];
      const positions = geometry.attributes.position.array;

      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];

        uvs.push((x - bbox.min.x) / size.x, (y - bbox.min.y) / size.y);
      }

      geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      const material = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          uOpacity: { value: 1.0 },
          //uBlur: { value: 0 },
          stopLeft: { value: 0.3 },
          stopCenter: { value: 0.5 },
          stopRight: { value: 0.7 },
          colorLeft: { value: new THREE.Vector4(0.2627, 0.0706, 0.0706, 0.0) },   // white transparent
          colorCenter: { value: new THREE.Vector4(0.6196, 0.2431, 0.2431, 1.0) }, // red opaque
          colorRight: { value: new THREE.Vector4(0.2627, 0.0706, 0.0706, 0.0) },  // white transparent
        },
        vertexShader: `
          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;

          varying vec2 vUv;

          uniform float uOpacity;

          uniform float stopLeft;   // e.g. 0.2
          uniform float stopCenter; // e.g. 0.5
          uniform float stopRight;  // e.g. 0.8

          uniform vec4 colorLeft;   // white transparent (1,1,1,0)
          uniform vec4 colorCenter; // red opaque (1,0,0,1)
          uniform vec4 colorRight;  // white transparent (1,1,1,0)

          void main() {
              // Smooth transitions around each stop (adjust edge softness with edgeSize)
              float edgeSize = 0.01;

              float leftEdge = smoothstep(stopLeft - edgeSize, stopLeft + edgeSize, vUv.x);
              float centerEdge = smoothstep(stopCenter - edgeSize, stopCenter + edgeSize, vUv.x);
              float rightEdge = smoothstep(stopRight - edgeSize, stopRight + edgeSize, vUv.x);

              // Interpolate colors between stops (including alpha)
              vec4 leftToCenter = mix(colorLeft, colorCenter, (vUv.x - stopLeft) / (stopCenter - stopLeft));
              vec4 centerToRight = mix(colorCenter, colorRight, (vUv.x - stopCenter) / (stopRight - stopCenter));

              // Combine interpolations smoothly using smoothstep results
              vec4 color = mix(
                  mix(colorLeft, leftToCenter, leftEdge),
                  mix(centerToRight, colorRight, rightEdge),
                  step(stopCenter, vUv.x)
              );

              // Apply global opacity multiplier
              color.a *= uOpacity;

              // Discard fully transparent pixels for performance
              if (color.a < 0.001) discard;

              gl_FragColor = color;
          }

        `,
      });
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
    });
  });

  // Scale, flip, center
  group.scale.setScalar(SETTINGS.svgScale);
  group.scale.y *= -1;

  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.position.sub(center);

  group.position.z = zPos;
  scene.add(group);

  group.opacityCap = opacityCap;
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

  // ==============================
  // CAMERA POSITIONING (NEW)
  // ==============================

  const firstVectorZ = vectors[0].position.z;
  const lastVectorZ = vectors[vectors.length - 1].position.z;

  // Start camera slightly in front of first vector
  const cameraStartZ = firstVectorZ + cameraOffset;

  // End camera slightly behind last vector
  const cameraEndZ = lastVectorZ - cameraOffset;

  camera.position.z = cameraStartZ;
  updateSvgOpacity();

  // Total travel distance (for clarity/debugging)
  const cameraTravelDistance = Math.abs(cameraStartZ - cameraEndZ);

  console.log("Camera travel distance:", cameraTravelDistance);

  // ==============================
  // GSAP TIMELINE
  // ==============================
  animationTimeline = gsap.timeline({ paused: true });

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
  animationTimeline.addLabel("blobEnd");
  // ========== INFINITE TUNNEL ANIMATION ==========
  animationTimeline.to(
    camera.position,
    {
      z: cameraEndZ,
      duration: SETTINGS.duration,
      ease: "expo.out",
      onUpdate: updateSvgOpacity,
      onComplete: () => {console.log("ended")}
    },
    "init+=0.25"
  );

  // ========== LANDING HERO ANIMATION IN ==========
  animationTimeline.to(
    "[data-hero='content']", 
    {
      duration: 2, 
      x: 0, 
      y:0, 
      z: 0, 
      ease: "expo.out",
      stagger: {
        each: 0.08,   // delay between elements
        from: "start" // or "center", "end", "random"
      }
    },
    "init+=1.7"
  ).to(
    "[data-hero='content']",
    {
      duration: 1,
      filter:"blur(0px)", 
      opacity: 1,
      ease: "expo.out",
      stagger: {
        each: 0.08,
        from: "start"
      }
    },
    "init+=1.7"
  );

  // ========== RECT TOP ANIMATION OUT ==========
  animationTimeline.to(
    bgGradientMaterial.uniforms.topRectCenterY,
    {
      value: 1.0 - rectCenterEnd,
      duration: 1,
      ease: "expo.in",
    },
    // "init+=2.3"
    "blobEnd"
  );
  // ========== RECT BOT ANIMATION OUT ==========
  animationTimeline.to(
    bgGradientMaterial.uniforms.bottomRectCenterY,
    {
      value: rectCenterEnd,
      duration: 1.2,
      ease: "expo.in",
    },
    // "init+=2.3"
    "blobEnd"
  );

  // ========== FISH EYE BULGE ==========
  animationTimeline.to(postProcessMaterial.uniforms.uBulge, {
    value: 0.8,
    duration: 1.5,
    ease: "expo.out"
  }, "init+=0.5");

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
          1 - (distance - SETTINGS.fade.end) /
              (SETTINGS.fade.start - SETTINGS.fade.end),
          0,
          1
        );
        opacity = THREE.MathUtils.smoothstep(t, 0, 1);
      }
  
      vector.children.forEach(
        child =>
          child.material.uniforms.uOpacity.value =
            opacity * vector.opacityCap
      );
    });
  }

// ==============================
// RENDER LOOP
// ==============================
function animate() {
  requestAnimationFrame(animate);

  // Render main scene to render target
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);

  // Pass the render target texture to post-process shader
  postProcessMaterial.uniforms.tDiffuse.value = renderTarget.texture;

  renderer.render(postProcessScene, postCamera);
}

// ==============================
// RESIZE HANDLER
// ==============================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  postProcessMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  bgGradientMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
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
      duration: 2,
      y: "-18vh",
      z: "999",
      ease: "power4.in",
    },
    0 // start simultaneously with last animation
  ).to("[data-zoom-wrapper]", {
    ease: "none",
    duration: 0,
    opacity: 0,
    display: "none",
  },
    2
  );

  // Start the main camera + SVG animation after peel finishes
  tl.add(() => animationTimeline.play(), 1.5);
  
}
