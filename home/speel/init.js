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
import { createTimelines, getIntroTimeline, getHeroContentTimeline, disposeTimelines } from "./timelines.js";
import { setPeelIntroTimeline } from "./peel.js";
import { skipIntro } from "./navigation.js";
import { vectorCount, vectorSpacing, svgVariants } from "./config.js";
import { markNeedsRender, consumeNeedsRender } from "./renderState.js";

let heroContentTimeline;
let _rafId = null;
let _resizeBound = null;
let _isVisible = true;     // tracks canvas intersection with viewport
let _visibilityObserver = null;


export function startDirectHeroEntry() {
  heroGradientMesh.visible = true;
  heroGradientUniforms.u_isPaused.value = 0;
  heroGradientUniforms.u_opacity.value = 1;
  heroContentTimeline = getHeroContentTimeline();
  
  // playing heroContentTimeline instantly
  if (heroContentTimeline) {
    heroContentTimeline.progress(1).pause();
  }
}

export async function init() {
  await Promise.all(svgVariants.map(loadSVGCached));

  for (let i = 0; i < vectorCount; i++) {
    await createSVGMesh(-i * vectorSpacing, i);
  }

  createTimelines(updateSvgOpacity);
  setPeelIntroTimeline(getIntroTimeline());
  heroContentTimeline = getHeroContentTimeline();

  setupVisibilityObserver();
  animate();

  if (skipIntro) {
    startDirectHeroEntry();
  }

  setupResize();
}

export function dispose() {
  if (_rafId != null) {
    cancelAnimationFrame(_rafId);
    _rafId = null;
  }
  if (_resizeBound && typeof window !== "undefined") {
    window.removeEventListener("resize", _resizeBound);
    _resizeBound = null;
  }
  if (_visibilityObserver) {
    _visibilityObserver.disconnect();
    _visibilityObserver = null;
  }

  disposeTimelines();

  vectors.forEach((group) => {
    group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  });
  vectors.length = 0;

  scene.clear();
  heroScene.clear();

  renderTarget.dispose();
  renderer.dispose();
}

const clock = new THREE.Clock();

function setupVisibilityObserver() {
  _visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      const wasVisible = _isVisible;
      _isVisible = entry.isIntersecting;
      if (_isVisible) {
        // When becoming visible again, force a fresh render and restart the loop if needed
        markNeedsRender();
        if (_rafId == null) {
          animate();
        }
      } else {
        // When scrolled out of view, completely stop the RAF loop
        if (_rafId != null) {
          cancelAnimationFrame(_rafId);
          _rafId = null;
        }
      }
    },
    { threshold: 0 }
  );
  _visibilityObserver.observe(renderer.domElement);
}

function animate() {
  // If not visible, do not schedule or run the loop
  if (!_isVisible) {
    _rafId = null;
    return;
  }

  _rafId = requestAnimationFrame(animate);

  if (heroGradientUniforms.u_isPaused.value === 0) {
    const elapsed = clock.getElapsedTime();
    heroGradientUniforms.u_time.value = elapsed + 100;
    markNeedsRender();
  }

  if (!consumeNeedsRender()) return;

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
  _resizeBound = () => {
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
    markNeedsRender();
  };
  window.addEventListener("resize", _resizeBound);
}
