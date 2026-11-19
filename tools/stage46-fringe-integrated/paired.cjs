const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
const OUT=process.env.OUT;
const urls={original:'http://127.0.0.1:8884/HONRO.html',candidate:'http://127.0.0.1:8885/HONRO.html'};
if(!OUT)throw Error('Missing output');
(async()=>{fs.mkdirSync(OUT,{recursive:true});const browser=await chromium.launch({headless:true});let proof={scope:'Official built before/after Stage46 Scene/Bounds/CSS with no source object edits, isolated render pairs; normal HTTP launch proof in separate fixture',frames:[]};try{
for(const [width,height]of [[1440,900],[390,844],[390,1000]]){
 for(const mode of ['original','candidate']){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});const page=await context.newPage();
 await page.goto(urls[mode]);await page.waitForFunction(()=>!!globalThis.HonroApp&&document.documentElement.dataset.honroReady==='true');
 const setup=await page.evaluate(async()=>{await HONRO_APP_READY;await HonroCampaignLoader.ensureStage(46);const app=HonroApp;app.stopBattle();app.close();const stage=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===46);if(!stage||stage.pending)throw Error('Original stage46 not loaded');
 // Isolated DOM diagnostic only: exact stock battle container and bottom markup,
 // no profile preparation, launch, state advance, objectives or gameplay writes.
 app.root.innerHTML='<main class="battle battle-screen" data-vertical="true"><div class="battle-view"><canvas id="battlecanvas"></canvas></div>'+HonroUI.bottom()+'</main>';
 const compiled=HonroMaps.compile(stage,HONRO_PROJECT),canvas=document.querySelector('#battlecanvas'),scene=new HonroScene(canvas);
 const landmarks=compiled.landmarks;if(!Array.isArray(landmarks))throw Error('Compiled landmark contract unavailable');const inst=landmarks.find(l=>l.asset?.id==='act5:near:46');if(!inst||!inst.asset.shaftExterior||inst.asset.shaftExteriorParts?.length!==5)throw Error('Original six-part shaft not mounted');
 const source={width:stage.width,height:stage.height,playBounds:stage.playBounds,terrainBounds:stage.terrainBounds,camera:stage.camera};scene.battle={...source,honroStage:46};globalThis.qa46={scene,source,inst,stage};return{stage:stage.id,dimensions:[stage.width,stage.height],camera:stage.camera??null,playBounds:stage.playBounds,terrainBounds:stage.terrainBounds,parts:6};});
 for(const target of ['south','west-join','west-join-high','northwest','east-join','overview']){
 const frame=await page.evaluate(({target,mode})=>{const{scene,source,inst}=qa46,cv=scene.canvas,r=cv.getBoundingClientRect(),size=scene.size(),limits=HonroBounds.zoomLimits(r.width),focus=HonroBounds.focus(source);scene.manual=true;scene.scale=['south','overview','northwest'].includes(target)?limits.min:target==='west-join-high'?Math.min(.92,limits.max):Math.min(.55,limits.max);scene.x=['south','overview'].includes(target)?source.width/2:target==='northwest'?-1000000:target.startsWith('west-join')?100:3400;scene.y=target==='south'?focus.bottom:target==='overview'?4800:target==='northwest'?-1000000:3200;HonroBounds.constrain(scene,source);const view=HonroBounds.viewport(scene,r.width,r.height),ctx=scene.ctx;ctx.setTransform(size.d,0,0,size.d,0,0);ctx.clearRect(0,0,r.width,r.height);ctx.translate(r.width/2,r.height/2);ctx.scale(scene.scale,scene.scale);ctx.translate(-scene.x,-scene.y);
 const start=performance.now();scene.landmark(ctx,inst);ctx.getImageData(0,0,1,1);
 const drawMs=performance.now()-start,tracked=[];
 const p=ctx.getImageData(0,0,cv.width,cv.height);let alpha=0;for(let i=3;i<p.data.length;i+=4)alpha+=p.data[i]/255;return{target,canvas:{x:r.x,y:r.y,width:r.width,height:r.height,backing:[cv.width,cv.height],dpr:size.d},limits,focus,view,scene:{x:scene.x,y:scene.y,scale:scene.scale},visibleBottomCap:view.bottom>15200,visibleWestCap:view.left< -5000,visibleEastCap:view.right>9600,occupiedPixels:alpha,drawMs,tracked,png:cv.toDataURL('image/png')};},{target,mode});
 const name=`${width}x${height}-${target}-${mode}`;fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(frame.png.split(',')[1],'base64'));delete frame.png;await page.screenshot({path:path.join(OUT,name+'-css.png')});proof.frames.push({name,mode,viewport:[width,height],setup,...frame});fs.writeFileSync(path.join(OUT,'proof.json'),JSON.stringify(proof,null,2));}
 await context.close();}}
}catch(e){proof.error={message:e.message,stack:e.stack};throw e;}finally{fs.writeFileSync(path.join(OUT,'proof.json'),JSON.stringify(proof,null,2));await browser.close();}})();
