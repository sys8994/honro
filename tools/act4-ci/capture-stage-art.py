"""Static in-game art review only. Normal journey entry, diagnostic camera views.
No live actor position, health, equipment, terrain or objective mutation.
"""
import os,json,hashlib,lzma
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2]
stage=int(os.environ.get('HONRO_CAPTURE_STAGE','31'))
legacy40=stage==40 and os.environ.get('HONRO_CAPTURE_LEGACY40')=='1'
assert stage in (3,30) or 31<=stage<=40
out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=True)
fixture=Path(__file__).with_name('stage38')/'entry-profile.json'
profile=json.loads(fixture.read_text())['profile']
assert profile['lastStage']==37 and len(profile['recruited'])==4
# Art-only replay fixture: begin at a camp, not the uninterrupted 37 -> 38 handoff.
profile['honroJourney'].pop('pendingDirect',None)
# Camera-only replay coverage uses a declared synthetic unlocked ledger.
if stage>=32:
 for n in range(1,41):profile['cleared'].setdefault(str(n),{'visits':1,'rounds':5,'stars':1,'shots':0})
if stage==40:
 fixture=root/'tools/act4-rc/fixtures/stage40-checkpoints/sailing-observation-local-storage.json.xz'
 raw=lzma.decompress(fixture.read_bytes());assert hashlib.sha256(raw).hexdigest()=='2c8e5d95e1e956059da5ae0b74a02641beed0bccf0932568194b108fec3a8141'
 profile=json.loads(raw)
import_file=out/'entry-profile.json'
import_file.write_text(json.dumps(profile,ensure_ascii=False))
record={'scope':'synthetic cleared-campaign profile, normal journey replay; camera-only art diagnostic, not gameplay acceptance',
        'sourceCommit':os.environ.get('GITHUB_SHA'),'passed':False,'errors':[],'views':[],
        'fixtureSha256':hashlib.sha256(fixture.read_bytes()).hexdigest()}
