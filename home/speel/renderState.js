/**
 * Shared render-dirty flag. Kept in its own module to avoid circular imports
 * between init.js (which owns the RAF loop) and timelines.js (which drives uniforms).
 */

let _needsRender = true;

export function markNeedsRender() {
  _needsRender = true;
}

export function consumeNeedsRender() {
  if (!_needsRender) return false;
  _needsRender = false;
  return true;
}

export function setNeedsRender(value) {
  _needsRender = value;
}
