# Source-subpath spatial oracle study

Original absolute M...z strings, order, winding/fill rules and holes retained. A64x32 source-coordinate cell uses only whole original subpaths whose control hull intersects the cell plus.01margin. Each included subpath is copied verbatim; no flattening, Boolean reconstruction or point-grid reduction. 128entry/2MiB retained input UTF16-string LRU, clear empties it. This is NOT measured Path2D/JS heap memory.

Native verification:282,532 full-path plus282,532 gray queries across4transforms, difference0. Synthetic9000 topmost/gray queries also label difference0; fullPath2165–2240ms, subset cold1179–1459ms. These are not Scene speed claims.

Chrome fixture compares every actually executed shortcut containment against original full Path2D during initial scene capture, both full and gray. Checks are off for viewport-asserted benchmark. Original safe-band PNG remains exact golden. Native clear contract now additionally asserts spatialcache0entries/0inputbytes. No original paths or pixel tolerance changed. Research only; visual/actual performance approval still required.
