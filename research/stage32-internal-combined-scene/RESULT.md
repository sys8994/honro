# Constant-gray two-region actual Chrome result

CI44254636304 succeeded for commit bd7706cbab574dce428ea1c0570c37ac2fa46f8c. Artifact14405461920 ZIP SHA256 6fcf9b4842055235d5a3eeb32a9ff32f24c2302a05a15d2d3ee87b2cc1502965. Candidate coverage4138 bytes; baseline26782 helper. This is not the subsequent material-copy candidate and is not production or final-art approval.

|View|RGB changed|BODY alpha changed|Pale samples|Grass samples|
|---|---:|---:|---:|---:|
|gray-left|1361|747|0|1|
|portrait-overview|90|17|0|0|
|portrait-bottom|91|15|0|0|
|landscape-overview|269|53|0|0|
|landscape-bottom|257|47|0|0|
|desktop-walk|0|0|0|0|
|maximum|1871|5182|10|16|
|renderer-below|2504|2106|5|5|
|renderer-above|1217|2108|5|5|

All nine views: Scene alpha, transparent terrain-union alpha, BODY-alpha change outside direct declared support, Scene RGB outside binary support, old transparent terrain, other visible samples and walk samples were zero. Baseline Scene/BODY golden hashes matched. Desktop-walk has no intersection and legitimately zero effect. Two declared isolated original pale/grass components are deliberately recolored; their original contribution is not denied. Finite sample gates are not universal proofs.

Actual maximum and phone overview show central seam improvement. Upper/lower faint lines remain and motivated the separate original-material-copy candidate. Whole-Scene performance and final integration remain pending. Previous raw support failures and changed contract history are preserved.
