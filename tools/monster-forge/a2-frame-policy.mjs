// Explicit root-reviewed revision allowlist. Updating requires art/error/cost review.
export const FRAME_HASHES=Object.freeze({
  "eoduksini-attack": "e8bb297285c357fb3561dafff9a82b0690d8d0a319ba025be39682b56fd2389f",
  "eoduksini-growth1": "5224dc3883fee75a5d20d8da2013b54e4f26e98bd6187c257efac9f09b0be97c",
  "eoduksini-growth2": "1c2d02f8037f0d17abebebf827395c173f04c68bd43b60392daf702108579296",
  "eoduksini-growth3": "c3feccbdea9bd08116e01d0169e72fd6ca5a953ef495918f30c5bd50bdb4f26c",
  "eoduksini-prepare": "836558260ff553d29825e63d1596d58930562648cb1b2189d02db8d6bf6b9d3a",
  "eoduksini-recover": "4778da16f336727bd19d56294f0ee93015fbeacb8b70b4e5cd002d354e294da2",
  "eoduksini-stage1-attack": "fc11f4c85015b39b6ffe8b3f958212f3fb09f5e8a733e5b9d3caee8cd5b5ea36",
  "eoduksini-stage1-prepare": "198a190f9d8504f1194b6b5ea5d51e827ba77c69c0d4513c120dea34f59c6b52",
  "eoduksini-stage1-recover": "1f8d9f7895fc1977a6e454add97398664a54f736f3181dacf1a6ca1895524131",
  "eoduksini-stage2-attack": "7f57283418c427c0348e6ea506622ece5579dce09a3486c2b6bee3b8213349b6",
  "eoduksini-stage2-prepare": "677afb871c3b528d1f1569c4aa8d4968cb1ba3e7f72b8e132103364717356c60",
  "eoduksini-stage2-recover": "907d35045cc06265433ea6f98e405c923a526e443b3b1c277d6bb5482c85a40f",
  "munyeo-flat-idle": "f64bc8bfba4455bb8389e1b4a2edda93a2bd51a090d54522795be7eb86661d46",
  "munyeo-flat-prepare": "b8b22a858a8ae1e7188b9f8d517639193ea906c0ee5191038f3a85ac528b54fe",
  "munyeo-flat-link": "e7170b55a7305cbb2f14b7bbd1ba45641790bbabecd7a0bb990501bde3cf86c5",
  "munyeo-flat-recover": "83e8c1e1a6f4ca2b0cf16b6032346a80b5c77b1e3fb53ac27b7c3eb31d646924"
});
export const POSE_MAPS=Object.freeze({
  "eoduksini": {
    "1": {
      "idle": "eoduksini-growth1",
      "prepare": "eoduksini-stage1-prepare",
      "attack": "eoduksini-stage1-attack",
      "recover": "eoduksini-stage1-recover"
    },
    "2": {
      "idle": "eoduksini-growth2",
      "prepare": "eoduksini-stage2-prepare",
      "attack": "eoduksini-stage2-attack",
      "recover": "eoduksini-stage2-recover"
    },
    "3": {
      "idle": "eoduksini-growth3",
      "prepare": "eoduksini-prepare",
      "attack": "eoduksini-attack",
      "recover": "eoduksini-recover"
    }
  },
  "jeombokMunyeo": {
    "idle": "munyeo-flat-idle",
    "prepare": "munyeo-flat-prepare",
    "link": "munyeo-flat-link",
    "recover": "munyeo-flat-recover"
  }
});
