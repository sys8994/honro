from pathlib import Path
from playwright.sync_api import sync_playwright
raw=Path('/workspace/honro/_local/reports/stage31-browser-fullplay/tactical-v4-storage.json').read_text()
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1440,'height':900});p.goto('http://127.0.0.1:8766/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",v)',raw);p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===31');p.wait_for_timeout(1000)
 def state():return p.evaluate('''()=>({round:HonroApp.engine.b.round,active:HonroApp.engine.b.active,heroes:HonroApp.engine.b.units.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp})),enemies:HonroApp.engine.b.units.filter(u=>u.side===1&&!u.dead).length})''')
 before=state();p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===31');p.wait_for_timeout(1000);after=state();print('before',before,'after',after,flush=True);assert before==after;b.close()
