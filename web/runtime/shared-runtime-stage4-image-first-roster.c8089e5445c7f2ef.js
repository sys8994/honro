(function(G){'use strict';
const E=G.HonroEncounters,A=G.HonroAllies,balance=E.balance;
const active=b=>b?.honroStage===4&&!b.honroCustom&&b.honroMap?.stage4ImageFirst?.quietLayers===1;
E.balance=function(b){const fresh=!b.honroEncounterRevision&&active(b),out=balance(b);if(!fresh)return out;
 const hints=b.honroMap.stage4ImageFirst.runtimeRoster||{},pending=new Set(Object.keys(hints)),placed=new Set();
 // Default cloned poses are temporary. Reserve authored final poses against
 // originals and already-placed clones, without changing the battle roster.
 for(const[id,hint]of Object.entries(hints)){const u=b.units.find(u=>u.id===id);if(!u)continue;const space={...b,units:b.units.filter(v=>!pending.has(v.id)||placed.has(v.id))},flying=!!u.fixed,p=G.HonroTerrain.place(space,u,{...hint,flying,maxDistance:96,accept:flying?(x,y)=>G.HONRO_CORE.flightClear({b:space},u,{x,y}):null});if(!p)throw Error('Stage4 source roster blocked: '+id);Object.assign(u,p,{spawnX:p.x,spawnY:p.y});placed.add(id);}

 return out;
};
// Use the existing placement solver for the preserved crow reinforcement, including
// full-body clearance around the new watch and charred timber. Counts, sources and gates stay intact.
const execute=A.execute;A.execute=function(app,a){if(active(app.engine?.b)&&a?.type==='spawn')a={...a,requireFlightClearance:true};return execute(app,a);};
G.HonroStage4ImageFirstRoster={active};
})(globalThis);

