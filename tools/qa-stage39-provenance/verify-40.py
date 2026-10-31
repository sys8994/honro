"""Load unchanged game-generated victory storage, use UI to enter 40 on RC.
A new browser context is required; direct title-to-40 is not claimed.
"""
import sys,json,threading,functools,hashlib
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'tests'));from browser_support import launch
src=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=False);storage=json.loads(src.read_text());profile=next(e['value'] for o in storage['origins'] for e in o['localStorage'] if e['name']=='honro-first-act-profile-1');errors=[]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));threading.Thread(target=srv.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{srv.server_port}'
with sync_playwright() as pw:
 browser=launch(pw);ctx=browser.new_context(viewport={'width':1440,'height':900});page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/HONRO.html');page.evaluate("v=>localStorage.setItem('honro-first-act-profile-1',v)",profile);page.reload();page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT',timeout=60000)
 before=page.evaluate("""()=>({clear:HonroApp.profile.cleared?.[39],pending:HonroApp.profile.honroJourney?.pendingDirect,proof:HonroApp.profile.honroAct4})""");assert before['clear'] and before['proof']['safeSeven']['sourceRun']=='honro-map-stage-32-1793463406330'
 page.get_by_text('여정 이어가기',exact=True).click();page.wait_for_timeout(2000)
 if page.evaluate("HonroApp.screen==='rest'"):
  page.screenshot(path=str(out/'title-continue-rest.png'));page.get_by_text('여정첩',exact=True).click();page.wait_for_timeout(1000);page.locator('[data-action=journey-select][data-id="40"]').click();page.wait_for_timeout(500);page.screenshot(path=str(out/'journey-stage40.png'));page.locator('[data-action=journey-travel][data-id="40"]').click()
 page.wait_for_function('HonroApp.engine?.b?.honroStage===40',timeout=60000);page.wait_for_timeout(1000)
 after=page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,p=a.profile.honroAct4;return{screen:a.screen,stage:b.honroStage,official:b.honroAct4Official,proof:HonroAct4TerrainPreview.proofValid(b),safeSeven:p.safeSeven,rescued:p.rescued,run:p.runId,entry:b.honroAct4EntryProof,residents:b.honroAct4EntryResidents}}""");page.screenshot(path=str(out/'stage40.png'));ctx.storage_state(path=str(out/'stage40-storage.json'));(out/'stage40-profile.json').write_text(page.evaluate('()=>JSON.stringify(HonroApp.profile,null,2)')+'\n')
 result={'scope':'Separate context restored unchanged real39 victory storage. Title Continue then normal journey UI if needed; not automatic direct transition, not stage40 completion. 33-38 earlier fixture.','sourceStorageSHA256':hashlib.sha256(src.read_bytes()).hexdigest(),'before':before,'after':after,'errors':errors};(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'stage':after['stage'],'proof':after['proof'],'entry':after['entry'],'errors':errors},ensure_ascii=False));ctx.close();browser.close()
srv.shutdown();srv.server_close()
