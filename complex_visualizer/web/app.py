"""FastAPI web app for the Complex Function Visualizer: serves the front end in static/ and the JSON API under /api.

Run with `python run_web.py` (http://127.0.0.1:8152, local only). `scripts/build_static.py` exports every path in
STATIC_ENDPOINTS to JSON for the GitHub Pages site, so keep that list in step with the GET routes below.
Everything here calls the real package: create_example_functions(), ComplexVisualizer.transform_complex() and the
matplotlib colormaps that visualizer.py draws with. The browser does the drawing with a JS port (complex_engine.js).
"""
import math
import os
from pathlib import Path

os.environ.setdefault("MPLBACKEND", "Agg")

import matplotlib  # noqa: E402
import numpy as np  # noqa: E402
from fastapi import FastAPI, HTTPException, Query  # noqa: E402
from fastapi.responses import FileResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

from complex_visualizer.colormap import create_phase_colormap  # noqa: E402
from complex_visualizer.functions import create_example_functions, sanitize_filename  # noqa: E402
from complex_visualizer.visualizer import DEFAULT_FRAMES, DEFAULT_RANGE, DEFAULT_SIZE, ComplexVisualizer  # noqa: E402

STATIC = Path(__file__).resolve().parent / "static"
TITLE = "Complex Function Visualizer"
CHECK_SIZE = 41  # grid size of the Python reference grids exported for the static cross-check page
ANIMATED = [0, 2, 3]  # the functions cli.py animates (z², exp(z), sin(z))

app = FastAPI(title=TITLE)
app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(STATIC / "index.html")


def _functions():
    return create_example_functions()


@app.get("/api/info")
def info():
    """Project summary and the package defaults (visualizer.py constants)."""
    return {
        "title": TITLE,
        "functions": len(_functions()),
        "default_size": DEFAULT_SIZE,
        "default_frames": DEFAULT_FRAMES,
        "default_range": list(DEFAULT_RANGE),
        "animation_interval_ms": 50,
        "cli_animated": ANIMATED,
        "plots": ["phase", "magnitude", "animation"],
    }


@app.get("/api/functions")
def functions():
    """The pre-defined functions in order, with the file stem the CLI uses for their PNG/GIF."""
    return [{"index": i, "label": desc, "file_stem": sanitize_filename(desc), "cli_animated": i in ANIMATED}
            for i, (_f, desc) in enumerate(_functions())]


def _lut(cmap):
    return [[int(c) for c in row] for row in cmap(np.arange(cmap.N), bytes=True)]


@app.get("/api/colormaps")
def colormaps():
    """RGBA byte lookup tables of the two colormaps visualizer.py draws with (phase: create_phase_colormap())."""
    return {"phase": _lut(create_phase_colormap()), "viridis": _lut(matplotlib.colormaps["viridis"])}


def _clean(a):
    return [float(v) if math.isfinite(v) else None for v in np.asarray(a, dtype=float).ravel()]


@app.get("/api/grid/{index}")
def grid(index: int, size: int = Query(CHECK_SIZE, ge=2, le=121), lo: float = -2.0, hi: float = 2.0):
    """f(Z) on a size x size grid from ComplexVisualizer.transform_complex, with the two plotted quantities.

    Rows are Im(z) ascending (row 0 = lo), columns Re(z) ascending; non-finite values are null.
    """
    funcs = _functions()
    if not 0 <= index < len(funcs):
        raise HTTPException(404, f"no function {index}")
    if not hi > lo:
        raise HTTPException(422, "hi must be greater than lo")
    func, desc = funcs[index]
    vis = ComplexVisualizer(size=size, x_range=(lo, hi), y_range=(lo, hi))
    with np.errstate(all="ignore"):
        W = vis.transform_complex(func).astype(complex)
        phase = np.angle(W) / (2 * np.pi) + 0.5
        magnitude = np.log1p(np.abs(W))
    return {"index": index, "label": desc, "size": size, "range": [lo, hi],
            "re": _clean(W.real), "im": _clean(W.imag), "phase": _clean(phase), "magnitude": _clean(magnitude)}


# GET paths (without the /api prefix) written to the static site as api/<path>.json.
STATIC_ENDPOINTS = ["/info", "/functions", "/colormaps"] + [f"/grid/{i}" for i in range(len(_functions()))]
