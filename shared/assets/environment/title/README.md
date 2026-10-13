# First ferry title art

2026-10-13 title-screen redesign, generated with the built-in image generation tool.

- `landscape.webp` / `.jpg`: independently authored 16:9 composition, quiet water at left, small open ferry and amber lantern at lower right.
- `portrait.webp` / `.jpg`: independently authored 9:16 composition, misted mountain opening above, ferry below; targeted second pass removed the boat canopy to match the landscape.
- `hanja-wordmark.png`: genuine-alpha ivory brush lettering, exactly `魂路` (user-confirmed on 2026-10-13, “혼의 길”). Original 1859×846 built-in image-generation output; no programmatic alpha removal, stroke warping, or texture filtering. Large primary title.
- `wordmark.png`: existing genuine-alpha ivory brush lettering, exactly `혼로`; reused once below the Hanja at 28% width, approximately 31% of its image height. No Latin H or red seal. The former Roman subtitle is no longer rendered.

Production prompts: Korean dark fantasy, first ferry landing, ink-dark granite mountain silhouettes, still river, blue-grey mist, restrained warm lantern, fine dry-brush painterly texture. Leave calm left-side (landscape) or upper/middle (portrait) negative space for independent UI. No people, spoilers, Chinese/Japanese ornaments, floating objects, giant/cropped foreground trees, baked-in text or menu. Logo: two readable Hangul syllables, ㅎ+ㅗ+ㄴ / ㄹ+ㅗ, warm ivory brush ink, transparent background; no red seal, H, border, underline or glow.

Only encoding/resizing is applied in production; no programmatic background removal or alpha reconstruction. Both background formats are embedded in Game's HTML by `game/build.mjs`; the existing world/map renderer is unchanged. Art must be reviewed at real UI scale, not just full-size source.

## Hanja lettering prompt · 2026-10-13

Built-in `image_gen`, transparent background. Production Korean dark-fantasy game title logo. Exactly `魂路`, left to right: `魂` retains 云 and 鬼; `路` retains 足 and 各. Readable traditional Korean Hanja brush calligraphy, deliberate thick-to-thin taper, restrained natural dry-brush edges, clear counters, flat warm off-white/bone ink (#e9e3d1). Horizontally balanced two-character composition with modest space between complete glyphs and small outer padding. No extra text, Hangul, gold, metallic, bevel, outline, shadow, glow, overlay texture, repeating noise, smoke, mountains, dragons, emblem, stamp, seal or Latin H. Genuine transparent alpha. Full prompt wording is embodied by these constraints; generated pixels are saved unmodified.

Pixels are reviewed over the existing dark title art and at desktop/mobile UI scale. Native Canvas composites are art review only; they are not browser layout or Pages verification.
