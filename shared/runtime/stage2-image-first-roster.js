(function(G){'use strict';
const E=G.HonroEncounters,balance=E.balance;
E.balance=function(b){const fresh=!b.honroEncounterRevision&&!b.honroCustom&&b.honroStage===2&&[1,2,3].includes(b.honroMap?.stage2ImageFirst?.revision),result=balance(b);if(!fresh)return result;
 for(const[id,hint]of Object.entries(b.honroMap.stage2ImageFirst.runtimeRoster||{})){const u=b.units.find(u=>u.id===id);if(!u)continue;const flying=!!u.fixed,spot=G.HonroTerrain.place(b,u,{...hint,flying,maxDistance:96,accept:flying?(x,y)=>G.HONRO_CORE.flightClear({b},u,{x,y}):null});if(!spot)throw Error('Stage2 image-authored roster slot blocked: '+id);Object.assign(u,spot,{spawnX:spot.x,spawnY:spot.y});}
 return result;
};
})(globalThis);
