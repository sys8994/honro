# Native component V1 actual Chrome result

Commit5f39fe3f4bc216d0b1deead0fabb6f0afd16cd8c, CI44225531442 failure, artifact14393345419, ZIPsha256871be151e39b32b0213e71522422d36b06d889deacac39b7cf8a183e76e4726b.

All native/static/source/codec and both actual Scene captures completed. Scene815RGB pixels change, bounding box[501,422,767,519], max28, Scenealpha0, source9point protected0, road0, knownnormalgrass0, declaredcoverage/filteroutside0. Additional audit includes original1..4 and originalfixedgray:0 among7335samples. Neither finite audit is an analytic AA-contribution proof.

Strict failure: transparent original BODY alpha at(510,518)155→159 and(511,518)250→251. Scene pixels whose baseline transparentBODYalpha0 changedRGB at(508,518),(509,518),(512,519), by1channel unit. No exception is allowed. Source portApron lowerclip was absent from safe author-time coverage, so native overlay reapplied AA over an existing partially covered edge. V2 adds originalclip-derived inset, not coordinate exclusions.

Visual: lower longgreen seam region visibly improves, but original upper continuation remains. Native paint initial9calls0.1ms, wholebenchmark105calls1ms. Coldp50 baseline110.4→111.5ms; panmax88.9→63.0ms is one-run noise and NOT spike-fix evidence. No extrahelper buffer/SS/readback. Despite low cost and partial art gain, V1 rejected for alpha/background violation. Production unchanged.
