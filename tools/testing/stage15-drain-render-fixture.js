/** Isolated visual-state fixture, never a normal-input playthrough.
 * Use the current production sluice water transform on a clone, then supply
 * its fully exposed ledge state. Actors return to their exact input poses. */
(function(G){G.HonroStage15DrainRenderFixture=function(input,stage){
 if(input.honroStage!==15)throw Error('Stage15 fixture only');
 const q=structuredClone(input),actors=structuredClone(q.units),A=G.HonroAct2;
 // Explicit fixture setup removes the local threat predicate only on the clone.
 // It is not evidence that these opponents were defeated or a route was played.
 for(const u of q.units)if(u.side===1)u.honroObjectiveTarget=true;
 const e={b:q,get active(){return q.units.find(u=>u.id===q.active)||q.units.find(u=>u.side===0);},unit:id=>q.units.find(u=>u.id===id),heroesAlive:()=>q.units.filter(u=>u.side===0&&!u.dead&&u.hp>0)};
 const app={engine:e,stage:structuredClone(stage),event(){},sayLines(){},checkMission(){return true;}};
 const m=q.honroMarkers.find(m=>m.id==='sluice');if(!m||!A.use(app,m))throw Error('Production sluice fixture could not be prepared');
 q.units=actors;
 // The post-boundary revealed state is input to this render fixture. The real
 // safe-actor-boundary predicate remains untouched and is not tested here.
 for(const list of [q.terrain,q.honroWorldTerrain])for(const id of q.honroDrainRevealTerrains||[]){const t=list?.find(t=>t.id===id);if(t)t.broken=false;}
 const a=A.memory(q);a.drainRevealPending=false;a.drainRevealed=true;q.sceneVersion++;
 return{battle:q,scope:'Prepared post-sluice render fixture; cloned threat setup/production water transform/revealed ledge input; actors exact; no normal completion claim'};
};})(globalThis);
