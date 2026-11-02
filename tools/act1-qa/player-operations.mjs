/** Native App-action simulation, never browser evidence. No actor/resource writes.
 * Uses production App.frame/charge/defend/selection, idealized legal aim gesture.
 */
import assert from 'node:assert/strict';
export const SUPPORTED_PLAYER_OPERATIONS=new Set(['frame','ready','move','aim','selectSkill','fire','jump','drop','select','defend','interact','dialogueNext']);
export function assertSupportedPlayerOperation(name){assert(SUPPORTED_PLAYER_OPERATIONS.has(name),`Unsupported player operation: ${name}`);}
export function createPlayerOperations({app,g,C,record=()=>{}}){
 let now=g.performance.now(),pendingMove=0,frames=0;g.performance={now:()=>now};
 const e=()=>app.engine,active=()=>e().active,terminal=()=>['won','lost'].includes(e().b.phase);
 const log=(op,data={})=>record({op:'app-operation',operation:op,round:e().b.round,actor:active()?.id,frame:frames,...data});
 function allowed(){return !!app.canInput();}
 function frame(){
  assertSupportedPlayerOperation('frame');now+=C.STEP*1000;frames++;
  if(app.dialogue)g.HonroStory.next(app);
  app.stick.x=pendingMove;pendingMove=0;app.scene.render=()=>{};app.frame(now);app.stick.x=0;
  if(app.lastError)throw Error('Production App.frame failed: '+app.lastError);
 }
 function ready(limit=30000){for(let n=0;n<limit&&!allowed()&&!terminal();n++)frame();return allowed();}
 function move(direction,dt){assert(Number.isFinite(direction)&&Math.abs(direction)<=1,'Movement outside ordinary axis');assert(Math.abs(dt-C.STEP)<1e-9,'Unsupported movement timestep');if(!allowed())return false;pendingMove=direction;return true;}
 function selectSkill(id){if(!allowed()||app.charging)return false;const u=active();if(!g.HonroStakeCrossing.skills(e().b,u).includes(id)||C.SKILLS[id]?.passive)return false;app.cancelInput();pendingMove=0;app.selected=id;app.selectedByUnit[u.id]=id;log('selectSkill',{skill:id});return true;}
 function aim(angle){if(!allowed()||!Number.isFinite(angle))return false;assert(angle>=-85&&angle<=265,'Aim outside normal facing-relative UI range');const u=active(),facing=angle>90?-1:1;
  // Exact normal stick-facing operation; never assign actor facing/angle directly.
  e().face(facing);const display=facing>0?angle:180-angle;app.adjustAngle(u,display-app.displayAngle(u));assert(Math.abs(u.angle-angle)<1e-6,'Aim clamp mismatch');return true;
 }
 function fire(id,angle,power,ai=false){assert(!ai,'Player adapter rejects AI fire bypass');assert(Number.isFinite(power)&&power>=0&&power<=1,'Charge outside normal interval');if(!allowed())return false;const u=active();if(!selectSkill(id)||!aim(angle))return false;
  const beforeShot=e().b.shot;if(!app.beginCharge()){log('beginChargeRejectedOrSecondary',{skill:id});return false;}
  let n=0;while(app.charging&&allowed()&&app.chargePower(now)+1e-12<power&&n++<2400&&!terminal())frame();assert(n<2400,'Charge observation limit');
  app.releaseCharge();const actual=e().b.lastShots?.[u.id],accepted=e().b.shot>beforeShot;log('fire',{skill:id,requested:{angle,power},actual,accepted});return accepted;
 }
 function jump(u=active()){assert(u===active(),'Inactive hero jump rejected');if(!allowed())return false;const before=u.moveLeft;app.jump();const ok=u.moveLeft<before;log('jump',{accepted:ok});return ok;}
 function drop(u=active()){assert(u===active(),'Inactive hero drop rejected');if(!allowed()||!e().canDrop())return false;app.drop();const ok=!!u.platformDrop;log('drop',{accepted:ok});return ok;}
 function select(id){if(!allowed())return false;app.selectHero(id);log('select',{id});return active()?.id===id;}
 function defend(){if(!allowed())return false;const u=active(),before=[e().b.phase,e().b.side,e().b.round,u.id,u.acted];app.defend();const after=[e().b.phase,e().b.side,e().b.round,active()?.id,u.acted],ok=before.some((v,i)=>v!==after[i]);log('defend',{accepted:ok});return ok;}
 function interact(marker){if(!g.HonroInteractions.candidates(app).some(x=>x.ok&&x.marker.id===marker?.id))return false;const ok=g.HonroInteractions.use(app,marker);log('interact',{marker:marker.id,accepted:ok});return ok;}
 function dialogueNext(){if(app.dialogue)g.HonroStory.next(app);}
 function item(){throw Error('Unsupported player operation: Engine.item has no current UI binding');}
 return{frame,ready,move,aim,selectSkill,fire,jump,drop,select,defend,interact,dialogueNext,item,get frames(){return frames;},get now(){return now;},scope:'Native actual App actions with DOM/render/clock doubles and idealized aim gesture; not browser input'};
}
