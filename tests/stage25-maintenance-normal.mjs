// Production App/engine input policy: prepared entry save, no world/resource edits.
// DOM, render, audio and storage are doubles; this is not browser/manual QA.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
const {g,C,load,profileThrough}=await appHarness(),A=g.HonroAct3,P=g.HonroStakeCrossing;
const out='_local/reports/stage25/normal';await mkdir(out,{recursive:true});
const sourceFiles=['tests/stage25-maintenance-normal.mjs','tests/app-regression-helpers.mjs','shared/data/campaign.json','game/config/balance.json'];
for(const dir of ['shared/runtime','shared/engine/src','shared/map'])for(const f of await readdir(dir))if(/\.(js|ts)$/.test(f))sourceFiles.push(dir+'/'+f);
const source=Object.fromEntries(await Promise.all(sourceFiles.sort().map(async f=>[f,createHash('sha256').update(await readFile(f)).digest('hex')])));
const profile=profileThrough(24);for(const cls of profile.recruited){profile.heroes[cls].xp=g.HonroProgression.budget(25).start;C.autoTrain(profile.heroes[cls],cls);C.sanitizeLoadout(profile,cls);}
const app=load(profile);app.launch(25);const e=app.engine,b=e.b,actions=[],dialogue=[],damage=[],crossings=[],start=performance.now();let frames=0;
const heroes=()=>e.heroesAlive(),mage=()=>heroes().find(u=>u.cls==='mage'),archer=()=>heroes().find(u=>u.cls==='archer');
const fingerprint=createHash('sha256').update(JSON.stringify({map:b.honroMap,source})).digest('hex');
function drain(){for(let n=0;app.dialogue&&n<200;n++){const d=app.dialogue;dialogue.push({id:d.id,index:d.index,text:d.lines[d.index]?.[1]});g.HonroStory.next(app);}assert(!app.dialogue);}
function record(action,extra={}){actions.push({round:b.round,actor:e.active?.cls,x:e.active?.x,y:e.active?.y,goal:A.current(b)?.id,action,...extra});console.log('INPUT',actions.length,b.round,action,extra.target||'',heroes().map(u=>`${u.cls}:${u.hp.toFixed(0)}@${u.x.toFixed(0)},${u.y.toFixed(0)}`).join(' '));}
function tick(){drain();const before=new Map(b.units.map(u=>[u.id,u.hp]));e.tick(1/60);if(!app.dialogue)g.HonroMission.tick(app,1/60);app.startQueuedStory();frames++;for(const u of b.units)if(before.has(u.id)&&before.get(u.id)!==u.hp)damage.push({frame:frames,round:b.round,id:u.id,side:u.side,kind:u.kind,delta:u.hp-before.get(u.id),hp:u.hp});if(frames>700000)throw Error('frame budget');}
function settle(){for(let n=0;!e.canAct()&&!['won','lost'].includes(b.phase)&&n<20000;n++)tick();drain();assert(e.canAct()||b.phase==='won','settle '+b.phase);}
function attack(){const u=e.active;if(!u)return false;const foes=e.alive(1).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<1250).sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y));for(const foe of foes.slice(0,2))for(const skill of u.loadout.map(k=>C.SKILLS[k]).filter(s=>s&&!s.passive&&s.damage>0&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus).sort((a,c)=>c.damage-a.damage).slice(0,2)){let best;for(const aim of e.shotSeeds(u,skill,foe)){const q=C.shotViable(e,u,skill,foe,aim.angle,aim.power);if(q.ok&&q.risk<1&&q.miss<Math.max(85,(skill.radius||0)+foe.r+55)&&(!best||q.net>best.net))best={...aim,net:q.net};}if(best&&e.fire(skill.id,best.angle,best.power)){record('attack',{skill:skill.id,target:foe.id});return true;}}return false;}
function round(){const r=b.round;for(let n=0;b.round===r&&n<12&&b.phase!=='won';n++){settle();if(!attack()){record('wait');e.wait();}settle();}assert(b.round>r||b.phase==='won','round stuck');}
function select(u){settle();for(let n=0;!e.select(u.id)&&n<15;n++)round();assert.equal(e.active.id,u.id);}
function walk(u,x,y){let stalled=0;for(let n=0;n<16000;n++){if(b.phase==='won')return;select(u);if(Math.abs(u.x-x)<13&&Math.abs(u.y-y)<12){record('walk-arrive',{target:[x,y]});return;}if(u.moveLeft<5){round();continue;}const prev=u.x;e.move(Math.sign(x-u.x),1/60);tick();if(Math.abs(prev-u.x)<.01)stalled++;else stalled=0;if(stalled>12&&e.grounded(u)){e.jump(u);stalled=0;}if(n%1000===999)console.log('WALK',u.cls,u.x,u.y,x,y);}throw Error('walk timeout '+JSON.stringify({cls:u.cls,x:u.x,y:u.y,target:[x,y]}));}
function fire(angle,power){for(let n=0;n<20;n++){select(mage());if(mage().focus>=e.manaCost(C.SKILLS.M09,mage(),power))break;round();}select(mage());assert(e.fire('M09',angle,power));record('M09',{angle,power});settle();}
let failure=null;
try{
drain();const entry=A.marker(b,'depot-entry-seal');walk(archer(),entry.x-350,entry.y);walk(mage(),entry.x,entry.y);for(let n=0;n<20;n++){select(mage());if(A.eligibility(app,entry).ok)break;console.log('ENTRY',A.eligibility(app,entry));round();}select(mage());assert(A.use(app,entry));record('interact',{target:entry.id});settle();
for(const [i,c] of b.honroMap.act3.crossings.entries()){
 walk(archer(),c.from.x-70,c.from.y);walk(mage(),c.from.x,c.from.y);select(mage());
 if((b.stakes||[]).some(z=>z.skill==='M09'))fire(-75,0);
 const shots=[];for(let el=12;el<=86;el+=2)for(let power=.7;power<=1.001;power+=.025){const angle=c.to.x<mage().x?180-el:el,r=e.predict(mage(),C.SKILLS.M09,angle,power);if(r.x>c.landing.left+55&&r.x<c.landing.right-55&&Math.abs(r.y-c.landing.y)<15)shots.push({angle,power});}assert(shots.length,'valid Jinmok prediction');const shot=shots[Math.floor(shots.length/2)];fire(shot.angle,shot.power);
 for(const u of [archer(),mage()]){const home=b.stakes.find(z=>z.skill==='M09'&&Math.abs(z.y-c.from.y)<25&&Math.abs(z.x-c.from.x)<150);assert(home,'home stake');walk(u,home.x,home.y);select(u);if(!e.useGate()){round();select(u);assert(e.useGate(),'gate available');}record('gate',{target:c.id});tick();}
 const marker=A.marker(b,c.markerId);for(const u of [archer(),mage()])walk(u,marker.x+(u.cls==='archer'?-30:30),marker.y);for(let n=0;n<120;n++)tick();drain();assert(g.HonroEvidenceQuests.field(b).events[c.markerId],'arrival inspection');crossings.push({i:i+1,round:b.round,marker:c.markerId,field:plain(g.HonroEvidenceQuests.field(b)),heroes:plain(heroes())});await writeFile(out+'/checkpoint.json',JSON.stringify({fingerprint,b,actions,damage,crossings}));
}
for(let n=0;n<30&&b.phase!=='won';n++){const s=A.current(b),m=A.marker(b,s.id);assert(m,'remaining marker '+s.id);const u=heroes().find(u=>u.cls===s.requiredClass)||archer();walk(u,m.x,m.y);if(b.phase==='won')break;select(u);if(m.action&&A.eligibility(app,m).ok){assert(A.use(app,m));record('interact',{target:m.id});}else round();tick();drain();}
assert.equal(b.phase,'won');
}catch(err){failure=err.stack;console.error(failure);}
const result={stage:25,phase:b.phase,round:b.round,goal:A.current(b)?.id,failure,fingerprint,source,seconds:(performance.now()-start)/1000,frames,actions,damage,crossings,dialogue,heroes:plain(heroes()),enemies:plain(e.alive(1)),events:plain(b.honroEvents),flags:plain(b.honroState.flags),items:plain(b.items),scope:'Production App/engine; prepared normal-budget entry save; actual movement/jump/skills/M09/gate/interaction/wait. No post-launch HP, actor position, inventory, enemy, turn, objective edits. DOM/render/audio/storage doubles; no browser or human difficulty claim.'};await writeFile(out+'/stage-25.json',JSON.stringify(result,null,2));console.log('RESULT',result.phase,result.round,result.goal,'actions',actions.length,'damage events',damage.length);if(failure)process.exitCode=1;
