"""Phase colormap creation for complex function visualization."""

import colorsys

from matplotlib.colors import LinearSegmentedColormap


def create_phase_colormap() -> LinearSegmentedColormap:
    """Create an HSV-based colormap for mapping complex phase to color.

    Maps phase angle [0, 2pi] to hue [0, 1] at full saturation and value.
    """
    colors = []
    for i in range(256):
        hue = i / 256
        colors.append(colorsys.hsv_to_rgb(hue, 1.0, 1.0))
    return LinearSegmentedColormap.from_list('phase', colors)
