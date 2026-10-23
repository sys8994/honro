(function(G){'use strict';
const ids={first:'mukjong-pitch-first-rise',tighten:'mukjong-pitch-tighten'},beats={first:'pitch-first',tighten:'pitch-tighten'};
const active=app=>!app.training&&app.engine?.b.honroStage===18&&!app.engine.b.honroCustom;
function state(b){return b.honroState.mukjongPitchDialogue??={version:1,lastRitual:0};}
function ended(app){return app.done||G.HonroMukjongAudio.stopped(app.engine.b);}
function prune(app){if(!active(app)||!ended(app))return;const s=app.engine.b.honroState.mukjongPitchDialogue;if(!s)return;for(const key of['first','tighten'])if(s[key]?.status==='pending'){s[key].status='discarded';s[key].reason='keeper-or-battle-ended';app.dirty=true;}}
function heard(app,event){if(!active(app)||ended(app)||event.step<1)return;const s=state(app.engine.b);if(s.first)return;s.first={status:'pending',heard:{...event},completed:false,readComplete:false};app.dirty=true;}
function ritual(app,event){if(!active(app)||ended(app))return;const b=app.engine.b,s=state(b);if(event.serial<=(s.lastRitual||0))return;s.lastRitual=event.serial;
 if(!event.audible||event.step<3||!s.first?.completed||event.serial<=(s.first.completedSerial||0)||s.tighten)return;
 s.tighten={status:'pending',heard:{...event},completed:false,readComplete:false};app.dirty=true;
}
function safe(app){const e=app.engine,b=e.b,u=e.active,hs=b.honroState;if(app.screen!=='battle'||app.dialogue||app.modal?.classList.contains('open')||G.document?.hidden||app.charging||app.stickPointer||app.contacts?.size||app.keys?.size||Math.abs(app.stick?.x||0)+Math.abs(app.stick?.y||0)>.01)return false;
 if(b.side!==0||b.phase!=='aim'||!app.canInput()||!u||u.airborne||u.jumping||u.platformDrop||u.meleeAction||u.meleeFollow==='ready'||Math.abs(u.vx||0)+Math.abs(u.vy||0)>1||!e.grounded(u))return false;
 if(b.projectiles.length||b.volley||b.cast||b.summonTurn||b.keeperRitual?.cast||e.settleBusy()||G.HonroBellAnomaly?.blocked(b))return false;
 return !hs.storyQueue?.length&&!hs.storyBanter?.length&&!hs.banterLine&&!hs.pendingEvents?.length&&!(hs.deferredStory||[]).some(q=>b.round>=q.round);
}
function tick(app){if(!active(app))return;prune(app);if(ended(app))return;const b=app.engine.b,s=b.honroState.mukjongPitchDialogue,key=['first','tighten'].find(k=>s?.[k]?.status==='pending');if(!key||!safe(app))return;
 const lines=G.HonroNarrativeCatalogue.data.stages[18].beats[beats[key]].map(([who,text,meta])=>[who,text,{...meta,storyId:ids[key],storyTitle:'묵종',source:'mukjong-pitch'}]);
 if(!lines.every(([who,,meta])=>G.HonroStory.allowed(app,who,meta)))return;
 s[key].status='open';if(!G.HonroStory.start(app,lines,{title:'묵종',pitchEvent:key})){s[key].status='discarded';s[key].reason='speaker-unavailable';}app.dirty=true;
}
function finished(app,d,natural){if(!active(app)||!Object.hasOwn(ids,d.pitchEvent||''))return;const s=app.engine.b.honroState.mukjongPitchDialogue,event=s?.[d.pitchEvent];if(!event||event.completed)return;event.status='completed';event.completed=true;event.readComplete=!!natural;event.skipped=!natural;event.completedRound=app.engine.b.round;event.completedSerial=app.engine.b.keeperRitual?.serial||0;app.dirty=true;}
G.HonroMukjongPitchDialogue={heard,ritual,prune,tick,finished,safe};
})(globalThis);
