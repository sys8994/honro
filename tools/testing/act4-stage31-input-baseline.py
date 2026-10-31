"""31장 prepared normal-growth input smoke. Not a campaign playthrough or fun test.

Serves the current local build. The build must first pass the production guard
before results can support release verification. The introduction is dismissed
as an explicit fixture so physical keyboard inputs can be checked in isolation.
"""
import functools, hashlib, http.server, json, pathlib, threading
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[2]
out=root/'_local/reports/act4-stage31-input';out.mkdir(parents=True,exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/HONRO.html');page.wait_for_function('!!window.HonroApp')
  setup=page.evaluate('''async()=>{
   await HonroCampaignLoader.ensureStage(31);const a=HonroApp,C=HONRO_CORE;
   for(let n=1;n<=30;n++)a.profile.cleared[n]={visits:1,rounds:5};
   a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];
   const wanted={archer:['A01','A14','A02','A05'],mage:['M01','M06','M02','M03'],knight:['S00','S01','S06','S04'],occultist:['O01','O02','O03','O06']},training=[];
   for(const cls of a.profile.party){const h=a.profile.heroes[cls];h.xp=HonroProgression.xpAt(HonroProgression.plan(31).entryLevel);const stats=[];for(let i=0;i<6;i++)stats.push(C.investStat(h,cls));const skills=[];for(const id of wanted[cls])for(let i=0;i<3;i++)skills.push({id,accepted:C.train(h,id)});a.profile.loadouts[cls]=wanted[cls].filter(id=>h.ranks[id]>0);training.push({cls,xp:h.xp,earned:C.pointsEarned(h),spent:C.pointsSpent(h,cls),stats,skills,ranks:{...h.ranks},loadout:a.profile.loadouts[cls]});}
   a.launch(31);a.close();a.dialogue=null;a.turnNotice=null;const q=a.engine.b.honroAct4PreviewState;if(q.arrivalTour)q.arrivalTour.active=false;
   return {entryLevel:HonroProgression.plan(31).entryLevel,training,stage:a.engine.b.honroStage};
  }''')
  assert setup['stage']==31 and setup['entryLevel']==22, setup
  assert all(t['spent']<=t['earned'] and all(t['stats']) for t in setup['training']), setup
  assert any(x['id']=='A14' and x['accepted'] for x in setup['training'][0]['skills']), setup
  page.wait_for_timeout(1000)
  before=page.evaluate('''()=>{const a=HonroApp,u=a.engine.active;return {can:a.canInput(),id:u.id,x:u.x,grounded:a.engine.grounded(u),shot:a.engine.b.shot}}''')
  assert before['can'] and before['id']=='archer' and before['grounded'],before
  page.keyboard.down('ArrowRight');page.wait_for_timeout(300);page.keyboard.up('ArrowRight')
  moved=page.evaluate('''()=>({x:HonroApp.engine.active.x,can:HonroApp.canInput()})''');assert moved['x']>before['x']+5 and moved['can'],moved
  page.keyboard.press('2');selected=page.evaluate('HonroApp.selected');assert selected=='A14',selected
  page.keyboard.down('Space');page.wait_for_timeout(500)
  charge=page.evaluate('''()=>({charging:HonroApp.charging,power:HonroApp.power})''');assert charge['charging'] and charge['power']>0,charge
  page.keyboard.up('Space');page.wait_for_timeout(100)
  fired=page.evaluate('''()=>({shot:HonroApp.engine.b.shot,phase:HonroApp.engine.b.phase})''');assert fired['shot']>before['shot'],fired
  assert not errors,errors
  page.locator('#battlecanvas').screenshot(path=str(out/'stage31-input.png'))
  report={'scope':'Prepared independent stage entry, level 22 legal stat/skill attempts and starter equipment; intro manually dismissed. Real browser keyboard input and game frame. No campaign continuity, combat completion, difficulty or art approval.','setup':setup,'before':before,'moved':moved,'selected':selected,'charge':charge,'fired':fired,'errors':errors,'manifestSha256':hashlib.sha256((root/'web/manifest.json').read_bytes()).hexdigest()}
  (out/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
  print('PASS stage31 normal-growth fixture: real keyboard movement, A14 selection, charge and fire; not a playthrough')
  browser.close()
finally: server.shutdown()
