# Campaign distance paintings (candidate)

All 30 stages retain the existing vector terrain. `manifest.json` selects only distant paintings; it does not author terrain, placements, or physics. Interior images contain no outdoor sky. Stages12/13/20 use their existing ceiling geometry to delimit distant cave backing.

Reused paintings: location-far/source/{cave-settlement,cave-waterwork,cave-entrance,town-river,town-wall}.png, encoded at2048px WebP quality85. Other paths reuse existing production WebP assets.

New painted sources generated2026-10-20 with ImageGen at1536×1024: root-interior (stage7 enclosed roots), archive-interior (stage22 distant record galleries), workshop-interior (stage26 cavern work/record refuge). Broad central depth and low-contrast distant architecture, no foreground collision surfaces. WebP quality85; no tracing or SVG rasterization. Generated village and reservoir alternatives were rejected in favor of existing subdued paintings; not shipped.

These are review candidates, not parent-approved final art. Runtime applies cached color treatment and bounded decoding. Screenshots and stage-by-stage review accompany the renderer checkpoint.
