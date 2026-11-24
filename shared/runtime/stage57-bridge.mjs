// No campaign registration. Caller must supply its admitted scope explicitly.
const j=JSON.stringify, geom=ts=>ts.map(t=>({id:t.id,vertices:t.vertices,oneWay:!!t.oneWay}));
const liveA=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.dead&&u.hp>0);
const equal=(a,b)=>j(a)===j(b);
export function bindOwnedBridge({G,engine,pack,activation}={}){
 const deny=(reason)=>({accepted:false,reason});
 if(activation?.enabled!==true)return deny('feature-off');
 if(pack?.v!==1||pack.chapter!=='07'||activation.storyOwner!==pack.storyOwner||activation.integerStageKey!==57||activation.compiledAuthId!==pack.stageAuthId||activation.authoredInputSHA!==pack.pins.source07.sha256)return deny('admitted-owner-mismatch');
 const b=engine?.b;if(typeof engine?.invalidateTerrainCollisionIndex!=="function")return deny("engine-interface-mismatch");
 if(!b||b.honroAuthoredId!==pack.stageAuthId||b.honroTerrainDomainVersion!==pack.base.domainVersion||!G.HonroTerrainDomain.active(b)||!equal(b.honroPlayBounds,pack.base.playBounds)||!equal(b.honroTerrainBounds,pack.base.terrainBounds))return deny('battle-owner-mismatch');
 const ids=pack.additions.terrain.map(x=>x.id),owner=pack.additions.owner;
 if(!equal(geom(b.terrain.filter(t=>!ids.includes(t.id))),pack.base.terrain))return deny('baseline-native-geometry-mismatch');
 if(!equal(b.honroLandmarks.filter(t=>t.id!==owner.id).map(t=>t.id),pack.base.ownerIds))return deny('baseline-art-owners-mismatch');
 const data=b.honroState?.flags;
 if(!data||!b.honroWorldTerrain?.length)return deny('missing-own-story');
 function currentLive(){
  const a=liveA(b);return a.length===4&&Object.fromEntries(a.map(u=>[u.cls,u]));
 }
 function activationGuard(){
  if(!pack.required.flags.every(k=>data[k]===true))return 'missing-ordered-story-gate';
  if(b.phase!=='aim'||b.side!==0||!engine.canAct()||b.projectiles?.length)return 'not-safe-turn';
  const actors=currentLive(),r=pack.required;
  if(!actors||!['mage','archer','knight','occultist'].every(k=>actors[k]?.side===0))return 'only-four-corporeal-actors';
  const {mage}=actors;
  if(b.units.some(u=>u.id===r.oldBodyId)||mage.x!==r.startingFoot[0]||mage.y!==r.startingFoot[1])return 'not-actually-reunited';
  if(b.terrain.find(u=>u.id===r.wardId)?.broken!==false)return 'ward-broken';
  if(!Object.values(actors).every(u=>engine.grounded(u)&&Math.hypot(u.x-mage.x,u.y-mage.y)<r.reunionRadius))return 'four-not-grounded-at-original-body';
  const guard=b.units.find(u=>u.id===r.gwakId);
  if(!guard||guard.side!==2||guard.dead||!guard.fixed||!engine.grounded(guard)||Math.abs(guard.x-r.anchors.x)>r.anchors.r||engine.contactSurface(guard.x,guard.y-4,guard.y+5)?.t.id!==r.anchors.host)return 'guard-not-holding-exterior-anchor';
  if(b.units.filter(u=>u.side===1&&!u.dead).some(u=>pack.additions.terrain.some(t=>G.HONRO_CORE.terrainRectIntersects(t,u.x-u.r,u.y-u.h,2*u.r,u.h,.1))))return 'new-geometry-would-entomb-occupied-position';
  return null;
 }
 const installed=()=>({terrain:b.terrain.filter(t=>ids.includes(t.id)),world:b.honroWorldTerrain.filter(t=>ids.includes(t.id)),art:b.honroLandmarks.filter(t=>t.id===owner.id)});
 const intact=v=>equal(v.terrain,pack.additions.terrain)&&equal(v.world,pack.additions.terrain)&&equal(v.art,[owner]);
 return {accepted:true,onEvent(event){
  if(event?.type!=='act6.07.reunion-completed')return deny('unrelated-event');
  const already=installed();
  if(data[pack.required.marker])return intact(already)?{accepted:true,applied:false,reason:'already-open'}:deny('tampered-existing-mark');
  if(already.terrain.length||already.world.length||already.art.length)return deny('unowned-geometry-conflict');
  const bad=activationGuard();if(bad)return deny(bad);
  const add=structuredClone(pack.additions.terrain);b.terrain.push(...add);b.honroWorldTerrain.push(...structuredClone(add));b.honroLandmarks.push(structuredClone(owner));data[pack.required.marker]=true;
  engine.invalidateTerrainCollisionIndex();
  return {accepted:true,applied:true,ids,owner:owner.id};
 }};
}
