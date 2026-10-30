/** Replays ordinary input tape on the real App. No geometry, actor/resource or
 * event-state overrides. Additional observations are NOT exported gate passes. */
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const stage=Number(process.argv[5]);
assert(stage===34,'Owned renderer-free stage34 diagnostic only');
const {createAppAdapter}=await import('./app-adapter.mjs');
import {runtimeDigest} from '../stage31/probes.mjs';
const [file,tapeFile,out]=process.argv.slice(2);if(!out)throw Error('draft tape output required');
const p=JSON.parse(await readFile(file,'utf8')),tape=JSON.parse(await readFile(tapeFile,'utf8'))[0],a=await createAppAdapter(p,`stage-${stage}`,{entryBuild:tape.entryBuild}),{g,app}=a;
const initialVerifier=createHash('sha256').update(await readFile(import.meta.filename)).digest('hex'),initialRuntime=await runtimeDigest(),initialProject=createHash('sha256').update(JSON.stringify(p)).digest('hex');
const contactConfig=process.argv[6]?JSON.parse(await readFile(process.argv[6],'utf8')):null,contacts=[];if(contactConfig)assert.equal(contactConfig.stage,stage);
let frame=0,index=0,resumed=false;const hurts=[],impacts=[],shots=[],trace=[],resume=[],transitions=[];let lastState='';
function artDigest(b){return createHash('sha256').update(JSON.stringify(['honroElements','honroLandmarks','honroEnvironment','honroAct4PreviewDynamic'].map(k=>b[k]??null))).digest('hex');}
function hook(){const e=app.engine,hurt=e.hurt.bind(e),impact=e.impact.bind(e);e.hurt=(u,...args)=>{const before=u.hp+u.shield,r=hurt(u,...args),amount=before-u.hp-u.shield;if(amount>0)hurts.push({frame,target:u.id,owner:args[1],amount});return r;};e.impact=(q,h)=>{impacts.push({frame,owner:q.owner,skill:q.skill,terrain:h.terrain?.id,unit:h.unit?.id,x:q.x,y:q.y});return impact(q,h);};}
hook();
function captureContacts(){for(const c of contactConfig?.captures.filter(x=>x.frame===frame)||[]){const e=app.engine,u=e.b.units.find(x=>x.id===c.actor),t=e.b.terrain.find(x=>x.id===c.terrain),scene=app.scene;assert(u);assert(e.grounded(u));if(t)assert(g.HONRO_CORE.terrainSurfaces(t,u.x).some(s=>Math.abs(s.y-u.y)<.25));const before=JSON.stringify(e.b),old={};for(const k of['x','y','scale','manual','storyFrame','storyTween','goalFocus','editorView','skillPreview'])old[k]=scene[k];Object.assign(scene,{...c.camera,manual:true,storyFrame:null,storyTween:null,goalFocus:null,editorView:true,skillPreview:true});scene.render(e,0,'',.6,false,0);assert.equal(JSON.stringify(e.b),before,'Contact review paint mutated battle');const dir=out.replace(/\.json$/,'-contacts');mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/${c.id}.png`,scene.canvas.toBuffer('image/png'));Object.assign(scene,old);contacts.push({id:c.id,frame,camera:c.camera,actor:{id:u.id,x:u.x,y:u.y,grounded:e.grounded(u)},terrain:t?.id,scope:'Actual tape contact; fixed review camera only, no actor/event overrides; not browserHUD.'});}}
function tick(){a.tick();frame++;captureContacts();const b=app.engine.b,q=b.honroAct4PreviewState,state=JSON.stringify({phase:b.phase,boat:q?.boat?.phase,complete:q?.complete,enemies:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length});if(state!==lastState){transitions.push({frame,...JSON.parse(state)});lastState=state;}if(frame%15===0)trace.push({frame,round:b.round,active:b.active,units:b.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,grounded:app.engine.grounded(u)}))});}
for(const input of tape.inputs){
 const e=app.engine,b=e.b;
 if(!resumed&&frame>12000&&app.canInput()&&!app.dialogue&&!b.projectiles.length){
  const before=JSON.parse(JSON.stringify({units:b.units,objective:b.honroAct4PreviewState,round:b.round,active:b.active,phase:b.phase,artSha256:artDigest(b)}));app.stopBattle();assert(app.profile.honroBattle);app.continue();app.close();assert(app.engine,'Actual App Continue must restore engine');const z=app.engine.b,after=JSON.parse(JSON.stringify({units:z.units,objective:z.honroAct4PreviewState,round:z.round,active:z.active,phase:z.phase,artSha256:artDigest(z)}));assert.deepEqual(after,before);resume.push({frame,inputIndex:index,result:'pass',scope:'Actual stopBattle/persist/Continue; exact units, event state, round, active, phase and all static/dynamic artwork holders preserved'});resumed=true;hook();
 }
 assert(['advance','camera','next-dialogue','skip-dialogue','close-modal','interact','select','move','jump','drop','defend','fire'].includes(input.op),'Unsupported tape operation '+input.op);
 const engine=app.engine;
 if(input.op==='advance'){for(let i=0;i<input.frames;i++)tick();}
 else if(input.op==='camera')a.camera(input.x,input.y,input.scale);else if(input.op==='next-dialogue')a.next();else if(input.op==='skip-dialogue')a.skip();else if(input.op==='close-modal')app.close();else if(input.op==='interact')a.interact();
 else if(app.canInput()){if(input.op==='select')app.selectHero(input.actor);else if(input.op==='move'){for(let i=0;i<input.frames;i++){if(app.canInput())engine.move(input.direction,g.HONRO_CORE.STEP);tick();}}else if(input.op==='jump')engine.jump();else if(input.op==='drop')app.drop();else if(input.op==='defend')app.defend();else if(input.op==='fire'){const u=engine.active,pose={x:u.x,y:u.y};shots.push({frame,actor:u.id,...pose,input,accepted:!!engine.fire(input.skill,input.angle,input.power)});}}
 index++;
}
const card=p.stages.find(s=>s.metadata.stageId===stage),groups=card.encounters.map(group=>({id:group.id,damage:hurts.filter(h=>group.unitIds.includes(h.owner)&&['archer','mage','knight','occultist'].includes(h.target))}));
assert.equal(await runtimeDigest(),initialRuntime,'Runtime changed during replay');
assert.equal(createHash('sha256').update(await readFile(import.meta.filename)).digest('hex'),initialVerifier,'Verifier changed during replay');
assert.equal(createHash('sha256').update(JSON.stringify(JSON.parse(await readFile(file,'utf8')))).digest('hex'),initialProject,'Project changed during replay');
const result={stage,version:1,runner:'honro-production-app-observation-v1',scope:a.scope+' No gate relabeling or automatic art approval.',fingerprint:createHash('sha256').update(JSON.stringify(p)).digest('hex'),runtimeSha256:await runtimeDigest(),verifierSha256:initialVerifier,success:a.success(),frame,entryBuild:tape.entryBuild,resume,contacts,groups,transitions,shots,hurts,impacts,trace,final:a.state()};
await mkdir(out.substring(0,out.lastIndexOf('/')),{recursive:true});await writeFile(out,JSON.stringify(result,null,2));await writeFile(out.replace(/\.json$/,'-render-state.json'),JSON.stringify({units:app.engine.b.units,phase:app.engine.b.phase,active:app.engine.b.active,round:app.engine.b.round,objective:app.engine.b.honroAct4PreviewState}));console.log(JSON.stringify({success:result.success,frame,resume,groups:groups.map(g=>({id:g.id,damageEvents:g.damage.length})),transitions}));assert(result.success&&resumed);if(contactConfig)assert.equal(contacts.length,contactConfig.captures.length);
