/** Replays ordinary input tape on the real App. No geometry, actor/resource or
 * event-state overrides. Additional observations are NOT exported gate passes. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createAppAdapter} from './app-adapter.mjs';
import {runtimeDigest} from '../stage31/probes.mjs';
const [file,tapeFile,out]=process.argv.slice(2);if(!out)throw Error('draft tape output required');
const initialSourceSHA256=createHash('sha256').update(await readFile(file)).digest('hex'),initialRuntimeSHA256=await runtimeDigest(),initialVerifierSHA256=createHash('sha256').update(await readFile(import.meta.filename)).digest('hex');
await mkdir(out.substring(0,out.lastIndexOf('/')),{recursive:true});
const p=JSON.parse(await readFile(file,'utf8')),tape=JSON.parse(await readFile(tapeFile,'utf8'))[0],a=await createAppAdapter(p,'stage-36',{entryBuild:tape.entryBuild,captureDir:out.replace(/\.json$/,'-door-native')}),{g,app}=a;
let frame=0,index=0,resumed=false;const hurts=[],impacts=[],shots=[],trace=[],resume=[],transitions=[];let lastState='';
function artDigest(b){const clean=v=>Array.isArray(v)?v.map(clean):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,clean(v[k])])):v;return createHash('sha256').update(JSON.stringify(clean([...(b.honroLandmarks||[]),...(b.honroAct4PreviewDynamic||[])].map(l=>({id:l.id,x:l.x,y:l.y,scale:l.scale,rotation:l.rotation,asset:l.asset,paintAsset:l.asset?.id==='a4:door'&&b.honroAct4Preview===36?g.HONRO_PROJECT.library.find(a=>a.id===b.honroMap?.vectorDoorAssetId):null}))))).digest('hex');}
function hook(){const e=app.engine,hurt=e.hurt.bind(e),impact=e.impact.bind(e);e.hurt=(u,...args)=>{const before=u.hp+u.shield,r=hurt(u,...args),amount=before-u.hp-u.shield;if(amount>0)hurts.push({frame,target:u.id,owner:args[1],amount});return r;};e.impact=(q,h)=>{impacts.push({frame,owner:q.owner,skill:q.skill,terrain:h.terrain?.id,unit:h.unit?.id,x:q.x,y:q.y});return impact(q,h);};}
hook();
function tick(){a.tick();frame++;if(frame%1200===0)global.gc?.();const b=app.engine.b,q=b.honroAct4PreviewState,state=JSON.stringify({phase:b.phase,boat:q?.boat?.phase,complete:q?.complete,enemies:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length});if(state!==lastState){transitions.push({frame,...JSON.parse(state)});lastState=state;}if(frame%15===0)trace.push({frame,round:b.round,active:b.active,units:b.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,grounded:app.engine.grounded(u)}))});}
for(const input of tape.inputs){
 const e=app.engine,b=e.b;
 if(!resumed&&frame>12000&&app.canInput()&&!app.dialogue&&!b.projectiles.length){
  const before=JSON.parse(JSON.stringify({units:b.units,objective:b.honroAct4PreviewState,round:b.round,active:b.active,phase:b.phase,artSha256:artDigest(b)}));app.stopBattle();assert(app.profile.honroBattle);app.continue();app.close();assert(app.engine,'Actual App Continue must restore engine');const z=app.engine.b,after=JSON.parse(JSON.stringify({units:z.units,objective:z.honroAct4PreviewState,round:z.round,active:z.active,phase:z.phase,artSha256:artDigest(z)}));assert.deepEqual(after,before);resume.push({frame,inputIndex:index,result:'pass',scope:'Actual stopBattle/persist/Continue; exact units, event state, round, active, phase and resolved static/dynamic art preserved'});resumed=true;hook();
 }
 const engine=app.engine;
 if(input.op==='advance'){for(let i=0;i<input.frames;i++)tick();}
 else if(input.op==='camera')a.camera(input.x,input.y,input.scale);else if(input.op==='next-dialogue')a.next();else if(input.op==='skip-dialogue')a.skip();else if(input.op==='close-modal')app.close();else if(input.op==='interact')a.interact();
 else if(app.canInput()){if(input.op==='select')app.selectHero(input.actor);else if(input.op==='move'){for(let i=0;i<input.frames;i++){if(app.canInput())engine.move(input.direction,g.HONRO_CORE.STEP);tick();}}else if(input.op==='jump')engine.jump();else if(input.op==='drop')app.drop();else if(input.op==='defend')app.defend();else if(input.op==='fire'){const u=engine.active,pose={x:u.x,y:u.y};shots.push({frame,actor:u.id,...pose,input,accepted:!!engine.fire(input.skill,input.angle,input.power)});}}
 index++;
}
// Final image is drawn from the actually completed/restored App, not injected terminal actors.
a.camera(6650,1900,.53);app.scene.canvas.width=720;app.scene.canvas.height=1100;app.scene.render(app.engine,0,'',.6,false,0);await writeFile(out.replace(/\.json$/,'-completed-mobile.png'),app.scene.canvas.toBuffer('image/png'));
const card=p.stages.find(s=>s.metadata.stageId===36),groups=card.encounters.map(group=>({id:group.id,damage:hurts.filter(h=>group.unitIds.includes(h.owner)&&['archer','mage','knight','occultist'].includes(h.target))}));
assert.equal(await runtimeDigest(),initialRuntimeSHA256,'Runtime changed during36 replay');assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),initialSourceSHA256,'Source changed during36 replay');assert.equal(createHash('sha256').update(await readFile(import.meta.filename)).digest('hex'),initialVerifierSHA256,'Verifier changed during36 replay');
const result={projectSha256:initialSourceSHA256,version:1,runner:'honro-production-app-observation-v1',scope:a.scope+' No gate relabeling or automatic art approval.',fingerprint:createHash('sha256').update(JSON.stringify(p)).digest('hex'),runtimeSha256:await runtimeDigest(),verifierSha256:createHash('sha256').update(await readFile(import.meta.filename)).digest('hex'),success:a.success(),renders:a.renders,frame,entryBuild:tape.entryBuild,resume,groups,transitions,shots,hurts,impacts,trace,final:a.state()};
await mkdir(out.substring(0,out.lastIndexOf('/')),{recursive:true});await writeFile(out,JSON.stringify(result,null,2));await writeFile(out.replace(/\.json$/,'-render-state.json'),JSON.stringify({units:app.engine.b.units,phase:app.engine.b.phase,active:app.engine.b.active,round:app.engine.b.round,objective:app.engine.b.honroAct4PreviewState}));console.log(JSON.stringify({success:result.success,frame,resume,groups:groups.map(g=>({id:g.id,damageEvents:g.damage.length})),transitions}));assert(result.success&&resumed);

assert(result.final.objective.door.renderedAt!==undefined);assert(result.final.objective.door.soundAt!==undefined);for(const id of ['A4.S36.DOOR.01','A4.S36.DOOR.02'])assert(result.final.objective.receipts.includes(id));assert(result.final.objective.events.leave.terminal);
