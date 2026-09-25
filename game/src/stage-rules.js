(function(G){
  const stageParty = id => ['archer',...G.HONRO_CONTENT.stages.filter(s=>s.id<id&&s.recruit).map(s=>s.recruit)];
  // RC5: preserve the original full-height Stage 2 canyon.
  function compressStage2(b){ return; }
  function addForegroundDecor(b){
    if(!b || b.honroStage !== 2 || b.__decor063) return;
    b.__decor063 = true;
    const points = (b.routePoints || []).filter((_,i,arr)=>i>0 && i<arr.length-1 && i%2===0);
    const extras = [];
    points.forEach((p,i)=>{
      extras.push({kind:i%3===0?'cliffPines':i%3===1?'rockPile':'deadPines',x:Math.max(110,p.x-145),y:p.y+10,size:0.86+(i%2)*0.12,variant:600+i});
      extras.push({kind:i%3===2?'fallenTree':'cliffPines',x:Math.min((b.width||3200)-120,p.x+155),y:p.y+8,size:0.72,variant:700+i});
    });
    b.decor = (b.decor || []).concat(extras);
  }
  function sanitizeStageBattle(b){
    if(!b) return b;
    if(b.mode!=='campaign')return b;
    const st=G.HONRO_CONTENT.stages[(b.honroStage||1)-1];
    if(st)for(const u of b.units||[])if(u.honroAlly)u.level=Math.max(u.level||1,st.recruit===u.cls?G.HonroProgression.joinLevel(st):Math.floor(G.HonroProgression.plan(st.id)?.entryLevel||st.level||1));
    compressStage2(b);
    addForegroundDecor(b);
    G.HonroLayouts.upgrade(b);
    if(b.honroGeometryReady){repairEmbeddedSave(b);return b;}
    for(const u of b.units || []){
      if(!u || u.dead || typeof u.x !== 'number' || typeof u.y !== 'number') continue;
      const flying=!!G.HonroWorld.archetypes[u.honroType]?.flying;
      const p=G.HonroTerrain.place(b,u,{flying,maxDistance:Math.max(b.width,b.height)});
      if(!p)throw Error('No legal initial placement for '+u.id+' in stage '+b.honroStage);
      Object.assign(u,p,{spawnX:p.x,spawnY:p.y,vx:0,vy:0});
    }
    b.honroGeometryReady=true;b.honroGeometryRevision=2;b.honroContactRevision=2;
    if(b.objectiveX && b.honroStage === 2) b.objectiveX = Math.min(b.objectiveX, (b.width||3200)-120);
    return b;
  }
  // Repair actual solid penetration on load, including saves made after an older
  // repair. Valid supported, jumping and falling bodies keep exact state.
  function repairEmbeddedSave(b){
    for(const u of b.units||[]){
      if(u.dead||u.hp<=0||u.fixed||u.carriedBy!==undefined||u.airborne&&b.projectiles.some(p=>p.body&&p.owner===u.id))continue;
      const inside=b.terrain.some(t=>!t.broken&&!t.oneWay&&G.HONRO_CORE.terrainRectIntersects(t,u.x-u.r*.55,u.y-u.h+6,u.r*1.1,Math.max(3,u.h-13),.15));
      if(!inside)continue;
      const p=G.HonroTerrain.place(b,u,{flying:false,maxDistance:Math.max(b.width,b.height)});
      if(!p||Math.hypot(p.x-u.x,p.y-u.y)<.5)continue;
      b.honroContactRecoveries??=[];b.honroContactRecoveries.push({id:u.id,from:{x:u.x,y:u.y},to:p});
      Object.assign(u,p,{vx:0,vy:0,jumping:false,airborne:false});
    }
    b.honroContactRevision=2;
  }

G.HonroStageRules={stageParty,sanitizeStageBattle};
})(globalThis);
