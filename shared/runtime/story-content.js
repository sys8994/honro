(function(G){'use strict';
const C=G.HonroNarrativeCatalogue,D=C.data,V=G.HonroStoryContentV1;
const scene=V.scene,version=V.version;
const introductions=Object.fromEntries(Object.entries(D.stages).map(([id,s])=>[id,{art:s.narrationArt,narration:s.narration,story:s.story,followups:s.storyFollowups}]));
const mapScenes=D.mapScenes,outros=Object.fromEntries(Object.entries(D.stages).map(([id,s])=>[id,s.outro])),summaries=Object.fromEntries(Object.entries(D.stages).map(([id,s])=>[id,s.storySummary]));
const events=G.HONRO_NARRATIVE_COMPAT.story.events,ledgerPages=G.HONRO_NARRATIVE_COMPAT.story.ledgerPages;
function eventLines(app,ev){const b=app.engine.b;if(b.honroCustom)return ev.lines||[];if(!C.active(b))return (b.honroNarrativeRevision===1?V:G.HonroStoryContentV0).eventLines(app,ev);
 const id=b.honroStage,hs=b.honroState;let key=`${id}.events.${ev.id}`;
 if(id===4&&ev.id==='siege-0'){const gate=b.units.find(u=>u.id==='objective');key='4.siege-0.'+(gate&&b.units.some(u=>u.side===0&&!u.dead&&Math.abs(u.x-gate.x)<420)?'near':'far');}
 if(id===5&&ev.id==='lower-beasts'){const intact=G.HonroQuestTargets.records(b).some(t=>t.id==='cliff-cleat'&&!t.broken);key='5.lower-beasts.'+(!intact?'broken':hs.ritual?.active?'intactHolding':'intactNotHolding');}
 if(id===7&&['yard-hounds','upper-crows'].includes(ev.id))key=`7.${ev.id}.`+((hs.rescuedCount||0)>=3?'afterRescue':'beforeRescue');
 if(id===8&&ev.id==='bier-crows')key='8.bier-crows.'+(G.HonroQuestTargets.records(b).some(t=>t.honroSeal&&!t.broken)?'sealsIntact':'sealsBroken');
 if(id===9&&ev.id==='evac-beasts')key='9.evac-beasts.'+((hs.receivers||0)>=2?'afterReceivers':'beforeReceivers');
 if(id===9&&ev.id==='evac-crows')key='9.evac-crows.'+(b.honroStaging?.hidden?.['npc-sodan']?'sodanHidden':(hs.receivers||0)>=2?'receiversReady':'sodanVisible');
 const rows=C.rows(key);return rows.length?rows:ev.lines||[];
}
function interaction(app,m){const b=app.engine.b;if(b.honroCustom)return m.lines||null;if(!C.active(b))return (b.honroNarrativeRevision===1?V:G.HonroStoryContentV0).interaction(app,m);const hs=b.honroState,id=b.honroStage;
 if(m.action==='ledger')return C.rows('interaction.ledger');
 if(m.action==='ritual')return C.rows('interaction.ritual.currentWaterfall');
 if(m.action==='receiver'){
  if(id===9&&b.honroStaging?.entrance&&hs.receivers===1)return [];
  const key=hs.receivers===1?'interaction.receiver.first':id===10?'interaction.receiver.second.stage10':'interaction.receiver.second';
  return scene('receiver-'+id+'-'+m.id,m.label,C.rows(key),{delivery:'dialogue'});
 }
 if(m.action==='rescue'){const first=!hs.flags['story:sodan-known'];hs.flags['story:sodan-known']=true;const rows=C.rows('interaction.rescue.'+m.label);if(!rows.length)return V.interaction(app,m);rows[0][0]=app.engine.active?.name||'설오';if(!first)rows.splice(2);return scene('rescue-'+m.target,m.label+'의 증언',rows,{delivery:'dialogue'});}
 return null;
}
const cooperation=b=>b&&!C.active(b)?V.cooperation():C.rows('10.cooperation'),cooperationDefense=b=>b&&!C.active(b)?V.cooperationDefense():C.rows('10.cooperationDefense'),finaleMidpoint=b=>b&&!C.active(b)?V.finaleMidpoint():C.rows('10.finaleMidpoint');
function resolveDeferred(app,entry){return V.resolveDeferred(app,entry);}
function beforeOutcome(app,lines){return V.beforeOutcome(app,lines);}
G.HonroStoryContent={version,introductions,mapScenes,outros,summaries,events,ledgerPages,scene,eventLines,interaction,resolveDeferred,beforeOutcome,cooperation,cooperationDefense,finaleMidpoint};
})(globalThis);
