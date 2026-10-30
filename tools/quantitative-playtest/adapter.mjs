import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {appHarness} from '../../tests/app-regression-helpers.mjs';
import {createAppAdapter} from './act4-adapter.mjs';
export async function adapter(stage){
 let a;
 if([31,34,39].includes(stage)){const bytes=await readFile('shared/data/act4/world.json'),manifest=JSON.parse(await readFile('shared/data/act4/world.parts/manifest.json','utf8')),sha256=createHash('sha256').update(bytes).digest('hex');assert.equal(sha256,manifest.sha256,'Materialized canonical world must match packed source manifest');assert.equal(bytes.length,manifest.bytes);a=await createAppAdapter(JSON.parse(bytes),`stage-${stage}`,{entryBuild:'campaign-balanced-v1'});a.officialIdentity.worldTransport={sha256,bytes:bytes.length};}
 else if(stage===5){
  const h=await appHarness({productionStory:true,preserveCancelInput:true}),{g,C}=h;
  vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
  const p=h.profileThrough(4);
  p.recruited=['archer','mage'];p.party=[...p.recruited];p.settings.debugMode=false;p.settings.difficulty='normal';
  for(const cls of p.recruited){p.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(5).entryLevel);C.resetTalents(p.heroes[cls],cls);p.loadouts[cls]=[cls==='archer'?'A01':'M01'];}
  const app=h.load(p);app.launch(5);app.close();a={g,app,entryBuild:'declared-plan5-entry-level-basic-unspent',training:[],scope:'Prepared stage5 profile at current production plan entryLevel. Prior clear markers are an entry prerequisite fixture, not earned combat/contribution history or a first-clear ledger.'};
 }else throw Error('Only stages 5,31,34,39 are supported');
 const {app,g}=a;let now=0;g.performance={now:()=>now};app.prev=0;app.acc=0;
 // Stage5 retains the historical presentation double. Act4 paints and reads actual NativeCanvas pixels; App.frame/combat/story are unchanged.
 if(stage===5){app.scene.render=()=>{};app.renderBattleFrame=()=>{};}
 return {...a,tick(){now+=1000/60;app.frame(now);if(stage>=31){const pixels=app.scene.canvas.data();a.nativeReadbacks=(a.nativeReadbacks||0)+1;a.lastReadbackBytes=pixels.byteLength;}if(app.lastError)throw Error(app.lastError);},now:()=>now,presentationEvidence:()=>({nativeReadbacks:a.nativeReadbacks||0,lastReadbackBytes:a.lastReadbackBytes||0}),
 success(){const b=app.engine.b;return b.phase==='won'&&(stage===5||b.honroAct4PreviewState?.complete&&(stage!==31||b.honroAct4PreviewState?.boat?.phase==='boarded'));}};
}
