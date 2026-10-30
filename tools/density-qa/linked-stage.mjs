/** One real Act4 win -> outcome -> Next -> saved next-stage boundary.
 * Never seeds later flags, resets XP, teleports actors, or injects a win.
 * Run only on the final frozen combined project; each next invocation cold-loads
 * exact storage from the preceding successful invocation. Native fixtures != browser. */
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {writeFileSync} from 'node:fs';
import {clearAllCache} from '@napi-rs/canvas';
import {saveInputCheckpoint} from './input-checkpoint.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createAppAdapter} from './linked-app.mjs';
import {runtimeDigest} from '../stage31/probes.mjs';
const [projectPath,stageArg,tapePath,out,previousPath]=process.argv.slice(2),stage=+stageArg;
const sha=x=>createHash('sha256').update(x).digest('hex'),plain=x=>JSON.parse(JSON.stringify(x));
const projectBytes=await readFile(projectPath),project=JSON.parse(projectBytes),runtimeSHA256=await runtimeDigest(),tapeBytes=await readFile(tapePath),tape=JSON.parse(tapeBytes)[0];
const prior=previousPath?JSON.parse(await readFile(previousPath)):null;
assert(stage===31?!prior:prior?.success&&prior.stage===stage-1&&prior.nextStage===stage);
if(prior){assert.equal(prior.projectSHA256,sha(projectBytes));assert.equal(prior.runtimeSHA256,runtimeSHA256);}
const a=await createAppAdapter(project,`stage-${stage}`,{entryBuild:prior?.entryBuild||tape.entryBuild,savedStorage:prior?.storage}),{app,g}=a;
const state=b=>plain({units:b.units,objective:b.honroAct4PreviewState,round:b.round,active:b.active,phase:b.phase,terrain:b.terrain});
if(prior)assert(isDeepStrictEqual(a.coldEntryState,prior.nextBattle),'Cold Continue must preserve actual next-stage battle');
if(stage===40){g.HonroAct4Campaign.bind(app);assert(g.HonroAct4Campaign.proofValid(app.engine.b),'Stage40 must inherit genuine32/39 same-run reports/residents and entry proof');}
await mkdir(out,{recursive:true});await mkdir(out+'/atomic-prefix',{recursive:true});let frame=0;const observations=[],midContinue=[],resumeKinds=new Set(),executedInputs=[];
const artState=b=>{const clean=v=>Array.isArray(v)?v.map(clean):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,clean(v[k])])):v;return sha(JSON.stringify(clean({landmarks:b.honroLandmarks,dynamic:b.honroAct4PreviewDynamic,elements:b.honroElements})));};
const visualCaptures=[];
function capture40(label){if(stage!==40)return;app.renderBattleFrame(app.engine,0,0,false);const path=out+'/'+label+'.png';writeFileSync(path,app.scene.canvas.toBuffer('image/png'));const receipt={label,path,stage,frame,projectSHA256:sha(projectBytes),runtimeSHA256,camera:{x:app.scene.x,y:app.scene.y,scale:app.scene.scale},state:state(app.engine.b),scope:'Actual current Scene camera and actors, zero elapsed-time render. No camera relocation or state injection; Native visual observation, not browser HUD.'};writeFileSync(out+'/'+label+'.json',JSON.stringify(receipt,null,2));visualCaptures.push({label,path,frame});}
function resumeBattle(kind){if(stage===40)capture40('sailing-before-continue');const before=state(app.engine.b),artBefore=artState(app.engine.b);app.stopBattle();assert(app.profile.honroBattle);app.continue();app.close();assert.equal(app.engine?.b.honroStage,stage);assert(isDeepStrictEqual(state(app.engine.b),before),'Actual midstage Continue changed units, terrain, objective, round, phase or active');assert.equal(artState(app.engine.b),artBefore,'Actual midstage Continue changed static/dynamic visual state');resumeKinds.add(kind);if(stage===40)capture40('sailing-after-continue');midContinue.push({kind,frame,pass:true,scope:'Actual stopBattle/persist/Continue, exact gameplay and resolved visual-state equality'});}
function tick(){const rendering=frame%300===0;a.tick({render:rendering});frame++;if(rendering){app.scene.ctx.getImageData(0,0,1,1);clearAllCache();global.gc?.();}
 const b=app.engine.b,q=b.honroAct4PreviewState;if(stage===40&&rendering&&q?.returnEscort?.phase==='sailing'&&!visualCaptures.some(v=>v.label==='sailing-first'))capture40('sailing-first');if(stage===40&&rendering&&q?.returnEscort?.phase==='safe'&&!visualCaptures.some(v=>v.label==='boat-safe'))capture40('boat-safe');
 if(stage===40&&!resumeKinds.has('sailing')&&q?.returnEscort?.phase==='sailing'&&q.returnEscort.boatX>3650&&q.returnEscort.boatX<4100&&!app.dialogue&&!q.reader)resumeBattle('sailing');
 else if(stage!==40&&!resumeKinds.has('ordinary-midstage')&&frame>4500&&app.canInput()&&!app.dialogue&&!b.projectiles.length)resumeBattle('ordinary-midstage');
 if(stage===36&&!resumeKinds.has('fallen-door')&&q?.door?.phase==='fallen'&&q.door.renderedAt!==undefined&&q.door.soundAt!==undefined&&!app.dialogue&&!b.projectiles.length)resumeBattle('fallen-door');
 if(frame%1200===0){saveInputCheckpoint(out+'/atomic-prefix',{inputs:executedInputs,frames:frame,entryBuild:prior?.entryBuild||tape.entryBuild,projectSHA256:sha(projectBytes),state:state(app.engine.b)});console.log(stage,frame,app.engine.b.phase,Math.round(process.memoryUsage().rss/1048576));}
 if(frame%300===0&&process.memoryUsage().rss>2*1024**3){writeFileSync(out+'/incomplete-memory.json',JSON.stringify({status:'inconclusive-native-rss-guard-not-gameplay-failure',stage,frame,memory:process.memoryUsage(),limitBytes:2*1024**3,midContinue},null,2));saveInputCheckpoint(out+'/atomic-prefix',{inputs:executedInputs,frames:frame,entryBuild:prior?.entryBuild||tape.entryBuild,projectSHA256:sha(projectBytes),state:state(app.engine.b)});throw Error('Native linked RSS guard exceeded2GiB; incomplete input prefix retained');}
}
for(const input of tape.inputs){if(stage===40&&app.engine.b.phase==='won'&&app.engine.b.honroAct4PreviewState?.complete)break;const e=app.engine;if(input.op!=='move'||app.canInput())executedInputs.push({...input});
 if(input.op==='advance'){for(let n=0;n<input.frames;n++)tick();}
 else if(input.op==='next-dialogue')a.next();else if(input.op==='skip-dialogue')a.skip();else if(input.op==='close-modal')app.close();
 else if(input.op==='interact')observations.push({frame,interactionAccepted:!!a.interact()});
 else if(input.op==='camera'){throw Error('Linked ordinary replay does not accept camera relocation tapes');}
 else if(app.canInput()){
  if(input.op==='move'){for(let n=0;n<input.frames;n++){if(app.canInput())app.engine.move(input.direction,g.HONRO_CORE.STEP);tick();}}
  else if(input.op==='select')app.selectHero(input.actor);else if(input.op==='fire')e.fire(input.skill,input.angle,input.power);
  else if(input.op==='jump')e.jump();else if(input.op==='drop')app.drop();else if(input.op==='defend')app.defend();else throw Error('Unsupported '+input.op);
 }
}
const won=app.engine.b.phase==='won'&&app.engine.b.honroAct4PreviewState?.complete;
const beforeOutcome=plain({state:state(app.engine.b),session:app.engine.b.session,proof:g.HonroAct4Campaign.bind(app)});
await writeFile(out+'/pre-outcome.json',JSON.stringify({stage,frame,won,beforeOutcome,observations,midContinue,executedInputs},null,2));
assert(won,'Ordinary tape failed in linked earned profile; regenerate legal policy, never transplant isolated flags');
assert(midContinue.length,'A genuine midstage Continue must be observed');if(stage===40)assert(resumeKinds.has('sailing'));if(stage===36){assert(resumeKinds.has('fallen-door'));const q=app.engine.b.honroAct4PreviewState;for(const id of ['A4.S36.DOOR.01','A4.S36.DOOR.02'])assert(q.receipts.includes(id));assert(q.events.leave.terminal);}
app.outcome();a.finishDialogue();assert(app.done,'Actual outro/outcome must finish');
const proof=plain(g.HonroAct4Campaign.bind(app));
for(let n=31;n<=stage;n++){assert(proof.completed[n]?.success,`Missing genuine stage${n} completed proof`);assert.equal(proof.completed[n].campaignRunId,proof.runId);}
assert.equal(proof.completed[stage].sourceRun,beforeOutcome.session);
assert(app.profile.cleared[stage]);
let nextBattle=null;
if(stage<40){app.resultContinue();if(!app.engine){assert(['rest','camp','journey'].includes(app.screen));a.finishDialogue();g.HonroRestJourney.requestLaunch(app,stage+1,'next');if(app.pendingJourneyLaunch)g.HonroRestJourney.confirmLaunch(app);}
 assert.equal(app.engine?.b.honroStage,stage+1,'Real Next/rest entry must reach following stage');
 nextBattle=state(app.engine.b);app.stopBattle();assert(app.profile.honroBattle);}
