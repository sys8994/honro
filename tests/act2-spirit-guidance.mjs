/** Focused, isolated dialogue controls. No normal-play or browser completion claim. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFile} from 'node:fs/promises';
const {buildCore}=await import(pathToFileURL(path.resolve('game/engine/build.mjs')));
const g=vm.createContext({console,performance,structuredClone});
vm.runInContext(await buildCore(),g);
const C=g.HONRO_CORE,key='act2:first-spirit-encounter',plain=value=>JSON.parse(JSON.stringify(value));
g.HONRO_CONTENT={stages:[],hero:{}};g.HonroWorld={archetypes:{}};
g.HonroAct2Plan={forStage:()=>({})};
g.HonroStory={queue(app,lines){app.dialogue={lines};app.queues++;},save(app){app.saves++;}};
vm.runInContext(await readFile(process.env.HONRO_SPIRIT_SOURCE||'shared/runtime/act2.js','utf8'),g);
function scene(){
 const p=C.defaults();p.recruited=['archer','mage','knight','occultist'];p.seen={};
 const b=C.createBattle(1,p,'practice',{party:['archer','occultist'],wind:0});
 Object.assign(b,{honroStage:11,honroAct2Revision:2,honroNarrativeRevision:1,honroAct2Steps:[],honroState:{},honroMarkers:[],round:45,phase:'aim',side:0});
 const sodan=C.makeUnit('occultist',0,1000,970,{id:'p-occultist',name:'소단',hp:784,maxHp:784,focus:230,maxFocus:230,loadout:['O01','O06','O02','O03'],ranks:{O01:1,O06:3,OP01:1,OP02:1,OP03:1,OP04:1,O02:4,O11:3,O03:4,O07:3}});
 const archer=C.makeUnit('archer',0,1100,970,{id:'p-archer'}),spirit=C.makeUnit('occultist',1,1300,970,{id:'resident-spirit-4',honroSpirit:true,spiritHidden:true,hp:551,maxHp:551,armor:.04,existenceDefense:{form:.06,qi:.40,soul:1.32}});
 b.units=[archer,sodan,spirit];b.active=sodan.id;
 const e=new C.Engine(b),app={engine:e,profile:p,screen:'battle',dialogue:null,queues:0,saves:0,actorBoundary:false,checkMission(){return false;}};
 return {app,b,e,p,sodan,spirit,archer};
}
const cases=[];
function run(name,mutate=()=>{},expect={}){
 const s=scene();mutate(s);
 const before=JSON.stringify({units:s.b.units,markers:s.b.honroMarkers,loadouts:s.p.loadouts,heroes:s.p.heroes});
 g.HonroAct2.tick(s.app,0);
 assert.equal(JSON.stringify({units:s.b.units,markers:s.b.honroMarkers,loadouts:s.p.loadouts,heroes:s.p.heroes}),before,name+' does not alter actors, markers, skills, resources or growth');
 if(expect.defer){assert.equal(s.app.queues,0,name);assert.equal(s.p.seen[key],undefined,name+' remains eligible for a later live encounter');}
 else{
  const lines=s.app.dialogue?.lines;assert(lines,name+' queues the encounter');
  const guide=lines.find(row=>row[0]==='안내');assert(guide,name+' has guide');
  assert.match(guide[1],/현형 없이도/);assert.equal(guide[2].guideTitle,expect.manifest||expect.lamp?'혼령과 현형':'혼령과 혼 공격');
  assert.equal(guide[1].includes('O08'),!!expect.manifest,name+' only mentions usable equipped O08');
  assert.equal(guide[1].includes('원혼등불'),!!expect.lamp,name+' only mentions a usable relevant lamp');
  if(expect.soul!==false)assert(guide[1].startsWith('소단의 '+C.SKILLS[expect.soul||'O01'].name+'('+(expect.soul||'O01')+')'),name+' leads with available soul skill');
  assert.equal(s.app.saves,1);assert.equal(s.p.seen[key],true);
  const queued=JSON.stringify(lines);s.app.dialogue=null;g.HonroAct2.tick(s.app,0);assert.equal(s.app.queues,1,name+' is one-time');assert.equal(s.app.saves,1);
  cases.push({name,guide:guide[1],title:guide[2].guideTitle,queued});return s;
 }
 cases.push({name,deferred:true});return s;
}
const lamp=(s,extra={})=>s.b.honroMarkers.push({id:'spirit-lamp-0',action:'act2',x:s.spirit.x+100,y:s.spirit.y,radius:1200,...extra});
run('current chapter 11 kit without lamp');
run('equipped affordable O08',s=>{s.sodan.loadout=['O01','O06','O02','O08'];s.sodan.ranks.O08=1;},{manifest:true});
run('learned but unequipped O08',s=>{s.sodan.ranks.O08=3;s.p.heroes.occultist.ranks.O08=3;});
run('profile-only equipped O08',s=>{s.p.loadouts.occultist=['O01','O08'];s.p.heroes.occultist.ranks.O08=3;});
run('equipped but unaffordable O08',s=>{s.sodan.loadout=['O01','O08'];s.sodan.focus=0;});
run('equipped O08 on cooldown',s=>{s.sodan.loadout=['O01','O08'];s.e.cooldownLeft=(_u,id)=>id==='O08'?1:0;});
run('real relevant uncollected lamp',s=>lamp(s),{lamp:true});
run('lamp remains useful when O08 cannot be afforded',s=>{s.sodan.loadout=['O01','O08'];s.sodan.focus=0;lamp(s);},{lamp:true});
run('spent lamp',s=>lamp(s,{collected:true}));
run('decorative marker is not a usable lamp',s=>lamp(s,{action:undefined}));
run('lamp outside spirit reveal radius',s=>lamp(s,{x:s.spirit.x+1201}));
run('lamp requiring absent character',s=>lamp(s,{requiredClass:'mage'}));
run('equipped O08 takes precedence over lamp',s=>{s.sodan.loadout=['O01','O08'];lamp(s);},{manifest:true});
run('available alternative soul attack',s=>{s.sodan.loadout=['O02','O06'];},{soul:'O02'});
run('no affordable named soul skill',s=>{s.sodan.loadout=['O02','O06'];s.sodan.focus=0;},{soul:false});
const dead=run('dead Sodan defers tutorial',s=>{s.sodan.dead=true;s.sodan.hp=0;},{defer:true});
dead.sodan.dead=false;dead.sodan.hp=100;g.HonroAct2.tick(dead.app,0);assert.equal(dead.app.queues,1,'reviving Sodan allows tutorial later');
run('absent Sodan defers tutorial',s=>{s.b.units=s.b.units.filter(u=>u!==s.sodan);s.b.active=s.archer.id;},{defer:true});
run('summoned occultist cannot impersonate Sodan',s=>{s.sodan.summoned=true;},{defer:true});
// Preserve seen saves: this patch neither clears the flag nor rewrites saved scenes.
const seen=scene();seen.p.seen[key]=true;seen.b.honroStory={lines:[['소단','이미 저장된 대사']]};const savedStory=JSON.stringify(seen.b.honroStory);g.HonroAct2.tick(seen.app,0);assert.equal(seen.app.queues,0);assert.equal(JSON.stringify(seen.b.honroStory),savedStory);
console.log('PASS context-aware first spirit tutorial:',cases.length,'isolated branches plus seen-save preservation');
console.log(JSON.stringify(cases.map(({queued,...row})=>row),null,2));
