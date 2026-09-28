import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime(),C=g.HONRO_CORE,checks=[],metrics={};
const test=(name,fn)=>{try{fn();checks.push({name,pass:true});console.log('PASS',name);}catch(err){checks.push({name,pass:false,error:String(err)});console.error('FAIL',name,err.stack);}};
function arena(id,rank=1){
 const cls=C.SKILLS[id].cls,profile=C.defaults();profile.heroes[cls].xp=C.xpAtLevel(25);profile.loadouts[cls]=[id];
 const b=C.createBattle(1,profile,'practice',{party:[cls],wind:0,distance:700});Object.assign(b,{width:5000,height:2400,terrain:[{id:'floor',x:0,y:1800,w:5000,h:600,mat:'rock',hp:99999,maxHp:99999}],fields:[],drafts:[],waters:[],wind:0,rng:123456});b.units=b.units.slice(0,1);
 const u=b.units[0];Object.assign(u,{x:400,y:1800,vx:0,vy:0,attack:1,armor:0,maxHp:10000,hp:10000,maxFocus:1000,focus:1000,ranks:{[C.baseSkill(cls)]:1,[id]:rank},loadout:[id],acted:false,airborne:false,jumping:false});
 const events=[],e=new C.Engine(b,ev=>events.push(ev)),foe=(x=1000,y=1800,props={})=>{const v=C.makeUnit('archer',1,x,y,{id:'dummy'+b.units.length,hp:100000,maxHp:100000,armor:0,shield:0,fixed:true,loadout:['LA01'],...props});b.units.push(v);return v;};
 return {e,b,u,events,foe};
}
test('Arrow guides reproduce real paths at both ranks, three angles, wind and obstacles',()=>{
 let cases=0,maxError=0;const times=[];
 for(const id of ['A01','A02','A04','A11','A12','A13','A15','A03'])for(const rank of [1,8])for(const angle of [20,45,75])for(const wind of [-20,17]){
  const {e,b,u,foe}=arena(id,rank);b.wind=wind;foe(1050);foe(1220);if(angle===20)b.terrain.push({id:'wood',x:1200,y:1640,w:40,h:160,hp:5000,maxHp:5000,mat:'wood'});
  const initial=JSON.stringify(b),start=performance.now(),pr=e.predict(u,C.SKILLS[id],angle,.7);times.push(performance.now()-start);assert.equal(JSON.stringify(b),initial,'preview must not mutate HP, RNG, terrain or save');
  assert(e.fire(id,angle,.7));const primary=b.projectiles[Math.floor(b.projectiles.length/2)],actual=[{x:primary.x,y:primary.y}];let i=0;
  for(;i<1440&&b.projectiles.length;i++)for(const p of [...b.projectiles]){if(!b.projectiles.includes(p))continue;e.stepProjectile(p,C.STEP);if(p===primary&&(i%3===0||!b.projectiles.includes(p)))actual.push({x:p.x,y:p.y});}
  assert.equal(pr.points.length,actual.length,`${id} point count`);for(let j=0;j<actual.length;j++){const err=Math.hypot(pr.points[j].x-actual[j].x,pr.points[j].y-actual[j].y);maxError=Math.max(maxError,err);assert(err<1e-7,`${id} ${rank} ${angle}: ${err}`);}
  if(id==='A15')assert.equal(pr.paths.length,8);cases++;
 }
 times.sort((a,b)=>a-b);metrics.trajectory={cases,maxError,medianMs:times[Math.floor(times.length*.5)],p95Ms:times[Math.floor(times.length*.95)]};
});
test('Every pierced target, including shield absorption, emits its own hit sound',()=>{
 const {e,b,u,foe,events}=arena('A02',8);for(let i=0;i<6;i++)foe(560+i*60,1800,{h:600,shield:i===0?10000:0});assert(e.fire('A02',0,.85));
 for(let i=0;i<600&&b.projectiles.length;i++)for(const p of [...b.projectiles])e.stepProjectile(p,C.STEP);
 assert.equal(events.filter(ev=>ev.type==='sound'&&ev.name==='arrowhit').length,6);assert(b.units.slice(2).every(t=>t.hp<t.maxHp));assert(b.units[1].shield<10000);
});
test('Ice hits the enemy, reverses velocity, waits 2.4 s and matches preview',()=>{
 for(const rank of [1,8])for(const wind of [-12,18]){
  const {e,b,u,foe,events}=arena('M02',rank),t=foe(610);b.wind=wind;const pr=e.predict(u,C.SKILLS.M02,0,.6);assert(e.fire('M02',0,.6));const q=b.projectiles[0];let reversed=false;
  for(let i=0;i<400&&b.projectiles.includes(q);i++){const vx=q.vx;e.stepProjectile(q,C.STEP);if(vx>0&&q.vx<0&&q.x<t.x)reversed=true;if(q.age<C.ICE_GOURD_FUSE){assert(b.projectiles.includes(q));assert.equal(t.hp,t.maxHp);}}
  assert(reversed);assert(q.age>=2.4&&q.age<2.4+C.STEP*1.01);assert(events.some(v=>v.name==='ceramic'));assert.equal(b.projectiles.filter(v=>v.secondary).length,5+rank);
  assert(Math.hypot(pr.x-q.x,pr.y-q.y)<1e-7,`ice prediction drift ${Math.hypot(pr.x-q.x,pr.y-q.y)}`);
 }
});
test('Every wave skill produces hit sound and an ink impact at actual damage',()=>{
 for(const id of ['M01','M03','M11','M12','M14','M15']){
  const {e,b,foe,events}=arena(id,8);foe(850,1800,{r:1500,h:2000});if(id==='M12')b.terrain.push({id:'roof',x:0,y:1200,w:2200,h:20,hp:99999,maxHp:99999,mat:'rock'});
  assert(e.fire(id,35,.6));for(let i=0;i<1500&&b.projectiles.length;i++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);
  assert(events.some(ev=>ev.type==='sound'&&ev.name==='qiHit'),id);assert(events.some(ev=>ev.type==='fx'&&ev.name==='inkImpact'),id);
 }
});
test('Player descriptions are prose; changing-rank specifications stay in effect rows',()=>{
 const players=Object.values(C.SKILLS).filter(s=>!s.enemyOnly&&/^[AMOS](?:P)?[0-9]{2}$/.test(s.id));assert(players.length>=84);
 for(const s of players){assert(s.desc.length>20,s.id);assert(!/[0-9%×±]|SP|MP|HP|fuse|계수|랭크/.test(s.desc),s.id+': '+s.desc);assert(C.skillEffectRows(s.id,8).length>0,s.id);}
 assert(C.skillEffectRows('M02',1).some(r=>r.value==='2.4초'));assert(C.skillEffectRows('A02',1).some(r=>r.value==='1회'));assert(C.skillEffectRows('A02',8).some(r=>r.value==='5회'));
});
test('All five stakes have distinct color, name and seal',()=>{
 for(const key of ['color','name','mark'])assert.equal(new Set(Object.values(C.STAKE_STYLES).map(s=>s[key])).size,5);
});
test('New sounds have audible finite, unclipped samples with different waveforms',()=>{
 const names=['qiHit','qiWave','qiRebound','ceramic','arrowhit'];metrics.audio=[];
 for(const name of names){const xs=C.AudioEngine.samples(name,24000),rms=Math.sqrt(xs.reduce((n,v)=>n+v*v,0)/xs.length),peak=Math.max(...xs.map(Math.abs));assert(xs.length>4000&&xs.every(Number.isFinite));assert(rms>.02&&peak<.95,`${name} rms=${rms} peak=${peak}`);metrics.audio.push({name,rms,peak,duration:xs.length/24000});}
 assert(new Set(metrics.audio.map(x=>x.rms)).size===names.length);
});
await mkdir('_local/reports/skill-polish',{recursive:true});await writeFile('_local/reports/skill-polish/unit.json',JSON.stringify({checks,metrics},null,2)+'\n');
if(checks.some(c=>!c.pass))process.exitCode=1;
