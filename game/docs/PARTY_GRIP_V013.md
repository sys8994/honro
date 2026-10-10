# Draw-arm order and sword grip revision 013

## Why the previous revision failed

The v012 socket test proved only that the hand and implement touched. It did not constrain their relative rotation. In the frozen ec4e9a2 runtime, Hwigyeom's palm-long-axis/blade gap was 9.17 degrees at idle, 2.11 at impact and 4.11 during follow-through. From preparation to the 75ms cut, the handle rotated approximately 97.58 degrees inside the fist. 66 of 73 release samples put the blade within 20 degrees of the palm long axis. This was an authored grip error, not merely an interpolation defect.

Seol-o's previous draw-order exception raised only rear_forearm and rear_hand; rear_upper_arm remained at z32 behind thorax z50. In ready/recovery the exception also disappeared. The anatomical right/drawing arm is the rear_* chain regardless of screen mirroring.

## Corrections

- Seol-o's entire drawing arm has an explicit base order: quiver8, torso50, neck51, bow arm55/56, bow62, right upper arm65, right forearm66, right hand67, head70. The jaw-side draw pose retains forearm71, string72, arrow73 and hand74. Thus the upper arm remains in front of torso clothing in idle, preparation, release and recovery as well as full draw.
- Hwigyeom's rig now declares a palm cross-grip axis. Sword local +X and palm cross-axis have a fixed rotational relation in every pose. The blade does not independently turn inside the fist. Wrist/palm orientation follows an authored, modest wrist bend relative to the forearm; cut and follow-through elbow targets are redesigned with it. The original square elbow at the first candidate impact was lowered into a diagonal after pixel review.
- S07's alternating cuts and body-rush pose update the arm chain and grip rotation together. Engine events, damage, physics and targeting are unchanged.
- A new explicit user request changes Hwigyeom's entire head/face/hair/gat to 95% and remaining body/costume/hands/feet to105% about the painted sole anchor [240,480]. The head scales about its translated head pivot. Sword geometry stays at100% and translates to the new palm socket. The fixed visualHeight425/game drawHeight102 remain unchanged; only presentation/UI clearance grows to avoid cropping the larger body.

## Reference interpretation

These are still photographs, not a measured motion sequence. They establish visible grip/handle/pommel relationships; they do not prescribe one forearm/blade angle for all poses.

- Choi Hyeong-guk demonstration: the lowered wrist and exposed pommel show the handle crossing the hand rather than extending its long axis. https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0002209452
- Suwon performance demonstration: the forearm and near-vertical sword are visibly separate and fingers wrap the handle. https://www.kgnews.co.kr/news/article.html?no=810677
- Suwon Cultural Foundation photograph of a raised guard: handle and pommel remain distinct from the raised forearm. https://www.imaeil.com/page/view/2014100207553033847

## Verification contracts

`tests/party-arm-layer-v013.mjs` guards the complete anatomical draw-arm chain above torso/neck independently of pose or screen facing.

`tests/hwigyeom-proportions-v013.mjs` compares the authored overlay before/after: exact .95/1.05/1.00 path transforms, original face/costume identity, unchanged actor simulation data and renderer calibration, plus1,205 pose samples for sockets, contacts and limb connectivity. Existing character-balance accepts only this explicit Hwigyeom revision's changed stature; unchanged characters retain previous strict targets.

`tests/sword-grip-v013.mjs` checks rotational as well as positional grip stability and real skill branches. A universal 90-degree forearm/blade rule is not an artistic acceptance criterion. Actual 500px Native frames and original-speed sequences must be inspected for elbow shape, handle visibility and continuous recovery. Native captures use production sources, not browser screenshots. Frozen source hashes distinguish rejected and updated candidates.
