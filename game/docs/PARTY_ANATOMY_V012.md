# Party anatomy and prop revision 012

## Scope

This revision follows the rejected motion-only 011 candidate. It changes authored vector hand/palm shapes, prop geometry, grip sockets, projected arm geometry and pose-specific draw order. Faces, costumes, palettes, world physics, damage, skill event schedules and map content are retained. Source is `tools/party-forge/anatomy.mjs`; generated SVG/JSON/runtime must be rebuilt, never patched.

- Seol-o: paired Korean-bow limb curves and tips share the grip-local frame. String endpoints follow the same flex as the limbs. The nock follows the draw palm. Full draw uses a nearly extended bow arm, a backward-facing projected draw elbow, and a visible jaw-side fist. Aim rotates the whole shoulder/elbow plane. Draw forearm/hand layers are pose-specific, not global. Airborne counterbalance keeps the free wrist outside the torso before raising, avoiding a hidden-fist pop.
- Hwigyeom: a single gently curved blade, readable spine/cutting edge, guard, exposed handle and wrist/palm break replace the sleeve-to-blade appearance. Hand angle and weapon angle are separate; preparation, extension and follow-through have different wrist relationships. S07 keeps seven actual engine cuts and alternating blade directions. Thrust, reverse strike and body-rush branches remain distinct.
- Damheo/Sodan: new palms wrap their original staff/bell grips; inverse socket correction preserves the retained prop's world position. Casting/free hands move in front of the appropriate body layer. The held talisman is bound to the palm socket. Damheo's small gourd uses a wooden color and explicit stoppered silhouette so it cannot be mistaken for a third hand.

## References and limits

These are visually inspected still references, not measured motion-capture sequences. Proposed key timing is authored animation, not historical reconstruction.

- Guy Windsor, The Medieval Longsword, print p74/PDF89, one-handed chambered versus extended grip: https://swordschool.com/wp-content/uploads/2024/05/The-Medieval-Longsword-PDF.pdf
- Gyeonggi Cultural Foundation / Bucheon Bow Museum, Kim Yun-gyeong braced Korean bow: https://ggc.ggcf.kr/p/5bfbce50fb94a32d13933936
- Korean archery full-draw cover photo: https://www.koreanarchery.org/classic/bookorder.html
- Korean bow string-tip contact: https://www.koreanarchery.org/classic/hktbstring.html
- National Palace Museum hwando, gentle blade curve (not its Western-influenced guard): https://www.gogung.go.kr/gogung/pgm/psgudMng/view.do?menuNo=800065&psgudSn=367510

## Verification

`tests/party-anatomy-review.mjs` uses Native Canvas with the production rig, assets and pose adapter. It is not a browser screenshot. Each `PARTY_ANATOMY_RUN` folder saves exact source snapshots/hashes. 520px-height panels inspect draw-arm/weapon nodes; 64/92/128px panels inspect game-scale readability. Both directions, four aim elevations, 120Hz transitions and the actual Engine.fire seven-hit chain are sampled. Automated socket/reach/visibility results do not establish visual quality.

Parent review accepted v3 full-draw geometry after rejecting the earlier raised draw elbow and V-shaped bow arm. v6 removed the later-discovered projected-elbow branch flip and airborne charge-entry depth pop. Remaining actor panels are reviewed independently before packaging. Historical failed folders are kept as evidence, never mixed into the delivered current comparison.

Character-balance still checks identity, palette, exact path IDs, timing, proportions and contacts. New weapon pivots must match explicit palm sockets. Old exact-prop-path assertions are inapplicable to the intentionally redrawn bow/blade. Exact v012 anchor budgets are Seol-o 527, Hwigyeom 485, Damheo 544, Sodan 513.

Browser execution in this cloud environment is blocked by Chromium socket EPERM. Existing unrelated base verification failures (map density hash and old asset-list migration assertion) must not be presented as party regressions or silently modified. Remote source preservation, exact bundle backup and live Pages deployment are separate outcomes.

### Fixed review runs

- `candidate-v6-0846`: 471 Native PNGs/439 sampled poses, four actors and full transitions. Found three further failures: undefined talisman palette key, pale small gourd, and landing snap.
- `v7-candidate-0849`: fixed paper color, gourd silhouette/color, rear sleeve elbow coverage and landing settle. It exposed an immediate charge restart during landing settle.
- `v8-candidate-0851`: focused 181 PNGs/168 poses with frozen production sources; previous pose is retained into charge for all actors. Direct review found no remaining entry snap in this scope. Peak sampled joint travel per 120Hz frame: Damheo 14.67, Sodan 9.15, Hwigyeom 22.25 asset units. Dynamic constraint palette assertions pass with no missing keys; the same assertion rejects v6's undefined `paper` key.
- At 64px fingers/glyphs are below reliable reading size. At 92/128px the talisman has a pale silhouette and ochre marks; no hand/weapon detachments were observed. This is a sampled visual assessment, not a proof of every possible game frame.

Build, character-balance (23 checks), party-motion, native party/actor labs and TypeScript checks pass. `game verify` still fails the pre-existing combat-density history hash reproduced on the original base. Browser/Pages visual validation remains outstanding.
