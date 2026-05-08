#!/usr/bin/env python3
"""Run basic mechanical validation for a grid-based sprite atlas.

This script checks file existence, PNG dimensions, divisibility by the requested
atlas grid, and expected animation state count. It does not replace visual QA
against prompts/quality_checklist.md.
"""

from __future__ import annotations

import argparse
import struct
from pathlib import Path

REQUIRED_STATES = 8


def png_size(path: Path) -> tuple[int, int]:
    with path.open("rb") as file:
        signature = file.read(8)
        if signature != b"\x89PNG\r\n\x1a\n":
            raise ValueError("expected a PNG file")
        chunk_len = struct.unpack(">I", file.read(4))[0]
        chunk_type = file.read(4)
        if chunk_type != b"IHDR" or chunk_len < 8:
            raise ValueError("missing PNG IHDR chunk")
        width, height = struct.unpack(">II", file.read(8))
        return width, height


def validate(path: Path, rows: int, columns: int) -> list[str]:
    issues: list[str] = []
    if not path.exists():
        return [f"File not found: {path}"]

    try:
        width, height = png_size(path)
    except ValueError as error:
        return [f"Invalid image: {error}"]

    if rows != REQUIRED_STATES:
        issues.append(f"Expected {REQUIRED_STATES} animation rows, got {rows}.")
    if width % columns != 0:
        issues.append(f"Width {width}px is not divisible by {columns} columns.")
    if height % rows != 0:
        issues.append(f"Height {height}px is not divisible by {rows} rows.")
    if columns < 1:
        issues.append("Column count must be at least 1.")

    if not issues:
        cell_width = width // columns
        cell_height = height // rows
        print(f"PASS: {path} is {width}x{height}px with {columns}x{rows} cells ({cell_width}x{cell_height}px each).")
    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path, help="PNG sprite atlas to validate")
    parser.add_argument("--rows", type=int, default=8, help="Atlas rows; default: 8")
    parser.add_argument("--columns", type=int, default=6, help="Atlas columns; default: 6")
    args = parser.parse_args()

    issues = validate(args.image, args.rows, args.columns)
    if issues:
        for issue in issues:
            print(f"FAIL: {issue}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
