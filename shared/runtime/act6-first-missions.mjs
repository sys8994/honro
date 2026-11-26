// Stage author rules only. It never awards, persists, mounts, changes phase,
// or replaces a shared engine method. Project proof authority is provided by
// the private, calling loader, not by campaign JSON/save/query properties.
const done=(u)=>!!u&&!!u.dead&&u.hp<=0;
const roster=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAlly);
const keys=['id','cls','hp','maxHp','focus','maxFocus','shield','level','loadout','tune','ranks','h','r','equipmentState','dead'];
const row=u=>Object.fromEntries(keys.map(k=>[k,u[k]]));
const sorted=r=>r.slice().sort((a,b)=>a.cls.localeCompare(b.cls)).map(row);
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const pfx='act6-local-objective:';
// Called only after private constructor/bootstrap verified author/map bytes.
export function createFirstMissionOwner({C,manifest,verifyMounted,fingerprint}) {
 const gates=new WeakMap(),settled=new WeakSet();
 const current=(app,e)=>{const k=gates.get(e);return k&&k.app===app&&app.engine===e&&e.b===k.b&&app.stage===k.stage&&app.stageId===k.d.id&&safe(app)&&k.checkGeometry()?k:null};
 const safe=app=>!app.debugMode&&!app.customMap&&!app.training&&!app.workshopMode&&!app.embedded;
 function mount(app,e,source){
   const d=manifest.rows[app.stageId],b=e?.b, s=app.stage;
   if(!safe(app)||!d?.authorReadyMissionCandidate||app.engine!==e||!(e instanceof C.Engine)||s?.id!==d.id||s?.act!==6||s?.actStage!==d.actStage||s?.objective!==d.objective||gates.has(e)||b?.phase!=='aim'||b.honroGrowth||b.honroJourneyReplay||!verifyMounted(app,e,source,d))return false;
   // Canonical path is deliberately not enabled here. Isolated tests identify
   // their source without allowing that origin as a standard App save.
   if(source.kind==='isolated-authored-engine'){
     if(b.mode!=='act6-isolated'||b.honroMapOrigin!=='act6-qa'||b.honroAuthoredId!==d.authoredAlias||b.honroCustom!==false)return false;
   }else if(source.kind==='normal-owned-release'){
     if(d.runtimeReleaseEnabled!==true||b.mode!=='campaign'||b.honroMapOrigin!=='campaign'||b.honroAuthoredId!=='stage-'+d.id||b.honroCanonical!==true||b.honroCustom!==false)return false;
   }else return false;
   if(b.stage!==d.id||b.honroStage!==d.id||b.stageId!==d.id||
    b.width!==d.shape.width||b.height!==d.shape.height||fingerprint(b.terrain)!==d.shape.playSHA||fingerprint(b.honroWorldTerrain)!==d.shape.worldSHA)return false;
   const r=roster(b);
   if(!eq(r.map(u=>u.cls).sort(),d.playerClasses.slice().sort())||new Set(r.map(u=>u.id)).size!==4||r.some(u=>u.dead||u.hp<=0))return false;
   if(r.some(u=>!e.grounded(u)||!C.validTerrainContactPose(b.terrain,u)))return false;
   if(d.id===52&&(!e.unit('cliff-stone')?.honroShotTarget||!e.unit('cliff-stone').fixed||e.unit('cliff-stone').loadout.length||!e.unit('bridge-keeper')))return false;
   if(d.id===52&&(!source.incoming||source.incoming.stage!==51||!source.incoming.flags?.['act6.threeSitesSighted']||!eq(sorted(r),source.incoming.actors)))return false;
   const g={app,b,stage:s,d,r,source,entered:[],ordered:[],marks:d.marks.map(m=>{
     const host=b.terrain.find(t=>t.id===m.support&&t.x<=m.x&&m.x<=t.x+t.w);
     if(!host)throw Error('author support unresolved');
     return {...m,y:C.topAt(host,m.x)};
   }),visible:false,checkGeometry:()=>fingerprint(b.terrain)===d.shape.playSHA&&fingerprint(b.honroWorldTerrain)===d.shape.worldSHA};
   gates.set(e,g);
   if(d.id===52){
     const hit=e.impact.bind(e);
     e.impact=(projectile,collision)=>{
       if(current(app,e)!==g||collision?.unit!==e.unit('cliff-stone')||!projectile||!e.b.projectiles.includes(projectile))return hit(projectile,collision);
       const target=collision.unit,before=target.hp, owner=projectile.owner;
       const value=hit(projectile,collision);
       observeDirectImpact(app,e,{owner,target:target.id,before,after:target.hp,projectile,hitUnit:target.id});
       return value;
     };
   }
   return true;
 }
 const note=(g,key,role)=>g.ordered.push({key,role,round:g.b.round});
 function observeDirectImpact(app,e,{owner,target,before,after,projectile,hitUnit}){
   const g=current(app,e);
   if(!g||g.d.id!==52||!projectile||projectile.owner!==owner||hitUnit!==target||target!=='cliff-stone'||!Number.isFinite(before)||after>=before||e.unit(target)?.hp!==after||g.visible)return false;
   const u=e.unit(owner);if(!u||u.cls!=='archer'||!g.r.includes(u)||u.dead)return false;
   g.visible=true;note(g,'archerCliffDirectImpact',u.id);return true;
 }
 function checkAll(e,g,key){
   const alive=roster(g.b);
   if(alive.length!==4||g.r.some(u=>!alive.includes(u)||u.dead||u.hp<=0||!e.grounded(u)||!C.validTerrainContactPose(g.b.terrain,u)))return false;
   if(key==='overlook')return alive.every(u=>u.x>=g.b.width*.9);
   const b=g.marks.find(m=>m.id==='bell');
   return alive.every(u=>Math.abs(u.x-b.x)<=350&&Math.abs(u.y-b.y)<=220&&e.contactSurface(u.x,u.y-4,u.y+4)?.t.id===b.support);
 }
 function validateInteraction(app,e,id){
   const g=current(app,e),reject=reason=>({ok:false,reason});
   const u=e.active;
   if(!g||e.b.phase!=='aim'||!u||!g.r.includes(u)||u.dead||!e.canAct()||!e.grounded(u))return reject('현재 차례의 지상 아군만 작업할 수 있습니다.');
   const m=g.marks[g.entered.length];
   if(!m||m.id!==id)return reject('현재 현장 목표가 아닙니다.');
   if(u.cls!==m.cls||Math.abs(u.x-m.x)>m.radius||Math.abs(u.y-m.y)>110||e.contactSurface(u.x,u.y-4,u.y+4)?.t.id!==m.support)return reject('담당 인물이 같은 지형의 작업 지점에 닿아야 합니다.');
   if(m.afterEnemy&&!done(e.unit(m.afterEnemy)))return reject('해당 현장의 위협이 남아 있습니다.');
   if(id==='cliff'&&!g.visible)return reject('설오가 실제 사격으로 지지석을 확보해야 합니다.');
   if(id==='overlook'&&(!done(e.unit('crest-champion'))||!checkAll(e,g,id)))return reject('경계암귀를 해소하고 네 사람이 관찰턱에 모여야 합니다.');
   if(id==='threshold'&&!checkAll(e,g,id))return reject('네 사람이 종터에 모여야 합니다.');
   return {ok:true,g,m,u};
 }
 function thresholdParty(app,e){
   const result=validateInteraction(app,e,'threshold');
   return result.ok&&result.g.source.kind==='normal-owned-release'&&result.g.d.id===52?result.g.r.slice():null;
 }
 function interact(app,e,id,prepare){
   const result=validateInteraction(app,e,id);
   if(!result.ok)return result;
   const {g,m,u}=result;
   if(id==='threshold'&&g.d.id===52&&g.source.kind==='normal-owned-release'&&prepare){
     const changes=prepare(g.r.slice());
     if(!changes)return {ok:false,reason:'전열 정비의 기예와 장비를 확인해 주세요.'};
     for(const {u:actor,next} of changes)Object.assign(actor,next);
   }
   g.entered.push(id);note(g,pfx+id,u.id);
   return {ok:true,label:m.label};
 }
 function project(app,e){
   const g=current(app,e);
   if(!g){const reserved=[51,52].includes(app?.stageId)||[51,52].includes(e?.b?.honroStage);return reserved?{complete:false,objectiveReady:false,summary:'확인된 스테이지 목표 소유자가 필요합니다.',targets:[],blocked:true}:null;}
   const m=g.marks[g.entered.length],complete=g.entered.length===g.marks.length;
   return {complete,objectiveReady:complete,summary:m?.label??'현장 목표 달성',targets:m?[{kind:'route',id:m.id,x:m.x,y:m.y,label:m.label,support:m.support}]:[]};
 }
 function terminal(app,e){const g=current(app,e),s=project(app,e);
   if(!g||e.b.phase!=='won'||!s?.complete||settled.has(e))return null;
   settled.add(e);return {stage:g.d.id,flags:Object.fromEntries(g.d.terminalFlags.map(k=>[k,true])),actors:sorted(roster(e.b)),events:structuredClone(g.ordered),settlement:false};
 }
 return Object.freeze({mount,project,interact,terminal,thresholdParty});
}
