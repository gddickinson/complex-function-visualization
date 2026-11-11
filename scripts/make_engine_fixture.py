"""Compute reference values with the repo's Python code for web/static/complex_engine.test.mjs.

Writes tests/fixtures/engine_fixture.json. Everything is produced by the package itself: the functions of
create_example_functions(), ComplexVisualizer.transform_complex(), and the images that plot_domain_coloring() and
create_transformation_animation() actually hand to matplotlib (captured from the figure, coloured with to_rgba).
tests/test_web.py recomputes this and checks the committed file is still current.

Run: python scripts/make_engine_fixture.py            (print a summary)
     python scripts/make_engine_fixture.py --write    (rewrite tests/fixtures/engine_fixture.json)
"""
import argparse
import json
import math
import os
import sys
from pathlib import Path

os.environ.setdefault("MPLBACKEND", "Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import complex_visualizer.visualizer as vis_mod  # noqa: E402
from complex_visualizer.functions import create_example_functions  # noqa: E402
from complex_visualizer.web.app import colormaps  # noqa: E402

OUT = ROOT / "tests" / "fixtures" / "engine_fixture.json"
POINTS = [(0.3, 0.4), (-1.7, 0.2), (1.0, 0.0), (-1.0, 0.0), (-2.0, 0.5), (-2.0, -0.5), (0.0, -1.3), (1.9, -1.9),
          (-0.25, 0.0), (0.0, 0.0), (2.5, 3.0), (-3.0, -0.0)]
GRID = 9          # small grids: every pixel is compared
RANGES = [(-2.0, 2.0), (-1.0, 1.0)]
ANIM_FRAMES = 4


def enc(x):
    """JSON-safe float: non-finite values as strings."""
    x = float(x)
    return x if math.isfinite(x) else str(x)


def point_values():
    out = []
    for i, (f, desc) in enumerate(create_example_functions()):
        for x, y in POINTS:
            w = complex(f(complex(x, y)))
            out.append({"f": i, "z": [x, y], "w": [enc(w.real), enc(w.imag)]})
    return out


def captured_images(draw):
    """Run a drawing method with plt.show patched; return the AxesImages it put on the figure."""
    images, real_show = [], plt.show
    plt.show = lambda *a, **k: images.extend(im for ax in plt.gcf().axes for im in ax.images)
    try:
        draw()
    finally:
        plt.show = real_show
        plt.close("all")
    return images


def rgba(im):
    return np.asarray(im.to_rgba(im.get_array(), bytes=True)).reshape(-1).tolist()


def grid_cases():
    out = []
    for lo, hi in RANGES:
        vis = vis_mod.ComplexVisualizer(size=GRID, x_range=(lo, hi), y_range=(lo, hi))
        for i, (f, desc) in enumerate(create_example_functions()):
            W = vis.transform_complex(f).astype(complex)
            ph, mag = captured_images(lambda: vis.plot_domain_coloring(f, desc))
            out.append({"f": i, "size": GRID, "range": [lo, hi],
                        "re": [enc(v) for v in W.real.ravel()], "im": [enc(v) for v in W.imag.ravel()],
                        "phase": [enc(v) for v in np.asarray(ph.get_array().filled(np.nan)).ravel()],
                        "magnitude": [enc(v) for v in np.asarray(mag.get_array().filled(np.nan)).ravel()],
                        "phase_origin": ph.origin, "phase_clim": [enc(v) for v in ph.get_clim()],
                        "magnitude_clim": [enc(v) for v in mag.get_clim()],
                        "phase_rgba": rgba(ph), "magnitude_rgba": rgba(mag)})
    return out


def animation_cases():
    """Frames of create_transformation_animation, by calling its frame function through a stand-in FuncAnimation."""
    out = []
    vis = vis_mod.ComplexVisualizer(size=GRID)
    real, real_show = vis_mod.FuncAnimation, plt.show
    plt.show = lambda *a, **k: None
    for i in (0, 2, 3, 4):
        f, desc = create_example_functions()[i]
        grabbed = {}
        vis_mod.FuncAnimation = lambda fig, func, frames, interval: grabbed.update(fig=fig, func=func, frames=frames,
                                                                                   interval=interval)
        try:
            vis.create_transformation_animation(f, frames=ANIM_FRAMES)
            for k in range(grabbed["frames"]):
                grabbed["func"](k)
                im = grabbed["fig"].axes[0].images[0]
                out.append({"f": i, "frames": ANIM_FRAMES, "k": k, "interval": grabbed["interval"],
                            "title": grabbed["fig"].axes[0].get_title(),
                            "phase": [enc(v) for v in np.asarray(im.get_array().filled(np.nan)).ravel()],
                            "rgba": rgba(im)})
        finally:
            vis_mod.FuncAnimation = real
            plt.close("all")
    plt.show = real_show
    return out


def fixture():
    with np.errstate(all="ignore"):
        return {"points": point_values(), "linspace": [[a, b, n, np.linspace(a, b, n).tolist()]
                                                     for a, b, n in [(-2, 2, 9), (-2, 2, 500), (-1.5, 0.7, 13)]],
                "grids": grid_cases(), "animation": animation_cases(), "colormaps": colormaps()}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    fx = fixture()
    if ap.parse_args().write:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(fx, ensure_ascii=False, separators=(",", ":")))
        print(f"wrote {OUT} ({OUT.stat().st_size / 1e3:.0f} kB)")
    print({k: len(v) for k, v in fx.items()})


if __name__ == "__main__":
    main()
