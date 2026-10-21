(function(G){'use strict';
const active=b=>b?.honroStage===2&&!b.honroCustom&&b.honroStage2LayeredRevision===1;
const content=G.HonroObjectiveRevision.contentFor;G.HonroObjectiveRevision.contentFor=function(b,st){const out=content(b,st);if(!active(b))return out;return{...out,guide:b.honroMap?.stage2LayeredRoad?.guide||out.guide};};
G.HonroStage2LayeredRoad={active};
})(globalThis);
