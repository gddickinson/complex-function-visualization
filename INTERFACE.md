# complex-function-visualiser -- Interface Map

## Project Structure

```
complex-function-visualiser/
  complex_visualizer/          # Main package
    __init__.py                # Package init, re-exports ComplexVisualizer, create_example_functions
    functions.py               # Pre-defined complex functions, sanitize_filename()
    colormap.py                # create_phase_colormap() for HSV phase mapping
    visualizer.py              # ComplexVisualizer class (domain coloring, animations)
    cli.py                     # CLI entry point with argparse
    web/                       # Browser interface + static GitHub Pages site (see "Web interface" below)
      __init__.py              # Docstring listing contents
      app.py                   # FastAPI app: /api/info, /functions, /colormaps, /grid/{index}; STATIC_ENDPOINTS
      static/                  # ES-module front end, no build step
        index.html, style.css (shared kit theme), style_app.css (project colours, page styles)
        core.js                # Shared kit: api(), hash router, slider/animate helpers
        main.js                # Registers the lazily loaded pages, starts the router
        static_api.js          # Static site: answers api() from exported JSON
        complex_engine.js      # JS port: complex arithmetic, FUNCTIONS, linspace/makeGrid, transform, morph,
                               #   phase, logMagnitude, colorize (matplotlib Normalize + LUT), image, flipRows
        complex_engine.test.mjs# Node test vs tests/fixtures/engine_fixture.json (Python values and RGBA pixels)
        render.js              # loadSetup (API), drawPlot (axes, ticks, colour bar), drawBare, pointer readout
        home.js, explore.js, animate.js, gallery.js, check.js, about.js   # one module per page
        icon.svg, img/complex_vis_f_z_exp_z.png (copy of a saved PNG, shown on the cross-check page)
  scripts/
    build_static.py            # Export static site to site/ (calls the FastAPI app via TestClient)
    make_engine_fixture.py     # Python reference values for the JS engine -> tests/fixtures/engine_fixture.json
    screenshots.py             # Playwright smoke test (console errors, phone overflow) + docs/img PNGs
  tests/
    test_web.py                # API, static build, node engine test, fixture-is-current
    fixtures/engine_fixture.json
  docs/img/                    # README screenshots
  run_web.py                   # python run_web.py -> http://127.0.0.1:8152
  requirements-web.txt         # Pinned web/test dependencies
  .github/workflows/pages.yml  # Test, build and publish the static site on push to main
  .gitignore                   # site/, __pycache__/, .pytest_cache/
  SESSION_LOG.md               # Work log
  _archive/
    complex-visualizer.py      # Original single-file version (archived)
  complex_visualizer.py        # Entry-point wrapper (python complex_visualizer.py)
  test_complex_visualizer.py   # Unit tests
  requirements.txt             # numpy, matplotlib
  ROADMAP.md
  INTERFACE.md                 # This file
  README.md
```

## Key Classes and Functions

| Symbol | File | Purpose |
|---|---|---|
| `ComplexVisualizer` | `complex_visualizer/visualizer.py` | Main class: grid setup, domain coloring, animation |
| `create_example_functions()` | `complex_visualizer/functions.py` | Returns list of (callable, description) tuples for 8 complex functions |
| `sanitize_filename()` | `complex_visualizer/functions.py` | Converts function descriptions to safe filenames |
| `create_phase_colormap()` | `complex_visualizer/colormap.py` | HSV-based matplotlib colormap for phase visualization |
| `main()` | `complex_visualizer/cli.py` | CLI: --size, --frames, --output-dir, --no-animate, --range |

## Constants

| Name | File | Default |
|---|---|---|
| `DEFAULT_SIZE` | `visualizer.py` | 500 |
| `DEFAULT_FRAMES` | `visualizer.py` | 50 |
| `DEFAULT_RANGE` | `visualizer.py` | (-2, 2) |

## Web interface

`app.py` imports the real package (`create_example_functions`, `ComplexVisualizer.transform_complex`,
`create_phase_colormap`, matplotlib viridis) and serves its data as JSON; the browser draws everything with
`complex_engine.js`. On the static site `static_api.js` serves the JSON exported by `scripts/build_static.py`
(STATIC_ENDPOINTS: info, functions, colormaps, grid/0..7 at 41x41). The engine is held to the Python by
`complex_engine.test.mjs` (run by `tests/test_web.py::test_js_engine`) and the fixture by `test_js_fixture_is_current`.
