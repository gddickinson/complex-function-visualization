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
  _archive/
    complex-visualizer.py      # Original single-file version (archived)
  complex_visualizer.py        # Entry-point wrapper (python complex_visualizer.py)
  test_complex_visualizer.py   # Unit tests
  requirements.txt             # numpy, matplotlib
  .gitignore                   # Ignores *.png, *.gif, output/
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
