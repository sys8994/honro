const fs=require('node:fs'),p=require('node:path'),crypto=require('node:crypto'),{chromium}=require('playwright');
const dir=process.env.OUT,qa=process.env.QA;
const hash=(s)=>crypto.createHash('sha256').update(s).digest('hex');
const names=['stage46-exterior-body.json','stage46-exterior-part-1.json','stage46-exterior-part-2.json','stage46-exterior-part-3.json','stage46-exterior-part-4.json','stage46-exterior-part-5.json','stage46-protected-clips.json','stage46-tree-completion.json'];
const views=[['overview',0,0],['north',0,-1],['south',0,1],['west',-1,0],['east',1,0],['northwest',-1,-1],['northeast',1,-1],['southwest',-1,1],['southeast',1,1]];
const frames=[];
(async()=>{const browser=await chromium.launch({headless:true});try{
for(const [mode,port] of [['stock',8884],['candidate',8885]]){
 const out=p.join(dir,mode);fs.mkdirSync(out,{recursive:true});
 const expected=names.map(n=>hash(JSON.stringify(JSON.parse(fs.readFileSync(p.join(qa,mode,'shared/assets/environment/act5',n))))));
 for(const [sid,w,h] of [[46,1440,900],[46,390,844],[42,1440,900]]){
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{Date.now=()=>1794931200000;let s=3910;Math.random=()=>((s=(s*1664525+1013904223)>>>0)/2**32);const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');window.qaImages=[];Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){qaImages.push(this);d.set.call(this,v)}})});
 await page.goto('http://127.0.0.1:'+port+'/HONRO.html',{waitUntil:'domcontentloaded',timeout:180000});
 await page.waitForFunction(()=>document.documentElement.dataset.honroReady==='true'&&window.HonroCampaignLoader,{timeout:180000});
 const ident=await page.evaluate(async sid=>{
  const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
  await HonroCampaignLoader.ensureStage(sid);for(let n=1;n<sid;n++)a.profile.cleared[n]=true;
  for(const hero of Object.values(a.profile.heroes))hero.xp=HonroProgression.xpAt(HonroProgression.plan(sid).entryLevel);
  a.launch(sid);if(a.engine?.b.honroStage!==sid)throw Error('Wrong launch');for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);if(a.dialogue)throw Error('Entry dialogue not closed');a.close();HonroStoryFraming.clear(a.scene);
  const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===sid);
  if(sid!==46)return null;
  const l=HonroMaps.compile(st,HONRO_PROJECT).landmarks.find(v=>v.asset?.id==='act5:near:46');
  if(!l||l.asset.shaftExteriorParts.length!==5)throw Error('Wrong packaged asset');
  const x=l.asset; window.qaLandmark=l;
  const hash=async v=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))].map(n=>n.toString(16).padStart(2,'0')).join('');
  const jacket={...x};delete jacket.shaftExterior;
  return {subassets:await Promise.all([x.shaftExterior,...x.shaftExteriorParts,x.shaftProtected,x.shaftTree].map(hash)),other:await hash(jacket),stage:await hash(st)};
 },sid);
 if(sid===46&&JSON.stringify(ident.subassets)!==JSON.stringify(expected))throw Error(JSON.stringify({expected,actual:ident.subassets}));
 await page.waitForTimeout(1600);
 await page.evaluate(()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);if(document.getElementById('turn-banner')?.hidden===false)throw Error('First-turn banner still visible');Object.defineProperty(performance,'now',{configurable:true,value:()=>100000});});
 const canvas=page.locator('#battlecanvas');
 for(const [view,dx,dy] of sid===46?[...views,['inner-arch',0,0]]:[views[0]]){
 const info=await page.evaluate(q=>{
  const a=HonroApp,s=a.scene,b=a.engine.b,st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.sid),rect=s.canvas.getBoundingClientRect();
  const requested=q.view==='inner-arch'?{x:100,y:3200,scale:.55}:{x:q.dx?q.dx*1e6:st.width/2,y:q.dy?q.dy*1e6:st.height/2,scale:HonroBounds.zoomLimits(rect.width).min};
  HonroStoryFraming.clear(s);Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,...requested});
  HonroBounds.constrain(s,b);
  const adjusted={x:s.x,y:s.y,scale:s.scale};
  const signature=()=>JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives,events:st.events,playBounds:st.playBounds});
  const state=signature();s.render(a.engine,0,'',.6,false,0);
  if(signature()!==state)throw Error('State changed');
  return {state,requested,actual:{x:s.x,y:s.y,scale:s.scale},adjusted,css:{w:rect.width,h:rect.height},size:[s.canvas.width,s.canvas.height],actors:b.units.length};
 },{sid,view,dx,dy});
 await page.waitForFunction(()=>qaImages.every(i=>!i.src||i.complete),{timeout:120000});
 const mask=await page.evaluate(sid=>{
  const a=HonroApp,s=a.scene;const bad=qaImages.filter(i=>i.src&&i.complete&&!i.naturalWidth);if(bad.length)throw Error('Image decode failed');
  s.render(a.engine,0,'',.6,false,0);if(sid!==46)return null;
  const c=document.createElement('canvas');c.width=s.canvas.width;c.height=s.canvas.height;
  const r=s.canvas.getBoundingClientRect(),ctx=c.getContext('2d');ctx.translate(r.width/2,r.height/2);ctx.scale(s.scale,s.scale);ctx.translate(-s.x,-s.y);
  s.landmark(ctx,qaLandmark);return {png:c.toDataURL(),actual:{x:s.x,y:s.y,scale:s.scale}};
 },sid);
 const label='s'+sid+'-'+w+'x'+h+'-'+view;
 if(mask){if(JSON.stringify(mask.actual)!==JSON.stringify(info.actual))throw Error('Camera changed');fs.writeFileSync(p.join(out,label+'-landmark.png'),Buffer.from(mask.png.split(',')[1],'base64'));}
 if(JSON.stringify(info.actual)!==JSON.stringify(info.adjusted))throw Error('Renderer shifted camera');
 const digest=hash(info.state);delete info.state;
 await canvas.screenshot({path:p.join(out,label+'.png'),animations:'disabled'});
 frames.push({mode,label,sid,view,ident,digest,...info});
 fs.writeFileSync(p.join(dir,'frames.json'),JSON.stringify(frames,null,2));
 }
 if(errors.length)throw Error(JSON.stringify(errors));await page.close();
 }
}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
