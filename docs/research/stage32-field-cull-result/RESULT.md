# J field subpath culling: actual Chrome rejection

Run 44302354144, research commit 4c4702f1c9f675f8f2495a5222047c08a885dfec. Artifact 14427226780, ZIP SHA256 `2f4abab1a97a725a2ea2ad90950468fcd77bf681fe4b67f86f2293455d543c95`.

## Verdict

Do not adopt. All four original-J/culled captures completed; source pins, camera/backing, gameplay initialization, own codec, storage isolation and positive culling checks passed. Failure is exclusively actual RGBA comparison: 13/14 observed frames differ by 1–5 RGB pixels, maximum channel difference 3; alpha differences are zero. No tolerance was introduced. This is not a camera-clamp or fixture-startup failure. The exact raster/compound-path mechanism remains unproven.

Both variants reproduce pan2 after returning in pan4 exactly, at both poses. Maximum first/cold also reproduce exactly. Nativewalk first/cold differ within both variants, so those are not claimed to be a universal A/A control; matched cross-variant comparisons still contain the recorded localized differences. See every changed pixel and original/new values in pixel-proof.json. Native backend exact evidence did not transfer to Chrome.

## Diagnostic cost, milliseconds

| Pose | Original cold | Culled cold | Original pan median | Culled pan median |
| --- | ---: | ---: | ---: | ---: |
| Maximum | 7.2 | 8.3 | 5.1 | 5.3 |
| Native walk | 8.1 | 8.7 | 5.3 | 4.8 |

Maximum selected paths were 107 initially, then 73/95 of 1777; build counter rose 2→4 after cold. Walk selected 115→106; builds 2→3. Thus bucket crossing and large path-count reduction actually occurred, without a compelling observed total-cost benefit. This four-page, five-pan experiment includes PNG/hash readbacks outside timing and is NOT a clean performance acceptance test.

Helper source increased 260,894→1,063,943 bytes. Whole-runtime script parse/eval wall was 3220→3283.9 ms maximum and 3246.2→3230.5 ms walk. These uncontrolled single-page values do not isolate helper startup cost or network startup and do not establish a parse regression or benefit.

Original J helper 6823eda0e8d3c5250396c857f09f96ee3eba8fbfba124af540d080a5a76d03c7; stub candidate 670349e76850fc325d3a4244b3f299e66f3b1a426064a70a7c67e8cb7dbb56cc. Registered J source af5b77e15accea03470fdfd0c6cb00a0bb12c5e9. Foundation source guard `2ec84007352614d3319293d8b46384842550fe87f999cbf671145444d4a1cfa7`.

No production change, release claim, broad device claim, or further full cost-suite rerun follows from this result. A small exact-output component diagnostic is the next requested step.
