// Shared drawing helpers: load the setup (functions, colormaps, defaults) from the API, draw a coloured grid as a
// matplotlib-like plot (axes, ticks, colour bar), the function picker, and the pointer readout.
import { api, esc, list } from './core.js';
import * as E from './complex_engine.js';

let setup = null;
// { info, functions (API, with labels from Python), luts: { phase, viridis } }; checks the JS labels match Python.
export async function loadSetup() {
  if (setup) return setup;
  const [info, functions, luts] = await Promise.all([api('/info'), api('/functions'), api('/colormaps')]);
  functions.forEach((f, i) => {
    if (E.FUNCTIONS[i]?.label !== f.label) console.error(`JS function ${i} is not "${f.label}"`);
    f.key = E.FUNCTIONS[i].key;
  });
  setup = { info, functions, luts };
  return setup;
}

export const lutFor = (luts, kind) => (kind === 'phase' ? luts.phase : luts.viridis);

export function functionSelect(id, functions, key) {
  return `<label for="${id}">Function</label><select id="${id}">${list(functions, f =>
    `<option value="${f.key}"${f.key === key ? ' selected' : ''}>${esc(f.label)}</option>`)}</select>`;
}

const fmt = v => (Math.abs(v) < 1e-12 ? '0' : Math.abs(v) >= 1e4 || Math.abs(v) < 1e-3 ? v.toExponential(3) : v.toFixed(4));
export const fmtC = w => (!Number.isFinite(w[0]) || !Number.isFinite(w[1])) ? `${w[0]} ${w[1] < 0 ? '-' : '+'} ${Math.abs(w[1])}i`
  : `${fmt(w[0])} ${w[1] < 0 || Object.is(w[1], -0) ? '−' : '+'} ${fmt(Math.abs(w[1]))}i`;

// Nice tick positions inside [lo, hi].
function ticks(lo, hi, n = 5) {
  const raw = (hi - lo) / n, p = 10 ** Math.floor(Math.log10(raw)), m = raw / p;
  const step = (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  const out = [];
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9 * step; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}
const tickText = v => +v.toFixed(6) + '';

// Plot geometry inside a display canvas: margins for the axis labels, a square image, a colour bar on the right.
export const PLOT = { left: 62, top: 40, right: 104, bottom: 48 };
export function plotBox(canvas) {
  const side = Math.min(canvas.width - PLOT.left - PLOT.right, canvas.height - PLOT.top - PLOT.bottom);
  return { x: PLOT.left, y: PLOT.top, side };
}

// Draw rgba (size x size, top row = largest Im z) with axes for range [lo, hi] on both axes, a title and a colour bar.
export function drawPlot(canvas, { rgba, size, range, title, lut, clim, cbarLabel }) {
  const ctx = canvas.getContext('2d'), { x, y, side } = plotBox(canvas);
  const css = getComputedStyle(document.documentElement);
  const ink = css.getPropertyValue('--ink').trim() || '#e8f1ff', mute = css.getPropertyValue('--mute').trim() || '#94a3c6';
  ctx.fillStyle = '#07080f'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff'; ctx.fillRect(x, y, side, side); // matplotlib's masked (non-finite) pixels show the white figure
  const off = new OffscreenCanvasLike(size);
  off.ctx.putImageData(new ImageData(rgba, size, size), 0, 0);
  ctx.imageSmoothingEnabled = size < side;
  ctx.drawImage(off.canvas, x, y, side, side);
  ctx.strokeStyle = mute; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, side - 1, side - 1);
  ctx.font = '16px ui-monospace, Menlo, monospace'; ctx.fillStyle = mute;
  const [lo, hi] = range, px = v => x + (v - lo) / (hi - lo) * side, py = v => y + side - (v - lo) / (hi - lo) * side;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (const v of ticks(lo, hi)) { ctx.fillRect(px(v), y + side, 1, 6); ctx.fillText(tickText(v), px(v), y + side + 8); }
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const v of ticks(lo, hi)) { ctx.fillRect(x - 6, py(v), 6, 1); ctx.fillText(tickText(v), x - 9, py(v)); }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'right'; ctx.fillText('Re z →', x + side, canvas.height - 2);
  ctx.save(); ctx.translate(14, y); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'right'; ctx.fillText('Im z →', 0, 0); ctx.restore();
  if (title) { ctx.fillStyle = ink; ctx.font = '600 19px -apple-system, Helvetica, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(title, x + side / 2, 26); }
  if (lut) colourBar(ctx, lut, clim, cbarLabel, x + side + 14, y, side, mute);
}

function colourBar(ctx, lut, [vmin, vmax], label, x, y, h, mute) {
  const w = 18;
  for (let i = 0; i < h; i++) {
    const c = lut[Math.min(lut.length - 1, Math.floor((1 - i / h) * lut.length))];
    ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; ctx.fillRect(x, y + i, w, 1);
  }
  ctx.strokeStyle = mute; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = mute; ctx.font = '15px ui-monospace, Menlo, monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  if (vmax > vmin) for (const v of ticks(vmin, vmax, 4)) ctx.fillText(tickText(+v.toFixed(3)), x + w + 4, y + h - (v - vmin) / (vmax - vmin) * h);
  ctx.save(); ctx.translate(x + w + 64, y + h / 2); ctx.rotate(Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText(label || '', 0, 0); ctx.restore();
}

// Small helper so drawPlot works with a plain <canvas> where OffscreenCanvas is missing.
function OffscreenCanvasLike(size) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  this.canvas = c; this.ctx = c.getContext('2d');
}

// Draw a bare image (no axes) filling the canvas: used for thumbnails and the hero.
export function drawBare(canvas, rgba, size) {
  const off = new OffscreenCanvasLike(size);
  off.ctx.putImageData(new ImageData(rgba, size, size), 0, 0);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(off.canvas, 0, 0, canvas.width, canvas.height);
}

// Complex number under the pointer for a canvas drawn with drawPlot, or null outside the image.
export function pointerZ(canvas, ev, [lo, hi]) {
  const r = canvas.getBoundingClientRect(), sx = canvas.width / r.width, sy = canvas.height / r.height;
  const cx = (ev.clientX - r.left) * sx, cy = (ev.clientY - r.top) * sy, { x, y, side } = plotBox(canvas);
  if (cx < x || cx > x + side || cy < y || cy > y + side) return null;
  return [lo + (cx - x) / side * (hi - lo), lo + (y + side - cy) / side * (hi - lo)];
}

// Readout lines for z and f(z) (computed exactly at z, not read from the grid).
export function readout(fn, z) {
  if (!z) return '<div><span>Point at the plot to read f(z)</span></div>';
  const w = fn.f(z), mag = Math.hypot(w[0], w[1]), ph = Math.atan2(w[1], w[0]);
  return `<div><span>z</span><b>${fmtC(z)}</b></div><div><span>f(z)</span><b>${fmtC(w)}</b></div>
    <div><span>|f(z)|</span><b>${fmt(mag)}</b></div><div><span>arg f(z)</span><b>${fmt(ph)} rad</b></div>
    <div><span>phase/(2π) + 0.5</span><b>${fmt(ph / (2 * Math.PI) + 0.5)}</b></div>`;
}

// Read and write the page's query (in the hash) without re-rendering the route.
export function setQuery(page, q) {
  const qs = new URLSearchParams(Object.entries(q).filter(([, v]) => v !== undefined && v !== '')).toString();
  history.replaceState(null, '', `#/${page}${qs ? '?' + qs : ''}`);
}
export const num = (v, d, lo = -Infinity, hi = Infinity) => {
  const x = parseFloat(v);
  return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d;
};
