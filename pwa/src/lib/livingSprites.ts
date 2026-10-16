import type * as maplibregl from 'maplibre-gl';

/**
 * Little figures for the living map (M-17), drawn once on a canvas (no downloads).
 * Vehicles are seen from above, nose to the north, and the map turns them to the road.
 * People, kids and the ball stand up (billboards). Night variants add headlights and
 * tail lights. Pixel ratio 2, so they stay crisp on phones.
 */

const PR = 2;

type Draw = (g: CanvasRenderingContext2D, night: boolean) => void;

const CAR_COLOURS = ['#E4E7EC', '#1D2433', '#C8102E', '#2B6AA6', '#8A93A3'];
const CLOTHES = ['#E5484D', '#2B6AA6', '#00B82E', '#F6C344', '#8B5CF6', '#F28C28'];
const SKIN = ['#6B3E26', '#8D5524', '#5A3825'];

function headlights(g: CanvasRenderingContext2D, w: number, frontY: number) {
  const grad = g.createLinearGradient(0, frontY, 0, frontY - 14);
  grad.addColorStop(0, 'rgba(255,240,180,0.85)');
  grad.addColorStop(1, 'rgba(255,240,180,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(w * 0.2, frontY);
  g.lineTo(-2, frontY - 14);
  g.lineTo(w + 2, frontY - 14);
  g.lineTo(w * 0.8, frontY);
  g.closePath();
  g.fill();
}

function tail(g: CanvasRenderingContext2D, w: number, backY: number) {
  g.fillStyle = '#FF3B3B';
  g.fillRect(1, backY - 2, 2, 2);
  g.fillRect(w - 3, backY - 2, 2, 2);
}

function round(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  // roundRect is missing on older phones (Chrome < 99, Safari < 16): plain corners there.
  if (typeof g.roundRect === 'function') g.roundRect(x, y, w, h, r);
  else g.rect(x, y, w, h);
  g.fill();
}

/** Canvas size for each figure: [width, height] in CSS px (before pixel ratio). */
const SIZE: Record<string, [number, number]> = {
  car: [10, 34],
  danfo: [12, 38],
  brt: [13, 64],
  keke: [10, 30],
  okada: [6, 28],
  person: [8, 16],
  kid: [7, 13],
  ball: [5, 5],
};

// Vehicles: the body sits in the lower part of the canvas; the top 14 px are for headlight beams.
function car(colour: string): Draw {
  return (g, night) => {
    if (night) headlights(g, 10, 14);
    g.fillStyle = colour;
    round(g, 0, 14, 10, 18, 3);
    g.fillStyle = 'rgba(30,40,60,0.75)';
    round(g, 1.5, 17, 7, 4, 1); // windscreen
    round(g, 1.5, 26, 7, 3, 1); // rear window
    if (night) tail(g, 10, 32);
  };
}

const danfo: Draw = (g, night) => {
  if (night) headlights(g, 12, 14);
  g.fillStyle = '#F6C344';
  round(g, 0, 14, 12, 22, 2);
  g.fillStyle = '#1D2433';
  g.fillRect(0, 22, 12, 1.5); // black stripes
  g.fillRect(0, 28, 12, 1.5);
  g.fillStyle = 'rgba(30,40,60,0.75)';
  round(g, 1.5, 16, 9, 4, 1);
  if (night) tail(g, 12, 36);
};

/** BRT bus: long, Lagos BRT blue or Primero red, a row of windows. */
const BRT_COLOURS = ['#1E5AA8', '#C8102E'];
function brt(colour: string): Draw {
  return (g, night) => {
    if (night) headlights(g, 13, 14);
    g.fillStyle = colour;
    round(g, 0, 14, 13, 48, 2);
    g.fillStyle = 'rgba(30,40,60,0.75)';
    round(g, 1.5, 16, 10, 4, 1); // windscreen
    g.fillStyle = '#FFFFFF';
    g.fillRect(5.5, 22, 2, 38); // roof stripe
    if (night) tail(g, 13, 62);
  };
}

const keke: Draw = (g, night) => {
  if (night) headlights(g, 10, 14);
  g.fillStyle = '#00A651';
  round(g, 0, 16, 10, 12, 3);
  g.fillStyle = '#F6C344';
  round(g, 1, 19, 8, 6, 2); // yellow canopy
  g.fillStyle = '#1D2433';
  g.beginPath();
  g.arc(5, 15, 1.6, 0, Math.PI * 2); // front wheel
  g.fill();
  if (night) tail(g, 10, 28);
};

const okada: Draw = (g, night) => {
  if (night) headlights(g, 6, 14);
  g.fillStyle = '#1D2433';
  round(g, 2, 14, 2, 12, 1); // bike
  g.fillStyle = CLOTHES[3];
  round(g, 0.5, 18, 5, 5, 2); // rider
  g.fillStyle = '#C8102E';
  g.beginPath();
  g.arc(3, 18, 2, 0, Math.PI * 2); // helmet
  g.fill();
  if (night) {
    g.fillStyle = '#FF3B3B';
    g.fillRect(2, 25, 2, 1.5);
  }
};

function person(clothes: string, skin: string, h: number, w: number): Draw {
  return (g) => {
    g.fillStyle = skin;
    g.beginPath();
    g.arc(w / 2, h * 0.16, h * 0.14, 0, Math.PI * 2); // head
    g.fill();
    g.fillStyle = clothes;
    round(g, w * 0.15, h * 0.3, w * 0.7, h * 0.38, 2); // top
    g.fillStyle = '#2E3548';
    g.fillRect(w * 0.25, h * 0.66, w * 0.18, h * 0.32); // legs
    g.fillRect(w * 0.57, h * 0.66, w * 0.18, h * 0.32);
  };
}

const ball: Draw = (g) => {
  g.fillStyle = '#FFFFFF';
  g.beginPath();
  g.arc(2.5, 2.5, 2.3, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1D2433';
  g.beginPath();
  g.arc(2.5, 2.5, 0.9, 0, Math.PI * 2);
  g.fill();
};

function image(kind: string, draw: Draw, night: boolean) {
  const [w, h] = SIZE[kind];
  const c = document.createElement('canvas');
  c.width = w * PR;
  c.height = h * PR;
  const g = c.getContext('2d');
  if (!g) return null;
  g.scale(PR, PR);
  draw(g, night);
  return g.getImageData(0, 0, c.width, c.height);
}

/** Every sprite name the living map uses: `${kind}-${variant}` and `${vehicle}-${variant}-night`. */
export function ensureLivingSprites(map: maplibregl.Map) {
  if (typeof document === 'undefined' || map.hasImage('person-0')) return;
  const add = (name: string, kind: string, draw: Draw, night = false) => {
    const img = image(kind, draw, night);
    if (img && !map.hasImage(name)) map.addImage(name, img, { pixelRatio: PR });
  };
  for (let v = 0; v < 5; v++) {
    for (const night of [false, true]) {
      const n = night ? '-night' : '';
      add(`car-${v}${n}`, 'car', car(CAR_COLOURS[v]), night);
      add(`danfo-${v}${n}`, 'danfo', danfo, night);
      add(`keke-${v}${n}`, 'keke', keke, night);
      add(`okada-${v}${n}`, 'okada', okada, night);
      add(`brt-${v}${n}`, 'brt', brt(BRT_COLOURS[v % BRT_COLOURS.length]), night);
    }
  }
  for (let v = 0; v < 6; v++) add(`person-${v}`, 'person', person(CLOTHES[v], SKIN[v % SKIN.length], 16, 8));
  add('kid-0', 'kid', person('#E5484D', SKIN[0], 13, 7)); // red team
  add('kid-1', 'kid', person('#2B6AA6', SKIN[1], 13, 7)); // blue team
  add('ball-0', 'ball', ball);
}
