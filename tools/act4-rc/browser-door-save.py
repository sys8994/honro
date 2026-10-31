import json
from playwright.sync_api import sync_playwright
from pathlib import Path
root=Path(__file__).resolve().parents[2];f=json.loads((root/'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];f['cleared']={str(i):{'visits':1,'rounds':5,'stars':1,'shots':0} for i in range(1,36)};f['lastStage']=36;f['mapNode']=36;f.pop('honroBattle',None)
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto('http://127.0.0.1:8770/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',f);p.reload();p.wait_for_function('window.HonroApp && window.HonroAct4PilotCombat');p.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(36);HonroApp.launch(36)}''');p.wait_for_function('HonroApp.engine?.b?.honroStage===36');p.wait_for_timeout(1500)
 for i in range(10):
  if not p.evaluate('!!HonroApp.dialogue'):break
  p.keyboard.press('Enter');p.wait_for_timeout(800)
 p.wait_for_function('HonroApp.canInput()',timeout=30000);p.keyboard.press('f');p.wait_for_timeout(6000)
 saved=p.evaluate('''()=>!!JSON.parse(localStorage.getItem('honro-first-act-profile-1')).honroBattle''');assert saved;print('normal action saved battle',saved,flush=True)
 p.reload();p.wait_for_function('window.HonroApp');print('title',p.locator('button:visible').all_text_contents(),flush=True);p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===36',timeout=30000);p.wait_for_timeout(1500)
 restored=p.evaluate('''()=>({id:HonroApp.engine.b.honroMap?.vectorDoorAssetId,dynamic:HonroApp.engine.b.honroAct4PreviewDynamic?.map(x=>x.asset?.id),asset:HONRO_PROJECT.library.find(x=>x.id==='act4rc:stage36-door'),round:HonroApp.engine.b.round})''');original=next(x for x in json.loads((root/'_local/act4-rc/candidates/stage36.json').read_text())['library'] if x['id']=='a4:door');actual=restored.pop('asset');assert actual and actual.pop('id')=='act4rc:stage36-door';original.pop('id');original['params']['act4DoorForeshortening']['fallenOffsetY']=79;assert actual==original;assert restored['id']=='act4rc:stage36-door' and 'a4:door' in restored['dynamic'] and not errors;print('RESTORED',restored,'matching original vector',True,'errors',errors,flush=True);b.close()
