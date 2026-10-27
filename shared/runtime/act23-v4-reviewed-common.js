(function(G){'use strict';
const V=G.HonroAct23V4,C=G.HONRO_CORE,R=G.HonroAct23V4Reviewed,P=G.HonroAct23V4ReviewedChapters;
const enabled=()=>V.preview()&&G.HONRO_ACT23_V4_REVIEWED_COMMON?.revision===1;
const row=id=>G.HONRO_ACT23_V4_REVIEWED_COMMON?.rows.find(r=>r.id===id);
const live=u=>V.alive(u)&&!u.summoned&&!u.enthrall;
function selectable(e,u){const a=e.active;return live(u)&&u.side===0&&!u.acted&&e.b.side===0&&e.b.phase==='aim'&&!a?.retreat&&a?.meleeFollow!=='ready'&&!(a?.platformDrop&&a.platformDrop.phase!=='land');}
function usable(e,u,id){const s=C.SKILLS[id];return live(u)&&!u.retreat&&!!s&&!s.passive&&u.loadout?.includes(id)&&e.skillAllowed(s,u)&&(!s.ultimate||u.side!==0||e.b.mode==='practice'||C.ultimateUnlocked(e.b.heroes[u.cls],u.cls))&&u.focus>=e.manaCost(s,u)&&!e.cooldownLeft(u,id);}
function lampAvailable(e,m,spirit,heroes){if(!m?.id?.startsWith('spirit-lamp')||m.action!=='act2'||m.collected||m.requiredClass&&!heroes.some(u=>live(u)&&u.cls===m.requiredClass)||Math.hypot(spirit.x-m.x,spirit.y-m.y)>(m.radius||1200))return false;
 // Inspect the authored interaction pose, not the observer's current distance.
 // The guide explicitly asks the player to approach a reachable lamp.
 const u=heroes.find(live),surface=e.surface(m.x,m.y-80,m.y+100);return !!u&&!!surface&&C.validTerrainContactPose(e.b.terrain,{...u,x:m.x,y:surface.y});
}
function allowed(app,meta){if(!enabled())return false;const b=app.engine?.b;if(!V.active(b))return false;
 if(meta?.rowId==='EDGE.RUNTIME.VOID.REJOIN_PROMPT'){if(b.honroStage!==27||G.HonroAct3Void.blocked(b)||b.honroAct3Void?.state==='RESOLVED')return false;const a=V.heroes(b).find(u=>u.cls==='archer'),m=V.marker(b,'family-manifest'),z=b.honroMap?.act3?.voidEncounter?.trigger||b.honroMap?.act3?.crossings?.at(-1)?.landing,inZone=!!a&&!!z&&a.x>=z.left&&a.x<=z.right&&Math.abs(a.y-z.y)<125;return !!a&&!!m&&!inZone&&!(Math.abs(a.x-m.x)<520&&Math.abs(a.y-m.y)<150);}
 return false;
}
function templeAvailable(b){return enabled()&&P.active(b)&&b.honroStage===16&&['objective','resident-1'].every(id=>live(b.units.find(u=>u.id===id)))&&['16.elder','16.disciple','16.work-exit'].every(id=>V.steps(b).some(s=>s.id===id));}
function rowsReviewed(ls){return enabled()&&Array.isArray(ls)&&ls.length>0&&ls.every(l=>l?.[2]?.reviewedCommonRevision===1&&row(l[2].rowId)?.text===l[1]&&l[0]==='안내');}
function guide(app,id){if(!allowed(app,{rowId:id})||!V.safe(app))return false;const r=row(id);return G.HonroStory.start(app,[['안내',r.text,{rowId:id,canonicalId:id,reviewedCommonRevision:1,kind:'guide',storyId:'v4.common.'+id}]],{title:app.stage.name});}
const originalRows=R.rowsReviewed;R.rowsReviewed=ls=>rowsReviewed(ls)||originalRows(ls);
const accepts=R.accepts;R.accepts=(app,ls)=>rowsReviewed(ls)?ls.every(l=>allowed(app,l[2])):accepts(app,ls);
function lockedId(index,branch){return index<4?'EDGE.SCENES_FIRSTSPIRIT_OBSERVATION_CURRENT_'+index:index===4?'EDGE.VALUES_FIRSTSPIRIT_REPLY_'+({manifest:'MANIFEST',lamp:'LAMP',soul:'NEITHER'}[branch]||'NEITHER'):'EDGE.RUNTIME.FIRST_SPIRIT.GUIDE.213';}
function markLocked(lines,branch){if(!enabled())return lines;return lines.map((l,i)=>[l[0],l[1],{...l[2],canonicalId:lockedId(i,branch),...(i===5?{canonicalParts:['EDGE.RUNTIME.FIRST_SPIRIT.GUIDE.211','EDGE.RUNTIME.FIRST_SPIRIT.GUIDE.213']}:{}),commonReviewRevision:1}]);}
const resolve=G.HonroNarrativeCatalogue.resolve;G.HonroNarrativeCatalogue.resolve=function(b,st){const out=resolve(b,st);if(templeAvailable(b))return{...out,guide:row('EDGE.RUNTIME.TEMPLE.GUIDE').text,honroGuideId:'EDGE.RUNTIME.TEMPLE.GUIDE'};return out;};
const help=G.HonroObjectives.help;G.HonroObjectives.help=function(app){const out=help(app);return templeAvailable(app.engine?.b)?{...out,guide:row('EDGE.RUNTIME.TEMPLE.GUIDE').text,guideRowId:'EDGE.RUNTIME.TEMPLE.GUIDE'}:out;};
G.HonroAct23V4ReviewedCommon={enabled,row,usable,selectable,lampAvailable,templeAvailable,allowed,guide,rowsReviewed,markLocked};
})(globalThis);
