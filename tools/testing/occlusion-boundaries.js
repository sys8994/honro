async ({baseline})=>{
 const a=HonroApp,base=new Function('G','return ({'+baseline+'}).occludedUnitSilhouettes;')(globalThis),candidate=a.scene.occludedUnitSilhouettes,battle=structuredClone(a.engine.b),cases=[];
 const hero=cls=>structuredClone(battle.units.find(u=>u.side===0&&u.cls===cls));
 const fixture=(active='archer',cover='occultist',dx=105)=>{const u=hero(active),v=hero(cover);u.x=720;u.y=6500;v.x=u.x-dx;v.y=u.y;return [u,v];};
 const specs=[
  {name:'normal-idle'}, {name:'normal-charge',charge:true},
  {name:'party-overlap',units:fixture('archer','occultist',18)},
  {name:'charge-bow-reversed',units:fixture('archer','mage',-32),charge:true,facing:-1,angle:145},
  {name:'charge-release-bow',units:fixture('archer','mage',28),charge:true,release:true},
  {name:'charge-staff-hover-inspect',units:fixture('mage','knight',20),charge:true,hover:true,inspect:true},
  {name:'charge-sword-cloth',units:fixture('knight','occultist',-24),charge:true},
  {name:'charge-talisman',units:fixture('occultist','mage',24),charge:true,selected:'O06'},
  {name:'move-airborne-hit',units:fixture('archer','knight',35),motion:true},
  {name:'min-zoom-outline-margin',units:fixture('mage','knight',65),scale:.12,hover:true},
  {name:'edge-of-viewport',units:fixture('archer','occultist',30),edge:true,scale:1.3},
  {name:'large-boss-fallback',units:fixture('archer','occultist',20),boss:true},
  {name:'winged-fallback',units:fixture('mage','occultist',25),wing:true},
  {name:'portrait-dpr2',units:fixture('knight','mage',20),w:390,h:650,dpr:2,charge:true},
  {name:'landscape-rotation',units:fixture('occultist','archer',18),w:844,h:260,charge:true,hover:true},
  {name:'preview-boundary',units:fixture('archer','occultist',10),preview:true}
 ];
 const cv=(w,h)=>{const c=document.createElement('canvas');c.style.cssText=`position:fixed;left:0;top:0;width:${w}px;height:${h}px;visibility:hidden`;document.body.append(c);return c;};
 const pixels=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
 const digest=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(n=>n.toString(16).padStart(2,'0')).join('');
 const state=s=>JSON.stringify(Object.fromEntries(Object.entries(s.partyVisual.visuals).map(([id,v])=>[id,s.battle.units.filter(u=>resolveRebuildCharacter(u)===id).map(u=>[u.id,v.state(u)])])));
 for(const spec of specs){
  const b=structuredClone(battle);if(spec.units){b.units=structuredClone(spec.units);b.active=b.units[0].id;}
  const u=b.units.find(u=>u.id===b.active),v=b.units[1];
  if(spec.facing)u.facing=spec.facing;if(spec.angle)u.angle=spec.angle;
  if(spec.boss)Object.assign(v,{id:'boss',name:'비교용 거대 보스',side:1,boss:true,h:320,r:75,honroType:'boss',cls:'boss'});
  if(spec.wing)Object.assign(v,{id:'wing-control',name:'박쥐',side:1,boss:false,h:130,r:32,honroType:'bat',honroVariant:'bat',cls:'monster'});
  if(spec.motion)Object.assign(u,{moving:1,airborne:true,jumping:true,vy:-150,hurt:.6,anim:.8});
  const w=spec.w||1280,h=spec.h||650,scale=spec.scale||.68,canvases=[cv(w,h),cv(w,h)],scenes=canvases.map(c=>new HonroScene(c)),engines=scenes.map(()=>new HONRO_CORE.Engine(structuredClone(b),()=>{}));
  Object.defineProperty(window,'devicePixelRatio',{configurable:true,value:spec.dpr||1});
  let copies=[0,0],maxDiff=0,changed=0,samePose=true,sameIds=true,pure=true,hashes;
  for(let j=0;j<2;j++){
   const s=scenes[j],fn=j?candidate:base;Object.assign(s,{manual:true,x:spec.edge?u.x-w/(2*scale)+8:u.x,y:u.y-110,scale,time:2,skillPreview:!!spec.preview,hoverUnitId:spec.hover?v.id:null,inspectUnitId:spec.inspect?u.id:null});
   s.occludedUnitSilhouettes=function(...args){const proto=CanvasRenderingContext2D.prototype,original=proto.drawImage;proto.drawImage=function(...args){copies[j]++;return original.apply(this,args);};try{return fn.apply(this,args);}finally{proto.drawImage=original;}};
  }
  const frames=spec.charge?18:6;
  for(let frame=0;frame<frames;frame++){
   for(let j=0;j<2;j++){
    const e=engines[j],s=scenes[j];if(spec.motion){const u=e.b.units[0];u.walkPhase=(u.walkPhase||0)+.8;u.vy+=40;u.anim=Math.max(0,u.anim-.08);}
    if(spec.release&&frame===14)e.b.units[0].anim=.95;
    const saved=JSON.stringify(e.b);s.render(e,1/30,spec.selected||({mage:'M01',knight:'S01',occultist:'O01'})[u.cls]||'A01',Math.min(1,.3+frame*.1),!!spec.charge&&!(spec.release&&frame>=14),1/30);pure&&=saved===JSON.stringify(e.b);
   }
   samePose&&=state(scenes[0])===state(scenes[1]);sameIds&&=JSON.stringify(scenes[0]._occludedUnitIds)===JSON.stringify(scenes[1]._occludedUnitIds);
   const left=pixels(canvases[0]),right=pixels(canvases[1]);for(let i=0;i<left.length;i+=4){let diff=false;for(let k=0;k<4;k++){const d=Math.abs(left[i+k]-right[i+k]);maxDiff=Math.max(maxDiff,d);diff||=d!==0;}if(diff)changed++;}
   if(frame===frames-1)hashes=[await digest(left),await digest(right)];
  }
  cases.push({name:spec.name,frames,exact:changed===0,changedPixelsAcrossFrames:changed,maxChannel:maxDiff,samePose,sameIds,battlePure:pure,copies,rgbaSha256:hashes,image:canvases[1].toDataURL('image/png')});
  for(const c of canvases){c.width=c.height=1;c.remove();}
 }
 Object.defineProperty(window,'devicePixelRatio',{configurable:true,value:1});
 // Direct hull containment at the actual mask scale: current dynamic samples,
 // both facings, all four party silhouettes. Readback belongs only to this run.
 const hullChecks=[];
 for(const cls of ['archer','mage','knight','occultist'])for(const facing of [-1,1])for(const kind of ['idle','move','charge','airborne','hit']){
  const u=hero(cls);Object.assign(u,{x:0,y:0,facing,moving:kind==='move'?1:0,airborne:kind==='airborne',vy:kind==='airborne'?100:0,hurt:kind==='hit'?.6:0,anim:kind==='hit'?.8:0});
  const c=cv(384,384),s=new HonroScene(c),e=new HONRO_CORE.Engine({...structuredClone(battle),units:[u],active:u.id},()=>{});c.width=c.height=384;const ctx=c.getContext('2d');s.actorEngine=e;s.battle=e.b;s.partyVisual=new HonroPartyVisual(HONRO_PARTY,HonroVectorRig,s.archerVisual);s.time=2;s.archerVisual.update(e,2,.033,'A01');s.partyVisual.update(e,2,.033,'O06');
  if(kind==='charge')s.partyVisual.visuals[resolveRebuildCharacter(u)].state(u).chargeAt=1.5;if(kind==='move'||kind==='hit'){u.walkPhase=30;s.time=2.18;s.archerVisual.update(e,2.18,.033,'A01');s.partyVisual.update(e,2.18,.033,'O06');}
  ctx.setTransform(1.2,0,0,1.2,192,300);ctx._honroOcclusionBounds={};s.unitBody(ctx,u,kind==='charge'?.8:0);const box=ctx._honroOcclusionBounds.bounds;delete ctx._honroOcclusionBounds;
  const data=pixels(c);let outside=0,count=0;for(let y=0;y<384;y++)for(let x=0;x<384;x++)if(data[(y*384+x)*4+3]){count++;if(!box||x<box[0]||x+1>box[2]||y<box[1]||y+1>box[3])outside++;}
  hullChecks.push({cls,facing,kind,box,count,outside});c.width=c.height=1;c.remove();
 }
 const asset=structuredClone(HONRO_PARTY.seol_o);asset.paths[0].d='M 300 200 A 30 30 0 1 0 360 200 Z';const c=cv(384,384),r=HonroVectorRig.createCanvasRenderer(asset),unsupported=r.draw(c.getContext('2d'),{height:102,bounds:true});c.remove();
 const passed=cases.every(r=>r.exact&&r.samePose&&r.sameIds&&r.battlePure)&&hullChecks.every(r=>r.count>0&&r.outside===0)&&unsupported.bounds===null&&cases.find(r=>r.name==='normal-idle').copies[1]===0&&cases.find(r=>r.name==='party-overlap').copies[1]>0&&cases.find(r=>r.name==='winged-fallback').copies[1]>0&&cases.find(r=>r.name==='large-boss-fallback').copies[1]>0&&cases.find(r=>r.name==='preview-boundary').copies.every(n=>n===0);
 return {passed,cases,hullChecks,unsupportedGeometryFallback:unsupported.bounds===null,limits:['Separate readback/fixed render fixtures, not performance samples or normal gameplay completion.','Actual production Scene/render chain with baseline occlusion method substituted for exact same-state comparison.','Body/pose/sample resolution unchanged; desktop/portrait/landscape/DPR emulation is not physical-device validation.']};
}
