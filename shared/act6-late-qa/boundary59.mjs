// Give mint() only to the actual mounted 59 owner/broker callsite. Give read()
// only to the 60 host. Saving/replay/QA JSON never obtains this mint authority.
const roles=['archer','knight','occultist','mage'];
const guards=['local-07-gwakjin-return-keeper','local-07-return-guard-shield','local-07-return-guard-relay'];
const people=['곽진','박문돌','이만복'];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const fields=['id','cls','hp','maxHp','focus','maxFocus','shield','level','loadout','tune','ranks','h','r','equipmentState','equipmentIds','gearBonuses','dead','attack','armor','maxMove','walkSpeed','regen'];
const equalRows=(a,b)=>fields.every(x=>same(a[x],b[x]));
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
export function stage59Boundary({nativeScope,verifyGuard,ownerView}){
 if([nativeScope,verifyGuard,ownerView].some(f=>typeof f!=='function'))throw TypeError('59 private boundary ports required');
 const admitted=new WeakMap(), used=new WeakSet();
 function mint({app,engine:e,owner,receipt,cap,lease}){
  if(used.has(e)||admitted.has(cap)||!nativeScope(app,e,owner,lease)||app.engine!==e||app.stageId!==59||e.b.phase!=='won'||!cap||cap.stage!==59||cap.won!==true||cap.settlement!==false)return null;
  const checked=ownerView(app,e,owner,receipt,lease), g=verifyGuard(app,e,owner,lease);
  const a=checked?.witness, v=checked?.terminal, h=checked?.threat;
  if(!checked||!v||!g||!Array.isArray(v.actors)||!cap.crew||v!==receipt||v.stage!==59||v.won!==true||v.settlement!==false||!same(v.flags,cap.flags)||!Object.is(v.profile?.equipment?.runId,app.profile?.equipment?.runId)||
     !app.profile?.equipment?.runId||!hex(checked.digest)||typeof checked.endingKey!=='string'||!checked.endingKey||!a?.grounded||a.support!=='finale-cutout-near-body'||!a.anchor||a.anchor!==g?.anchor||
     a.registry!==g?.binding||!same(a.ids,guards)||!same(g?.ids,guards)||!Array.isArray(a.faces)||!same(a.faces.map(z=>z.id),guards)||
     a.faces.some(z=>z.collides!==false||z.damageable!==false||z.targetable!==false||z.addUnit!==false||z.awards!==false||!Number.isFinite(z.x)||!Number.isFinite(z.y))||
     !h||h.id!=='qa-immediate-bridge-threat'||!(h.dead===true&&h.hp===0||h.dead===false&&h.hp>0&&h.grounded&&Number.isFinite(h.distance)&&h.distance>=260)||
     !v.flags['act6.garmjinCompleted']||!v.flags['act6.finalThreatResolved'])return null;
  const bodies=e.b.units.filter(u=>u.side===0&&!u.dead&&!u.summoned&&!u.honroAlly&&!u.honroCivilian);
  if(bodies.length!==4||!roles.every(cls=>{
   const live=bodies.find(u=>u.cls===cls), t=v.actors.find(u=>u.cls===cls), p=cap.crew[cls];
   return live&&p&&t&&live.hp>0&&equalRows(live,t)&&equalRows(live,p);
  })||new Set(bodies.map(u=>u.id)).size!==4||a.actor!==cap.crew.knight.id)return null;
  const witness=freeze({actor:a.actor,anchor:a.anchor,registry:a.registry,roleIds:guards.slice(),faces:structuredClone(a.faces)});
  const names=freeze({gwakjin:{actorId:guards[0],name:people[0],event:'returnGuardAftermathWitnessed'},guardWitnesses:guards.slice(1).map((id,i)=>({actorId:id,name:people[i+1],event:'returnGuardAftermathWitnessed'}))});
  const proof=freeze({rawSHA:checked.digest,endingKey:checked.endingKey,runId:app.profile.equipment.runId,guard:witness,names});
  used.add(e);admitted.set(cap,proof);return proof;
 }
 return Object.freeze({mint,read:cap=>admitted.get(cap)??null});
}

// Shared shape for the current 59 owner API. Results from the 59 closure are
// normalized; the broker still owns an independently checked 57 registry and
// canonical digest+run key (passed via lexical closures, never via DOM).
export function readMounted59(owner,receipt,{digest,endingKey}={}){
 const edge=owner?.boundaryProof?.(receipt), v=edge?.witness, g=edge?.guardAftermath;
 if(edge?.closed!==true||!v||!g||g.seenBy!==v.id||!Array.isArray(g.poses)||
    !Number.isFinite(v.x)||!Number.isFinite(v.y)||!g.poses.every(z=>z.support===v.support))return null;
 return {terminal:receipt,digest,endingKey,threat:edge.finalThreat,witness:{
  actor:v.id,grounded:v.grounded,support:v.support,anchor:g.anchor,registry:g.source,ids:g.poses.map(z=>z.id),faces:g.poses
 }};
}
