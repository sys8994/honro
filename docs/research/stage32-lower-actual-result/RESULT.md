# Lower two-buffer actual result: art rejected despite structural pass

Run44273701126, research c28206d11d2ee8e6e11e82d09772f96f612b58d2, artifact14413781668 digest15afe9e2f2ba0f3448a81b70cfb1bcdf6f777115a7b3349a987e3b965c127d84. Candidate bdb9b668db628cf1c74f51dc4d8c8fdb6d388ca732db208caf63b01541b26e5a. All8 actual Chrome captures completed. Product/master/Pages unchanged.

Cached gray-left and native-walk exact; upper rows, exterior/alpha, roads and full-coverage role tags exact. Maximum227 scene pixels changed(max8), renderer-above1576(max23). Candidate gradient is positively applied in a same-CTM direct transparent terrain redraw after Scene capture, not instrumentation of the original Scene pass itself.

Independent actual before/after visual inspection REJECTED the candidate. Renderer-above contains newly emphasized yellow-green curls in lower brown material and diagonal/horizontal traces over lower gray. Curl ROI x915..994,y600..659 has127 changed pixels,max9; pixel945,647 changesRGB108,92,76 to112,101,71. Right ROI x1120..1329,y630..729 has502 changed pixels,max19; pixel1194,700 changes126,128,129 to126,128,110. Thus partial visible-tag changes cannot be waved through as harmless numerical tolerance. Structural CI success is not visual quality acceptance.

Post-overlay uses coverage again in its blend opacity, consistent with residual alpha*g*(1-alpha)*(originalColor-background). The new model must correct composition order rather than merely relax thresholds or strengthen a mask. No clean performance/rAF acceptance test was activated for this rejected candidate. A completed lower target in original path order plus bounded gradient blend is under investigation only.
