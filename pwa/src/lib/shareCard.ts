/**
 * "Today in <area>" share card (mockup, share card 1): the person's live sky over their
 * area with today's real goings-on, as a 1080x1920 picture (WhatsApp status / story size).
 * Drawn on the phone, so it works without a server. Safety alerts never go on it (safety
 * reports are not shared publicly); only what the map already shows everyone nearby.
 */
import type { SkyState } from '@/lib/sky';

export type ShareRow = { icon: string; text: string };

export type TodayCard = {
  area: string;
  date: Date;
  sky: SkyState;
  /** "🌧️ Rain now" or null when the weather is not known (never a guess). */
  weather: string | null;
  rows: ShareRow[];
  /** Short link shown on the card (the real one goes with the share). */
  linkLabel: string;
};

const W = 1080;
const H = 1920;
const S = 3; // the mockup's 360x640 card, 3x

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Words onto lines no wider than maxW. */
function wrap(g: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (g.measureText(next).width > maxW && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else line = next;
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(' ') !== lines.join(' ')) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s*\S*$/, '')}…`;
  }
  return lines;
}

function palm(g: CanvasRenderingContext2D, x: number, base: number, h: number) {
  g.beginPath();
  g.moveTo(x - 4, base);
  g.quadraticCurveTo(x + 6, base - h * 0.5, x + 2, base - h);
  g.lineTo(x + 8, base - h);
  g.quadraticCurveTo(x + 12, base - h * 0.5, x + 4, base);
  g.fill();
  for (const a of [-2.6, -2.0, -1.2, -0.5, 0.1]) {
    g.beginPath();
    g.ellipse(x + 5 + Math.cos(a) * 34, base - h + Math.sin(a) * 18, 40, 9, a, 0, Math.PI * 2);
    g.fill();
  }
}

export async function drawTodayCard(c: TodayCard): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d')!;
  const font = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
  const { sky } = c;
  const horizon = H * 0.5;

  // Sky
  const grad = g.createLinearGradient(0, 0, 0, horizon);
  grad.addColorStop(0, sky.skyTop);
  grad.addColorStop(1, sky.skyBot);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, horizon + 4);
  if (sky.starOpacity > 0) {
    g.fillStyle = `rgba(255,255,255,${sky.starOpacity})`;
    for (let i = 0; i < 70; i++) {
      const x = (i * 197) % W;
      const y = ((i * 89) % (horizon * 0.8)) + 20;
      g.fillRect(x, y, i % 5 ? 3 : 5, i % 5 ? 3 : 5);
    }
  }
  const body = (b: { x: number; arc: number }) => ({ x: W * (0.1 + 0.8 * b.x), y: horizon - 60 - b.arc * (horizon - 360) });
  if (sky.sun.up && sky.sun.opacity > 0) {
    const p = body(sky.sun);
    g.globalAlpha = sky.sun.opacity;
    g.shadowColor = sky.sun.glow;
    g.shadowBlur = 120;
    g.fillStyle = sky.sun.color;
    g.beginPath();
    g.arc(p.x, p.y, 78, 0, Math.PI * 2);
    g.fill();
    g.shadowBlur = 0;
    g.globalAlpha = 1;
  }
  if (sky.moon.up && sky.moon.opacity > 0) {
    const p = body(sky.moon);
    g.globalAlpha = sky.moon.opacity;
    g.fillStyle = '#F4F2E6';
    g.shadowColor = 'rgba(220,225,255,.6)';
    g.shadowBlur = 60;
    g.beginPath();
    g.arc(p.x, p.y, 60, 0, Math.PI * 2);
    g.fill();
    g.shadowBlur = 0;
    g.globalAlpha = 1;
  }

  // Horizon: bush line and palms, then the land with a soft wash of the hour's light.
  g.fillStyle = sky.skyline;
  g.beginPath();
  g.moveTo(0, horizon + 10);
  for (let x = 0; x <= W; x += 60) g.quadraticCurveTo(x + 30, horizon - 26 - ((x / 60) % 3) * 8, x + 60, horizon + 6);
  g.lineTo(W, horizon + 40);
  g.lineTo(0, horizon + 40);
  g.fill();
  for (const [x, h] of [[90, 150], [300, 120], [560, 170], [790, 130], [1000, 155]]) palm(g, x, horizon + 8, h);
  const land = g.createLinearGradient(0, horizon, 0, H);
  land.addColorStop(0, '#A9CF8E');
  land.addColorStop(1, '#C9E3B4');
  g.fillStyle = land;
  g.fillRect(0, horizon + 30, W, H - horizon);
  g.strokeStyle = 'rgba(255,255,255,.7)';
  g.lineWidth = 34;
  g.beginPath();
  g.moveTo(-40, H * 0.86);
  g.quadraticCurveTo(W * 0.45, H * 0.58, W + 40, H * 0.62);
  g.stroke();
  if (sky.tintAlpha > 0) {
    g.globalAlpha = sky.tintAlpha;
    g.fillStyle = sky.tint;
    g.fillRect(0, 0, W, H);
    g.globalAlpha = 1;
  }

  // Brand and place pills
  g.font = `700 ${17 * S}px ${font}`;
  const neybor = g.measureText('Neybor').width;
  const huud = g.measureText('Huud').width;
  const brandW = neybor + huud + 28 * S;
  g.fillStyle = 'rgba(255,255,255,.96)';
  roundRect(g, 14 * S, 16 * S, brandW, 36 * S, 18 * S);
  g.fill();
  g.textBaseline = 'middle';
  g.fillStyle = '#1D2433';
  g.fillText('Neybor', 28 * S, 34 * S);
  g.fillStyle = '#00B82E';
  g.fillText('Huud', 28 * S + neybor, 34 * S);
  g.font = `800 ${12 * S}px ${font}`;
  const place = `📍 ${c.area}`;
  const placeW = g.measureText(place).width + 24 * S;
  g.fillStyle = 'rgba(14,138,62,.92)';
  roundRect(g, W - 14 * S - placeW, 19 * S, placeW, 30 * S, 15 * S);
  g.fill();
  g.fillStyle = '#FFFFFF';
  g.fillText(place, W - 14 * S - placeW + 12 * S, 34 * S);

  // Panel: label, headline, rows, call to action
  const rows = c.rows.slice(0, 4);
  const px = 14 * S;
  const pw = W - 28 * S;
  const inner = pw - 32 * S;
  g.font = `600 ${24 * S}px ${font}`;
  const headline = `${c.weather ? `${c.weather}. ` : ''}Here’s wetin dey happen.`;
  const hl = wrap(g, headline, inner, 3);
  const panelH = 16 * S + 26 * S + hl.length * 28 * S + 6 * S + rows.length * 40 * S + 16 * S + 34 * S + 16 * S;
  const py = H - 16 * S - panelH;
  g.fillStyle = 'rgba(255,255,255,.97)';
  g.shadowColor = 'rgba(29,36,51,.2)';
  g.shadowBlur = 30 * S;
  roundRect(g, px, py, pw, panelH, 24 * S);
  g.fill();
  g.shadowBlur = 0;

  let y = py + 16 * S;
  g.textBaseline = 'top';
  g.fillStyle = '#5B6478';
  g.font = `800 ${11 * S}px ${font}`;
  const day = c.date.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
  g.fillText(`TODAY IN ${c.area.toUpperCase()} · ${day}`, px + 16 * S, y);
  y += 26 * S;
  g.fillStyle = '#1D2433';
  g.font = `600 ${24 * S}px ${font}`;
  for (const line of hl) {
    g.fillText(line, px + 16 * S, y);
    y += 28 * S;
  }
  y += 6 * S;
  g.font = `700 ${13 * S}px ${font}`;
  for (const r of rows) {
    g.fillStyle = '#F3F5F9';
    g.beginPath();
    g.arc(px + 31 * S, y + 15 * S, 15 * S, 0, Math.PI * 2);
    g.fill();
    g.textBaseline = 'middle';
    g.font = `${15 * S}px ${font}`;
    g.fillStyle = '#1D2433';
    g.fillText(r.icon, px + 23 * S, y + 16 * S);
    g.font = `700 ${13 * S}px ${font}`;
    g.fillText(wrap(g, r.text, inner - 44 * S, 1)[0] ?? '', px + 56 * S, y + 15 * S);
    g.textBaseline = 'top';
    y += 40 * S;
  }
  g.strokeStyle = '#EEF1F5';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(px + 16 * S, y + 4 * S);
  g.lineTo(px + pw - 16 * S, y + 4 * S);
  g.stroke();
  y += 16 * S;
  g.fillStyle = '#0E8A3E';
  g.font = `800 ${12.5 * S}px ${font}`;
  g.fillText('See your own street', px + 16 * S, y);
  g.fillStyle = '#5B6478';
  g.font = `700 ${11 * S}px ${font}`;
  g.fillText(c.linkLabel, px + 16 * S, y + 18 * S);
  g.font = `800 ${12.5 * S}px ${font}`;
  const joinW = g.measureText('Join free').width + 28 * S;
  g.fillStyle = '#00B82E';
  roundRect(g, px + pw - 16 * S - joinW, y - 2 * S, joinW, 34 * S, 17 * S);
  g.fill();
  g.fillStyle = '#FFFFFF';
  g.textBaseline = 'middle';
  g.fillText('Join free', px + pw - 16 * S - joinW + 14 * S, y + 15 * S);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the picture'))), 'image/png'),
  );
}
