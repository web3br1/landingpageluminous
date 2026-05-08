#!/usr/bin/env python3
"""Build a production prompt package from the sprite pipeline bibles and specs."""

from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FILES = [
    "prompts/master_sprite_bible.md",
    "prompts/negative_prompt.md",
    "specs/game_sprite_bible.md",
    "specs/atlas_layout_spec.md",
    "specs/animation_rules.md",
    "specs/palette_rules.md",
    "prompts/quality_checklist.md",
]


def read_section(relative_path: str) -> str:
    path = ROOT / relative_path
    return f"\n\n---\n\n## Source: {relative_path}\n\n{path.read_text(encoding='utf-8').strip()}\n"


def build_prompt(character_ref: str, output: Path | None) -> str:
    header = f"""# Production Sprite Prompt Package

Character reference: `{character_ref}`

You are working inside the sprite-pipeline project. Create a complete sprite generation prompt package for the referenced character. Preserve the character identity while converting it into the fixed tactical monster battle sprite style.

Return:

1. Character analysis
2. Main generation prompt
3. Negative prompt
4. Animation states
5. Atlas layout
6. Quality checklist
7. Notes for consistency across future characters
"""
    body = "".join(read_section(path) for path in DEFAULT_FILES)
    result = header + body
    if output:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(result, encoding="utf-8")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("character_ref", help="Reference image path or character description")
    parser.add_argument("-o", "--output", type=Path, help="Optional output markdown file")
    args = parser.parse_args()
    print(build_prompt(args.character_ref, args.output))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
