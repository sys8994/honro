# HONRO ACT 1 RC17.1 — Performance Hotfix

## Root cause
RC17 added Canvas 2D context filters (`saturate()` / `brightness()`) around landmark rendering to visually separate back/mid layers. Chromium rasterized these filtered vector landmarks extremely slowly. The issue was worst in Stage 1/2 because they have many large, highly detailed pine/cliff landmarks.

## Measured before fix
- Stage 1: ~1 render/s
- Stage 2: ~1 render/s
- Stage 3: ~4 render/s
- Stage launch itself: ~0.12–0.15 s
- JS heap: roughly 10–14 MB, no abnormal growth

This shows the problem was a renderer/compositor bottleneck, not a polygon-memory explosion.

## Fix
- Removed Canvas `filter` from per-frame landmark rendering.
- Kept the RC17 terrain geometry, z-order, alpha separation, materials and map design unchanged.
- Background distinction still uses layer ordering + global alpha, which is cheap.

## Measured after fix
Same headless Chromium / 1365×768 / 1-second window:
- Stage 1: 27 render/s, avg render 8.14 ms
- Stage 2: 49 render/s, avg render 4.92 ms
- Stage 3: 60 render/s, avg render 2.68 ms
- Heap delta during each 1 s sample was negative after GC; no leak observed.

## Regression gate
`game/tests/rc17-performance.py` now fails if:
- stage launch exceeds 700 ms
- render loop drops below 12 renders/s
- JS heap grows by >30 MB during the sample
- runtime error occurs