try:
 with sync_playwright() as w:
  browser=w.chromium.launch(headless=True)
  p=browser.new_page(viewport={'width':1440,'height':900})
  p.on('pageerror',lambda e:record['errors'].append(str(e)))
  p.goto(os.environ['HONRO_CAPTURE_URL'],wait_until='domcontentloaded')
  p.wait_for_function('window.HonroApp')
  p.locator('[data-action="settings"]').first.click()
  p.get_by_text('기록·관리',exact=False).click()
  p.get_by_text('JSON 기록 가져오기',exact=True).click()
  p.get_by_text('파일 선택',exact=True).click()
  p.locator('#file-import').set_input_files(str(import_file.resolve()))
  if stage==40:
   record['scope']='preserved actual Stage40 campaign profile; normal UI map-revision restart, camera-only art diagnostic; no play acceptance'
   p.wait_for_function('HonroApp.profile?.lastStage===40',timeout=120000)
   p.reload();p.wait_for_function('window.HonroApp')
   p.locator('.title-actions [data-action="continue"]').first.click()
   p.wait_for_function('HonroApp.engine?.b?.honroStage===40 && HonroApp.engine.b.round===1',timeout=120000)
  else:
   p.wait_for_function('HonroApp.profile?.lastStage===37 && HonroApp.profile.recruited.length===4',timeout=15000)
   p.reload();p.wait_for_function('window.HonroApp')
   record['title']=p.locator('body').inner_text()[:3000]
   p.get_by_text('여정 이어가기',exact=True).click()
   p.wait_for_function("HonroApp.screen==='rest'")
   for _ in range(30):
    if not p.evaluate('!!HonroApp.dialogue'):break
    p.wait_for_timeout(800);p.keyboard.press('Enter')
   for _ in range(30):
    p.wait_for_timeout(700)
    if p.evaluate("HonroApp.screen==='journey'"):break
    if p.evaluate('!!HonroApp.dialogue'):p.keyboard.press('Enter');continue
    book=p.locator('[data-action="journey-book"]:visible')
    if book.count():book.click()
   record['bookState']=p.evaluate('({screen:HonroApp.screen,dialogue:!!HonroApp.dialogue})')
   record['bookText']=p.locator('body').inner_text()[:4000]
   p.screenshot(path=str(out/'journey-navigation.jpg'),type='jpeg',quality=80)
   assert record['bookState']['screen']=='journey',record['bookState']
   p.locator('[data-action="journey-act"][data-id="'+str((stage-1)//10+1)+'"]').click()
   p.wait_for_timeout(500)
   p.locator('[data-action="journey-select"][data-id="'+str(stage)+'"]').click()
   p.wait_for_timeout(500)
   p.locator('[data-action="journey-travel"][data-id="'+str(stage)+'"]').click()
   for _ in range(40):
    if p.evaluate('(n)=>HonroApp.engine?.b?.honroStage===n',stage):break
    if p.evaluate('!!HonroApp.dialogue'):
     p.wait_for_timeout(800);p.keyboard.press('Enter')
    else:
     enter=p.locator('[data-action="journey-enter"][data-id="'+str(stage)+'"]:visible')
     if enter.count():enter.click()
    p.wait_for_timeout(500)
   p.wait_for_function('(stage)=>HonroApp.engine?.b?.honroStage===stage',arg=stage,timeout=60000)
  for _ in range(30):
   if not p.evaluate('!!HonroApp.dialogue'):break
   p.wait_for_timeout(1000);p.keyboard.press('Enter')
  p.wait_for_timeout(1500)
  record['observed']=p.evaluate('''()=>{const b=HonroApp.engine.b;return{stage:b.honroStage,width:b.width,height:b.height,
    party:b.units.filter(u=>u.side===0).map(u=>({id:u.id,hp:u.hp,x:u.x,y:u.y}))}}''')
  current=p.evaluate('({x:HonroApp.scene.x,y:HonroApp.scene.y,scale:HonroApp.scene.scale})')
  width=record['observed']['width'];height=record['observed']['height']
  views=[{'name':'initial','x':current['x'],'y':current['y'],'scale':current['scale'],'w':1440,'h':900}]
  if stage==31:
   for name,x,y,scale,w,h in [
     ('overview',width/2,height/2,1440/(width+100),1440,900),
     ('normal',1400,2000,.5,1440,900),('close',1400,2000,1,1440,900),
     ('min-zoom',width/2,height/2,.3,1440,900),
     ('mobile',1400,2000,.5,390,844),('mobile-landscape',1400,2000,.5,844,390),
     ('left-edge',0,2200,.5,1440,900),('right-edge',width,2200,.5,1440,900)]:
    views.append({'name':name,'x':x,'y':y,'scale':scale,'w':w,'h':h})
  if stage>=32:
   # Full scene and actor-readable view; no actor/quest state mutation.
   views.append({'name':'overview','x':width/2,'y':height/2,'scale':min(1440/(width+100),760/(height+100)),'w':1440,'h':900})
   heroes=record['observed']['party'];hero=next((h for h in heroes if h['id']=='archer'),heroes[0])
   views.append({'name':'normal','x':hero['x']+450,'y':hero['y']-180,'scale':.65,'w':1440,'h':900})
  if stage==40:
   for name,x,y,scale in [('dock',1550,2690,.65),('boss',2050,3370,.8),('boss-close',2050,3370,1.2)]:
    views.append({'name':name,'x':x,'y':y,'scale':scale,'w':1440,'h':900})
  record['roster']=p.evaluate('''()=>{const b=HonroApp.engine.b;return {enemies:b.units.filter(u=>u.side===1).length,major:b.units.filter(u=>u.side===1&&u.boss).length,minis:b.units.filter(u=>u.side===1&&u.honroMidboss).length,finaleRevision:b.honroFinalDefenseRevision}}''')
  for view in views:
   if view['name']=='min-zoom':view['scale']=p.evaluate('(w)=>HonroBounds.zoomLimits(w).min',view['w'])
   p.set_viewport_size({'width':view['w'],'height':view['h']})
   p.evaluate('''v=>{const s=HonroApp.scene;s.x=v.x;s.y=v.y;s.scale=v.scale;s.manual=true;}''',view)
   for _ in range(30):
    p.wait_for_timeout(700)
    if p.evaluate('!!HonroApp.dialogue'):
     p.keyboard.press('Enter');continue
    p.evaluate("v=>{const s=HonroApp.scene;s.x=v.x;s.y=v.y;s.scale=v.scale;s.manual=true;}",view)
    p.wait_for_timeout(400)
    if not p.evaluate('!!HonroApp.dialogue'):break
   path=out/(view['name']+'.jpg');p.screenshot(path=str(path),type='jpeg',quality=88)
   actual=p.evaluate('({x:HonroApp.scene.x,y:HonroApp.scene.y,scale:HonroApp.scene.scale})')
   record['views'].append({'requested':view,'actualCamera':actual,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
  assert not record['errors'],record['errors']
  record['passed']=True # Capture execution only, never visual acceptance.
  browser.close()
finally:
 (out/'capture.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
