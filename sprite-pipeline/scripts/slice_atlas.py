#!/usr/bin/env python3
"""Slice a grid-based sprite atlas into individual frame PNG files."""

from __future__ import annotations

import argparse
from pathlib import Path

STATE_NAMES = [
    "idle",
    "movement",
    "physical_attack",
    "special_attack",
    "hurt",
    "sleep",
    "knockout_defeat",
    "victory_pose",
]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path, help="Input PNG atlas")
    parser.add_argument("output_dir", type=Path, help="Directory for sliced frames")
    parser.add_argument("--rows", type=int, default=8, help="Atlas rows; default: 8")
    parser.add_argument("--columns", type=int, default=6, help="Atlas columns; default: 6")
    args = parser.parse_args()

    try:
        from PIL import Image
    except ImportError:
        print("FAIL: Pillow is required for slicing. Install with: python -m pip install Pillow")
        return 1

    atlas = Image.open(args.image)
    width, height = atlas.size
    if width % args.columns or height % args.rows:
        print(f"FAIL: atlas size {width}x{height}px is not divisible by {args.columns}x{args.rows} cells.")
        return 1

    cell_width = width // args.columns
    cell_height = height // args.rows
    args.output_dir.mkdir(parents=True, exist_ok=True)

    for row in range(args.rows):
        state = STATE_NAMES[row] if row < len(STATE_NAMES) else f"state_{row + 1:02d}"
        state_dir = args.output_dir / state
        state_dir.mkdir(exist_ok=True)
        for column in range(args.columns):
            box = (
                column * cell_width,
                row * cell_height,
                (column + 1) * cell_width,
                (row + 1) * cell_height,
            )
            frame = atlas.crop(box)
            frame.save(state_dir / f"{state}_{column + 1:02d}.png")

    print(f"PASS: sliced {args.rows * args.columns} frames into {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
