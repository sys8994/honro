"""Focused Chromium review in disposable storage. Not a campaign completion."""
from pathlib import Path
import sys,json
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'_local/reports/act4-sideview-p1-20261116'
mode=sys.argv[1];OUT=BASE/mode;OUT.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
from playwright.sync_api import sync_playwright
from browser_fixture import SETUP,PAINT,OVERLAY
FOOT='''()=>{const a=HonroApp,e=a.engine,u=e.active;return {stage:e.b.honroStage,id:u.id,x:u.x,y:u.y,hp:u.hp,moveLeft:u.moveLeft,grounded:e.grounded(u),canInput:a.canInput(),round:e.b.round,phase:e.b.phase};}'''
views={33:[('low-west',1200,2500,.53),('low-mid',3400,3200,.53),('low-east',5490,3602,.53),('left-edge',0,2600,.32),('right-edge',6900,3300,.32)],
       40:[('junction',3650,2390,.53),('east-main',4750,1900,.53),('east-upper',5500,1260,.53),('dock',2300,3100,.53),('right-edge',6300,2000,.32)]}
results=[]
with serve_game() as url,sync_playwright() as pw:
 browser=launch(pw)
 for n in ([int(sys.argv[2])] if len(sys.argv)>2 else [33,40]):
  ctx=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1);p=ctx.new_page();errors=[]
  p.on('pageerror',lambda e:errors.append(str(e)));p.goto(url+'/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp && window.HonroCampaignLoader')
  entry=p.evaluate(SETUP,n);row={'stage':n,'scope':'fresh unlocked test profile; production build; diagnostic camera/state captures separate from movement','browser':browser.version,'errors':errors,'views':[]}
  row['assets']=p.evaluate('''()=>HonroApp.engine.b.honroLandmarks.filter(e=>e.asset?.id?.startsWith('act4-sideview:')).map(e=>({id:e.asset.id,errors:HonroVectorArt.validate(e.asset.vector)}))''')
  p.evaluate('''()=>{const a=HonroApp;a.profile.honroBattle=structuredClone(a.engine.b);a.persist();}''')
  storage=p.evaluate('localStorage.getItem("honro-first-act-profile-1")')
  (OUT/f'storage-{n}.json').write_text(storage,encoding='utf-8');row['storageBytes']=len(storage.encode())
  allviews=[('overview',3456 if n==33 else 3328,2304 if n==33 else 2048,.17),('entry',entry['x']+450,entry['y']-160,.53)]+views[n]
  if mode=='final':
   limits=p.evaluate('''()=>({z:HonroBounds.zoomLimits(1440).min,f:HonroBounds.focus(HonroApp.engine.b)})''');f=limits['f'];z=limits['z']
   allviews += [('legal-left',f['left'],2600,z),('legal-right',f['right'],3300 if n==33 else 2000,z),('legal-bottom',(f['left']+f['right'])/2,f['bottom'],z),('contact-zoom',5490 if n==33 else 4850,3602 if n==33 else 1924,1.65)]
  for name,x,y,z in allviews:
   v={'name':name,'x':x,'y':y,'scale':z};p.evaluate(PAINT,v);p.wait_for_timeout(180);p.evaluate(PAINT,v)
   p.locator('#battlecanvas').screenshot(path=str(OUT/f'{n}-{name}.png'));row['views'].append(v)
   if name in ['low-east','east-upper','east-main']:
    p.evaluate(OVERLAY);p.locator('#battlecanvas').screenshot(path=str(OUT/f'{n}-{name}-collision.png'))
  # Same deterministic diagnostic pan workload; render-call timing, not FPS.
  row['renderMs']=p.evaluate('''()=>{const a=HonroApp,s=a.scene,t=[];for(let i=0;i<90;i++){s.x+=(i%2?7:-7);const q=performance.now();s.render(a.engine,0);if(i>=15)t.push(performance.now()-q);}t.sort((a,b)=>a-b);return {p50:t[Math.floor(t.length*.5)],p95:t[Math.floor(t.length*.95)],samples:t.length,scope:'warm synchronous scene.render; not device FPS'};}''')
  if n==33:
   for phase in ['rising','high','low-return']:
    tide=p.evaluate('''phase=>{const b=HonroApp.engine.b,c=b.honroAct4Design.tide,q=b.honroAct4PreviewState;b.round=phase==='rising'?c.warningRound:phase==='high'?q.tide.highRound:q.tide.lowRound;HonroAct4TerrainPreview.coast.tide(b);return structuredClone(q.tide);}''',phase)
    v={'x':5490,'y':3602,'scale':.53};p.evaluate(PAINT,v);p.locator('#battlecanvas').screenshot(path=str(OUT/f'33-tide-{phase}.png'));row.setdefault('tide',[]).append(tide)
  # Mobile camera is diagnostic, preserving the same world coordinates.
  p.set_viewport_size({'width':390,'height':844});p.evaluate(PAINT,{'x':5490 if n==33 else 5500,'y':3602 if n==33 else 1260,'scale':.53});p.wait_for_timeout(100);p.evaluate(PAINT,{'x':5490 if n==33 else 5500,'y':3602 if n==33 else 1260,'scale':.53});p.screenshot(path=str(OUT/f'{n}-mobile.png'))
  if mode=='final':
   mobile=p.evaluate('''()=>{const s=HonroApp.scene,b=HonroApp.engine.b,f=HonroBounds.focus(b);s.scale=HonroBounds.zoomLimits(390).min;s.x=f.right;s.y=f.bottom;HonroBounds.constrain(s,b);s.render(HonroApp.engine,0);return {x:s.x,y:s.y,scale:s.scale};}''');p.screenshot(path=str(OUT/f'{n}-mobile-min-edge.png'));row['mobileMinimum']=mobile
  results.append(row);ctx.close();print(mode,n,'assets',len(row['assets']),'errors',errors,flush=True)
 browser.close()
if len(sys.argv)>2 and (OUT/'results.json').exists():
 results=[r for r in json.loads((OUT/'results.json').read_text(encoding='utf-8')) if r['stage']!=int(sys.argv[2])]+results
(OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
