# Stage7 safe exclusion: limited Chrome review
Production candidate: 178902ea81fa59e1f58d715687cf0ea9104563db, based on e8d8aa8865c832e831d6d221223356b440652e5f.
Branch: fix/stage7-exclude-rejected-skirt-20261117.
CI44166789243 completed/success. This does NOT mean all inherited contracts or final integration pass.

## Actual reviewed scope
All12 PNGs were directly inspected: public7d / rejected e8d8 / safe candidate, four views (portrait390x696 lower-left and upper-left, desktop1331x763 lower-right and upper-left), DPR1, Chrome157, seed3910, fixed time2, synthetic initial battle, original camera limits. No user storage was accessed. Four frames per view, unchanged battle/physics, no loading/CSP/runtime errors. Not public UI, normal input, mobile hardware, dynamic events, completion gameplay or performance benchmarking.

## Verdict
Accept ONLY as exclusion of newly rejected visual regression. Not an art-complete fix.
- Rejected extended columns and large opaque underlays across the entire lower camera are no longer present.
- Original art/13 footholds/arches and source geometry are preserved. Top desktop view is byte-exact to public baseline.
- The retained root-floor readability change removes the original artificial black rectangular side/bottom closure visible against sky.
- Original shorter stretched lower slab and rectangular outer cuts remain. Desktop lower-right: original BODY slab ends around screen x647,y570, with a horizontal source join near y337; right stub ends near x902. Portrait lower-left original slab ends around y404 and left stub around x126. These are NOT fixed or visually approved; they match original art, apart from scoped retained closure suppression.
- No claim that culling alone reconstructs missing geography. No new stage7 upper-tree repair was found in this diff.

## Quantitative results
Full original BODY equality:
bodyHash 992c5b15cee33be83196b78ab08e14306777b883626ff20080c3a109f38f6ec2
source symbols74aea53168168576d828b6135fa8de0d4e81b0e302aa3124e6f3e3a54fa3324e
vector9d1e11d0b4ff599203237990baf2e7c71a6b2454a11066ff0a63dd7e96419919
rootce27738a6dbfabedf72a6f412ffd4d263273da7a069b758f356998badb598295
bounds/reference bounds[-390,0,2238,1466], collision[].
Author project stage7 hash7ec52e52f4ee62d9765747e8b0b143a753c9fd5cbcc1e47ee80371fd883e1789.
Browser serialized stage hashd2e1838f167a46c0233e2911af2e951a639d4b9205c7cc2fd48a28f1d3c56c93, equal across all three variants (different build representation from author contract).
Physics5072cf3dcc49c5f2875482c7125e0c62d6176b3f2a70c1c8a50af33ff5779d6f, all variants/cameras equal.
Safe minus baseline changed pixels portrait-bl1140(max27), desktop-br4077(max66), portrait-tl871(max28), desktop-tl0(max0).
Safe minus rejected changed pixels139417,532034,59789,870 respectively. Pixel-change counts are evidence, not an art-quality score.

Passed: exact original full BODY/stage contract, baseline/current save codec/source identity and known legacy table-assertion diagnosis, actual native exact JSON save roundtrip, Act1 compatibility wrapper retaining original other assertions, snap-collapse contract, culling bounds/readability walk-rim and negative-scope checks, official build,12Chrome captures and cross-variant comparisons.
Old stage7-art-bounds exits1 at expected extended bounds assertion. Old integration-manifest exits1 at registration blob mismatch. Neither was modified nor relabeled passed.

## Final integration manifest proposal, NOT applied here
The old manifest pins48 file identities. Update only the reviewed author/registration identities after deliberate review, preserving46 other identities. Record previous SHA and the exact exclusion reason. Preserve old extension test file as historical rejected-feature evidence, but do not run it as a success-required active feature expectation in the final suite. Replace its active role with exact original BODY/stage/root/symbols/bounds/reference/collision contract plus no village-* additions/no stage7 optimizer extension entry. Retain culling/readability tests, source/physics and save checks, and unchanged stage3/other-stage detection.
Current two production blobs:
- author690f7cee80b47c4e457292e6dda674298cc5327c
- registrationsd90d0bb4412c260f333d32332b74bc536cee13b9.
If stage3 is also deliberately restored, the common author and registrations must be merged semantically. The stage7-safe-contract's current requirement that the stage3 extension registration remains must then be replaced with the reviewed original-stage3/full-other-registration preservation policy, not arbitrarily deleted. Combined candidates require new exact source contracts and Chrome rerun. Do not treat either isolated candidate as proof for combined final code.

