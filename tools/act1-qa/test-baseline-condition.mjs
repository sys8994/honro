/** Lightweight instrumentation contracts; no game runtime/whole-stage execution. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {adaptPositioning} from './adapt-positioning.mjs';
import {expeditionProfile,detachedPrediction,isolateBaselinePlanning} from './baseline-condition.mjs';
const input={settings:{difficulty:'normal',speed:2},heroes:{archer:{xp:12}},equipment:{owned:['one']}},before=JSON.stringify(input),q=expeditionProfile(input);assert.equal(JSON.stringify(input),before);assert.equal(q.profile.settings.difficulty,'story');assert.deepEqual(q.receipt.diff,[{path:'settings.difficulty',before:'normal',after:'story'}]);assert.throws(()=>expeditionProfile({...input,honroBattle:{difficulty:'normal'}}));
class Engine{constructor(b,onEvent,fresh=false){assert.equal(fresh,false);this.b=b;}unit(id){return this.b.units.find(u=>u.id===id);}predict(u,s,a,p,t){assert.equal(u,this.unit(u.id));if(t)assert.equal(t,this.unit(t.id));this.b.predictCache='clone-only';u.x=999;return{angle:a,power:p};}shotSeeds(u,s,t){return[this.predict(u,s,11,.5,t)];}bestShot(u,s,t){return this.shotSeeds(u,s,t)[0];}}
const C={Engine},e=new Engine({units:[{id:'p',side:0,x:1},{id:'enemy',side:1,x:10}]}),snapshot=JSON.stringify(e.b),profile={...input},stats={calls:0},identities=Object.fromEntries(['predict','shotSeeds','bestShot'].map(m=>[m,e[m]]));
for(const method of ['predict','shotSeeds','bestShot'])detachedPrediction(C,e,method,[e.unit('p'),{},...(method==='predict'?[3,.4,e.unit('enemy')]:[e.unit('enemy')])],profile,stats);
assert.equal(JSON.stringify(e.b),snapshot);assert.equal(stats.calls,3);assert.equal(JSON.stringify(profile),before);for(const [m,fn]of Object.entries(identities))assert.equal(e[m],fn,'No production method replacement');
assert.equal(isolateBaselinePlanning('e.bestShot(u,s,target); C.shotViable(e,u,s,t,f(1),.5);','qa','app.profile'),'qa.plan(e,"bestShot",[u,s,target],app.profile); qa.plan(e,"core:shotViable",[u,s,t,f(1),.5],app.profile);');
console.log('PASS single-field entry, detached cache/actor mapping, exact state and untouched method identities, call-site rewrite');

const registration=JSON.parse(await readFile('tools/act1-qa/expedition-baseline-registration.json'));
for(const row of registration.cases.filter(r=>r.runner==='legacy-controller.mjs')){
 let source=await readFile(row.stage===1?'tools/act1-qa/stage1-policy.js':`tools/testing/stage${row.stage}-positioning-controller.js`,'utf8');
 if(row.stage!==1)source=adaptPositioning(source,row.stage,row.policy);
 const isolated=isolateBaselinePlanning(source,'QA_BASELINE','a.profile');new vm.Script(`(${isolated})`);
 assert(!/e\.(predict|shotSeeds|bestShot)\(|C\.shotViable\(e,/.test(isolated));
 console.log(`PASS Stage${row.stage} frozen controller planning call-site parse/audit`);
}
const stage8=isolateBaselinePlanning(await readFile('tests/stage8-bier-fullplay.mjs','utf8'),'baselineAudit','app.profile');
assert(!/e\.(predict|shotSeeds|bestShot)\(|C\.shotViable\(e,/.test(stage8));console.log('PASS Stage8 nested inspect/bestShot/attackSeal call-site audit');
