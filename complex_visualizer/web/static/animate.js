// Animation: create_transformation_animation in the browser. W = Z + t (f(Z) - Z) for t = k / frames, k = 0 .. frames-1,
// phase-coloured, one frame every 50 ms like the Python FuncAnimation (interval=50), looping like the saved GIFs.
import { route, app, $, slider, animate } from './core.js';
import * as E from './complex_engine.js';
import { loadSetup, functionSelect, drawPlot, pointerZ, setQuery, num, fmtC } from './render.js';

route('animate', async (_args, q) => {
  const S = await loadSetup();
  const st = {
    key: E.byKey(q.f).key, lo: num(q.lo, S.info.default_range[0]), hi: num(q.hi, S.info.default_range[1]),
    size: num(q.n, 300, 50, 600) | 0, frames: num(q.frames, S.info.default_frames, 2, 300) | 0, k: 0, playing: true,
  };
  if (!(st.hi > st.lo)) [st.lo, st.hi] = S.info.default_range;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) st.playing = false;
  app().innerHTML = `
  <p class="kicker">create_transformation_animation · identity → f</p>
  <h1>Transformation animation</h1>
  <p class="lead">The plane is deformed continuously from the identity w = z (t = 0) towards w = f(z): each frame shows
  the phase of z + t·(f(z) − z). The Python program saves these as <code>complex_anim_*.gif</code> for z², exp(z) and sin(z);
  here any of the eight functions can be animated.</p>
  <div class="sim">
    <div class="controls">
      ${functionSelect('fn', S.functions, st.key)}
      <div id="sl"></div>
      <button type="button" id="play">${st.playing ? 'Pause' : 'Play'}</button><button type="button" class="alt" id="step">Step</button>
      <p class="small mute">Frames is the CLI's <code>--frames</code> (default ${S.info.default_frames}); as in the Python,
      t runs from 0 to (frames − 1)/frames, so the last frame stops just short of f itself.</p>
      <div class="readout" id="ro" aria-live="off"></div>
      <p class="small mute"><a id="still" href="#/explore">Static plots of this function →</a></p>
    </div>
    <div class="view single"><canvas id="cv" width="660" height="620" role="img" aria-label="Animated phase plot"></canvas></div>
  </div>`;

  const cv = $('#cv');
  let grid, F, W, phase, rgba, ptr = null;
  function prepare() {
    grid = E.makeGrid(st.size, [st.lo, st.hi]);
    F = E.transform(E.byKey(st.key).f, grid);
    W = null; phase = null; rgba = null;
    $('#still').href = `#/explore?f=${st.key}&lo=${st.lo}&hi=${st.hi}`;
    setQuery('animate', { f: st.key, lo: st.lo, hi: st.hi, n: st.size, frames: st.frames });
  }
  function draw() {
    const t = E.frameT(st.k, st.frames);
    W = E.morph(grid, F, t, W || undefined);
    phase = E.phase(W, phase || undefined);
    rgba = E.flipRows(E.colorize(phase, S.luts.phase, 0, 1, rgba || undefined), st.size);
    drawPlot(cv, { rgba, size: st.size, range: [st.lo, st.hi], title: `Complex Transformation Animation · t = ${t.toFixed(2)}`,
      lut: S.luts.phase, clim: [0, 1], cbarLabel: 'Phase' });
    kInput.value = st.k; kInput.previousElementSibling.querySelector('b').textContent = `${st.k} (t = ${t.toFixed(2)})`;
    const z = ptr, fz = z && E.byKey(st.key).f(z);
    $('#ro').innerHTML = `<div><span>frame k</span><b>${st.k} of 0…${st.frames - 1}</b></div><div><span>t</span><b>${t.toFixed(4)}</b></div>`
      + (z ? `<div><span>z</span><b>${fmtC(z)}</b></div><div><span>w</span><b>${fmtC([z[0] + t * (fz[0] - z[0]), z[1] + t * (fz[1] - z[1])])}</b></div>` : '');
  }
  const sl = $('#sl');
  const kInput = slider(sl, { id: 'k', label: 'Frame', min: 0, max: st.frames - 1, value: 0 }, v => { st.k = v; pause(); draw(); });
  slider(sl, { id: 'frames', label: 'Frames', min: 2, max: 300, value: st.frames }, v => {
    st.frames = v; st.k = Math.min(st.k, v - 1); kInput.max = v - 1; prepare(); draw();
  });
  slider(sl, { id: 'n', label: 'Grid size', min: 50, max: 600, step: 10, value: st.size, unit: ' px' }, v => { st.size = v; prepare(); draw(); });
  const pause = () => { st.playing = false; $('#play').textContent = 'Play'; };
  $('#play').addEventListener('click', () => { st.playing = !st.playing; $('#play').textContent = st.playing ? 'Pause' : 'Play'; });
  $('#step').addEventListener('click', () => { pause(); st.k = (st.k + 1) % st.frames; draw(); });
  $('#fn').addEventListener('change', e => { st.key = e.target.value; prepare(); draw(); });
  cv.addEventListener('pointermove', ev => { ptr = pointerZ(cv, ev, [st.lo, st.hi]); if (!st.playing) draw(); });
  cv.addEventListener('pointerleave', () => { ptr = null; });

  prepare(); draw();
  let last = 0;
  animate(now => {
    if (!st.playing || now - last < S.info.animation_interval_ms) return;
    last = now; st.k = (st.k + 1) % st.frames; draw();
  });
});
