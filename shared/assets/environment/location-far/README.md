# Shared distant scenery — rollout 2026-10-18

Approved visual direction: detailed coherent foreground, moderate-density distant silhouettes and intentional empty regions. Far local contrast/saturation/sharpness must be lower, with optional one-time cached treatment. No full-frame blur. Trees static; motion limited to water/fire/flags/waterfall/near grass as separate bounded overlays. Sources here are background-only candidate images, not playable terrain. The approved Stage 1 reference is a design reference only and must never be placed as a whole level image.

## Location families and provisional coverage
- mountain-dusk: Act 1 ridge/forest passages (1,2,7), transition 11.
- mountain-wet-valley: river/falls/bridge (3,5,6), daylight return20 and mountain-facing30 views.
- mountain-still-night: quiet village/shrine outskirts (4,8,9,10); no forced reuse for different spaces.
- cave-entrance: quarry/hidden gate transition12,13.
- cave-settlement: underground settlement14, temple16; maintain stage-specific distant landmark overlays sparsely.
- cave-waterwork: flooded passage15/worksite17.
- cave-bell-chamber: same physical cavern18,19; bell is a separate asset, never baked into rear.
- town-wall: town exterior21,22,24,28,29 as location supports; interior rooms need masked/local backing rather than force-filling with outdoor wall.
- town-river: cargo/river outskirts23,26,30.
- underground-channel: water channel25.
- underground-deep-draft: depot27. DRAFT ONLY: architecture currently reads too Roman/monumental; redesign toward Korean stone/wood before activation. Do not ship this candidate as final.

## Implementation sequence
Complete Stage1 first and provide normal camera/mobile/zoom-out actual frames, then progress by stage. Keep current missions, accessible routes, physics semantics. Roofs remain one-way. Preserve growth/campaign saves; invalidate an old battle only if map geometry revision changes. Do not bulk change all30 maps now.

## Performance
Convert sources to right-sized WebP runtime assets, per-stage/family demand load, bounded caches. Never eagerly decode all family art on startup. Existing startup performance task is separate and must finish without conflicts. Background transforms must follow established parallax rather than stretch 2K art across enormous world coordinates. No continuous expensive filters.
