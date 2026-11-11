# Session log

## 2026-11-11 — web interface, static GitHub Pages site, two plotting fixes (Claude Code, branch `web-interface`)

**Bugs found and fixed in the existing code** (each with a regression test written first, separate "Fix" commits):
- `visualizer.py`: `imshow` used the default `origin='upper'`, so row 0 of the grid (Im z = y_min) was drawn at the top
  under axis labels saying y_max: every plot and animation was mirrored in the real axis (visible in
  `complex_vis_f_z_exp_z.png`: the top edge shows the phase at Im z = -2). Now `origin='lower'`.
- `visualizer.py`: the phase image was autoscaled to its data's min..max, so hue did not mean a fixed phase (README:
  "full cycle of colors represents 2π"); sqrt(z) (half a turn of phase) was stretched over the whole wheel and each
  animation frame was rescaled separately. Phase images now use `vmin=0, vmax=1`.
- Docs: ROADMAP marked an `animator.py` and a `.gitignore`/`output/` clean-up as done (neither existed); INTERFACE.md
  listed a `.gitignore` that was not there and omitted the root copy `complex-visualizer.py` (identical to
  `_archive/complex-visualizer.py`). Corrected.
- Tests: `test_complex_visualizer.py` 10 -> 14 tests (TestPlotOutput).
- Not changed (for George): the committed example PNG/GIF files were rendered before the fixes and are mirrored and
  colour-stretched; regenerating them (`python complex_visualizer.py`) would replace ~17 MB of binaries. The duplicate
  `complex-visualizer.py` at the root could be deleted.

**Web interface** (`complex_visualizer/web/`, from the shared web kit):
- FastAPI app (`run_web.py`, port 8152) with `/api/info`, `/functions`, `/colormaps`, `/grid/{index}` using the
  package's own functions, transform and colormaps.
- Static site = the full visualizer: `complex_engine.js` (complex arithmetic with cmath principal branches, the eight
  functions, numpy.linspace grid, transform, animation morph, phase/log-magnitude, matplotlib Normalize + LUT lookup).
  Pages: home (live identity -> z² animation), explorer, animation, gallery, cross-check, about.
- JS vs Python: `scripts/make_engine_fixture.py` captures the images `plot_domain_coloring` and
  `create_transformation_animation` actually hand to matplotlib (values and RGBA bytes via `to_rgba`);
  `complex_engine.test.mjs` agrees on 7322/7322 checks. One libm last-digit difference (log1p(2) in JS vs numpy)
  lands exactly on a colour-bin edge (ln 3 / ln 9 = 0.5) and picks the neighbouring viridis entry for 4 bytes; the test
  tolerates differences only at exact bin edges.
- Cross-check page: JS vs `transform_complex` over 8 functions, max relative difference ~5e-16.
- Verified: pytest (web + existing), screenshots.py on all routes for the static build and the running server, phone
  width 390 px without overflow, every file < 500 lines.

## 2026-11-11 (later) — example images regenerated (George approved)
- All 8 `complex_vis_*.png` and 3 `complex_anim_*.gif` were regenerated with the fixed code by running the repo's CLI
  headless (`complex_visualizer.cli.main()` with the Agg backend; defaults: size 500, 50 frames, range -2..2, same file
  names). Spot checks: frame 0 of the z² GIF (the identity f(z) = z) is purple at the top (arg = π/2, positive imaginary
  axis), green-yellow at the bottom, cyan right, red left; the exp(z) PNG runs from magenta at Im z = 2 down to yellow at
  Im z = -2 with a 0..1 colour bar.
- Size: before 18.1 MB (GIFs 15.6 MB, 2000×2000 px; PNGs 2.5 MB). The old GIFs were 2000 px because the macOS backend
  doubles figure dpi on a Retina display, and an older Pillow wrote them with a ~91-colour palette. With Pillow 13
  (256-colour palette) 2000 px GIFs came to 57 MB, so the GIFs were rendered at the code's nominal figure dpi (100):
  1000×1000 px, 50 frames, 50 ms, looping. After: ~22.7 MB total (GIFs 20.2 MB, PNGs 2.5 MB at the code's dpi=300).
- Removed the "images predate the fixes" notes from README, the About, Gallery and Cross-check pages; the copy of
  `complex_vis_f_z_exp_z.png` used by the Cross-check page is the new one.
- The duplicate root `complex-visualizer.py` (= `_archive/`) is left as is (no decision yet).
