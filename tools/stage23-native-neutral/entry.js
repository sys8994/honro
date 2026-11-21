async q=>{
 const a=window.HonroApp;
 const sha=async o=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(o)))),n=>n.toString(16).padStart(2,'0')).join('');
 if(!a||typeof a.launch!=='function'||!['A1','A2','A0'].includes(q))throw Error('wrong observer input');
 a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
 await Promise.race([HonroCampaignLoader.ensureStage(23),new Promise((_,bad)=>setTimeout(()=>bad(Error('ensureStage deadline')),90000))]);
 const project=window.HONRO_PROJECT, stageIndex=project.stages.findIndex(st=>st.metadata?.stageId===23), stock=project.stages[stageIndex];
 if(stageIndex!==22||project.stages.length!==50||stock.id!=='stage-23'||stock.pending||stock.width!==9800||stock.height!==6200||
    stock.design.act3HandoffArt!=='act3-handoff:23:quay-west'||Object.hasOwn(stock.design?.space??{},'terrainAttachments'))
   throw Error('normal exact Stage23 map closure missing');
 const id='stage23:qa-native-a0-blank-face', faceID='stage23-qa-blank-native-face';
 const expected={id:faceID,terrainId:'sy-ground',assetId:id,anchor:{kind:'walk',edge:0,along:0},scale:1,rotation:0,
    depthMode:'surface',inset:0,walkClearance:48,embedFade:0,replaceBlocks:false};
 const blank={id,name:'Stage23 ephemeral QA empty face',category:'terrain',anchor:{x:0,y:0},bounds:{x:-340,y:130,w:535,h:860},
    collision:[],sockets:[],shapes:[],visualRole:'scenery',vector:{version:1,viewBox:[-340,130,535,860],root:{tag:'g',children:[]}}};
 const other=()=>project.stages.filter((_,i)=>i!==stageIndex), origLib=()=>project.library.filter(z=>z.id!==id);
 const designRef=stock.design, stockCopyHash=await sha(stock), otherHash=await sha(other()), libHash=await sha(origLib());
 if(project.library.some(z=>z.id===id)||HonroVectorArt.validate(blank.vector).length!==0)
    throw Error('blank would conflict or fail production vector validation');
 let attached=null, callCount=0, blankPainterAccepted=0, timeline=[], invocationByCurrentTerrain=[];
 const proto=HonroTerrainAttachments.draw,vectorDraw=HonroVectorArt.draw;
 const tileId=ctx=>{const m=ctx.getTransform();return [m.a,m.b,m.c,m.d,m.e,m.f,ctx.canvas.width,ctx.canvas.height].join(':');};
 if(typeof proto!=='function'||typeof vectorDraw!=='function')throw Error('native paint hooks unavailable');
 // Read-only forwarding instrumentation. No requests or renderer outputs are replaced.
 HonroTerrainAttachments.draw=function(ctx,t,b,s){
   const n=callCount,r=Reflect.apply(proto,this,[ctx,t,b,s]);
   if(callCount!==n){
     timeline.push({event:'hostTerrainExitedPaint',id:t?.id,tile:tileId(ctx)});
     invocationByCurrentTerrain.push(t?.id);
   }
   return r;
 };
 HonroVectorArt.draw=function(ctx,asset,inst){
   if(asset?.id!==id)return Reflect.apply(vectorDraw,this,[ctx,asset,inst]);
   if(inst?.id!==faceID||inst?.kind!=='terrain-face'||asset.vector.root.children.length!==0)
      throw Error('unexpected dispatched native blank');
   callCount++; timeline.push({event:'blankVectorNative',id:asset.id,tile:tileId(ctx)});
   const r=Reflect.apply(vectorDraw,this,[ctx,asset,inst]);
   if(!r)throw Error('original vector native draw returned false');
   blankPainterAccepted++;
   return r;
 };
 let clean=false;
 try{
   if(q==='A0'){
     // Scoped to volatile Stage23 data, never an intercepted HTTP response,
     // shared asset edit, input history, developer cache or a saved battle.
     stock.design={...designRef,space:{...designRef.space,terrainAttachments:[expected]}};
     project.library.push(blank);
   }
   for(let n=1;n<23;n++)a.profile.cleared[n]=true;
   for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(23).entryLevel);
   a.launch(23);
   const b=a.engine.b;
   if(!b||b.honroStage!==23||!b.honroCanonical||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||b.width!==9800||b.height!==6200||
      !HonroTerrainDomain.active(b)||a.engine.b.honroAuthoredId!=='stage-23'||project.stages[stageIndex]!==stock)
      throw Error('not regular canonical Stage23 first aim');
   const attachments=b.honroTerrainAttachments??[];
   if(q==='A0'){
     attached=attachments[0];
     if(attachments.length!==1||attached.id!==faceID||attached.x!==0||attached.y!==4250||
        attached.kind!=='terrain-face'||attached.depthLayer!=='L1'||!Number.isFinite(attached.surfaceAnchor.datum)||
        attached.surfaceAnchor.datum!==4250||JSON.stringify(attached.asset)!==JSON.stringify(blank)||
        b.honroElements.some(x=>x.asset?.id===id)||b.honroLandmarks.some(x=>x.asset?.id===id)||
        b.terrain.some(x=>x.honroElementId===faceID)||b.honroMarkers.some(m=>m.elementId===faceID))
        throw Error('blank not compiled into own nonphysical native slot');
   }else if(attachments.length)throw Error('stock unexpected terrain attachments');
   const s=a.scene,native=s._landmarkLayer;
   if(typeof native!=='function')throw Error('native landmark slot missing');
   s._landmarkLayer=function(ctx,l,layer){
     if(layer==='front'&&l.some(x=>x.asset?.id==='act3-handoff:23:quay-west'))
        timeline.push({event:'registeredFrontDispatch',id:'act3-handoff:23:quay-west',tile:tileId(ctx)});
     return Reflect.apply(native,this,[ctx,l,layer]);
   };
   clean=true;
   for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
   if(a.dialogue)throw Error('dialogue remains after isolated entry');
   a.close();HonroStoryFraming.clear(a.scene);
 }finally{
   if(q==='A0'){stock.design=designRef;const i=project.library.indexOf(blank);if(i!==-1)project.library.splice(i,1);}
 }
 if(!clean||await sha(stock)!==stockCopyHash||await sha(other())!==otherHash||await sha(origLib())!==libHash||project.library.some(v=>v.id===id))
   throw Error('Stage23 descriptor, unrelated 49 stages or stock library changed across registration');
 Object.defineProperty(window,'__stage23NativeNeutral',{value:{
   phase:q, stockCopyHash,otherHash,libHash,
   stats:()=>({callCount,blankPainterAccepted,timeline:[...timeline],invocationByCurrentTerrain:[...invocationByCurrentTerrain]})
 }});
 return {phase:q, stockCopyHash,otherHash,libHash, attachment:attached};
}
