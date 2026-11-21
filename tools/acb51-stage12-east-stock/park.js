async q=>{
 const a=HonroApp,e=a.engine,b=e.b,s=a.scene,st=HONRO_PROJECT.stages.find(x=>x.metadata?.stageId===q.stage);
 const c=s.canvas,r=c.getBoundingClientRect(), z=HonroBounds.zoomLimits(r.width), near=(x,y)=>Math.abs(x-y)<1e-8;
 const d=globalThis.HonroTerrainDomain;
 const props=['sq-old-road','sq-lower-ground','sq-cave-roof'];
 const projection=()=>props.map(id=>{const t=b.terrain.find(x=>x.id===id);return{id,top:t?.honroDomainProjection?.bounds?.top}});
 const geometry=()=>({play:HonroBounds.play(b),active:d?.active?.(b),projection:projection()});
 const desired=q.name==='minimum'?{x:3200,y:2500,scale:z.min}:{x:6260.7,y:3860,scale:.5};
 if(q.stage!==12||!['minimum','east-near'].includes(q.name)||b.honroStage!==12||!st||st.id!=='stage-12'||
    !b.honroCanonical||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||b.honroCampaignMapRevision!==612||
    b.width!==6400||b.height!==5000||b.phase!=='aim'||b.round!==1||a.dialogue||devicePixelRatio!==1)
    throw Error('wrong exact first canonical stock first turn');
 const g=geometry(), nearWitness=d.materialLandmarks(b).find(x=>x.asset?.id==='act2-compact:stage12-act2-traced-stage12-ground-2');
 if(g.active!==false||g.play.left!==0||g.play.top!==0||g.play.right!==6400||g.play.bottom!==5000||
    g.projection.some(x=>x.top!==-1900)||!nearWitness)throw Error('real stock predicate or projections/owner disagree: '+JSON.stringify(g));
 const testCam={...desired,canvas:c}; HonroBounds.constrain(testCam,b);
 const expected={x:testCam.x,y:testCam.y,scale:testCam.scale};
 const state=()=>JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,
    objectives:st.objectives,water:b.water??null,tide:b.honroAct4PreviewState?.tide??null,phase:b.phase??null,round:b.round??null});
 const pose=()=>({x:s.x,y:s.y,scale:s.scale});
 const cache=()=>{const q=s._staticWorldCache,m=s.renderCacheStats();
    return {key:q?.key??null,raster:q?.rs??null,backing:q?.canvas?[q.canvas.width,q.canvas.height]:null,
      world:q?[q.w,q.h]:null,bytes:q?.bytes??null,domainTiles:s._domainTiles?.tiles?.size??null,
      screenWorldBytes:m.screenWorldBytes,worldScale:m.worldScale,worldBytes:m.worldBytes,worldBuilds:m.worldBuilds,worldHits:m.worldHits};};
 const before=cache();
 if(!q.readback){
   HonroStoryFraming.clear(s);
   Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,...desired});
   HonroBounds.constrain(s,b);
   s.render(e,0,'',.6,false,0);
 }
 const first=cache(),prev=state(),actual=pose();
 if(Object.keys(actual).some(k=>!near(actual[k],expected[k]))||!near(actual.scale,desired.scale)||s.time!==2)
   throw Error('actual native camera moved or expected scale clamped');
 s.render(e,0,'',.6,false,0);
 const settled=cache();
 if(state()!==prev||Object.keys(actual).some(k=>!near(pose()[k],actual[k]))||JSON.stringify(geometry())!==JSON.stringify(g))
   throw Error('stock camera, physics or active domain drift');
 const view=HonroBounds.viewport(s,r.width,r.height), focus=HonroBounds.focus(b);
 const desiredRaster=q.name==='minimum'?.42:.56;
 const rasterExpected=Math.max(.28,Math.min(desiredRaster,Math.sqrt((r.width<900?3e6:6e6)/(6400*5000))));
 const dims=[Math.ceil(6400*rasterExpected),Math.ceil(5000*rasterExpected)];
 if(settled.domainTiles!==null||settled.screenWorldBytes!==0||!near(settled.raster,rasterExpected)||
    settled.worldScale!==settled.raster||JSON.stringify(settled.world)!=='[6400,5000]'||
    JSON.stringify(settled.backing)!==JSON.stringify(dims)||settled.bytes!==dims[0]*dims[1]*4||settled.worldBytes!==settled.bytes||
    settled.key!==first.key||settled.worldBuilds!==first.worldBuilds||settled.worldHits<=first.worldHits)
    throw Error('actual fallback world cache not matching private readonly observation: '+JSON.stringify({rasterExpected,dims,before,first,settled}));
 if(!(view.left<6400&&6400<view.right)||
    !near((view.right-view.left)*actual.scale,r.width)||!near((view.bottom-view.top)*actual.scale,r.height))
    throw Error('exact boundary not visible in native viewport');
 const aabb=s._landmarkPaintBounds(nearWitness);
 if(!(aabb.left<6400&&aabb.right>6400&&aabb.right>view.left&&aabb.left<view.right&&aabb.bottom>view.top&&aabb.top<view.bottom))
   throw Error('exact ground owner has no overlap at fallback exterior');
 const physics=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(prev))),n=>n.toString(16).padStart(2,'0')).join('');
 return {stable:{name:q.name,desired,actual,view,focus,css:[r.width,r.height],backing:[c.width,c.height],dpr:devicePixelRatio,
      phase:b.phase,round:b.round,time:s.time,physics,actualTerrainIDs:b.terrain.map(x=>x.id),geometry:g,
      expected, cacheType:'fallback-static-world-plus-exterior',ownerBounds:aabb,
      cache:{key:settled.key,raster:settled.raster,backing:settled.backing,world:settled.world,bytes:settled.bytes,
             domainTiles:settled.domainTiles,screenWorldBytes:settled.screenWorldBytes}},
   observation:{before,first,settled,counters:{worldBuilds:settled.worldBuilds-first.worldBuilds,worldHits:settled.worldHits-first.worldHits}}};
}
