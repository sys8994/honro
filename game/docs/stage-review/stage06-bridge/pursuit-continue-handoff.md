# R7 pursuit save Continue handoff

This is QA only. It has not been executed yet and must run against the deployment owner's final Stage40+Stage6 integrated served build. Do not start another complete battle, rebuild an old runtime, modify master, or use it as a Stage31 gate replacement.

- Script: `tools/stage6-prototype/pursuit-save-continue.py`
- Script SHA256: `1ee1d90cf235ef9cb4253121ba0ac8a2f41a67b4abd691af3c5bf961a2666968`
- Original checkpoint: artifact13279038512 from run41735897152, product6af62950ed67d19cc589962f75e5819d171c8474.
- Artifact ZIP SHA256: `d262e3dff2e305a9ec44e9e9c010169a4ace3b17816144810ef330332725cb6e`.
- Archive member: `integrated-play/natural-pursuit-entry-save.json.gz`.
- Compressed checkpoint SHA256: `19f9cbe6c839b02fcf50b1ad952835f8498efb343c054b51835be9aca2ed61ab`.
- Existing local copy: `/tmp/stage6-balanced-pursuit/integrated-play/natural-pursuit-entry-save.json.gz`.

Use the existing Playwright1.58 Chromium environment and already-built final candidate server. Set `GITHUB_SHA` to its exact head, `HONRO_REVIEW_URL` to the served HONRO.html, and `STAGE6_PURSUIT_SAVE` to the original extracted checkpoint. Example after verification of inputs:

```sh
GITHUB_SHA=FINAL_INTEGRATED_HEAD \
HONRO_REVIEW_URL=http://127.0.0.1:8870/HONRO.html \
STAGE6_PURSUIT_SAVE=/tmp/stage6-balanced-pursuit/integrated-play/natural-pursuit-entry-save.json.gz \
python tools/stage6-prototype/pursuit-save-continue.py
```

The script verifies exact source-save bytes; loads them only into a fresh browser profile; clicks UI Continue; allows the already-started R7 enemy turn to finish naturally; checks event93/94 identity, once flag, birth/target/support tags, current art coverage, and no leftover warning/duplicate wave; presses the ordinary defend key once; saves through the normal App persistence API; reloads and clicks UI Continue again. Live actors, battle state, camera and enemy outcomes are not assigned. It records normal damage/position changes rather than requiring identical poses or HP.

Output defaults to `_local/reports/stage6-pursuit-continue/`: result.json, three screenshots and resaved-profile.json.gz. Set `STAGE6_PURSUIT_REVIEW_OUT` if needed. Failure/incompletion must remain recorded. Save/Continue compatibility is the only scope, not a new victory, round, all-survivor, mobile FPS or fun gate. The expected pursuit has2 existing hounds; original front wave2, revision4, max population22 and victory rules are not modified.
