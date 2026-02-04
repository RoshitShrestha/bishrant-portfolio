/**
 * Main init, animate loop, and direct hero entry (skip intro).
 */

import * as THREE from "three";
import { camera, scene, vectors } from "./three/scene.js";
import { renderer, renderTarget } from "./three/renderer.js";
import { postProcessMaterial, postProcessScene, postCamera } from "./three/postProcess.js";
import { introGradientMaterial } from "./three/introMaterials.js";
import { heroGradientUniforms, heroGradientMesh, heroScene, heroCamera } from "./three/heroScene.js";
import { loadSVGCached, createSVGMesh } from "./three/svgMeshes.js";
import { updateSvgOpacity } from "./three/updateSvgOpacity.js";
import { createTimelines, getIntroTimeline, getHeroContentTimeline } from "./timelines.js";
import { setPeelIntroTimeline } from "./peel.js";
import { skipIntro } from "./navigation.js";
import { vectorCount, vectorSpacing, svgVariants } from "./config.js";

let heroContentTimeline;

export function startDirectHeroEntry() {
  heroGradientMesh.visible = true;
  heroContentTimeline = getHeroContentTimeline();
  heroContentTimeline.play();
}

export async function init() {
  await Promise.all(svgVariants.map(loadSVGCached));

  for (let i = 0; i < vectorCount; i++) {
    await createSVGMesh(-i * vectorSpacing, i);
  }

  createTimelines(updateSvgOpacity);
  setPeelIntroTimeline(getIntroTimeline());
  heroContentTimeline = getHeroContentTimeline();

  animate();

  if (skipIntro) {
    startDirectHeroEntry();
  }

  setupResize();
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  if (heroGradientUniforms.u_isPaused.value === 0) {
    const elapsed = clock.getElapsedTime();
    heroGradientUniforms.u_time.value = elapsed + 100; // Normal time progression
  }

  renderer.setRenderTarget(renderTarget);
  renderer.clear();
  renderer.render(scene, camera);

  renderer.setRenderTarget(null);
  postProcessMaterial.uniforms.tDiffuse.value = renderTarget.texture;
  renderer.render(postProcessScene, postCamera);

  renderer.autoClear = false;
  renderer.render(heroScene, heroCamera);
  renderer.autoClear = true;
}

export function setupResize() {
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    postProcessMaterial.uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight
    );
    introGradientMaterial.uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight
    );
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
