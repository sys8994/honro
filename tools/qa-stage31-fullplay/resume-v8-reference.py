import hashlib,json
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path('/workspace/honro/_local/reports/stage31-browser-fullplay')
raw=(out/'tactical-v8-export.json').read_text();print('export_sha256',hashlib.sha256(raw.encode()).hexdigest(),flush=True)
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1440,'height':900});p.goto('http://127.0.0.1:8766/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",v)',raw);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');print('title buttons',p.locator('button:visible').all_text_contents(),flush=True);p.screenshot(path=str(out/'tactical-v8-resume-title.png'));p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_timeout(5000);p.screenshot(path=str(out/'tactical-v8-resumed.png'));print('screen',p.evaluate('''()=>({screen:HonroApp.screen,cleared31:HonroApp.profile.cleared['31'],stage:HonroApp.engine?.b?.honroStage,round:HonroApp.engine?.b?.round,heroes:Object.fromEntries(Object.entries(HonroApp.profile.heroes).map(([k,v])=>[k,{xp:v.xp,kills:v.kills}]))})'''),flush=True);print('buttons',p.locator('button:visible').all_text_contents(),flush=True);b.close()
