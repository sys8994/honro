"""Reload and UI Continue from the exact game-produced clear save in a new browser context.
The original winning context was already reloaded, then closed before its Continue click.
This is a reconstructed follow-up session, not the original winning context."""
import json,sys,hashlib,threading,functools
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'tests'));from browser_support import launch
out=root/'_local/reports/stage39-fullplay-pilot-resume';out.mkdir(parents=True,exist_ok=True)
source=root/'_local/reports/stage39-fullplay-pilot-fresh/browser-storage.json';raw=source.read_bytes();storage=json.loads(raw);value=next(v['value'] for o in storage['origins'] for v in o['localStorage'] if v['name']=='honro-first-act-profile-1')
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}';result={'scope':'Game-produced clear storage restored in a fresh test context; reload and Continue use that same new context. The original winning context was already reloaded but closed before Continue.','storageSha256':hashlib.sha256(raw).hexdigest(),'profileValueSha256':hashlib.sha256(value.encode()).hexdigest(),'errors':[]}
with sync_playwright() as pw:
 browser=launch(pw);ctx=browser.new_context(viewport={'width':1440,'height':900});page=ctx.new_page();page.on('pageerror',lambda e:result['errors'].append(str(e)));page.goto(base+'/HONRO.html');page.evaluate("v=>localStorage.setItem('honro-first-act-profile-1',v)",value);page.reload();page.wait_for_function('window.HonroApp&&HonroApp.profile',timeout=60000)
 result['afterReload']=page.evaluate("()=>({screen:HonroApp.screen,cleared:HonroApp.profile.cleared?.[39],battle:!!HonroApp.profile.honroBattle})");page.screenshot(path=str(out/'after-reload.png'));assert result['afterReload']['cleared']['rounds']==31
 page.get_by_text('여정 이어가기',exact=True).click(timeout=30000);page.wait_for_timeout(3000)
 result['afterContinue']=page.evaluate("()=>({screen:HonroApp.screen,cleared:HonroApp.profile.cleared?.[39],lastStage:HonroApp.profile.lastStage,battle:!!HonroApp.profile.honroBattle,body:document.body.innerText.slice(0,1500)})");page.screenshot(path=str(out/'after-continue.png'));assert result['afterContinue']['cleared']['rounds']==31;assert result['afterContinue']['screen']!='title'
 result['restNext']=page.evaluate("""()=>({stages:HONRO_CONTENT.stages.length,has40:HonroCampaignLoader.has(40),mapNode:HonroApp.profile.mapNode,restNext:HonroRestJourney.restNext(HonroApp),button:[...document.querySelectorAll('[data-action=journey-enter]')].map(n=>({id:n.dataset.id,text:n.innerText}))})""")
 page.locator('[data-action=journey-book]').click();page.wait_for_timeout(1000);result['book']=page.evaluate("""()=>({screen:HonroApp.screen,act:HonroApp.journeyAct,pins:[...document.querySelectorAll('[data-action=journey-select]')].map(n=>({id:n.dataset.id,label:n.getAttribute('aria-label')}))})""");page.screenshot(path=str(out/'journey-book.png'));pin=page.locator('[data-action=journey-select][data-id="40"]');assert pin.count()==1;pin.click();page.wait_for_timeout(500);result['selected40']=page.evaluate("""()=>({screen:HonroApp.screen,selection:HonroApp.journeySelection,detail:document.querySelector('.journey-detail')?.innerText})""");page.screenshot(path=str(out/'selected-stage40.png'));assert str(result['selected40']['selection'])=='40'
 (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False));ctx.close();browser.close()
server.shutdown();server.server_close();assert not result['errors']
