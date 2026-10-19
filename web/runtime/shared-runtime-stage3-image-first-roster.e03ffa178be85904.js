(function(G){'use strict';
const E=G.HonroEncounters,A=G.HonroAllies,balance=E.balance;
const active=b=>b?.honroStage===3&&!b.honroCustom&&b.honroMap?.stage3ImageFirst?.quietLayers===1;
E.balance=function(b){const fresh=!b.honroEncounterRevision&&active(b),out=balance(b);if(!fresh)return out;
 for(const[id,hint]of Object.entries(b.honroMap.stage3ImageFirst.runtimeRoster||{})){const u=b.units.find(u=>u.id===id);if(!u)continue;const flying=!!u.fixed,p=G.HonroTerrain.place(b,u,{...hint,flying,maxDistance:96,accept:flying?(x,y)=>G.HONRO_CORE.flightClear({b},u,{x,y}):null});if(!p)throw Error('Stage3 source roster blocked: '+id);Object.assign(u,p,{spawnX:p.x,spawnY:p.y});}
 return out;
};
// Use the existing placement solver for the preserved crow habitat, including
// full-body clearance above the new pier. Counts, sources and gates stay intact.
const execute=A.execute;A.execute=function(app,a){if(active(app.engine?.b)&&a?.type==='spawn')a={...a,requireFlightClearance:true};return execute(app,a);};
G.HonroStage3ImageFirstRoster={active};
})(globalThis);

