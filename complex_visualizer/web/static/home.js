// Home page: hero with a live identity → z² animation, counts from the API, entry cards.
import { route, api, app, esc, list, animate } from './core.js';
import * as E from './complex_engine.js';
import { loadSetup, drawBare } from './render.js';

const DOORS = [
  ['#/explore', 'Explorer', 'Phase and magnitude plots of any of the functions over any square of the plane, with a pointer readout of f(z).'],
  ['#/animate', 'Animation', 'Watch the plane deform from the identity into f(z), frame by frame, as in the saved GIFs.'],
  ['#/gallery', 'Gallery', 'All eight pre-defined functions side by side, with links to the PNG and GIF files the Python program saved.'],
  ['#/check', 'Cross-check', 'The browser engine against the Python package: the same grids computed by NumPy, compared value by value.'],
  ['#/about', 'About', 'How domain colouring works here, how to run the desktop program and the web app, credits.'],
];

route('home', async () => {
  const [info, S] = await Promise.all([api('/info'), loadSetup()]);
  app().innerHTML = `
  <section class="hero two heroplate">
    <div>
      <p class="kicker">Domain colouring · complex analysis</p>
      <h1 class="glow">Complex Function Visualizer</h1>
      <p class="lead">Visualizations and animations of how complex functions transform the complex plane: the phase of
      f(z) as colour, its magnitude on a log scale, and animated transitions from the identity to f. Everything on this
      site is computed in your browser by a JavaScript port of the Python program, checked against it.</p>
      <a class="btn" href="#/explore">Open the explorer</a><a class="btn alt" href="#/animate">Watch an animation</a>
    </div>
    <figure class="fig"><canvas id="hero" width="420" height="420" role="img" aria-label="Animation: the phase of z + t(z² − z) as t goes from 0 to 1"></canvas>
      <figcaption class="small mute" id="herocap"></figcaption></figure>
  </section>
  <div class="tiles">
    <div class="tile"><b>${info.functions}</b><span>pre-defined functions</span></div>
    <div class="tile"><b>${info.plots.length}</b><span>views: phase, magnitude, animation</span></div>
    <div class="tile"><b>${info.default_size}²</b><span>default grid</span></div>
    <div class="tile"><b>${info.default_frames}</b><span>animation frames</span></div>
  </div>
  <div class="grid wide">${list(DOORS, ([href, t, d]) => `<a class="card door" href="${href}"><b>${t}</b><span>${d}</span></a>`)}</div>
  <h2>Functions</h2>
  <p>${list(S.functions, f => `<a class="tag a" href="#/explore?f=${f.key}">${esc(f.label)}</a>`)}</p>`;
  hero(S);
});

// identity → z² on a 200² grid, 50 frames at 50 ms with a short hold at each end.
function hero(S) {
  const cv = document.getElementById('hero'), n = 200, frames = 50, grid = E.makeGrid(n);
  const fn = E.byKey('z2'), F = E.transform(fn.f, grid);
  const draw = k => {
    const t = E.frameT(k, frames), ph = E.phase(E.morph(grid, F, t));
    drawBare(cv, E.flipRows(E.colorize(ph, S.luts.phase, 0, 1), n), n);
    document.getElementById('herocap').textContent = `Phase of z + t·(z² − z) on [−2, 2]², t = ${t.toFixed(2)}`;
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { draw(frames - 1); return; }
  let i = 0, last = 0;
  const seq = [...Array(12).fill(0), ...Array.from({ length: frames }, (_, k) => k), ...Array(12).fill(frames - 1),
    ...Array.from({ length: frames }, (_, k) => frames - 1 - k)];
  animate(now => { if (now - last < 50) return; last = now; draw(seq[i]); i = (i + 1) % seq.length; });
}
