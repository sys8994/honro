/** Native production aiming-guide branch, not a browser rendering claim. */
import {createCanvas} from '@napi-rs/canvas';
export function productionAimPreview({app,g,C,record=()=>{}}){
 const canvas=createCanvas(640,480),renderer=new C.Renderer(canvas),c=canvas.getContext('2d');let frames=0,calls=0,unavailableFrames=0,lastUnavailable=null;
 function render(e,dt,selected,power,charging){
  frames++;const b=e.b,u=e.active,scene=app.scene;
  // renderer.js targetingGuides guard; explicit dialogue exclusion is conservative
  // for the scene-camera DOM double (it never fabricates a visible preview).
  if(e.noncombatWalk()||g.HonroSodanWithdrawal?.worldOutroDialogue(scene.storyFrame?.app)||scene.storyFrozen||app.dialogue||!u||b.phase!=='aim'||u.summoned||!selected||!e.canAct())return;
  const selectedAvailable=g.HonroStakeCrossing.skills(b,u).includes(selected);
  if(!selectedAvailable){unavailableFrames++;const key=u.id+':'+selected;if(key!==lastUnavailable){record({op:'production-preview-transient-unavailable',actor:u.id,skill:selected,frame:frames,loadout:[...u.loadout],scope:'Actual render-before-HUD cadence; not an intentional equipped skill selection'});lastUnavailable=key;}}else lastUnavailable=null;
  const before=JSON.stringify(b.honroState?.act23v4?.reviewedChapter||{});
  renderer.time=frames*C.STEP;renderer.scale=scene.scale||.7;c.clearRect(0,0,640,480);
  renderer.predictionGuide(c,e,u,selected,power,charging,u.cls==='archer'&&(u.ranks?.AP01||0)>0);calls++;
  const after=JSON.stringify(b.honroState?.act23v4?.reviewedChapter||{});
  if(before!==after)record({op:'production-preview-observation',actor:u.id,skill:selected,selectedAvailable,angle:u.angle,power,charging,frame:frames,after:JSON.parse(after)});
 }
 return {render,stats:()=>({frames,calls,unavailableFrames,scope:'Actual production Renderer.predictionGuide on native canvas, guarded selected input only; not complete scene/browser rendering'})};
}
