"""Web interface tests: every exported endpoint answers, the static build is complete, and the JS engine tests pass.

Run: python -m pytest -q tests/test_web.py
"""
import os
import shutil
import subprocess
import sys
from pathlib import Path

os.environ.setdefault("MPLBACKEND", "Agg")  # before the package imports pyplot (plt.show must not block)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from complex_visualizer.web.app import STATIC, STATIC_ENDPOINTS, app  # noqa: E402

client = TestClient(app)


def test_index_served():
    r = client.get("/")
    assert r.status_code == 200 and "static/main.js" in r.text


@pytest.mark.parametrize("path", STATIC_ENDPOINTS)
def test_endpoint(path):
    r = client.get("/api" + path)
    assert r.status_code == 200, r.text
    assert r.json() is not None


def test_static_build(tmp_path):
    sys.path.insert(0, str(ROOT / "scripts"))
    import build_static
    build_static.build(tmp_path / "site")
    assert (tmp_path / "site" / "index.html").read_text().count("APP_STATIC") == 1
    for path in STATIC_ENDPOINTS:
        assert (tmp_path / "site" / "api" / (path.strip("/") + ".json")).exists()


def test_static_assets_referenced_exist():
    html = (STATIC / "index.html").read_text()
    for name in ("style.css", "main.js"):
        assert f"static/{name}" in html and (STATIC / name).exists()


@pytest.mark.skipif(not shutil.which("node"), reason="node not installed")
def test_js_engine():
    tests = sorted(STATIC.glob("*.test.mjs"))
    for t in tests:
        r = subprocess.run(["node", str(t)], capture_output=True, text=True)
        assert r.returncode == 0, r.stdout + r.stderr


# --- project-specific API tests ------------------------------------------------------------------------------------
import json  # noqa: E402
import math  # noqa: E402

import numpy as np  # noqa: E402

from complex_visualizer.functions import create_example_functions  # noqa: E402
from complex_visualizer.visualizer import DEFAULT_FRAMES, DEFAULT_SIZE, ComplexVisualizer  # noqa: E402

FIXTURE = ROOT / "tests" / "fixtures" / "engine_fixture.json"


def test_functions_come_from_python():
    d = client.get("/api/functions").json()
    assert [f["label"] for f in d] == [desc for _f, desc in create_example_functions()]
    assert [f["index"] for f in d if f["cli_animated"]] == [0, 2, 3]


def test_js_labels_match_python():
    js = (STATIC / "complex_engine.js").read_text()
    for _f, desc in create_example_functions():
        assert f"label: '{desc}'" in js, desc


def test_info_defaults():
    d = client.get("/api/info").json()
    assert d["functions"] == 8 and d["default_size"] == DEFAULT_SIZE and d["default_frames"] == DEFAULT_FRAMES


def test_colormaps():
    d = client.get("/api/colormaps").json()
    assert len(d["phase"]) == 256 and len(d["viridis"]) == 256
    assert d["phase"][0] == [255, 0, 0, 255] and d["viridis"][0] == [68, 1, 84, 255]


def test_grid_matches_transform_complex():
    r = client.get("/api/grid/2?size=11&lo=-1&hi=1").json()
    W = ComplexVisualizer(size=11, x_range=(-1, 1), y_range=(-1, 1)).transform_complex(create_example_functions()[2][0])
    assert np.allclose(np.array(r["re"]).reshape(11, 11), W.real, atol=1e-11)
    assert np.allclose(np.array(r["im"]).reshape(11, 11), W.imag, atol=1e-11)
    assert client.get("/api/grid/99").status_code == 404
    assert client.get("/api/grid/0?size=999").status_code == 422
    assert client.get("/api/grid/0?lo=1&hi=1").status_code == 422


def test_grid_singularity_is_null():
    r = client.get("/api/grid/4?size=5&lo=-1&hi=1").json()  # z/(1-z): z = 1 is on this grid
    assert r["re"][2 * 5 + 4] is None


def _close(a, b):
    if isinstance(a, str) or isinstance(b, str):
        return a == b
    if isinstance(a, float) and math.isnan(a):
        return isinstance(b, float) and math.isnan(b)
    return math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-12)


def _same(a, b):
    if isinstance(a, dict):
        return a.keys() == b.keys() and all(_same(a[k], b[k]) for k in a)
    if isinstance(a, list):
        return len(a) == len(b) and all(_same(x, y) for x, y in zip(a, b))
    if isinstance(a, (int, float)) and not isinstance(a, bool):
        return _close(float(a), float(b))
    return a == b


def test_js_fixture_is_current():
    """tests/fixtures/engine_fixture.json (read by complex_engine.test.mjs) still matches the Python package."""
    sys.path.insert(0, str(ROOT / "scripts"))
    import make_engine_fixture
    now = json.loads(json.dumps(make_engine_fixture.fixture()))
    committed = json.loads(FIXTURE.read_text())
    for key in ("points", "linspace", "colormaps"):
        assert _same(committed[key], now[key]), key
    for name in ("grids", "animation"):
        for c, n in zip(committed[name], now[name]):
            for k in c:
                if k.endswith("rgba"):  # colour bytes: allow a last-digit libm difference at a bin edge
                    assert sum(x != y for x, y in zip(c[k], n[k])) <= 8, (name, k)
                else:
                    assert _same(c[k], n[k]), (name, k)