## Evidence
Artifact14366481052,7485475 bytes, SHA256 e7444d4a4649548f979a17e8550bd145cce5e5c8fc8747a1f7165a17b3dbceec. Downloaded ZIP SHA and all CRCs verified. Actions expiry2027-02-15; not a permanent archive.
Local extracted evidence stage7-safe-review. Machine comparison.json remains visualReview:PENDING as generated; this separate human review is authoritative only for the limited exclusion scope.
No master/Pages change. Original stage7 outer-art problem remains unfinished.

### Raw reference metadata and image hashes
```text
{
  "ok": true,
  "scope": "Isolated Chrome production Scene diagnostic. Synthetic initial battle only; no user save, public UI, normal input or gameplay acceptance.",
  "stage": 7,
  "variant": "candidate",
  "view": "desktop-br",
  "width": 1331,
  "height": 763,
  "dpr": 1,
  "camera": {
    "x": 4532.24,
    "y": 3569.18,
    "scale": 0.19573529411764706
  },
  "time": 2,
  "seed": 3910,
  "runtimeSha256": "336ce17de0e1398cd73e8c5ea39e7719b9911dd225201596c0052a44edb3023d",
  "physicsSha256": "5072cf3dcc49c5f2875482c7125e0c62d6176b3f2a70c1c8a50af33ff5779d6f",
  "stageSha256": "d2e1838f167a46c0233e2911af2e951a639d4b9205c7cc2fd48a28f1d3c56c93",
  "bodySha256": "992c5b15cee33be83196b78ab08e14306777b883626ff20080c3a109f38f6ec2",
  "renderPure": true,
  "fontStatus": "loaded",
  "fontNote": "System sans-serif; document.fonts.ready awaited. Cross-backend text pixels are not an exact equality claim.",
  "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/157.0.0.0 Safari/537.36",
  "imageCount": 2,
  "pendingImages": 0,
  "imageErrors": 0,
  "storage": [],
  "errors": [],
  "violations": [],
  "pngSha256": "c98fd754c6d5d94ade326dfe4b85a81c64a4ec2abeb895a3c2aa30ec0aae9370"
}
{
  "passed": true,
  "baselineCommit": "7d238d20663c3ceffe430eb0304e01516ae625cf",
  "identicalSources": {
    "shared/runtime/profile-store.js": "3b270b6ca132a70559f1c7691d63d6d8a82ca4bfef5d06c69522c20fe6884f2c",
    "tests/act1-local-art-save.mjs": "c085bcc95df7e0a19f188bb230d1714ea00adb2a508d1ac091b0be8d02a3a112"
  },
  "results": [
    {
      "stage": 3,
      "assetPath": "web/data/chapter-03-assets.635cfc93f8306ff8.json",
      "assetIds": [
        "act1-site:3:body",
        "act1-site:3:landmarks",
        "act1-site:3:ferry",
        "act1-site:3:lantern",
        "act1-site:3:spirit-flame"
      ],
      "observations": {
        "baseline": {
{
  "stage7-candidate-portrait-bl.png": "0d5e3062386049d48b2bdf72f60eb8c4d13c69907eac3eb9df5449ea0ffa6324",
  "stage7-candidate-portrait-tl.png": "f2591cf7fd8a7508e4fcdac66e72a0cba34ccf530c2871d6f2971cffbb5ca7ed",
  "stage7-rejected-desktop-tl.png": "6956d3ffef49d8688940260b7a7e1aa5429a01d532f5ca20e0fd3a0f3223fed1",
  "stage7-baseline-desktop-tl.png": "cec2069e00f9dff9842f2d9a68f6cf37cf86f1b78cc434a1ea7cf8bdbfda66e3",
  "stage7-candidate-desktop-br.png": "c98fd754c6d5d94ade326dfe4b85a81c64a4ec2abeb895a3c2aa30ec0aae9370",
  "stage7-rejected-portrait-bl.png": "03f8896c3916a1839a3c1ea194730af14d383a7362704c3d122f3d62f014a9a1",
  "stage7-baseline-desktop-br.png": "99e3851d28b228fb75e609284c7ce47cb37bdccad530d80bb67ade9b2c5d3911",
  "stage7-baseline-portrait-bl.png": "207c33ccf920262acfe43b6d2e74faae4cbfeb663abcc9ad9e3afb6ba0805900",
  "stage7-candidate-desktop-tl.png": "cec2069e00f9dff9842f2d9a68f6cf37cf86f1b78cc434a1ea7cf8bdbfda66e3",
  "stage7-rejected-desktop-br.png": "bd9719956f25ebb0e7d050459aa74eddea419d91dc85b6d569919750e63a7ea6",
  "stage7-baseline-portrait-tl.png": "6f69aa0dde744959b1b731d943ed0efac6994262a97c244d53fb8df5a248e7b4",
  "stage7-rejected-portrait-tl.png": "658e3bcad545aef84c64f34dd3cfe8d760dc2cc16df25eb3dd5ef1a51bdb0743"
}

```
