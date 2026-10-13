/** Isolated event boundary fixtures, not a normal combat completion. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),out={scope:'Isolated original-trigger/preview-order fixtures. Enemy removal and round advancement are explicit setup, never normal-play evidence.',cases:[]};
for(const prewarn of [true,false]){const {b,e,app}=battlefield(g,5),trace=[];const keep=new Set(['foe-0','foe-4','foe-8','foe-0-cluster']);for(const u of b.units.filter(u=>u.side===1&&!keep.has(u.id))){u.dead=true;u.hp=0;}b.phase='transition';b.side=0;app.event=text=>trace.push({type:'notice',round:b.round,text});app.sayLines=()=>{};
 if(prewarn){g.HonroMission.tick(app,0);b.round=2;}
 b.terrain.find(t=>t.id==='cliff-cleat').broken=true;const ready=b.round;b.honroState.objectiveReadyRound=ready;g.HonroMission.tick(app,0);const during=b.units.filter(u=>u.honroSpawnSource?.startsWith('habitat-5-')).map(u=>({id:u.id,source:u.honroSpawnSource,x:u.x,y:u.y}));b.round++;g.HonroMission.tick(app,0);const final=b.units.filter(u=>u.honroSpawnSource?.startsWith('habitat-5-'));const complete=g.HonroObjectives.state(b,app.stage).complete;
 assert.equal(complete,true,'Original one-round settlement is unchanged');if(prewarn)assert(during.length>0,'Prior real round warning allows original settlement trigger to spawn');else assert.equal(final.length,0,'Same-round early completion preempts the delayed conditional response');out.cases.push({prewarn,trace,readyRound:ready,completeRound:b.round,during,finalCount:final.length,classification:prewarn?'warned-original-trigger-entry':'one-round-objective-preemption'});}
await mkdir('_local/reports/stage5-waterfall',{recursive:true});await writeFile('_local/reports/stage5-waterfall/habitat-boundaries.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
