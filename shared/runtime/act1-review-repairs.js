(function(G){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
// Authored new entries only: Continue keeps its saved geography and receipts.
function author(project){
 const out={...project,stages:project.stages.map(original=>{
  const n=original.metadata?.stageId;if(![2,3,5,9].includes(n))return original;
  const s=clone(original);if(s.initialState.honroAct1ReviewRevision===1)return s;
  if(n===2){
   const source=s.terrains.find(t=>t.id==='left-descent-stone-high');
   if(!source)throw Error('Missing reviewed Stage2 descent support');
   for(const[id,dx,dy]of [['left-descent-rest-upper',-80,-250],['left-descent-rest-lower',-300,900]]){
    const base=id.endsWith('lower')?s.terrains.find(t=>t.id==='left-tree-branch-lower'):source;
    const t=clone(base);t.id=id;t.name=id;delete t.playProjection;
    t.points=t.points.map(p=>({x:p.x+dx,y:p.y+dy}));s.terrains.push(t);if(s.design.stage2LayeredRoad.collisionRoles?.supports)s.design.stage2LayeredRoad.collisionRoles.supports.push(id);
    const neck=s.design.geologyComposition?.instances?.find(v=>v.support?.terrainId===base.id);
    if(neck){const v=clone(neck);v.id='geology-'+id;v.support.terrainId=id;s.design.geologyComposition.instances.push(v);}
   }
   s.design.stage2LayeredRoad.descent=['left-high-ground','left-tree-branch-upper','left-tree-branch-middle','left-descent-rest-upper','left-descent-stone-high','left-tree-branch-lower','left-descent-stone-mid','left-descent-stone-low','left-descent-rest-lower','canyon-ground'];
   s.anchors.safeDescentUpper={x:1095,y:1281};s.anchors.safeDescentLower={x:900,y:2760};
   s.initialState.honroStage2DescentPassageRevision=1;
  }
  if(n===3){
   s.elements=s.elements.filter(e=>!['place3-stone-west','place3-stone-mud'].includes(e.id));
   const u=s.units.find(u=>u.id==='midboss-stage3'),p=G.HONRO_BALANCE.stages[2],d=G.HONRO_CORE.DIFFICULTIES.normal;
   if(!u)throw Error('Missing ferry warden');
   u.combatBaseHp*=p.midBossHits/5.5;
   u.combatBaseAttack*=p.midBossIncomingHpFraction/(.075*1.55);
   u.hp=u.maxHp=Math.round(u.combatBaseHp*d.hp);u.attack=u.combatBaseAttack*d.damage;
  }
  if(n===5){
   const t=s.terrains.find(t=>t.id==='stage5-timber-low');
   if(!t)throw Error('Missing Stage5 first timber');delete t.playProjection;
   t.points=t.points.map(p=>({...p,x:p.x-150}));
  }
  if(n===9){
   s.initialState.honroStage9InstallationRevision=1;
   s.design.gameplay={...s.design.gameplay,installation:'Keep the two courtyard receivers and optional upper routes. Clear immediate local pressure by displacement, control or defeat; never require all kills or fixed rounds.'};
  }
  s.initialState.honroAct1ReviewRevision=1;return s;
 })};return out;
}
function installation(app,m){
 const e=app.engine,b=e?.b,u=e?.active;
 if(b?.honroStage!==9||b.honroCustom||b.honroStage9InstallationRevision!==1||m?.action!=='receiver')return null;
 if(!e.grounded(u)||Math.abs(u.x-m.x)>115||Math.abs(u.y-m.y)>70)return{ok:false,reason:'받이진 터 안에 서세요'};
 const threat=e.alive(1).find(v=>!v.eaterCapturedBy&&!v.honroSubdued&&!v.stun&&v.stunnedRound!==b.round&&e.allegiance(v)===1&&Math.abs(v.y-m.y)<=120&&Math.hypot(v.x-m.x,v.y-m.y)<220);
 return threat?{ok:false,reason:'터 곁의 적을 밀쳐내거나 제압하세요'}:null;
}
// Briefly published review revision1 used a thick lower rear ledge. Turn only
// that exact added support into a pass-through cap in its live snapshots.
// Keep its geometry/art and every actor/resource/event receipt unchanged.
function restorePassage(b){
 if(b?.honroStage!==2||b.honroCustom||b.mode!=='campaign'||b.honroAct1ReviewRevision!==1||b.honroStage2DescentPassageRevision===1)return false;
 const t=b.terrain?.find(t=>t.id==='left-descent-rest-lower');
 if(!t||t.mat!=='rock'||t.oneWay)return false;
 t.oneWay=true;b.honroStage2DescentPassageRevision=1;b.sceneVersion=(b.sceneVersion||0)+1;return true;
}
G.HonroAct1ReviewRepairs={author,installation,restorePassage};
})(globalThis);
