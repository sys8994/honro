# Immutable fixture storage

`act3-environment-final-delta.json.gz` and `act3-environment-final-v2-delta.json.gz`
are losslessly compressed storage for the original reviewed JSON fixtures. Their
canonical identities remain the `.json` names (including `supersedes.file`).
Approval SHA-256 hashes apply to the **exact decompressed bytes**, not the gzip
container. No JSON normalization, baseline regeneration or approval change is
permitted as a storage optimization.

`tests/pinned-fixture-bytes.mjs` reads either canonical plain storage or its `.gz`
alternative with Node's built-in zlib. A present plain file is authoritative;
corrupt or truncated compressed files fail closed. The pin tool considers both
storage forms already pinned and refuses automatic replacement.

Run `node tests/pinned-fixture-storage.mjs` for exact historical hashes, approval
assertions, both storage forms, damaged compression, and repin protection.

The same exact-byte storage convention also covers:
- `runtime-contracts/current-manifest.json`
- `stage11-ravine-draft-save.json`
- `narrative-legacy-resolver-v1.json`
- `stage11-ravine-completion-delta.json`
- `objective-revision-delta.json`

Their decompressed SHA-256 and byte lengths are checked by the same storage test.
The completion capture refuses an existing raw **or compressed** approval.
All original reader assertions and canonical fixture names remain unchanged.
