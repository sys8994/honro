import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
function pinnedSource(path, fixture, gitBlob) {
  const actual=new URL('../../../shared/runtime/'+path,import.meta.url);
  const p=process.env.HONRO_REPORT_SLICE_FIXTURE==='1'?new URL(fixture,import.meta.url):actual;
  if (!existsSync(p)) throw Error('Missing source '+p.pathname);
  const bytes=readFileSync(p);
  const blob=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  assert.equal(blob,gitBlob,'Re-review changes to pinned authoritative source');
  return bytes.toString('utf8');
}
const stock=pinnedSource('clear-report.js','./stock-clear-report.source.js','02bff7d9a30889f14ac541e511ecf65fab8f0eb7');
function create(id,{phase='won',type='campaign',enhanced=true,noncombat=false}={}){
  let settled=0;
  const g={HonroProgression:{complete(){settled++},contributionState(){return null}}};
  vm.runInNewContext(enhanced?withAct6ReportStore(stock):stock,g);
  const b={honroStage:id,round:7,phase,units:[],activeRoster:[],difficulty:'normal'};
  const profile={honroClearReports:{40:{version:1,attempt:'old-40'},48:{version:1,attempt:'old-48'}}};
  const app={screen:'battle',engine:{b,noncombatWalk:()=>noncombat},profile};
  app.debugMode=type==='debug';app.customMap=type==='custom';app.training=type==='practice';
  return {g,b,app,profile,report:g.HonroClearReport,settlements:()=>settled};
}
test('source runtime confirms baseline 51 is returned but immediately removed from campaign reports',()=>{
 const {report,app,profile}=create(51,{enhanced:false});
 assert.equal(report.finish(app).rounds,7);
 assert.equal(report.get(app,51),null);
 assert.deepEqual(Object.keys(profile.honroClearReports),['40']);
});
test('unadmitted 51 or 60 cannot settle or change a campaign profile',()=>{
 for(const id of [51,60]){
  const a=create(id),before=JSON.stringify(a.profile);
  a.g.HonroAct6ReportOwner={accepts:()=>false,canRead:()=>true};
  assert.equal(a.report.finish(a.app),null);
  assert.equal(a.settlements(),0);assert.equal(JSON.stringify(a.profile),before);
 }
});
test('authorized Act6 wins write only Act6 record; repeated finish awards once',()=>{
 for(const id of [51,60]){
  const a=create(id),before=JSON.stringify(a.profile.honroClearReports);
  const receipts=new WeakSet([a.b]);
  a.g.HonroAct6ReportOwner={accepts:(app,b)=>app===a.app&&receipts.has(b), canRead:(app,stage)=>app===a.app&&stage===id};
  const r=a.report.finish(a.app);
  assert.equal(r.rounds,7);assert.equal(a.report.finish(a.app),r);
  assert.equal(a.report.get(a.app,id),r);assert.equal(a.settlements(),1);
  assert.equal(JSON.stringify(a.profile.honroClearReports),before);
  a.g.HonroAct6ReportOwner.canRead=()=>false;
  assert.equal(a.report.get(a.app,id),null);
  assert.equal(a.report.get(a.app,40).attempt,'old-40');
 }
});
test('existing 01/40/41/50 outcomes unchanged; exact same retention and round mode as stock',()=>{
 for(const id of [1,40,41,50])for(const noncombat of [true,false]){
  const a=create(id,{noncombat}),b=create(id,{noncombat,enhanced:false});
  assert.equal(a.report.finish(a.app).rounds,b.report.finish(b.app).rounds);
  assert.deepEqual(Object.keys(a.profile.honroClearReports),Object.keys(b.profile.honroClearReports));
  assert.ok(!Object.hasOwn(a.profile,'honroAct6ClearReports'));
 }
});
test('Practice, Custom and Debug runs stay isolated even with affirmative callback',()=>{
 for(const type of ['practice','custom','debug']){
  const a=create(52,{type}),before=JSON.stringify(a.profile.honroClearReports);
  a.g.HonroAct6ReportOwner={accepts:()=>true,canRead:()=>true};
  assert.equal(a.report.finish(a.app).scope,type);
  assert.equal(a.report.get(a.app,52).scope,type);
  assert.equal(JSON.stringify(a.profile.honroClearReports),before);
  assert.ok(!Object.hasOwn(a.profile,'honroAct6ClearReports'));
 }
});
test('noncombat Act6 stays at zero rounds and time excludes dialogue',()=>{
 const a=create(60,{phase:'aim',noncombat:true});
 a.g.HonroAct6ReportOwner={accepts:()=>true,canRead:()=>true};
 a.report.begin(a.b,{fresh:true});
 a.report.time(a.app,1000);a.report.time(a.app,2250);
 a.app.dialogue={};a.report.time(a.app,3000);a.report.time(a.app,6000);
 a.app.dialogue=null;a.report.time(a.app,7000);a.report.time(a.app,7750);
 a.b.phase='won';
 const end=a.report.finish(a.app);
 assert.equal(end.rounds,0);
 assert.equal(end.seconds,2);
});
test('existing profile store can round-trip new report field without touching old data or keys',()=>{
 const a=create(51);
 const profileStoreSource=pinnedSource('profile-store.js','./stock-profile.source.js','9df69ca8a7ae3614c32bef96d89b143fd57841f8');
 const data=new Map();
 a.g.HONRO_CORE={defaults:()=>({heroes:{archer:{}}}),sanitizeLoadout(){},migrateSkills(){}};
 a.g.HonroEquipment={fresh:p=>({...p,equipment:{}}),migrate(){}};
 a.g.HonroCampaignMapRevision={discard(){}};
 Object.assign(a.g.HonroProgression,{repairRecruits(){},reconcileCampAllocations(){}});
 a.g.localStorage={get length(){return data.size},key:i=>[...data.keys()][i]??null,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 vm.runInNewContext(profileStoreSource,a.g);
 const first=a.g.HonroProfileStore.create();
 const r=first.newJourney();
 assert.equal(r.ok,true);
 a.app.profile=r.profile;a.app.profile.revision=13;
 a.app.profile.honroClearReports=JSON.parse(JSON.stringify(a.profile.honroClearReports));
 const before=JSON.stringify(a.app.profile.honroClearReports);
 a.g.HonroAct6ReportOwner={accepts:()=>true,canRead:()=>true};
 const settled=a.report.finish(a.app);
 assert.equal(first.save(a.app.profile),true);
 const cold=a.g.HonroProfileStore.create();
 assert.equal(cold.locked,false);
 assert.equal(data.size,1);
 assert.equal(JSON.stringify(cold.initial.honroClearReports),before);
 assert.equal(cold.initial.honroAct6ClearReports[51].attempt,settled.attempt);
 assert.equal(cold.initial.honroAct6ClearReports[51].rounds,7);
});

// Local prototype generated in memory, not mounted on the official app.
// The host must authorize actual battle/report owner with a current catalog receipt.
export function withAct6ReportStore(stock) {
  const before = " const scope=scopeOf(app);\n begin(b,{scope});";
  const after = " if(scope==='campaign'){\n  const records=app.profile.honroClearReports??={};records[report.stage]=report;";
  const get = "function get(app,id){const r=scopeOf(app)==='campaign'?app.profile.honroClearReports?.[id]:app.profile.honroIsolatedReports?.[scopeOf(app)+':'+id];return r?.version===VERSION?r:null;}";
  for (const [idx, expected] of [before, after, get].entries()) {
    if (stock.split(expected).length !== 2) throw Error('Unexpected report authority/source, do not mount: ' + idx + ':' + stock.split(expected).length);
  }
  return stock.replace(before, ` const scope=scopeOf(app),act6=act6Stage(b.honroStage||b.stageId);
 if(scope==='campaign'&&act6&&G.HonroAct6ReportOwner?.accepts(app,b)!==true)return null;
 begin(b,{scope});`).replace(after,` if(scope==='campaign'&&act6){
   const records=app.profile.honroAct6ClearReports??={};
   records[report.stage]=report;
 }else `+after.trimStart()).replace(get,`const act6Stage=id=>/^(?:5[1-9]|60)$/.test(String(id));
function get(app,id){
 const scope=scopeOf(app);
 let r;
 if(scope!=='campaign')r=app.profile.honroIsolatedReports?.[scope+':'+id];
 else if(act6Stage(id))r=G.HonroAct6ReportOwner?.canRead(app,id)===true?app.profile.honroAct6ClearReports?.[id]:null;
 else r=app.profile.honroClearReports?.[id];
 return r?.version===VERSION?r:null;
}`);
}
