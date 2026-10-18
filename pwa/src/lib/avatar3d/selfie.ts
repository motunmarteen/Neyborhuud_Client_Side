/**
 * "Start from a selfie" (owner 2026-10-18: on the phone, free). The photo never leaves the
 * phone: we look at the cheeks (using the browser's face detector when it has one, otherwise
 * the middle of the picture), take the typical skin colour, and pick the nearest tone.
 */

type Tone = { id: string; color?: string };

function toLab(r: number, g: number, b: number): [number, number, number] {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

type FaceBox = { x: number; y: number; width: number; height: number };

async function findFace(img: ImageBitmap): Promise<FaceBox | null> {
  const FD = (window as unknown as { FaceDetector?: new (o?: object) => { detect: (i: ImageBitmap) => Promise<{ boundingBox: FaceBox }[]> } }).FaceDetector;
  if (!FD) return null;
  try {
    const faces = await new FD({ fastMode: true, maxDetectedFaces: 1 }).detect(img);
    return faces[0]?.boundingBox ?? null;
  } catch {
    return null;
  }
}

/** The skin tone id closest to the selfie, or null if the picture can't be read. */
export async function skinToneFromSelfie(file: File, tones: Tone[]): Promise<string | null> {
  let img: ImageBitmap;
  try {
    img = await createImageBitmap(file);
  } catch {
    return null;
  }
  const face = await findFace(img);
  const W = 240;
  const scale = W / img.width;
  const H = Math.round(img.height * scale);
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true });
  if (!g) return null;
  g.drawImage(img, 0, 0, W, H);
  img.close();
  // Cheeks: the lower middle of the face box, or the middle of the photo.
  const box = face
    ? { x: (face.x + face.width * 0.2) * scale, y: (face.y + face.height * 0.45) * scale, w: face.width * 0.6 * scale, h: face.height * 0.3 * scale }
    : { x: W * 0.35, y: H * 0.38, w: W * 0.3, h: H * 0.22 };
  const data = g.getImageData(Math.max(0, box.x | 0), Math.max(0, box.y | 0), Math.max(1, box.w | 0), Math.max(1, box.h | 0)).data;
  const px: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += 4) {
    const [r, gg, b] = [data[i], data[i + 1], data[i + 2]];
    const lum = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
    // Skip shadows, glare and things that aren't skin-like (skin is red ≥ green ≥ blue, roughly).
    if (lum < 25 || lum > 240 || r < gg || r < b) continue;
    px.push([r, gg, b]);
  }
  if (px.length < 20) return null;
  const med = (k: 0 | 1 | 2) => px.map((p) => p[k]).sort((a, b) => a - b)[px.length >> 1];
  const lab = toLab(med(0), med(1), med(2));
  let best: string | null = null;
  let bestD = Infinity;
  for (const t of tones) {
    if (!t.color) continue;
    const [L, A, B] = toLab(...hexRgb(t.color));
    // Lightness matters most for matching skin.
    const d = 2 * (L - lab[0]) ** 2 + (A - lab[1]) ** 2 + (B - lab[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = t.id;
    }
  }
  return best;
}
