(function(G){'use strict';
// Fresh Stage1 clone slots belong to its image-authored encounter layout.
// Counts, stats, paid XP, saves and every other stage retain the common balance.
const E=G.HonroEncounters,balance=E.balance;
E.balance=function(b){const fresh=!b.honroEncounterRevision&&!b.honroCustom&&b.honroStage===1&&[1,2,3].includes(b.honroMap?.stage1ImageFirst?.revision),result=balance(b);if(!fresh)return result;
 for(const [id,hint]of Object.entries(b.honroMap.stage1ImageFirst.runtimeRoster||{})){const u=b.units.find(u=>u.id===id);if(!u)continue;const spot=G.HonroTerrain.place(b,u,{...hint,flying:!!u.fixed,maxDistance:96});if(!spot)throw Error('Stage1 image-authored roster slot blocked: '+id);Object.assign(u,spot,{spawnX:spot.x,spawnY:spot.y});}
 return result;
};
})(globalThis);
