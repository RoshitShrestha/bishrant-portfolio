
// console log
console.log("github code id update");

// ==============================
// SVG PATH
// ==============================
const path =
  "M1341 55.55V57.5518C1340.92 71.7201 1335.26 85.2841 1325.24 95.2934C1315.22 105.303 1301.66 110.947 1287.5 111H1239.8L1227.8 89.9811H1223.2L1211.2 111H1193.8L1181.8 89.9811H1177.2L1165.2 111H1146.8L1134.8 89.9811H1130.2L1118.2 111H1100.8L1088.8 89.9811H1084.2L1072.2 111H1054.8L1042.8 89.9811H1038.2L1026.2 111H1008.8L996.8 89.9811H992.2L980.2 111H962.8L950.8 89.9811H946.2L934.2 111H915.8L903.8 89.9811H899.2L887.2 111H869.8L857.8 89.9811H853.2L841.2 111H823.8L811.8 89.9811H807.2L795.2 111H777.8L765.8 89.9811H761.2L749.2 111H730.8L718.8 89.9811H714.2L702.2 111H684.8L672.8 89.9811H668.2L656.2 111H638.8L626.8 89.9811H622.2L610.2 111H591.8L579.8 89.9811H575.2L563.2 111H545.8L533.8 89.9811H529.2L517.2 111H499.8L487.8 89.9811H483.2L471.2 111H453.8L441.8 89.9811H437.2L425.2 111H406.8L394.8 89.9811H390.2L378.2 111H360.8L348.8 89.9811H344.2L332.2 111H314.8L302.8 89.9811H298.2L286.2 111H268.8L256.8 89.9811H252.2L240.2 111H222.8L210.8 89.9811H206.2L194.2 111H175.8L163.8 89.9811H159.2L147.2 111H129.8L117.8 89.9811H113.2L101.2 111H53.5C39.3444 110.947 25.782 105.303 15.7631 95.2934C5.7441 85.2841 0.0789849 71.7201 0 57.5518V53.4482C0.0528252 39.2718 5.70955 25.6926 15.7342 15.6777C25.7588 5.66276 39.3363 0.0263501 53.5 0H101.2L113.2 21.0189H117.8L129.8 0H147.2L159.2 21.0189H163.8L175.8 0H194.2L206.2 21.0189H210.8L222.8 0H240.2L252.2 21.0189H256.8L268.8 0H286.2L298.2 21.0189H302.8L314.8 0H332.2L344.2 21.0189H348.8L360.8 0H378.2L390.2 21.0189H394.8L406.8 0H425.2L437.2 21.0189H441.8L453.8 0H471.2L483.2 21.0189H487.8L499.8 0H517.2L529.2 21.0189H533.8L545.8 0H563.2L575.2 21.0189H579.8L591.8 0H610.2L622.2 21.0189H626.8L638.8 0H656.2L668.2 21.0189H672.8L684.8 0H702.2L714.2 21.0189H718.8L730.8 0H749.2L761.2 21.0189H765.8L777.8 0H795.2L807.2 21.0189H811.8L823.8 0H841.2L853.2 21.0189H857.8L869.8 0H887.2L899.2 21.0189H903.8L915.8 0H934.2L946.2 21.0189H950.8L962.8 0H980.2L992.2 21.0189H996.8L1008.8 0H1026.2L1038.2 21.0189H1042.8L1054.8 0H1072.2L1084.2 21.0189H1088.8L1100.8 0H1118.2L1130.2 21.0189H1134.8L1146.8 0H1165.2L1177.2 21.0189H1181.8L1193.8 0H1211.2L1223.2 21.0189H1227.8L1239.8 0H1287.5C1301.66 0.0263501 1315.24 5.66276 1325.27 15.6777C1335.29 25.6926 1340.95 39.2718 1341 53.4482V55.55Z";

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
  const peelLayers = document.querySelectorAll("#strip .peel-layer");

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

  peel = new Peel("#strip", {
    path: {
      d: path,
      transform: `scale(${scaleX} ${scaleY})`,
    },
    backShadowSize: 0.1,
	backShadowAlpha: 0.1,
	backReflection: true,
    backReflectionAlpha: .3,
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

  const proxy = { x: startX, y: startY };
	
  const tl = gsap.timeline({
    defaults: {
      duration: 4,
      ease: "power2.out",
      onUpdate() {
        peelInstance.setPeelPosition(proxy.x, proxy.y);
      },
    },
  });

  // Animate the peel
  tl.to(proxy, { x: endX, y: endY });
  tl.to(
    "[data-zoom-wrapper]",
    {
      duration: 2,
			y: "-15vw",		
      z: "490vw",
			ease: "power2,in",
    },
    "=-2"
  );
}
