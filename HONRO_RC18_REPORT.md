# HONRO RC18 Report

## Scope
Stage 3 and Stage 4 only. Stage 1/2 RC17.1 terrain remains unchanged.

## Density
- Stage 3 ground nodes: 96 vs prior 12 total ground nodes = 8.0x
- Stage 4 ground nodes: 91 vs prior 9 = 10.1x
- Stage 3 surface nodes: 398
- Stage 4 surface nodes: 292

## Gameplay validation
- Stage 3 start → exit: PASS
- Stage 4 start → exit: PASS
- Stage 3 dock-west → dock-mid → dock-east: PASS
- Stage 3 cargo-step-1 → cargo-step-2 → warehouse-roof: PASS
- Stage 3 permanent dock indestructibility: PASS
- Stage 4 west-step-1 → west-step-2 → west-shoulder: PASS
- Stage 4 east-step-1 → east-step-2 → east-watch: PASS
- fall/knockback/contact checks: 29 PASS
- RC13 balance audit: 7 PASS

## Browser / performance
- Stage 1: 28 renders/sec, launch 79.9 ms
- Stage 2: 48 renders/sec, launch 94.2 ms
- Stage 3: 49 renders/sec, launch 81.2 ms
- Stage 4: 61 renders/sec, launch 90.3 ms
- runtime exceptions: 0
- no Canvas filter usage
