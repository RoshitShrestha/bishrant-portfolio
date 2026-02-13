/**
 * WebGL renderer and render target for post-process.
 */

import * as THREE from "three";

export const renderTarget = new THREE.WebGLRenderTarget(
  window.innerWidth, //clientWidth
  window.innerHeight
);

export const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
  alpha: true,
  antialias: true,
  preserveDrawingBuffer: true,
  premultipliedAlpha: false,
});
renderer.setClearColor(0x120c01, 1);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
