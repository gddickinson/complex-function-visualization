"""Tests for the complex_visualizer package."""

import cmath
import unittest

import numpy as np

from complex_visualizer.functions import create_example_functions, sanitize_filename
from complex_visualizer.colormap import create_phase_colormap
from complex_visualizer.visualizer import ComplexVisualizer


class TestFunctions(unittest.TestCase):
    """Tests for function definitions and utilities."""

    def test_create_example_functions_returns_list(self):
        funcs = create_example_functions()
        self.assertIsInstance(funcs, list)
        self.assertGreaterEqual(len(funcs), 8)

    def test_each_function_is_callable(self):
        for func, desc in create_example_functions():
            self.assertTrue(callable(func), f"{desc} is not callable")

    def test_z_squared_produces_correct_output(self):
        func = create_example_functions()[0][0]  # z^2
        result = func(complex(2, 1))
        expected = complex(2, 1) ** 2
        self.assertAlmostEqual(result.real, expected.real)
        self.assertAlmostEqual(result.imag, expected.imag)

    def test_sanitize_filename(self):
        # ² is a word character in Python regex (\w), so it survives sanitization
        result = sanitize_filename("f(z) = z²")
        self.assertNotIn("(", result)
        self.assertNotIn(" ", result)
        self.assertNotIn(" ", sanitize_filename("f(z) = exp(z)"))
        self.assertNotIn("(", sanitize_filename("f(z) = z"))

    def test_division_by_zero_handled(self):
        """z/(1-z) at z=1 should return inf, not raise."""
        func = create_example_functions()[4][0]
        result = func(complex(1, 0))
        self.assertTrue(cmath.isinf(result))

    def test_log_singularity_handled(self):
        """ln(1+z) at z=-1 should return inf, not raise."""
        func = create_example_functions()[7][0]
        result = func(complex(-1, 0))
        self.assertTrue(cmath.isinf(result))


class TestColormap(unittest.TestCase):
    def test_phase_colormap_created(self):
        cmap = create_phase_colormap()
        self.assertIsNotNone(cmap)
        self.assertEqual(cmap.name, 'phase')


class TestComplexVisualizer(unittest.TestCase):
    def test_init_creates_grid(self):
        vis = ComplexVisualizer(size=10)
        self.assertEqual(vis.Z.shape, (10, 10))

    def test_transform_complex_shape(self):
        vis = ComplexVisualizer(size=10)
        result = vis.transform_complex(lambda z: z**2)
        self.assertEqual(result.shape, (10, 10))

    def test_transform_complex_values(self):
        """Check that z^2 at the center is approximately 0."""
        vis = ComplexVisualizer(size=11, x_range=(-1, 1), y_range=(-1, 1))
        result = vis.transform_complex(lambda z: z**2)
        center = result[5, 5]
        self.assertAlmostEqual(abs(center), 0.0, places=5)


class TestPlotOutput(unittest.TestCase):
    """The drawn images: imaginary axis pointing up and phase colours on a fixed full-turn scale."""

    def _images(self, draw):
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        shown = []
        real_show = plt.show
        def fake_show(*a, **k):
            fig = plt.gcf()
            fig.canvas.draw()  # runs the first animation frame too
            shown.extend(im for ax in fig.axes for im in ax.images)
        plt.show = fake_show
        try:
            draw(ComplexVisualizer(size=9))
        finally:
            plt.show = real_show
            plt.close("all")
        return shown

    def _domain(self):
        return self._images(lambda v: v.plot_domain_coloring(lambda z: cmath.exp(z), "exp"))

    def _anim(self):
        return self._images(lambda v: v.create_transformation_animation(lambda z: z**2, frames=2))

    def test_domain_coloring_imaginary_axis_points_up(self):
        ims = self._domain()
        self.assertEqual(len(ims), 2)
        for im in ims:
            self.assertEqual(im.origin, "lower", "row 0 holds Im(z) = y_min and must be drawn at the bottom")

    def test_animation_imaginary_axis_points_up(self):
        self.assertEqual(self._anim()[-1].origin, "lower")


if __name__ == "__main__":
    unittest.main()
