/** Bind an existing ordinary-input policy to a genuine carried campaign save.
 * No later-stage fixture/profile/resource/flag injection. Not a completed chain. */
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {writeFileSync} from 'node:fs';
import {clearAllCache} from '@napi-rs/canvas';
import {createAppAdapter as linkedApp} from './linked-app.mjs';
import {saveInputCheckpoint} from './input-checkpoint.mjs';
let context,adapter,ticks=0;
const plain=x=>JSON.parse(JSON.stringify(x));
const state=b=>plain({units:b.units,objective:b.honroAct4PreviewState,round:b.round,active:b.active,phase:b.phase,terrain:b.terrain});
export function configureLinkedPolicy(c){assert(!context);context=c;}
export async function createAppAdapter(world,stageId,options={}){
 assert(context&&stageId===`stage-${context.stage}`);
 const prior=context.prior;
 assert(context.stage===31?!prior:prior?.success&&prior.stage===context.stage-1&&prior.nextStage===context.stage);
 if(prior){assert.equal(prior.projectSHA256,context.worldSHA256);assert.equal(prior.runtimeSHA256,context.runtimeSHA256);}
 const a=await linkedApp(world,stageId,{entryBuild:prior?.entryBuild||options.entryBuild,savedStorage:prior?.storage});adapter=a;
 if(prior)assert(isDeepStrictEqual(a.coldEntryState,prior.nextBattle),'Policy must cold-restore exact actual previous boundary');
 if(context.stage===40){a.g.HonroAct4Campaign.bind(a.app);assert(a.g.HonroAct4Campaign.proofValid(a.app.engine.b),'No prepared32/39 proof is allowed in linked policy');}
 return {...a,engine:a.app.engine,
  tick(){const rendering=ticks++%300===0;a.tick({render:rendering});if(rendering){a.app.scene.ctx.getImageData(0,0,1,1);clearAllCache();global.gc?.();}},
  success(){return a.app.engine.b.phase==='won'&&!!a.app.engine.b.honroAct4PreviewState?.complete;},
  state(){return state(a.app.engine.b);},
  scope:a.scope+' Existing adaptive ordinary-input policy on real carried profile; no independent-stage reset. Generated tape still requires linked outcome/Next verification.'};
}
export function linkedPolicyCheckpoint(inputs,frames,entryBuild){
 if(frames%1200!==0&&!(frames%300===0&&process.memoryUsage().rss>2*1024**3))return;
 saveInputCheckpoint(context.out+'/atomic-linked-prefix',{inputs,frames,entryBuild,projectSHA256:context.worldSHA256,state:state(adapter.app.engine.b)});
 const memory=process.memoryUsage();console.log('LINKED_POLICY',context.stage,frames,adapter.app.engine.b.phase,Math.round(memory.rss/1048576));
 if(memory.rss>2*1024**3){writeFileSync(context.out+'/incomplete-linked-memory.json',JSON.stringify({status:'inconclusive-native-memory-guard',stage:context.stage,frames,memory,limitBytes:2*1024**3},null,2));throw Error('Linked policy Native RSS exceeded2GiB; incomplete prefix retained');}
}
