# Act4 lossless source parts

`shared/data/act4/world.parts/` is the canonical Git source. Its manifest lists ordered literal UTF-8 fragments, individual byte lengths/SHA-256 checksums, and the complete original byte length/SHA-256. These fragments are **not** independent JSON documents and are not compressed or reserialized. `.gitattributes` disables line-ending conversion for them.

The generated, Git-ignored `shared/data/act4/world.json` is the unchanged interface used by existing authoring tools, runtime builders and tests. Root/game `npm ci` postinstall restores it; `npm run act4:source:materialize` does so explicitly when install scripts are disabled. The release guard and official Web build also verify/materialize before consuming it. A changed existing working copy causes an error, never silent replacement.

## Editing

1. Run `npm run act4:source:materialize` after checkout/update.
2. Use existing authoring tools on `world.json`.
3. Run `npm run act4:source:pack` to save intentional changes into parts and their manifest.
4. Run `npm run test:act4-source` and the checks appropriate to the edited art/gameplay, then commit parts/manifest. Do not commit the generated world.json.

`npm run act4:source:check` verifies canonical parts without writing. If an intentional update changes the reviewed complete SHA, update the pinned regression expectation only with the new tested source; do not use that to update visual/probe approvals automatically.

## Migration evidence (2026-10-29)

The old 27,909,764-byte source becomes14 parts of at most2MiB. Concatenation exactly recreates SHA-256 `6d7737450f484807d1ed927f00ed0e7d2cb6f25beb6140c416c27c00440b5b34`. This is a source transport change for a connector's16MiB request-body limit, not a runtime or artwork simplification. Tests cover clean-copy restoration, multibyte boundaries, deterministic packing, missing/tampered chunks, path escape and refusing to overwrite unpacked edits.

No release review is approved by reconstruction. The Stage31 camera-and-state review remains pending; the normal production build must still reject that package. Generated browser artifacts continue to follow the existing build and Pages workflow.
