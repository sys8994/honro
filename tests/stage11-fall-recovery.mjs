/** Continue two actual failed floor checkpoints on the new authored root.
 * The explicit test-only geometry rebase replaces that root in both collision
 * and world views, stamps the new map revision, and leaves every actor/resource
 * untouched. Ordinary old-revision Continue is tested separately and restarts
 * this chapter through the existing production policy. No positional correction,
 * removed enemy, extra movement/MP, disabled AI or altered mission logic. */
import assert from 'node:assert/strict';
import{readFile,writeFile,mkdir}from'node:fs/promises';
import{gunzipSync}from'node:zlib';
import{createHash}from'node:crypto';
import{appHarness,plain}from'./app-regression-helpers.mjs';
import{authorStage11Ravine}from'../tools/map-forge/apply-stage11-ravine.mjs';
const h=await appHarness(),{g,C}=h,p=g.HONRO_PROJECT,st=p.stages.find(s=>s.metadata.stageId===11),compiled=g.HonroMaps.compile(st,p),rootId='rv-root-west-return';
const out='_local/reports/stage11-lower-review/recovery';await mkdir(out,{recursive:true});
const source='game/docs/stage-review/stage11-lower-route/evidence/',sha=v=>createHash('sha256').update(v).digest('hex');
const input=async file=>JSON.parse(gunzipSync(await readFile(source+file)));
assert.equal(g.HonroCampaignMapRevision.current(11),1);assert.equal(st.initialState.honroStage11FallRecoveryRevision,1);
const data=JSON.parse(await readFile('shared/data/campaign.json','utf8')),once=await authorStage11Ravine(plain(data),g),twice=await authorStage11Ravine(plain(once),g);assert.deepEqual(plain(once),data);assert.deepEqual(plain(twice),data);
// Old battle restart keeps the profile, including paid growth/SP, equipment,
// completion/reward ledger and campaign settings. This does not rescue by warp.
const legacy=await input('failed-west-checkpoint.json.gz'),profile=plain(legacy.profile);profile.honroBattle=plain(legacy.b);
const prior=h.load(profile).profile,stale=plain(prior);assert.equal(stale.honroBattle,null);assert.equal(stale.honroMapRestart,11);
for(const key of ['heroes','loadouts','cleared','honroGrowth'])assert.deepEqual(plain(stale[key]),plain(profile[key]),key+' retained on changed-map restart');
for(const [key,value]of Object.entries(profile.settings))assert.deepEqual(stale.settings[key],value,'saved setting retained: '+key);
let fresh=h.load(stale);fresh.continue();h.finish(fresh);assert.equal(fresh.engine.b.honroStage,11);assert.equal(fresh.engine.b.honroCampaignMapRevision,1);assert.equal(fresh.engine.b.round,1);assert.equal(fresh.engine.alive(1).length,st.units.filter(u=>u.team==='enemy').length);assert.equal(fresh.engine.alive(1).length,53);
fresh.stopBattle();const same=plain(fresh.profile);fresh=h.load(same);fresh.continue();h.finish(fresh);assert.deepEqual(plain(fresh.engine.b.units),same.honroBattle.units,'same-revision actors preserved');
const custom=plain(legacy.b);custom.honroMapOrigin='workshop';custom.honroCustom=true;assert.equal(g.HonroCampaignMapRevision.obsolete(custom),false);
const results=[];
for(const label of ['west','east']){
 const file='failed-'+label+'-checkpoint.json.gz',raw=await input(file),prepared=plain(raw),before=plain(raw.b),newRoot=compiled.terrain.find(t=>t.id===rootId),oldRoot=before.terrain.find(t=>t.id===rootId);
 assert.deepEqual(plain(newRoot.vertices.slice(1,6)),oldRoot.vertices.slice(0,5),'all original upper walking vertices exact');
 for(const t of prepared.b.terrain)if(t.id===rootId)for(const key of ['x','w','h','vertices','honroWalkEdges'])t[key]=plain(newRoot[key]);
 const worldRoot=compiled.worldTerrain.find(t=>t.id===rootId);prepared.b.honroWorldTerrain[prepared.b.honroWorldTerrain.findIndex(t=>t.id===rootId)]=plain(worldRoot);
 Object.assign(prepared.b,{honroCampaignMapRevision:1,honroAct2GeometryRevision:7,honroStage11FallRecoveryRevision:1,sceneVersion:prepared.b.sceneVersion+1});
 assert.deepEqual(prepared.b.units,before.units);assert.deepEqual(prepared.profile,raw.profile);assert.deepEqual(prepared.b.items,before.items);assert.deepEqual(prepared.b.honroState,before.honroState);
 for(const t of before.terrain.filter(t=>t.id!==rootId))assert.deepEqual(prepared.b.terrain.find(v=>v.id===t.id),t);
 prepared.profile.honroBattle=prepared.b;const app=h.load(prepared.profile);app.continue();h.finish(app);const e=app.engine,b=e.b,u=e.heroesAlive().find(u=>u.cls==='mage');
 const fields=units=>units.map(v=>[v.id,v.x,v.y,v.hp,v.focus,v.moveLeft,!!v.dead]);assert.deepEqual(fields(plain(b.units)),fields(before.units),'mount does not move/refill/delete actors');
 const commands=[],samples=[];let frames=0,jumps=0,walked=0,lastX=u.x;
 const pose=()=>({round:b.round,phase:b.phase,x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,maxMove:u.maxMove,support:e.surface(u.x,u.y-5,u.y+5)?.t?.id,alive:e.alive(1).length});
 const start=pose();
 const step=()=>{e.tick(C.STEP);g.HonroMission.tick(app,C.STEP);h.finish(app);frames++;walked+=Math.abs(u.x-lastX);lastX=u.x;};
 const ready=()=>{for(let n=0;n<20000;n++){if(u.dead||['won','lost'].includes(b.phase))return false;if(e.canAct()){if(!u.acted){e.select(u.id);if(e.active===u)return true;}commands.push({op:'wait-other',actor:e.active?.cls,...pose()});e.wait();}step();}return false;};
 const wait=()=>{commands.push({op:'wait',...pose()});e.wait();return ready();};
 async function save(name){await writeFile(out+'/'+label+'-'+name+'.json',JSON.stringify({profile:app.profile,b}));}
 await save('initial');
 async function goal(x,y,name){let still=0;for(let n=0;n<12000;n++){
  if(Math.abs(x-u.x)<12&&Math.abs(y-u.y)<28&&e.grounded(u)){samples.push({name,goal:{x,y},...pose()});await save(name);return;}
  assert(ready(),'normal turn available');if(u.moveLeft<20)assert(wait(),'normal wait renews');
  const a={x:u.x,y:u.y};if(Math.abs(x-u.x)>6)e.move(Math.sign(x-u.x)*(Math.abs(x-u.x)<25?.3:1),C.STEP);step();still=Math.hypot(u.x-a.x,u.y-a.y)<.01?still+1:0;assert(still<120,'body blocked at '+name+' '+JSON.stringify(pose()));
 }throw Error('timeout '+name);}
 async function jumpTo(x,name){if(u.moveLeft<e.jumpCost(u)+130)assert(wait());commands.push({op:'jump',cost:e.jumpCost(u),...pose()});assert(e.jump(u));jumps++;
  for(let n=0;n<1000;n++){if(Math.abs(u.x-x)>3)e.move(Math.sign(x-u.x)*.35,C.STEP);step();if(n>4&&e.grounded(u))break;}
  assert.equal(e.surface(u.x,u.y-5,u.y+5)?.t?.id,rootId);samples.push({name,...pose()});await save(name);
 }
 await goal(3490,9400,'takeoff');await jumpTo(3540,'jump-land');
 await goal(3800,9104.70588235294,'new-root');await goal(4000,8900,'old-root-junction');await goal(4030,8892,'upper-takeoff');await jumpTo(4080,'upper-jump-land');
 for(const [x,y,name]of[[4400,8380,'upper-root'],[4800,7860,'upper-root-2'],[5200,7340,'upper-root-3'],[5400,7080,'ritual-junction'],[5500,7048.571428571428,'ritual']])await goal(x,y,name);
 assert(!u.dead);assert.equal(e.alive(1).length,start.alive);assert.equal(u.hp,start.hp,'existing fall damage retained without further loss');assert.equal(u.focus,start.focus);assert.deepEqual(plain(b.items),before.items);
 const result={label,input:file,inputSha256:sha(await readFile(source+file)),difficulty:b.difficulty,scope:'test-only exact authored root geometry rebase; all original actors/resources/mission retained; ordinary production input APIs afterwards',passed:true,start,end:pose(),frames,jumps,walked,commands,samples};results.push(result);await writeFile(out+'/'+label+'-trace.json',JSON.stringify(result,null,2));console.log('PASS',JSON.stringify({...result,commands:commands.length,samples:samples.length}));
}
await writeFile(out+'/summary.json',JSON.stringify({checks:['author idempotence','old stage11 restarts same chapter preserving profile','same revision actors exact','Workshop excluded','both real failed checkpoints regain ritual with ordinary resources'],sourceTerrain:st.terrains.find(t=>t.id===rootId),results},null,2));
