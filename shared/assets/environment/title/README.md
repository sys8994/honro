# First ferry title art

2026-10-13 title-screen redesign, generated with the built-in image generation tool.

- `landscape.webp` / `.jpg`: independently authored 16:9 composition, quiet water at left, small open ferry and amber lantern at lower right.
- `portrait.webp` / `.jpg`: independently authored 9:16 composition, misted mountain opening above, ferry below; targeted second pass removed the boat canopy to match the landscape.
- `hanja-wordmark.png`: genuine-alpha ivory brush lettering, exactly `魂路` (user-confirmed on 2026-10-13, “혼의 길”). Original 1859×846 built-in image-generation output; no programmatic alpha removal, stroke warping, or texture filtering. Large primary title.
- `wordmark.png`: existing genuine-alpha ivory brush lettering, exactly `혼로`; reused once below the Hanja at 28% width, approximately 31% of its image height. No Latin H or red seal. The former Roman subtitle is no longer rendered.

Production prompts: Korean dark fantasy, first ferry landing, ink-dark granite mountain silhouettes, still river, blue-grey mist, restrained warm lantern, fine dry-brush painterly texture. Leave calm left-side (landscape) or upper/middle (portrait) negative space for independent UI. No people, spoilers, Chinese/Japanese ornaments, floating objects, giant/cropped foreground trees, baked-in text or menu. Logo: two readable Hangul syllables, ㅎ+ㅗ+ㄴ / ㄹ+ㅗ, warm ivory brush ink, transparent background; no red seal, H, border, underline or glow.

Only encoding/resizing is applied in production; no programmatic background removal or alpha reconstruction. Both background formats are embedded in Game's HTML by `game/build.mjs`; the existing world/map renderer is unchanged. Art must be reviewed at real UI scale, not just full-size source.

## Hanja lettering prompt · 2026-10-13

Built-in `image_gen`, `transparent_background: true`. Final prompt (verbatim):

> Use case: logo-brand. Production game title lettering asset for a Korean dark-fantasy RPG named HONRO. Create ONLY the exact two Chinese characters 魂路, arranged left to right on one line: 魂 on the left, 路 on the right. No other text. 魂 must retain 云 at left and 鬼 at right; 路 must retain 足 at left and 各 at right. Readable traditional Korean Hanja brush calligraphy, confident thick-to-thin strokes, varied deliberate taper, restrained natural dry-brush edges, powerful silhouette with clear counters. Old Korean RPG title feeling, refined and serious. Flat warm off-white / bone ink (#e9e3d1) for use over an ink-blue night landscape. No gold, metallic, bevel, outline, shadow, glow, texture overlay, distressed repeating noise, smoke, mountains, dragons, emblem, red stamp, seal, Latin H, extra lettering or background. Genuine transparent alpha background. Horizontally balanced two-character composition with modest breathing room between characters. Keep both complete characters fully inside the canvas. Broad horizontal landscape canvas roughly 2.2:1, tightly composed around the two glyphs with modest even outer padding; do not leave enormous empty margins. This is a clean transparent lettering cutout, no paper or painted backdrop. Exact text: 魂路.

Generated pixels are saved unmodified.

Pixels are reviewed over the existing dark title art and at desktop/mobile UI scale. Native Canvas composites are art review only; they are not browser layout or Pages verification.

## Asset provenance and review evidence

The Hanja PNG was newly generated for this repository with OpenAI's built-in image tool. No external image, commercial game logo, font file, or traced title was supplied to that generation. The Korean companion is the pre-existing generated `wordmark.png`; neither that source nor the existing paintings was edited in this change. No third-party font is required to display either image. System serif text is only an image-failure fallback.

Review files are reproducible local diagnostics, intentionally excluded from Git:
- `_local/reports/title-hanja/native/mark-real-size.png`: production alpha at 390, 263 and 170px widths over a dark ground.
- `_local/reports/title-hanja/native/{1440x900,400x800,333x740,333x592,844x390,667x333}-native-art.png`: six scene/mark scale compositions.
- `_local/reports/title-hanja/native/report.json`: asset SHA-256 and measured diagnostic layout values.

The implementer reviewed the source and display-scale cuts; an independent reviewer directly opened the 1440×900 and 333×740 compositions and approved the glyph structures, Korean reading ratio, background fit and absence of disruptive residual alpha noise. These are Native Canvas art checks. Public browser/CSS verification follows integration and deployment separately.
