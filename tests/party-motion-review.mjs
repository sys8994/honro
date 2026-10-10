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
function cell(s,asset,sample,col,row,facing,text){const c=s.ctx,x=col*260,y=row*270+48;c.save();c.beginPath();c.rect(x,y,260,270);c.clip();c.strokeStyle='#405458';c.beginPath();c.moveTo(x+5,y+250);c.lineTo(x+255,y+250);c.stroke();c.fillStyle='#d9d3bd';c.font='11px sans-serif';c.fillText(text,x+6,y+16);R.createCanvasRenderer(asset).draw(c,{x:x+130,y:y+250,height:145,facing,sample,detail:2});c.restore();}
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
const report={status:failures.length?'failed':'passed',failures,label,mode:'Actual production HonroPoseVisual + HonroVectorRig rendered by Native Canvas',sources:hashes,shader:'Canvas2D vector paths; no separate GPU shader',cadence:'120 Hz deterministic presentation updates; charge held 1.2 s then actual anim transition',metrics,timeline,limits:['Does not verify browser DOM, input, CSS, engine projectile timing, or deployed Game/Workshop.','Dense attack clip phases and runtime charge/release are distinct evidence.','Rigidity/contact invariants do not alone establish visual quality.','Foot records use rig contact pivots; planted move contacts travel in actor-local coordinates.']};
await writeFile(`${out}/summary.json`,JSON.stringify(report,null,2)+'\n');
console.log(`${label.toUpperCase()} PARTY MOTION ${failures.length?'FAIL':'PASS'}: ${metrics.length} actors, ${timeline.length} timeline snapshots; ${out}`);

if(failures.length){console.error(failures.slice(0,10));process.exitCode=1;}
