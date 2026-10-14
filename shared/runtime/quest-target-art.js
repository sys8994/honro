(function(G){'use strict';
const S=G.HonroScene.prototype,body=S.unitBody;
// The two hostile objectives share this body with legacy terrain saves.
// Draw inside the original record bounds; hit geometry and HP remain in data.
function fastening(c,t){
 const knot=t.id==='bier-knot-0'||t.id==='bier-knot-1',chain=t.id==='upper-chain';
 if(!knot&&!chain)return false;if(t.broken)return true;
 c.save();c.translate(t.x,t.y);c.scale(t.w/100,t.h/100);c.lineJoin='round';c.lineCap='round';
 const shape=(d,fill,stroke='#172421',width=3)=>{const p=new Path2D(d);c.fillStyle=fill;c.fill(p);if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p);}};
 if(knot){
  shape('M8 12L39 5 45 91 14 96Z','#70624a');
  shape('M47 7L88 13 94 94 51 89Z','#8b7957');
  shape('M47 7L58 10 62 90 51 89Z','#4d4e3b',null);
  shape('M8 15L18 12 22 92 14 96Z','#a49269',null);
  // Taut paired ropes wrap the load and converge on an uneven square knot.
  shape('M8 22L15 16 90 75 85 84Z','#a58e65');
  shape('M82 16L91 22 17 84 9 77Z','#b1a17b');
  shape('M38 41L53 34 66 48 56 64 37 59 32 48Z','#6c5140','#201f1b',3);
  shape('M39 44L52 40 59 49 52 57 42 54Z','#b8a27a');
  shape('M50 57L60 58 72 89 61 83Z','#9b8563');
  shape('M36 61L43 64 35 94 27 98Z','#827355');
  shape('M65 28L78 31 74 57 63 53Z','#c1b18b','#5b4b3a',1.5);
  shape('M69 34L73 35 69 40 73 47 67 49Z','#814f40',null);
 }else{
  // Dressed stone socket with an iron staple, pin and short load-bearing links.
  shape('M7 36L25 20 82 25 95 43 91 94 15 96Z','#59645b');
  shape('M7 36L25 20 82 25 72 39Z','#90917a');
  shape('M72 39L95 43 91 94 70 87Z','#303f3d');
  shape('M23 45L68 43 73 82 26 86Z','#343c36','#a2a185',2);
  c.strokeStyle='#182523';c.lineWidth=13;c.beginPath();c.moveTo(39,67);c.lineTo(37,47);c.quadraticCurveTo(38,30,50,30);c.quadraticCurveTo(64,31,62,47);c.lineTo(61,65);c.stroke();
  c.strokeStyle='#a5a68b';c.lineWidth=6;c.stroke();
  shape('M25 66L72 62 75 69 27 75Z','#96977e');
  c.strokeStyle='#182523';c.lineWidth=12;c.beginPath();c.ellipse(50,24,8,16,-.3,0,Math.PI*2);c.stroke();
  c.strokeStyle='#a3a486';c.lineWidth=5;c.stroke();
  c.strokeStyle='#263731';c.lineWidth=2;c.beginPath();c.moveTo(14,43);c.lineTo(20,80);c.stroke();
 }
 c.restore();return true;
}
const terrain=S.terrain;S.terrain=function(c,t){if(fastening(c,t))return;return terrain.call(this,c,t);};
G.HonroQuestTargetArt={fastening};
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
