(function(G){'use strict';
const S=G.HonroScene.prototype,body=S.unitBody;
S.unitBody=function(c,u,...args){if(!u.honroObjectiveTarget)return body.call(this,c,u,...args);const t=this.battle?.honroQuestTargets?.find(t=>t.id===u.id);if(!t||u.dead)return;
 // Draw the original artwork in the unit layer too, so body outlines and
 // hit flashes use the same silhouette as the visible hostile objective.
 const b=this.battle;if(b.honroNarrativeRevision===1&&!b.honroCustom){
  if(t.id==='cliff-cleat'){if(G.HonroStage5Waterfall.active(b))G.HonroStage5WaterfallArt.targetBody(c,t);else G.HonroAct1StoryArt.cleat(c,t);return;}
  if(t.id==='sodan-binding'){G.HonroAct1StoryArt.bindingBody(c,t,b.honroState?.sodanBinding?.hitCount||0,this.time||0);return;}
 }
 this.terrain(c,t);G.HonroObjectDamage?.draw(c,t,this.scale);
};
const unit=S.unit;
S.unit=function(c,u,...args){if(!u.honroObjectiveTarget)return unit.call(this,c,u,...args);if(u.dead)return;
 this.unitOutline?.(c,u);if(this.hitFlashVisible?.(u)??u.hurt>0)this.hitBody(c,u,0);else this.unitBody(c,u,0);
 const z=1/Math.max(.05,this.scale||1),width=92;c.save();c.translate(u.x,u.y-u.h-12*z);c.scale(z,z);
 c.fillStyle='#102227';c.fillRect(-width/2-2,-2,width+4,10);c.fillStyle='#c76a62';c.fillRect(-width/2,0,width*Math.max(0,u.hp/u.maxHp),6);
 c.textAlign='center';c.font='600 11px sans-serif';c.lineWidth=3;c.strokeStyle='#102227';
 for(const [text,y]of [[u.name,-19],[Math.ceil(u.hp)+' / '+Math.ceil(u.maxHp),-6]]){c.strokeText(text,0,y,220);c.fillStyle='#f1ded0';c.fillText(text,0,y,220);}
 c.restore();
};
})(globalThis);
