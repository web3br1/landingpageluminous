# Atlas Layout Spec

## Default Layout

- Transparent background.
- One animation state per row.
- Eight rows total, in this order:
  1. Idle
  2. Movement
  3. Physical Attack
  4. Special Attack
  5. Hurt
  6. Sleep
  7. Knockout / Defeat
  8. Victory Pose
- Recommended default: 6 frames per row.
- Use a consistent cell size across the entire atlas.
- Keep character feet or ground contact aligned to a consistent baseline.

## Frame Cell Guidance

- Small monsters: 32×32 or 48×48 px cells.
- Medium monsters: 64×64 px cells.
- Large monsters: 96×96 px cells only when needed for readability.
- Do not mix cell sizes within a single atlas.

## Spacing

- Leave enough padding so attack effects and appendages do not overlap neighboring cells.
- Keep the sprite centered consistently unless motion anticipation or follow-through requires intentional offset.
- Avoid decorative borders, labels, UI, and scenery.

## Sliceability

A valid atlas can be sliced mechanically by cell width, cell height, rows, and columns without manual cleanup.
