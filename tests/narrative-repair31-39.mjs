import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
// Actual event/campaign/story/outcome functions; controlled state/DOM/physics.
// No ordinary-input full mission or browser rendering is claimed here.
const read=f=>readFile(f,'utf8'),copy=x=>JSON.parse(JSON.stringify(x));
const seeds=JSON.parse(await read('shared/data/act4/reviewed.json'));
const cases=[],P={},node={hidden:true,visible:true,getClientRects(){return this.visible?[{}]:[];},checkVisibility(){return this.visible;},setAttribute(){},replaceChildren(){},append(){},parentElement:{append(){}}};
class Scene{};Object.assign(Scene.prototype,{landmark(){},render(){},background(){},liveWater(){}});
class App{
 mount(){}persist(){this.persistCount=(this.persistCount||0)+1;}checkMission(){}selectHero(){}
 canInput(){return !this.dialogue&&!this.done&&!this.modal.classList.contains('open');}
 frame(){if(this.engine.b.phase==='won'&&!this.dialogue)this.outcome();}
}
const g={HonroAct4TerrainPreview:P,HONRO_CORE:{},HONRO_ACT4_PREVIEW_SEEDS:seeds,HONRO_ACT4_REVIEWED:seeds,HonroScene:Scene,HONRO_APP_READY:{then(){}},document:{hidden:false,getElementById:id=>id==='banter'?{hidden:true,parentElement:{append(){}}}:id==='act4-banter'?node:null,addEventListener(){},createElement:()=>({}),createTextNode:text=>text,querySelector:()=>null},HonroStory:{start(app,lines,options){if(!lines.length)return false;app.dialogue={...options,lines,index:options?.index||0};return true;}},innerWidth:1440};
vm.createContext(g);
for(const f of ['act4-events','act4-coast-events'])vm.runInContext(await read('shared/runtime/'+f+'.js'),g);
function make(n){
 const app=new App(),hero={id:'archer',name:'설오',cls:'archer',side:0,hp:100,dead:false,x:3500,y:1735,acted:false};
 const b={session:'fixture-'+n,honroAct4Official:1,honroAct4Preview:n,honroStage:n,phase:'aim',side:0,units:[hero],projectiles:[],volley:null,terrain:[],honroState:{},honroAct4Design:{},damageSequence:47};
 Object.assign(app,{engine:{b,active:hero,grounded:()=>true,unit:id=>b.units.find(u=>u.id===id)},dialogue:null,modal:{classList:{contains:()=>false}},scene:{x:3500,y:1800,scale:.94,canvas:{clientWidth:1440,clientHeight:900}},stage:{id:n,name:'fixture',act:4,outro:[]},screen:'battle',canSpeak:()=>true,profile:{equipment:{runId:'fixture'},heroes:{archer:{xp:987,sp:12}},cleared:{30:{visits:2}},record:[],recruited:[],honroFlags:{},honroAct4:{runId:'fixture',completed:{32:{success:true,sentinel:7}}}}});
 return app;
}
const event=(q,key)=>q.events[key]??={started:true,terminal:true,presented:[],retired:[]};
function dismiss(app){app.dialogue=null;P.observe(app,0);}
function bark(app,key){const q=P.previewMemory(app.engine.b);q.events[key]={started:true,terminal:false,presented:[],retired:[]};q.bark={key,index:0,elapsed:0,lines:copy(seeds.scenes.find(s=>s.stage===app.engine.b.honroStage&&s.event===key).lines)};return q;}
const a31=make(31),q31=bark(a31,'second_bank');event(q31,'arrival');
P.observe(a31,.03);assert.equal(q31.boat.phase,'waiting');assert.equal(q31.events.boat_approach.started,false);
q31.bark=null;event(q31,'second_bank').terminal=true;P.observe(a31,.03);
assert.equal(q31.boat.phase,'approach');assert.equal(a31.dialogue.lines[0][2].act4PreviewRow,'A4.S31.BOAT.01');assert.equal(q31.receipts.includes('A4.S31.BOAT.01'),false);
const saved31=P.snapshot(a31);assert.equal(saved31.honroAct4PreviewState.reader.cursor,0);assert.equal(saved31.honroAct4PreviewState.reader.ids[0],'A4.S31.BOAT.01');
cases.push('31 overlapping MID cannot advance waiting boat before BOAT is accepted; accepted reader snapshot/cursor preserved, no invented receipt');
for(const phase of ['approach','docked']){
 const app=make(31),q=bark(app,'second_bank');event(q,'arrival');q.boat={phase,x:phase==='docked'?6470:2200};const start=q.boat.x;
 P.observe(app,.03);assert.equal(q.boat.x,start);assert.equal(q.events.boat_approach.started,false);
 q.bark=null;event(q,'second_bank').terminal=true;P.observe(app,0);assert.equal(app.dialogue.lines[0][2].act4PreviewRow,'A4.S31.BOAT.01');assert.equal(q.boat.x,start);
 dismiss(app);assert(q.events.boat_approach.terminal);
 if(phase==='docked'){assert.equal(app.dialogue.lines[0][2].act4PreviewRow,'A4.S31.BOARD.01');dismiss(app);assert(q.events.board_ready.terminal);}
 const profile=copy(app.profile);for(let i=0;i<3;i++)P.observe(app,0);assert.equal(app.dialogue,null);assert.deepEqual(app.profile,profile);assert.equal(app.engine.b.damageSequence,47);
}
cases.push('31 old approach/docked missing BOAT offers recover once at same boat position; docked BOARD retry and completed events do not replay');
{
 const app=make(31),q=P.previewMemory(app.engine.b);event(q,'arrival');event(q,'boat_approach');event(q,'board_ready');q.boat={phase:'docked',x:6470};Object.assign(app.engine.active,{x:6400,y:1860});
 bark(app,'second_bank');assert.equal(P.interact(app),false);q.bark=null;assert.equal(P.interact(app),true);assert.equal(q.complete,true);
 const original=copy(app.profile);P.observe(app,0);assert.deepEqual(app.profile,original);
}
cases.push('31 boarding cannot close while a live caption is pending; completed event/profile records retained');
// Install the real campaign wrapper over the actual App.outcome method.
g.G=g;g.C={};g.H={hero:{}};g.esc=String;
Object.assign(g,{HonroEncounters:{finishNarrative(){}},HonroStoryContent:{scene:(_id,_title,lines)=>lines},HonroSodanWithdrawal:{prepareWorldOutro(){},outro:(_b,lines)=>lines},HonroProgression:{syncRoster(){}},HonroSplitCampaign:{outcome(){}},HonroEquipment:{capture(){},observe(){}},HonroClearReportUI:{summary:()=>''},HonroInteractions:{refresh(){},key(){}},HonroAct4Content:{enabled:true,active:b=>b?.honroAct4Official===1,state:p=>p.honroAct4}});
const main=await read('shared/runtime/main.js'),start=main.indexOf('        outcome(afterStory=false) {'),end=main.indexOf('\n        battleHelp(',start);
vm.runInContext('globalThis.testOutcome={'+main.slice(start,end)+'}.outcome',g);App.prototype.outcome=g.testOutcome;
g.HonroApp=make(39);vm.runInContext(await read('shared/runtime/act4-campaign.js'),g);
vm.runInContext(await read('shared/runtime/story.js'),g);
function rescueApp(){
 const app=make(39),b=app.engine.b,q=P.previewMemory(b),ids=[0,1,2,3].map(i=>'a4-rescue-'+i);Object.assign(b.units[0],{x:8500,y:1700});
 for(const id of ids)b.units.push({id,side:2,hp:100,dead:false,honroAct4Resident:true,x:8500,y:1700});
 b.honroAct4Design={rescue:{anchor:{x:0,y:0},net:{x:0,y:0},ids,safeX:ids.map(()=>8500),safeZone:{x1:8000,x2:9000,y1:1600,y2:1800},exit:8500}};
 Object.assign(q,{exitStable:{sourceRun:'fixture'},netOpen:{},rescued:{ids}});b.honroReport={final:{}};
 Object.assign(app,{cancelInput(){},recruit(){},open(_html,kind){this.resultModal=kind;}});return app;
}
{
 const app=rescueApp(),q=bark(app,'hand'),b=app.engine.b;
 assert.equal(P.interact(app),false);assert.equal(b.phase,'aim');assert.equal(q.complete,false);
 P.observe(app,.03);assert(q.receipts.includes('A4.S39.HAND.01'));assert.equal(P.interact(app),false,'receipt alone cannot finish caption');
 node.visible=false;const elapsed=q.bark.elapsed;P.observe(app,5);assert.equal(q.bark.elapsed,elapsed);assert.equal(P.interact(app),false);
 node.visible=true;g.document.hidden=true;P.observe(app,5);assert.equal(q.bark.elapsed,elapsed);g.document.hidden=false;
 const snap=P.snapshot(app);assert.equal(snap.honroAct4PreviewState.bark.elapsed,elapsed);assert.equal(snap.honroAct4PreviewState.bark.index,0);
 app.engine.b=copy(snap);for(let i=0;i<70&&P.narrativePending(app.engine.b);i++)P.observe(app,.06);
 assert.equal(P.narrativePending(app.engine.b),false);assert(app.engine.b.honroAct4PreviewState.events.hand.terminal);assert.equal(P.interact(app),true);
 app.outcome();assert.equal(app.done,true);assert.equal(app.resultModal,'result');assert.equal(app.profile.heroes.archer.xp,987);assert.equal(app.profile.heroes.archer.sp,12);assert.equal(app.profile.cleared[30].visits,2);assert.equal(app.profile.honroAct4.completed[32].sentinel,7);
}
cases.push('39 cannot win on a mere HAND receipt; invisible/hidden time does not advance; snapshot elapsed/cursor resumes naturally then actual wrapped App.outcome succeeds');
for(const pending of ['hand','tide_warning']){
 const app=rescueApp(),q=bark(app,pending),b=app.engine.b;q.complete=true;b.phase='won';const before=copy(app.profile);
 app.outcome();assert.equal(app.done,undefined);assert.equal(app.resultModal,undefined);assert.deepEqual(app.profile,before,'blocked result cannot write completion/growth');
 // Real campaign frame prefix continues observing a won battle until its
 // pending bark naturally closes, then invokes actual base outcome exactly once.
 for(let i=0;i<100&&!app.done;i++)app.frame(i*60);
 assert.equal(app.done,true);assert.equal(app.resultModal,'result');assert.equal(q.bark,null);assert.equal(q.events[pending].terminal,true);
}
cases.push('old won+complete saved battles wait for HAND or another pending caption at real campaign outcome/frame boundary; completed profile untouched until delivery ends');
{
 const app=rescueApp(),q=bark(app,'tide_warning'),b=app.engine.b;q.hand={completed:true,actor:'archer'};q.observed={hand:0};q.complete=true;b.phase='won';
 P.observe(app,.03);assert.equal(q.events.hand?.started,false);assert.equal(P.narrativePending(b),true);
 const saved=P.snapshot(app);app.engine.b=copy(saved);const restored=app.engine.b.honroAct4PreviewState;
 for(let i=0;i<150&&P.narrativePending(app.engine.b);i++)P.observe(app,.06);
 assert.equal(restored.events.hand.started,true);assert.equal(restored.events.hand.terminal,true);assert.equal(restored.receipts.filter(id=>id==='A4.S39.HAND.01').length,1);assert.equal(P.narrativePending(app.engine.b),false);
 const receipts=copy(restored.receipts);for(let i=0;i<5;i++)P.observe(app,.06);assert.deepEqual(Array.from(restored.receipts),receipts);
}
cases.push('legacy observed hand rejected by another caption is recovered after actors leave the hand window, including won save; once-only receipts and terminal state preserved');
const files=['shared/runtime/act4-events.js','shared/runtime/act4-coast-events.js','shared/runtime/act4-campaign.js','shared/runtime/main.js','shared/runtime/story.js'];
const dir='_local/reports/narrative-repair31-39';await mkdir(dir,{recursive:true});await writeFile(dir+'/summary.json',JSON.stringify({scope:'Targeted real-function VM/state/DOM fixture; not browser or normal-input full mission',cases,sourceSha256:Object.fromEntries(await Promise.all(files.map(async f=>[f,createHash('sha256').update(await readFile(f)).digest('hex')]))),pass:true},null,2)+'\n');console.log(cases.join('\n'));
