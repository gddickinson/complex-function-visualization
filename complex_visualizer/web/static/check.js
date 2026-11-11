// Cross-check: the browser engine against the Python package. /api/grid/<i> is ComplexVisualizer.transform_complex
// run by NumPy (on the server, or exported at build time for the static site); the page recomputes the same grid in
// JS and reports the largest differences, value by value.
import { route, app, api, esc, list, isStatic, needsServer, $ } from './core.js';
import * as E from './complex_engine.js';
import { loadSetup, drawBare, drawPlot } from './render.js';

const rel = (a, b) => Math.abs(a - b) / Math.max(1, Math.abs(b));
function compare(py, fn) {
  const grid = E.makeGrid(py.size, py.range), W = E.transform(fn.f, grid), ph = E.phase(W), mag = E.logMagnitude(W);
  let dW = 0, dP = 0, dM = 0, masked = 0, maskedOk = 0;
  for (let k = 0; k < py.re.length; k++) {
    if (py.re[k] === null || py.im[k] === null) {
      masked++; maskedOk += !(Number.isFinite(W.re[k]) && Number.isFinite(W.im[k])); continue;
    }
    dW = Math.max(dW, rel(W.re[k], py.re[k]), rel(W.im[k], py.im[k]));
    dP = Math.max(dP, Math.abs(ph[k] - py.phase[k])); dM = Math.max(dM, rel(mag[k], py.magnitude[k]));
  }
  return { W, dW, dP, dM, masked, maskedOk, n: py.re.length };
}
const sci = v => (v === 0 ? '0' : v.toExponential(1));

async function table(S, size, lo, hi) {
  const q = size ? `?size=${size}&lo=${lo}&hi=${hi}` : '';
  const rows = await Promise.all(S.functions.map(async (f, i) => ({ f, py: await api(`/grid/${i}${q}`) })));
  const out = rows.map(({ f, py }) => ({ f, py, ...compare(py, E.byKey(f.key)) }));
  const worst = Math.max(...out.map(r => r.dW));
  $('#res').innerHTML = `
  <p class="${worst < 1e-9 ? 'ok' : 'err'}">${out.length} functions on a ${out[0].py.size}×${out[0].py.size} grid over
  [${out[0].py.range.join(', ')}]: largest relative difference in f(z) is ${sci(worst)}.</p>
  <div class="scroll"><table class="check"><thead><tr><th>Function</th><th>Python phase</th><th>JS phase</th>
    <th>max Δ f(z) (rel.)</th><th>max Δ phase</th><th>max Δ log1p|f|</th><th>non-finite points</th></tr></thead><tbody>
  ${list(out, (r, i) => `<tr><td>${esc(r.f.label)}</td><td><canvas width="72" height="72" id="py${i}" role="img" aria-label="Python phase"></canvas></td>
    <td><canvas width="72" height="72" id="js${i}" role="img" aria-label="JS phase"></canvas></td><td class="mono">${sci(r.dW)}</td>
    <td class="mono">${sci(r.dP)}</td><td class="mono">${sci(r.dM)}</td><td class="mono">${r.masked ? `${r.maskedOk}/${r.masked} match` : '—'}</td></tr>`)}
  </tbody></table></div>`;
  out.forEach((r, i) => {
    const n = r.py.size, phPy = Float64Array.from(r.py.phase, v => (v === null ? NaN : v));
    drawBare($(`#py${i}`), E.flipRows(E.colorize(phPy, S.luts.phase, 0, 1), n), n);
    drawBare($(`#js${i}`), E.image(r.W, 'phase', S.luts.phase, n).rgba, n);
  });
}

route('check', async () => {
  const S = await loadSetup();
  app().innerHTML = `
  <p class="kicker">JS engine vs the Python package</p>
  <h1>Cross-check</h1>
  <p class="lead">The browser computes everything with <code>complex_engine.js</code>, a port of the package's functions,
  grid and colour mapping. Here the same grids are computed by the Python code (<code>ComplexVisualizer.transform_complex</code>)
  and compared point by point.</p>
  <div class="panel"><div class="row">
    <div><label for="sz">Grid size</label><input id="sz" type="number" min="2" max="121" value="41"></div>
    <div><label for="clo">Range min</label><input id="clo" type="number" step="0.5" value="-2"></div>
    <div><label for="chi">Range max</label><input id="chi" type="number" step="0.5" value="2"></div>
    <div><button type="button" id="go">Recompute in Python</button></div></div>
    ${isStatic() ? needsServer('Recomputing on another grid') : ''}
  </div>
  <div id="res"><p class="mute">Comparing...</p></div>
  <h2>A saved image from the repository</h2>
  <div class="two">
    <figure class="fig"><img src="static/img/complex_vis_f_z_exp_z.png" alt="complex_vis_f_z_exp_z.png: phase and magnitude of exp(z) as saved by the Python program before the fixes" loading="lazy">
      <figcaption class="small mute"><code>complex_vis_f_z_exp_z.png</code> as committed (rendered before the fixes): the
      phase panel is mirrored top-to-bottom (its top edge, labelled Im z = 2, shows the phase at Im z = −2) and its colours
      are stretched to the data range 0.18–0.82.</figcaption></figure>
    <figure class="fig"><canvas id="fixed" width="620" height="580" role="img" aria-label="Phase of exp(z) drawn by the JS engine"></canvas>
      <figcaption class="small mute">The same phase panel from the fixed code path (JS engine): bands of constant Im z,
      hue = phase on a full turn, Im z increasing upwards.</figcaption></figure>
  </div>`;
  const n = 300, W = E.transform(E.byKey('exp').f, E.makeGrid(n));
  drawPlot($('#fixed'), { ...E.image(W, 'phase', S.luts.phase, n), size: n, range: [-2, 2], title: 'f(z) = exp(z) · Phase',
    lut: S.luts.phase, clim: [0, 1], cbarLabel: 'Phase' });
  await table(S);
  $('#go').addEventListener('click', async () => {
    const size = Math.min(121, Math.max(2, parseInt($('#sz').value, 10) || 41));
    const lo = parseFloat($('#clo').value), hi = parseFloat($('#chi').value);
    if (!(hi > lo)) { $('#res').innerHTML = '<p class="err">Range max must be greater than range min.</p>'; return; }
    try { await table(S, size, lo, hi); } catch (e) { $('#res').innerHTML = `<p class="err">${esc(e.message)}</p>`; }
  });
  if (isStatic()) $('#go').disabled = true;
});
