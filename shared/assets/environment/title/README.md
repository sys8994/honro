# First ferry title art

2026-10-13 title-screen redesign, generated with the built-in image generation tool.

- `landscape.webp` / `.jpg`: independently authored 16:9 composition, quiet water at left, small open ferry and amber lantern at lower right.
- `portrait.webp` / `.jpg`: independently authored 9:16 composition, misted mountain opening above, ferry below; targeted second pass removed the boat canopy to match the landscape.
- `wordmark.png`: genuine-alpha ivory brush lettering, exactly `혼로`; targeted cleanup removed most bevel/fringe emphasis. No Latin H or red seal. `HONRO` is rendered separately in HTML.

Production prompts: Korean dark fantasy, first ferry landing, ink-dark granite mountain silhouettes, still river, blue-grey mist, restrained warm lantern, fine dry-brush painterly texture. Leave calm left-side (landscape) or upper/middle (portrait) negative space for independent UI. No people, spoilers, Chinese/Japanese ornaments, floating objects, giant/cropped foreground trees, baked-in text or menu. Logo: two readable Hangul syllables, ㅎ+ㅗ+ㄴ / ㄹ+ㅗ, warm ivory brush ink, transparent background; no red seal, H, border, underline or glow.

Only encoding/resizing is applied in production; no programmatic background removal or alpha reconstruction. Both background formats are embedded in Game's HTML by `game/build.mjs`; the existing world/map renderer is unchanged. Art must be reviewed at real UI scale, not just full-size source.
