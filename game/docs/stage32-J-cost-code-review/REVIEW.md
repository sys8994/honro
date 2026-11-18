# J remaining native cost: static attribution plan

The cull study removed over90% of offscreen field curves but did not provide a material actual cost improvement and failed strict Chrome RGBA equality. Do not adopt it or run broad repeated trials.

`counts.json` describes one complete native foundation/body pass. `material()` is called three times but its resolved field/context/matrix cache should produce only one rasterization and two hits. The original BODY executes once. The formerly expensive full BODY staging path is bypassed. Warm Path2D parsing is not a recurring cause: geometry and static correction/recipe paths are lazy cached, including across clear.

The remaining work includes16 clipped bitmap submissions, one12-fill material render, and33 newly created gradients/165 color stops plus33 recipe fills. All33 recipe faces are gradients. These are hypotheses for attribution, not equivalent units of GPU cost. Canvas calls may submit deferred work, and an apparently expensive drawImage can include prior raster flush. Do not call it texture upload cost without evidence.

Requested minimal actual original/profiled comparison: exact per-frame output and identical motion, scoped material/field, originalBODY exclusive, lower reset, gradient setup/fill, three corrections, bitmap counts and scopes. Keep timing perturbation and any readback explicit. Preserve original J and failures; wait for attribution before another structural change.
