# Terrain/monster preflight result

## Status
Technical preflight passed on **6db36f5fb3b6d733ed5523746e84fe2b632eeabe**, Actions **44166789665**. This is **not art/gameplay acceptance and not deployed**. Stage3/7 unfinished art remains; the later Stage7 exclusion and Stage32 transition are not included. master/Pages and existing user saves were not touched.

## Preserved combination
Terrain parent e8d8aa8865c832e831d6d221223356b440652e5f plus the four monster parents in tests/fixtures/terrain-monster-preflight.json. All35 monster files except the explicitly merged shared/build.mjs retain exact Git blob identities. Build retains both early placement registrations and all four terrain helpers, exactly once each. Existing tests/assertions unchanged.

## Verification
- Exact manifest identity/registration PASS.
- Stage40, middle34/35/37/38, early9/13/17/29, Act5 43/47/48 placement contracts PASS. These preserve source roles/budgets/terrain and test supports/initial body gaps; early contract also executes8 seconds settling. Not gameplay acceptance.
- Snap collapse and stage34/37/38 Native contracts PASS. Original terrain parent and combined result both changed1448/11/9 pixels respectively; changes outside each permitted edge mask0, sources unchanged. These are Native isolated numbers, not Chrome scene claims.
- Historical e89242ee published assets/current identical codec comparison PASS; legacy3/7 table assertion is explicitly still classified as expected historical failure, not changed to pass.
- Current1–16 synthetic model art/battle JSON exact roundtrip PASS, including provider-independent restore. Not browser-storage/App Continue proof, and does not cover Act4/5 snapshots.
- Official npm run build PASS;809 files, Game17379B, Workshop4011B, generated entry game.e0eb0799fd943162.html. Build outputs were not committed or deployed.

## Earlier failure and correction
Run44165930671 on0a123040 failed only stage34/37/38 at initial provider lookup assert(a). The new preflight workflow had omitted HONRO_ACT4_RELEASE=1 for app:false test loading, unlike the existing terrain workflow. Follow-up run actually checked out exact terrain parent e8d8aa88: all three fail without the opt-in, then all three pass with it. Combined tests also pass with it. Only workflow configuration/documentation changed between runs; no production/test tolerance changes. First run's other contracts, roundtrip and official build had already passed.

## Evidence and limits
Successful artifact14365044398:24721B, SHA2561fdc3ae04723a03edc6d7cc47f6cc70e72908fe72d457c21b926764455d21145; expires2027-02-15. Initial failure artifact14364484041:25232B, SHA256568fdc77392d8e6b8b493f1bb0ee09f33cd3d12e31041d8ee4b14f4b1f3bd488;15files downloaded/CRC/hash/extraction verified locally. Expiring CI artifacts are not permanent archives.

Unverified: actual combined Chrome/UI and input, physical devices, formal performance, quantitative gameplay, Act4/Act5 App save restoration, release/public UI. Original individual terrain whole-PNG expectations remain intact and were not falsely applied to a scene with changed monster positions. Later3/7/32 deltas require new scoped validation before any release.
