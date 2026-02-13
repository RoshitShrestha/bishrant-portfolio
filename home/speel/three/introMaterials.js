/**
 * Intro gradient and mask materials/meshes (tunnel intro).
 */

import * as THREE from "three";
import { scene } from "./scene.js";

const introGradientGeometry = new THREE.PlaneGeometry(2, 2);

export const rectHeight = 0.4;
export const rectCenterStart = rectHeight / 2;
export const rectCenterEnd = -rectHeight / 2;

export const introGradientMaterial = new THREE.ShaderMaterial({
  depthWrite: false,
  depthTest: false,
  uniforms: {
    rectHeight: { value: rectHeight },
    topRectCenterY: { value: 1.0 - rectCenterStart },
    bottomRectCenterY: { value: rectCenterStart },
    topColorStart: { value: new THREE.Vector3(0.0667, 0.0, 0.0) },
    topColorEnd: { value: new THREE.Vector3(0.2627, 0.0, 0.0) },
    bottomColorStart: { value: new THREE.Vector3(0.4431, 0.0157, 0.0157) },
    bottomColorEnd: { value: new THREE.Vector3(0.0667, 0.0, 0.0) },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  },
  vertexShader: `
    uniform vec2 uResolution;
    varying vec2 vUv;
    void main() {
      vec2 scaledPosition = position.xy;
      scaledPosition.x *= uResolution.x / uResolution.y;
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

export const introGradientMesh = new THREE.Mesh(introGradientGeometry, introGradientMaterial);
introGradientMesh.frustumCulled = false;
scene.add(introGradientMesh);

export const introMaskMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthTest: false,
  depthWrite: false,
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
    uniform float uProgress;
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
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
      float distortion = fbm(p * 6.0) * 0.15;
      float radius = uProgress + distortion;
      float feather = 0.35;
      float hole = smoothstep(radius, radius - feather, dist);
      float alpha = 1.0 - hole;
      gl_FragColor = vec4(vec3(0.0), alpha);
    }
  `,
  uniforms: { uProgress: { value: 0.0 } },
});

const introMaskGeometry = new THREE.PlaneGeometry(2, 2);
export const introMaskMesh = new THREE.Mesh(introMaskGeometry, introMaskMaterial);
introMaskMesh.renderOrder = 999;
introMaskMesh.frustumCulled = false;
scene.add(introMaskMesh);
