// Authored 6-5 owner. No global, prototype, DOM, campaign-catalog or profile writes.
// observeImpact is only for a trusted native caller with its actual projectile and unit references.
export const STAGE55 = Object.freeze({
 id:55,act:6,actStage:5,previous:54,authoredAlias:'stage-55',objective:'act6-empty-bell',
 shape:Object.freeze({width:6800,height:3200,playSHA:'3bed6724fbe77d55adef1022c937a0c6943830434217a9a087ff7eb1b7be865b',worldSHA:'3bed6724fbe77d55adef1022c937a0c6943830434217a9a087ff7eb1b7be865b'}),
 playerClasses:Object.freeze(['archer','knight','occultist']),
 entry:Object.freeze({knight:[176,'west-ring-descent'],archer:[1232,'west-ring-descent'],occultist:[2688,'arrival-core-terrace']}),
 terminalFlags:Object.freeze(['act6.outerAnchorBellReady','act6.outerThreeAnchorsReady']),
 runtimeReleaseEnabled:false,
 bell:Object.freeze({x:2688,y:1700.3076923076924,support:'arrival-core-terrace',approach:84,repair:360,hitTop:1450,hitBottom:1820}),
 gate:Object.freeze({id:'draft-pressure-0',asset:'a6-empty-bell-gate',hp:480,maxHp:480,h:92,r:25,x:2112,y:1523.076923076923,skill:'HLN01',dampener:'O06'})
});
const alive=u=>u&&!u.dead&&Number.isFinite(u.hp)&&u.hp>0;
const death=u=>u?.dead===true&&u.hp===0;
const party=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAlly);
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const safe=a=>a&&!a.debugMode&&!a.customMap&&!a.training&&!a.workshopMode&&!a.embedded;
const rect=({x,y},m)=>Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-m.x)<=m.repair&&y>=m.hitTop&&y<m.hitBottom;
const bytes=x=>JSON.stringify(x);
const sha=async x=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x)))].map(n=>n.toString(16).padStart(2,'0')).join('');
const carryKeys=['id','cls','hp','maxHp','focus','maxFocus','shield','loadout','equipmentState','h','r','tune','level','ranks','dead'];
export async function createStage55EmptyBell({C,packet,verifyMounted,verifyIncoming,verifyImpact}){
 if(!C?.Engine||typeof verifyImpact!=='function'||typeof verifyMounted!=='function'||typeof verifyIncoming!=='function')throw Error('stage55 trusted host required');
 const owners=new WeakMap(),releases=new WeakMap(),hits=new WeakSet(),settled=new WeakSet();
 const D=STAGE55,playBytes=bytes(packet?.terrain),worldBytes=bytes(packet?.world);
 if(!Array.isArray(packet?.terrain)||!Array.isArray(packet?.world)||await sha(playBytes)!==D.shape.playSHA||await sha(worldBytes)!==D.shape.worldSHA)throw Error('stage55 authoritative terrain mismatch');
 const shape=b=>b?.stage===55&&b.stageId===55&&b.honroStage===55&&b.width===D.shape.width&&b.height===D.shape.height&&bytes(b.terrain)===playBytes&&bytes(b.honroWorldTerrain)===worldBytes;
 const contextOrigin=b=>b.honroCustom===false&&b.mode==='act6-isolated'&&b.honroMapOrigin==='act6-qa'&&b.honroAuthoredId===D.authoredAlias;
 function start(app,e,source){
  const b=e?.b,s=app?.stage;
  if(!safe(app)||app.engine!==e||app.stageId!==55||!(e instanceof C.Engine)||s?.id!==55||s?.act!==6||s?.actStage!==5||s?.objective!==D.objective||b?.phase!=='aim'||b.honroGrowth||b.honroJourneyReplay||owners.has(e)||!shape(b)||!contextOrigin(b)||!verifyMounted(app,e,source,D))return false;
  const carry=verifyIncoming(app,e,source,55); // returns notarized owner data, never raw message JSON
  const path=carry?.chart, m=carry?.mage;
  if(carry?.stage!==54||carry.won!==true||carry.settlement!==false||carry.flags?.['act6.invertedGalleryCrossed']!==true||!Array.isArray(path)||!eq(path.map(c=>c.id),['N>L','L>C','C>L'])||!path.every(c=>c.grounded===true&&c.actor===m?.id)||!Number.isInteger(carry.relay?.shot)||carry.relay?.y!==2930||m?.cls!=='mage'||typeof m.id!=='string'||!m.id||!alive(m))return false;
  const r=party(b),g=e.unit(D.gate.id);
  if(!eq(r.map(u=>u.cls).sort(),D.playerClasses)||new Set(r.map(x=>x.id)).size!==3||!r.every(alive)||b.units.some(v=>v.side===0&&v.cls==='mage')||b.round!==1||b.side!==0||b.active!==r.find(u=>u.cls==='knight')?.id||b.projectiles?.length||r.some(u=>u.acted))return false;
  for(const u of r){
   const row=carry.external?.[u.cls], [x,support]=D.entry[u.cls];
   if(!row||!carryKeys.every(k=>eq(u[k],row[k]))||u.x!==x||e.contactSurface(x,u.y-4,u.y+4)?.t.id!==support)return false;
  }
  if(!g||g.side!==1||g.h!==D.gate.h||g.r!==D.gate.r||g.hp!==D.gate.hp||g.maxHp!==D.gate.maxHp||g.x!==D.gate.x||Math.abs(g.y-D.gate.y)>.001||g.honroRigAsset!==D.gate.asset||!g.loadout?.includes(D.gate.skill)||!e.grounded(g)||e.contactSurface(g.x,g.y-4,g.y+4)?.t.id!==D.bell.support)return false;
  if(!r.every(v=>e.grounded(v)&&C.validTerrainContactPose(b.terrain,v)))return false;
  const k={app,e,b,s,r,g,source,carry:structuredClone(carry),status:'stable',frayedAt:null,arrived:false,aligned:false,allowMute:true,muted:false,ordered:[]};
  owners.set(e,k);note(k,'trustedInnerStakeAndReturnReceived',null);
  return true;
 }
 const get=(app,e)=>{const k=owners.get(e);return k&&k.e===e&&k.b===e.b&&k.app===app&&k.s===app.stage&&app.engine===e&&app.stageId===55&&safe(app)&&shape(k.b)&&contextOrigin(k.b)?k:null;};
 const note=(k,id,detail)=>k.ordered.push({id,round:k.b.round,detail});
 const at=(e,u,r)=>alive(u)&&e.grounded(u)&&C.validTerrainContactPose(e.b.terrain,u)&&Math.abs(u.x-D.bell.x)<=r&&Math.abs(u.y-D.bell.y)<150&&e.contactSurface(u.x,u.y-4,u.y+4)?.t.id===D.bell.support;
 function observeRelease(app,e,p){
  const k=get(app,e);
  if(!k||!p||typeof p!=='object'||releases.has(p)||!e.b.projectiles.includes(p)||!Number.isInteger(p.id)||['won','lost'].includes(k.b.phase))return false;
  const u=e.unit(p.owner);
  if((u===k.g&&alive(k.g)&&p.skill===D.gate.skill)||(k.r.includes(u)&&u.cls==='occultist'&&p.skill===D.gate.dampener&&at(e,u,140))) {
   releases.set(p,{k,u,skill:p.skill,id:p.id});
   return true;
  }
  return false;
 }
 function observeImpact(app,e,{projectile:p,hit,beforeHp,afterHp}={}){
  const k=get(app,e),l=p&&releases.get(p),u=hit?.unit;
  if(!k||l?.k!==k||l.id!==p.id||l.skill!==p.skill||l.u.id!==p.owner||hits.has(p)||!u||e.unit(u.id)!==u||!verifyImpact(app,e,p,hit,beforeHp,afterHp)||!Number.isFinite(beforeHp)||afterHp!==u.hp||afterHp>beforeHp)return false;
  hits.add(p);
  if(l.u.cls==='occultist'&&u===k.g&&alive(k.g)&&k.allowMute&&afterHp<beforeHp){
   k.allowMute=false;k.muted=true;
   note(k,'sodanDampenedLiveHoop',{projectile:p.id,target:u.id,damage:beforeHp-afterHp});
   return true;
  }
  if(l.u!==k.g||!k.r.includes(u)||!rect(hit,D.bell)||k.status==='failed'||k.status==='secured')return false;
  if(k.muted){k.muted=false;note(k,'nextActualBellImpactDampened',{projectile:p.id,target:u.id,x:hit.x,y:hit.y});return true;}
  if(k.status==='stable'){k.status='frayed';k.frayedAt=k.b.round;note(k,'bellLinkFrayedByNativeImpact',{projectile:p.id,target:u.id,x:hit.x,y:hit.y});return true;}
  if(k.status==='frayed'&&k.b.round>=k.frayedAt+2){k.status='failed';note(k,'unrepairedBellLinkCollapsed',{projectile:p.id,target:u.id});return true;}
  return false;
 }
 function interact(app,e,id){
  const k=get(app,e),a=e?.active;const reject=reason=>({ok:false,reason});
  if(!k||k.b.phase!=='aim'||!k.r.includes(a)||!alive(a)||!e.canAct()||k.status==='failed')return reject('현재 행동 가능한 담당 인물만 사용할 수 있습니다.');
  if(id==='reach-bell'&&a.cls==='knight'&&!k.arrived&&at(e,a,D.bell.approach)){
   k.arrived=true;note(k,'hwigyeomBellTerraceReached',a.id);return {ok:true};
  }
  if(id==='rebind-bell'&&a.cls==='occultist'&&k.status==='frayed'&&at(e,a,D.bell.repair)){
   const round=k.b.round;
   e.wait(); // native in-combat defend, consumes actual action; do not replace it
   if(k.b.round===round&&e.active===a&&e.canAct()&&!a.acted)return reject('방어 행동이 실제로 소비되지 않았습니다.');
   k.status='secured';note(k,'sodanGroundedBellLinkRebound',a.id);return {ok:true};
  }
  if(id==='align-bell'&&a.cls==='knight'&&k.arrived&&!k.aligned&&k.status==='secured'&&death(k.g)&&at(e,a,D.bell.approach)){
   k.aligned=true;note(k,'bellAlignedAfterGateDefeat',a.id);return {ok:true};
  }
  return reject('종터의 순서, 접지, 결속과 빈종각귀 상태를 확인하십시오.');
 }
 function project(app,e){
  const k=get(app,e);if(!k)return null;
  const r=party(k.b),failure=k.status==='failed'||!r.some(alive);
  const complete=!failure&&k.arrived&&k.aligned&&k.status==='secured'&&death(k.g);
  const mark=complete?null:(!k.arrived?'reach-bell':(k.status==='frayed'?'rebind-bell':'align-bell'));
  const label=failure?'종터 결속 붕괴':(complete?'외부 세 진목의 결속이 잡혔습니다.':(mark==='reach-bell'?'휘겸으로 빈 종터 방어선에 닿으십시오.':(mark==='rebind-bell'?'소단으로 약해진 결속을 다시 묶으십시오.':(death(k.g)?'휘겸으로 빈 받침을 정렬하십시오.':'빈종각귀의 압력을 끊으십시오.'))));
  return {complete,objectiveReady:complete,failed:failure,summary:label,targets:!failure&&mark?[{kind:'route',id:mark,x:D.bell.x,y:D.bell.y,label,support:D.bell.support}]:[],binding:k.status,optionalEnemiesRemain:k.b.units.filter(u=>u.side===1&&u!==k.g&&alive(u)).length};
 }
 const visual=(app,e)=>{const k=get(app,e);return k?{gateId:k.g.id,asset:D.gate.asset,ringIsLive:alive(k.g),thread:k.status==='frayed'&&alive(k.g),dampened:k.muted,anchor:{x:D.bell.x,y:D.bell.y}}:null;};
 function terminal(app,e){
  const k=get(app,e);if(!k||settled.has(e)||k.b.phase!=='won'||!project(app,e)?.complete)return null;
  settled.add(e);
  return {stage:55,won:true,flags:Object.fromEntries(D.terminalFlags.map(v=>[v,true])),actors:structuredClone(party(k.b)),parkedMage:structuredClone(k.carry.mage),events:structuredClone(k.ordered),settlement:false};
 }
 return Object.freeze({mount:start,project,interact,observeRelease,observeImpact,terminal,visual,releaseEnabled:false});
}
