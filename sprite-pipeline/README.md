# Sprite Production Pipeline

A dedicated Codex-ready production pipeline for generating, refining, validating, and organizing tactical monster battle sprite sheets.

This project is designed for a competitive 3v3 monster battle game using a consistent Nintendo DS-era tactical RPG sprite language.

## Directory Layout

```text
sprite-pipeline/
├─ README.md
├─ codex.md
├─ prompts/
│  ├─ master_sprite_bible.md
│  ├─ character_reference_prompt.md
│  ├─ animation_states.md
│  ├─ negative_prompt.md
│  └─ quality_checklist.md
├─ specs/
│  ├─ game_sprite_bible.md
│  ├─ sprite_style_guide.md
│  ├─ atlas_layout_spec.md
│  ├─ animation_rules.md
│  └─ palette_rules.md
├─ input/
│  └─ character_refs/
├─ output/
│  ├─ generated/
│  ├─ approved/
│  └─ rejected/
├─ scripts/
│  ├─ build_prompt.py
│  ├─ validate_sprite_sheet.py
│  └─ slice_atlas.py
└─ examples/
   └─ cyndaquil_typhlosion_reference.md
```

## Standard Codex Request

```text
You are working inside the sprite-pipeline project.
Create a complete sprite generation prompt package for the uploaded character reference.
Use:
- prompts/master_sprite_bible.md
- prompts/negative_prompt.md
- specs/atlas_layout_spec.md
- specs/animation_rules.md
- specs/palette_rules.md
The output must preserve the character identity while converting it into our fixed tactical monster battle sprite style.
Return:
1. Character analysis
2. Main generation prompt
3. Negative prompt
4. Animation states
5. Atlas layout
6. Quality checklist
7. Notes for consistency across future characters
```

## Ideal Workflow

1. Place the character image in `input/character_refs`.
2. Ask Codex to analyze the image.
3. Generate the final prompt package with Codex.
4. Use the prompt package in an image generator.
5. Place the generated result in `output/generated`.
6. Validate the result against `prompts/quality_checklist.md`.
7. Move approved assets to `output/approved` or rejected assets to `output/rejected`.

## Script Helpers

- `scripts/build_prompt.py`: assembles the core prompt/spec files into one prompt package scaffold.
- `scripts/validate_sprite_sheet.py`: performs basic image and atlas consistency checks.
- `scripts/slice_atlas.py`: slices a grid-based atlas into individual frame files.
