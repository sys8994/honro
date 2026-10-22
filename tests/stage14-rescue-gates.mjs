/** Bounded author/save/objective contracts. Prepared intermediate/terminal
 * states below are explicit fixtures, never normal-play completion evidence. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {battlefield} from '../game/tests/helpers.mjs';
import {projectAuthors} from '../shared/build.mjs';
import {authorStage14Vertical} from '../tools/map-forge/apply-stage14-vertical.mjs';
import {vertical14EntryProfile} from './stage14-vertical-entry-helper.mjs';
const h=await appHarness(),{g}=h,A=g.HonroAct2,Q=g.HonroStage14Rescue,rows=[];
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const base='1f1b267c2d23bc5975af5841c560e4413291330b',old=JSON.parse(execFileSync('git',['show',base+':shared/data/campaign.json'],{maxBuffer:80e6})),raw=JSON.parse(await readFile('shared/data/campaign.json','utf8')),oldSteps=old.stages[13].initialState.honroAct2Steps,newIds=['family-upper','family-mid','family-lower','bridge','hold-refuge','clear-village'];
for(let i=0;i<30;i++)if(i!==13)assert.deepEqual(raw.stages[i],old.stages[i],'Other chapter source unchanged '+(i+1));const expectedLibrary=plain(old.library);if(raw.stages[13].design.vertical14Finish?.shapeRevision===2){const approved=JSON.parse(execFileSync('git',['show','a70efcdd818ebf87ca1eb4826d901cb3771cd1c3:shared/data/campaign.json'],{maxBuffer:80e6})),id='stage14:vertical-cavern-depth';expectedLibrary[expectedLibrary.findIndex(a=>a.id===id)]=approved.library.find(a=>a.id===id);}assert.deepEqual(raw.library,expectedLibrary,'Only approved Stage14 rear asset may differ from pre-pacing art');
for(const key of ['terrains','environment','elements','units','events','encounters','layers','materials','anchors','routes','markers'])assert.deepEqual(raw.stages[13][key],old.stages[13][key],'Stage14 physical/art/actor source exact '+key);
assert.deepEqual(raw.stages[13].design.vertical14,old.stages[13].design.vertical14);assert.equal(raw.stages[13].design.vertical14.routes.length,17);
assert.deepEqual(raw.stages[13].initialState.honroAct2Steps,oldSteps.filter(s=>!['clear-upper','clear-middle'].includes(s.id)));
const oldProse=JSON.parse(execFileSync('git',['show',base+':shared/data/narrative-current.json'],{maxBuffer:8e6})),currentProse=JSON.parse(await readFile('shared/data/narrative-current.json','utf8'));
const beforeGuide=plain(oldProse);beforeGuide.stages[14].guide=currentProse.stages[14].guide;assert.deepEqual(currentProse,beforeGuide,'Only approved guide changes in current catalogue');
assert.equal(g.HONRO_CONTENT.stages[13].guide,currentProse.stages[14].guide);assert.deepEqual(plain(g.HONRO_CONTENT.stages[13].steps.map(s=>s.id)),newIds);assert.deepEqual(Q.author(Q.author(raw)),Q.author(raw));
let regenerated=await authorStage14Vertical(plain(raw),g,{art:false});for(const name of projectAuthors)regenerated=g[name].author(regenerated);assert.deepEqual(plain(regenerated.stages[13].initialState.honroAct2Steps.map(s=>s.id)),newIds,'Full author chain cannot restore retired gates');assert.equal(regenerated.stages[13].initialState.honroVerticalStage14Content.guide,currentProse.stages[14].guide);
rows.push({case:'source/author',otherChapters:29,stage30Preserved:true,terrainArtActorsRoutesExact:true,guideOnlyProseChange:true,authorIdempotent:true});
const out='_local/reports/stage14-rescue-gates-20261022';await mkdir(out,{recursive:true});
function fixture(prefix,{dialogue=false}={}){
 const p={...plain(g.AppRegression.fresh()),...plain(vertical14EntryProfile(g,{currentPlan:true}).profile)},q=battlefield(g,14,{profile:p}),b=q.b;delete b.honroStage14RescueRevision;b.honroAct2Steps=plain(oldSteps);b.round=20;
 for(const key of ['honroNarrativeContent','honroVerticalStage14Content'])if(b[key]){b[key].steps=plain(oldSteps);b[key].guide=oldProse.stages[14].guide;if(b[key].act2Plan)b[key].act2Plan.sequence=plain(oldSteps);}
 for(const u of b.units.filter(u=>u.side===0)){u.hp-=37;u.focus-=11;u.moveLeft-=141;}b.units.find(u=>u.id==='resident-4').hp-=23;
 const a=A.memory(b);for(const s of oldSteps.slice(0,prefix))a.done[s.id]=true;
 for(const s of oldSteps.filter(s=>s.kind==='rescue'&&a.done[s.id])){const m=b.honroMarkers.find(m=>m.id===s.id),npc=b.units.find(u=>u.id===m.target),spirit=b.units.find(u=>u.id===m.spiritId);npc.honroResolved=true;spirit.dead=true;spirit.hp=0;a.rescued.push(npc.id);m.collected=true;}
 if(a.done['hold-refuge'])a.holds={'hold-refuge':{progress:4,spawned:6,lastRound:20,guarded:true}};
 if(dialogue){q.app.screen='battle';const lines=g.HonroAct2Content.scene('act2-14-family-upper',g.HONRO_CONTENT.stages[13].name,g.HONRO_CONTENT.stages[13].beats['family-upper']);b.honroStory={lines:g.HonroStoryFraming.bind(q.app,lines,{}),index:1,title:'saved resident dialogue'};}
 p.honroBattle=plain(b);return{p,b};
}
const preserved=b=>{const c=plain(b);delete c.honroAct2Steps;delete c.honroStage14RescueRevision;for(const k of ['honroNarrativeContent','honroVerticalStage14Content'])if(c[k]){delete c[k].steps;delete c[k].guide;if(c[k].act2Plan)delete c[k].act2Plan.sequence;}return c;};
for(let prefix=0;prefix<8;prefix++){
 const {p,b}=fixture(prefix),before=preserved(b),facts=plain(A.memory(b));assert(Q.upgradeBattle(b));assert.deepEqual(preserved(b),before,'Only quest contract/prose guide changes');assert.deepEqual(plain(A.memory(b)),facts,'No removed gate/rescue/reward flag granted');assert(!Q.upgradeBattle(b));
 const expected=oldSteps.slice(prefix).find(s=>!['clear-upper','clear-middle'].includes(s.id)).id;assert.equal(A.current(b)?.id,expected,'ID-based current goal at prefix '+prefix);p.honroBattle=plain(b);
 let app=h.load(p);app.continue();assert.equal(app.engine.b.round,20);assert(Q.active(app.engine.b));assert(!app.profile.honroMapRestart);const snap=plain(app.engine.b);app.export();app=h.load(await h.exported());app.continue();assert.deepEqual(plain(app.engine.b),snap,'Repeated whole-battle Continue exact');assert.equal(app.engine.b.phase,'aim');
 rows.push({case:'old8-step Continue',prefix,current:expected,round:20,wholeBattleExact:true,factsPreserved:true});
 if(prefix===2)await writeFile(out+'/compat-retired-middle.json',JSON.stringify(p));
}
{
 const {p,b}=fixture(2,{dialogue:true}),story=plain(b.honroStory);await writeFile(out+'/compat-dialogue.json',JSON.stringify(p));let app=h.load(p);app.continue();app.close();assert.equal(app.dialogue.index,1);assert.deepEqual(plain(app.dialogue.lines),story.lines);const before=plain(app.engine.b);A.tick(app,0);assert.deepEqual(plain(app.engine.b),before,'No progress during saved dialogue');app.export();app=h.load(await h.exported());app.continue();app.close();assert.equal(app.dialogue.index,1);assert.deepEqual(plain(app.dialogue.lines),story.lines);assert.equal(A.current(app.engine.b).id,'family-mid');rows.push({case:'saved dialogue page2',cursorAndRowsExact:true,noMissionAdvance:true});
}
for(const change of [b=>b.honroCustom=true,b=>b.honroStage=13,b=>b.honroVerticalStage14Revision=0,b=>b.phase='won',b=>b.phase='lost',b=>b.honroAct2Steps.push({id:'unknown'}),b=>b.honroStage14RescueRevision=2]){const {b}=fixture(0);change(b);const before=plain(b);assert(!Q.upgradeBattle(b));assert.deepEqual(plain(b),before,'Unsupported or terminal snapshot untouched');}
// Predicates and interactions at real authored positions; adversarial state is
// read-only fixture input. No actions here are completion-turn evidence.
{
 const {b,app}=battlefield(g,14,{profile:vertical14EntryProfile(g,{currentPlan:true}).profile});const m=b.honroMarkers.find(m=>m.id==='family-upper'),spirit=b.units.find(u=>u.id===m.spiritId),occ=b.units.find(u=>u.cls==='occultist'),knight=b.units.find(u=>u.cls==='knight'),threat=b.units.find(u=>u.id==='v14-b6');b.active=occ.id;
 assert.equal(A.current(b).id,'family-upper');assert(!A.eligibility(app,m).ok,'Existing nearby enemies still block rescue');
 for(const u of b.units.filter(u=>u.side===1&&u.id!==spirit.id)){u.x=7000;u.y=1000;}
 assert(!A.eligibility(app,m).ok,'Healthy possessing spirit still blocks');spirit.hp=spirit.maxHp*.4;assert(A.eligibility(app,m).ok);b.active=knight.id;assert(!A.eligibility(app,m).ok,'Other companion must defeat spirit');spirit.dead=true;assert(A.eligibility(app,m).ok);threat.x=m.x;threat.y=m.y;assert(!A.eligibility(app,m).ok,'Local threat gate retained');
 const hold=A.steps(b).find(s=>s.id==='hold-refuge'),last=A.steps(b).find(s=>s.id==='clear-village');assert.equal(hold.rounds,4);assert.equal(hold.wave.count,6);assert.equal(last.radiusPacing,1050);assert.equal(last.heightPacing,600);assert.equal(last.targetPacing,'objective');
 assert.equal(A.failure({...b,units:b.units.map(u=>u.id==='objective'?{...u,dead:true,hp:0}:u)}), '보호하던 주민을 잃었다. 구조 경로를 다시 확보해야 한다.');
 rows.push({case:'retained rescue/local/failure/defense contracts',threeRescuesOrdered:true,threshold:.4,holdRounds:4,finite:6,localRadius:1050});
}
await writeFile(out+'/contracts.json',JSON.stringify({base,checkedCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),rows,limits:['Prepared compatibility and predicate fixtures are separate from the one normal-resource measurement. No completion-turn claim.']},null,2));console.log('PASS Stage14 author/source,8 intermediate Continue,dialogue cursor,bounded exclusions,rescue/defense/local contracts');
