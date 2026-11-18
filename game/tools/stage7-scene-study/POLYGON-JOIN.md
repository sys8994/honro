# Canonical polygon join and sub-byte coverage evidence

Actual Chrome 44210346056 confirms a visible filled join: desktop close changes 3,429 pixels and removes the long gold seam. Caps, grass and painted-union tests were zero. It was not a pass: native SVG half-circle arcs versus independent Canvas full-circle arcs disagreed by one channel level at 10 close-view pixels (other views 4/1/2). The alpha-only footprint classified 23 close pixels and 5 portrait pixels as outside; these also differed by one channel level. Those failures remain recorded.

Revision 3 removes the arc representation difference. The ribbon is a nonzero union of exact segment rectangles and inscribed 32-sided polygons inside the former radius-1.6 round envelope. The native path uses M/L/Z; independent expected uses moveTo/lineTo/closePath from the same canonical coordinates, not native d. Original geometry and the declared nonwalk scope do not expand.

Join probes now replay onto opaque black and white tile backgrounds, through the actual production tile/screen compositor. Only valid opaque endpoints with per-channel white-minus-black in 0..255 and at least one below 255 demonstrate actual join coverage. An alpha-zero mask pixel can be resolved only if those probes match exactly across closure/joined/expected and the actual composite exactly equals independent expected. No RGB tolerance, rectangle exception or mask dilation.

joined-scope.json preserves strict raw errors/counts/status. joined-semantic-scope.json separately reports evidence-resolved versus unresolved scope. Exact independent composition, caps, grass, painted union, source/physics/save/movement and nonzero close-view effect remain mandatory. Art approval requires actual PNG review.
