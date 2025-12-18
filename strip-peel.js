// ==============================
// SVG PATH
// ==============================
const path =
  "M1343,56.5v2a54.6,54.6,0,0,1-54.5,54.4h-48.3l-12-21h-3.4l-12,21h-18.6l-12-21h-3.4l-12,21h-19.6l-12-21h-3.4l-12,21h-18.6l-12-21h-3.4l-12,21h-18.6l-12-21h-3.4l-12,21h-18.6l-12-21h-3.4l-12,21H963.2l-12-21h-3.4l-12,21H916.2l-12-21h-3.4l-12,21H870.2l-12-21h-3.4l-12,21H824.2l-12-21h-3.4l-12,21H778.2l-12-21h-3.4l-12,21H731.2l-12-21h-3.4l-12,21H685.2l-12-21h-3.4l-12,21H639.2l-12-21h-3.4l-12,21H592.2l-12-21h-3.4l-12,21H546.2l-12-21h-3.4l-12,21H500.2l-12-21h-3.4l-12,21H454.2l-12-21h-3.4l-12,21H407.2l-12-21h-3.4l-12,21H361.2l-12-21h-3.4l-12,21H315.2l-12-21h-3.4l-12,21H269.2l-12-21h-3.4l-12,21H223.2l-12-21h-3.4l-12,21H176.2l-12-21h-3.4l-12,21H130.2l-12-21h-3.4l-12,21H54.5A54.6,54.6,0,0,1,0,58.5V54.4A54.6,54.6,0,0,1,54.5,0h48.3l12,21h3.4l12-21h18.6l12,21h3.4l12-21h19.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h19.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h19.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h19.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h19.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h19.6l12,21h3.4l12-21h18.6l12,21h3.4l12-21h48.3A54.6,54.6,0,0,1,1343,54.4Z";

// =====================
// ELEMENT + GEOMETRY
// =====================

let peel = null;

handleResize();
window.addEventListener("resize", handleResize);

// =====================
// PEEL INSTANCE
// =====================
function handleResize() {
  const peelLayers = document.querySelectorAll(".peel-layer");

  peelLayers.forEach((peelLayer) => peelLayer.remove());
  peel = null;

  const peelEl = document.querySelector("#strip");
  const rect = peelEl.getBoundingClientRect();

  const WIDTH = rect.width;
  const HEIGHT = rect.height;

  // bottom-right corner (book mode)
  const CORNER = { x: WIDTH, y: HEIGHT };

  // max possible drag distance
  const MAX_DISTANCE = Math.hypot(WIDTH, HEIGHT);

  // auto peel threshold (40%)
  const AUTO_PEEL_AT = MAX_DISTANCE * 0.4;

  // =====================
  // STATE
  // =====================
  let autoPeeling = false;
  let currentPos = { ...CORNER };

  // =====================
  // SVG → ELEMENT SCALE
  // =====================
  const SVG_SIZE = {
    width: 1341,
    height: 111,
  };

  const scaleX = WIDTH / SVG_SIZE.width;
  const scaleY = HEIGHT / SVG_SIZE.height;

  peel = new Peel("#book", {
    path: {
      d: path,
      transform: `scale(${scaleX} ${scaleY})`,
    },
  });
  peel.setCorner(WIDTH, HEIGHT / 2);
  peel.setMode("book");

  // =====================
  // DRAG HANDLER
  // =====================
  peel.handleDrag(function (_, x, y) {
    if (autoPeeling) return;

    currentPos.x = x;
    currentPos.y = y;

    this.setPeelPosition(x, y);

    const dx = CORNER.x - x;
    const dy = CORNER.y - y;

    if (dx < 0) return;

    if (Math.hypot(dx, dy) >= AUTO_PEEL_AT) {
      autoPeeling = true;
      autoCompletePeel(this, currentPos, WIDTH, HEIGHT);
    }
  });
}

// =====================
// AUTO PEEL ANIMATION
// =====================
function autoCompletePeel(
  peelInstance,
  { x: startX, y: startY },
  WIDTH,
  HEIGHT
) {
  const endX = -WIDTH * 1.2;
  const endY = -HEIGHT * 1.2;

  const DURATION = 5000;
  const startTime = performance.now();

  function animate(time) {
    const t = Math.min((time - startTime) / DURATION, 1);
    const eased = t * (2 - t); // easeOutQuad

    peelInstance.setPeelPosition(
      startX + (endX - startX) * eased,
      startY + (endY - startY) * eased
    );

    if (t < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
