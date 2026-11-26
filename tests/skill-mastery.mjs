import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {createChapterBoundary} from '../shared/act6-boundary/chapter-boundary.mjs';
import {sha256Boundary as hash} from '../shared/act6-boundary/boundary-sha256.mjs';

const g=await runtime({legacyMaps:false});
const C=g.HONRO_CORE;
const fixtures=JSON.parse(await readFile('shared/act6-debug-stages/fixtures.json','utf8'));
const clone=value=>JSON.parse(JSON.stringify(value));
const roster=[...C.CLASS_IDS.map(C.baseSkill),...C.TALENTS.map(t=>t.id)];

assert.equal(roster.length,84);
assert.deepEqual(Object.keys(C.MASTERY_RULES).sort(),roster.slice().sort());
assert.equal(C.MAX_LEVEL,30);
assert.equal(C.XP_CAP,455066);
assert.equal(C.xpToNext(20),21191);
assert.equal(C.xpToNext(29),47370);
assert.equal(C.pointsEarned({xp:C.xpAtLevel(19)}),39);
assert.equal(C.pointsEarned({xp:C.xpAtLevel(20)}),42);
assert.equal(C.pointsEarned({xp:C.XP_CAP}),72);
for(const id of roster){
 const skill=C.SKILLS[id],cls=skill.cls;
 const minimum=20+2*(C.TALENT_MAP[id]?.row??0),p=C.defaults(),hero=p.heroes[cls];
 const cost=C.masteryCost(id);
 if(!skill.basic){
  let previous=C.TALENT_MAP[id].prereq;
  while(previous){hero.ranks[previous]=1;previous=C.TALENT_MAP[previous].prereq;}
  hero.ranks[id]=8;
 }
 hero.xp=C.xpAtLevel(minimum-1);
 assert.equal(C.masteryLevel(id),minimum,id);
 assert.equal(C.learnMastery(hero,cls,id),false,id+' blocks one level early');
 hero.xp=C.xpAtLevel(minimum);
 const available=C.pointsLeft(hero,cls);
 hero.statTraining=available;
 assert.equal(C.learnMastery(hero,cls,id),false,id+' requires available SP');
 hero.statTraining=0;
 assert(C.learnMastery(hero,cls,id),id+' learns at its tier');
 assert.equal(C.pointsLeft(hero,cls),available-cost);
 assert.equal(C.learnMastery(hero,cls,id),false);
 assert.equal(C.untrain(hero,id),false);
 C.resetTalents(hero,cls);
 assert.equal(hero.ranks[id],skill.basic?1:8);
 assert.deepEqual(clone(C.validate(clone(p)).heroes[cls].masteries),[id]);
}
const legacy=C.defaults();
legacy.revision=13;
legacy.heroes.archer.xp=C.previousXpAtLevel(25)+500;
const migrated=C.validate(clone(legacy));
assert.equal(C.levelOf(migrated.heroes.archer),25);
assert.ok(migrated.heroes.archer.xp>=C.xpAtLevel(25));
console.log('PASS 84 tier gates, exact SP, irreversible reset, import and old XP conversion');

const progression=g.HonroProgression;
const profile=C.defaults();
profile.cleared[50]={};
for(const cls of C.CLASS_IDS)profile.heroes[cls].xp=C.xpAtLevel(27);
const totals=[0,14172,28343,47068,68993,96184,131711];
for(const [i,amount] of totals.entries()){
 const b={honroStage:51+i,mode:'campaign',honroCanonical:true,units:[],heroes:clone(profile.heroes)};
 progression.mountAct6Progress(b,profile);
 assert.equal(b.heroes.archer.xp,C.xpAtLevel(27)+amount);
 progression.mountAct6Progress(b,profile);
 assert.equal(b.heroes.archer.xp,C.xpAtLevel(27)+amount,'reconstruction pays once');
}
const injured=C.makeUnit('archer',0,50,100,{hp:130,focus:12,maxHp:500,maxFocus:99,level:27});
const b={honroStage:58,mode:'campaign',honroCanonical:true,units:[injured],heroes:clone(profile.heroes)};
progression.mountAct6Progress(b,profile,{archer:['A01']});
assert.equal(b.heroes.archer.xp,C.XP_CAP);
assert.deepEqual(clone(b.heroes.archer.masteries),['A01']);
assert.equal(injured.level,30);assert.equal(injured.hp,130);assert.equal(injured.focus,12);

const {body}=fixtures[52],base=clone(fixtures[52].profile),key='slot';
let original=JSON.stringify({...base,honroAct6ChapterBoundary:{body,sha:hash(JSON.stringify(body))}});
let raw=original,writes=0;
const store={locked:false,save(p){raw=JSON.stringify(p);writes++;return true;}};
const app={engine:{},profile:base,normalProfile:base,screen:'battle'};
const port=createChapterBoundary({slot:body.slot,key,storage:{getItem:()=>raw},locks:{request:(_n,_o,fn)=>fn()},
 normalize:JSON.parse,hash,verifyOwner:()=>false,verifyCold:()=>false,releasePin:id=>id===52?body.pin:null,
 verifyRelay54:()=>false,verifyBridge:()=>false,verifyEave:()=>false,originalProfile:()=>base,
 ownedStore:(a,w)=>a===app&&w===store,verifyMasteries:(_p,_id,picks)=>JSON.stringify(picks)==='{"archer":["A01"]}'});
assert.deepEqual(port.readMasteries(app,52),{});
const choose=(id,check=()=>true)=>port.commitMastery({app,engine:app.engine,store,to:52,expectedRaw:raw,check,cls:'archer',id});
assert.equal(await choose('A01',()=>false),false);
assert.equal(raw,original);
assert.equal(await choose('A01'),true);
assert.deepEqual(port.readMasteries(app,52),{archer:['A01']});
assert.equal(await choose('A01'),false);
assert.equal(writes,1);
const stored=JSON.parse(raw).honroAct6ChapterBoundary.body;
assert.equal(stored.custodySHA,body.custodySHA);
assert.equal(stored.terminalSHA,body.terminalSHA);
assert.deepEqual(stored.custody,body.custody);
console.log('PASS finite 6–6 progression, no refill or replay XP, bound field mastery write');

g.HonroScene=class{render(){}event(){}};
vm.runInContext(await readFile('shared/runtime/skill-preview.js','utf8'),g);
const demo={profile:C.defaults()};
const canvas={getBoundingClientRect:()=>({width:720,height:360})};
const unchanged=JSON.stringify(demo.profile);
const failures=[];
for(const id of roster){
 const h=clone(demo.profile.heroes[C.SKILLS[id].cls]);
 h.xp=C.XP_CAP;h.ranks[id]=C.SKILLS[id].basic?1:8;
 const p=g.HonroSkillPreview.setup(demo,id,h,canvas,{variant:'mastered',quiet:true});
 p.hold=true;
 for(let i=0;i<1440&&!p.metrics.masteryIds.has(id);i++)g.HonroSkillPreview.tick(demo,p,1/60);
 if(!p.metrics.masteryIds.has(id)||p.control.metrics.masteryIds.size)failures.push(id);
}
assert.equal(JSON.stringify(demo.profile),unchanged);
assert.deepEqual(failures,[],'real scenario emits only the selected mastery effect');
console.log('PASS 84 real-engine mastery previews against isolated ordinary controls');
