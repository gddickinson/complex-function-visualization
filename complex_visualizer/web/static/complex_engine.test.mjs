// Node test: complex_engine.js against values computed by the Python package (tests/fixtures/engine_fixture.json,
// made by scripts/make_engine_fixture.py from create_example_functions, transform_complex and the images that
// plot_domain_coloring / create_transformation_animation hand to matplotlib).
// Run: node complex_visualizer/web/static/complex_engine.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as E from './complex_engine.js';

const fx = JSON.parse(readFileSync(fileURLToPath(new URL('../../../tests/fixtures/engine_fixture.json', import.meta.url)), 'utf8'));
const dec = v => (typeof v === 'string' ? Number(v.replace('inf', 'Infinity')) : v);
let fails = 0, checks = 0;
function close(a, b, what, rtol = 1e-12, atol = 1e-12) {
  checks++;
  a = dec(a); b = dec(b);
  // matplotlib masks nan and inf alike (the fixture stores masked pixels as nan)
  const ok = (!Number.isFinite(a) && Number.isNaN(b)) || (Number.isNaN(a) && Number.isNaN(b)) || a === b || Math.abs(a - b) <= atol + rtol * Math.abs(b);
  if (!ok) { fails++; if (fails < 15) console.log(`FAIL ${what}: js ${a} python ${b}`); }
}
// Bytes must match exactly, except pixels whose value sits within 1e-9 of a colour-bin edge (there a last-ulp libm
// difference, e.g. log1p(2) in JS vs numpy, may legitimately pick the neighbouring bin). v, lo, hi: values and scale.
function sameBytes(js, py, what, v = null, lo = 0, hi = 1) {
  checks++;
  let bad = 0, worst = 0, edge = 0;
  for (let k = 0; k < py.length; k++) {
    const d = Math.abs(js[k] - py[k]);
    if (!d) continue;
    const s = v ? (v[k >> 2] - lo) / (hi - lo) * 256 : NaN;
    if (Math.abs(s - Math.round(s)) < 1e-9) { edge++; continue; }
    bad++; worst = Math.max(worst, d);
  }
  if (edge) console.log(`note ${what}: ${edge} bytes differ at exact bin edges (libm last digit)`);
  if (bad) { fails++; console.log(`FAIL ${what}: ${bad} of ${py.length} bytes differ (max ${worst})`); }
}

// labels and order match create_example_functions()
const labels = [...new Set(fx.grids.map(g => g.f))].length;
if (labels !== E.FUNCTIONS.length) { fails++; console.log('FAIL function count'); }

// single points, including the guarded singularities z = 1 and z = -1 and branch cuts
for (const p of fx.points) {
  const w = E.FUNCTIONS[p.f].f(p.z);
  close(w[0], p.w[0], `${E.FUNCTIONS[p.f].label} at ${p.z} re`);
  close(w[1], p.w[1], `${E.FUNCTIONS[p.f].label} at ${p.z} im`);
}

for (const [a, b, n, ref] of fx.linspace) {
  const x = E.linspace(a, b, n);
  ref.forEach((v, i) => close(x[i], v, `linspace(${a}, ${b}, ${n})[${i}]`, 0, 0));
}

// whole grids: f(Z), the plotted quantities, and the RGBA bytes matplotlib renders (before row flipping)
for (const g of fx.grids) {
  const fn = E.FUNCTIONS[g.f], grid = E.makeGrid(g.size, g.range), W = E.transform(fn.f, grid);
  const tag = `${fn.label} ${g.range}`;
  g.re.forEach((v, k) => close(W.re[k], v, `${tag} re[${k}]`));
  g.im.forEach((v, k) => close(W.im[k], v, `${tag} im[${k}]`));
  const ph = E.phase(W), mag = E.logMagnitude(W);
  g.phase.forEach((v, k) => close(ph[k], v, `${tag} phase[${k}]`));
  g.magnitude.forEach((v, k) => close(mag[k], v, `${tag} magnitude[${k}]`));
  const pr = E.colourRange(ph, 'phase'), mr = E.colourRange(mag, 'magnitude');
  pr.forEach((v, i) => close(v, g.phase_clim[i], `${tag} phase clim`));
  mr.forEach((v, i) => close(v, g.magnitude_clim[i], `${tag} magnitude clim`));
  sameBytes(E.colorize(ph, fx.colormaps.phase, ...pr), g.phase_rgba, `${tag} phase RGBA`, ph, ...pr);
  sameBytes(E.colorize(mag, fx.colormaps.viridis, ...mr), g.magnitude_rgba, `${tag} magnitude RGBA`, mag, ...mr);
  if (g.phase_origin !== 'lower') { fails++; console.log(`FAIL ${tag}: Python image origin is ${g.phase_origin}`); }
  // image(): top canvas row must be the grid's last row (largest Im z)
  const img = E.image(W, 'phase', fx.colormaps.phase, g.size).rgba, w = g.size * 4, n = g.size;
  sameBytes(img.subarray(0, w), g.phase_rgba.slice((n - 1) * w, n * w), `${tag} flipped top row`);
}

// animation frames: t = k / frames, W = Z + t (f(Z) - Z), phase coloured on the fixed [0, 1] scale
for (const a of fx.animation) {
  const fn = E.FUNCTIONS[a.f], grid = E.makeGrid(Math.sqrt(a.phase.length)), F = E.transform(fn.f, grid);
  const t = E.frameT(a.k, a.frames);
  if (!a.title.endsWith(`t = ${t.toFixed(2)}`)) { fails++; console.log(`FAIL title ${a.title} vs t ${t}`); }
  const ph = E.phase(E.morph(grid, F, t));
  a.phase.forEach((v, k) => close(ph[k], v, `${fn.label} frame ${a.k} phase[${k}]`));
  sameBytes(E.colorize(ph, fx.colormaps.phase, 0, 1), a.rgba, `${fn.label} frame ${a.k} RGBA`, ph);
}

console.log(`${checks - fails}/${checks} checks agree with the Python package`);
process.exit(fails ? 1 : 0);
