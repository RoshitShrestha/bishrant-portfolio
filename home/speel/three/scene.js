/**
 * Main Three.js scene and camera for intro tunnel.
 */

import * as THREE from "three";

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

export const vectors = [];
