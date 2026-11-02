/** Focused observer provenance regression. Authored fixture poses/target are
 * explicit setup, not a route, browser, difficulty or stage acceptance run. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),g=h.g,V=g.HonroAct23V4,C=g.HONRO_CORE;
for(const suffix of ['-chapters','16','18']) if(!g['HonroAct23V4Reviewed'+(suffix==='-chapters'?'Chapters':suffix)])vm.runInContext(await readFile(`shared/runtime/act23-v4-reviewed${suffix}.js`,'utf8'),g);
g.HONRO_ACT23_V4_PHASE_A=true;g.HONRO_ACT23_V4_PHASE_B_STAGES=[16,18];g.HONRO_ACT23_V4_REVIEWED_CHAPTERS={};
for(const stage of [16,18])g.HONRO_ACT23_V4_REVIEWED_CHAPTERS[stage]=JSON.parse(await readFile(`shared/data/reviewed/act23-v4-ch${stage}.json`,'utf8'));
g.HONRO_PROJECT=V.author(g.HONRO_PROJECT,{enabled:true});
const failures=[];
for(const stage of [16,18]){
 const p=h.profileThrough(stage-1);p.seen['act2:first-spirit-encounter']=true;
 const app=h.load(p);app.launch(stage);app.dialogue=null;app.turnNotice=null;
 const e=app.engine,b=e.b,u=V.heroes(b).find(u=>u.cls==='archer');
 Object.assign(b,{active:u.id,side:0,phase:'aim'});
 if(stage===18)Object.assign(u,{x:9200,y:g.HonroMapEngine.surfaceY(b.terrain,9200,undefined,'sb-east-gallery-sill').y,vx:0,vy:0,airborne:false,jumping:false});
 const target=stage===16?e.unit('resident-1'):undefined;
 const memory=()=>stage===16?g.HonroAct23V4ReviewedChapters.memory(b):g.HonroAct23V4Reviewed18.memory(b);
 const proof=()=>stage===16?memory().discipleAim:memory().bellAimProof;
 memory();assert(u.loadout.includes('A01'));
 const before=JSON.stringify(b),out=e.predict(u,C.SKILLS.A01,95,.45,target,false);
 try{assert.equal(JSON.stringify(b),before,`${stage}: collect=false must leave whole live battle byte-identical`);}catch(err){failures.push(err.message.split('\n')[0]);}
 const physical=plain(out);
 // The valid collected path keeps the same physical result (points collection
 // intentionally differs), and remains an authored observation.
 const legal=e.predict(u,C.SKILLS.A01,95,.45,target,true);
 assert(proof(),`${stage}: legal collected preview observes`);
 for(const key of ['x','y','terrain','unit','closest'])assert.deepEqual(legal[key],physical[key],`${stage}: physical ${key} unchanged`);
 const valid=JSON.stringify(proof());
 // Omitted collect means true in the production Engine signature.
 assert.deepEqual(plain(e.predict(u,C.SKILLS.A01,95,.45,target)),plain(legal));
 assert.equal(JSON.stringify(proof()),valid);
 for(const context of ['inactive','enemy-side','dialogue']){
  const oldActive=b.active,oldSide=b.side;
  if(context==='inactive')b.active=V.heroes(b).find(x=>x.id!==u.id).id;
  if(context==='enemy-side')b.side=1;
  if(context==='dialogue')app.dialogue={};
  const snapshot=JSON.stringify(b);
  assert.deepEqual(plain(e.predict(u,C.SKILLS.A01,95,.45,target)),plain(legal),`${stage}: ${context} physical result`);
  assert.equal(JSON.stringify(b),snapshot,`${stage}: ${context} is not an active visible hero observation`);
  b.active=oldActive;b.side=oldSide;app.dialogue=null;
 }

 const mage=V.heroes(b).find(u=>u.cls==='mage');Object.assign(b,{active:mage.id});
 // Keep the same physical origin to isolate stale-class ownership, not aim.
 Object.assign(mage,{x:u.x,y:u.y});
 const staleBefore=JSON.stringify(b);
 e.predict(mage,C.SKILLS.A01,95,.45,target,true);
 try{assert.equal(JSON.stringify(b),staleBefore,`${stage}: stale skill leaves whole battle unchanged`);}catch(err){failures.push(err.message.split('\n')[0]);}
 try{assert.equal(JSON.stringify(proof()),valid,`${stage}: stale incompatible skill must not overwrite valid proof`);}catch(err){failures.push(err.message.split('\n')[0]);}
 console.log('CHECK stage',stage,'physical prediction and legal preview');
}
assert.deepEqual(failures,[],failures.join('\n'));
console.log('PASS collected preview provenance, immutable probes, stale-class rejection');
