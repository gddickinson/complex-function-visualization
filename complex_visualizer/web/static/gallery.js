// Gallery: all eight pre-defined functions, phase and magnitude thumbnails computed in the browser, with links to the
// explorer, the animation and the PNG/GIF files the CLI produced (committed in the repository).
import { route, app, esc, list } from './core.js';
import * as E from './complex_engine.js';
import { loadSetup, drawBare, lutFor } from './render.js';

const REPO = 'https://github.com/gddickinson/complex-function-visualization/blob/main/';
const NOTES = {
  z2: 'Phase cycles twice around the origin; magnitude grows quadratically (README).',
  exp: 'Phase forms horizontal bands; magnitude grows exponentially in the real direction (README).',
  z3m1: 'Cubic with zeros at the three cube roots of unity.',
  rational: 'Pole at z = 1, where the function returns inf (shown white, as matplotlib masks it).',
  sqrt: 'Principal branch: the phase covers only half a turn, with a branch cut along the negative real axis.',
  log: 'Principal branch with a cut along z < −1; singular at z = −1.',
};

route('gallery', async () => {
  const S = await loadSetup(), n = 180;
  app().innerHTML = `
  <p class="kicker">The eight functions of create_example_functions()</p>
  <h1>Gallery</h1>
  <p class="lead">Each function on the default square [−2, 2] × [−2, 2]: phase on the left, log magnitude on the right.
  Each card links to the explorer, the animation and the files the Python program saved.</p>
  <div class="grid wide gal">${list(S.functions, f => `
    <div class="card">
      <b>${esc(f.label)}</b>
      <div class="pair"><canvas width="${n}" height="${n}" data-k="${f.key}" data-kind="phase" role="img" aria-label="${esc(f.label)} phase"></canvas>
      <canvas width="${n}" height="${n}" data-k="${f.key}" data-kind="magnitude" role="img" aria-label="${esc(f.label)} magnitude"></canvas></div>
      ${NOTES[f.key] ? `<span>${esc(NOTES[f.key])}</span>` : ''}
      <p class="small"><a href="#/explore?f=${f.key}">Explore</a> · <a href="#/animate?f=${f.key}">Animate</a>
      · <a href="${REPO}${encodeURIComponent(`complex_vis_${f.file_stem}.png`)}" target="_blank" rel="noopener">saved PNG</a>
      ${f.cli_animated ? `· <a href="${REPO}${encodeURIComponent(`complex_anim_${f.file_stem}.gif`)}" target="_blank" rel="noopener">saved GIF</a>` : ''}</p>
    </div>`)}</div>`;
  const grid = E.makeGrid(n);
  const cache = {};
  app().querySelectorAll('canvas[data-k]').forEach(cv => {
    const fn = E.byKey(cv.dataset.k), W = cache[fn.key] || (cache[fn.key] = E.transform(fn.f, grid));
    const kind = cv.dataset.kind;
    drawBare(cv, E.image(W, kind, lutFor(S.luts, kind), n).rgba, n);
  });
});
