(function(G){'use strict';
// Scene-only intent. Never serialize controls into battle/save/attack math.
const states=new WeakMap(),attached=new WeakSet(),session=G.crypto?.randomUUID?.()||Date.now().toString(36);let nextScene=0;
function prime(scene,b){states.set(scene,{battle:b,token:session+':'+(++nextScene),intent:0,manual:false,gesture:false,attacks:0});}
function snapshot(scene){if(!scene)return null;const s=states.get(scene);return{x:scene.x,y:scene.y,scale:scene.scale,manual:scene.manual,cameraToken:s?.token,cameraIntent:s?.intent||0};}
function canRestore(scene,camera){const s=states.get(scene);return !s||s.intent===0||camera?.cameraToken===s.token&&camera?.cameraIntent===s.intent;}
function blocksFocus(scene){const s=states.get(scene);return !!s&&(s.manual||s.gesture);}
function manual(scene,gesture=false){const s=states.get(scene);if(!s)return;s.intent++;s.manual=true;s.gesture=s.gesture||gesture;scene.manual=true;scene.focusUntil=scene.speakerUntil=0;scene.storyTween=null;if(!scene.storyFrozen)scene.goalFocus=null;}
function endGesture(scene){const s=states.get(scene);if(s)s.gesture=false;}
function begin(scene,actorId){const s=states.get(scene);if(!s)return;s.intent++;s.attacks++;s.actorId=actorId;s.manual=s.gesture;scene.manual=s.manual;scene.focusId=null;scene.focusUntil=scene.speakerUntil=0;
 // A new accepted action supersedes old insert/release ownership. Keep an
 // active required dialogue frame; ordinary input cannot cast through it.
 if(!scene.storyFrozen&&!scene.storyFrame){scene.storyTween=null;scene.goalFocus=null;}
 G.HonroReinforcementCamera?.interrupt(scene);
}
function attach(app,e){if(attached.has(e))return;attached.add(e);const fire=e.fire.bind(e),previous=e.onAttackStart;
 const start=actorId=>{if(app.engine===e&&app.scene)begin(app.scene,actorId);};
 e.fire=function(...args){const actor=e.active?.id,continuation=e.active?.meleeFollow==='ready',accepted=fire(...args);if(accepted&&!continuation)start(actor);return accepted;};
 e.onAttackStart=actorId=>{previous?.(actorId);start(actorId);};
}
G.HonroAttackCamera={prime,snapshot,canRestore,blocksFocus,manual,endGesture,begin,attach,status:scene=>{const s=states.get(scene);return s?{intent:s.intent,attacks:s.attacks,manual:s.manual,gesture:s.gesture,actorId:s.actorId}:null;}};
})(globalThis);
