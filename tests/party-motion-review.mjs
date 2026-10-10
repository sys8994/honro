/** Deterministic production pose adapter + Native Canvas evidence, not browser/input QA.
 * node tests/party-motion-review.mjs baseline|candidate
 * Baseline source copies are immutable after first capture. No build or production writes.
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,copyFile,access} from 'node:fs/promises';
import {createCanvas,Path2D} from '@napi-rs/canvas';
const label=process.argv[2]||'candidate';
assert(['baseline','candidate'].includes(label),'Use baseline or candidate');
const root='_local/reports/party-motion',out=`${root}/${label}`;
const sources=['shared/runtime/party-rig.js','shared/assets/party/party.runtime.js','shared/assets/rebuild-game-adapter.mjs'];
await mkdir(out,{recursive:true});
if(label==='baseline')for(const file of sources){const dest=`${out}/${file}`;try{await access(dest);}catch{await mkdir(path.dirname(dest),{recursive:true});await copyFile(file,dest);}}
const g=vm.createContext({console,structuredClone,Path2D}),hashes={};
for(const file of sources){const text=await readFile(label==='baseline'?`${out}/${file}`:file,'utf8');hashes[file]=createHash('sha256').update(text).digest('hex');vm.runInContext(text.replace(/^export /gm,'')+(file.endsWith('adapter.mjs')?'\nglobalThis.HonroPoseVisual=HonroPoseVisual;':''),g);}
const R=g.HonroVectorRig,assets=g.HONRO_PARTY,classes={seol_o:'archer',damheo:'mage',hwigyeom:'knight',sodan:'occultist'},metrics=[],timeline=[],failures=[];
const canvas=(w,h)=>{const c=createCanvas(w,h);Object.defineProperty(c,'clientWidth',{get:()=>w});return c;};
function sheet(cols,rows,title){const cv=canvas(cols*260,rows*270+48),ctx=cv.getContext('2d');ctx.fillStyle='#14262c';ctx.fillRect(0,0,cv.width,cv.height);ctx.fillStyle='#f1dfbc';ctx.font='16px sans-serif';ctx.fillText(title,14,27);return {cv,ctx};}
function cell(s,asset,sample,col,row,facing,text,draw=null){const c=s.ctx,x=col*260,y=row*270+48;c.save();c.beginPath();c.rect(x,y,260,270);c.clip();c.strokeStyle='#405458';c.beginPath();c.moveTo(x+5,y+250);c.lineTo(x+255,y+250);c.stroke();c.fillStyle='#d9d3bd';c.font='11px sans-serif';c.fillText(text,x+6,y+16);if(draw){c.save();c.translate(x+130,y+250);c.scale(145/102,145/102);draw(c);c.restore();}else R.createCanvasRenderer(asset).draw(c,{x:x+130,y:y+250,height:145,facing,sample,detail:2});c.restore();}
async function save(s,name){await writeFile(`${out}/${name}.png`,s.cv.toBuffer('image/png'));}
function measure(asset,sample){const m=R.rigMatrices(asset,sample.poses),by=Object.fromEntries(asset.rig.parts.map(p=>[p.id,p]));let jointGap=0,rigidityError=0;
for(const side of ['rear','front'])for(const [upper,lower]of [[side+'_upper_arm',side+'_forearm'],[side+'_forearm',side+'_hand'],[side+'_thigh',side+'_shin'],[side+'_shin',side+'_foot']]){const p=by[lower].pivot,a=R.point(m[upper],p),b=R.point(m[lower],p);jointGap=Math.max(jointGap,Math.hypot(a[0]-b[0],a[1]-b[1]));}
for(const key of ['head','weapon']){const a=m[key];rigidityError=Math.max(rigidityError,Math.abs(Math.hypot(a[0],a[1])-1),Math.abs(Math.hypot(a[2],a[3])-1),Math.abs(a[0]*a[2]+a[1]*a[3]));}
const a=R.point(m.weapon,by.weapon.pivot),b=R.point(m.front_hand,by.weapon.pivot),q=R.constrainedPaths(asset,m,sample.controls);
return {jointGap,rigidityError,gripGap:Math.hypot(a[0]-b[0],a[1]-b[1]),reach:Math.max(...Object.values(sample.guide.reach)),bowNockGap:q.hand&&sample.controls.draw===1?Math.hypot(q.hand[0]-q.nock[0],q.hand[1]-q.nock[1]):0,feet:Object.fromEntries(['rear','front'].map(side=>[side,R.point(m[side+'_foot'],by[side+'_foot'].pivot)])),contacts:[...sample.guide.contacts]};}
const attack=sheet(9,8,`${label}: production attack clips, 9 dense phases, both facings`),locomotion=sheet(9,8,`${label}: idle / move / jump contacts; matching frame scale`);
let row=0;
for(const [id,a]of Object.entries(assets)){
const aggregate={id,samples:0,jointGap:0,rigidityError:0,gripGap:0,reach:0,bowNockGap:0,idleFootDrift:0,loopError:0,contacts:[]};
for(const name of Object.keys(a.animation.animations))for(let i=0;i<=240;i++){const sample=R.sampleAnimation(a,name,i/240,true),m=measure(a,sample);aggregate.samples++;for(const k of ['jointGap','rigidityError','gripGap','reach','bowNockGap'])aggregate[k]=Math.max(aggregate[k],m[k]);if(m.reach>=aggregate.reach)aggregate.worstReach={name,phase:i/240,limbs:sample.guide.reach};if(name==='idle'){const start=measure(a,R.sampleAnimation(a,name,0,true));for(const side of ['rear','front'])aggregate.idleFootDrift=Math.max(aggregate.idleFootDrift,Math.hypot(...m.feet[side].map((v,j)=>v-start.feet[side][j])));}if(i%30===0&&['idle','move','jump_fall'].includes(name))aggregate.contacts.push({name,phase:i/240,feet:m.feet,contacts:m.contacts});}
for(const name of ['idle','move']){const x=R.rigMatrices(a,R.sampleAnimation(a,name,0,true).poses),y=R.rigMatrices(a,R.sampleAnimation(a,name,1,true).poses);for(const k of Object.keys(x))aggregate.loopError=Math.max(aggregate.loopError,...x[k].map((v,i)=>Math.abs(v-y[k][i])));}
for(const facing of [1,-1]){[0,.12,.24,.36,.48,.55,.65,.8,1].forEach((phase,i)=>cell(attack,a,R.sampleAnimation(a,'attack',phase,true),i,row,facing,`${id} ${facing>0?'R':'L'} atk ${phase}`));['idle','move','jump_fall'].forEach((name,k)=>[0,.5,1].forEach((t,i)=>cell(locomotion,a,R.sampleAnimation(a,name,t,true),k*3+i,row,facing,`${id} ${name} ${t}`)));row++;}
for(const k of ['jointGap','rigidityError','gripGap','bowNockGap','idleFootDrift','loopError'])assert(aggregate[k]<1e-6,`${id} ${k} ${aggregate[k]}`);if(aggregate.reach>=.25)failures.push(`${id} clip reach ${aggregate.reach}`);metrics.push(aggregate);
}
await save(attack,'attack-dense');await save(locomotion,'contacts');
const times=[0,.08,.18,.32,.6,.9,1.19,1.2,1.25,1.3,1.4,1.55,1.7,2];
for(const facing of [1,-1]){const s=sheet(7,8,`${label}: HonroPoseVisual charge/release timeline ${facing>0?'right':'left'}; release 1.20s`);let index=0;const releaseSheet=sheet(13,4,`${label}: production release at 60 Hz ${facing>0?'right':'left'} (0–200 ms)`);
for(const [id,a]of Object.entries(assets)){const v=new g.HonroPoseVisual(a,R),u={id,side:0,cls:classes[id],h:92,facing,angle:facing>0?25:155,anim:0,hurt:0,walkPhase:0,walkSpeed:330},engine={b:{units:[u],projectiles:[]}},original=JSON.stringify(u);let next=0,previous=null,maxFrameTravel=0;
for(let tick=0;tick<=240;tick++){const time=tick/120;u.anim=time>=1.2?Math.max(0,.8-(time-1.2)):0;v.update(engine,time,1/120);const charge=time<1.2?Math.max(.001,time/1.2):0,{sample,state}=v.pose(u,charge),m=measure(a,sample);for(const k of ['jointGap','rigidityError','gripGap','bowNockGap'])assert(m[k]<1e-6,`${id} runtime ${k}`);if(m.reach>=.3)failures.push(`${id} facing ${facing} time ${time}: runtime reach ${m.reach}`);
if(tick>=144&&tick<=168&&tick%2===0)cell(releaseSheet,a,sample,(tick-144)/2,index,facing,`${id} +${Math.round((time-1.2)*1000)}ms`);
if(previous)for(const key of ['pelvis','thorax','frontHand','rearHand'])maxFrameTravel=Math.max(maxFrameTravel,Math.hypot(...sample.targets[key].map((x,i)=>x-previous[key][i])));previous=structuredClone(sample.targets);
if(next<times.length&&time+1e-7>=times[next]){cell(s,a,sample,next%7,index*2+Math.floor(next/7),facing,`${id} ${time.toFixed(2)}s ${state.mode}`);timeline.push({id,facing,time,mode:state.mode,phase:sample.t,charge,targets:sample.targets,metrics:m});next++;}}
u.anim=0;assert.equal(JSON.stringify(u),original,'Adapter must not mutate simulation actor');metrics.find(x=>x.id===id)[`runtimeFrameTravel${facing>0?'Right':'Left'}`]=maxFrameTravel;index++;}
await save(s,`charge-release-${facing>0?'right':'left'}`);await save(releaseSheet,`release-dense-${facing>0?'right':'left'}`);}
const adapterChecks=[];
if(label==='candidate'){
 const renderer=await readFile('shared/runtime/renderer.js','utf8');
 assert.match(renderer,/archerVisual\?\.update\(e,this\.time,walkDt,selected\)/);
 assert.match(renderer,/partyVisual\?\.update\(e,this\.time,walkDt,selected\)/);
 hashes['shared/runtime/renderer.js']=createHash('sha256').update(renderer).digest('hex');
 const branches=sheet(6,6,`${label}: selected O01 bell / O06–10 talisman; charge, release, recovery`);
 let r=0;
 for(const selected of ['O01','O06','O07','O08','O09','O10']){
  const a=assets.sodan,v=new g.HonroPoseVisual(a,R),u={id:'skill-sodan',side:0,cls:'occultist',facing:1,anim:0},engine={b:{active:u.id,units:[u],projectiles:[]}},records=[];
  const steps=[{t:0,c:.001},{t:.4,c:.7},{t:.8,c:1},{t:.81,c:0,anim:1},{t:.85,c:0,anim:.96},{t:2,c:0,anim:0}];
  for(const [i,step]of steps.entries()){u.anim=step.anim||0;const before=JSON.stringify(u);v.update(engine,step.t,.016,selected);const {sample,state}=v.pose(u,step.c);assert.equal(JSON.stringify(u),before);const opacity=sample.controls.talismanOpacity||0,expected=selected!=='O01'&&i<=3?1:0;assert.equal(opacity,expected,`${selected} ${step.t} paper opacity`);if(selected!=='O01')assert.equal(sample.poses.spirit.opacity,0,`${selected} duplicate spirit`);cell(branches,a,sample,i,r,1,`${selected} ${state.mode} ${step.t}s`);records.push({time:step.t,mode:state.mode,talismanOpacity:opacity,spiritOpacity:sample.poses.spirit.opacity});}
  adapterChecks.push({case:selected,records});r++;
 }
 await save(branches,'skill-branches');
 const air=sheet(8,8,`${label}: airborne release / charge cancel / grounded idle, both facings`);r=0;
 for(const [id,a]of Object.entries(assets))for(const facing of [1,-1]){
  const v=new g.HonroPoseVisual(a,R),u={id,side:0,cls:classes[id],facing,angle:facing>0?25:155,anim:0,airborne:true,vy:-500},engine={b:{active:id,units:[u],projectiles:[]}},records=[];
  const steps=[{t:0,c:0,vy:-500,mode:'jump'},{t:.3,c:.5,vy:-200,mode:'charge'},{t:.5,c:.8,vy:-50,mode:'charge'},{t:.7,c:0,vy:100,mode:'jump'},{t:.8,c:.8,vy:200,mode:'charge'},{t:.81,c:0,vy:220,anim:1,mode:'release'},{t:2,c:0,vy:0,airborne:false,mode:'idle'},{t:2.2,c:0,vy:0,airborne:false,mode:'idle'}];
  for(const [i,step]of steps.entries()){Object.assign(u,{anim:step.anim||0,vy:step.vy,airborne:step.airborne??true});const before=JSON.stringify(u);v.update(engine,step.t,.016,id==='sodan'?'O06':'');const {sample,state}=v.pose(u,step.c);assert.equal(state.mode,step.mode,`${id} airborne mode`);if(u.airborne)assert.equal(sample.guide.contacts.length,0,`${id} airborne feet must not claim ground contacts`);assert.equal(JSON.stringify(u),before);const m=measure(a,sample);for(const k of ['jointGap','rigidityError','gripGap'])assert(m[k]<1e-6);if(m.reach>=.3)failures.push(`${id} airborne ${step.t}s reach ${m.reach}, limbs ${JSON.stringify(sample.guide.reach)}`);if(step.mode!=='charge')assert.equal(state.chargeAt,null);if(step.t===.7)assert.equal(sample.controls.talismanOpacity||0,0);if(step.t===2.2)assert.equal(sample.guide.contacts.length,2,`${id} settled landing contacts`);cell(air,a,sample,i,r,facing,`${id} ${state.mode} ${step.t}s`);records.push({time:step.t,mode:state.mode,metrics:m});}
  adapterChecks.push({case:`${id} airborne/cancel ${facing}`,records});r++;
 }
 await save(air,'airborne-cancel');
 // Real engine entry point is fire(), which invokes startWarriorCast internally.
 const {guidanceRuntime}=await import('./act2-guidance-helpers.mjs'),eg=await guidanceRuntime(),C=eg.HONRO_CORE;
 for(const file of ['shared/engine/src/warriorMechanics.ts','shared/engine/src/engine.ts','shared/engine/src/warriorData.ts'])hashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');
 const skillIds=['S00','S02','S03','S07','S05','S01','S11','S06','S04','S15','S13','S07-r8'],engineSheet=sheet(9,skillIds.length,`${label}: actual Engine.fire + tick, selected skill event/pose correspondence`);let erow=0;
 for(const skillLabel of skillIds){const skill=skillLabel.split('-')[0],rank=skillLabel.endsWith('-r8')?8:1;
  const profile=C.defaults();profile.heroes.knight.xp=C.xpAtLevel(10);profile.heroes.knight.ranks={S00:1,[skill]:rank};profile.loadouts.knight=[skill];const b=C.createBattle(1,profile,'practice',{party:['knight'],wind:0});
  Object.assign(b,{width:4000,height:2000,practiceCombat:true,wind:0,fields:[],waters:[],drafts:[],terrain:[{id:'floor',x:0,y:1500,w:4000,h:500,mat:'rock',hp:99999,maxHp:99999}]});b.units=b.units.slice(0,1);const u=b.units[0];Object.assign(u,{x:1000,y:1500,spawnX:1000,spawnY:1500,attack:1,focus:999,maxFocus:999,hp:999,maxHp:999,angle:0,loadout:[skill],ranks:{S00:1,[skill]:rank},acted:false,airborne:false,jumping:false,vx:0,vy:0,cooldowns:{}});
  b.units.push(C.makeUnit('knight',1,1100,1500,{id:'target',fixed:true,hp:10000,maxHp:10000,armor:0,h:u.h,r:12,loadout:['LS09']}));
  let now=0;const events=[],e=new C.Engine(b,event=>events.push({time:now,event}));e.random=()=>.99;e.checkEnd=()=>false;
  const v=new g.HonroPoseVisual(assets.hwigyeom,R);v.update(e,0,.001,skill);v.pose(u,.001);v.update(e,.4,.001,skill);v.pose(u,1);
  assert(e.fire(skill,0,.7),`${skill} real fire accepted`);assert.equal(u.anim,1);const initial={anim:u.anim,meleeAction:structuredClone(u.meleeAction),projectiles:b.projectiles.map(q=>({skill:q.skill,body:q.body,mode:q.mode}))};
  const records=[],cutEvents=[],moments=[0,.025,.05,.075,.1,.175,.2,.275,.4];let next=0,lastCount=0;
  for(let tick=0;tick<=(rank===8?800:400);tick++){
   now=tick/1000;if(tick)e.tick(.001);const count=events.filter(x=>x.event.name==='swordCut').length;v.update(e,.4+now,.001,skill);const {sample,state}=v.pose(u,0),m=measure(assets.hwigyeom,sample);
   const matrices=R.rigMatrices(assets.hwigyeom,sample.poses),weaponAngle=Math.atan2(matrices.weapon[1],matrices.weapon[0])*180/Math.PI;
   const record={time:now,weaponAngle,anim:u.anim,mode:state.mode,phase:sample.t,weapon:sample.targets.weapon,meleeAction:structuredClone(u.meleeAction),bodyFlight:state.bodyFlight,hp:b.units.find(x=>x.id==='target').hp,metrics:m};
   if(count>lastCount){const saved=v.renderer;v.renderer={draw(_ctx,options){return options;}};const drawn=v.draw(null,u,0);v.renderer=saved;record.drawFacing=drawn.facing;cutEvents.push({...record,events:events.filter(x=>x.event.name==='swordCut').slice(lastCount)});lastCount=count;}
   if(next<moments.length&&now+1e-8>=moments[next]){records.push(record);cell(engineSheet,assets.hwigyeom,sample,next,erow,1,`${skillLabel} ${now}s ${state.mode}`,c=>v.draw(c,u,0));next++;}
   if(initial.projectiles.some(q=>q.body)&&tick===0)assert.equal(state.mode,'rush',`${skill} body branch`);
   for(const k of ['jointGap','rigidityError','gripGap'])assert(m[k]<1e-6,`${skill} engine ${k}`);if(m.reach>.3)failures.push(`${skill} engine ${now} reach ${m.reach}`);
  }
  if(initial.meleeAction){const expected=skill==='S02'?.2:.075;assert(cutEvents.length,`${skill} emits actual swordCut`);assert(Math.abs(cutEvents[0].time-expected)<=.0011,`${skill} hit timing`);assert(Math.abs(cutEvents[0].phase-assets.hwigyeom.animation.animations.attack.events[0].t)<.003,`${skill} first sword pose extreme aligns with hit`);}
  if(initial.meleeAction)for(const hit of cutEvents)if(Math.abs(hit.phase-assets.hwigyeom.animation.animations.attack.events[0].t)>.003)failures.push(`${skill} hit at ${hit.time}s pose phase ${hit.phase}, expected cut phase .5`);
  if(skill==='S07')for(const [i,hit]of cutEvents.entries()){const angle=assets.hwigyeom.anatomyRevision>=12?(i%2?-50:15):(i%2?-125:-55);if(Math.abs(hit.weaponAngle-angle)>.01)failures.push(`${skillLabel} hit ${i+1} at ${hit.time}s weaponAngle ${hit.weaponAngle}, expected ${angle}`);assert(hit.metrics.gripGap<1e-6);}
  if(skill==='S05')assert.equal(cutEvents[1].drawFacing,-u.facing,'S05 second hit is rendered backward without changing actor facing');
  adapterChecks.push({case:`actual-engine-${skillLabel}`,initial,records,cutEvents,events:events.filter(x=>x.event.name==='swordCut')});erow++;
 }
 await save(engineSheet,'engine-skill-timelines');

}
const report={status:failures.length?'failed':'passed',failures,label,mode:'Actual production HonroPoseVisual + HonroVectorRig rendered by Native Canvas',sources:hashes,shader:'Canvas2D vector paths; no separate GPU shader',cadence:'120 Hz deterministic presentation updates; charge held 1.2 s then actual anim transition',metrics,timeline,adapterChecks,limits:['Does not verify browser DOM, input, CSS, deployed Game/Workshop, or full projectile impact/balance coverage. Actual isolated engine sword event timing is covered.','Dense attack clip phases and runtime charge/release are distinct evidence.','Rigidity/contact invariants do not alone establish visual quality.','Foot records use rig contact pivots; planted move contacts travel in actor-local coordinates.']};
await writeFile(`${out}/summary.json`,JSON.stringify(report,null,2)+'\n');
console.log(`${label.toUpperCase()} PARTY MOTION ${failures.length?'FAIL':'PASS'}: ${metrics.length} actors, ${timeline.length} timeline snapshots; ${out}`);

if(failures.length){console.error(failures.slice(0,10));process.exitCode=1;}
// Optional animated comparison uses the same actual Native Canvas pose adapters.
// PARTY_MOTION_ANIMATION=1 node tests/party-motion-review.mjs candidate
if(label==='candidate'&&process.env.PARTY_MOTION_ANIMATION==='1'){
 const {execFile}=await import('node:child_process'),{promisify}=await import('node:util'),run=promisify(execFile),frames=`${out}/animation-frames`;await mkdir(frames,{recursive:true});
 const bg=vm.createContext({console,structuredClone,Path2D});for(const file of sources){const text=await readFile(`${root}/baseline/${file}`,'utf8');vm.runInContext(text.replace(/^export /gm,'')+(file.endsWith('adapter.mjs')?'\nglobalThis.HonroPoseVisual=HonroPoseVisual;':''),bg);}
 const versions=[bg,g].map(runtime=>Object.entries(runtime.HONRO_PARTY).map(([id,asset])=>{const u={id,side:0,cls:classes[id],facing:1,angle:25,anim:0,hurt:0};return {id,u,v:new runtime.HonroPoseVisual(asset,runtime.HonroVectorRig),e:{b:{active:id,units:[u],projectiles:[]}}};}));
 for(let frame=0;frame<84;frame++){const time=frame/30,cv=canvas(1040,620),c=cv.getContext('2d');c.fillStyle='#14262c';c.fillRect(0,0,1040,620);
  for(const [row,actors]of versions.entries()){c.fillStyle='#f1dfbc';c.font='17px sans-serif';c.fillText(`${row?'Candidate':'Baseline'} | ${time<1?'charge':'release / recovery'} ${time.toFixed(2)}s`,15,row*310+25);
   for(const [col,{id,u,v,e}]of actors.entries()){u.anim=time>=1?Math.max(0,1-(time-1)):0;v.update(e,time,1/30,id==='sodan'?'O06':id==='hwigyeom'?'S00':'');c.fillStyle='#d9d3bd';c.font='13px sans-serif';c.fillText(id,col*260+12,row*310+48);c.strokeStyle='#405458';c.beginPath();c.moveTo(col*260+5,row*310+300);c.lineTo(col*260+255,row*310+300);c.stroke();c.save();c.translate(col*260+130,row*310+300);c.scale(1.7,1.7);v.draw(c,u,time<1?Math.max(.001,time):0);c.restore();}}
  await writeFile(`${frames}/${String(frame).padStart(3,'0')}.png`,cv.toBuffer('image/png'));
 }
 await run('ffmpeg',['-y','-loglevel','error','-framerate','30','-i',`${frames}/%03d.png`,'-filter_complex','split[a][b];[a]palettegen=max_colors=160[p];[b][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0',`${out}/before-after-motion.gif`]);
 console.log(`Native Canvas animation: ${out}/before-after-motion.gif`);
}