else app.persist();
const storage=Object.fromEntries(a.storage),utf16Bytes=Object.entries(storage).reduce((n,[k,v])=>n+2*(k.length+v.length),0);
assert(utf16Bytes<=5*1024*1024,'Local storage must remain below5MiB UTF16');
assert(!app.customMap&&!app.debugMode&&!app.training);assert.equal(sha(await readFile(a.officialIdentity.worldPath)),a.officialIdentity.worldSHA256);assert.equal(sha(await readFile(a.officialIdentity.manifestPath)),a.officialIdentity.manifestSHA256);assert.equal(await runtimeDigest(),runtimeSHA256);assert.equal(sha(await readFile(projectPath)),sha(projectBytes));
const result={visualCaptures,midContinue,success:true,officialIdentity:a.officialIdentity,stage,nextStage:stage<40?stage+1:null,frame,entryBuild:prior?.entryBuild||tape.entryBuild,projectSHA256:sha(projectBytes),runtimeSHA256,tapeSHA256:sha(tapeBytes),previousBoundarySHA256:previousPath?sha(await readFile(previousPath)):null,proof,nextBattle,storage,utf16Bytes,coldEntryVerified:!!prior,scope:'Linked ordinary-input actual App win/outro/Next, exact storage transfer. Initial stage30-complete fixture only; no subsequent prepared flags/XP resets. Native Canvas with sparse rendering; not browser/HUD/continuous camera proof.'};
await writeFile(out+'/boundary.json',JSON.stringify(result,null,2));console.log(JSON.stringify({stage,frame,success:true,nextStage:result.nextStage,utf16Bytes}));
