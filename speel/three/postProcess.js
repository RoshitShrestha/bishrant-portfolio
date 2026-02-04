/**
 * Post-process fisheye / radial blur pass.
 */

import * as THREE from "three";

export const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

export const postProcessMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },
    uBulge: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
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
    uniform float uBulge;
    uniform vec2 uResolution;
    const int SAMPLES = 15;
    const float SIGMA = 0.03;
    float gaussian(float x, float sigma) {
        float safeSigma = max(sigma, 1e-4);
        return exp(-0.5 * (x * x) / (safeSigma * safeSigma)) / (safeSigma * sqrt(6.2831853));
    }
    vec4 radialBlur(sampler2D tex, vec2 uv, vec2 center, float strength, float rOriginal) {
      vec4 color = vec4(0.0);
      float total = 0.0;
      float ca = uBulge * 0.015 * rOriginal;
      vec2 offsetR = vec2(ca, 0.0);
      vec2 offsetG = vec2(0.0, ca);
      vec2 offsetB = vec2(-ca, 0.0);
      for (int i = 0; i < 31; i++) {
          float t = (float(i) - 15.0) / 15.0;
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
      return color / max(total, 1e-4);
    }
    void main() {
        vec2 uv = vUv * 2.0 - 1.0;
        uv.x *= uResolution.x / uResolution.y;
        float r = length(uv);
        float theta = 0.0;
        if (r > 0.0) {
            theta = atan(uv.y, uv.x);
            float bulgeStrength = uBulge * 0.5;
            float bulgeRadius = r + r * (1.0 - r) * bulgeStrength;
            uv = vec2(cos(theta), sin(theta)) * bulgeRadius;
        }
        uv.x /= uResolution.x / uResolution.y;
        vec2 finalUV = uv * 0.5 + 0.5;
        float innerRadius = 0.3;
        float outerRadius = 0.7;
        float bulgeMask = smoothstep(innerRadius, outerRadius, r);
        vec4 blurredColor = radialBlur(tDiffuse, finalUV, vec2(0.5), uBulge, r);
        gl_FragColor = blurredColor * bulgeMask + texture2D(tDiffuse, finalUV) * (1.0 - bulgeMask);
    }
  `,
});

const postProcessGeometry = new THREE.PlaneGeometry(2, 2);
const postProcessMesh = new THREE.Mesh(postProcessGeometry, postProcessMaterial);
postProcessMesh.frustumCulled = false;
export const postProcessScene = new THREE.Scene();
postProcessScene.add(postProcessMesh);
