"""Manual-screen route study: actions are human-selected from screenshots.
No state coordinates or predictors are supplied to decision-maker while running.
Read-only snapshots are recorded for later analysis, not automated control.
"""
import sys,json,threading,functools,hashlib,time,os
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'tests'));from browser_support import launch
out=root/os.environ.get('HONRO_SCREEN_OUT','_local/reports/stage39-screen-route-study');out.mkdir(parents=True,exist_ok=False);resume=os.environ.get('HONRO_SCREEN_STORAGE')
project=json.loads((root/'_local/inputs/stage39-presentation/stage39.json').read_bytes());fixture=(root/'art/act4-sharpness-followups/stage39-fullplay/entry-fixture-v2/profile.json').read_text()
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));threading.Thread(target=srv.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{srv.server_port}'
with sync_playwright() as pw:
 browser=launch(pw);ctx=browser.new_context(viewport={'width':1440,'height':900});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/HONRO.html');value=fixture
 if resume:
  storage=json.loads((root/resume).read_text());value=next(x['value'] for o in storage['origins'] for x in o['localStorage'] if x['name']=='honro-first-act-profile-1')
 page.evaluate("v=>localStorage.setItem('honro-first-act-profile-1',v)",value);page.reload();page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT&&window.HONRO_AUTHORED_FAR',timeout=60000)
 page.evaluate("""async project=>{await HonroCampaignLoader.ensureStage(39);const all=HONRO_PROJECT;all.stages=all.stages.filter(s=>s.metadata.stageId!==39).concat(project.stages);const ids=new Set(project.library.map(x=>x.id));all.library=all.library.filter(x=>!ids.has(x.id)).concat(project.library);HONRO_AUTHORED_FAR.images.act4Estuary='/_local/inputs/stage32-sharp/act4-estuary.webp'}""",project)
 page.get_by_text('이어서 걷기' if resume else '여정 이어가기',exact=True).click();page.wait_for_function('HonroApp.engine?.b?.honroStage===39',timeout=60000);page.wait_for_timeout(1200)
 f=(out/'events.jsonl').open('w');index=0
 def snap(action):
  global index
  page.wait_for_timeout(600);page.screenshot(path=str(out/f'{index:03}.png'))
  s=page.evaluate("""()=>{let a=HonroApp,e=a.engine,b=e.b,u=e.active,q=b.honroAct4PreviewState||{};return{round:b.round,side:b.side,phase:b.phase,active:u?.id,screen:a.screen,dialogue:!!a.dialogue,coords:u&&{x:u.x,y:u.y,moveLeft:u.moveLeft,support:e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id},heroes:b.units.filter(v=>v.side===0&&!v.summoned).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead})),residents:b.units.filter(v=>v.honroAct4Resident).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead})),foes:b.units.filter(v=>v.side===1&&!v.dead).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp})),tide:q.tide,events:q.events,observed:q.observed,netOpen:q.netOpen,exitStable:q.exitStable,rescued:q.rescued,complete:q.complete,failure:q.failure}}""")
  f.write(json.dumps({'index':index,'action':action,'time':time.time(),'state':s},ensure_ascii=False)+'\n');f.flush();ctx.storage_state(path=str(out/'storage.json'));print('SCREEN',index,flush=True);index+=1
 snap('entry')
 for line in sys.stdin:
  x=line.strip().split();cmd=x[0] if x else ''
  if cmd=='quit':break
  try:
   if cmd in ('r','l','up','down'):
    key={'r':'ArrowRight','l':'ArrowLeft','up':'ArrowUp','down':'ArrowDown'}[cmd];page.keyboard.down(key);page.wait_for_timeout(int(float(x[1])*1000));page.keyboard.up(key)
   elif cmd=='jump':page.keyboard.press('Control')
   elif cmd=='jump-r':
    page.keyboard.down('ArrowRight');page.keyboard.press('Control');page.wait_for_timeout(int(float(x[1])*1000));page.keyboard.up('ArrowRight')
   elif cmd=='drop':page.keyboard.press('Alt')
   elif cmd=='f':page.keyboard.press('f')
   elif cmd=='e':page.keyboard.press('e')
   elif cmd=='enter':page.keyboard.press('Enter')
   elif cmd=='fire':
    page.keyboard.down('Space');page.wait_for_timeout(int(float(x[1])*1000));page.keyboard.up('Space')
   elif cmd=='skill':page.keyboard.press('Digit'+x[1])
   elif cmd=='wait':page.wait_for_timeout(int(float(x[1])*1000))
   elif cmd=='zoom':page.mouse.move(720,450);page.mouse.wheel(0,int(x[1]))
   elif cmd=='save':ctx.storage_state(path=str(out/'checkpoint.json'))
   else:print('unknown',flush=True);continue
   snap(line.strip())
  except Exception as ex:print('ERROR',str(ex),flush=True);break
 f.close();(out/'errors.json').write_text(json.dumps(errors));ctx.storage_state(path=str(out/'final-storage.json'));ctx.close();browser.close()
srv.shutdown();srv.server_close()
