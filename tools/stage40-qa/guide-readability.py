"""Production guide pixels through normal saved-profile UI; no product changes.
PC/mobile viewport and ko-KR/en-US locale, existing assist=false unchanged.
Charges are cancelled via real Escape/pause, never accepted as combat proof.
"""
import os,json,lzma,time,sys,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'act4-ci'))
from precise_aim import aim_with_joystick
out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=False)
raw=lzma.decompress(Path('tools/stage40-qa/records/41615805406-precast-mage-profile.json.xz').read_bytes());(out/'profile.json').write_bytes(raw)
results=[]
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True)
 for width,height in [(1440,900),(844,390)]:
  for locale in ['ko-KR','en-US']:
   name=f'{width}x{height}-{locale}';d=out/name;d.mkdir();r={'viewport':[width,height],'locale':locale,'errors':[],'observations':[],'passed':False};results.append(r)
   ctx=browser.new_context(viewport={'width':width,'height':height},locale=locale,has_touch=width<1000);p=ctx.new_page();p.on('pageerror',lambda e:r['errors'].append(str(e)))
   def ready():
    for _ in range(100):
     if p.evaluate('!!HonroApp.dialogue'):p.wait_for_timeout(850);p.keyboard.press('Enter');continue
     if p.evaluate('HonroApp.canInput()&&HonroApp.engine.grounded(HonroApp.engine.active)'):return
     p.wait_for_timeout(150)
    raise TimeoutError('Ready')
   def observed():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,s=HONRO_CORE.SKILLS[a.selected],power=a.charging?a.chargePower(performance.now()):(u.lastPower??a.power),pr=e.predict(u,s,u.angle,power);return{power,charging:a.charging,angle:u.angle,skill:a.selected,assist:a.profile.settings.assist,round:b.round,shot:b.shot,scale:a.scene.scale,camera:{x:a.scene.x,y:a.scene.y},active:{id:u.id,x:u.x,y:u.y},predictedEndpoint:{x:pr.x,y:pr.y,unit:pr.unit},radius:e.effective(s,u).radius,pointCount:pr.points.length,health:b.units.filter(v=>v.side===0).map(v=>({id:v.id,hp:v.hp,x:v.x,y:v.y})),hasArcFx:!!a.scene.arcFx}}''')
   try:
    p.goto(os.environ['HONRO_CAPTURE_URL'],wait_until='domcontentloaded');p.wait_for_function('window.HonroApp')
    p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str((out/'profile.json').resolve()));p.wait_for_function('HonroApp.profile?.lastStage===40');p.reload();p.wait_for_function('window.HonroApp');p.locator('.title-actions [data-action="continue"]').first.click();ready();assert p.evaluate('HonroApp.profile.settings.assist') is False
    p.keyboard.press('Digit3');p.wait_for_timeout(100)
    aim=aim_with_joystick(p,-25.914776914208698,lambda:p.evaluate('()=>{const a=HonroApp,u=a.engine.active;return{active:u.id,round:a.engine.b.round,can:a.canInput(),grounded:a.engine.grounded(u),x:u.x,y:u.y,facing:u.facing,angle:u.angle,moveLeft:u.moveLeft}}'))
    assert aim['passed'],aim
    # Use ordinary wheel zoom and minimap pan; no camera assignments.
    p.mouse.move(width*.5,height*.45);p.mouse.wheel(0,-300 if width>1000 else 250);p.wait_for_timeout(250)
    b=p.locator('#minimap').bounding_box();dims=p.evaluate('({w:HonroApp.engine.b.width,h:HonroApp.engine.b.height})');p.mouse.click(b['x']+b['width']*1650/dims['w'],b['y']+b['height']*1650/dims['h']);p.wait_for_timeout(250)
    p.screenshot(path=str(d/'idle.png'));r['idle']=observed()
    initial_shot=p.evaluate('HonroApp.engine.b.shot')
    for i,target in enumerate([.25,.38,.50]):
     p.keyboard.down('Space')
     p.wait_for_function('x=>HonroApp.charging&&HonroApp.chargePower(performance.now())>=x',arg=target,timeout=8000,polling=16)
     before=observed();p.screenshot(path=str(d/f'charge-{i}.png'));after=observed();r['observations'].append({'requestedCaptureThreshold':target,'before':before,'after':after})
     p.keyboard.press('Escape');p.keyboard.up('Space');assert p.evaluate('HonroApp.engine.b.shot')==initial_shot,'Cancelled charge fired'
     p.locator('[data-action="close"]').first.click();ready()
    assert not r['errors'];r['passed']=True
   except Exception as e:r['failure']=str(e);r['traceback']=traceback.format_exc();p.screenshot(path=str(d/'failure.png'))
   finally:ctx.close();(out/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
 browser.close()
assert all(r['passed'] for r in results),results
