(function(G){'use strict';
const S=G.HonroScene.prototype,body=S.unitBody;
S.unitBody=function(c,u,...args){if(!u.honroObjectiveTarget)return body.call(this,c,u,...args);const t=this.battle?.honroQuestTargets?.find(t=>t.id===u.id);if(!t||u.dead)return;
 // Existing stage-specific art (waterfall wood / Sodan binding) is drawn by its
 // story layer; its terrain renderer already knows when to omit the old shape.
 this.terrain(c,t);G.HonroObjectDamage?.draw(c,t,this.scale);
};
})(globalThis);
