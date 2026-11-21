async q=>{
 const a=HonroApp,b=a.engine.b,s=a.scene,d=HonroTerrainDomain,st=HONRO_PROJECT.stages.find(x=>x.metadata?.stageId===q.stage);
 const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y), h=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)))),n=>n.toString(16).padStart(2,'0')).join('');
 if(!b.honroCanonical||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||st?.id!=='stage-'+q.stage||!d.active(b))throw Error('invalid exact canonical terrain witness');
 const before=JSON.stringify({terrain:b.terrain,world:b.honroWorldTerrain,actor:b.units,play:b.honroPlayBounds,domain:b.honroTerrainBounds,phase:b.phase,round:b.round,water:b.water??null,design:st.design});
 const terrain=d.render(b), cachedReplay=d.render(b)===terrain;
 if(!cachedReplay||!Array.isArray(terrain)||!terrain.length)throw Error('render domain cache not bound');
 const modeled=structuredClone(terrain), find=terrain.find(t=>t.id==='a3-foundation');
 let deep=null;
 if(q.stage===28){
  const original=st.terrains.find(t=>t.id==='a3-foundation'),source=b.honroWorldTerrain.find(t=>t.id==='a3-foundation'), play=b.terrain.find(t=>t.id==='a3-foundation');
  if(!find||!source||!play||!source.honroCourt28||!find.honroDomain||b.honroAuthoredId!=='stage-28'||
     source.vertices.length!==16||find.vertices.length!==16||!same(original.points,source.vertices)||
     !same(find.vertices.slice(0,14),source.vertices.slice(0,14))||
     find.vertices[14].x!==16200||find.vertices[15].x!==-9000||
     source.vertices[14].y!==9000||source.vertices[15].y!==9000||
     find.vertices[14].y!==q.depth||find.vertices[15].y!==q.depth||
     oldPlayDepth(play)!==9000||!same(b.honroTerrainBounds,{left:-9000,top:-24000,right:16200,bottom:27400}))
   throw Error('stage28 exact rendered deep founder condition');
  function oldPlayDepth(t){return Math.max(...t.vertices.map(p=>p.y))}
  const x=modeled.find(y=>y.id==='a3-foundation');
  x.vertices[14].y=x.vertices[15].y=9000;x.h=source.h;
  deep={sourceY:9000,renderY:q.depth,bounds:b.honroTerrainBounds,sourcePhysicsProjection:source.honroDomainProjection};
 }
 const land=d.materialLandmarks(b).map(l=>[l.id,l.x,l.y,l.scale,l.rotation,l.layer,l.visualRole,l.asset?.id,l.asset?.vector,!!l.honroTerrainMaterialClip]);
 const walk=HonroTerrainReadability.prepare(b).groups.map(g=>[g.id,g.segments.filter(x=>x.walkable)]);
 const rs=s.renderCacheStats?.(), c=s._domainTiles;
 if(!rs||!c||!(c.tiles instanceof Map)||!c.tiles.size||!Number.isFinite(rs.worldBytes)||!Number.isFinite(rs.domainTileBuilds))
   throw Error('native bounded tile cache not witnessed');
 const tiles=[...c.tiles.values()].map(x=>[x.canvas.width,x.canvas.height]);
 if(tiles.length>(s.canvas.width<900?12:24)||tiles.some(t=>t[0]!==516||t[1]!==516)||rs.worldBytes!==tiles.length*516*516*4)
   throw Error('changed native canvas cache allocation budget');
 const after=JSON.stringify({terrain:b.terrain,world:b.honroWorldTerrain,actor:b.units,play:b.honroPlayBounds,domain:b.honroTerrainBounds,phase:b.phase,round:b.round,water:b.water??null,design:st.design});
 if(before!==after)throw Error('readback disturbed actual collision/physics/actor');
 return {deep, normalizedDomain:await h(modeled),rawState:await h(before),registeredMaterials:await h(land),walkEdgePoints:await h(walk),
  cache:{boundedTileCount:tiles.length,worldBytes:rs.worldBytes,tileAllocations:rs.domainCanvasAllocations,domainTileBuilds:rs.domainTileBuilds,size:tiles[0]},
  noStateMutation:true};
}
