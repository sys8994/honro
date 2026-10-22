async ({scenario,profile,frames})=>{
    const a=HonroApp,e=a.engine,b=e.b,s=a.scene,base={x:s.x,y:s.y},raf=window.requestAnimationFrame;
    const summary=xs=>{const v=xs.slice().sort((a,b)=>a-b);return {p50:v[Math.floor(v.length*.5)]||0,p95:v[Math.floor(v.length*.95)]||0,max:v.at(-1)||0};};
    const counts=()=>({round:b.round,phase:b.phase,camera:{x:s.x,y:s.y,scale:s.scale},rng:b.rng,enemies:b.units.filter(u=>u.side===1&&!u.dead).length,units:b.units.length,projectiles:b.projectiles.length,effects:s.arcFx?.fxs?.length??s.effects.length,particles:s.arcFx?.fxs?.filter(f=>f.kind==='spark').length??0,tiles:s._domainTiles?.tiles.size||0,cache:s.renderCacheStats(),environmentCache:HonroEnvironmentArt.stats(),styleCache:HonroVisualStyle.stats(),heap:performance.memory?.usedJSHeapSize});
    const parts={},restores=[];
    if(profile)for(const [o,ks]of [[a,['updateHUD','missionTick','persist']],[e,['tick']],[s,['render','occludedUnitSilhouettes','_drawTerrainDomainTiles','background','unit','terrain','landmark','terrainReadability']]])for(const k of ks){const f=o[k];if(!f)continue;o[k]=function(...v){const t=performance.now();try{return f.apply(this,v);}finally{(parts[k]??=[]).push(performance.now()-t);}};restores.push(()=>o[k]=f);}
    if(scenario==='zoom-in')s.scale=1.35;
    if(scenario==='zoom-out')s.scale=HonroBounds.zoomLimits(s.size().w).min;
    let fired=false;if(scenario==='fire'){const u=e.active;fired=e.fire(u.loadout.find(id=>HONRO_CORE.SKILLS[id]?.damage>0&&!HONRO_CORE.SKILLS[id]?.passive),u.angle,.75);}
    const times=[],intervals=[],states=[],tasks=[];let prior=null;
    const obs=new PerformanceObserver(list=>tasks.push(...list.getEntries().map(t=>({start:t.startTime,duration:t.duration}))));obs.observe({type:'longtask'});
    const start=performance.now();
    for(let i=0;i<frames;i++){
        await new Promise(raf);const now=performance.now();if(prior!==null)intervals.push(now-prior);prior=now;
        if(scenario==='pan')s.x=base.x+Math.sin(i/30*Math.PI)*900;
        if(scenario==='zoom-cycle')s.scale=[.32,.5,.68,1,1.35,.68][Math.floor(i/15)%6];
        a.prev=now-1000/60;
        const t=performance.now();window.requestAnimationFrame=()=>0;
        try{nativeFrame(now);}finally{window.requestAnimationFrame=raf;}
        times.push(performance.now()-t);if(i%30===0||i===frames-1)states.push({frame:i,...counts()});
    }
    await new Promise(raf);obs.disconnect();restores.forEach(f=>f());
    return {frame:summary(times),raf:summary(intervals),rawFrames:times,rawRaf:intervals,longtask:{count:tasks.filter(t=>t.start>=start).length,total:tasks.filter(t=>t.start>=start).reduce((v,t)=>v+t.duration,0),max:Math.max(0,...tasks.filter(t=>t.start>=start).map(t=>t.duration)),entries:tasks.filter(t=>t.start>=start).map(t=>({start:t.start-start,duration:t.duration}))},counts:counts(),states,parts:Object.fromEntries(Object.entries(parts).map(([k,v])=>[k,{calls:v.length,total:v.reduce((a,b)=>a+b,0),...summary(v)}])),fired,error:a.lastError||null};
}
