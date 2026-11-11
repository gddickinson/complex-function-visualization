// Explorer: plot_domain_coloring in the browser. Phase and magnitude side by side for any of the eight functions,
// any square range of the plane and grid size, with a pointer readout of f(z).
import { route, app, $, slider, download } from './core.js';
import * as E from './complex_engine.js';
import { loadSetup, functionSelect, drawPlot, pointerZ, readout, setQuery, num, lutFor } from './render.js';

const RANGES = [[-2, 2], [-1, 1], [-4, 4], [-8, 8], [-0.5, 0.5]];

route('explore', async (_args, q) => {
  const S = await loadSetup();
  const st = {
    key: E.byKey(q.f).key, lo: num(q.lo, S.info.default_range[0]), hi: num(q.hi, S.info.default_range[1]),
    size: num(q.n, S.info.default_size, 20, 800) | 0,
  };
  if (!(st.hi > st.lo)) [st.lo, st.hi] = S.info.default_range;
  app().innerHTML = `
  <p class="kicker">plot_domain_coloring · phase and magnitude</p>
  <h1>Explorer</h1>
  <p class="lead">The same two panels the Python program saves as <code>complex_vis_*.png</code>, computed in your browser:
  hue shows the phase of f(z), the viridis panel shows log(1 + |f(z)|).</p>
  <div class="sim">
    <div class="controls">
      ${functionSelect('fn', S.functions, st.key)}
      <div class="row rangebox">
        <div><label for="lo">Range min</label><input id="lo" type="number" step="0.5" value="${st.lo}"></div>
        <div><label for="hi">Range max</label><input id="hi" type="number" step="0.5" value="${st.hi}"></div>
      </div>
      <div class="seg" role="group" aria-label="Range presets">${RANGES.map(([a, b]) =>
        `<button type="button" data-r="${a},${b}">${a}…${b}</button>`).join('')}</div>
      <div id="sl"></div>
      <p class="small mute">The range applies to both axes, like the CLI's <code>--range MIN MAX</code>; grid size is
      <code>--size</code> (Python default ${S.info.default_size}).</p>
      <div class="readout" id="ro" aria-live="polite"></div>
      <button type="button" id="dl-phase" class="alt">Phase PNG</button><button type="button" id="dl-mag" class="alt">Magnitude PNG</button>
      <p class="small mute"><a id="anim" href="#/animate">Animate this function →</a></p>
    </div>
    <div class="view two plots">
      <canvas id="cv-phase" width="620" height="580" role="img" aria-label="Phase plot"></canvas>
      <canvas id="cv-mag" width="620" height="580" role="img" aria-label="Magnitude plot"></canvas>
    </div>
  </div>
  <p class="small mute" id="timing"></p>`;

  const cvP = $('#cv-phase'), cvM = $('#cv-mag');
  slider($('#sl'), { id: 'n', label: 'Grid size', min: 50, max: 800, step: 10, value: st.size, unit: ' px' }, v => { st.size = v; draw(); });

  function draw() {
    const fn = E.byKey(st.key), t0 = performance.now();
    const grid = E.makeGrid(st.size, [st.lo, st.hi]), W = E.transform(fn.f, grid);
    for (const [cv, kind, label] of [[cvP, 'phase', 'Phase'], [cvM, 'magnitude', 'Log Magnitude']]) {
      const lut = lutFor(S.luts, kind), { rgba, range } = E.image(W, kind, lut, st.size);
      drawPlot(cv, { rgba, size: st.size, range: [st.lo, st.hi], title: `${fn.label} · ${kind === 'phase' ? 'Phase' : 'Magnitude'}`,
        lut, clim: range, cbarLabel: label });
    }
    $('#timing').textContent = `${st.size}×${st.size} grid (${(st.size * st.size).toLocaleString('en')} evaluations) in ${Math.round(performance.now() - t0)} ms.`;
    $('#anim').href = `#/animate?f=${st.key}&lo=${st.lo}&hi=${st.hi}`;
    $('#ro').innerHTML = readout(fn, null);
    setQuery('explore', { f: st.key, lo: st.lo, hi: st.hi, n: st.size });
  }

  $('#fn').addEventListener('change', e => { st.key = e.target.value; draw(); });
  const setRange = () => {
    const lo = parseFloat($('#lo').value), hi = parseFloat($('#hi').value);
    if (Number.isFinite(lo) && Number.isFinite(hi) && hi > lo) { st.lo = lo; st.hi = hi; draw(); }
  };
  $('#lo').addEventListener('change', setRange); $('#hi').addEventListener('change', setRange);
  app().querySelectorAll('[data-r]').forEach(b => b.addEventListener('click', () => {
    [$('#lo').value, $('#hi').value] = b.dataset.r.split(','); setRange();
  }));
  for (const cv of [cvP, cvM]) {
    cv.addEventListener('pointermove', ev => { $('#ro').innerHTML = readout(E.byKey(st.key), pointerZ(cv, ev, [st.lo, st.hi])); });
  }
  const save = (cv, kind) => cv.toBlob(b => download(`complex_vis_${st.key}_${kind}.png`, b));
  $('#dl-phase').addEventListener('click', () => save(cvP, 'phase'));
  $('#dl-mag').addEventListener('click', () => save(cvM, 'magnitude'));
  draw();
});
