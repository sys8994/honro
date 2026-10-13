(function(G){'use strict';
// A route belongs to one battle run. It is committed at the same objective
// boundary as a normal reach goal; a save reload never re-evaluates its entry.
const clone=v=>JSON.parse(JSON.stringify(v)),alive=u=>u&&!u.dead&&u.hp>0;
const active=b=>!b?.honroCustom&&b?.honroRouteSpec?.revision===1;
const heroes=b=>(b.units||[]).filter(u=>alive(u)&&u.side===0&&!u.summoned&&!u.enthrall);
const memory=b=>b.honroRouteChoice??={revision:1,selectedRoute:null,sourceRun:b.session};
const act=b=>b.honroStage>=21?G.HonroAct3:G.HonroAct2;
const marker=(b,id)=>(b.honroMarkers||[]).find(m=>m.id===id||m.id==='marker-'+id);
const done=(b,id)=>!!act(b).memory(b).done[id];
function scenePending(b,id){const match=l=>(l?.[2]?.storyId||'').endsWith(id),hs=b.honroState||{};
 return (b.honroStory?.lines||[]).some(match)||(hs.storyQueue||[]).some(match)||(hs.deferredStory||[]).some(q=>(q.lines||[]).some(match));
}
function commonReady(b){if(!active(b)||(b.honroRouteSpec.common||[]).some(id=>!done(b,id)||scenePending(b,`act${b.honroStage>=21?3:2}-${b.honroStage}-${id}`)))return false;
 if(b.honroStage===12&&!G.HonroStage12Quarry?.signSceneDone(b))return false;
 return true;
}
function reaches(b,u,m){return !!m&&(b.honroStage>=21?G.HonroAct3.sameFloor(u,m,180):Math.hypot(u.x-m.x,u.y-m.y)<150);}
function requirements(b,r){return (r.requiresDone||[]).every(id=>done(b,id))&&(r.defeatIds||[]).every(id=>{const u=b.units.find(q=>q.id===id);return !!u&&(!alive(u)||u.honroSubdued||u.side!==1);})&&(r.requiresTerrainActive||[]).every(id=>{const t=b.terrain.find(t=>t.id===id);return !!t&&!t.broken;})&&(r.requiresTerrainOpen||[]).every(id=>!!b.terrain.find(t=>t.id===id)?.broken);}
function candidates(b){if(!commonReady(b))return[];const group=heroes(b);return b.honroRouteSpec.routes.filter(r=>requirements(b,r)&&group.some(u=>reaches(b,u,marker(b,r.markerId))));}
function commit(app,step){const b=app.engine.b;if(!active(b)||step?.kind!=='route')return false;const state=memory(b);if(state.selectedRoute)return true;
 // Array order is the authored, persisted marker order. The current actor wins
 // a simultaneous split-party arrival; otherwise that fixed order is stable.
 const choices=candidates(b),u=b.units.find(u=>u.id===b.active),r=choices.find(r=>heroes(b).includes(u)&&reaches(b,u,marker(b,r.markerId)))||choices[0];if(!r)return false;
 const point=marker(b,r.markerId),arrived=heroes(b).filter(u=>reaches(b,u,point));G.HonroObjectiveContributions?.arrive(b,'route:'+step.id,[arrived.find(u=>u.id===b.active)||arrived[0]],p=>reaches(b,p,point));
 Object.assign(state,{selectedRoute:r.id,sourceRun:b.session,fromStage:b.honroStage,toStage:b.honroRouteSpec.toStage,exitId:r.markerId,round:b.round});
 act(b).memory(b).done[step.id]=true;act(b).memory(b).checkpoints.push({id:step.id,route:r.id,round:b.round});const m=marker(b,r.markerId);if(m)m.collected=true;
 if(r.lines?.length)app.sayLines(r.lines);else app.event(r.label||m?.label||step.label,{kind:'narration',source:'route:'+step.id});app.dirty=true;return true;
}
function targets(b,step){if(!active(b)||step?.kind!=='route')return null;return b.honroRouteSpec.routes.map(r=>{const m=marker(b,r.markerId);return {id:r.markerId,kind:'exit',x:m?.x,y:m?.y,label:r.label||m?.label||r.id,done:b.honroRouteChoice?.selectedRoute===r.id,route:r.id};}).filter(t=>Number.isFinite(t.x)&&Number.isFinite(t.y));}
function sourceIssue(b){if(!active(b))return null;const s=b.honroRouteSpec;if(![12,15,29].includes(b.honroStage)||s.toStage!==b.honroStage+1||s.routes?.length!==2||new Set(s.routes.map(r=>r.id)).size!==2)return '대체 출구 자료가 준비되지 않았습니다.';
 for(const r of s.routes){if(!marker(b,r.markerId))return '출구 위치가 준비되지 않았습니다: '+r.markerId;for(const id of r.defeatIds||[])if(!b.units.some(u=>u.id===id))return '출구 수비 대상이 준비되지 않았습니다: '+id;for(const id of [...(r.requiresTerrainOpen||[]),...(r.requiresTerrainActive||[])])if(!b.terrain.some(t=>t.id===id))return '출구 지형이 준비되지 않았습니다: '+id;}return null;
}
function handoff(b){const s=b?.honroRouteChoice;return active(b)&&b.phase==='won'&&s?.selectedRoute&&s.sourceRun===b.session?{fromStage:b.honroStage,toStage:b.honroRouteSpec.toStage,choice:s.selectedRoute,revision:1,sourceRun:b.session}:null;}
function continueFrom(app,{replay=false}={}){const b=app.engine?.b,h=handoff(b);if(!h||b.honroJourneyReplay&&!replay)return false;app.profile.honroRouteHandoff=h;app.persist();return true;}
function retry(app){const b=app.engine?.b;app.honroRouteRetry=b?.honroEntryVariant?clone(b.honroEntryVariant):null;}
function prepareFresh(b,profile){if(active(b))memory(b);const spec=b.honroEntryVariants;if(b.honroCustom||spec?.revision!==1||b.honroEntryVariant)return;
 const input=profile._honroRouteRetry||profile.honroRouteHandoff;
 if(!input||input.revision!==1||input.toStage!==b.honroStage||input.fromStage!==spec.fromStage||typeof input.sourceRun!=='string')return;
 const v=spec.variants?.[input.choice];if(!v)return;
 for(const p of v.heroes||[]){const u=b.units.find(u=>u.side===0&&!u.summoned&&u.cls===p.cls);if(u)Object.assign(u,{x:p.x,y:p.y,spawnX:p.x,spawnY:p.y,vx:0,vy:0});}
 for(const p of v.units||[]){const u=b.units.find(u=>u.id===p.id);if(u)Object.assign(u,{x:p.x,y:p.y,spawnX:p.x,spawnY:p.y,vx:0,vy:0});}
 for(const p of v.markers||[]){const m=marker(b,p.id);if(m)Object.assign(m,{x:p.x,y:p.y});}
 b.honroEntryVariant={...clone(input),lines:clone(v.lines||[])};
}
function entryLines(b){return clone(b?.honroEntryVariant?.lines||[]).map(row=>[row[0],row[1],{...(row[2]||{}),storyId:`route-entry-${b.honroStage}-${b.honroEntryVariant.choice}`}]);}
G.HonroRouteBranches={active,heroes,memory,commonReady,requirements,reaches,candidates,commit,targets,sourceIssue,handoff,continueFrom,retry,prepareFresh,entryLines};
})(globalThis);
