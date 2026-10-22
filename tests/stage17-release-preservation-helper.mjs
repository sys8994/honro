/** Only the separately approved visual fields and ONE exact route anchor may differ. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {applyStage17ReturnRoute} from '../tools/map-forge/stage17-return-route-fix.mjs';
export function assertStage17ApprovedIntegration(current,base){
 const approvedArt=JSON.parse(execFileSync('git',['show','4c2dbe53899c7daabae7a51ac744302db4f01f33:shared/data/campaign.json'],{maxBuffer:40e6}));
 const st=current.stages[16],expected=applyStage17ReturnRoute(structuredClone(base)).stages[16],route=s=>s.design.space.routes.find(r=>r.id==='east-upper-return');
 assert.deepEqual(route(st).anchors[3],route(expected).anchors[3],'One approved anchor is exact, including .15s steering delay');
 assert.deepEqual(st.design.space.terrainPlanes,approvedArt.stages[16].design.space.terrainPlanes,'Approved visual planes exact');
 assert.deepEqual(st.design.stage17VectorFinish,approvedArt.stages[16].design.stage17VectorFinish,'Approved visual metadata exact');
 const normalized=structuredClone(current),s=normalized.stages[16];
 route(s).anchors[3]=structuredClone(route(base.stages[16]).anchors[3]);
 s.design.space.terrainPlanes=structuredClone(base.stages[16].design.space.terrainPlanes);delete s.design.stage17VectorFinish;
 assert.deepEqual(normalized,base,'Whole project exact after restoring only approved visual fields and single anchor');
 return normalized;
}
