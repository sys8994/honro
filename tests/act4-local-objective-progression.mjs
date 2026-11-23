import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const pages=path.resolve(process.argv[2]??path.join(HERE,'..'));
const mode=process.argv[3]??'candidate';
const base=path.resolve(HERE,'../shared/runtime');
const read=p=>JSON.parse(fs.readFileSync(path.join(pages,p),'utf8'));
const manifest=read('web/manifest.json'), entry=fs.readFileSync(path.join(pages,manifest.gameEntry),'utf8');
const seedPath=manifest.files.map(f=>f.path).find(f=>/^web\/data\/HONRO_ACT4_PREVIEW_SEEDS\.[a-f0-9]+\.json$/.test(f));
assert.ok(seedPath,'active Act4 preview seeds');
const seeds=read(seedPath);
const campaign=read(manifest.project);
assert.ok(entry.includes(manifest.project), 'game entry binds active campaign');
const maps=Object.fromEntries([31,32,35,36,40].map(n=>[n,read(campaign.stages[n-1])]));
for(const [n,m] of Object.entries(maps))assert.equal(m.id,'stage-'+n);
const records=[];
function caseFor(n){
 const map=maps[n],copy=x=>JSON.parse(JSON.stringify(x)),d=copy(map.design.act4);
 const customDoc={hidden:false,getElementById(){return null},createElement(){return{setAttribute(){}}},addEventListener(){}};
 class Scene{landmark(){} render(){} background(){} storyFocusPoint(){}}
 const scene=new Scene(); Object.assign(scene,{x:500,y:500,scale:0.1,canvas:{clientWidth:1600,clientHeight:900}});
 const heroes=['archer','knight','mage','occultist'].map((cls,i)=>({id:cls,cls,x:200+i*75,y:1000,side:0,hp:100,grounded:true,maxMove:100,moveLeft:40}));
 const u0=n===40?map.units.find(u=>u.id==='final40-tide-keeper-1'):map.units.find(u=>u.team==='enemy');
 const u1=n===40?map.units.find(u=>u.id==='final40-dock-left-2'):u0;
 assert.equal(u0.team,'enemy');assert.equal(u1.team,'enemy');
 const oldEnemy={id:u1.id,x:u1.x,y:u1.y,side:1,hp:100,h:88,r:30};
 const speaker={id:'a4-shelter-speaker',x:d.coords?.shelterX??3000,y:d.coords?.speakerY??900,side:2,hp:100,honroAct4Sheltered:true};
 const residents=(n===40?map.units.filter(u=>u.id.startsWith('a4-rescue-')).map(u=>({id:u.id,x:u.x,y:u.y,hp:100,side:2,grounded:true,honroAct4Resident:true})):[]);
 const terrain=map.terrains.map(t=>({id:t.id,oneWay:t.oneWay}));
 const b={honroAct4Design:d,honroStage:n,honroAct4Preview:n,honroAct4Official:1,session:'native-fixture-'+n,honroAct4ReviewRunId:'fixture-run',side:0,mode:'campaign',round:1,phase:'aim',units:[...heroes,oldEnemy,...residents,...n===32?[speaker]:[]],terrain,projectiles:[],volley:null,sceneVersion:0};
 const engine={b,active:heroes[0],grounded:u=>u.grounded!==false,unit:id=>b.units.find(u=>u.id===id),settleBusy:()=>false,walk(u,dir,dt){u.x+=dir*dt*180;return true},contactSurface:()=>null};
 const profile={state:{runId:'fixture-run',completed:{}}}; 
 class App{
  canInput(){return true} persist(){this.persistCount=(this.persistCount||0)+1;return true} checkMission(){return false} outcome(){return true} frame(){} mount(){} canSpeak(){return true}
 }
 const app=Object.assign(new App(),{engine,profile,scene,stage:{name:map.name,goal:''},screen:'battle',root:{querySelector:()=>({append:()=>{}})},modal:{classList:{contains:()=>false}}});
 const globals=vm.createContext({console,HONRO_ACT4_PREVIEW_SEEDS:seeds,HonroAct4TerrainPreview:{launch(){}},HONRO_CORE:{terrainSurfaces:()=>[],equipmentActor:()=>true},HonroScene:Scene,document:customDoc,innerWidth:1440,HonroApp:app,HonroStory:{start(app,lines,d){app.dialogue={...d,lines,index:0}}},HonroAct4Content:{enabled:true,active:b=>b.honroAct4Official===1,state:p=>p.state},HonroProfileStore:{compactBattleArt:b=>b},HonroProgression:{syncRoster(){}},HonroEquipment:{capture(){},observe(){}},HonroObjectiveGuide:{hostileHint:(b,units,text)=>({text,targets:units.map(u=>({id:u.id}))})},HonroTerrain:{separated:()=>true},HonroObjectives:{help(){}},HonroInteractions:{key(){return false},refresh(){}}});
 for(const file of ['act4-events.js','act4-coast-events.js','act4-campaign.js']){
  const src=path.join(base,file);
  vm.runInContext(fs.readFileSync(src,'utf8'),globals,{filename:file});
 }
 const P=globals.HonroAct4TerrainPreview, api=P.eventAPI;let q=P.previewMemory(b);
 function place(x,y){heroes.forEach((u,i)=>{u.x=x+i*34;u.y=y;u.grounded=true;u.acted=false;});}
 function witness(name){q.observed??={};q.observed[name]=q.clock;}
 function done(key,skip=true){q.events[key]={started:true,terminal:true,skipped:skip,presented:[],retired:[]};}
 function close(natural=false){assert(app.dialogue);P.finishReader(app,app.dialogue,natural);app.dialogue=null;}
 function press(){return globals.HonroInteractions.key(app,{code:'KeyE',repeat:false,preventDefault(){}});}
 function observe(dt=.06){P.observe(app,dt);}
 function saveResume(){const out=P.snapshot(app,{compactArt:true});b.honroAct4PreviewState=out.honroAct4PreviewState;q=P.previewMemory(b);return q;}
 function assertWon(){assert.equal(press(),true);assert.equal(app.checkMission(engine),true);assert.equal(b.phase,'won');assert.equal(oldEnemy.hp,100);assert(b.units.includes(oldEnemy));assert(app.persistCount>0);records.push({n,phase:b.phase,survivor:oldEnemy.id,profileSaved:!!profile.honroBattle});}
 function local(x,y){const o={...oldEnemy,id:'actual-local-threat',x,y};b.units.push(o);return o;}
 function sendAway(o){o.x=oldEnemy.x+100;o.y=oldEnemy.y-70;assert.equal(o.hp,100);}
 return {map,d,b,q,app,engine,P,api,heroes,oldEnemy,u0,speaker,residents,place,witness,done,close,press,observe,saveResume,assertWon,local,sendAway};
}
if(mode==='base'){
 const flags=[];
 for(const n of [31,32,35,36,40]){
  const t=caseFor(n),{b,d,q,place,observe,done,witness,heroes,engine,oldEnemy,press}=t;
  assert.equal(oldEnemy.hp,100);
  if(n===31){done('arrival');place(d.boarding.approachX,d.boarding.deckY-330);observe();assert.equal(q.boat.phase,'waiting');}
  if(n===32){place(d.coords.shelterX,d.coords.speakerY);observe();assert.equal(q.shelterDoor,undefined);}
  if(n===35){place(d.coords.completeX+15,d.exit.y);assert.equal(press(),false);}
  if(n===36){place(d.coords.doorPushX-34,d.coords.doorPushY);engine.active=heroes[1];assert.equal(press(),false);}
  if(n===40){b.honroFinalDefenseRevision=2;place(2500,2250);witness('return-boat');witness('return-high');observe();assert.equal(q.returnEscort,undefined);}
  assert.equal(b.phase,'aim');
  flags.push({n,status:'blocked with distant surviving enemy',survivor:oldEnemy.id});
 }
 console.log(JSON.stringify({mode,cases:flags},null,2));
 process.exit(0);
}
{
 const t=caseFor(31), {b,d,q,observe,place,P,press,done,local,sendAway,heroes}=t,p=d.boarding;
 done('arrival');observe();assert.equal(q.boat.phase,'waiting','unscouted shore cannot summon boat');
 place(p.approachX,p.deckY-330);const blocker=local(p.boardX1,p.deckY);observe();assert.equal(q.boat.phase,'waiting','local arrival lane occupied');
 if(mode!=='base')assert.deepEqual(P.questGuidance(t.app).targets.map(o=>o.id),[blocker.id]);sendAway(blocker);
 observe();assert.equal(q.boat.phase,'approach','remote survivors must not stop the boat');
 t.close();observe(30);assert.equal(q.boat.phase,'docked');assert(b.terrain.some(o=>o.id==='a4-boat-deck'));t.close();
 place(p.boardX1+50,p.deckY);heroes[3].x=p.boardX1-4;assert(!press(),'not all aboard');heroes[3].x=p.boardX1+155;
 blocker.x=p.boardX1;blocker.y=p.deckY;assert(!press(),'occupied berth');sendAway(blocker);
 t.assertWon();assert(b.honroAct4FactEvents.some(r=>r.eventId==='eq_se_t3b'));
}
{
 const t=caseFor(32),{b,d,q,speaker,place,observe,done,witness,local,sendAway,press,engine,P}=t,c=d.coords;
 place(c.shelterX-140,c.speakerY);
 const guard=local(c.shelterX-160,c.speakerY);observe();assert(!q.shelterDoor,'shelter must remain closed under local threat');
 sendAway(guard);
 const residue=b.fields=[{x:550,y:300,kind:'retained'}];const minion={id:'retained-summon',side:0,summoned:true,hp:1,x:500,y:300};b.units.push(minion);
 observe();assert.equal(q.shelterDoor.phase,'opening','distant survivors must not block reunion');assert(b.fields===residue&&b.units.includes(minion));assert(!q.shelterTravel,'no movement exemption during surviving combat');
 witness('door-open'); observe(1);assert.equal(q.shelterDoor.phase,'open');assert(!speaker.honroAct4Sheltered);
 speaker.x=c.doorX;witness('threshold');observe();q.reunionObserved={npc:speaker.id,hero:'archer',sourceRun:b.session};observe(1);assert.equal(q.reader.key,'reunion');t.close();
 observe();assert.equal(q.reader.key,'missing_four');assert(!press());t.close();q.events.missing_four.presented.push('A4.S32.MISSING.01');observe();assert.equal(q.safeSeven.ids.length,7);
 const resumed=t.saveResume();assert.equal(resumed.safeSeven.ids.length,7);place(d.exit.x-170,d.exit.y);
 guard.x=c.shelterX-100;guard.y=c.speakerY;assert(!press(),'unsafe local exit');sendAway(guard);t.assertWon();
 assert.equal(resumed.completionProof.safeSeven.ids.length,7);assert(b.fields===residue&&b.units.includes(minion));
}
{
 const t=caseFor(35),{b,d,place,press,heroes,local,sendAway}=t,c=d.coords;place(c.completeX+15,d.exit.y);
 heroes[3].grounded=false;assert(!press(),'not everyone on the exit shelf');heroes[3].grounded=true;
 b.projectiles.push({owner:t.oldEnemy.id});assert(!press(),'not resolved');b.projectiles.length=0;
 b.volley={};assert(!press(),'pending volley still blocks exit');b.volley=null;
 const blocker=local(c.completeX+15,d.exit.y);assert(!press(),'actual exit still under threat');sendAway(blocker);t.assertWon();
}
{
 const t=caseFor(36),{b,d,q,place,local,sendAway,done,press,observe,heroes,engine}=t,c=d.coords;place(c.doorPushX-34,c.doorPushY);engine.active=heroes[1];
 const blocker=local(c.doorPushX,c.doorPushY);assert(!press(),'guard still at hinge');sendAway(blocker);assert(press());assert.equal(q.door.phase,'falling');
 done('arrival');observe(1);assert.equal(q.door.phase,'fallen');assert(q.door.soundAt!==undefined);q.door.renderedAt=q.clock;
 observe(3);assert.equal(q.reader.key,'door_falls');t.close(true);
 place(c.leaveX+30,c.doorPushY);assert(!press(),'door still unread');q.receipts.push('A4.S36.DOOR.01','A4.S36.DOOR.02');q.events.door_falls.presented.push(...q.receipts);
 observe(3);assert.equal(q.reader.key,'leave');t.close();
 const resumed=t.saveResume();assert.equal(resumed.door.phase,'fallen');blocker.x=c.leaveX+120;blocker.y=c.doorPushY;assert(!press(),'exit itself still blocked');sendAway(blocker);t.assertWon();
}
{
 const t=caseFor(40),{b,d,q,place,local,sendAway,witness,observe,residents,engine,press,P}=t,g=d.geometry40;assert(g);
 b.honroFinalDefenseRevision=2;b.honroSurfaceZones=[];
 const boss=local(t.u0.x,t.u0.y);boss.id=t.u0.id;boss.honroAct4FinaleBoss=true;
 place(2000,3370);witness('return-boat');witness('return-high');observe();assert(q.tide.started&&q.tide.phase==='rising');assert(!q.returnEscort,'not safe to board before active tide window');assert.equal(d.waterPolicies.find(o=>o.id==='40-return-inlet').surface,d.tide.high);assert(d.geometry40.deck.y>d.tide.high+35);
 b.round=q.tide.highRound;observe();assert.equal(q.tide.phase,'high');assert(!q.returnEscort,'open route trigger still waits on actual high tide');
 place(2250,2200); b.round=q.tide.lowRound;observe();assert(q.tide.finished);
 place(2500,2250);
 const threat=local(residents[0].x+100,residents[0].y);observe();assert(!q.returnEscort,'actual resident safety enforced');sendAway(threat);
 observe();assert.equal(q.returnEscort.phase,'boarding','escort starts with boss and distant enemies alive');assert.equal(boss.hp,100);
 assert.equal(d.waterPolicies.find(o=>o.id==='40-return-inlet').surface,d.tide.low);t.close();
 const r=q.returnEscort;t.saveResume();assert.notEqual(P.previewMemory(b).returnEscort,r,'old existing serialized route state still resumes');
 const q2=P.previewMemory(b),r2=q2.returnEscort;r2.phase='landed';r2.boatX=d.escort.boat.destination;
 for(const [i,u] of residents.entries()){const route=i<2?g.passengerRoutes[i]:g.highRoutes[i-2];Object.assign(u,route.at(-1));r2.routes[(i<2?'land':'high')+i]={index:route.length,done:true};}
 observe();assert.equal(q2.returnEscort.phase,'safe');assert.equal(q2.rescued.ids.length,4);place(4890,1900);
 assert(!press(),'reunion still required');t.done('next');t.assertWon();
 assert.equal(q2.completionProof.rescued.ids.length,4);assert(b.honroAct4FactEvents.some(o=>o.eventId==='eq_so_t3b'));assert.equal(boss.hp,100);
}
{
 const t=caseFor(40),{d,q,place,witness,observe,b,P,heroes,engine}=t;
 b.honroFinalDefenseRevision=2;b.honroSurfaceZones=[];
 const boss=t.local(t.u0.x,t.u0.y);boss.id=t.u0.id;boss.honroAct4FinaleBoss=true;
 const inlet=d.waterPolicies.find(z=>z.id==='40-return-inlet'),deck=d.geometry40.deck;
 observe();assert.equal(inlet.surface,d.tide.high);assert.equal(q.tide.started,undefined);
 place(2500,2250);witness('return-boat');witness('return-high');observe();
 assert.equal(q.returnEscort.phase,'boarding','upper route before any tide starts');
 assert.equal(q.tide.started,undefined);assert.equal(q.tide.finished,true);
 assert.equal(inlet.surface,d.tide.low,'physical policy must be low in the SAME observer turn, not the rendering value only');
 assert.equal(q.tide.surface,d.tide.low);assert(deck.y<inlet.surface);
 t.close();
 const h=heroes[0]; h.x=d.escort.boat.x;h.y=deck.y;const hp=h.hp;P.coast.water(engine,0.05);
 assert.equal(h.hp,hp);assert.equal(h.honroAct4Recovering,undefined);assert.equal(h.y,deck.y);
 assert.equal(q.water.dry[h.id].y,deck.y,'native water reader sees the deck as dry');
 const saved=t.saveResume();assert.equal(saved.returnEscort.phase,'boarding');
 // A legacy checkpoint with an accepted escort and never-started tide can
 // contain stale high collision policy. Repair it at the first native tick.
 Object.assign(saved.tide,{phase:'low',finished:false});inlet.surface=d.tide.high;
 place(2040,3370);P.coast.tide(b);
 assert.equal(inlet.surface,d.tide.low,'legacy no-tide escort checkpoint repairs stale high collision water');
 assert.equal(saved.tide.started,undefined);assert.equal(boss.hp,100);
}
{
 const t=caseFor(40),{d,q,place,residents,witness,observe,b}=t;
 b.honroFinalDefenseRevision=2;place(2500,2250);witness('return-boat');witness('return-high');
 residents[0].hp=0;observe();assert.equal(q.failure,'rescue-casualty');assert(!q.returnEscort);assert.equal(b.phase,'lost');
}
console.log(JSON.stringify({mode,authority:manifest.gameEntry,scope:'Native events and official KeyE/quest/completion/save dispatch, with controlled DOM/locomotion and exact shipped stage design; not a browser playthrough',cases:records,upperNoTide:'Same-observer physical policy low, exact deck above surface, stale-high old checkpoint repaired with boss alive',negatives:'Local threats, pending volley, wrong/missing physical or narrative step, rescue casualty; tide expires with surviving tidekeeper and survivor.'},null,2));
