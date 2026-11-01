"""Static in-game art review only. Normal journey entry, diagnostic camera views.
No live actor position, health, equipment, terrain or objective mutation.
"""
import os,json,hashlib,lzma
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[3]
out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=True)
fixture=Path(__file__).resolve().parent.parent/'stage38'/'entry-profile.json'
profile=json.loads(fixture.read_text())['profile']
assert profile['lastStage']==37 and len(profile['recruited'])==4
import_file=out/'entry-profile.json'
import_file.write_text(json.dumps(profile,ensure_ascii=False))
record={'scope':'fresh synthetic Stage38 entry; camera-only art diagnostic, not gameplay acceptance',
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
  p.wait_for_function("HonroApp.screen==='rest'||HonroApp.engine?.b?.honroStage===38",timeout=60000)
  if p.evaluate("HonroApp.screen==='rest'"):
   p.get_by_text('여정첩',exact=True).click()
   p.locator('[data-action="journey-select"][data-id="38"]').click()
   p.wait_for_timeout(500)
   p.locator('[data-action="journey-travel"][data-id="38"]').click()
  p.wait_for_function('HonroApp.engine?.b?.honroStage===38',timeout=60000)
  for _ in range(30):
   if not p.evaluate('!!HonroApp.dialogue'):break
   p.wait_for_timeout(1000);p.keyboard.press('Enter')
  p.wait_for_timeout(1500)
  record['observed']=p.evaluate('''()=>{const b=HonroApp.engine.b;return{stage:b.honroStage,
    support:b.terrain.find(t=>t.id==='a4-rescue-rock-step')||null,
    covered:b.honroAct4Design?.nativeArt?.coveredTerrainIds,
    party:b.units.filter(u=>u.side===0).map(u=>({id:u.id,hp:u.hp,x:u.x,y:u.y}))}}''')
  for name,scale in [('normal',.6),('close',1.3)]:
   p.evaluate('''scale=>{const s=HonroApp.scene;s.x=4800;s.y=2530;s.scale=scale;s.manual=true;}''',scale)
   for _ in range(50):
    p.wait_for_timeout(600)
    if p.evaluate('!!HonroApp.dialogue'):p.keyboard.press('Enter');continue
    if p.evaluate('!!HonroApp.engine.b.honroAct4PreviewState.vista?.active'):continue
    p.evaluate("scale=>{const s=HonroApp.scene;s.x=4800;s.y=2530;s.scale=scale;s.manual=true;}",scale)
    p.wait_for_timeout(400)
    if not p.evaluate('!!HonroApp.dialogue'):break
   path=out/(name+'.png');p.screenshot(path=str(path))
   actual=p.evaluate('({x:HonroApp.scene.x,y:HonroApp.scene.y,scale:HonroApp.scene.scale,dialogue:!!HonroApp.dialogue})')
   assert not actual['dialogue'] and abs(actual['scale']-scale)<.01,actual
   record['views'].append({'name':name,'scale':scale,'actualCamera':actual,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
  assert not record['errors'],record['errors']
  record['passed']=True # Capture execution only, never visual acceptance.
  raw=p.evaluate("localStorage.getItem('honro-first-act-profile-1')");(out/'profile.json.xz').write_bytes(lzma.compress(raw.encode()));record['storedSha256']=hashlib.sha256(raw.encode()).hexdigest()
  record['body']=p.evaluate('''async()=>{const a=HonroApp.engine.b.honroLandmarks.find(l=>l.id==='approved38-body').asset;const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(a)));return{id:a.id,sha256:Array.from(new Uint8Array(d),x=>x.toString(16).padStart(2,'0')).join('')}}''')
  browser.close()
finally:
 (out/'capture.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
