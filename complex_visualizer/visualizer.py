"""ComplexVisualizer - domain coloring and transformation animations."""

from typing import Callable, Tuple

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.animation import FuncAnimation

from complex_visualizer.colormap import create_phase_colormap

# Default constants (previously hardcoded)
DEFAULT_SIZE = 500
DEFAULT_FRAMES = 50
DEFAULT_RANGE = (-2, 2)


class ComplexVisualizer:
    def __init__(
        self,
        size: int = DEFAULT_SIZE,
        x_range: Tuple[float, float] = DEFAULT_RANGE,
        y_range: Tuple[float, float] = DEFAULT_RANGE,
    ):
        self.size = size
        self.x_range = x_range
        self.y_range = y_range

        # Create complex plane grid
        x = np.linspace(x_range[0], x_range[1], size)
        y = np.linspace(y_range[0], y_range[1], size)
        self.X, self.Y = np.meshgrid(x, y)
        self.Z = self.X + 1j * self.Y

        self.phase_cmap = create_phase_colormap()

    def transform_complex(self, func: Callable[[complex], complex]) -> np.ndarray:
        """Apply complex function to the grid."""
        vectorized_func = np.vectorize(func)
        return vectorized_func(self.Z)

    def plot_domain_coloring(
        self,
        func: Callable[[complex], complex],
        title: str,
        filename: str = None,
    ):
        """Create domain coloring visualization with phase and magnitude subplots."""
        W = self.transform_complex(func)

        phase = np.angle(W) / (2 * np.pi) + 0.5
        magnitude = np.log1p(np.abs(W))

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 7))

        im1 = ax1.imshow(phase, cmap=self.phase_cmap, extent=[*self.x_range, *self.y_range])
        ax1.set_title(f'{title}\nPhase Visualization')
        plt.colorbar(im1, ax=ax1, label='Phase')

        im2 = ax2.imshow(magnitude, cmap='viridis', extent=[*self.x_range, *self.y_range])
        ax2.set_title(f'{title}\nMagnitude Visualization')
        plt.colorbar(im2, ax=ax2, label='Log Magnitude')

        plt.tight_layout()
        if filename:
            plt.savefig(filename, dpi=300, bbox_inches='tight')
        plt.show()

    def create_transformation_animation(
        self,
        func: Callable[[complex], complex],
        frames: int = DEFAULT_FRAMES,
        filename: str = None,
    ):
        """Create animation of continuous transformation from identity to func."""
        fig, ax = plt.subplots(figsize=(10, 10))

        def animate(frame):
            t = frame / frames
            W = self.Z + t * (self.transform_complex(func) - self.Z)
            phase = np.angle(W) / (2 * np.pi) + 0.5
            ax.clear()
            ax.imshow(phase, cmap=self.phase_cmap, extent=[*self.x_range, *self.y_range])
            ax.set_title(f'Complex Transformation Animation\nt = {t:.2f}')

        anim = FuncAnimation(fig, animate, frames=frames, interval=50)
        if filename:
            anim.save(filename, writer='pillow')
        plt.show()
