/** Physics-only support-link microprobes, NOT a normal route/combat run. */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const n=Number(process.argv[2]||31),dir=`_local/reports/act4-pilot/stage${n}/skeleton`,stage=JSON.parse(await readFile(dir+'/stage.json')),spec=JSON.parse(await readFile(dir+'/blueprint.json'));
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,profile=C.defaults();g.HonroEquipment.fresh(profile);profile.recruited=g.HonroStageRules.stageParty(n);for(const cls of profile.recruited)profile.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(n).entryLevel);const {b,e}=battlefield(g,n,{profile}),original=structuredClone(e.heroesAlive());
const compiled=g.HonroMaps.compile(stage,{...g.HONRO_PROJECT,stages:[stage]});b.terrain=compiled.terrain;b.width=stage.width;b.height=stage.height;b.projectiles=[];b.units=[];b.phase='aim';b.side=0;e.checkEnd=()=>false;
const stageSHA256=createHash('sha256').update(JSON.stringify(stage)).digest('hex');
const rows=[],links=[...new Map(spec.routes.flatMap(r=>r.supports.slice(1).map((z,i)=>[[r.supports[i],z].join('>'),[r.supports[i],z]]))).values()];
const support=id=>b.terrain.find(t=>t.id===`pilot${n}-${id}`),floor=(id,x)=>C.terrainSurfaces(support(id),x).filter(q=>Math.abs(q.slope)<=1.35).sort((a,z)=>a.y-z.y)[0]?.y;
if(process.argv.includes('--continuous-only')){const saved=JSON.parse(await readFile(dir+'/kinematics.json'));if(saved.stageSHA256!==stageSHA256)throw Error('Prior link probes do not match this exact geometry');rows.push(...saved.rows);}
for(const [from,to]of (process.argv.includes('--continuous-only')?[]:links)){const a=spec.surfaces.find(s=>s.id===from),z=spec.surfaces.find(s=>s.id===to),ax1=a.top[0][0]+25,ax2=a.top.at(-1)[0]-25,zx1=z.top[0][0]+35,zx2=z.top.at(-1)[0]-35,clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
 const starts=[clamp(zx1-170,ax1,ax2),clamp(zx2+170,ax1,ax2),clamp((zx1+zx2)/2,ax1,ax2),ax1,ax2,clamp(zx1,ax1,ax2),clamp(zx2,ax1,ax2)],targets=[zx1,zx2,(zx1+zx2)/2],pairs=[];
 for(const x of starts)for(const tx of targets){const y=floor(from,x),ty=floor(to,tx);if(y!==undefined&&ty!==undefined&&y-ty<215&&Math.abs(tx-x)<950)pairs.push({x,y,tx,ty,cost:Math.hypot(tx-x,ty-y)});}pairs.sort((a,z)=>a.cost-z.cost);
 for(const template of original){let success=null,attempts=[];
  for(const p of pairs){const u=structuredClone(template);Object.assign(u,{x:p.x,y:p.y,vx:0,vy:0,jumping:false,airborne:false,acted:false});delete u.platformDrop;b.units=[u];b.active=u.id;b.phase='aim';b.side=0;if(!C.validTerrainContactPose(b.terrain,u))continue;
   const before={x:u.x,y:u.y,h:u.h,walkSpeed:u.walkSpeed,moveLeft:u.moveLeft,hp:u.hp};const action=spec.connections?.find(c=>c.fromSupport===from&&c.toSupport===to)?.mode|| (p.ty>p.y+40?(e.canDrop(u)?'drop':'walk-off'):'jump');const launched=action==='drop'?e.drop(u):['walk-off','walk'].includes(action)?true:e.jump(u);let frames=0;
   for(;launched&&frames<720;frames++){if(Math.abs(p.tx-u.x)>1)e.move(Math.sign(p.tx-u.x)*Math.min(1,Math.abs(p.tx-u.x)/(u.walkSpeed*C.STEP)),C.STEP);e.integrateBody(u,C.STEP);if(frames>2&&e.grounded(u)&&(!['walk-off','walk'].includes(action)||e.contactSurface(u.x,u.y-.2,u.y+.2)?.t?.id!==`pilot${n}-${from}`))break;}
   const id=e.contactSurface(u.x,u.y-.2,u.y+.2)?.t?.id,passed=launched&&id===`pilot${n}-${to}`&&u.hp===before.hp;
   const result={from,to,cls:u.cls,action,launched,frames,before,end:{x:u.x,y:u.y,hp:u.hp,moveLeft:u.moveLeft},support:id,passed};attempts.push(result);if(passed){success=result;break;}
  }
  rows.push(success||{from,to,cls:template.cls,passed:false,attempts});console.log(JSON.stringify({from,to,cls:template.cls,passed:!!success,attempts:attempts.length}));
 }
}
await writeFile(dir+'/kinematics.json',JSON.stringify({stageSHA256,scope:'Actual Engine jump/walk/body/contact on authored geometry. Each edge starts from a declared valid support pose. No route continuity, combat, GUI or aggregate movement-count claim.',rows},null,2));
console.log(JSON.stringify({passed:rows.filter(x=>x.passed).length,total:rows.length}));

