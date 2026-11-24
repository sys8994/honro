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
export async function createStage54ChartOwner({C,domain,charts,verifyMounted,verifyIncoming,fireMissionSkill}){
 const digest=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sig(x)))),v=>v.toString(16).padStart(2,'0')).join('');
 const pages=structuredClone(charts);
 for(const [k,c] of Object.entries(pages)){
   const pin=chartPins[k]; if(!pin||c.id!==ids[k]||c.project?.activeStageId!==ids[k]||c.project.stages[0]?.metadata?.stageId!==54||
     await digest(c.terrain)!==pin[0]||await digest(c.world)!==pin[1]||c.landmarks.some(x=>x.collisionIds.length))throw Error('untrusted chart '+k);
 }
 if(Object.keys(pages).sort().join(',')!=='C,L,N'||typeof verifyMounted!=='function'||typeof verifyIncoming!=='function'||typeof fireMissionSkill!=='function')throw Error('chart ownership port unavailable');
 const owned=new WeakMap();
 const geometry=(b,k)=>sig(b.terrain)===sig(pages[k].terrain)&&sig(b.honroWorldTerrain)===sig(pages[k].world)&&b.width===pages[k].width&&b.height===pages[k].height;
 const get=(a,e)=>{const s=owned.get(e);return s&&safe(a)&&s.app===a&&a.engine===e&&s.b===e.b&&a.stage===s.stage&&a.stageId===54&&s.b.honroAuthoredId===ids.N&&s.b.units.length===1&&s.b.units[0]===s.u&&s.u.hp>0&&!s.u.dead&&(s.b.honroGrowth?.limit.total===0&&s.b.honroGrowth?.limit.combat===0)&&verifyMounted(a,e,s.ticket)?s:null;};
 const support=(e,a)=>e.contactSurface(a.x,a.y-4,a.y+4)?.t.id;
 const noTransients=b=>['projectiles','stakes','waters','fields','drafts','summons','supportHazards'].every(k=>!b[k]?.length)&&!b.volley;
 function mount(a,e,ticket){
  const b=e?.b,s=a?.stage;
  if(!safe(a)||a.engine!==e||owned.has(e)||!(e instanceof C.Engine)||s?.id!==54||s.act!==6||s.actStage!==4||s.objective!=='act6-gallery-charts'||a.stageId!==54||
    b?.phase!=='aim'||b.stageId!==54||b.honroStage!==54||b.honroAuthoredId!==ids.N||b.honroMapOrigin!=='campaign'||b.mode!=='campaign'||b.honroCustom||b.honroGrowth?.limit.total!==0||b.honroGrowth?.limit.combat!==0||b.honroJourneyReplay||
    !geometry(b,'N')||!domain.active(b)||!noTransients(b)||!verifyMounted(a,e,ticket))return false;
  const prev=verifyIncoming(a,e,ticket), u=b.units[0];
  if(b.units.length!==1||u.side!==0||u.cls!=='mage'||!e.grounded(u)||!C.validTerrainContactPose(b.terrain,u)||prev?.stage!==53||!prev.won||
      prev.flags?.['act6.innerStakeAReady']!==true||sig(row(u))!==sig(row(prev.mage??{})))return false;
  const g={ticket,app:a,stage:s,b,u,external:structuredClone(prev.external),frame:'N',order:[],pending:null,m09:null,shot:null,terminal:false,cameraEvents:[]};
  owned.set(e,g);
  const impact=e.impact.bind(e);
  e.impact=(p,h)=>{
   const valid=get(a,e)===g&&g.shot&&p?.shot===g.shot.shot&&p.owner===u.id&&p.skill==='M09'&&b.projectiles.includes(p)&&
     h?.terrain===b.terrain.find(t=>t.id==='mid-contact')&&span(h.x,g.shot.minX,g.shot.maxX);
   const before=new Set(b.stakes??[]);
   const out=impact(p,h);
   if(valid)for(const stake of b.stakes??[])if(!before.has(stake)&&stake.owner===u.id&&stake.shot===p.shot&&stake.skill==='M09'&&
    Math.abs(stake.x-h.x)<=4&&Math.abs(stake.y-h.y)<=12&&e.contactSurface(stake.x,stake.y-12,stake.y+12)?.t.id==='mid-contact'){
      g.m09={id:stake.id,shot:stake.shot,x:stake.x,y:stake.y,round:b.round};break;
   }
   return out;
  };
  return true;
 }
 function chart(a,e,id){
  const g=get(a,e),m=map[id];
  if(!g||!m||steps[g.order.length]!==id||g.frame!==m.from||g.pending||!geometry(g.b,g.frame))return response(false,'chart order/owner');
  const {u,b}=g;
  if(e.active!==u||!e.canAct()||!e.grounded(u)||!C.validTerrainContactPose(b.terrain,u)||!noTransients(b)||!span(u.x,...m.zone)||support(e,u)!==m.surface)return response(false,'same grounded chart mark');
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
  const tile={terrain:structuredClone(next.terrain),honroWorldTerrain:structuredClone(next.world),honroLandmarks:structuredClone(next.landmarks),honroElements:structuredClone(next.elements),
   honroPlayBounds:structuredClone(next.play),honroTerrainBounds:structuredClone(next.terra)};
  Object.assign(b,tile,{width:next.width,height:next.height,honroTerrainDomainVersion:1,sceneVersion:(b.sceneVersion??0)+1});
  // Coordinate re-expression only. The same actor, gravity, HP, equipment,
  // turn and velocity vector stay in the Engine; ordinary solver lands it.
  Object.assign(u,foot,{vx:v.x,vy:v.y,angle,facing:Math.sign(aim.x)||1,spawnX:spawn.x,spawnY:spawn.y,airborne:true,jumping:false,fallApexY:foot.y,moveTarget:undefined});
  g.frame=m.to;g.pending={id,frame:m.to,drop:floor.y-foot.y,expected:floor.id,actor:u.id,round:b.round};
  scene._releaseDomainTiles(); scene.manual=false;scene.x=u.x;scene.y=u.y-170;scene.focusUnit(u.id,700,false);
  g.cameraEvents.push({id,focus:u.id,frame:g.frame,sceneVersion:b.sceneVersion});
  return {ok:true,pending:true,drop:g.pending.drop};
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
 function project(a,e){
  const g=get(a,e);if(!g)return {complete:false,objectiveReady:false,blocked:true};
  const u=g.u;
  const complete=g.order.length===3&&!g.pending&&!!g.m09&&geometry(g.b,'L')&&span(u.x,2308,2324)&&span(u.y,2926,2934)&&
    e.grounded(u)&&C.validTerrainContactPose(g.b.terrain,u)&&support(e,u)==='mid-contact';
  return {complete,objectiveReady:complete,summary:complete?'처마 안쪽의 진목과 출구를 확인했습니다.':g.m09?'돌턱 안쪽 문으로 이동하세요.':g.pending?'새 받침에 발이 닿을 때까지 기다리세요.':'안내점을 따라 처마를 건너 진목을 묶으세요.',targets:[]};
 }
 function terminal(a,e){
  const g=get(a,e);if(!g||g.terminal||e.b.phase!=='won'||!project(a,e).complete)return null;
  g.terminal=true;return {stage:54,won:true,flags:{'act6.invertedGalleryCrossed':true},mage:structuredClone(g.u),external:structuredClone(g.external),
   chart:structuredClone(g.order),relay:structuredClone(g.m09),settlement:false};
 }
 function inspect(a,e){const g=get(a,e);return g&&structuredClone({frame:g.frame,pending:g.pending,chart:g.order,m09:g.m09,camera:g.cameraEvents});}
 return Object.freeze({mount,chart,observe,relay,project,terminal,inspect,releaseEnabled:false});
}
