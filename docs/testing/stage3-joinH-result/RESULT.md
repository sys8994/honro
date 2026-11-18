# Stage3joinH: outside-ROI issue resolved, strict Chrome alpha still failed

Actual44301035231 captured8Scenes. All50codec/49wholebattle, physics/camera/source purity and Scene outsideROI exact passed. Independent composited alpha then failed83 pixels, source1812.5..1833.5,y636..637.75, max absolute alpha delta51; alpha-positive pixel count232008→232009. Artifact14427205377 digest verified/downloaded safely. No global tolerance applied. This is not a save/whole-game regression and not a false empty probe.

Native librsvg/Cairo alpha had matched, but real Chrome did not. The original E solid material path was additionally clipped in H; rasterization of its existing distant curved edge changed even though authored curve coordinates were preserved. This motivates retaining exact original draw calls instead of merely equivalent geometry. Direct ground PNG retains G's smooth material improvement, but H is not released due to alpha guard.

Next Stage3joinI adds only a clipped internal original-source/material overlay and cap gaps after otherwise identical E draw calls. A focused2page Chrome ground/alpha probe plus exact-original-draw oracle precedes expensive broader reruns. Full playthrough/device performance remains separate. No master/Pages change by this worker.
