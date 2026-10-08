import {beforeForestCavernTopology} from './forest-cavern-history-helpers.mjs';
// The original ACT1 fixture hash cannot be reproduced from its named source.
// This anchor is computed from that immutable source, not from today's maps.
// Approved revisions are reversed narrowly; every other map field stays frozen.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {beforeObjectiveRevision} from './objective-delta-helpers.mjs';
import {beforeCaveBatRevision} from './act2-cave-bat-delta-helpers.mjs';
export const act2History=JSON.parse(readFileSync(new URL('./fixtures/act1-act2-history.json',import.meta.url),'utf8'));
export function historicalAct2Maps(project,domain){
 const p=beforeCaveBatRevision(beforeObjectiveRevision(beforeForestCavernTopology(project,{stages:[15]}),{stages:[]}).project);
 for(const {stage,path,before,after} of act2History.proseDelta){
  let target=p.stages.find(s=>s.metadata.stageId===stage);
  for(const key of path.slice(0,-1))target=target[key];
  const key=path.at(-1);assert.equal(target[key],after,`Exact approved ACT2 prose ${stage}/${path.join('.')}`);target[key]=before;
 }
 const stages=p.stages.slice(10,20);
 for(const st of stages){delete st.playBounds;delete st.terrainBounds;delete st.terrainDomainVersion;st.terrains=st.terrains.map(t=>{const q=JSON.parse(JSON.stringify(domain.projection(t)));delete q.playProjection;return q;});}
 return stages;
}
