/** Render genuine low/high projectile impacts from authored-spawn input probes.
 * Engine-only trajectories, actual Native Scene, fixed review camera. No pose or
 * projectile injection; not an App/HUD/campaign proof. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createAppAdapter} from './native-entry.mjs';
import {runtimeDigest} from '../stage31/probes.mjs';
const [file,out]=process.argv.slice(2),bytes=await readFile(file),p=JSON.parse(bytes),runtimeSHA256=await runtimeDigest(),sha=b=>createHash('sha256').update(b).digest('hex');
await mkdir(out,{recursive:true});const a=await createAppAdapter(p,'stage-31'),{g,app}=a,C=g.HONRO_CORE,stage=p.stages.find(s=>s.id==='stage-31');
const probes=[JSON.parse(await readFile('tools/density-qa/tapes/stage31-new-bank-low-shot.json'))[0],JSON.parse(await readFile('tests/fixtures/stage31-production/shot-inputs.json'))[1]],results=[];
for(const probe of probes){const profile=g.HonroMaps.profileFor(stage);g.HonroEquipment.fresh(profile);const b=g.HonroMaps.createBattle(stage,p,profile),e=new C.Engine(b,()=>{},true),impacts=[],hurts=[];let frame=0;
 const physical=x=>JSON.stringify({units:x.units,terrain:x.terrain,projectiles:x.projectiles,phase:x.phase,round:x.round,active:x.active,physics:x.physics});
 const initialPhysical=physical(b);app.scene.render(e,0,'',.6,false,0);assert.equal(physical(b),initialPhysical,'First paint must not mutate physical state');
 const paintInitializedObjective=JSON.parse(JSON.stringify(b.honroAct4PreviewState??null));
 const render=name=>{const before=JSON.stringify(b);Object.assign(app.scene,{x:1200,y:1850,scale:.55,manual:true,storyFrame:null,storyTween:null,goalFocus:null,editorView:true,skillPreview:true});app.scene.render(e,0,'',.6,false,0);const pre=JSON.parse(before),changed=[...new Set([...Object.keys(pre),...Object.keys(b)])].filter(k=>JSON.stringify(pre[k])!==JSON.stringify(b[k]));assert.deepEqual(changed,[],'Render changed top-level battle keys: '+changed.join(','));writeFileSync(`${out}/${probe.id}-${name}.png`,app.scene.canvas.toBuffer('image/png'));};
 const impact=e.impact.bind(e);e.impact=(q,h)=>{if(q.owner==='archer'){impacts.push({frame,terrain:h.terrain?.id,unit:h.unit?.id,x:q.x,y:q.y,skill:q.skill});render('impact-'+impacts.length);}return impact(q,h);};
 const hurt=e.hurt.bind(e);e.hurt=(u,...args)=>{const before=u.hp+u.shield,r=hurt(u,...args);if(before>u.hp+u.shield)hurts.push({frame,target:u.id,owner:args[1],amount:before-u.hp-u.shield});return r;};
 const tick=()=>{e.tick(C.STEP);frame++;};
 for(const i of probe.inputs){if(i.op==='move')for(let n=0;n<i.frames;n++){e.move(i.direction,C.STEP);tick();}else if(i.op==='advance')for(let n=0;n<i.frames;n++)tick();else if(i.op==='fire'){assert(e.fire(i.skill,i.angle,i.power));render('launch');}else throw Error('Unsupported '+i.op);}
 const hit=hurts.some(h=>h.owner==='archer'&&h.target===probe.expect.target);assert(probe.expect.type==='hit'?hit:!hit&&impacts.some(h=>h.terrain===probe.expect.terrain));results.push({id:probe.id,probe,frame,paintInitializedObjective,impacts,hurts,pass:true});global.gc?.();}
assert.equal(await runtimeDigest(),runtimeSHA256);assert.equal(sha(await readFile(file)),sha(bytes));await writeFile(out+'/result.json',JSON.stringify({projectSHA256:sha(bytes),runtimeSHA256,scope:'Actual authored-spawn Engine input probe and projectile impact; first Scene paint initializes default preview memory with exact units/terrain/projectiles/phase/round/active/physics invariance before inputs; Native Scene fixed review camera. No actor/event override; not App/campaign/HUD proof.',results},null,2));
