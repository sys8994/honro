import hashlib,json,os,sys,math
from pathlib import Path
from playwright.sync_api import sync_playwright
Q=Path(__file__).resolve().parent
sys.path.insert(0,str(Q.parent/'ci'))
from live import snapshot,digest
OUT=Path(os.environ['OUT'])
PORT=os.environ['PORT'];MODE=os.environ['MODE']
assert MODE in ('stock','metadata','target')
native=(Q/'layer-clock.js').read_text()
points=[('13-initial',None),('13-mason',[1740,1560]),('13-threshold',[2940,2038])]
def view(page,point):
 return page.evaluate("""point=>{const a=HonroApp,s=a.scene,b=a.engine.b,r=s.canvas.getBoundingClientRect(),z=HonroBounds.zoomLimits(r.width);
   HonroStoryFraming.clear(s);Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,x:point?.[0]??b.width/2,y:point?.[1]??b.height/2,scale:point?Math.min(z.max,3*z.min):z.min});
   HonroBounds.constrain(s,b);s.render(a.engine,0,'',.6,false,0);
   return [s.x,s.y,s.scale,r.width,r.height];
 }""",point)
def raster(page):
 return page.evaluate("""async()=>{const a=HonroApp,s=a.scene;
  const before=window.__stage13SkyReceipt();
  s.render(a.engine,0,'',.6,false,0);
  const rec=window.__stage13SkyReceipt();
  if(rec.calls<=before.calls)throw Error('Original Sky painter did not execute during repaint');
  const a2=s.canvas.getContext('2d'),r=a2.getImageData(0,0,s.canvas.width,s.canvas.height);
  const h=await crypto.subtle.digest('SHA-256',r.data);
  return {sky:rec,samples:r.data.length,rawSHA256:Array.from(new Uint8Array(h),x=>x.toString(16).padStart(2,'0')).join(''),dimensions:[s.canvas.width,s.canvas.height]};
 }""")
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 for fresh in range(4 if MODE=='stock' else 1):
  dest=OUT/str(fresh);dest.mkdir(parents=True)
  ctx=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1)
  page=ctx.new_page();errors=[];bad=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('requestfailed',lambda req:bad.append([req.url,req.failure]))
  page.add_init_script("window.__qaImages=[];let z=3910;Math.random=()=>((z=(Math.imul(z,1664525)+1013904223)>>>0)/4294967296);const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});")
  page.goto(f'http://127.0.0.1:{PORT}/HONRO.html',wait_until='domcontentloaded',timeout=180000)
  page.wait_for_function("document.documentElement.dataset.honroReady==='true' && window.HonroCampaignLoader",timeout=180000)
  page.evaluate(native)
  page.evaluate("""async()=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;a.profile.settings.debugMode=false;const sid=13;
   await HonroCampaignLoader.ensureStage(sid);for(let n=1;n<sid;n++)a.profile.cleared[n]=true;
   for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(sid).entryLevel);
   a.launch(sid);if(a.engine?.b.honroStage!==sid)throw Error('Wrong stage runtime');
   for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
   if(a.dialogue)throw Error('Initial dialogue present');a.close();HonroStoryFraming.clear(a.scene);
  }""")
  canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
  page.wait_for_timeout(1500)
  page.evaluate("()=>{HonroStory.tick(HonroApp,performance.now());HonroStory.draw(HonroApp);}")
  loaded={}
  for name,point in points:
   cam=view(page,point)
   page.wait_for_function("window.__qaImages.every(i=>!i.src||i.complete)",timeout=120000)
   page.evaluate("""async()=>{await document.fonts.ready;const failed=window.__qaImages.filter(i=>i.src&&i.complete&&!i.naturalWidth);if(failed.length)throw Error('Image decode failed');}""")
   old=page.evaluate(snapshot,13)
   x=raster(page);px=canvas.screenshot(path=str(dest/(name+'.png')),animations='disabled')
   y=raster(page)
   rep=canvas.screenshot(path=str(dest/(name+'.repeat.png')),animations='disabled')
   stable=page.evaluate(snapshot,13)
   assert old==stable,('Render changed actual game state',name)
   assert x['rawSHA256']==y['rawSHA256'] and x['samples']==y['samples']>0,('Repeat native pixels',name)
   stable['perFieldSHA256']={k:digest(v) for k,v in stable['projection'].items()}
   del old
   stable.update(stateSHA256=digest(stable.pop('projection')),camera=cam,raster=[x,y],rawRepeatExact=True,
     pngSHA256=hashlib.sha256(px).hexdigest(),pngRepeatSHA256=hashlib.sha256(rep).hexdigest())
   loaded[name]=stable
   (dest/'proof.json').write_text(json.dumps(loaded,ensure_ascii=False,indent=2)+'\n')
  page.evaluate("()=>window.__restoreStage13Sky()")
  assert not errors and not bad,('Browser page/network errors',len(errors),len(bad))
  ctx.close()
 browser.close()
