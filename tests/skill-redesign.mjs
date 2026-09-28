import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime(),C=g.HONRO_CORE,results=[];
const test=(name,fn)=>{try{fn();results.push({name,pass:true});console.log('PASS',name);}catch(error){results.push({name,pass:false,error:String(error)});console.error('FAIL',name,error.stack);}};
const plain=x=>JSON.parse(JSON.stringify(x));
function arena(id='A01',rank=1){
 const s=C.SKILLS[id],profile=C.defaults();profile.heroes[s.cls].xp=C.xpAtLevel(25);profile.loadouts[s.cls]=[id];
 const b=C.createBattle(1,profile,'practice',{party:[s.cls],wind:0,distance:700});b.width=5000;b.height=2400;b.terrain=[{id:'floor',x:0,y:1800,w:5000,h:600,mat:'rock',hp:99999,maxHp:99999}];b.fields=[];b.drafts=[];b.waters=[];b.units=b.units.slice(0,1);b.rng=123456;b.wind=0;
 const u=b.units[0];Object.assign(u,{x:400,y:1800,vx:0,vy:0,attack:1,armor:0,maxHp:10000,hp:10000,maxFocus:1000,focus:1000,ranks:{[id]:rank,[C.baseSkill(s.cls)]:1},loadout:[id],acted:false,airborne:false,jumping:false});u.ranks[id]=rank;
 const events=[],e=new C.Engine(b,x=>events.push(plain(x))),foe=(x=1100,y=1800,options={})=>{const v=C.makeUnit('archer',1,x,y,{id:'enemy'+b.units.length,name:'허상',role:'dummy',hp:100000,maxHp:100000,armor:0,shield:0,fixed:true,loadout:['LA01'],...options});b.units.push(v);return v;};
 return {b,e,u,events,foe,fire:(angle=35,power=.65)=>{assert(e.fire(id,angle,power));return b.projectiles[0];},run:(seconds=12)=>{for(let i=0;i<seconds/C.STEP;i++){if(!b.projectiles.length&&!b.volley)break;e.stepVolley(C.STEP);for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);}}};
}
test('3 × 5 active, 5 passive, free basics and rankable capstones',()=>{
 for(const cls of ['archer','mage']){const nodes=C.TALENTS.filter(n=>n.cls===cls);assert.equal(nodes.length,20);for(let branch=0;branch<4;branch++)assert.equal(nodes.filter(n=>n.branch===branch).length,5);const h=C.freshHero(cls);assert.equal(C.pointsLeft(h,cls),3);assert(!C.TALENT_MAP[C.baseSkill(cls)]);assert(C.knownSkills(h,cls).includes(C.baseSkill(cls)));assert(!C.ultimateUnlocked(h,cls));for(const n of nodes.filter(n=>n.row===4&&n.branch<3)){assert(C.SKILLS[n.id].capstone);assert(!C.SKILLS[n.id].ultimate);assert.equal(n.maxRank,8);}}
});
test('distance, drop and speed are independent and monotonic',()=>{
 const a=arena('A14'),p=a.fire();p.launchX=0;p.apexY=0;p.vx=600;p.vy=0;
 const ds=[300,900,1800].map(x=>C.trajectoryMultiplier(p,a.u,{x,y:900}));assert(ds[0]<ds[1]&&ds[1]<ds[2]);const d=ds[1];p.vx=1500;p.apexY=-500;assert.equal(C.trajectoryMultiplier(p,a.u,{x:900,y:900}),d);
 p.skill='A11';p.apexY=600;const low=C.trajectoryMultiplier(p,a.u,{x:900,y:900});p.apexY=0;assert(C.trajectoryMultiplier(p,a.u,{x:900,y:900})>low);assert.equal(C.trajectoryMultiplier(p,a.u,{x:300,y:900}),C.trajectoryMultiplier(p,a.u,{x:1800,y:900}));
 p.skill='A05';const sp=[500,800,1150].map(v=>{p.vx=v;return C.trajectoryMultiplier(p,a.u,{x:100,y:900});});assert(sp[0]<sp[1]&&sp[1]<sp[2]);assert.equal(C.trajectoryMultiplier(p,a.u,{x:4000,y:2200}),sp[2]);
});
test('seeded crit repeats exactly and obeys caps',()=>{
 const trial=()=>{const a=arena('A14',8),p=a.fire(),t=a.foe();a.u.ranks.AP02=8;p.preparedRank=8;const out=[];for(let i=0;i<20;i++){const hp=t.hp;a.e.hurt(t,20,a.u.id,true,p,p);out.push(hp-t.hp);}assert.equal(C.critProfile(p,a.u).chance,.65);assert(Math.abs(C.critProfile(p,a.u).multiplier-2.37)<1e-8);return out;};assert.deepEqual(trial(),trial());assert(new Set(trial()).size>1);
});
test('정심 consumes one distance cast and expires after two turns',()=>{
 const a=arena('A10',8);a.fire();assert.equal(a.b.projectiles.length,0);assert.equal(a.u.prepared.rank,8);a.u.loadout=['A01','A14'];a.b.phase='aim';a.u.ranks.A14=1;assert(a.e.fire('A01',30,.5));assert(a.u.prepared);a.b.projectiles=[];a.b.phase='aim';assert(a.e.fire('A14',30,.5));assert(!a.u.prepared);assert.equal(a.b.projectiles[0].preparedRank,8);a.u.prepared={rank:1,expires:3};a.b.round=4;C.tickRedesign(a.e,0);assert(!a.u.prepared);
});
test('pierce ranks and 88% decay, rock blocks',()=>{
 for(let r=1;r<=8;r++){const a=arena('A02',r),p=a.fire(),max=[1,1,2,2,3,3,4,5][r-1];for(let i=0;i<=max;i++){const t=a.foe(700+i*50);a.e.impact(p,{x:t.x,y:t.y-40,t:0,n:{x:-1,y:0},unit:t});assert.equal(a.b.projectiles.includes(p),i<max);}assert.equal(p.pierces,max);}
 const a=arena('A02',8),p=a.fire();a.e.impact(p,{x:700,y:1700,t:0,n:{x:-1,y:0},terrain:a.b.terrain[0]});assert(!a.b.projectiles.includes(p));
});
test('회기시 actual enemy damage only and per-cast recovery caps',()=>{
 const a=arena('A06',8),p=a.fire(),t=a.foe();a.u.hp=100;a.u.focus=0;for(let i=0;i<20;i++)a.e.hurt(t,10000,a.u.id,true,p,p);assert(a.u.hp<=1600);assert(a.u.focus<=180);const before=a.u.hp;const ally=a.foe(1500,1800,{side:0});a.e.hurt(ally,100,a.u.id,true,p,p);assert.equal(a.u.hp,before);
});
test('전로시 permits one manual turn at capped angle and 92% speed',()=>{
 const a=arena('A09',1),p=a.fire(0,.6),speed=Math.hypot(p.vx,p.vy);assert(a.e.turnArrow({x:p.x,y:p.y-500}));assert(Math.abs(Math.atan2(-p.vy,p.vx)-Math.PI/4)<1e-6);assert(Math.abs(Math.hypot(p.vx,p.vy)-speed*.92)<1e-6);assert(!a.e.turnArrow());
});
test('homing obeys LOS and terrain collisions',()=>{
 const a=arena('A13'),p=a.fire(0,.5),t=a.foe(700,1800);a.b.terrain.push({id:'wall',x:600,y:1400,w:30,h:400,mat:'rock',hp:99999,maxHp:99999});a.b.sceneVersion++;const before=a.e.steer(550,1750,300,0,a.u,.1);assert.equal(before.vy,0);a.run();assert.equal(t.hp,t.maxHp);
});
test('return keeps outbound and inbound hits separate',()=>{
 const a=arena('A12'),p=a.fire(),t=a.foe();a.e.impact(p,{...Cpoint(t),t:0,n:{x:-1,y:0},unit:t});assert(a.b.projectiles.includes(p));p.returning=true;p.outboundHits=[...p.hit];p.hit=[];const before=t.hp;a.e.impact(p,{...Cpoint(t),t:0,n:{x:1,y:0},unit:t});assert(t.hp<before);assert.equal(p.hit[0],t.id);
});
function Cpoint(t){return {x:t.x,y:t.y-t.h*.5};}
test('칠성추혼 always splits seven and caps each target at four hits',()=>{
 const a=arena('A15',8),p=a.fire();a.foe();a.foe(1200);C.splitSeven(a.e,p);assert.equal(a.b.projectiles.length,7);assert.equal(new Set(a.b.projectiles.map(p=>p.targetId)).size,2);const t=a.b.units[1];for(const q of a.b.projectiles)a.e.hurt(t,100,a.u.id,true,q,q);const key=`redesign:${p.shot}:A15:${t.id}`;assert.equal(a.b.shotDamage[key],7);const before=t.hp;a.e.hurt(t,100,a.u.id,true,a.b.projectiles[0],p);assert.equal(t.hp,before);
});
test('push transfers enemy collision and 쇄암 terrain multiplier',()=>{
 const a=arena('A05',8),p=a.fire(),t=a.foe(700,1800,{fixed:false}),v=a.foe(730,1800,{fixed:false});a.e.impact(p,{...Cpoint(t),t:0,n:{x:-1,y:0},unit:t});C.tickRedesign(a.e,.01);assert(v.hp<v.maxHp);assert(v.vx>0);
 const b=arena('A07'),q=b.fire(),wall={id:'wood',x:700,y:1700,w:40,h:100,mat:'wood',hp:1000,maxHp:1000};b.e.impact(q,{x:700,y:1700,t:0,n:{x:-1,y:0},terrain:wall});assert(Math.abs(wall.hp-(1000-q.damage*4.5))<1e-6);
});
test('chain selects fresh enemies and decays by 72%',()=>{
 const a=arena('A03',8),p=a.fire(),ts=Array.from({length:7},(_,i)=>a.foe(700+i*100));const initial=p.damage;for(let i=0;i<6;i++){a.e.impact(p,{...Cpoint(ts[i]),t:0,n:{x:-1,y:0},unit:ts[i]});if(i<5)assert(Math.abs(p.damage-initial*.72**(i+1))<1e-6);}assert.equal(p.chain,5);assert(!a.b.projectiles.includes(p));
});
test('철화 emits 8–22 seeded short arrows and caps child damage',()=>{
 const trial=r=>{const a=arena('A08',r),p=a.fire();a.e.impact(p,{x:900,y:1600,t:0,n:{x:0,y:-1},terrain:a.b.terrain[0]});const vs=[];for(let i=0;i<185;i++){C.redesignStep(a.e,p,1/120);p.age+=1/120;for(const q of a.b.projectiles.filter(q=>q.secondary)){vs.push([q.vx,q.vy]);a.e.remove(q);}}assert.equal(vs.length,8+(r-1)*2);return vs;};assert.deepEqual(trial(8),trial(8));trial(1);
 const a=arena('A08'),p=a.fire(),t=a.foe();p.secondary=true;p.child=true;p.rootDamage=100;p.damage=20;for(let i=0;i<22;i++)a.e.hurt(t,20,a.u.id,false,p,p);assert.equal(t.maxHp-t.hp,65);
});
test('산개사 + 연속 시위 preserves count, spread, 0.5s cadence and exponential decay',()=>{
 for(let r=1;r<=8;r++){const a=arena('A04',r);a.u.ranks.AP01=r;a.fire(45,.6);const roots=[...a.b.projectiles];assert.equal(roots.length,2+r);const original=roots[Math.floor(roots.length/2)].damage;a.b.projectiles=[];a.e.stepVolley(.49);assert.equal(a.b.projectiles.length,0);a.e.stepVolley(.01);assert.equal(a.b.projectiles.length,2+r);assert(Math.abs(a.b.projectiles[0].damage-original*(.42+.02*(r-1)))<1e-9);for(let i=2;i<=Math.min(5,r);i++){a.b.projectiles=[];a.e.stepVolley(.5);assert.equal(a.b.projectiles.length,2+r);assert(Math.abs(a.b.projectiles[0].damage-original*C.volleyDamage(r,i))<1e-9);const angles=a.b.projectiles.map(p=>Math.atan2(-p.vy,p.vx)*180/Math.PI);assert(Math.abs((angles[0]+angles.at(-1))/2-45)<=2+1e-6);}assert(!a.b.volley);}
});
test('retreat permits movement, blocks attack and switching, exhausts to end',()=>{
 const a=arena();a.b.mode='campaign';a.u.ranks.AP03=8;a.fire();a.b.projectiles=[];a.e.finishAction(true);assert(a.u.retreat);assert.equal(a.u.moveLeft,a.u.maxMove*.4);assert(!a.e.fire('A01',30,.6));assert(!a.e.select(a.foe(1600,1800,{side:0}).id));const x=a.u.x;a.e.move(1,.1);assert(a.u.x>x);a.u.moveLeft=0;C.tickRedesign(a.e,.01);assert(!a.u.retreat);
});
test('빙호 bounces until fuse; shards and primary explosion follow',()=>{
 const a=arena('M02',8),p=a.fire(0,.2),t=a.foe(520,1800);let count=0;for(let i=0;i<280;i++){a.e.stepProjectile(p,1/120);count=Math.max(count,p.bounces);assert.equal(t.hp,t.maxHp);}assert(count>0);for(let i=0;i<14&&a.b.projectiles.includes(p);i++)a.e.stepProjectile(p,1/120);assert(!a.b.projectiles.includes(p));assert.equal(a.b.projectiles.filter(q=>q.secondary).length,13);
});
test('뇌호 hits every target once from origin, through units and walls',()=>{
 const a=arena('M04',8),p=a.fire(),ts=Array.from({length:8},(_,i)=>a.foe(1000+i*5,1800));a.e.impact(p,{x:800,y:1760,t:0,n:{x:0,y:-1},terrain:a.b.terrain[0]});assert(ts.every(t=>t.hp<t.maxHp));const lines=a.events.filter(e=>e.name==='lightningBolt');assert.equal(lines.length,8);assert(lines.every(l=>l.x===800&&l.y===1760));
});
test('화호 and 연폭호 counts, deterministic emissions and target caps',()=>{
 const a=arena('M06',1),p=a.fire();a.e.impact(p,{x:900,y:1700,t:0,n:{x:0,y:-1},terrain:a.b.terrain[0]});assert.equal(a.b.projectiles.length,6);const t=a.foe(1200);for(const q of a.b.projectiles)a.e.hurt(t,q.damage,a.u.id,false,q,q);assert((a.b.shotDamage[`redesign:${p.shot}:M06:${t.id}`]||0)===2);
 const trial=()=>{const b=arena('M13',8),q=b.fire();b.e.impact(q,{x:900,y:1700,t:0,n:{x:0,y:-1},terrain:b.b.terrain[0]});b.run(2);const markers=b.events.filter(e=>e.name==='ring'&&e.size===8);assert.equal(markers.length,14);return b.events.filter(e=>e.name==='ring'&&e.size!==8).map(e=>[e.x,e.y]);};assert.deepEqual(trial(),trial());assert.equal(trial().length,15);
});
test('천뢰호 delay and marker match vertical strike without roof',()=>{
 const a=arena('M05'),p=a.fire();a.e.impact(p,{x:900,y:1800,t:0,n:{x:0,y:-1},terrain:a.b.terrain[0]});for(let i=0;i<41;i++)a.e.stepProjectile(p,1/120);assert(a.b.projectiles.includes(p));a.run(1);const line=a.events.filter(e=>e.name==='lightningBolt').at(-1);assert.equal(line.x,900);assert.equal(line.x2,900);assert(Math.abs(line.y2-1800)<5);
});
test('원호 preview and actual geometry agree, ring excludes interior and decays',()=>{
 const a=arena('M03',8),pr=a.e.predict(a.u,C.SKILLS.M03,30,.6);a.fire(30,.6);a.run();const event=a.events.find(e=>e.name==='skillGeometry');assert(event);assert.deepEqual(JSON.parse(event.text),plain(pr.geometry));
 const u={x:400,y:1040,h:80,r:1},ring=C.skillGeometry(C.SKILLS.M14,1,400,1000,0,0);assert.equal(C.geometryHits(ring,u).count,0);u.x=580;assert.equal(C.geometryHits(ring,u).count,1);
 const trial=power=>{const b=arena('M14'),radius=180+720*power,t=b.foe(b.u.x+radius,b.u.y);b.fire(0,power);b.run();return t.maxHp-t.hp;};assert(trial(0)>trial(1));
});
test('반탄파 2–7 bounces and 삼재 boundary/interior geometry',()=>{
 for(const r of [1,8]){const a=arena('M11',r),p=a.fire();for(let i=0;i<=(r===1?2:7);i++){a.e.impact(p,{x:800,y:1600,t:0,n:{x:i%2?1:-1,y:0},terrain:a.b.terrain[0]});assert.equal(a.b.projectiles.includes(p),i<(r===1?2:7));}}
 const g={kind:'triangle',x:0,y:0,radius:0,thickness:20,angle:0,span:0,points:[{x:0,y:0},{x:400,y:0},{x:200,y:400}]};assert(C.geometryHits(g,{x:200,y:80,h:80,r:1}).interior);assert(C.geometryHits(g,{x:200,y:40,h:80,r:1}).count>0);assert.equal(C.geometryHits(g,{x:600,y:300,h:80,r:1}).count,0);
});
test('팔괘 center and ray hits are capped at three lines',()=>{const geo=C.skillGeometry(C.SKILLS.M15,8,500,500,0);const center=C.geometryHits(geo,{x:500,y:540,h:80,r:21});assert(center.center);assert.equal(center.count,3);assert(C.geometryHits(geo,{x:650,y:540,h:80,r:10}).count>0);});
function place(a,skill,x,rank=8){a.u.ranks[skill]=rank;a.u.loadout=[skill];a.b.phase='aim';a.u.acted=false;a.u.focus=1000;a.u.cooldowns={};assert(a.e.fire(skill,0,.3));const p=a.b.projectiles.find(p=>p.skill===skill&&!p.secondary);a.e.impact(p,{x,y:1800,t:0,n:{x:0,y:-1},terrain:a.b.terrain[0]});return a.b.stakes.at(-1);}
test('파진목 enemy step, 회생진목 ally recovery, no summon or placement refund',()=>{
 const a=arena('M07');place(a,'M07',1000);C.tickRedesign(a.e,.01);assert.equal(a.b.stakes.length,1);const t=a.foe(1000);C.tickRedesign(a.e,.01);assert.equal(a.b.stakes.length,0);assert(t.hp<t.maxHp);
 const b=arena('M10');b.u.ranks.MP03=8;place(b,'M10',1000);const f=b.foe(1000,1800,{side:0,hp:200,maxHp:1000,focus:0,maxFocus:100,moveLeft:0,maxMove:1000});C.tickRedesign(b.e,.01);assert.equal(f.hp,340);assert(Math.abs(f.focus-15)<1e-8);assert.equal(f.moveLeft,360);assert(!f.summoned);C.finishRedesign(b.e,false);assert(b.u.focus<1000);
});
test('유인진목 pull stays outside solid wall',()=>{
 const a=arena('M08'),z=place(a,'M08',1000);a.foe(1000,1800);const t=a.foe(1250,1800,{fixed:false});a.b.terrain.push({id:'wall',x:1120,y:1500,w:30,h:300,mat:'rock',hp:99999,maxHp:99999});a.b.sceneVersion++;C.tickRedesign(a.e,.01);assert(t.vx<0);for(let i=0;i<120;i++)a.e.integrateBody(t,1/120);assert(t.x>=1150+t.r-10);
});
test('축지 max2 oldest replacement, once per unit/turn, arrival recovery',()=>{
 const a=arena('M09');const first=place(a,'M09',700),second=place(a,'M09',1100),third=place(a,'M09',1500);assert.deepEqual(Array.from(a.b.stakes,s=>s.id),[second.id,third.id]);a.u.x=1100;a.u.y=1800;a.u.hp=500;a.u.focus=0;a.u.moveLeft=0;a.b.phase='aim';assert(a.e.useGate());assert.equal(a.u.x,1500);assert(a.u.hp>500&&a.u.focus>0&&a.u.moveLeft>0&&a.u.arrivalGuard);assert(!a.e.useGate());a.b.teamEnds[0]++;assert(a.e.useGate());assert.equal(a.u.x,1100);
});
test('오방봉진 2R expiry and once-per-turn boundary damage',()=>{
 const a=arena('M99'),z=place(a,'M99',1000),t=a.foe(1000,1800,{fixed:false});C.tickRedesign(a.e,.01);assert(z.active);assert.equal(z.expires,a.b.round+2);assert.equal(t.moveLeft,t.maxMove*.65);t.x=1240;const before=t.hp;C.tickRedesign(a.e,.01);assert(t.hp<before);const after=t.hp;C.tickRedesign(a.e,.01);assert.equal(t.hp,after);assert(t.vx<0);a.b.round+=2;C.tickRedesign(a.e,.01);assert.equal(a.b.stakes.length,0);
});
test('회기 refunds complete misses exactly once, authored balance stays authoritative',()=>{
 const a=arena('M06',8);a.u.ranks.MP03=8;const cost=a.e.manaCost(C.SKILLS.M06,a.u);a.fire();a.b.projectiles=[];C.finishRedesign(a.e,false);assert(Math.abs(a.u.focus-(1000-cost+cost*.46))<1e-6);for(const s of Object.values(C.SKILLS).filter(s=>s.redesigned))assert.equal(C.skillBalanceFactor(s),1);
});
test('오방봉진 reduces the renewed movement budget once each turn',()=>{
 const a=arena('M99');place(a,'M99',1000);const t=a.foe(1000);C.tickRedesign(a.e,0);assert.equal(t.moveLeft,t.maxMove*.65);a.b.teamEnds[1]++;t.moveLeft=t.maxMove;C.tickRedesign(a.e,0);assert.equal(t.moveLeft,t.maxMove*.65);C.tickRedesign(a.e,0);assert.equal(t.moveLeft,t.maxMove*.65);
});
test('mid-flight save restores every emitter, child mode, volley and stake',()=>{
 for(const id of ['A08','M06','M02','M13','M05']){
  const a=arena(id,8);a.u.maxHp=a.u.hp=1000;a.foe();const q=a.fire();a.e.impact(q,{x:900,y:1790,t:0,n:{x:0,y:-1},terrain:a.b.terrain[0]});if(id==='M02')q.age=C.ICE_GOURD_FUSE;
  C.redesignStep(a.e,q,.01);const p=C.defaults();p.saved=a.b;const restored=C.validate(plain(p)).saved;assert(restored);assert.deepEqual(plain(restored.projectiles),plain(a.b.projectiles),id);const e=new C.Engine(restored);for(let i=0;i<1600&&restored.projectiles.length;i++)for(const v of [...restored.projectiles])if(restored.projectiles.includes(v))e.stepProjectile(v,C.STEP);assert.equal(restored.projectiles.length,0,id);
 }
 const a=arena('A04',8);a.u.ranks.AP01=8;a.fire();const p=C.defaults();p.saved=a.b;assert.equal(C.validate(plain(p)).saved.volley.remaining,5);
 const b=arena('M09');place(b,'M09',700);place(b,'M09',900);b.u.arrivalGuard=b.b.round;const saved=C.defaults();saved.saved=b.b;assert.equal(C.validate(plain(saved)).saved.stakes.length,2);
});
test('삼재파 records actual launch and two terrain contacts, preview matches',()=>{
 const a=arena('M12',8);a.b.terrain.push({id:'wall',x:950,y:1300,w:30,h:500,mat:'rock',hp:99999,maxHp:99999},{id:'roof',x:0,y:1300,w:980,h:30,mat:'rock',hp:99999,maxHp:99999});a.b.sceneVersion++;const pr=a.e.predict(a.u,C.SKILLS.M12,30,.65);a.fire(30,.65);a.run();const fx=a.events.find(e=>e.name==='skillGeometry');assert(fx);assert.equal(pr.contacts.length,2);assert.deepEqual(JSON.parse(fx.text).points,plain(pr.geometry.points));
});
test('migration preserves XP/stats and unrelated allocations; repeated load is idempotent',()=>{
 const p=C.defaults();for(const cls of ['archer','mage']){delete p.heroes[cls].skillRevision;p.heroes[cls].xp=C.xpAtLevel(15);p.heroes[cls].kills=22;p.heroes[cls].damage=12345;p.heroes[cls].ranks={[C.baseSkill(cls)]:8,[cls==='archer'?'A10':'M09']:7};}const other=plain([p.heroes.knight,p.heroes.occultist]);p.honroBattle=arena().b;delete p.honroBattle.skillRevision;for(const cls of ['archer','mage']){p.honroBattle.heroes[cls]=plain(p.heroes[cls]);}
 C.migrateSkills(p);for(const cls of ['archer','mage']){assert.deepEqual(plain(p.heroes[cls].ranks),{[C.baseSkill(cls)]:1});assert.equal(p.heroes[cls].kills,22);assert.equal(p.heroes[cls].damage,12345);assert.equal(C.pointsLeft(p.heroes[cls],cls),31);}assert.deepEqual(plain([p.heroes.knight,p.heroes.occultist]),other);p.heroes.archer.ranks.A14=1;C.migrateSkills(p);assert.equal(p.heroes.archer.ranks.A14,1);assert.equal(C.validate(plain(p)).heroes.archer.ranks.A14,1);
});
test('enemy/NPC loadouts use frozen legacy definitions, Stage 1–10 construct',()=>{
 for(let id=1;id<=10;id++){const p=C.defaults();p.recruited=g.HonroStageRules.stageParty(id);const b=g.HonroWorld.build(g.HONRO_CONTENT.stages[id-1],p,false,'archer','A01');const e=new C.Engine(b);for(const u of b.units.filter(u=>u.side!==0))assert(u.loadout.every(id=>!C.SKILLS[id].redesigned));}
 assert.equal(C.SKILLS.LA02.mode,'pierce');assert.equal(C.SKILLS.LM09.mode,'wall');
});
test('specialization ties do not stack, and 기해 grows focus and regeneration',()=>{
 const a=arena('A14');a.u.ranks={A01:1,A14:2,A11:2,AP05:8,AP04:1};assert.equal(C.mainBranch(a.u),null);a.u.ranks.A14=3;assert.equal(C.specialty(a.u,C.SKILLS.A14),8);assert.equal(C.specialty(a.u,C.SKILLS.A11),0);
 const h=C.freshHero('mage'),before=C.heroStats(h,'mage');h.ranks.MP02=8;const after=C.heroStats(h,'mage');assert(Math.abs(after.mp/before.mp-1.24)<.015);assert.equal(after.regen-before.regen,4);
});
test('legacy mage child caps retain their historical values after alias migration',()=>{
 const a=arena(),enemy=a.foe();enemy.attack=1;enemy.combatBaseAttack=1;const p={...a.fire(),owner:enemy.id,side:1,skill:'LM13',mode:'meteor',child:true,damage:1000};a.u.shield=0;const hp=a.u.hp;a.e.hurt(a.u,1000,enemy.id,false,p,p);assert.equal(hp-a.u.hp,160);
});
test('every redesigned active casts and resolves at Lv.1 and Lv.8',()=>{
 for(const s of Object.values(C.SKILLS).filter(s=>s.redesigned&&!s.passive))for(const r of [1,8]){const a=arena(s.id,r);for(let i=0;i<8;i++)a.foe(950+i*55);a.fire(40,.65);if(s.id==='A09')a.e.turnArrow({x:1200,y:1600});a.run(15);assert.equal(a.b.projectiles.length,0,`${s.id} Lv${r}`);assert(a.b.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.x)));}
});
await mkdir('_local/reports/skill-redesign',{recursive:true});await writeFile('_local/reports/skill-redesign/unit.json',JSON.stringify({results},null,2));if(results.some(r=>!r.pass))process.exitCode=1;
