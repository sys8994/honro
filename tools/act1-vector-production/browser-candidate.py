"""Fresh UI entry and real movement/jump smoke. Not a clear/fun acceptance run."""
import os,json,time,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(os.environ.get('HONRO_QA_OUT','_local/reports/act1-body-browser'));out.mkdir(parents=True,exist_ok=True)
r={'sourceCommit':os.environ.get('GITHUB_SHA'),'scope':'Fresh normal stage1 UI entry, unchanged scale, real movement/jump; not combat clear or gameplay acceptance','passed':False,'errors':[],'inputs':[]}
try:
 with sync_playwright() as w:
  browser=w.chromium.launch(headless=True);p=browser.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:r['errors'].append(str(e)))
  p.goto(os.environ.get('HONRO_QA_URL','http://127.0.0.1:8770/HONRO.html'),wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=60000)
  p.get_by_role('button',name='길을 열다',exact=True).click();r['inputs'].append('click:길을 열다')
  deadline=time.monotonic()+120
  while time.monotonic()<deadline:
   if p.evaluate('HonroApp.engine?.b?.honroStage===1 && HonroApp.canInput()'):break
   next_line=p.locator('[data-action="dialogue-next"]:visible');enter=p.locator('[data-action="journey-enter"]:visible')
   if next_line.count() and next_line.first.is_enabled():next_line.first.click();r['inputs'].append('click:dialogue-next')
   elif p.evaluate('!!HonroApp.dialogue'):p.keyboard.press('Enter');r['inputs'].append('key:Enter')
   elif enter.count():enter.first.click();r['inputs'].append('click:journey-enter')
   p.wait_for_timeout(500)
  p.wait_for_function('HonroApp.engine?.b?.honroStage===1 && HonroApp.canInput()',timeout=1000);p.wait_for_timeout(1200)
  state='''() => {const a=HonroApp,e=a.engine,u=e.active;return {stage:e.b.honroStage,round:e.b.round,active:u.id,x:u.x,y:u.y,h:u.h,hp:u.hp,grounded:e.grounded(u),camera:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale},bodies:(e.b.honroLandmarks||[]).filter(l=>l.id==='act1-traced-body-candidate').map(l=>({id:l.asset.id,clip:!!l.asset.vector.clips?.sourceSolid,collisionIds:l.collisionIds.length})),canInput:a.canInput()};}'''
  r['entry']=p.evaluate(state);assert len(r['entry']['bodies'])==1,r['entry'];assert r['entry']['bodies'][0]['clip'];assert r['entry']['bodies'][0]['collisionIds']==0;assert r['entry']['h']==92;assert abs(r['entry']['camera']['scale']-.94)<.01,r['entry']['camera']
  p.screenshot(path=str(out/'entry.png'))
  p.keyboard.down('ArrowRight');p.wait_for_timeout(700);p.keyboard.up('ArrowRight');r['inputs'].append('hold:ArrowRight:700ms');p.wait_for_timeout(200);r['moved']=p.evaluate(state);assert r['moved']['x']>r['entry']['x']+1,(r['entry'],r['moved'])
  p.wait_for_function('HonroApp.canInput() && HonroApp.engine.grounded(HonroApp.engine.active)',timeout=10000);r['preJump']=p.evaluate(state);assert r['preJump']['grounded']
  p.keyboard.press('Control');r['inputs'].append('key:Control');p.wait_for_timeout(150);r['jump']=p.evaluate(state);p.screenshot(path=str(out/'jump.png'));assert not r['jump']['grounded'],r['jump']
  p.wait_for_timeout(2000);r['landed']=p.evaluate(state);assert r['landed']['grounded'] and r['landed']['hp']>0,r['landed'];p.screenshot(path=str(out/'landed.png'))
  r['frameIntervals']=p.evaluate('''() => new Promise(resolve=>{const a=[];let last;function f(t){if(last!==undefined)a.push(t-last);last=t;if(a.length>=45)resolve(a);else requestAnimationFrame(f)}requestAnimationFrame(f)})''');r['frameMedianMs']=sorted(r['frameIntervals'])[len(r['frameIntervals'])//2]
  p.locator('#battlecanvas').hover();p.mouse.wheel(0,4000);r['inputs'].append('wheel:4000');p.wait_for_timeout(1200);r['overview']=p.evaluate(state);p.screenshot(path=str(out/'overview.png'))
  assert not r['errors'],r['errors'];r['passed']=True;browser.close()
except Exception:r['error']=traceback.format_exc()
finally:(out/'result.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');print(json.dumps(r,ensure_ascii=False),flush=True)
if not r['passed']:raise SystemExit(1)
