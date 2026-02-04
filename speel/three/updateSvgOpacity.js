/**
 * Update SVG vector opacity based on camera distance (tunnel fade).
 */

import * as THREE from "three";
import { camera, vectors } from "./scene.js";
import { SVGSETTINGS } from "../config.js";

export function updateSvgOpacity() {
  vectors.forEach((vector) => {
    const distance = Math.abs(camera.position.z - vector.position.z);
    let opacity = 0;

    if (distance <= SVGSETTINGS.fade.start) {
      const t = THREE.MathUtils.clamp(
        1 -
          (distance - SVGSETTINGS.fade.end) /
            (SVGSETTINGS.fade.start - SVGSETTINGS.fade.end),
        0,
        1
      );
      opacity = THREE.MathUtils.smoothstep(t, 0, 1);
    }

    vector.children.forEach(
      (child) =>
        (child.material.uniforms.uOpacity.value = opacity * vector.opacityCap)
    );
  });
}
