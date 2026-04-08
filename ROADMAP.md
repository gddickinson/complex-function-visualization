# Complex Function Visualizer -- Roadmap

## Current State
A single-file Python tool (`complex-visualizer.py`) creating domain coloring visualizations and animated GIF transformations of complex functions. Uses numpy and matplotlib. Includes 8 pre-defined functions (z^2, z^3-1, exp(z), sin(z), etc.) with phase plots, magnitude plots, and smooth animated transitions. Generates both static PNGs and animated GIFs. Clean, functional code but entirely in one file.

## Short-term Improvements
- [x] Add `requirements.txt` (numpy, matplotlib)
- [x] Rename `complex-visualizer.py` to `complex_visualizer.py` for valid Python import
- [x] Split into modules: `functions.py` (function definitions), `colormap.py` (HSV mapping), `visualizer.py` (plotting), `animator.py` (GIF generation), `cli.py`
- [x] Add CLI arguments for function selection, resolution, output directory, and range
- [ ] Add docstrings explaining domain coloring and phase/magnitude visualization
- [x] Handle singularities gracefully (division by zero, branch cuts)

## Feature Enhancements
- [ ] Add interactive matplotlib widget to explore functions (click to see f(z) value)
- [ ] Support user-defined functions via string input (using `sympy.parse_expr`)
- [ ] Add Riemann surface visualization for multi-valued functions (sqrt, log)
- [ ] Implement contour line overlays (constant |f(z)| and constant arg(f(z)))
- [ ] Add side-by-side comparison mode (identity vs. transformed)
- [ ] Support higher resolution output and custom DPI settings
- [ ] Add conformal grid overlay to visualize angle preservation

## Long-term Vision
- [ ] Build an interactive web version using Plotly or WebGL shaders
- [ ] Add Julia set and Mandelbrot set visualization modes
- [ ] Implement iterated function system visualization
- [ ] Support vector field visualization (real and imaginary parts as arrows)
- [ ] Create an educational mode with step-by-step explanations of each function
- [ ] Add LaTeX rendering of function expressions on plots

## Technical Debt
- [x] Generated PNG and GIF files clutter the project root -- add `.gitignore` and output to `output/`
- [x] Hyphenated filename prevents Python import -- rename immediately
- [x] Animation frame count (50) and resolution (500) are hardcoded -- extract to constants or config
- [ ] Color mapping function likely duplicates matplotlib colormaps -- evaluate if custom HSV map is needed
- [x] No tests for visualization correctness (at minimum, test that functions produce expected shapes)
