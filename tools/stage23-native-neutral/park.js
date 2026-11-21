async q=>{
 const a=HonroApp,e=a.engine,b=e.b,s=a.scene,st=HONRO_PROJECT.stages.find(x=>x.metadata?.stageId===q.stage);
 const canvas=s.canvas,r=canvas.getBoundingClientRect(), z=HonroBounds.zoomLimits(r.width);
 const focus=HonroBounds.focus(b);
 const F=['left','top','right','bottom'], near=(a,b)=>Math.abs(a-b)<1e-6;
 const rect=(o)=>o&&F.every(k=>Number.isFinite(o[k]))&&o.left<o.right&&o.top<o.bottom;
 if(!st||st.id!==q.id||b.honroStage!==q.stage||!b.honroCanonical||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||
    a.dialogue||b.phase!=='aim'||b.round!==1||r.width<=0||r.height<=0||window.devicePixelRatio!==1||!rect(focus)||!window.__stage23NativeNeutral||!HonroTerrainDomain.active(b)||
    !Number.isFinite(z.min)||!Number.isFinite(z.max)||!(z.min>0&&z.max>z.min))throw Error('canonical first-turn scene/bounds not ready');
 const desired={x:q.dx?q.dx*1e6:st.width/2,y:q.dy?q.dy*1e6:st.height/2,scale:z.min};
 const nativeCopy=input=>{const o={...input,canvas};HonroBounds.constrain(o,b);return{x:o.x,y:o.y,scale:o.scale}};
 const centered=nativeCopy({x:st.width/2,y:st.height/2,scale:z.min});
 const limits={west:nativeCopy({...desired,x:-1e6}).x,east:nativeCopy({...desired,x:1e6}).x,
               north:nativeCopy({...desired,y:-1e6}).y,south:nativeCopy({...desired,y:1e6}).y};
 const expected={x:q.dx<0?limits.west:q.dx>0?limits.east:centered.x,y:q.dy<0?limits.north:q.dy>0?limits.south:centered.y,scale:z.min};
 const norm=m=>{const q=JSON.parse(JSON.stringify(m));if(window.__stage23NativeNeutral.phase==='A0'&&q.space){delete q.space.terrainAttachments;}return q;};
 const state=()=>JSON.stringify({terrain:b.terrain,worldTerrain:b.honroWorldTerrain,elements:b.honroElements,landmarks:b.honroLandmarks,surfaceZones:b.honroSurfaceZones,waters:b.waters,units:b.units,design:st.design,battleDesign:norm(b.honroMap),initialState:st.initialState,
    objectives:st.objectives,water:b.water??null,tide:b.honroAct4PreviewState?.tide??null,phase:b.phase??null,round:b.round??null});
 const before=state();
 if(!q.readback){
   HonroStoryFraming.clear(s);
   Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,...desired});
   HonroBounds.constrain(s,b);
 }
 const actual={x:s.x,y:s.y,scale:s.scale};
 if(s.time!==2||state()!==before||!Object.keys(expected).every(k=>near(expected[k],actual[k])))throw Error('native clamped camera differs or camera changed state');
 s.render(e,0,'',.6,false,0);
 if(state()!==before||!Object.keys(expected).every(k=>near(s[k],actual[k])))throw Error('real draw changed state or camera');
 const viewport=HonroBounds.viewport(s,r.width,r.height),play=HonroBounds.play(b),terrain=HonroBounds.terrain(b),visual=HonroBounds.visual(b,r.width,r.height,z.min);
 if(![viewport,play,terrain,visual].every(rect)||!near((viewport.right-viewport.left)*actual.scale,r.width)||
    !near((viewport.bottom-viewport.top)*actual.scale,r.height))throw Error('actual world rectangle projection invalid');
 const registered=new Set(HONRO_PROJECT.library.map(x=>x.id));
 const missing=st.elements.filter(x=>x.assetId&&!registered.has(x.assetId)).map(x=>x.assetId);
 const owners=HonroTerrainDomain.materialLandmarks(b);
 const ownerIDs=[...new Set(owners.map(x=>x.asset?.id).filter(Boolean))].sort();
 const fOwned=owners.filter(o=>o.asset?.id==='act3-handoff:23:quay-west');
 if(fOwned.length!==1||fOwned[0].layer!=='front'||fOwned[0].depthLayer!=='L1'||
    ownerIDs.includes('stage23:qa-native-a0-blank-face'))throw Error('exact F ownership changed');
 const front=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(fOwned[0].asset)))),n=>n.toString(16).padStart(2,'0')).join('');
 const rs=s.renderCacheStats();
 if(!Number.isFinite(rs.worldScale)||rs.worldScale<=0||!s._domainTiles)throw Error('not native tiled renderer');
 if(missing.length||!ownerIDs.length||!b.units.length)throw Error('runtime asset/actor closure lost');
 const physics=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(before))),n=>n.toString(16).padStart(2,'0')).join('');
 return {name:q.name,desired,actual,viewport,play,terrain,focus,visual,zoom:z,limits,centered,
  containment:HonroBounds.containment?.(b)??null,css:[r.width,r.height],backing:[canvas.width,canvas.height],dpr:window.devicePixelRatio,
  phase:b.phase,round:b.round,sceneTime:s.time,tide:b.honroAct4PreviewState?.tide??null,
  physics,frontSignature:front,tileScale:rs.worldScale,actualTerrainIDs:b.terrain.map(x=>x.id),actualDrawOwnerIDs:ownerIDs,unitCount:b.units.length,declaredMissing:[]};
}
