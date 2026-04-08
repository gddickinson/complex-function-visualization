"""CLI entry point for the complex function visualizer."""

import argparse
import os

from complex_visualizer.functions import create_example_functions, sanitize_filename
from complex_visualizer.visualizer import ComplexVisualizer, DEFAULT_FRAMES, DEFAULT_SIZE


def main():
    parser = argparse.ArgumentParser(
        description="Generate domain coloring visualizations of complex functions.",
    )
    parser.add_argument("--size", type=int, default=DEFAULT_SIZE, help=f"Grid resolution (default: {DEFAULT_SIZE})")
    parser.add_argument("--frames", type=int, default=DEFAULT_FRAMES, help=f"Animation frames (default: {DEFAULT_FRAMES})")
    parser.add_argument("--output-dir", default=".", help="Output directory (default: .)")
    parser.add_argument("--no-animate", action="store_true", help="Skip animation generation")
    parser.add_argument(
        "--range", type=float, nargs=2, default=[-2, 2],
        metavar=("MIN", "MAX"),
        help="Complex plane range (default: -2 2)",
    )

    args = parser.parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    x_range = (args.range[0], args.range[1])
    visualizer = ComplexVisualizer(size=args.size, x_range=x_range, y_range=x_range)
    functions = create_example_functions()

    for func, desc in functions:
        print(f"\nVisualizing {desc}")
        safe_name = sanitize_filename(desc)
        visualizer.plot_domain_coloring(
            func,
            desc,
            filename=os.path.join(args.output_dir, f"complex_vis_{safe_name}.png"),
        )

    if not args.no_animate:
        interesting_funcs = [functions[0], functions[2], functions[3]]
        for func, desc in interesting_funcs:
            print(f"\nCreating animation for {desc}")
            safe_name = sanitize_filename(desc)
            visualizer.create_transformation_animation(
                func,
                frames=args.frames,
                filename=os.path.join(args.output_dir, f"complex_anim_{safe_name}.gif"),
            )


if __name__ == "__main__":
    main()
