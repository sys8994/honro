"""Static in-game art review only. Normal journey entry, diagnostic camera views.
No live actor position, health, equipment, terrain or objective mutation.
"""
import os,json,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2]
stage=int(os.environ.get('HONRO_CAPTURE_STAGE','31'))
assert stage in (3,30,31)
out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=True)
fixture=Path(__file__).with_name('stage38')/'entry-profile.json'
profile=json.loads(fixture.read_text())['profile']
assert profile['lastStage']==37 and len(profile['recruited'])==4
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
  p.wait_for_function('HonroApp.profile?.lastStage===37 && HonroApp.profile.recruited.length===4',timeout=15000)
  p.reload();p.wait_for_function('window.HonroApp')
  record['title']=p.locator('body').inner_text()[:3000]
  p.get_by_text('여정 이어가기',exact=True).click()
  p.wait_for_function("HonroApp.screen==='rest'")
  p.get_by_text('여정첩',exact=True).click()
  p.locator('[data-action="journey-select"][data-id="'+str(stage)+'"]').click()
  p.locator('[data-action="journey-travel"][data-id="'+str(stage)+'"]').click()
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
  for view in views:
   if view['name']=='min-zoom':view['scale']=p.evaluate('(w)=>HonroBounds.zoomLimits(w).min',view['w'])
   p.set_viewport_size({'width':view['w'],'height':view['h']})
   p.evaluate('''v=>{const s=HonroApp.scene;s.x=v.x;s.y=v.y;s.scale=v.scale;s.manual=true;}''',view)
   p.wait_for_timeout(700);path=out/(view['name']+'.jpg');p.screenshot(path=str(path),type='jpeg',quality=88)
   actual=p.evaluate('({x:HonroApp.scene.x,y:HonroApp.scene.y,scale:HonroApp.scene.scale})')
   record['views'].append({'requested':view,'actualCamera':actual,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
  assert not record['errors'],record['errors']
  record['passed']=True # Capture execution only, never visual acceptance.
  browser.close()
finally:
 (out/'capture.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
