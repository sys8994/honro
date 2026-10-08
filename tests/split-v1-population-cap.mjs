import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
for(const [id,base,responses,total]of [[25,16,6,22],[26,17,6,23],[27,18,7,25]]){
 const p=C.defaults();p.recruited=['archer','mage','knight','occultist'];p.honroSplitCampaign={version:1,mode:'continuous',stage:id,nextStage:id,finished:false,vitals:{},starts:{},completed:{},items:null};
 const st=g.HONRO_SPLIT_V1.content.find(s=>s.id===id),b=g.HonroWorld.build(st,p,false,'archer','A01');assert.equal(b.honroSplit.version,1);
 const before=JSON.stringify(b);assert.equal(g.HonroEncounters.populationCap(b),total);assert.equal(JSON.stringify(b),before,'capacity lookup never changes old actors or resources');
 const saved=JSON.parse(before);saved.units=saved.units.filter((u,i)=>u.side!==1||i%2===0);assert.equal(g.HonroEncounters.populationCap(saved),total,'casualties never shrink the original reserve');delete saved.honroAct3ResponseRevision;assert.equal(g.HonroEncounters.populationCap(saved),base,'pre-response old save keeps its original base');
 assert.equal(b.honroEvents.filter(ev=>ev.action?.act3Authored).reduce((n,ev)=>n+ev.action.n,0),responses);
 const current=battlefield(g,id).b;assert.equal(current.honroSplit.version,2);assert.equal(g.HonroEncounters.populationCap(current),g.HonroProgression.plan(id).maxAlive,'new depot budget unchanged');
 console.log('PASS v1',id,'base',base,'total',total,'v2',g.HonroEncounters.populationCap(current));
}
