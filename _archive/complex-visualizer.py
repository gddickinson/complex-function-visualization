import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from matplotlib.colors import LinearSegmentedColormap
import cmath
from typing import Callable, List, Tuple
import colorsys
import re

class ComplexVisualizer:
    def __init__(self, size: int = 500, x_range: Tuple[float, float] = (-2, 2),
                 y_range: Tuple[float, float] = (-2, 2)):
        self.size = size
        self.x_range = x_range
        self.y_range = y_range
        
        # Create complex plane grid
        x = np.linspace(x_range[0], x_range[1], size)
        y = np.linspace(y_range[0], y_range[1], size)
        self.X, self.Y = np.meshgrid(x, y)
        self.Z = self.X + 1j * self.Y
        
        # Create custom colormap for phase visualization
        colors = []
        for i in range(256):
            hue = i / 256
            colors.append(colorsys.hsv_to_rgb(hue, 1.0, 1.0))
        self.phase_cmap = LinearSegmentedColormap.from_list('phase', colors)

    def transform_complex(self, func: Callable[[complex], complex]) -> np.ndarray:
        """Apply complex function to the grid"""
        vectorized_func = np.vectorize(func)
        return vectorized_func(self.Z)

    def plot_domain_coloring(self, func: Callable[[complex], complex], 
                           title: str, filename: str = None):
        """Create domain coloring visualization"""
        W = self.transform_complex(func)
        
        # Calculate phase and magnitude
        phase = np.angle(W) / (2 * np.pi) + 0.5
        magnitude = np.log1p(np.abs(W))
        
        # Create figure with two subplots
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 7))
        
        # Phase plot
        im1 = ax1.imshow(phase, cmap=self.phase_cmap, extent=[*self.x_range, *self.y_range])
        ax1.set_title(f'{title}\nPhase Visualization')
        plt.colorbar(im1, ax=ax1, label='Phase')
        
        # Magnitude plot
        im2 = ax2.imshow(magnitude, cmap='viridis', extent=[*self.x_range, *self.y_range])
        ax2.set_title(f'{title}\nMagnitude Visualization')
        plt.colorbar(im2, ax=ax2, label='Log Magnitude')
        
        plt.tight_layout()
        if filename:
            plt.savefig(filename, dpi=300, bbox_inches='tight')
        plt.show()

    def create_transformation_animation(self, func: Callable[[complex], complex], 
                                     frames: int = 50, filename: str = None):
        """Create animation of continuous transformation"""
        fig, ax = plt.subplots(figsize=(10, 10))
        
        def animate(frame):
            t = frame / frames
            # Interpolate between identity and final transformation
            W = self.Z + t * (self.transform_complex(func) - self.Z)
            phase = np.angle(W) / (2 * np.pi) + 0.5
            
            ax.clear()
            ax.imshow(phase, cmap=self.phase_cmap, extent=[*self.x_range, *self.y_range])
            ax.set_title(f'Complex Transformation Animation\nt = {t:.2f}')
        
        anim = FuncAnimation(fig, animate, frames=frames, interval=50)
        if filename:
            anim.save(filename, writer='pillow')
        plt.show()

def sanitize_filename(name: str) -> str:
    """Convert function description to safe filename"""
    # Remove special characters and spaces
    clean_name = re.sub(r'[^\w\-_]', '_', name)
    # Remove duplicate underscores
    clean_name = re.sub(r'_+', '_', clean_name)
    # Remove leading/trailing underscores
    clean_name = clean_name.strip('_')
    return clean_name

def create_example_functions() -> List[Tuple[Callable, str]]:
    """Create a list of interesting complex functions with their descriptions"""
    return [
        (lambda z: z**2, "f(z) = z²"),
        (lambda z: z**3 - 1, "f(z) = z³ - 1"),
        (lambda z: cmath.exp(z), "f(z) = exp(z)"),
        (lambda z: cmath.sin(z), "f(z) = sin(z)"),
        (lambda z: z / (1 - z), "f(z) = z/(1-z)"),
        (lambda z: cmath.sqrt(z), "f(z) = sqrt(z)"),
        (lambda z: z*cmath.exp(z), "f(z) = z·exp(z)"),
        (lambda z: cmath.log(1 + z), "f(z) = ln(1+z)")
    ]

if __name__ == "__main__":
    # Create visualizer instance
    visualizer = ComplexVisualizer(size=500)
    
    # Get example functions
    functions = create_example_functions()
    
    # Generate static visualizations
    for func, desc in functions:
        print(f"\nVisualizing {desc}")
        safe_name = sanitize_filename(desc)
        visualizer.plot_domain_coloring(
            func,
            desc,
            filename=f"complex_vis_{safe_name}.png"
        )
    
    # Generate animations for selected functions
    interesting_funcs = [functions[0], functions[2], functions[3]]  # Square, exp, and sin
    for func, desc in interesting_funcs:
        print(f"\nCreating animation for {desc}")
        safe_name = sanitize_filename(desc)
        visualizer.create_transformation_animation(
            func,
            frames=50,
            filename=f"complex_anim_{safe_name}.gif"
        )