# Stage32 latest verified viewport results

Runtime f94395bf, fixture a4cebed1, CI44193568718 succeeded, artifact14376399879. Actual canvas and CSS dimensions1331x763 are asserted after every Scene construction. Earlier off-DOM1x1 timing reports are invalid for that viewport and superseded.

Same-job cold p50: lower baseline129.7ms vs candidate674.7ms; left85.7 vs348.7ms. Cold maxima134/700.8 and89.2/380.5ms. Pan maxima29/168.2 and49.1/213ms. These are isolated synchronous desktop CI Scene measurements, not phone FPS. Performance remains NOT release-ready.

Frozen13d and prior point-query PNGs both reproduced exactly. New start-band changes stay inside declared nonwalk area; source/battle/alpha protections passed. Matrix84e213c4/CI44192876404: all five actual Chrome views had0 protected<=1380 changes and0 alpha changes; prior portrait-bottom31-pixel issue is resolved without relaxing that gate. Matrix whole CI remains failure because legacy4-buffer Native contract still fails at7; separate same-helper current and historical Native contracts pass in44193568718. Full art pass not granted: fine pale traces remain.

Next conservative oracle bounding candidate2c067d78 only skips paths whose entire original control-point hull is outside query plus.01 margin. Original curves, grid, masks and boundary oracle threshold unchanged. A new exact safe-band PNG check supplements prior frozen references. No release/master/Pages changes.
