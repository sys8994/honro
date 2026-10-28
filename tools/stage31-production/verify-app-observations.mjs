/** Replays ordinary input tape on the real App. No geometry, actor/resource or
 * event-state overrides. Additional observations are NOT exported gate passes. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createAppAdapter} from '../stage31/app-adapter.mjs';
import {runtimeDigest} from '../stage31/probes.mjs';
const [file,tapeFile,out]=process.argv.slice(2);if(!out)throw Error('draft tape output required');
const p=JSON.parse(await readFile(file,'utf8')),tape=JSON.parse(await readFile(tapeFile,'utf8'))[0],a=await createAppAdapter(p,'stage-31',{entryBuild:tape.entryBuild}),{g,app}=a;
let frame=0,index=0,resumed=false;const hurts=[],impacts=[],shots=[],trace=[],resume=[],transitions=[];let lastState='';
function hook(){const e=app.engine,hurt=e.hurt.bind(e),impact=e.impact.bind(e);e.hurt=(u,...args)=>{const before=u.hp+u.shield,r=hurt(u,...args),amount=before-u.hp-u.shield;if(amount>0)hurts.push({frame,target:u.id,owner:args[1],amount});return r;};e.impact=(q,h)=>{impacts.push({frame,owner:q.owner,skill:q.skill,terrain:h.terrain?.id,unit:h.unit?.id,x:q.x,y:q.y});return impact(q,h);};}
hook();
function tick(){a.tick();frame++;const b=app.engine.b,q=b.honroAct4PreviewState,state=JSON.stringify({phase:b.phase,boat:q?.boat?.phase,complete:q?.complete,enemies:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length});if(state!==lastState){transitions.push({frame,...JSON.parse(state)});lastState=state;}if(frame%15===0)trace.push({frame,round:b.round,active:b.active,units:b.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,grounded:app.engine.grounded(u)}))});}
for(const input of tape.inputs){
 const e=app.engine,b=e.b;
 if(!resumed&&frame>12000&&app.canInput()&&!app.dialogue&&!b.projectiles.length){
  const before=JSON.parse(JSON.stringify({units:b.units,objective:b.honroAct4PreviewState,round:b.round,active:b.active,phase:b.phase}));app.stopBattle();assert(app.profile.honroBattle);app.continue();app.close();assert(app.engine,'Actual App Continue must restore engine');const z=app.engine.b,after=JSON.parse(JSON.stringify({units:z.units,objective:z.honroAct4PreviewState,round:z.round,active:z.active,phase:z.phase}));assert.deepEqual(after,before);resume.push({frame,inputIndex:index,result:'pass',scope:'Actual stopBattle/persist/Continue; exact units, event state, round, active and phase preserved'});resumed=true;hook();
 }
 const engine=app.engine;
 if(input.op==='advance'){for(let i=0;i<input.frames;i++)tick();}
 else if(input.op==='skip-dialogue')a.skip();else if(input.op==='close-modal')app.close();else if(input.op==='interact')a.interact();
 else if(app.canInput()){if(input.op==='select')app.selectHero(input.actor);else if(input.op==='move'){for(let i=0;i<input.frames;i++){if(app.canInput())engine.move(input.direction,g.HONRO_CORE.STEP);tick();}}else if(input.op==='jump')engine.jump();else if(input.op==='drop')app.drop();else if(input.op==='defend')app.defend();else if(input.op==='fire'){const u=engine.active,pose={x:u.x,y:u.y};shots.push({frame,actor:u.id,...pose,input,accepted:!!engine.fire(input.skill,input.angle,input.power)});}}
 index++;
}
const card=p.production.cards['stage-31'],groups=card.encounters.map(group=>({id:group.id,damage:hurts.filter(h=>group.members.some(u=>u.id===h.owner)&&['archer','mage','knight','occultist'].includes(h.target))}));
const result={version:1,runner:'honro-production-app-observation-v1',scope:a.scope+' No gate relabeling or automatic art approval.',fingerprint:g.HonroProductionContract.fingerprint(p,'stage-31'),runtimeSha256:await runtimeDigest(),verifierSha256:createHash('sha256').update(await readFile(import.meta.filename)).digest('hex'),success:a.success(),frame,entryBuild:tape.entryBuild,resume,groups,transitions,shots,hurts,impacts,trace,final:a.state()};
await mkdir(out.substring(0,out.lastIndexOf('/')),{recursive:true});await writeFile(out,JSON.stringify(result,null,2));console.log(JSON.stringify({success:result.success,frame,resume,groups:groups.map(g=>({id:g.id,damageEvents:g.damage.length})),transitions}));assert(result.success&&resumed);
