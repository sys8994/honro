# Stage 27 final working architecture evidence

Source: b9c8662 (reachable roofs + normal policy), 56304d4 (visual-only bearing posts). This packet supersedes earlier stage27 review images.

Implemented unequal masonry quays, joined wooden galleries, 3 reachable 180-high one-way eaves with non-colliding bearing posts/stone feet, and contradictory rear drainage. Dark rear galleries and broken water connections remain static vector scenery. No dynamic water simulation claim.

## Checks

- Normal-resource production App policy: won R34 / 118 recorded actions, zero retries; all 4 enemy groups / 8 original enemies received real damage. Two optional survivors remain. Real movement, basic jump, legal skills/M09, four crossings, evidence, void event, manifest and exit; no enemy deletion, post-launch position/resource edits or victory overrides. DOM/audio/render doubles: this is an automated input policy, not a manual browser clear.
- Normal policy ran after roof translation at b9c8662. normal-reuse-contract.json proves every stage field, collision and oneWay identical after final artwork-only post addition.
- 6 roof access cases (2 heroes x3): basic approach/jump-through/land/drop/exit. 2 third-crossing bypass probes remain blocked by vertical reach. Isolated prepared geometry probes, not normal combat.
- 27 crossing/physics probes; 4 focused walks; exact Stage27 source contract; all other 29 stages and old assets preserved; environment validation 30 stages; build; old-save Continue and retry checks passed. Logs supplied.
- Actual Chromium game desktop/mobile captures with exact frozen inspection cameras and full enemy roster. Deep view uses prepared pre-fall actor poses. Workshop desktop/mobile captures passed. Actual void browser desktop/mobile/Workshop checks passed including safe return, pause/focus/rapid input, sound/mute and reload. Screenshots are not fullplay evidence.

## Review paths

- browser/desktop-accessible-roof.png (final posts/feet)
- browser/desktop-deep-before-fall.png and mobile-deep-before-fall.png
- native/stage-27-overview.png
- workshop/HONRO_WORKSHOP-1440-roof.png
- normal-policy.json (raw action/damage trace)

## Remaining acceptance limits

Official Korean reference images could not be downloaded/viewed due to access failures; do not claim reference pixels inspected. Root performed independent image review of prior and revised deep/roof views; final exact-byte raw-action tactical review is still needed. The mandatory encounter gate was run and is BLOCKED: its pending manifest lacks normalized evidence/observations and independent digest-bound review. This is not final encounter acceptance. Full integrated verify/master/Pages not run here; parent controls integration. Prior act3-save-boundaries failure (line73 0 !== 1) also reproduced on exact d7 baseline; separate focused save tests pass. See prior review logs. No remote push performed by this agent.

## Reproduction

The passes are standalone, not hooked into the vertical generator. After rebuilding the baseline vertical campaign, run in this order from repository root:

```sh
node tools/map-forge/stage27-depot-revision.mjs shared/data/campaign.json
node tools/map-forge/stage27-depot-distortion.mjs shared/data/campaign.json
node tools/map-forge/stage27-working-architecture.mjs shared/data/campaign.json
npm run build
```

Each pass is idempotent; running on an already revised project is a no-op. To revise the pass itself, regenerate from the matching preceding source stage rather than applying over its existing prefixed assets. Current r3 was regenerated from commit847a823 campaign (r1+r2 already applied). No other stage writes are authorized for this worktree.
