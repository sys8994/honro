// Host-owned stage objective only. No install, gate travel, gravity, phase,
// stat or persistent mutation. Call before the first contextual cast.
const alive=u=>!!u&&!u.dead&&u.hp>0;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const inRange=(x,[a,b])=>Number.isFinite(x)&&x>=a&&x<=b;
const roster=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAlly);
const keys=['id','cls','hp','maxHp','focus','maxFocus','shield','level','loadout','tune','ranks','h','r','equipmentState','dead'];
const row=u=>Object.fromEntries(keys.map(k=>[k,u[k]]));
const surface=(e,x,y)=>e.contactSurface(x,y-4,y+4)?.t.id;
export function createInnerMissionOwner({C,manifest,verifyMounted,verifyIncoming,verifyChart}) {
 const owned=new WeakMap();
 const safe=app=>app&&!app.debugMode&&!app.customMap&&!app.training&&!app.workshopMode&&!app.embedded;
 const contact=(e,u,s)=>e.grounded(u)&&C.validTerrainContactPose(e.b.terrain,u)&&surface(e,u.x,u.y)===s;
 const scope=(app,e,g)=>g&&safe(app)&&app===g.app&&app.engine===e&&e.b===g.b&&app.stage===g.stage&&app.stageId===g.d.id&&!g.b.honroGrowth&&roster(g.b).length===1&&roster(g.b)[0]===g.actor&&alive(g.actor);
 const get=(app,e)=>scope(app,e,owned.get(e))?owned.get(e):null;
 function mount(app,e,source) {
   const b=e?.b,d=manifest[app?.stageId],s=app?.stage;
   if(!d||!safe(app)||!s||s.id!==d.id||s.act!==6||s.actStage!==d.id-50||app.engine!==e||!(e instanceof C.Engine)||owned.has(e)||!['aim','move'].includes(b.phase)||b.honroGrowth||b.honroJourneyReplay)return false;
   if(source?.kind!=='isolated-authored-engine'&&!d.allowCanonical)return false;
   if(!verifyMounted(app,e,source,d))return false;
   const incoming=verifyIncoming(app,e,source,d.id-1);
   if(!incoming||incoming.stage!==d.id-1||incoming.won!==true)return false;
   const u=roster(b)[0], external=incoming.external;
   if(roster(b).length!==1||!alive(u)||u.cls!=='mage'||!same(row(u),incoming.mage)||!external||Object.keys(external).sort().join(',')!=='archer,knight,occultist')return false;
   if(d.id===53&&!incoming.flags?.['act6.outerSitesPrepared'])return false;
   if(d.id===54&&!incoming.flags?.['act6.innerStakeAReady'])return false;
   const g={app,b,stage:s,actor:u,d,external:structuredClone(external),steps:[],hits:new Map(),stake:null,mint:false,frame:d.id===53?'hall':'N'};
   if(!verifyChart(app,e,g.frame))return false;
   owned.set(e,g);
   const hit=e.impact.bind(e);
   e.impact=(p,c)=>{
     const member=get(app,e)===g&&p?.skill==='M09'&&p.owner===u.id&&b.projectiles.includes(p)&&
       c?.terrain===b.terrain.find(t=>t.id===d.support)&&inRange(c.x,d.stakeX)&&
       (d.id===53||(g.frame==='L'&&g.steps.join('')==='N-L-L-C-C-L-'));
     const before=new Set(b.stakes??[]);
     const result=hit(p,c);
     if(member&&Number.isFinite(c.y))for(const q of b.stakes??[])if(!before.has(q)&&q.skill==='M09'&&q.owner===u.id&&q.shot===p.shot&&inRange(q.x,d.stakeX)&&Math.abs(q.x-c.x)<5&&Math.abs(q.y-c.y)<=Math.max(10,(p.r??0)+2)&&e.contactSurface(q.x,q.y-12,q.y+12)?.t.id===d.support)g.hits.set(q,{shot:q.shot,x:q.x,y:q.y,round:b.round});
     return result;
   };
   return true;
 }
 // Existing chart service executes transition; objective owns only the exact 
 // preflight plus post-change observation. No public declarative frame/pose flag.
 function observeChart(app,e,to,execute,settle=()=>true) {
   const g=get(app,e);if(!g||g.d.id!==54||typeof execute!=='function'||e.active!==g.actor||!e.canAct()||!e.grounded(g.actor)||e.b.projectiles.length)return false;
   const expected=['N>L','L>C','C>L'][g.steps.length];
   if(expected!==g.frame+'>'+to||!verifyChart(app,e,g.frame))return false;
   const u=g.actor,s=g.frame, x=u.x,y=u.y;
   if(s==='C'&&(!inRange(x,[2855,2903])||surface(e,x,y)!=='mid-contact'))return false;
   const r=e.b.round,before=row(u);
   if(!execute()?.ok||!verifyChart(app,e,to)||e.b.round!==r||!same(before,row(u))||!settle()||!e.grounded(u)||!C.validTerrainContactPose(e.b.terrain,u))return false;
   if((to==='C'||s==='C')&&surface(e,u.x,u.y)!=='mid-contact')return false;
   g.steps.push(s+'-'+to+'-');g.frame=to;return true;
 }
 function project(app,e){
  const g=get(app,e);
  if(!g)return [53,54].includes(app?.stageId)?{complete:false,objectiveReady:false,summary:'검증된 내부 목표가 없습니다.',targets:[],blocked:true}:null;
  if(!verifyChart(app,e,g.frame))return {complete:false,objectiveReady:false,summary:'현재 지형과 목적이 일치하지 않습니다.',targets:[],blocked:true};
  if(!g.stake)for(const q of e.b.stakes??[])if(g.hits.has(q)){g.stake={...g.hits.get(q)};break;}
  const u=g.actor,d=g.d;
  const complete=!!g.stake&&inRange(u.x,d.exitX)&&inRange(u.y,d.exitY)&&contact(e,u,d.support)&&(d.id===53||g.steps.join('')==='N-L-L-C-C-L-');
  return {complete,objectiveReady:complete,summary:complete?'진목과 실제 출구를 확인했습니다.':g.stake?'실제 받침을 따라 출구로 이동하세요.':'담허의 진목을 지정 받침에 설치하세요.',targets:[]};
 }
 function terminal(app,e){
  const g=get(app,e);if(!g||g.mint||e.b.phase!=='won'||!project(app,e)?.complete)return null;
  g.mint=true;
  return {stage:g.d.id,won:true,flags:{[g.d.missionFlag]:true},mage:row(g.actor),external:structuredClone(g.external),stake:structuredClone(g.stake),frames:[...g.steps],settlement:false};
 }
 return {mount,observeChart,project,terminal};
}
