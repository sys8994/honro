"""Real Workshop start -> default embedded Stage2 policy and shared joystick smoke."""
import json
from pathlib import Path
from browser_support import ROOT,launch,serve_game
from playwright.sync_api import sync_playwright
out=ROOT/'_local/reports/integration-20261021';rows=[]
with sync_playwright() as pw,serve_game() as url:
 b=launch(pw);p=b.new_page(viewport={'width':1280,'height':800});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(url+'/HONRO_WORKSHOP.html');p.wait_for_function('window.HonroWorkshopAPI');p.evaluate("HonroWorkshopAPI.selectStage('stage-2')");p.evaluate("HonroWorkshopAPI.startPlaytest('start')");p.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine?.b.honroStage===2',timeout=60000)
 f=p.locator('#runtimeFrame').element_handle().content_frame()
 result=f.evaluate('''()=>{const a=HonroApp,b=a.engine.b;return{active:HonroStage2Airborne.active(b),revision:b.honroStage2AirborneRevision,origin:b.honroMapOrigin,cap:b.enemyLimit,initial:a.engine.alive(1).length,flightRegion:b.honroMap.flightRegion,faceMethod:typeof a.engine.face}}''')
 assert result['active'] and result['cap']==3 and result['initial']==12,result
 f.evaluate('''()=>{const a=HonroApp;for(let n=0;n<30&&a.dialogue;n++)HonroStory.finish(a);a.updateHUD(true)}''');p.screenshot(path=str(out/'stage2-workshop-preview.png'))
 result['errors']=errors;assert not errors;(out/'stage2-workshop-preview.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(result);b.close()
