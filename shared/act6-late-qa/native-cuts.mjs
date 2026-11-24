// Runtime-only ESM, shared App and live battle are read-only.
// Offline artwork is never accepted as one of the three native cuts.
import {gateShadow} from './gateway.mjs';
import {gateMasonry} from './gate-masonry.mjs';
const CUTS=new Set(['last-souls','bridge-record','later-return']);
const FLAGS=['act6.lastSoulsGuided','act6.endingStarted'];
const CORE=['id','cls','h','r','hp','maxHp','focus','maxFocus','shield','level','loadout','tune','equipmentState','dead'];
const matches=(actor,received)=>received&&CORE.filter(k=>k!=='tune').every(k=>same(actor[k],received[k]))&&(!Object.hasOwn(received,'tune')||same(received.tune,actor.tune));
const roles=['archer','knight','occultist','mage'];
const js=JSON.stringify, same=(a,b)=>js(a)===js(b), row=u=>Object.fromEntries(CORE.map(k=>[k,u[k]]));
const feet=u=>[u.x,u.y];
const healthy=u=>u&&u.hp>0&&!u.dead;
const area=(W,H)=>Number.isFinite(W)&&W>=64&&W<=4096&&Number.isFinite(H)&&H>=64&&H<=4096;
function sample(canvas){
 const ctx=canvas.getContext('2d');if(!ctx||!area(canvas.width,canvas.height))return null;
 const tokens=[];let color=0;const bins=new Set();
 for(const fy of [.09,.18,.27,.36,.45,.54,.63,.72,.81,.9])for(const fx of [.08,.24,.4,.56,.72,.88]){
  const p=ctx.getImageData(Math.floor(canvas.width*fx),Math.floor(canvas.height*fy),1,1).data;
  bins.add((p[0]>>3)*1024+(p[1]>>3)*32+(p[2]>>3));color+=p[3]>0;
  tokens.push(p[0],p[1],p[2],p[3]);
 }
 return color>=50&&bins.size>=7?tokens.join('.'):null;
}
const bodies=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAlly&&!u.honroCivilian);
const terrainSeal=b=>js([b.terrain,b.honroWorldTerrain,b.honroPlayBounds,b.honroTerrainBounds]);
const witnesses=b=>js([b.units,b.phase,b.side,b.shot,b.teamEnds,b.honroState,b.honroLandmarks]);
const boundedFrame=(w,f)=>new Promise(resolve=>w.requestAnimationFrame(()=>resolve(f?.())));
const realTick=1/120;
function composedCamera(scene,frame,portrait,W,H,gate,replay){
 const party=frame.p.map(feet), living=scene==='last-souls'?frame.s.map(feet):scene==='bridge-record'?party:[replay.framedFeet,gate];
 const span=Math.max(...living.map(v=>v[0]))-Math.min(...living.map(v=>v[0]));
 const zoom=scene==='last-souls'?(portrait?Math.min(1.12,W/254):1.40):scene==='bridge-record'?
  (portrait?Math.min(1.17,W/(span+122)):1.33):(portrait?Math.min(1.00,W/382):Math.min(1.45,H/580));
 const mx=(Math.max(...living.map(v=>v[0]))+Math.min(...living.map(v=>v[0])))*.5;
 const y0=scene==='later-return'?replay.framedFeet[1]:(Math.max(...living.map(v=>v[1]))+Math.min(...living.map(v=>v[1])))*.5;
 const x=scene==='last-souls'?mx+W*(portrait?.065:.115)/zoom:scene==='bridge-record'?mx+(portrait?6:28):gate[0]+(portrait?-4:-44);
 const lower=scene==='later-return'?(portrait?.16:.19):scene==='bridge-record'?(portrait?.12:.095):(portrait?.095:.12);
 return {x,y:y0-H*lower/zoom,scale:zoom};
}
function warmGate(gate){
 // Change only the color of already validated visual surfaces (no new walls).
 const tone=new Map([['#2c2728','#322926'],['#66534e','#705448'],['#4f423e','#503a30'],['#68564e','#745746'],['#433c39','#534036'],
  ['#565b60','#595958'],['#393230','#443530'],['#6e5750','#745b4f'],['#99918a','#a29889']]);
 for(const v of gate.asset.visual)if(tone.has(v.fill))v.fill=tone.get(v.fill);
 return gate;
}
function applyQuietPigment(node,sc,data,scene,portrait){
 const c=node.getContext('2d'), W=node.width,H=node.height, box=node.getBoundingClientRect(), rx=W/box.width,ry=H/box.height;
 if(!c||!(rx>0)||!(ry>0))return;
 const gate=data.geo.gate, a=scene==='last-souls'?data.s[0].x:gate[0]-102, t=data.b.terrain.find(v=>v.id===data.geo.floor);
 if(!t)return;
 const shade=scene==='later-return'?1.18:scene==='bridge-record'?.98:.77;
 const pos=(x,y)=>[(box.width/2+(x-sc.x)*sc.scale)*rx,(box.height/2+(y-sc.y)*sc.scale)*ry];
 c.save();c.setTransform(1,0,0,1,0,0);
 // Dawn light is a thin side-light, not a rectangular warm tint. Keep black
 // shadows and the cool rock faces; haze on the lower split stays subtle.
 const warm=c.createRadialGradient(W*.91,H*.31,W*.01,W*.91,H*.31,Math.max(W*.76,H*.84));
 warm.addColorStop(0,'rgba(235,191,145,'+(.20*shade)+')');warm.addColorStop(.44,'rgba(218,171,139,'+(.078*shade)+')');warm.addColorStop(1,'rgba(215,171,135,0)');
 c.fillStyle=warm;c.fillRect(0,0,W,H);
 const cool=c.createRadialGradient(W*.14,H*.24,0,W*.14,H*.24,Math.max(W*.56,H*.43));
 cool.addColorStop(0,'rgba(128,154,169,.14)');cool.addColorStop(.68,'rgba(118,140,149,.041)');cool.addColorStop(1,'rgba(118,140,149,0)');
 c.fillStyle=cool;c.fillRect(0,0,W,H);
 // Slate plates are part of the same solid face: contiguous with the foot
 // slope at depth, not isolated silhouettes or an invented walkable surface.
 const patches=[[-238,56,35],[-166,26,23],[-129,10,45],[-59,40,62],[16,13,45],[78,35,39],[153,17,52],[196,49,31]];
 const pos2=(x,dy)=>Number.isFinite(data.core.topAt(t,x))&&x>=t.x&&x<=t.x+t.w?pos(x,data.core.topAt(t,x)+dy):null;
 const patch=(dye,points)=>{
  const poly=points.map(([x,y])=>pos2(x,y));
  if(poly.some(v=>!v))return;
  c.beginPath();poly.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=dye;c.fill();
 };
 patches.forEach(([dx,d,l],i)=>{
  const x=a+dx, fade=(i%3===0?.20:.125)*shade;
  patch('rgba(21,38,51,'+fade+')',[[x,d+8],[x+l*.7,d-1],[x+l+18,d+5],[x+l*.56,d+23],[x-7,d+16]]);
  patch('rgba(148,162,165,'+(.08*shade)+')',[[x+l*.22,d+1],[x+l*.7,d-1],[x+l+18,d+5],[x+l*.93,d+8],[x+l*.49,d+6]]);
  if(i%3!==1)patch('rgba(209,173,133,'+(.20*shade)+')',[[x+l*.21,d+1],[x+l*.58,d-1],[x+l*.45,d+2],[x+l*.13,d+4]]);
 });
 c.restore();
}
export function createNativeEndingCuts({G,authorize,outcomeFor,liveCanvas,drawLive,geometryFor,configureScene=()=>true}){
 if(!G?.HONRO_CORE||typeof G?.HonroScene!=='function'||[authorize,outcomeFor,liveCanvas,drawLive,geometryFor,configureScene].some(x=>typeof x!=='function'))throw TypeError('Native Stage60 ports missing');
 const C=G.HONRO_CORE, tickets=new WeakMap(), forkFrames=new WeakMap();
 const live=(app,e,proof)=>app?.stageId===60&&app.engine===e&&e.b?.phase==='won'&&!app.customMap&&!app.debugMode&&!app.endingGallery&&authorize(app,e,proof);
 function validate(app,e,proof){
  if(!live(app,e,proof)||e.b.projectiles?.length)return null;
  const b=e.b, cert=outcomeFor(app,e,proof), geo=geometryFor(app,e,proof);
  if(cert?.stage!==60||cert.won!==true||cert.settlement!==false||!FLAGS.every(k=>cert.flags?.[k]===true)||cert.actors?.length!==4||
    !geo||!Array.isArray(geo.souls)||geo.souls.length!==2||!Array.isArray(geo.gate)||!geo.gate.every(Number.isFinite))return null;
  const p=bodies(b), support=u=>e.contactSurface(u.x,u.y-3,u.y+4)?.t.id;
  if(p.length!==4||new Set(p.map(u=>u.id)).size!==4||!roles.every(cls=>p.filter(u=>u.cls===cls).length===1)||
    p.some(u=>!healthy(u)||!e.grounded(u)||!C.validTerrainContactPose(b.terrain,u)||Math.abs(u.x-geo.gate[0])>=182||Math.abs(u.y-geo.gate[1])>=150||
     !matches(u,cert.actors.find(v=>v.id===u.id))))return null;
  const s=geo.souls.map(v=>b.units.find(u=>u.id===v.id));
  if(new Set(s).size!==2||s.some((u,i)=>!healthy(u)||u.side!==2||u.loadout.length!==0||!e.grounded(u)||support(u)!==geo.floor||
    !Number.isFinite(geo.souls[i].from)||!Number.isFinite(geo.souls[i].to)||u.x-geo.souls[i].from<=300||u.x<geo.souls[i].to-9))return null;
  return {b,p,s,geo,cert,geometry:terrainSeal(b)};
 }
 function laterFork(data,e){
  const stored=forkFrames.get(data.b);
  if(stored?.cert===data.cert)return stored;
  const b=structuredClone(data.b), gate=data.geo.gate, actor=b.units.find(u=>u.id===data.p.find(v=>v.cls==='mage').id);
  const start=feet(actor), sig=js(row(actor)), geom=terrainSeal(b), originalShot=b.shot;
  b.units=[actor];b.active=actor.id;b.queue=[actor.id];b.side=0;b.phase='aim';b.projectiles=[];
  Object.assign(actor,{acted:false,moveLeft:actor.maxMove});
  const f=new C.Engine(b,()=>{},false);
  Object.defineProperty(f,'stage',{get:()=>({...e.stage,id:0,region:0,local:0,wind:[0],objective:'authored',victoryRule:{kind:'scripted',target:'epilogue-owner-never-set'}})});
  // Only a disposable presentation battle may be advanced.
  if(!f.canAct()||!f.grounded(actor))return null;
  let steps=0,turned=false,passed=null,framed=null;
  while(actor.x<gate[0]+48&&steps++<150&&f.canAct()){f.move(1,realTick);f.tick(realTick);}
  if(actor.x>=gate[0]+42)turned=true;
  let walked=0;
  while(actor.x>gate[0]-245&&walked++<420&&f.canAct()){
   const x=actor.x;f.move(-1,realTick);f.tick(realTick);
   if(!passed&&x>=gate[0]&&actor.x<gate[0]&&f.grounded(actor))passed=feet(actor);
   if(!framed&&actor.x<gate[0]-88&&f.grounded(actor))framed=structuredClone(b);
  }
  if(!turned||!passed||!framed||actor.x>gate[0]-242||!f.grounded(actor)||sig!==js(row(actor))||terrainSeal(b)!==geom||b.shot!==originalShot||b.projectiles.length!==0)return null;
  framed.phase='won';
  const witness=Object.freeze({cert:data.cert,sourceActor:actor.id,geometry:geom,start,passed,end:feet(actor),walked,
    framedFeet:feet(framed.units[0]),state:framed});
  forkFrames.set(data.b,witness);return witness;
 }
 async function renderNative(app,e,proof,scene,size,{signal}={}){
  if(!CUTS.has(scene)||!area(size?.w,size?.h)||signal?.aborted||!live(app,e,proof))return null;
  const canvas=liveCanvas(app,e,proof), doc=canvas?.ownerDocument, win=doc?.defaultView;
  // Require actual currently mounted native canvas. The private renderer never
  // alters its dimensions, replaces it, or uses its pixels to fabricate a cut.
  if(canvas?.id!=='battlecanvas'||canvas.tagName!=='CANVAS'||!canvas.isConnected||!win||doc.getElementById('battlecanvas')!==canvas)return null;
  await boundedFrame(win);
  const frame=validate(app,e,proof);if(!frame||signal?.aborted)return null;
  const before=witnesses(e.b), previous=e.b;
  let nativePixels=null;
  try{
   const drew=await drawLive(app,e,proof,canvas);
   if(drew!==true||!live(app,e,proof)||e.b!==previous||witnesses(e.b)!==before||terrainSeal(e.b)!==frame.geometry)return null;
   nativePixels=sample(canvas);if(!nativePixels)return null;
  }catch{return null;}
  const replay=scene==='later-return'?laterFork(frame,e):null;
  if(scene==='later-return'&&!replay)return null;
  const b=structuredClone(replay?.state??frame.b), cfg=frame.geo.gate;
  if(replay){
   const g=gateShadow(b,cfg,C.topAt);
   if(!g||g.collisionIds.length||g.asset.collision.length||g.clearance.minOverheadFromDeck<=96)return null;
   b.honroLandmarks=b.honroLandmarks.filter(v=>v.id!=='act6-10-main-gate-footings-r1');b.honroLandmarks.push(warmGate(g));
  }else if(scene==='bridge-record'&&!b.honroLandmarks.some(v=>v.id==='act6-10-main-gate-footings-r1')){
   const masonry=gateMasonry(b,cfg,C.topAt);
   if(masonry.collisionIds.length||masonry.asset.collision.length)return null;
   b.honroLandmarks.push(warmGate(masonry));
  }
  const portrait=size.w/size.h<.95,node=doc.createElement('canvas');
  node.width=size.w;node.height=size.h;node.style.width=size.w+'px';node.style.height=size.h+'px';node.style.maxWidth='100%';node.style.maxHeight='100%';
  node.className='honro-ending-60-native';
  const fork=new C.Engine(b,()=>{},false);
  Object.defineProperty(fork,'stage',{get:()=>e.stage});fork.noncombatWalk=()=>true;
  const sc=new G.HonroScene(node);
  const camera=composedCamera(scene,frame,portrait,size.w,size.h,cfg,replay);
  Object.assign(sc,{...camera,manual:true,time:2,editorView:false,storyFrozen:true,viewOptions:{debugTerrainOutline:false}});
  const counts={arrow:0,tactical:0,unit:0,body:0}, painted=new Set();
  for(const [name,k] of [['activeMarker','arrow'],['tacticalUnitMarkers','tactical'],['unit','unit'],['unitBody','body']]){
   const original=sc[name];if(typeof original!=='function')return null;sc[name]=function(...args){counts[k]++;if(k==='body'&&args[1]?.id)painted.add(args[1].id);return original.call(this,...args);};
  }
  const snap=witnesses(b), geom=terrainSeal(b);
  try{
   if(await configureScene(app,e,proof,{scene,portrait,view:sc,fork,canvas:node,signal})!==true||signal?.aborted||!live(app,e,proof))return null;
   // Real HonroScene.size observes the Canvas CSS box rather than width
   // attributes. Temporarily stage it off-screen; nothing gets focused or
   // reparented until the ending DOM mount receives the completed surface.
   Object.assign(node.style,{position:'fixed',left:'-20000px',top:'0',visibility:'hidden',pointerEvents:'none'});
   doc.body.append(node);
   try {sc.render(fork,0,'',.5,false,0);applyQuietPigment(node,sc,{...frame,core:C},scene,portrait);}
   finally {node.remove();for(const prop of ['position','left','top','visibility','pointer-events'])node.style.removeProperty(prop);}
   const pixels=sample(node);
   const required=replay?[replay.sourceActor]:scene==='last-souls'?frame.s.map(x=>x.id):frame.p.map(x=>x.id);
   if(!pixels||counts.arrow||counts.tactical||counts.unit||!required.every(id=>painted.has(id))||replay&&painted.size!==1||witnesses(b)!==snap||terrainSeal(b)!==geom||
      !live(app,e,proof)||e.b!==previous||witnesses(e.b)!==before||terrainSeal(e.b)!==frame.geometry||outcomeFor(app,e,proof)!==frame.cert)return null;
   const result=Object.freeze({node,native:Object.freeze({})});
   tickets.set(result.native,{app,e,proof,scene,node,world:canvas,size:{...size},pixels,nativePixels,counts,cert:frame.cert,b:previous,before,geometry:frame.geometry,
    actors:b.units.map(u=>[u.id,...feet(u)]),camera,walk:replay?{actor:replay.sourceActor,start:replay.start,passed:replay.passed,end:replay.end,steps:replay.walked}:null});
   return result;
  }finally{sc._releaseDomainTiles?.();}
 }
 function verifyNative(app,e,proof,scene,key,node,size){
  const ticket=tickets.get(key);
  if(!ticket||ticket.app!==app||ticket.e!==e||ticket.proof!==proof||ticket.scene!==scene||ticket.node!==node||ticket.b!==e.b||!live(app,e,proof)||
    liveCanvas(app,e,proof)!==ticket.world||!ticket.world.isConnected||ticket.size.w!==size.w||ticket.size.h!==size.h||outcomeFor(app,e,proof)!==ticket.cert||witnesses(e.b)!==ticket.before||terrainSeal(e.b)!==ticket.geometry)return false;
  try{return ticket.pixels===sample(node);}catch{return false;}
 }
 return Object.freeze({renderNative,verifyNative});
}
