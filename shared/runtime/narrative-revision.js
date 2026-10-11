(function(G){'use strict';
const clone=v=>JSON.parse(JSON.stringify(v)),active=b=>!b?.honroCustom&&b?.honroNarrativeRevision===1;
const bindingId='sodan-binding';
// Revision opt-in is authored into new maps, never inferred on Continue.
function author(project){return {...project,stages:project.stages.map(original=>{
 if(!original.metadata?.campaign)return original;const st=clone(original);st.initialState??={};st.initialState.honroNarrativeRevision=1;
 if(st.metadata.stageId===2){const u=st.units.find(u=>u.id==='objective');if(u)u.name='장례 상여';}
 if(st.metadata.stageId===10&&!st.terrains.some(t=>t.id===bindingId)){
  const u=st.units.find(u=>u.id==='boss'),x=(u?.x||2500)-285,y=(u?.y||2180)-155;
  st.terrains.push({id:bindingId,name:'바깥 주박',type:'solid',points:[{x,y},{x:x+96,y},{x:x+96,y:y+126},{x,y:y+126}],baseMaterial:'wood',oneWay:false,breakable:true,layer:'terrain',properties:{device:'ward',honroBinding:true,hp:800,maxHp:800}});
 }return st;
})};}
const contentFor=G.HonroObjectiveRevision.contentFor;
G.HonroObjectiveRevision.contentFor=function(b,st){if(active(b)&&b.honroNarrativeContent)return b.honroNarrativeContent;
 const result=contentFor(b,st);
 // Existing bespoke chapter snapshots and earlier objective/split revisions
 // remain their own authority. Only the old unsnapshotted current story needs
 // the frozen pre-redesign payload.
 if(b&&!b.honroCustom&&!active(b)&&result===st)return G.HONRO_NARRATIVE_V0?.content?.[b.honroStage-1]||result;
 return result;
};
function prepareFresh(b){if(!active(b))return;const st=G.HONRO_CONTENT.stages[b.honroStage-1];b.honroNarrativeContent=clone(contentFor(b,st));
 if(b.honroStage===20){b.honroConvoyActors=b.units.filter(u=>u.honroConvoyMember);b.units=b.units.filter(u=>!u.honroConvoyMember);updateConvoy(b);}
 if(b.honroStage===2){const u=b.units.find(u=>u.id==='objective');if(u)u.name='장례 상여';}
 if(b.honroStage===10){const boss=b.units.find(u=>u.id==='boss');if(!boss)return;boss.fixed=true;
  const hp=Math.max(1,Math.round(boss.maxHp*.58));for(const ts of [b.terrain,b.honroWorldTerrain]){const t=ts?.find(t=>t.id===bindingId);if(t)t.hp=t.maxHp=hp;}
  // The two receiving arrays were made in chapter 9. Here the task is joining
  // their existing flow, not repeating two installation interactions.
  for(const m of b.honroMarkers)if(m.action==='receiver')m.collected=true;b.honroState.receivers=2;
  b.honroState.sodanBinding={revision:1,phase:'bound',bodyHp:boss.hp};
 }
}
function updateConvoy(b){for(const u of b.honroConvoyActors||[]){const leader=b.units.find(v=>v.id===u.honroConvoyMember.target);if(!leader)continue;const x=leader.x+u.honroConvoyMember.dx,hit=G.HonroMapEngine.surfaceY(b.terrain,x,leader.y);if(!hit||Math.abs(hit.y-leader.y)>160)continue;Object.assign(u,{x,y:hit.y,moving:leader.moving||0,facing:leader.facing||1,honroVisualOnly:true});}}
function tick(app,dt){const b=app.engine.b;if(!active(b))return;if(!app.dialogue)updateConvoy(b);const a=b.honroState.act2;if(!a?.drainRevealPending)return;
 if(app.dialogue||app.modal?.classList.contains('open')||app.charging||['flight','review','summon','ally'].includes(b.phase)||b.projectiles.length||app.engine.settleBusy())return;
 const ids=b.honroDrainRevealTerrains||[],terrain=ids.map(id=>b.terrain.find(t=>t.id===id));if(terrain.some(t=>!t))return;
 if(terrain.some(t=>b.units.some(u=>!u.dead&&u.hp>0&&G.HONRO_CORE.terrainRectIntersects(t,u.x-u.r-4,u.y-u.h-4,u.r*2+8,u.h+10,.01))))return;
 for(const list of [b.terrain,b.honroWorldTerrain])for(const id of ids){const t=list?.find(t=>t.id===id);if(t)t.broken=false;}
 a.drainRevealPending=false;a.drainRevealed=true;b.sceneVersion++;app.event('물이 빠진 바위 가장자리가 드러났다. 아래 물길로 걸어갈 수 있다.');app.dirty=true;
}
function reveal(b,row){const q=row?.[2]?.revealName;if(!active(b)||!q)return;const u=b.units.find(u=>u.id===q.unitId);if(!u)return;u.name=q.name;(b.honroState.revealedNames??={})[q.unitId]=q.name;}
function finishStory(app,d){const b=app.engine?.b;if(!active(b))return;for(const row of d.lines||[])reveal(b,row);const ids=[...new Set((d.lines||[]).map(l=>l[2]?.storyId).filter(Boolean))];b.honroState.completedStory??={};for(const id of ids)b.honroState.completedStory[id]=true;
 if(b.honroStage===10&&b.honroState.sodanBinding?.phase==='offering'&&ids.some(id=>id.includes('cooperation')&&!id.includes('defense')))b.honroState.sodanBinding.phase='accepted';
}
function bindingReady(b){return active(b)&&b.honroStage===10&&!!b.terrain.find(t=>t.id===bindingId)?.broken;}
function beforeCooperation(app){const b=app.engine.b;if(!active(b))return null;const state=b.honroState.sodanBinding;if(!bindingReady(b)||!state)return false;
 if(state.phase==='bound'){state.phase='offering';app.sayLines(G.HonroStoryContent.cooperation());app.dirty=true;return false;}
 return state.phase==='accepted';
}
function attach(app,e){if(!active(e.b)||e.b.honroStage!==10||e.honroBindingAttached)return;e.honroBindingAttached=true;const hurt=e.hurt.bind(e),damage=e.damageTerrain.bind(e);
 e.hurt=function(u,amount,...args){if(u.id==='boss'&&!e.b.honroState.sodanCoop){if(amount>0)e.fx('text',u.x,u.y-u.h-28,'#d8c995',15,'바깥 붉은 주박을 겨누세요');return;}return hurt(u,amount,...args);};
 e.damageTerrain=function(t,amount,...args){const before=t.hp,out=damage(t,amount,...args);if(t.id===bindingId&&t.hp<before){const s=e.b.honroState.sodanBinding;s.lastHitTime=e.b.time||0;s.hitCount=(s.hitCount||0)+1;s.remaining=Math.max(0,t.hp/t.maxHp);e.fx('ring',t.x+t.w*.5,t.y+t.h*.5,'#c96865',48);app.event(t.broken?'바깥 주박이 느슨해졌다. 소단이 양옆 진을 살핀다.':'붉은 매듭이 풀린다.');}return out;};
}
G.HonroNarrativeRevision={active,author,prepareFresh,reveal,finishStory,bindingId,bindingReady,beforeCooperation,attach,updateConvoy,tick};
})(globalThis);
