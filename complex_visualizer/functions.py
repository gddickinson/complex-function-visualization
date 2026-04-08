"""Pre-defined complex functions and filename utilities."""

import cmath
import re
from typing import Callable, List, Tuple


def create_example_functions() -> List[Tuple[Callable, str]]:
    """Return a list of interesting complex functions with descriptions."""
    return [
        (lambda z: z**2, "f(z) = z²"),
        (lambda z: z**3 - 1, "f(z) = z³ - 1"),
        (lambda z: cmath.exp(z), "f(z) = exp(z)"),
        (lambda z: cmath.sin(z), "f(z) = sin(z)"),
        (lambda z: z / (1 - z) if z != 1 else complex('inf'), "f(z) = z/(1-z)"),
        (lambda z: cmath.sqrt(z), "f(z) = sqrt(z)"),
        (lambda z: z * cmath.exp(z), "f(z) = z·exp(z)"),
        (lambda z: cmath.log(1 + z) if z != -1 else complex('inf'), "f(z) = ln(1+z)"),
    ]


def sanitize_filename(name: str) -> str:
    """Convert a function description to a safe filename."""
    clean_name = re.sub(r'[^\w\-_]', '_', name)
    clean_name = re.sub(r'_+', '_', clean_name)
    clean_name = clean_name.strip('_')
    return clean_name
