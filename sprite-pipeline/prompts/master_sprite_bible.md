# Master Sprite Bible — Tactical Monster Battle Atlas

Use this file as the source of truth for every character prompt in the sprite production pipeline.

## Target Output

Create a production-ready retro tactical monster battle sprite sheet for a competitive 3v3 battle game. The result must read as a handcrafted Nintendo DS-era tactical RPG sprite atlas, not as generic decorative pixel art.

## Visual Pillars

The sprite must combine:

- Pokémon Mystery Dungeon GBA/NDS-style small-sprite readability.
- Fire Emblem GBA-style combat silhouette clarity.
- Golden Sun-style battle energy and expressive posing.
- Tactical board-game readability from a consistent 3/4 camera.
- Clean, indexed-palette pixel-art presentation.

## Fixed Camera and Pose Language

- Use a consistent tactical 3/4 camera angle.
- Keep all frames aligned to the same ground plane.
- Preserve the same character proportions across every animation state.
- Face the primary combat direction consistently unless a state explicitly requires a mirrored or directional variant.
- Avoid dramatic perspective shifts between frames.

## Pixel-Art Rendering Rules

- Hard-edged pixels only.
- No painterly blending.
- No smooth gradients.
- No anti-aliased vector look.
- Use deliberate pixel clusters and clean internal shapes.
- Use readable forms at gameplay scale before adding small details.
- Prioritize silhouette, pose, and attack intent over surface ornamentation.

## Outline Rules

- Use a consistent dark outer outline.
- Use selective internal outline only where it improves readability.
- Keep outline thickness stable across the full sheet.
- Do not let small limbs, accessories, flames, tails, horns, ears, or hair merge into the body.

## Palette Rules

- Use a compact palette with controlled ramps.
- Preserve the character’s iconic colors while adapting them to the shared game palette density.
- Separate body, accent, shadow, highlight, and effect colors clearly.
- Keep the palette consistent between all frames.
- Avoid random dithering and noisy texture patches.

## Required Animation States

Every atlas must include these eight states:

1. Idle
2. Movement
3. Physical Attack
4. Special Attack
5. Hurt
6. Sleep
7. Knockout / Defeat
8. Victory Pose

## Character Fidelity Rules

When adapting a reference, preserve:

- core silhouette
- species identity
- head-to-body relationship
- body proportions
- facial structure or facial read
- iconic accessories or markings
- personality expression
- elemental motifs or combat role

Do not preserve the reference’s original rendering style if it conflicts with the game style. Translate the identity into the fixed tactical sprite language.

## Atlas Requirements

- Transparent background.
- Clean grid organization.
- Consistent frame cell size.
- Consistent baseline and center alignment.
- No UI, labels, scenery, text, shadows outside the sprite/effect language, or decorative borders.
- Each row should represent one animation state unless a specific atlas spec says otherwise.

## Prompt Output Format

When generating a character prompt package, return:

1. Character interpretation
2. Visual constraints
3. Master generation prompt
4. Negative prompt
5. Atlas layout instructions
6. Quality checklist
7. Optional variation prompts

## Hard Rejection Criteria

Reject or regenerate if the output contains:

- inconsistent anatomy between frames
- inconsistent camera angles
- inconsistent outline thickness
- mismatched palette between frames
- mushy AI pixels
- semi-realistic rendering
- painterly rendering
- unreadable silhouette
- merged limbs or important appendages
- disconnected animation frames
- background scenery
- non-transparent background
- frame cells that cannot be sliced reliably
