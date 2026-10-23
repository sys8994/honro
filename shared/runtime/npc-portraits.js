(function(G){'use strict';
// Display identity only. Do not rename speakers, alter actors or infer a class.
function resolve(app,who,meta={},actor){
 const c=G.HONRO_NPC_PORTRAITS;if(!c||!who||['서술','기록','길 위의 기록','안내'].includes(who)||['narration','document','guide'].includes(meta.kind)||c.withoutPortraitRows.includes(meta.rowId))return null;
 const stage=app.stage?.id||app.engine?.b.honroStage,row=c.rows[meta.rowId];let id;
 if(row&&row.speaker===who)id=row.asset;
 if(!id)id=c.scenes[(meta.storyId||'')+'|'+who];
 if(!id){const binding=c.actors[stage+'|'+actor?.id];if(binding&&binding.speaker===who&&(!binding.marker||app.engine?.b.honroMarkers?.some(m=>m.id===binding.marker&&m.target===actor.id)))id=binding.asset;}
 // A rescue's first-disclosure row keeps an old rowId even when its speaker
 // is substituted with the actual marker's name. Confirm that marker explicitly.
 if(!id&&stage===7){const d=c.dynamicRescues.find(d=>d.stage===stage&&(d.label===who||who==='구조한 주민'&&c.rescueAliasRows.includes(meta.rowId)&&meta.storyId===d.storyId)&&app.engine?.b.honroMarkers?.some(m=>m.action==='rescue'&&m.label===d.label&&m.target===d.actorId));if(d)id=d.portraitTemplate;}
 if(!id)id=c.named[who]; // Deliberately no generic 주민 / class fallback.
 return id&&c.assets[id]?.src?{...c.assets[id],expression:'base'}:null;
}
const hidden=(who,meta={})=>!who||G.HONRO_NPC_PORTRAITS?.hiddenRows.includes(meta.rowId)||false;
G.HonroNPCPortraits=Object.freeze({resolve,hidden});
})(globalThis);
