/** Isolated geometry/skill probes, not normal-resource combat evidence. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {isolatedHero,traverse} from './act1-spatial-test-helpers.mjs';
import {authorStage5Waterfall} from '../tools/map-forge/stage5-waterfall.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,p=JSON.parse(await readFile('shared/data/campaign.json','utf8')),plain=x=>JSON.parse(JSON.stringify(x)),rows=[];
assert.deepEqual(plain(authorStage5Waterfall(p,g)),p,'Canonical author is idempotent');
for(const cls of ['archer','mage','knight','occultist']){
 const q=isolatedHero(g,5,cls),a=q.b.honroMapAnchors;
 const r=traverse(g,q.b,q.e,q.u,[a.receiver,a.shotGap,a.start]);rows.push({kind:'main-return',cls,...r});assert(r.passed,JSON.stringify(rows.at(-1)));
 for(const [x,y] of [[890,2440],[1600,2535]]){const r=traverse(g,q.b,q.e,q.u,[{x,y},a.start]);rows.push({kind:'optional-overlook',cls,...r});assert(r.passed,JSON.stringify(rows.at(-1)));}
 for(const x of [2850,3500,4100,4450,4650]){Object.assign(q.u,{x,y:3310,vx:0,vy:0,airborne:false,jumping:false});for(let i=0;i<900&&!q.e.grounded(q.u);i++)q.e.integrateBody(q.u,1/60);const landed={x:q.u.x,y:q.u.y,airborne:q.u.airborne,jumping:q.u.jumping,vx:q.u.vx,vy:q.u.vy,dead:q.u.dead};const r=traverse(g,q.b,q.e,q.u,[a.shotGap,a.receiver]);rows.push({kind:'lake-return',cls,landed,...r});assert(r.passed,JSON.stringify(rows.at(-1)));}
}
// Every ground arrival in the distant cliff/lake must fail, including saved stake pairs.
for(const x of [2420,2800,3900,4220,4800]){const{b,e}=battlefield(g,5);b.units=b.units.filter(u=>u.side===0);const u=e.active;const t=b.terrain.find(t=>t.id=== (x>=3900?'waterfall-cliff':'valley-floor'));const y=x===4220?2405:C.topAt(t,x);b.stakes=[{id:1,skill:'M09',side:0,x:u.x,y:u.y,rank:1,owner:u.id},{id:2,skill:'M09',side:0,x,y,rank:1,owner:u.id}];const from={x:u.x,y:u.y};assert.equal(C.useGate(e,u),false);assert.deepEqual({x:u.x,y:u.y},from);rows.push({kind:'gate-rejected',x,y});}
await mkdir('_local/reports/stage5-lake',{recursive:true});await writeFile('_local/reports/stage5-lake/routes.json',JSON.stringify(rows,null,2));console.log('PASS lake routes, optional overlooks, recovery and gate rejection',rows.length);
