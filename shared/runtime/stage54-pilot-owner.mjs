import {chartPins,ids} from './chart-packet.mjs';
const sig=o=>JSON.stringify(o);
const span=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b;
const safe=a=>a&&!a.debugMode&&!a.training&&!a.customMap&&!a.workshopMode&&!a.embedded;
const map={
 'N>L':{from:'N',to:'L',p:({x,y})=>({x:y,y:3200-x}),v:({x,y})=>({x:y,y:-x}),zone:[500,565],surface:'foothill',drop:110},
 'L>C':{from:'L',to:'C',p:({x,y})=>({x:y,y:3000-x}),v:({x,y})=>({x:y,y:-x}),zone:[2298,2500],surface:'mid-contact',landing:'mid-contact',drop:125},
 'C>L':{from:'C',to:'L',p:({x,y})=>({x:3000-y,y:x}),v:({x,y})=>({x:-y,y:x}),zone:[2855,2903],surface:'mid-contact',landing:'mid-contact',drop:125}
};
const steps=Object.keys(map);
const row=u=>Object.fromEntries(['id','cls','hp','maxHp','focus','maxFocus','h','r','tune','level','ranks','loadout','shield','equipmentState'].map(k=>[k,u[k]]));
const response=(ok,reason)=>({ok,...(reason?{reason}:{})});
// The native sweep returns the center of the padded projectile. Keep that
// center and the real stake, and independently identify the unpadded face.
export function verifyStage54Relay(C,sill,relay,allowLegacy=false){
 if(!sill||sill.id!=='mid-contact'||!Number.isInteger(relay?.shot)||relay.shot<1||!Number.isFinite(relay.x))return false;
 const faces=C.terrainSurfaces(sill,relay.x);
 if(!relay.impact&&!relay.support)return allowLegacy&&relay.y===2930&&faces.some(f=>f.y===relay.y&&f.slope===0);
 const {impact,support:s}=relay;
 return !!(impact&&s&&impact.x===relay.x&&impact.y===relay.y&&impact.radius===6&&
  impact.normal?.x===0&&impact.normal?.y===-1&&s.terrain===sill.id&&s.x===impact.x&&s.y===2930&&
  s.y===impact.y-impact.normal.y*impact.radius&&faces.some(f=>f.edge===s.edge&&f.y===s.y&&f.slope===0));
}
export async function createStage54ChartOwner({C,domain,charts,gallery=null,observatory=null,verifyMounted,verifyIncoming,fireMissionSkill,verifyEave=null}){
 const digest=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sig(x)))),v=>v.toString(16).padStart(2,'0')).join('');
 const pages=structuredClone(charts);
 for(const [k,c] of Object.entries(pages)){
   const pin=chartPins[k]; if(!pin||c.id!==ids[k]||c.project?.activeStageId!==ids[k]||c.project.stages[0]?.metadata?.stageId!==54||
     await digest(c.terrain)!==pin[0]||await digest(c.world)!==pin[1]||c.landmarks.some(x=>x.collisionIds.length))throw Error('untrusted chart '+k);
 }
 if(Object.keys(pages).sort().join(',')!=='C,L,N'||typeof verifyMounted!=='function'||typeof verifyIncoming!=='function'||typeof fireMissionSkill!=='function')throw Error('chart ownership port unavailable');
 const owned=new WeakMap();
 const geometry=(b,k)=>sig(b.terrain)===sig(pages[k].terrain)&&sig(b.honroWorldTerrain)===sig(pages[k].world)&&b.width===pages[k].width&&b.height===pages[k].height;
 const galleryGeometry=b=>gallery&&sig(b.terrain)===sig(gallery.terrain)&&sig(b.honroWorldTerrain)===sig(gallery.worldTerrain)&&b.width===pages.N.width&&b.height===pages.N.height;
 const get=(a,e)=>{
  const s=owned.get(e),units=e?.b.units;
  return s&&safe(a)&&s.app===a&&a.engine===e&&s.b===e.b&&a.stage===s.stage&&a.stageId===54&&s.b.honroAuthoredId===ids.N&&
    units[0]===s.u&&s.u.side===0&&s.u.cls==='mage'&&s.u.hp>0&&!s.u.dead&&
    (!s.foe||units[1]===s.foe&&s.foe.side===1)&&new Set(units.map(u=>u.id)).size===units.length&&
    units.slice(s.foe?2:1).every(u=>s.company.has(u)&&u.side===1&&!u.summoned&&!u.honroAlly)&&
    s.b.honroGrowth?.limit.total===0&&s.b.honroGrowth?.limit.combat===0&&verifyMounted(a,e,s.ticket)?s:null;
 };
 const support=(e,a)=>e.contactSurface(a.x,a.y-4,a.y+4)?.t.id;
 const noTransients=(b,localStakes)=>['projectiles','waters','fields','drafts','summons','supportHazards'].every(k=>!b[k]?.length)&&!b.volley&&
   (b.stakes??[]).every(s=>localStakes?.has(s)===true);
 function mount(a,e,ticket){
  const b=e?.b,s=a?.stage;
  if(!safe(a)||a.engine!==e||owned.has(e)||!(e instanceof C.Engine)||s?.id!==54||s.act!==6||s.actStage!==4||s.objective!=='act6-gallery-charts'||a.stageId!==54||
    b?.phase!=='aim'||b.stageId!==54||b.honroStage!==54||b.honroAuthoredId!==ids.N||b.honroMapOrigin!=='campaign'||b.mode!=='campaign'||b.honroCustom||b.honroGrowth?.limit.total!==0||b.honroGrowth?.limit.combat!==0||b.honroJourneyReplay||
    !geometry(b,'N')||!domain.active(b)||!noTransients(b)||!verifyMounted(a,e,ticket))return false;
  const prev=verifyIncoming(a,e,ticket), u=b.units[0];
  if(b.units.length!==1||u.side!==0||u.cls!=='mage'||!e.grounded(u)||!C.validTerrainContactPose(b.terrain,u)||prev?.stage!==53||!prev.won||
      prev.flags?.['act6.innerStakeAReady']!==true||sig(row(u))!==sig(row(prev.mage??{})))return false;
  const g={ticket,app:a,stage:s,b,u,external:structuredClone(prev.external),frame:'N',order:[],pending:null,m09:null,shot:null,terminal:false,
   cameraEvents:[],company:new Map(),galleryStakes:new WeakSet()};
  owned.set(e,g);
  const impact=e.impact.bind(e);
  e.impact=(p,h)=>{
   const local=g.gallery&&g.frame==='N'&&get(a,e)===g&&p?.side===0&&p.owner===u.id&&['M07','M10'].includes(p.skill)&&b.projectiles.includes(p);
   const valid=get(a,e)===g&&g.frame==='L'&&g.shot&&p?.shot===g.shot.shot&&p.owner===u.id&&p.skill==='M09'&&b.projectiles.includes(p)&&
     h?.terrain===b.terrain.find(t=>t.id==='mid-contact')&&span(h.x,g.shot.minX,g.shot.maxX);
   const supportY=valid&&h.y-(h.n?.y??0)*p.radius;
   const sill=valid&&e.contactSurface(h.x,h.y,supportY);
   const before=new Set(b.stakes??[]);
   const out=impact(p,h);
   if(local)for(const s of b.stakes??[]){
    if(!before.has(s)&&s.owner===u.id&&s.skill===p.skill&&s.shot===p.shot)g.galleryStakes.add(s);
   }
   if(sill&&sill.t===h.terrain&&sill.y===supportY&&geometry(b,'L')){
    const face=C.terrainSurfaces(sill.t,h.x).find(f=>f.y===sill.y&&f.slope===0);
    if(face)for(const stake of b.stakes??[])if(!before.has(stake)&&stake.owner===u.id&&stake.shot===p.shot&&stake.skill==='M09'){
     const proof={id:stake.id,shot:stake.shot,x:stake.x,y:stake.y,round:b.round,
      impact:{x:h.x,y:h.y,radius:p.radius,normal:{...h.n}},support:{terrain:sill.t.id,edge:face.edge,x:h.x,y:sill.y}};
     if(verifyStage54Relay(C,sill.t,proof)){g.m09=proof;break;}
    }
   }
   return out;
  };
  return true;
 }
 function chart(a,e,id){
  const g=get(a,e),m=map[id];
  if(!g||g.foe&&(!g.foe.dead||g.foe.hp!==0)||!m||steps[g.order.length]!==id||g.frame!==m.from||g.pending)return response(false,'chart order/owner');
  if(g.frame==='N'&&g.gallery){
   if(!g.observed||!galleryGeometry(g.b))return response(false,'회랑 끝 관측턱에 닿은 뒤 돌아오세요.');
  }else if(!geometry(g.b,g.frame))return response(false,'chart order/owner');
  const {u,b}=g;
  const leavesGallery=g.frame==='N'&&g.gallery;
  if(e.active!==u||!e.canAct()||!e.grounded(u)||!C.validTerrainContactPose(b.terrain,u)||
     !noTransients(b,leavesGallery?g.galleryStakes:undefined)||!span(u.x,...m.zone)||support(e,u)!==m.surface)return response(false,'same grounded chart mark');
  const scene=a.scene;
  if(!scene||typeof scene.focusUnit!=='function'||typeof scene._releaseDomainTiles!=='function')return response(false,'native camera unavailable');
  const next=pages[m.to], center=m.p({x:u.x,y:u.y-u.h/2}), foot={x:center.x,y:center.y+u.h/2};
  if(next.terrain.some(t=>!t.oneWay&&C.terrainRectIntersects(t,foot.x-u.r,foot.y-u.h,u.r*2,u.h,.1)))return response(false,'destination blocked');
  const floors=next.terrain.flatMap(t=>C.terrainSurfaces(t,foot.x).filter(v=>v.y>=foot.y).map(v=>({id:t.id,y:v.y}))).sort((a,b)=>a.y-b.y);
  const floor=floors[0];
  if(!floor||floor.y-foot.y>m.drop||m.landing&&floor.id!==m.landing)return response(false,'destination not supported');
  const v=m.v({x:u.vx,y:u.vy}), aim=m.v({x:Math.cos(u.angle*Math.PI/180),y:-Math.sin(u.angle*Math.PI/180)});
  let angle=Math.atan2(-aim.y,aim.x)*180/Math.PI;if(angle<-90)angle+=360;
  const spawn=m.p({x:u.spawnX,y:u.spawnY});
  const settledStakes=leavesGallery?(b.stakes??[]).map(({id,skill,shot})=>({id,skill,shot})):[];
  if(leavesGallery){leaveCompany(g,e,'gallery');if(settledStakes.length)b.stakes=[];}
  const tile={terrain:structuredClone(next.terrain),honroWorldTerrain:structuredClone(next.world),honroLandmarks:structuredClone(next.landmarks),honroElements:structuredClone(next.elements),
   honroPlayBounds:structuredClone(next.play),honroTerrainBounds:structuredClone(next.terra)};
  Object.assign(b,tile,{width:next.width,height:next.height,honroTerrainDomainVersion:1,sceneVersion:(b.sceneVersion??0)+1});
  // Coordinate re-expression only. The same actor, gravity, HP, equipment,
  // turn and velocity vector stay in the Engine; ordinary solver lands it.
  Object.assign(u,foot,{vx:v.x,vy:v.y,angle,facing:Math.sign(aim.x)||1,spawnX:spawn.x,spawnY:spawn.y,airborne:true,jumping:false,fallApexY:foot.y,moveTarget:undefined});
  g.frame=m.to;g.pending={id,frame:m.to,drop:floor.y-foot.y,expected:floor.id,actor:u.id,round:b.round,
   ...(settledStakes.length?{settledStakes}:{})};
  scene._releaseDomainTiles(); scene.manual=false;scene.x=u.x;scene.y=u.y-170;scene.focusUnit(u.id,700,false);
  g.cameraEvents.push({id,focus:u.id,frame:g.frame,sceneVersion:b.sceneVersion});
  return {ok:true,pending:true,drop:g.pending.drop};
 }
 function admitGuard(a,e,ticket,foe){
  const g=get(a,e);
  if(!g||g.ticket!==ticket||g.foe||g.order.length||!geometry(e.b,'N')||foe?.id!=='mumyeongsa-b-wall-guard'||foe.side!==1||
     foe.cls!=='archer'||foe.summoned||foe.honroAlly||foe.dead||foe.hp!==foe.maxHp||sig(foe.loadout)!==sig(['LA01']))return false;
  g.foe=foe;
  e.b.units.push(foe);
  return true;
 }
 function beginGallery(a,e,ticket){
  const g=get(a,e);
  if(!g||g.ticket!==ticket||g.gallery||!g.foe?.dead||!galleryGeometry(e.b)||!noTransients(e.b))return false;
  leaveCompany(g,e,'wall');
  g.gallery=true;
  return true;
 }
 function admitCompany(a,e,ticket,u,area){
  const g=get(a,e);
  if(!g||g.ticket!==ticket||u?.side!==1||u.dead||u.summoned||u.honroAlly||!u.loadout?.length||e.unit(u.id))return false;
  if(area==='wall'){
   const expected={'mumyeongsa-b-aperture-ghost':'HGS01','mumyeongsa-b-rear-shade':'HSH01','mumyeongsa-b-rear-guard':'LA01'};
   if(!g.foe||g.gallery||!geometry(e.b,'N')||u.loadout[0]!==expected[u.id])return false;
  }else if(area==='gallery'){
   if(!g.gallery||g.frame!=='N'||!galleryGeometry(e.b)||!u.id.startsWith('a6-54-')||!C.validTerrainContactPose(e.b.terrain,u))return false;
  }else return false;
  g.company.set(u,area);return true;
 }
 function leaveCompany(g,e,area){
  const removed=new Set([...g.company].filter(([,room])=>room===area).map(([u])=>u));
  for(const u of removed)g.company.delete(u);
  g.b.units=g.b.units.filter(u=>!removed.has(u));
  g.b.queue=g.b.queue.filter(id=>e.unit(id));
 }
 function observeGallery(a,e){
  const g=get(a,e),u=g?.u,q=observatory;
  if(!g?.gallery||g.observed||g.frame!=='N'||!galleryGeometry(g.b)||!q||e.active!==u||!e.canAct()||
     !span(u.x,q.x-q.halfWidth,q.x+q.halfWidth)||!e.grounded(u)||support(e,u)!==q.support||!C.validTerrainContactPose(e.b.terrain,u))return false;
  g.observed={x:u.x,y:u.y,support:q.support,actor:u.id,grounded:true,round:g.b.round};
  return true;
 }
 function observe(a,e){
  const g=get(a,e);if(!g||!g.pending||!e.grounded(g.u))return false;
  const q=g.pending;
  if(e.b.round!==q.round||e.active!==g.u||!geometry(g.b,q.frame)||!domain.active(g.b)||!C.validTerrainContactPose(g.b.terrain,g.u)||support(e,g.u)!==q.expected)return false;
  g.order.push({...q,grounded:true,x:g.u.x,y:g.u.y});g.pending=null;
  return true;
 }
 function relay(a,e,{angle,power}){
  const g=get(a,e);
  if(!g||g.pending||g.order.length!==3||g.frame!=='L'||g.m09||g.shot&&g.b.projectiles.length||e.active!==g.u||!e.canAct()||
    !e.grounded(g.u)||support(e,g.u)!=='mid-contact'||!span(g.u.x,2334,2340)||!span(angle,-90,270)||!(power>0&&power<=1))return response(false,'not at left relay');
  const {u,b}=g,minX=u.x-160,maxX=u.x-25,z=e.predict(u,C.SKILLS.M09,angle,power,undefined,true),gear=sig(row(u));
  if(z.terrain!=='mid-contact'||!span(z.x,minX,maxX))return response(false,'trajectory does not bind sill');
  const issued=fireMissionSkill(a,e,{skill:'M09',angle,power,actor:u,owner:ids.N});
  // The host's authorization cannot replace the same actor or put M09 into the kit.
  const before=JSON.parse(gear),after=row(u);
  if(!issued||g.u!==e.active||!['loadout','equipmentState','id','ranks','maxHp','h','r'].every(k=>sig(before[k])===sig(after[k]))||
      !b.projectiles.some(p=>p.owner===u.id&&p.skill==='M09'&&p.shot===b.shot))return response(false,'stock release refused');
  g.shot={shot:b.shot,minX,maxX};return {ok:true,shot:b.shot,forecast:[z.x,z.y]};
 }
 function relayExit(g,e){
  const u=g.u;
  return g.order.length===3&&!g.pending&&!!g.m09&&geometry(g.b,'L')&&span(u.x,2308,2324)&&span(u.y,2926,2934)&&
    e.grounded(u)&&C.validTerrainContactPose(g.b.terrain,u)&&support(e,u)==='mid-contact';
 }
 function enterEave(a,e,ticket){
  const g=get(a,e);
  if(!g||g.ticket!==ticket||!verifyEave||g.eaveRoom||!relayExit(g,e)||!e.canAct()||g.b.projectiles.length||g.b.volley)return false;
  g.eaveRoom=true;
  return true;
 }
 function recordEave(a,e,ticket,proof){
  const g=get(a,e);
  if(!g?.eaveRoom||g.ticket!==ticket||g.eave||!verifyEave(a,e,g.u,proof)||!e.grounded(g.u))return false;
  g.eave=structuredClone(proof);
  return true;
 }
 function project(a,e){
  const g=get(a,e);if(!g)return {complete:false,objectiveReady:false,blocked:true};
  const complete=verifyEave?!!g.eave&&verifyEave(a,e,g.u,g.eave):relayExit(g,e);
  if(g.eaveRoom)return {complete,objectiveReady:complete,summary:complete?'처마 밑 이음을 확인했습니다.':'처마 밑에 붙어 오른쪽 문턱까지 이동하세요.',targets:[]};
  const observing=g.frame==='N'&&g.gallery&&!g.observed;
  const targets=observing?[{kind:'route',id:'observatory',label:'회랑 끝 관측턱',x:observatory.x,y:C.topAt(g.b.terrain.find(t=>t.id===observatory.support),observatory.x)}]:[];
  const missed=g.shot&&!g.m09&&g.b.phase==='aim'&&!g.b.projectiles.length;
  return {complete,objectiveReady:complete,summary:complete?'처마 안쪽의 진목과 출구를 확인했습니다.':g.m09?'돌턱 안쪽 문으로 이동하세요.':g.pending?'새 받침에 발이 닿을 때까지 기다리세요.':observing?'회랑을 걸어 끝의 관측턱에 닿으세요.':missed?'진목을 이어야 하는 돌턱의 윗면을 다시 조준하세요.':'안내점을 따라 처마를 건너 진목을 묶으세요.',targets};
 }
 function terminal(a,e){
  const g=get(a,e);if(!g||g.terminal||e.b.phase!=='won'||!project(a,e).complete)return null;
  g.terminal=true;return {stage:54,won:true,flags:{'act6.invertedGalleryCrossed':true},mage:structuredClone(g.u),external:structuredClone(g.external),
   chart:structuredClone(g.order),relay:structuredClone(g.m09),...(g.eave?{eave:structuredClone(g.eave)}:{}),
   ...(g.gallery?{gallery:{observed:structuredClone(g.observed),guard:g.foe.id}}:{}),settlement:false};
 }
 function inspect(a,e){const g=get(a,e);return g&&structuredClone({frame:g.frame,pending:g.pending,chart:g.order,m09:g.m09,camera:g.cameraEvents});}
 return Object.freeze({mount,admitGuard,admitCompany,beginGallery,observeGallery,enterEave,recordEave,chart,observe,relay,project,terminal,inspect,
  readyAfterGuard:(a,e)=>{const g=get(a,e);return !!g?.foe&&g.foe.dead===true&&g.foe.hp===0&&noTransients(g.b);},releaseEnabled:false});
}
