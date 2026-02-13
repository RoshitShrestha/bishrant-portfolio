/**
 * Hero section gradient and mask (separate scene composited on top).
 */

import * as THREE from "three";
import { heroGradientVertex, heroGradientFragment } from "../shaders.js";

export const heroScene = new THREE.Scene();
export const heroCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
heroCamera.position.set(0, 0, 1);

export const heroGradientUniforms = {
  u_time: { value: 0 },
  u_opacity: { value: 0 },
  u_colors: {
    value: [
      new THREE.Vector4(0.1176, 0.0431, 0.0431, 1),
      new THREE.Vector4(0.0627, 0.0157, 0.0157, 1),
      new THREE.Vector4(0.4314, 0.149, 0.149, 1),
      new THREE.Vector4(0.0, 0.0, 0.0, 1),
    ],
  },
  u_colorsCount: { value: 4 },
  u_distortion: { value: 0.05 },
  u_swirl: { value: 0.3 },
  u_grainMixer: { value: 0.02 },
  u_grainOverlay: { value: 0.01 },
  u_rotation: { value: 0 },
  u_offsetX: { value: -0.5 },
  u_offsetY: { value: -0.3 },
  u_speed: { value: 0.5 },
  u_isPaused: { value: 1 },
};

const heroGradientMaterial = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: heroGradientUniforms,
  vertexShader: heroGradientVertex,
  fragmentShader: heroGradientFragment,
});

export const heroGradientMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  heroGradientMaterial
);
heroGradientMesh.frustumCulled = false;
heroGradientMesh.visible = false;
heroGradientMesh.position.set(0, 0, 0);
heroGradientMesh.renderOrder = 0;
heroScene.add(heroGradientMesh);

export const heroMaskMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthTest: false,
  depthWrite: false,
  uniforms: {
    uProgress: { value: 0.0 },
    uRadiusStart: { value: 1.0 },
    uRadiusEnd: { value: 0.5 },
    uYoffset: { value: 1.0 },
    uSoftness: { value: 0.4 },
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
    uniform float uProgress;
    uniform float uRadiusStart;
    uniform float uRadiusEnd;
    uniform float uYoffset;
    uniform float uSoftness;
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
      vec2 center = vec2(0.5, 0.5 + uYoffset * uProgress);
      vec2 p = vUv - center;
      float dist = length(p);
      float wobble = noise(p * 2.0);
      wobble = wobble * 2.0 - 1.0;
      float distortion = wobble * 0.06;
      float radius = mix(uRadiusStart, uRadiusEnd, uProgress) + distortion;
      float edge = smoothstep(radius - uSoftness, radius, dist);
      float radiusDistorted = radius + distortion * edge;
      float hole = smoothstep(
        radiusDistorted,
        radiusDistorted - uSoftness,
        dist
      );
      float alpha = 1.0 - hole;
      gl_FragColor = vec4(vec3(0.0), alpha);
    }
  `,
});

const heroMaskGeometry = new THREE.PlaneGeometry(2, 2);
export const heroMaskMesh = new THREE.Mesh(heroMaskGeometry, heroMaskMaterial);
heroMaskMesh.renderOrder = 999;
heroMaskMesh.frustumCulled = false;
heroScene.add(heroMaskMesh);
