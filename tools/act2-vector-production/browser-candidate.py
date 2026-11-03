"""Real UI near-terrain entry/save/viewport smoke from a disclosed chapter-unlock fixture.
Not a continuous campaign, combat victory, human fun or complete stage acceptance.
"""
import os,json,time,traceback,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
stage=int(os.environ['HONRO_STAGE']);out=Path(os.environ.get('HONRO_QA_OUT',f'_local/reports/act2-art-browser/{stage}'));out.mkdir(parents=True,exist_ok=True)
r={'passed':False,'stage':stage,'scope':__doc__,'sourceCommit':os.environ.get('GITHUB_SHA'),'errors':[],'inputs':[]}
def save():(out/'result.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
try:
 with sync_playwright() as w:
  try:
   browser=w.chromium.launch(headless=True);p=browser.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:r['errors'].append(str(e)))
   url=os.environ.get('HONRO_QA_URL','http://127.0.0.1:8870/HONRO.html');p.goto(url,wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=60000)
   f=Path('tests/fixtures/act2-art/declared-base-profile.json');raw=f.read_bytes();profile=json.loads(raw)['profile'];profile['cleared']={str(i):{'visits':1,'rounds':0} for i in range(1,stage)};profile['honroBattle']=None
   r['fixture']={'baseSha256':hashlib.sha256(raw).hexdigest(),'explicitUnlockThrough':stage-1,'scope':'Synthetic pre-entry chapter unlock only; base ranks unchanged, no battle injection.'}
   p.evaluate('v=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',profile);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=60000);p.locator('.title-actions button.primary:visible').click()
   until=time.monotonic()+150
   while time.monotonic()<until:
    if p.evaluate(f'HonroApp.engine?.b?.honroStage==={stage} && HonroApp.canInput()'):break
    nxt=p.locator('[data-action="dialogue-next"]:visible');entry=p.locator(f'[data-action="journey-enter"][data-id="{stage}"]:visible')
    if nxt.count() and nxt.first.is_enabled():nxt.first.click();r['inputs'].append('dialogue-next')
    elif p.evaluate('!!HonroApp.dialogue'):p.keyboard.press('Enter');r['inputs'].append('Enter')
    elif entry.count():entry.first.click();r['inputs'].append('journey-enter')
    elif stage==19:
     for selector in ['[data-action="confirm-journey-launch"]','[data-action="journey-travel"][data-id="19"]','[data-action="journey-select"][data-id="19"]','[data-action="journey-book"]']:
      button=p.locator(selector+':visible')
      if button.count() and button.first.is_enabled():button.first.click();r['inputs'].append(selector);break

    p.wait_for_timeout(250)
   p.wait_for_function(f'HonroApp.engine?.b?.honroStage==={stage} && HonroApp.canInput()',timeout=1000)
   def state():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,arts=(b.honroLandmarks||[]).filter(l=>l.asset?.id?.startsWith('act2-traced:stage'+(b.honroStage===19?18:b.honroStage)+'-'));return{stage:b.honroStage,round:b.round,x:u.x,y:u.y,h:u.h,hp:u.hp,grounded:e.grounded(u),can:a.canInput(),camera:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale},art:arts.map(l=>({id:l.asset.id,collisionIds:l.collisionIds.length})),storageWarned:a.storageWarned,lastError:a.lastError,initialHostiles:b.units.filter(v=>v.side===1&&!v.dead).length}}''')
   def ready(grounded=False):
    until=time.monotonic()+90
    while time.monotonic()<until:
     st=state()
     if st['can'] and (not grounded or st['grounded']) and not p.evaluate('!!HonroApp.dialogue'):return st
     nxt=p.locator('[data-action="dialogue-next"]:visible')
     if nxt.count() and nxt.first.is_enabled():nxt.first.click();r['inputs'].append('dialogue-next:ready')
     elif p.evaluate('!!HonroApp.dialogue'):p.keyboard.press('Enter');r['inputs'].append('Enter:ready')
     p.wait_for_timeout(150)
    raise AssertionError('No ordinary input boundary: '+str(state()))
   ready()
   r['entry']=state();assert r['entry']['h']==92 and r['entry']['art'],r['entry'];assert all(a['collisionIds']==0 for a in r['entry']['art']);assert not r['entry']['storageWarned'];p.screenshot(path=str(out/'entry-monsters.png'))
   ready();direction='ArrowLeft' if stage==12 else 'ArrowRight';p.keyboard.down(direction);p.wait_for_timeout(350);p.keyboard.up(direction);r['inputs'].append(direction+':350ms');p.wait_for_timeout(300);r['moved']=state();assert abs(r['moved']['x']-r['entry']['x'])>1
   ready(grounded=True);p.keyboard.press('Control');r['inputs'].append('Control');p.wait_for_timeout(150);r['jump']=state();assert not r['jump']['grounded'];p.screenshot(path=str(out/'jump.png'));p.wait_for_timeout(2500);r['landed']=state();assert r['landed']['grounded'] and r['landed']['hp']>0
   ready();p.locator('#battlecanvas').hover();p.mouse.wheel(0,4000);p.wait_for_timeout(900);p.screenshot(path=str(out/'overview.png'));mini=p.locator('#minimap')
   for name,x,y in [('left',.01,.5),('right',.99,.5),('top',.5,.01),('bottom',.5,.99),('center',.5,.5)]:
    ready();box=mini.bounding_box();assert box;mini.click(position={'x':max(4,min(box['width']-5,box['width']*x)),'y':max(4,min(box['height']-5,box['height']*y))});p.wait_for_timeout(500);p.screenshot(path=str(out/(name+'.png')))
   intervals=p.evaluate('''()=>new Promise(resolve=>{const a=[];let last;function f(t){if(last!==undefined)a.push(t-last);last=t;if(a.length>=60)resolve(a);else requestAnimationFrame(f)}requestAnimationFrame(f)})''');v=sorted(intervals);r['headlessFrameTiming']={'samplesMs':intervals,'medianMs':v[len(v)//2],'p95Ms':v[int((len(v)-1)*.95)],'scope':'Reference only: headless CI, not physical mobile performance'}
   r['beforeReload']=state();r['storage']=p.evaluate('''()=>{const s=localStorage.getItem('honro-first-act-profile-1'),v=JSON.parse(s);return{chars:s.length,assets:v.honroBattle?.honroLocalArtTable?.assets?.length||0}}''');assert r['storage']['assets']>=len(r['entry']['art']);assert not state()['storageWarned']
   p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.locator('[data-action="continue"]:visible').first.click();p.wait_for_function(f'HonroApp.engine?.b?.honroStage==={stage}',timeout=60000);ready();r['resumed']=state();assert r['resumed']['art']==r['beforeReload']['art'];assert abs(r['resumed']['x']-r['beforeReload']['x'])<1 and r['resumed']['hp']==r['beforeReload']['hp'];p.screenshot(path=str(out/'resumed.png'))
   for name,width,height in [('mobile',390,844),('landscape',844,390)]:
    p.set_viewport_size({'width':width,'height':height});p.wait_for_timeout(900);ready();s=state();assert s['h']==92 and s['art']==r['entry']['art'] and s['can'];assert p.evaluate('document.documentElement.scrollWidth')<=width+1;p.screenshot(path=str(out/(name+'.png')))
   r['final']=state();assert not r['errors'] and not r['final']['lastError'];browser.close();r['passed']=True
  except Exception:
   r['passed']=False
   try:r['last']=state()
   except Exception:pass
   try:r['failureUI']=p.evaluate('({text:document.body.innerText,profileStore:window.HonroApp?.profileStore?.state})');p.screenshot(path=str(out/'failure.png'))
   except Exception:pass
   raise
except Exception:r['exception']=traceback.format_exc()
finally:save()
if not r['passed']:raise SystemExit(1)
