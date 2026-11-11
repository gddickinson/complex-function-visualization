// Pure JS port of complex_visualizer (functions.py + visualizer.py + the matplotlib colour step), no DOM.
// Complex numbers are [re, im] pairs. Node-tested against values computed by the Python package
// (tests/fixtures/engine_fixture.json, made by scripts/make_engine_fixture.py).

// --- complex arithmetic (principal branches, as Python's cmath) ------------------------------------------------
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export function div(a, b) {
  // Smith's algorithm (what CPython uses for complex division)
  const [c, d] = b;
  if (Math.abs(c) >= Math.abs(d)) {
    if (c === 0 && d === 0) throw new RangeError('complex division by zero');
    const r = d / c, den = c + d * r;
    return [(a[0] + a[1] * r) / den, (a[1] - a[0] * r) / den];
  }
  const r = c / d, den = c * r + d;
  return [(a[0] * r + a[1]) / den, (a[1] * r - a[0]) / den];
}
export const abs = a => Math.hypot(a[0], a[1]);
export const arg = a => Math.atan2(a[1], a[0]);
export function exp(a) { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; }
export const sin = a => [Math.sin(a[0]) * Math.cosh(a[1]), Math.cos(a[0]) * Math.sinh(a[1])];
export function sqrt(a) {
  const [x, y] = a;
  if (x === 0 && y === 0) return [0, y];
  const t = Math.sqrt((Math.abs(x) + Math.hypot(x, y)) / 2);
  return x >= 0 ? [t, y / (2 * t)] : [Math.abs(y) / (2 * t), y < 0 || Object.is(y, -0) ? -t : t];
}
export const log = a => [Math.log(Math.hypot(a[0], a[1])), Math.atan2(a[1], a[0])];
const INF = [Infinity, 0]; // Python's complex('inf'), returned at the two guarded singularities

// The eight functions of create_example_functions(), same order and labels.
export const FUNCTIONS = [
  { key: 'z2', label: 'f(z) = z²', f: z => mul(z, z) },
  { key: 'z3m1', label: 'f(z) = z³ - 1', f: z => sub(mul(mul(z, z), z), [1, 0]) },
  { key: 'exp', label: 'f(z) = exp(z)', f: exp },
  { key: 'sin', label: 'f(z) = sin(z)', f: sin },
  { key: 'rational', label: 'f(z) = z/(1-z)', f: z => (z[0] === 1 && z[1] === 0 ? INF : div(z, sub([1, 0], z))) },
  { key: 'sqrt', label: 'f(z) = sqrt(z)', f: sqrt },
  { key: 'zexp', label: 'f(z) = z·exp(z)', f: z => mul(z, exp(z)) },
  { key: 'log', label: 'f(z) = ln(1+z)', f: z => (z[0] === -1 && z[1] === 0 ? INF : log(add([1, 0], z))) },
];
export const byKey = key => FUNCTIONS.find(f => f.key === key) || FUNCTIONS[0];

// numpy.linspace(start, stop, n)
export function linspace(start, stop, n) {
  const out = new Float64Array(n);
  if (n === 1) { out[0] = start; return out; }
  const step = (stop - start) / (n - 1);
  for (let i = 0; i < n; i++) out[i] = i * step + start;
  out[n - 1] = stop;
  return out;
}

// ComplexVisualizer grid: Z[j, i] = x[i] + i*y[j], row j = y[j] (y ascending), stored row-major.
export function makeGrid(size, xr = [-2, 2], yr = xr) {
  const x = linspace(xr[0], xr[1], size), y = linspace(yr[0], yr[1], size);
  const re = new Float64Array(size * size), im = new Float64Array(size * size);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) { re[j * size + i] = x[i]; im[j * size + i] = y[j]; }
  return { size, xr, yr, re, im };
}

// transform_complex: apply f to every grid point.
export function transform(fn, grid) {
  const n = grid.re.length, re = new Float64Array(n), im = new Float64Array(n);
  for (let k = 0; k < n; k++) { const w = fn([grid.re[k], grid.im[k]]); re[k] = w[0]; im[k] = w[1]; }
  return { re, im };
}

// Animation frame: W = Z + t * (f(Z) - Z), with t promoted to complex as numpy does (so 0 * inf gives nan).
export function morph(grid, F, t, out) {
  const n = grid.re.length;
  out = out || { re: new Float64Array(n), im: new Float64Array(n) };
  for (let k = 0; k < n; k++) {
    const dr = F.re[k] - grid.re[k], di = F.im[k] - grid.im[k];
    out.re[k] = grid.re[k] + (t * dr - 0 * di);
    out.im[k] = grid.im[k] + (t * di + 0 * dr);
  }
  return out;
}
// Frame k of create_transformation_animation has t = k / frames, k = 0 .. frames-1.
export const frameT = (k, frames) => k / frames;

// The two plotted quantities: phase = angle(W)/(2π) + 0.5 and magnitude = log1p(|W|).
export function phase(W, out) {
  const n = W.re.length; out = out || new Float64Array(n);
  for (let k = 0; k < n; k++) out[k] = Math.atan2(W.im[k], W.re[k]) / (2 * Math.PI) + 0.5;
  return out;
}
export function logMagnitude(W, out) {
  const n = W.re.length; out = out || new Float64Array(n);
  for (let k = 0; k < n; k++) out[k] = Math.log1p(Math.hypot(W.re[k], W.im[k]));
  return out;
}

// imshow autoscale: min and max over the finite values (matplotlib masks nan and inf).
export function finiteRange(v) {
  let lo = Infinity, hi = -Infinity;
  for (let k = 0; k < v.length; k++) { const x = v[k]; if (Number.isFinite(x)) { if (x < lo) lo = x; if (x > hi) hi = x; } }
  return lo === Infinity ? [0, 1] : [lo, hi];
}

// matplotlib Normalize + Colormap lookup (bytes=True) into RGBA bytes. lut: 256 [r,g,b,a] rows.
// Non-finite values get the "bad" colour, transparent like matplotlib (shown as the page/figure background).
export function colorize(v, lut, vmin, vmax, out) {
  const N = lut.length, n = v.length;
  out = out || new Uint8ClampedArray(n * 4);
  const span = vmax - vmin;
  for (let k = 0; k < n; k++) {
    const x = v[k], o = k * 4;
    if (!Number.isFinite(x)) { out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0; continue; }
    const s = span === 0 ? 0 : (x - vmin) / span;
    let idx = Math.floor(s * N);
    if (s * N === N) idx = N - 1;
    idx = idx < 0 ? 0 : idx > N - 1 ? N - 1 : idx;
    const c = lut[idx];
    out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = c[3];
  }
  return out;
}

// Value range used by visualizer.py: phase images are fixed to [0, 1] (one turn of hue = 2π), magnitude images are
// autoscaled by imshow to the finite min..max.
export function colourRange(v, kind) {
  return kind === 'phase' ? [0, 1] : finiteRange(v);
}

// Canvas rows run top-down, the grid's rows bottom-up (origin='lower'): reverse the row order for drawing.
export function flipRows(rgba, size) {
  const out = new Uint8ClampedArray(rgba.length), w = size * 4;
  for (let j = 0; j < size; j++) out.set(rgba.subarray(j * w, (j + 1) * w), (size - 1 - j) * w);
  return out;
}

// One coloured image (top row first) of a quantity: 'phase' or 'magnitude'.
export function image(W, kind, lut, size) {
  const v = kind === 'phase' ? phase(W) : logMagnitude(W);
  const [lo, hi] = colourRange(v, kind);
  return { rgba: flipRows(colorize(v, lut, lo, hi), size), range: [lo, hi] };
}
