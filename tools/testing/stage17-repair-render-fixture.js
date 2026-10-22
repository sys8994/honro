/** Explicit visual state fixture, not normal repair/combat completion. */
(function(G){G.HonroStage17RepairRenderFixture=function(input,stage){
 if(input.honroStage!==17)throw Error('Stage17 fixture only');
 const b=structuredClone(input),actors=structuredClone(b.units),A=G.HonroAct2,a=A.memory(b),e={b,active:b.units.find(u=>u.side===0),heroesAlive:()=>b.units.filter(u=>u.side===0&&!u.dead),finishAction(){}};
 for(const s of A.steps(b)){if(s.id==='repair')break;a.done[s.id]=true;}
 // Isolate the threat predicate in the clone; restore every original actor.
 for(const u of b.units)if(u.side===1)u.honroObjectiveTarget=true;
 const marker=b.honroMarkers.find(m=>m.id==='repair'),app={engine:e,stage,event(){},sayLines(){},checkMission(){return true;}};
 if(!marker||!A.use(app,marker))throw Error('Production repair fixture refused');
 b.units=actors;
 if(!b.terrain.find(t=>t.id==='gate-repair')?.broken)throw Error('Production gate did not open');
 return{battle:b,scope:'Forced prerequisite/threat fixture using production repair; original actors exact. Not normal interaction, combat, collapse or completion.'};
};})(globalThis);
