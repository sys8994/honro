// Focused fresh-entry geometry probes; no normal-play or whole-campaign claim.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {traverse} from './act1-spatial-test-helpers.mjs';
import {applyCityTacticalRoutes} from '../tools/map-forge/city-tactical-routes.mjs';
import {authorStage21Eupseong,ground} from '../tools/map-forge/stage21-eupseong.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
const input=JSON.parse(await readFile('shared/data/campaign.json','utf8')),p=JSON.parse(JSON.stringify(authorStage21Eupseong(input,g))),s=p.stages[20],old=input.stages[20],rows=[];
// The build pipeline must not resurrect the pre-eupseong ct21 solid galleries.
assert.deepEqual(applyCityTacticalRoutes(p).stages[20],s,'Build preserves revision 2 eupseong geometry');
g.HONRO_PROJECT=p;
for(const k of ['events','markers','units','encounters','objectives'])assert.deepEqual(s[k],old[k],k+' unchanged');
assert.deepEqual(s.initialState.honroAct3Steps,old.initialState.honroAct3Steps);
assert.deepEqual(JSON.parse(JSON.stringify(authorStage21Eupseong(p,g))),p,'idempotent author');
function probe(cls,x,y){const b=g.HonroMaps.createBattle(s,p,undefined,{origin:'campaign'}),u=structuredClone(battlefield(g,11).e.heroesAlive().find(u=>u.cls===cls));Object.assign(u,{x,y,vx:0,vy:0,jumping:false,airborne:false,moveLeft:u.maxMove});Object.assign(b,{units:[u],active:u.id,phase:'aim'});const e=new C.Engine(b,()=>{},true);e.checkEnd=()=>false;return{b,u,e};}
for(const cls of C.CLASS_IDS){
 for(const r of s.design.act3.optionalRoutes.filter(r=>r.id!=='short-wall-cover')){const q=probe(cls,r.points[0].x,r.points[0].y),v=traverse(g,q.b,q.e,q.u,r.points);rows.push({cls,route:r.id,...v});assert(v.passed,JSON.stringify(rows.at(-1)));}
 // Both affected street sections remain ordinary walk-only passages.
 for(const [l,r]of [[3280,4650],[4950,5740]]){const q=probe(cls,l,ground(l)),points=s.design.act3.requiredRoute.filter(v=>v.x>l&&v.x<r).concat({x:r,y:ground(r)}),v=traverse(g,q.b,q.e,q.u,points,{jump:false});assert(v.passed,JSON.stringify({cls,l,r,...v}));rows.push({cls,street:[l,r],...v});}
 for(const id of ['market-alley-eave','market-potter-awning','office-west-awning','office-return-eave']){const q=probe(cls,0,0),t=q.b.terrain.find(t=>t.id==='eup21-'+id),x=(C.poly(t)[0].x+C.poly(t)[1].x)/2,y=C.topAt(t,x);Object.assign(q.u,{x,y});assert(t.oneWay&&q.e.grounded(q.u),id+' grounded');assert(q.e.drop(),id+' accepts down+jump');for(let n=0;n<300;n++)q.e.integrateBody(q.u,1/120);assert(q.e.grounded(q.u),id+' lands below');assert(q.u.y>y+25,id+' passes through top');assert.notEqual(q.e.contactSurface(q.u.x,q.u.y-4,q.u.y+5)?.t.id,t.id);rows.push({cls,drop:id,from:y,to:q.u.y});}
}
const out='_local/reports/act3-rework-20261017/stage21';await mkdir(out,{recursive:true});await writeFile(out+'/focused-routes.json',JSON.stringify({scope:'Fresh candidate: four bodies, two local roof/eave circuits, affected ordinary streets and four one-way drops. No campaign completion or browser claim.',rows},null,2));console.log('PASS Stage21 local alley circuits/street/drop',rows.length);
