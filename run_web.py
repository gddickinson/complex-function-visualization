"""Start the Complex Function Visualizer web app on http://127.0.0.1:8152 (local only).

Run: python run_web.py [--port 8152]
Needs: pip install -r requirements-web.txt
"""
import argparse
import os

os.environ.setdefault("MPLBACKEND", "Agg")

import uvicorn

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8152)
    port = ap.parse_args().port
    print(f"Complex Function Visualizer web app: http://127.0.0.1:{port}")
    uvicorn.run("complex_visualizer.web.app:app", host="127.0.0.1", port=port)
