/** CI-only generator: isolated production Scene, not public UI/gameplay acceptance. */
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {supportPoint} from '../shared/act4-finale-revision.mjs';
import {runtimeEntries,root} from '../shared/build.mjs';
const out=process.argv[2];
if(!out)throw Error('Usage: node tests/actual-scene-browser-fixture.mjs OUTPUT_DIRECTORY [23,26,29|32|33]');
const stages=[40];
if(process.env.HONRO_ACT4_RELEASE!=='1')throw Error('Act4 release required');
const old=execFileSync('git',['show','7d238d20663c3ceffe430eb0304e01516ae625cf:shared/act4-finale-author.mjs'],{encoding:'utf8'});
const {authorAct4Finale:oldAuthor}=await import('data:text/javascript;base64,'+Buffer.from(old).toString('base64'));
const src=JSON.parse(await readFile('shared/data/act4/world.json','utf8')).stages.find(s=>s.metadata.stageId===40);
const authored=oldAuthor(src,supportPoint);const baseline={units:authored.units,encounters:authored.encounters,initialState:authored.initialState};
await mkdir(out,{recursive:true});
// runtimeParts is exactly runtimeEntries(...).map(entry=>entry.code). Names allow safe deduplication.
const entries=await runtimeEntries({vector:true,render:true,app:false,productionStory:true});
const runtime=entries.map(entry=>entry.code).join('\n;\n');
const names=new Set(entries.map(entry=>entry.name)),act4Extra=[];
if(stages.some(id=>id===40)){
 for(const [name,file]of [['HONRO_ACT4_PILOT_COMBAT_REFERENCE','pilot-combat-reference.json'],['HONRO_ACT4_PREVIEW_SEEDS','reviewed.json']])if(!entries.some(e=>e.global===name||e.name===name))act4Extra.push('globalThis.'+name+'='+JSON.stringify(JSON.parse(await readFile(path.join(root,'shared/data/act4',file),'utf8')))+';');
 for(const name of ['act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-pilot-combat','act4-pilot-art']){
  const file='shared/runtime/'+name+'.js';if(names.has(file))continue;
  names.add(file);act4Extra.push(await readFile(path.join(root,file),'utf8'));
 }
}
const runtimeSha256=createHash('sha256').update(runtime).digest('hex');
function bootstrap(id){
 if(id===40)globalThis.HONRO_APP_READY=new Promise(()=>{}); // Never attach a real App or resolve this promise.
 globalThis.PROBE={storage:[],errors:[],images:[],violations:[]};
 const p=globalThis.PROBE;
 globalThis.publishProbe=value=>{document.getElementById('result').textContent=btoa(unescape(encodeURIComponent(JSON.stringify(value))));};
 addEventListener('error',e=>{p.errors.push(String(e.error?.stack||e.message));publishProbe({ok:false,...p});});
 addEventListener('unhandledrejection',e=>{p.errors.push(String(e.reason?.stack||e.reason));publishProbe({ok:false,...p});});
 addEventListener('securitypolicyviolation',e=>p.violations.push({directive:e.violatedDirective,uri:e.blockedURI}));
 for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(globalThis,key,{configurable:true,get(){p.storage.push(key);throw Error('Forbidden storage access: '+key);}});
 let seed=3910;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 const descriptor=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
 Object.defineProperty(HTMLImageElement.prototype,'src',{...descriptor,set(value){
  const row={pending:!!value,error:false};p.images.push(row);
  this.addEventListener('load',()=>{row.pending=false;},{once:true});
  this.addEventListener('error',()=>{row.pending=false;row.error=!!value;},{once:true});
  descriptor.set.call(this,value);
 }});
}
async function capture(id,runtimeSha256,variant,requestedCamera){
 const p=PROBE,C=HONRO_CORE;try{
 const original=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===40),stage=structuredClone(original);
 if(variant==='baseline')Object.assign(stage,structuredClone(HONRO_BASELINE40));
 const project={...HONRO_PROJECT,stages:HONRO_PROJECT.stages.map(s=>s===original?stage:s)};
 const profile=HonroProfileStore.fresh(),entryLevel=HonroProgression.plan(40).entryLevel;
 profile.recruited=HonroStageRules.stageParty(40);profile.party=[...profile.recruited];
 const allocations={archer:{AP04:1,AP02:2,AP01:2,AP03:1,A14:1,A02:4,A11:1,A09:4,A05:4},mage:{M07:1,M10:4,M03:3,M11:3,MP01:3,MP02:2,MP04:2,MP03:1},knight:{S03:4,S05:3,S01:1,S09:3,SP01:3,SP02:3,SP04:2},occultist:{O07:1,O08:3,O02:4,O11:3,OP01:3,OP02:2,OP03:2,OP04:1}};
 for(const cls of profile.recruited){const h=profile.heroes[cls];h.xp=HonroProgression.xpAt(entryLevel);for(const [skill,n]of Object.entries(allocations[cls]||{}))while((h.ranks[skill]||0)<n){if(!C.train(h,skill))break;}let n=0;while(C.pointsLeft(h,cls)>0&&n++<200)if(!C.investStat(h,cls))break;}
 profile.loadouts={...profile.loadouts,archer:['A01','A02','A09','A05'],mage:['M01','M10','M03','M11'],knight:['S00','S03','S05','S09'],occultist:['O01','O02','O08','O11']};for(const cls of profile.recruited)C.sanitizeLoadout(profile,cls);
 HonroMaps.compile(stage,project);const b=HonroMaps.createBattle(stage,project,profile);HonroStageRules.sanitizeStageBattle(b);HonroAct4TerrainPreview.coast.tide(b);
 const notices=[],e=new C.Engine(b,x=>notices.push(x),true),cv=document.getElementById('scene');cv.width=1331;cv.height=763;
 const scene=new HonroScene(cv),app={engine:e,scene,stage,profile,modal:{classList:{contains:()=>false}},dialogue:null,charging:false};
 globalThis.HonroApp=app;HonroAct4TerrainPreview.attachCoast(app);HonroAct4PilotCombat.attach(app);
 b.honroAct4PreviewState.visualDrawn={};
 const initial=structuredClone({heroes:b.units.filter(u=>u.side===0),enemies:b.units.filter(u=>u.side===1),terrain:b.terrain,design:b.honroAct4Design,round:b.round});
 let frames=0,stopReason=null,latestRound=0,actionNo=0;const actions=[],rounds=[],start=performance.now();
 const alive=u=>!u.dead&&u.hp>0,dist=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y),heroes=()=>b.units.filter(u=>u.side===0&&!u.summoned&&alive(u)),foes=()=>b.units.filter(u=>u.side===1&&alive(u));
 function draw(){const u=e.active||heroes()[0];if(!u)return;Object.assign(scene,{x:u.x,y:u.y-200,scale:.65,manual:true,time:frames*C.STEP});HonroBounds.constrain(scene,b);scene.render(e,C.STEP,'',.6,false,0);}
 function tick(){e.tick(C.STEP);frames++;if(frames%30===0)draw();}
 function fireAt(u,target){const skills=u.loadout.map(id=>C.SKILLS[id]).filter(s=>s&&s.damage>0&&!s.passive&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus).sort((a,z)=>z.damage-a.damage);
 for(const s of skills.slice(0,3)){if(s.martial&&s.branch==='sword'){let angle=Math.atan2(u.y-u.h*.58-(target.y-target.h*.5),target.x-u.x)*180/Math.PI;if(angle< -90)angle+=360;for(const power of[1,.7,.2])if(C.meleeContains(e,u,target,C.meleeRange(u,s,power),-angle*Math.PI/180,C.meleeSpan(u,s,power))&&e.fire(s.id,angle,power)){actions.push({op:'fire',round:b.round,hero:u.id,skill:s.id,target:target.id});return true;}continue;}
 let best=null;for(const aim of e.shotSeeds(u,s,target)){const v=C.shotViable(e,u,s,target,aim.angle,aim.power);if(v.ok&&v.risk<1&&(!best||v.net>best.net))best={...aim,net:v.net};}
 if(best&&e.fire(s.id,best.angle,best.power)){actions.push({op:'fire',round:b.round,hero:u.id,skill:s.id,target:target.id,angle:best.angle,power:best.power});return true;}}
 return false;}
 function walkToward(u,target){const from={x:u.x,y:u.y},direction=Math.sign(target.x-u.x);let still=0;
 for(let k=0;k<1000&&e.canAct()&&e.active===u&&u.moveLeft>12;k++){
 if(Math.abs(target.x-u.x)<70&&Math.abs(target.y-u.y)<120)break;
 const x=u.x,y=u.y;e.move(Math.sign(target.x-u.x),C.STEP);tick();
 if(Math.hypot(u.x-x,u.y-y)<.01)still++;else still=0;
 if(still===14&&e.grounded(u)){const ok=e.jump();actions.push({op:'jump',round:b.round,hero:u.id,ok,x:u.x,y:u.y});}
 if(still>90)break;
 }for(let k=0;k<240&&!e.grounded(u)&&e.canAct();k++)tick();
 actions.push({op:'move',round:b.round,hero:u.id,from,to:{x:u.x,y:u.y},goal:{id:target.id,x:target.x,y:target.y},remaining:u.moveLeft});
 }

 const waypoints=[
 {x:1400,y:1527,s:'coast-west',gate:['coast-west'],gateMaxX:1500},
 {x:3300,y:2376,s:'coast-west',gate:['coast-west']},{x:5100,y:1807,s:'coast-east'},{x:5750,y:1400,s:'coast-east'},
 {x:5670,y:1270,s:'upper-east',jump:true},{x:4700,y:1126,s:'upper-east',gate:['upper-east']},
 {x:5750,y:1329,s:'upper-east'},{x:5730,y:1406,s:'coast-east',drop:true},
 {x:3660,y:2384,s:'coast-east',gate:['coast-east']},{x:3690,y:2465,s:'spur',drop:true},
 {x:4700,y:3120,s:'arrival-stair',gate:['arrival-stair']},{x:3840,y:2610,s:'arrival-stair'},
 {x:3740,y:2490,s:'spur',jump:true},{x:3640,y:2389,s:'coast-east',jump:true},
 {x:2660,y:2244,s:'coast-west'},{x:2660,y:2297,s:'dock-stair',drop:true},
 {x:2000,y:2680,s:'dock-stair',gate:['dock-stair']},{x:1800,y:2826,s:'dock'},
 {x:600,y:2716,s:'dock',gate:['dock']},{x:1600,y:2807,s:'dock'},
 {x:1600,y:2935,s:'departure-stair',drop:true},{x:2150,y:3575,s:'departure-stair'},
 {x:2175,y:3600,s:'departure-ramp',gate:['departure-stair','departure-ramp']}
 ].map(v=>({...v,s:'approved40-'+v.s}));
 const gateTargets=t=>!t.gate?[]:foes().filter(u=>{const seed=initial.enemies.find(z=>z.id===u.id);return t.gate.some(s=>seed?.honroEncounterSupport==='approved40-'+s)&&(t.gateMaxX===undefined||seed.x<t.gateMaxX);});
 const routeIndex=new Map(heroes().map(u=>[u.id,0]));
 const support=u=>e.contactSurface(u.x,u.y-8,u.y+12)?.t.id;
 function walkRoute(u){let index=routeIndex.get(u.id)||0,target=waypoints[index];if(!target)return;
 const from={x:u.x,y:u.y},startIndex=index;let still=0,jumped=false;
 for(let k=0;k<1800&&e.canAct()&&e.active===u&&u.moveLeft>12;k++){
  if(Math.abs(u.x-target.x)<45&&Math.abs(u.y-target.y)<55&&support(u)===target.s){const pending=gateTargets(target);if(pending.length){pending.sort((a,z)=>dist(a,u)-dist(z,u));actions.push({op:'clear-gate',round:b.round,hero:u.id,index,remaining:pending.map(v=>v.id)});walkToward(u,pending[0]);break;}actions.push({op:'waypoint',round:b.round,hero:u.id,index,x:u.x,y:u.y,support:support(u)});index++;routeIndex.set(u.id,index);target=waypoints[index];if(!target)break;}
  const minIndex=Math.min(...heroes().map(h=>routeIndex.get(h.id)||0));if(index>minIndex+1)break;
  const x=u.x,y=u.y;
  if(target.drop&&support(u)!==target.s&&Math.abs(u.x-target.x)<50){if(e.drop())actions.push({op:'drop',round:b.round,hero:u.id,index,x:u.x,y:u.y});}
  if(target.jump&&!jumped&&support(u)!==target.s&&e.grounded(u)){jumped=e.jump();if(jumped)actions.push({op:'jump',round:b.round,hero:u.id,index,x:u.x,y:u.y});}
  if(Math.abs(u.x-target.x)>5)e.move(Math.sign(target.x-u.x)*(Math.abs(u.x-target.x)<30?.3:1),C.STEP);tick();
  if(Math.hypot(u.x-x,u.y-y)<.01)still++;else still=0;
  if(still===14&&e.grounded(u)&&!target.drop){const ok=e.jump();actions.push({op:'jump-recover',round:b.round,hero:u.id,ok,index,x:u.x,y:u.y});}
  if(still>90)break;
 }
 for(let k=0;k<240&&!e.grounded(u)&&e.canAct();k++)tick();
 actions.push({op:'route-move',round:b.round,hero:u.id,from,to:{x:u.x,y:u.y},startIndex,index,support:support(u),remaining:u.moveLeft});
 }
 function heal(u){if(u.cls!=='mage'||!u.loadout.includes('M10')||e.manaCost(C.SKILLS.M10,u)>u.focus)return false;
 const hurt=heroes().filter(v=>v.hp/v.maxHp<.78&&dist(v,u)<1800).sort((a,z)=>a.hp/a.maxHp-z.hp/z.maxHp);if(!hurt.length)return false;
 const target=hurt[0];if((b.stakes||[]).some(s=>s.skill==='M10'&&s.expires>b.round+1&&dist(s,target)<180))return false;
 let best=null;for(const {angle,power}of e.shotSeeds(u,C.SKILLS.M10,target)){const hit=e.predict(u,C.SKILLS.M10,angle,power),d=dist(hit,target);if(hit.terrain&&Math.abs(hit.y-target.y)<70&&d<90&&(!best||d<best.d))best={angle,power,d};}
 if(best&&e.fire('M10',best.angle,best.power)){actions.push({op:'heal',round:b.round,hero:u.id,target:target.id,...best});return true;}return false;
 }

 draw();await document.fonts.ready;
 const initialPng=cv.toDataURL('image/png');
 for(;actionNo<600&&!['won','lost'].includes(b.phase);actionNo++){
 while(!e.canAct()&&!['won','lost'].includes(b.phase)&&frames<150000){tick();if(performance.now()-start>180000)break;}
 if(performance.now()-start>180000){stopReason='180s wall budget; unfinished, not route failure';break;}
 if(frames>=150000){stopReason='frame budget';break;}if(['won','lost'].includes(b.phase))break;
 if(b.round>80){stopReason='80-round clear-before-leaving policy bounded comparison; not full-play acceptance';break;}
 if(latestRound!==b.round){latestRound=b.round;rounds.push({round:b.round,foes:foes().length,heroes:heroes().map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,level:u.level})),escort:b.honroAct4PreviewState.returnEscort||null});}
 const lagging=heroes().filter(h=>!h.acted).sort((a,z)=>(routeIndex.get(a.id)||0)-(routeIndex.get(z.id)||0)||a.x-z.x)[0];if(lagging)e.select(lagging.id);
 const u=e.active;if(!u||u.side!==0){stopReason='no active hero';break;}
 if(heal(u))continue;
 const lag=heroes().some(h=>(routeIndex.get(h.id)||0)>(routeIndex.get(u.id)||0)||h.x-u.x>550&&Math.abs(h.y-u.y)<700);if(lag)walkRoute(u);if(!e.canAct())continue;
 let targets=foes().sort((a,z)=>dist(a,u)-dist(z,u)),fired=false;
 for(const t of targets.filter(t=>dist(t,u)<1500).slice(0,3))if(fireAt(u,t)){fired=true;break;}if(fired)continue;
 if(!targets.length){stopReason='all enemies defeated; full App narrative/escort continuation required';break;}
 walkRoute(u);if(!e.canAct())continue;if(heal(u))continue;
 for(const t of targets.filter(t=>alive(t)&&dist(t,u)<1600).slice(0,3))if(fireAt(u,t)){fired=true;break;}
 if(!fired){actions.push({op:'wait',round:b.round,hero:u.id});e.wait();}
 }
 draw();const final={pilotHistory:b.units.filter(u=>u.honroPilotCombat).map(u=>({id:u.id,hp:u.hp,dead:!!u.dead,combat:structuredClone(u.honroPilotCombat)})),residents:b.units.filter(u=>u.honroAct4Resident).map(u=>({id:u.id,hp:u.hp,dead:!!u.dead,x:u.x,y:u.y})),eventFailure:b.honroAct4PreviewState.failure||null,phase:b.phase,round:b.round,heroes:heroes().map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,level:u.level})),remaining:foes().map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp})),escort:b.honroAct4PreviewState.returnEscort||null};
 publishProbe({ok:true,stage:40,variant,runtimeSha256,waypoints,routeProgress:Object.fromEntries(routeIndex),scope:'Native Engine ordinary input bounded comparison from canonical spawns, same synthetic stage-entry trained profile. Not full App narrative/escort or human gameplay acceptance. No teleports, HP deletion/refill, turn override, save manipulation or enemy removal.',entryLevel,initial,final,actions,rounds,frames,stopReason:stopReason||'action budget or battle ending',elapsed:(performance.now()-start)/1000,storage:p.storage,errors:p.errors,violations:p.violations,png:cv.toDataURL('image/png'),initialPng});
 }catch(err){publishProbe({ok:false,error:String(err.stack||err),...p});}
}
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';
for(const id of stages)for(const variant of ['baseline','candidate'])for(const requestedCamera of [{name:'normal',x:3330,y:2400}]){
 const stageRuntime=(id===40)?runtime+'\n;\n'+act4Extra.join('\n;\n'):runtime;
 const stageRuntimeSha256=createHash('sha256').update(stageRuntime).digest('hex');
 const html='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'"><title>Isolated production Scene diagnostic</title><style>body{margin:0}canvas{width:1331px;height:763px}</style><canvas id="scene"></canvas><pre id="result">pending</pre>'+script('('+bootstrap.toString()+')('+id+');')+script('globalThis.HONRO_BASELINE40='+JSON.stringify(baseline)+';')+script(stageRuntime)+script('('+capture.toString()+')('+id+','+JSON.stringify(stageRuntimeSha256)+','+JSON.stringify(variant)+','+JSON.stringify(requestedCamera)+');');
 await writeFile(path.join(out,`stage${id}-${variant}-${requestedCamera.name}.html`),html);
}
console.log(JSON.stringify({stages,runtimeSha256,runtimeBytes:Buffer.byteLength(runtime),scope:'Generator only. Run each fixture in a separate temporary Chrome profile with --force-device-scale-factor=1 --virtual-time-budget=60000 --dump-dom and external timeout 300s. Extractor requires completion, no fixed sleep acceptance.'}));

