#!/usr/bin/env python3
"""Disposable-context verification of camera, real download, reload and command rejection."""
import hashlib,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
from qa31_commands import validate_command
R=Path(__file__).resolve().parents[2];out=Path(os.environ['HONRO_PREFLIGHT_DIR']);out.mkdir(parents=True,exist_ok=True);profile=json.loads((R/'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];result={'scope':'disposable preflight context; not the mission run','errors':[]}
try:validate_command(['unsupported-command'])
except ValueError as e:result['unknownCommandRejected']=str(e)
else:raise AssertionError('unknown command was not rejected')
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:result['errors'].append(str(e)));p.goto(os.environ['HONRO_QA_URL']+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',profile);p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('여정 이어가기',exact=True).click();p.wait_for_timeout(1800);p.get_by_text('스테이지 진입',exact=False).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===31',timeout=60000)
 for _ in range(20):
  if p.evaluate('HonroApp.canInput()'):break
  p.keyboard.press('Enter');p.wait_for_timeout(800)
 p.screenshot(path=str(out/'entry.png'));assert p.evaluate('HonroApp.engine.b.units.filter(u=>u.side===1&&!u.dead).length')==34
 getcam='''()=>({x:HonroApp.scene.x,y:HonroApp.scene.y,scale:HonroApp.scene.scale,manual:HonroApp.scene.manual})''';result['cameraBefore']=p.evaluate(getcam);p.mouse.move(720,350);p.mouse.wheel(0,1400);p.wait_for_timeout(500);p.mouse.move(700,600);p.mouse.down();p.mouse.move(700,350,steps=15);p.mouse.up();p.wait_for_timeout(600);result['cameraAfter']=p.evaluate(getcam);assert result['cameraBefore']!=result['cameraAfter'];p.screenshot(path=str(out/'camera.png'))
 p.keyboard.press('Escape');p.wait_for_timeout(500);p.get_by_text('설정',exact=True).click();p.locator('[data-action=settings-page][data-id=records]').click()
 with p.expect_download(timeout=30000) as d:p.get_by_text('JSON 기록 내보내기',exact=True).click()
 path=out/'ui-export.json';d.value.save_as(path);raw=path.read_bytes();parsed=json.loads(raw);assert parsed.get('honroBattle',{}).get('honroStage')==31;result['export']={'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'suggestedFilename':d.value.suggested_filename};p.screenshot(path=str(out/'export-menu.png'))
 p.keyboard.press('Escape');p.wait_for_timeout(700);p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===31',timeout=60000);result['resumed']=p.evaluate('''()=>({stage:HonroApp.engine.b.honroStage,round:HonroApp.engine.b.round,enemies:HonroApp.engine.b.units.filter(u=>u.side===1&&!u.dead).length})''');assert result['resumed']=={'stage':31,'round':1,'enemies':34};assert not result['errors'];p.screenshot(path=str(out/'reloaded.png'));b.close()
(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False),flush=True)
