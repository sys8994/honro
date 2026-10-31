"""Headless layout regression using an actual stage-39 game save at high tide.
Viewport, DPR and wheel zoom are UI inputs. Does not claim campaign completion.
"""
import sys,json,threading,functools,hashlib
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'tests'));from browser_support import launch
out=root/'_local/reports/stage39-tide-hud-layout';out.mkdir(parents=True,exist_ok=True)
project=json.loads((root/'_local/inputs/stage39-presentation/stage39.json').read_bytes())
save=root/'art/act4-sharpness-followups/stage39-fullplay/fresh-v2-warning-and-save/browser-storage-live.json'
source=json.loads(save.read_text());profile=next(e['value'] for o in source['origins'] for e in o['localStorage'] if e['name']=='honro-first-act-profile-1')
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));threading.Thread(target=srv.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{srv.server_port}'
result={'scope':'Actual high-tide saved battle; headless Chromium responsive layout and reload. No normal-game warning-duration claim.','saveSHA':hashlib.sha256(save.read_bytes()).hexdigest(),'cases':[],'errors':[]}
with sync_playwright() as pw:
 browser=launch(pw)
 for name,w,h,dpr in [('desktop',1440,900,1),('portrait',390,844,3),('landscape',844,390,2)]:
  ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=dpr);page=ctx.new_page();page.on('pageerror',lambda e:result['errors'].append(str(e)))
  page.goto(base+'/HONRO.html');page.evaluate("v=>localStorage.setItem('honro-first-act-profile-1',v)",profile);page.reload();page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT&&window.HONRO_AUTHORED_FAR',timeout=60000)
  def install():page.evaluate("""async project=>{await HonroCampaignLoader.ensureStage(39);const all=HONRO_PROJECT;all.stages=all.stages.filter(s=>s.metadata.stageId!==39).concat(project.stages);const ids=new Set(project.library.map(x=>x.id));all.library=all.library.filter(x=>!ids.has(x.id)).concat(project.library);HONRO_AUTHORED_FAR.images.act4Estuary='/_local/inputs/stage32-sharp/act4-estuary.webp'}""",project)
  def enter():
   page.get_by_text('이어서 걷기',exact=True).click();page.wait_for_function("HonroApp.engine?.b?.honroStage===39&&document.getElementById('act4-water-hud')?.textContent",timeout=60000);page.wait_for_timeout(1000)
  install();enter()
  def check(label,expected='≈ ━'):
   data=page.evaluate("""()=>{const h=document.getElementById('act4-water-hud'),r=h.getBoundingClientRect(),s=getComputedStyle(h),a=HonroApp;const rect=e=>{const x=e?.getBoundingClientRect();return x&&{left:x.left,right:x.right,top:x.top,bottom:x.bottom,width:x.width,height:x.height}};let o=['#minimap-dock','#equipment-pending-battle','.battle-head>button','.battle-objective-row'].map(q=>({selector:q,rect:rect(document.querySelector(q)),visible:(e=>!!e&&!e.hidden&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none')(document.querySelector(q))}));return{hud:rect(h),text:h.textContent,font:parseFloat(s.fontSize),visible:s.visibility==='visible'&&s.display!=='none',elements:document.elementsFromPoint(r.left+r.width/2,r.top+r.height/2).slice(0,5).map(e=>e.id||e.className||e.tagName),obstacles:o,tide:a.engine.b.honroAct4PreviewState?.tide,scale:a.scene.scale}}""")
   r=data['hud'];assert data['visible'] and data['font']>=15 and r['width']>0 and r['height']>0 and r['left']>=0 and r['right']<=w and r['top']>=0 and r['bottom']<=h,(name,label,data)
   assert data['text']==expected,(name,label,data)
   for o in data['obstacles']:
    b=o['rect']
    if o['visible'] and b:assert r['right']<=b['left'] or r['left']>=b['right'] or r['bottom']<=b['top'] or r['top']>=b['bottom'],(name,label,o,data)
   result['cases'].append({'device':name,'state':label,**data});page.screenshot(path=str(out/f'{name}-{label}.png'))
  check('restore');page.mouse.move(w*.5,h*.45)
  for _ in range(10):page.mouse.wheel(0,1800);page.wait_for_timeout(90)
  page.wait_for_timeout(400);check('min-zoom')
  assert page.evaluate("Math.abs(HonroApp.scene.scale-HonroBounds.zoomLimits(HonroApp.scene.canvas.clientWidth).min)<1e-7"),(name,'minimum zoom')
  for _ in range(10):page.mouse.wheel(0,-1800);page.wait_for_timeout(90)
  page.wait_for_timeout(400);check('max-zoom')
  assert page.evaluate("Math.abs(HonroApp.scene.scale-HonroBounds.zoomLimits(HonroApp.scene.canvas.clientWidth).max)<1e-7"),(name,'maximum zoom')
  page.reload();page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT&&window.HONRO_AUTHORED_FAR',timeout=60000);install();enter();check('reload')
  # Explicit synthetic rising-state fixture layered on this cloned save; no
  # claim that the modified battle is an actual played warning.
  page.evaluate("""()=>{const e=HonroApp.engine,b=e.b,t=b.honroAct4PreviewState.tide;Object.assign(t,{phase:'rising',surface:b.honroAct4Design.tide.low-18,warned:true,highRound:b.round+3,lowRound:b.round+5});HonroAct4TerrainPreview.coast.tide(b);e.emit('save')}""")
  page.wait_for_timeout(3500);check('synthetic-rising','≈ ↑ 3')
  page.wait_for_function("JSON.parse(localStorage.getItem('honro-first-act-profile-1')).honroBattle?.honroAct4PreviewState?.tide?.phase==='rising'",timeout=10000)
  page.reload();page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT&&window.HONRO_AUTHORED_FAR',timeout=60000);install();enter();check('synthetic-rising-reload','≈ ↑ 3');ctx.close()
 browser.close()
(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');assert not result['errors'],result['errors'];print('PASS',len(result['cases']),'browser HUD layouts')
srv.shutdown()
