# Stage3joinG: visual improvement and exact alpha; strict outside-ROI failure

CI44299182535 captured all8 real Chrome Scenes then failed at first paired overview guard:30 outside-ROI pixel changes counted across normal and actor-free (15 corresponding locations each). This is not a missing artifact or a whole-game failure. Artifact14424249709 digest verified and safely downloaded.

Independent artifact inspection confirmed all50codec/49wholebattle exact, paired units/terrain/camera exact, source/battle purity. Native closeup and upper-shore actualPNG changes0. Actual isolated crop alpha differences0,232008 alpha-positive each,8937RGB changes. Strong positive probe is valid. This evidence was checked separately because CI's early assert prevented later checker lines running.

The15 overview outside points are in distant band edge(source x1850..1937,y645..651), channel differences1..2/255,alpha0. Original pixel locations/deltas in evidence.json. G applies a gradient shader to the entire formerly solid path; even its opaque saturated section produced small raster-edge differences. These are avoidable paint differences, not walking geometry changes. No global tolerance is introduced and no pass is asserted for this failed gate.

Direct actual ground screenshot now has a smooth material transition, no F arrow patch, and the former hard vertical join/short traces are substantially reduced. Actual overview remains visually coherent. Therefore G is a useful visual improvement, NOT a full-art retreat; it remains unaccepted pending a narrower paint shader scope. Stage3joinH restricts gradient to original interior1740..1774 and keeps solid color outside. No Stage7/32 or user save changes. Physical-phone/performance/normal playthrough acceptance remains separate.
