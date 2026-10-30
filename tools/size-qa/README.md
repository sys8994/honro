# Lossless campaign packaging

This change does not simplify terrain or alter art, stage geometry, physics, or catalog content. It reuses the existing `json-pool-v1` encoder for repeated immutable strings/subtrees. The decoder creates independent JSON objects. Packets are pooled only when raw bytes improve by at least 5% and 1 KiB, and gzip improves by at least 2%; small/shared packets can remain plain.

The Workshop assembles the original 1,090-asset ordered catalog from the same shared/chapter resources used by gameplay plus 382 editor-only assets. There is no second full-campaign library download or generated monolith. Gameplay still loads only shared assets and its selected chapter, not editor extras or other chapters. Legacy manifests, split JSON descriptors, and narrative pooling remain supported.

## Measured build

See `lossless-campaign-proof.json` for exact bytes and all 40 chapter checks.

| Quantity | Before | After |
|---|---:|---:|
| Current generated graph | 116,819,329 B | 65,150,170 B |
| Current data JSON | 77,988,834 B | 29,195,053 B |
| Full catalog asset transport representation | 38,388,329 B | 24,021,956 B |
| Full catalog gzip estimate | 14,503,518 B | 9,013,466 B |

Current graph is **not startup download size**. Cold chapter figures in the receipt include shared assets + selected stage assets + stage JSON, not scripts/images/base metadata. Gzip numbers are local level-9 estimates, not observed server transfer sizes. Full catalog figures include the order list and reused asset bundles, not base/stage metadata.

Retained previous files are reported separately. Eighteen older published graphs naturally expired under the unchanged seven-day policy during this build; that reduction is not credited to this optimization. Unpublished intermediates containing obsolete full-library files may be retired, but attested published files remain protected by the existing retention policy.

Early chapter prefetch derives bounds from the downloaded catalog rather than an uninitialized release flag. A completed Act 4 save therefore does not unnecessarily fetch chapter 30 before chapter 40. The actual gameplay destination/unlock selector is unchanged.

An additional binary-only emission reuse removes 2,877,706 B of exact duplicate graphics (four aliases of one WebP and two aliases of one SVG). Byte identity is checked, not visual similarity. Fonts use the same rule; JavaScript, JSON, and entry modules are explicitly excluded. See `binary-reuse-proof.json`.

## Validation

- `node tests/web-binary-reuse.mjs` and `node tests/web-binary-build-proof.mjs`: concurrent binary aliases emit once, distinct data/module identities remain separate, 139 JSON packets retain identical content after verified binary-URL normalization.
- `node tests/campaign-prefetch-bounds.mjs`: stage 40 battle/rest, stage 31 restart, legacy 30-chapter catalog, sparse IDs, custom/absent/corrupt profiles, no extra chapter 30 fetch.
- `node tests/campaign-asset-pooling.mjs`: loader fixtures, independent object identity, full catalog order, lazy chapter loading, hydration, legacy/narrative compatibility, invalid catalog rejection, protected retention.
- `node tests/web-json-parts.mjs`: existing split transport compatibility.
- `node tests/web-build-retention.mjs`: retention contracts.
- `npm run build`: normal production build/release gate.
- `node --max-old-space-size=1536 tests/campaign-asset-build-proof.mjs a6da24cc7b5c9df33b56b3cf592d7260fd6ad7db tools/size-qa/lossless-campaign-proof.json 2026-10-30T04:02:59.380Z`: exact reconstructed library, 40 chapter definitions and asset closures, unchanged canonical world/runtime hashes, independent objects, all current/retained file integrity.

The build proof is time-bound to the recorded manifest retention snapshot; supply the recorded build-start timestamp when verifying that snapshot after another published generation expires, or rebuild for a fresh snapshot. The final build started at 2026-10-30T04:02:59.380Z (local build log creation time), before the 04:03:25 expiry boundary. Browser visual/loading evidence is recorded separately, not implied by JSON equality.
