# Stage7 readability A/B

Standalone test-only workflow. Two variants (original / scoped readability helper) and two views (desktop bottom-right / portrait bottom-left). Both retain the identical production original BODY, source, 13 caps, stage, collision, bounded Engine move/tick and save roundtrip. performance.now is frozen only within Scene.render; real timing is restored in finally.

The actual original and replacement prepare functions are evaluated on the same battle. No segment may be added. Removed segments must be root-floor, nonwalkable and lie exactly on actual terrainBounds left/right/bottom. All walkable segments and all non-root groups remain exactly equal; actual rendered root-floor must carry honroDomain.

PNG A/B and red difference PNG record every changed pixel without a tolerance, plus screen/world extents and removed segment endpoints. There is no automatic art approval; inspect that the black rectangle is gone and existing walk rims remain. Production code is untouched.
