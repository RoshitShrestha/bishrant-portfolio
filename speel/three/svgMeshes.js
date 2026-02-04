/**
 * SVG stroke loading and mesh creation for tunnel vectors.
 */

import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { scene, vectors } from "./scene.js";
import {
  SVGSETTINGS,
  svgVariants,
  vectorCount,
  vectorSpacing,
} from "../config.js";

export const svgCache = {};

export async function loadSVGCached(url) {
  if (!svgCache[url]) {
    const res = await fetch(url);
    const text = await res.text();
    const loader = new SVGLoader();
    svgCache[url] = loader.parse(text).paths;
  }
  return svgCache[url];
}

export async function createSVGMesh(zPos, index) {
  const svgGroup = new THREE.Group();
  const mainCount = vectorCount - (svgVariants.length - 1);
  let svgIndex;
  if (index < mainCount) {
    svgIndex = 0;
  } else {
    svgIndex = 1 + (index - mainCount);
    svgIndex = Math.min(svgIndex, svgVariants.length - 1);
  }

  const svgPaths = await loadSVGCached(svgVariants[svgIndex]);

  const tailStart = Math.max(0, vectorCount - SVGSETTINGS.tail.count);
  const isTail = index >= tailStart;
  let opacityCap = 1;
  if (isTail) {
    const t = (index - tailStart) / Math.max(1, SVGSETTINGS.tail.count - 1);
    opacityCap = THREE.MathUtils.lerp(
      SVGSETTINGS.tail.maxOpacity,
      SVGSETTINGS.tail.minOpacity,
      t
    );
  }

  svgPaths.forEach((path) => {
    const shapes = SVGLoader.createShapes(path);
    shapes.forEach((shape) => {
      const svgGeometry = new THREE.ShapeGeometry(shape);
      svgGeometry.computeBoundingBox();
      const bbox = svgGeometry.boundingBox;
      const size = new THREE.Vector2(
        bbox.max.x - bbox.min.x,
        bbox.max.y - bbox.min.y
      );
      const uvs = [];
      const positions = svgGeometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        uvs.push((x - bbox.min.x) / size.x, (y - bbox.min.y) / size.y);
      }
      svgGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      const svgMaterial = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          uOpacity: { value: 1.0 },
          stopLeft: { value: 0.3 },
          stopCenter: { value: 0.5 },
          stopRight: { value: 0.7 },
          colorLeft: { value: new THREE.Vector4(0.2627, 0.0706, 0.0706, 0.0) },
          colorCenter: { value: new THREE.Vector4(0.6196, 0.2431, 0.2431, 1.0) },
          colorRight: { value: new THREE.Vector4(0.2627, 0.0706, 0.0706, 0.0) },
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
          uniform float stopLeft;
          uniform float stopCenter;
          uniform float stopRight;
          uniform vec4 colorLeft;
          uniform vec4 colorCenter;
          uniform vec4 colorRight;
          void main() {
              float edgeSize = 0.01;
              float leftEdge = smoothstep(stopLeft - edgeSize, stopLeft + edgeSize, vUv.x);
              float centerEdge = smoothstep(stopCenter - edgeSize, stopCenter + edgeSize, vUv.x);
              float rightEdge = smoothstep(stopRight - edgeSize, stopRight + edgeSize, vUv.x);
              float denomLC = max(stopCenter - stopLeft, 1e-4);
              float denomCR = max(stopRight - stopCenter, 1e-4);
              vec4 leftToCenter = mix(colorLeft, colorCenter, (vUv.x - stopLeft) / denomLC);
              vec4 centerToRight = mix(colorCenter, colorRight, (vUv.x - stopCenter) / denomCR);
              vec4 color = mix(
                  mix(colorLeft, leftToCenter, leftEdge),
                  mix(centerToRight, colorRight, rightEdge),
                  step(stopCenter, vUv.x)
              );
              color.a *= uOpacity;
              if (color.a < 0.001) discard;
              gl_FragColor = color;
          }
        `,
      });
      const svgMesh = new THREE.Mesh(svgGeometry, svgMaterial);
      svgGroup.add(svgMesh);
    });
  });

  svgGroup.scale.setScalar(SVGSETTINGS.svgScale);
  svgGroup.scale.y *= -1;
  const box = new THREE.Box3().setFromObject(svgGroup);
  const center = box.getCenter(new THREE.Vector3());
  svgGroup.position.sub(center);
  svgGroup.position.z = zPos;
  scene.add(svgGroup);
  svgGroup.opacityCap = opacityCap;
  vectors.push(svgGroup);
}
