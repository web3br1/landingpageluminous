# Palette Rules

## Palette Density

Use compact indexed-palette logic. A typical character should use:

- 1 dark outline color
- 2–4 body ramp colors
- 2–4 accent ramp colors
- 1–3 highlight colors
- 1–3 shadow colors
- optional controlled effect colors for special attacks

## Color Consistency

- Keep hue relationships consistent across every frame.
- Preserve iconic colors from the reference, but compress them into the game palette density.
- Avoid introducing unrelated colors in only one frame.
- Elemental effects may use brighter colors but must remain pixel-art compatible.

## Contrast

- Use enough contrast for small-scale readability.
- Separate the character from transparent background using outline and value structure.
- Avoid muddy ramps that collapse at gameplay scale.

## Forbidden Palette Issues

- Smooth gradient ramps.
- Random noisy dithering.
- Frame-by-frame palette drift.
- Overly realistic material rendering.