// Separate continuous geometry route: fresh entrance once per production body,
// actual finishAction/tick round replenishment, no intermediate pose/budget edits.
const continuous=[];
for(const template of original){
 const u=structuredClone(template);Object.assign(u,{x:stage.anchors.spawn.x,y:stage.anchors.spawn.y,vx:0,vy:0,jumping:false,airborne:false,acted:false});delete u.platformDrop;
 b.units=[u];b.active=u.id;b.phase='aim';b.side=0;b.round=1;b.teamEnds={0:0,1:0};b.queue=[];b.projectiles=[];b.zones=[];
 const start={x:u.x,y:u.y,hp:u.hp},steps=[],trajectory=[];let frameCounter=0;const advance=()=>{e.integrateBody(u,C.STEP);if(frameCounter++%6===0)trajectory.push({x:u.x,y:u.y,grounded:e.grounded(u),support:e.contactSurface(u.x,u.y-.2,u.y+.2)?.t?.id});};let jumps=0,drops=0,turnFinishes=0;
 const renew=()=>{if(!e.grounded(u))return false;e.finishAction(true);turnFinishes++;for(let i=0;i<600&&!(b.side===0&&b.phase==='aim'&&!u.acted);i++)e.tick(.05);return b.side===0&&b.phase==='aim'&&!u.acted;};
 const walkTo=x=>{let still=0;for(let i=0;i<5000;i++){if(Math.abs(x-u.x)<2&&e.grounded(u))return true;if(u.moveLeft<120&&e.grounded(u)&&!renew())return false;const before=u.x;e.move(Math.sign(x-u.x)*Math.min(1,Math.abs(x-u.x)/(u.walkSpeed*C.STEP)),C.STEP);advance();still=Math.abs(before-u.x)<.01?still+1:0;if(Math.abs(x-u.x)<2&&e.grounded(u))return true;if(still>12&&e.grounded(u)&&Math.abs(x-u.x)>=2){if(u.moveLeft<e.jumpCost(u)+20){if(!renew())return false;still=0;continue;}if(!e.jump(u))return false;jumps++;still=0;}if(u.dead)return false;}return false;};
 for(const [i,to]of spec.routes[0].supports.slice(1).entries()){
  const from=spec.routes[0].supports[i],r=rows.find(r=>r.cls===u.cls&&r.from===from&&r.to===to&&r.passed);
  if(!r||!walkTo(r.before.x)){steps.push({from,to,passed:false,reason:'launch approach blocked',x:u.x,y:u.y,vx:u.vx,vy:u.vy,jumping:u.jumping,airborne:u.airborne,moveLeft:u.moveLeft,phase:b.phase,side:b.side,acted:u.acted,active:b.active,grounded:e.grounded(u),targetX:r?.before.x});break;}
  if(u.moveLeft<700&&!renew()){steps.push({from,to,passed:false,reason:'turn transition failed'});break;}
  const before={x:u.x,y:u.y,hp:u.hp,moveLeft:u.moveLeft},launched=r.action==='drop'?e.drop(u):['walk-off','walk'].includes(r.action)?true:e.jump(u);if(launched){if(r.action==='drop'||r.action==='walk-off')drops++;else if(r.action==='jump')jumps++;}
  for(let frame=0;launched&&frame<720;frame++){const tx=r.end.x;if(Math.abs(tx-u.x)>1)e.move(Math.sign(tx-u.x)*Math.min(1,Math.abs(tx-u.x)/(u.walkSpeed*C.STEP)),C.STEP);advance();if(frame>2&&e.grounded(u)&&(!['walk-off','walk'].includes(r.action)||e.contactSurface(u.x,u.y-.2,u.y+.2)?.t?.id!==`pilot${n}-${from}`))break;}
  const supportId=e.contactSurface(u.x,u.y-.2,u.y+.2)?.t?.id,passed=launched&&supportId===`pilot${n}-${to}`;steps.push({from,to,before,end:{x:u.x,y:u.y,hp:u.hp,moveLeft:u.moveLeft},support:supportId,passed});if(!passed)break;
 }
 continuous.push({cls:u.cls,start,end:{x:u.x,y:u.y,hp:u.hp},rounds:b.round,turnFinishes,jumps,drops,inputCountsNotYetEffectiveClassification:true,trajectory,groundedBounds:trajectory.filter(p=>p.grounded).reduce((a,p)=>({left:Math.min(a.left,p.x),right:Math.max(a.right,p.x),top:Math.min(a.top,p.y),bottom:Math.max(a.bottom,p.y)}),{left:start.x,right:start.x,top:start.y,bottom:start.y}),steps,passed:steps.length===spec.routes[0].supports.length-1&&steps.every(s=>s.passed)});
 console.log('CONTINUOUS '+JSON.stringify({...continuous.at(-1),trajectory:undefined}));
}
await writeFile(dir+'/continuous-route.json',JSON.stringify({stageSHA256,scope:'Per-body fresh-entrance continuous movement-only route on real Engine, no pose/budget correction after setup; no enemies, App story/boarding or GUI and not a combat clear.',continuous},null,2));

await writeFile(dir+'/verification-summary.json',JSON.stringify({stageSHA256,scope:'Geometry only; no art/combat/App acceptance',edgeBodyChecks:{passed:rows.filter(r=>r.passed).length,total:rows.length},continuousBodyChecks:{passed:continuous.filter(r=>r.passed).length,total:continuous.length},routes:continuous.map(({cls,rounds,jumps,drops,groundedBounds,start,end,passed})=>({cls,rounds,inputJumps:jumps,inputDrops:drops,groundedBounds,hpLoss:start.hp-end.hp,passed})),remaining:['effective movement classification in normal party combat','enemy/staging integration','App boarding with authored coordinates','art acceptance','Pages deployment']},null,2));
