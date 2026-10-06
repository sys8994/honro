# Source recovery checkpoint · 2026-10-06

The published baseline is `c0235043cc712290e672375cd0b36bbdc73f911d` (tree `e18274222b497652eb8492033facbef5b4ed0d72`). Its complete source tree was recovered from surviving Git objects and checked against GitHub.

The completed review build identified as `937416936a5b650a94276f34c4c32fc1d0d0674d` survived as two standalone HTML bundles. Runtime JavaScript and CSS were extracted from their deterministic bundle boundaries. The only changed TypeScript module, `engine.ts`, was reconstructed minimally against the published typed source and its emitted JavaScript verified byte-for-byte. The other 36 engine emissions matched the existing source. The authored campaign retains its original structure with the exact additional stage-7 root-reentry terrain. Bundle manifest and stage-7 authoring hook were reconstructed. Ten documentation/build/CSS files were recovered from previously uploaded Git blob objects.

## Fresh verification at this checkpoint

- `npm run build`: passed.
- `npm --prefix game run typecheck`: passed.
- Rebuilt `HONRO.html` SHA-256: `2f01a4c83c632f619e94b38c6cca9497309b89a551dab8b0266cf7f379f2e079`.
- Rebuilt `HONRO_WORKSHOP.html` SHA-256: `19e624682421de7716294df6984d05f56584c41df60ec4fa0ba4ed7b95ce31c9`.
- Both rebuilt files are byte-identical to the preserved 9374169 review bundle. The Workshop embedded playtest HTML is also identical to the standalone game.

## Recovery limits

This is a recovered source checkpoint, not the lost original Git commit. Original type-only edits and source whitespace not present in the emitted bundle cannot be proven. Some later tests, capture tools and review-pipeline tools did not survive and require separately identified reconstruction. Historical test counts in recovered documents describe the earlier run, not fresh verification. Scripts depending on missing tools must not be reported as passing. Later character, aim/wind/audio, terrain and ground-contact refinements are not included in this baseline.

No new browser input, save-storage, normal-play, performance or Pages acceptance result is implied by bundle identity. Those remain separate checks.
