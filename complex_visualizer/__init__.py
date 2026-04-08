"""
complex_visualizer - Domain coloring and animated GIF visualizations of complex functions.

Submodules:
    functions  - Pre-defined complex functions and filename sanitizer
    colormap   - Phase colormap creation
    visualizer - ComplexVisualizer class (plotting and animation)
    cli        - CLI entry point
"""

from complex_visualizer.visualizer import ComplexVisualizer
from complex_visualizer.functions import create_example_functions

__all__ = ["ComplexVisualizer", "create_example_functions"]
