// About: what the program does, how the pictures are made, how to run it, credits (all from the repository).
import { route, app, list, esc } from './core.js';
import { loadSetup } from './render.js';

route('about', async () => {
  const S = await loadSetup();
  app().innerHTML = `
  <p class="kicker">About</p>
  <h1>Complex Function Visualizer</h1>
  <p class="lead">A Python tool (NumPy and Matplotlib) for visualizations and animations of complex function
  transformations, giving insight into how complex functions transform the complex plane through domain coloring and
  animated transitions. This site is its web interface.</p>
  <h2>How the pictures are made</h2>
  <p>The program samples a square grid of the plane, Z = x + iy with <code>numpy.linspace</code> on both axes
  (default ${S.info.default_size} × ${S.info.default_size} points over [${S.info.default_range.join(', ')}]), and applies f
  to every point (<code>ComplexVisualizer.transform_complex</code>). Then:</p>
  <ul>
    <li><b>Phase</b>: <span class="eq">arg f(z) / 2π + 0.5</span>, shown with an HSV colormap of 256 hues at full
    saturation (<code>create_phase_colormap</code>); one full cycle of colours is 2π radians.</li>
    <li><b>Magnitude</b>: <span class="eq">log(1 + |f(z)|)</span> with matplotlib's viridis, scaled to the plotted range.</li>
    <li><b>Animation</b>: frame k of ${S.info.default_frames} shows the phase of <span class="eq">z + t·(f(z) − z)</span>,
    t = k / frames, one frame every ${S.info.animation_interval_ms} ms.</li>
  </ul>
  <p>Points where f is undefined (z = 1 for z/(1−z), z = −1 for ln(1+z)) return infinity; matplotlib masks them, so they
  show as background. Branches are the principal ones of Python's <code>cmath</code>.</p>
  <h3>The eight functions</h3>
  <p>${list(S.functions, f => `<span class="tag a">${esc(f.label)}</span>`)}</p>
  <h2>Web version</h2>
  <p><code>complex_engine.js</code> ports the functions, grid, transform, animation formula and the matplotlib colour
  lookup to JavaScript; the colormap tables themselves come from the Python code through the API. A node test compares
  it with values and RGBA pixels produced by the Python package (<code>tests/fixtures/engine_fixture.json</code>), and the
  <a href="#/check">cross-check page</a> compares full grids live. The pointer readout and the ability to animate all
  eight functions (the CLI animates z², exp(z) and sin(z)) are web-only conveniences.</p>
  <div class="callout"><b>Fixed in November 2026.</b> While building this site two plotting bugs were found and fixed in
  <code>visualizer.py</code>: the images were drawn with matplotlib's default <code>origin='upper'</code>, so every plot was
  mirrored in the real axis relative to its labels; and the phase colours were autoscaled to each image's data range, so
  a hue did not always mean the same phase (sqrt(z), whose phase spans half a turn, was stretched over the whole colour
  wheel). The example PNG/GIF files in the repository were regenerated with the fixed code.</div>
  <h2>Run it yourself</h2>
  <h3>Desktop program</h3>
  <pre>pip install numpy matplotlib
python complex_visualizer.py            # all eight PNGs and three GIFs
python complex_visualizer.py --size 300 --frames 30 --range -3 3 --output-dir output --no-animate</pre>
  <h3>Web app</h3>
  <pre>pip install -r requirements-web.txt
python run_web.py                        # http://127.0.0.1:8152</pre>
  <p>The local app adds Python-computed cross-checks on any grid; the static site has everything else.</p>
  <h2>Credits</h2>
  <p>Inspired by the visual beauty of complex analysis; built using NumPy and Matplotlib; domain coloring techniques
  based on mathematical visualization research. Built with AI assistance from Claude (Anthropic). MIT licence.
  Source: <a href="https://github.com/gddickinson/complex-function-visualization">github.com/gddickinson/complex-function-visualization</a>.</p>`;
});
