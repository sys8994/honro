"""Separate deterministic real pixels, state preservation and UI lifetime boundaries.
Fixed display clocks are only for pixels, never for the performance samples.
"""
import hashlib,json,sys
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch
OUT=ROOT/'_local/reports/render-update/pixels';OUT.mkdir(parents=True,exist_ok=True)
servers=[];report={'builds':{},'pixels':[]}
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
with sync_playwright() as pw:
 browser=launch(pw)
 for label,root in [('before',Path('/workspace/honro-render-baseline')),('after',ROOT)]:
  server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start();servers.append(server)
  ctx=browser.new_context(viewport={'width':1280,'height':800},device_scale_factor=1);p=ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text())
  p.add_init_script('localStorage.clear();localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');let s=899411;Math.random=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);')
  p.goto(f'http://127.0.0.1:{server.server_port}/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady');p.evaluate('HonroApp.frame=()=>{}');p.evaluate('HonroApp.launch(11)');p.wait_for_function('HonroApp.engine?.b.honroStage===11');p.wait_for_function('HonroAuthoredFarArt.ready(11)')
  p.evaluate('''()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;const banner=document.getElementById('turn-banner');if(banner)banner.hidden=true;const u=a.engine.active;Object.assign(a.scene,{manual:true,x:u.x,y:u.y-140,scale:.68,time:2,storyTween:null,goalFocus:null,storyFrozen:false,focusUntil:0,speakerUntil:0});a.updateHUD(true);}''')
  p.evaluate('document.fonts.ready');p.wait_for_timeout(800)
  p.evaluate('''()=>{window.protectedState=()=>JSON.stringify({units:HonroApp.engine.b.units,projectiles:HonroApp.engine.b.projectiles,terrain:HonroApp.engine.b.terrain,round:HonroApp.engine.b.round,heroes:HonroApp.profile.heroes,loadouts:HonroApp.profile.loadouts,cleared:HonroApp.profile.cleared,items:HonroApp.engine.b.items});window.originalState=protectedState();}''')
  def shot(name):
   p.evaluate('''()=>{const a=HonroApp,s=a.scene;if(a.screen==='battle'){a.updateHUD(true);s.render(a.engine,0,a.selected,a.power,a.charging,0,!!a.modal.classList.contains('open'));s.render(a.engine,0,a.selected,a.power,a.charging,0,!!a.modal.classList.contains('open'));}}''')
   p.screenshot(path=str(OUT/f'{label}-{name}.png'),animations='disabled')
   if label=='after':p.screenshot(path=str(OUT/f'final-{name}.jpg'),type='jpeg',quality=90,animations='disabled')
  shot('desktop-idle')
  kept=p.evaluate('''()=>{const a=HonroApp;window.kept=[...document.querySelectorAll('#combat-skills button')];for(let i=0;i<120;i++){a.updateHUD();a.updateChargeDisplay();}return kept.every((n,i)=>n===document.querySelectorAll('#combat-skills button')[i]);}''')
  p.evaluate('HonroApp.charging=true;HonroApp.power=.67');shot('desktop-charge')
  p.evaluate('HonroApp.cancelInput();HonroApp.pause()');shot('desktop-pause')
  stable=p.evaluate('''()=>{const a=HonroApp,dom=[];for(let i=0;i<20;i++){a.close();a.pause();a.updateHUD();a.close();dom.push(document.querySelectorAll('*').length);}return {counts:dom,previewCleared:!a.preview,preserved:protectedState()===originalState};}''');assert stable['preserved'] and len(set(stable['counts']))==1 and kept,(label,stable)
  p.set_viewport_size({'width':390,'height':844});shot('mobile-idle')
  p.evaluate("HonroApp.engine.select(HonroApp.engine.b.units.find(u=>u.side===0&&u.cls==='mage').id)");shot('mobile-mage')
  p.set_viewport_size({'width':844,'height':390});shot('landscape-mage')
  p.evaluate('''()=>{const a=HonroApp;a.profile.honroBattle=structuredClone(a.engine.b);a.persist();window.savedState=protectedState();a.stopBattle();a.continue();while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;const banner=document.getElementById('turn-banner');if(banner)banner.hidden=true;}''')
  preserved=p.evaluate('protectedState()===savedState');assert preserved,(label,'Continue state')
  # Controlled presentation boundary: changing the engine query here tests label ownership only.
  explosion=p.evaluate('''()=>{const a=HonroApp,e=a.engine,f=e.iceGourdReady;e.iceGourdReady=()=>true;a.updateHUD();const label=document.querySelector('.fire-label').textContent;e.iceGourdReady=f;a.updateHUD();return label==='폭발';}''');assert explosion
  hint=p.evaluate('''()=>{const a=HonroApp,e=a.engine,u=e.active,old=e.b.lastShots;e.b.lastShots={...old,[u.id]:{power:.67}};a.updateHUD();const first=document.getElementById('fire').title;a.updateChargeDisplay();const second=document.getElementById('fire').title;e.b.lastShots=old;return {first,second};}''')
  p.set_viewport_size({'width':390,'height':844});p.evaluate("HonroApp.showCamp('archer');HonroApp.talent('A09')");p.wait_for_function('HonroApp.preview?.canvas.isConnected');p.wait_for_timeout(600)
  p.evaluate('''()=>{const a=HonroApp,p=a.preview;p.hold=true;for(let i=0;i<60;i++)HonroSkillPreview.tick(a,p,1/60);}''');shot('mobile-preview')
  life=p.evaluate('''()=>{const a=HonroApp,dom=[];for(let i=0;i<12;i++){a.close();a.talent('A09');if(!a.preview?.canvas.isConnected)throw Error('preview detached');a.close();dom.push(document.querySelectorAll('*').length);}return {counts:dom,cleared:!a.preview&&!a.previewRequest};}''');assert len(set(life['counts']))==1 and life['cleared'],life
  report['builds'][label]={'manifestSha256':hashlib.sha256((root/'web/manifest.json').read_bytes()).hexdigest(),'errors':errors,'keyedSkillNodesKept':kept,'pauseCycles':stable,'saveContinuePreserved':preserved,'explosionLabel':explosion,'hintOwnership':hint,'previewCycles':life};assert not errors,errors
  ctx.close()
 browser.close()
for s in servers:s.shutdown()
for name in ['desktop-idle','desktop-charge','desktop-pause','mobile-idle','mobile-mage','landscape-mage','mobile-preview']:
 left=Image.open(OUT/f'before-{name}.png').convert('RGB');right=Image.open(OUT/f'after-{name}.png').convert('RGB');diff=ImageChops.difference(left,right);hist=diff.histogram();maximum=max(v[1] for v in diff.getextrema());report['pixels'].append({'view':name,'exact':diff.getbbox() is None,'maxChannel':maximum,'bbox':diff.getbbox(),'changedPixels':sum(1 for v in diff.getdata() if any(v))})
(OUT/'checks.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
# Separate processes can differ at a handful of antialiased HUD edge pixels.
# Preserve exact results and the strict residual bound, never label these exact.
assert all(r['maxChannel']<=3 and r['changedPixels']<=32 for r in report['pixels']),report['pixels']
