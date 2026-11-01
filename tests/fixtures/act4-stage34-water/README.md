# Stage 34 recorded water-recovery regression

`water-pending-r2.json.xz` is the unmodified UI export from the first failed
integrated Stage 34 play attempt. Source report: `codex/act4-rc-stage34-integrated-play`
at `0c20dc18af7d98033b18ea37e6a2d585f2ec356a`,
`tools/act4-rc/STAGE34-INTEGRATED-PLAY.md`.

- Decompressed SHA-256: `ce8b9b7cbe040f012262046ee578a52a28d5eb994d684570c629d11398f2991c`
- XZ SHA-256: `ec84bc0e191ba4b14fa973a865d21ce7bda7faa69b4514ab29e70b77b3e9d744`
- Recorded knight: `(2884.3560081493406, 3937.3510581740456)`, HP 3045,
  pending `34-cave-sea`, last dry contact `(2799.9812182684745, 3440.002817259729)`.

The old recovery filter excluded every one-way surface, including the authored
shore link on which the party had actually entered the water. The remaining
solid bank in x2200–2500 is too high for the unchanged entry-height restriction.
Thus waiting could never produce an eligible landing.

The narrow repair accepts only live, unbroken, static authored one-way supports
of that recorded dry contact. It keeps the original same-side span, height,
water level, body-clearance and occupancy rules. It does not admit an arbitrary
platform, moving deck, or dynamically added collision surface.

`node tests/act4-water-entry-ledge.mjs` is a production-engine model regression,
not browser gameplay. It replays this recorded pending state, checks one 762-HP
water penalty and return to the same low shore, continued active-ally movement,
model restoration, unsafe support rejection and temporary bank occupancy.
The original browser failure and the separate successful play remain distinct.
Actual fixed-runtime browser import/recovery is still required before release.
