"""Normal UI Stage19 farewell objective replay. Read-only runtime planning, no live writes.
Fresh profile unless an explicitly declared entry JSON is provided. Tool assisted,
not human clear-rate/fun evidence. Screenshots and failures are always retained.
"""
import os,json,time,sys,traceback,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools/act4-ci'))

out=Path(os.environ.get('HONRO_QA_OUT','_local/reports/act2-gameplay-ui'));out.mkdir(parents=True,exist_ok=True)
stage=int(os.environ.get('HONRO_STAGE','19'));result={'passed':False,'stage':stage,'scope':__doc__,'source':os.environ.get('GITHUB_SHA'),'errors':[]};events=[]
def save():
 (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));(out/'events.json').write_text(json.dumps(events,ensure_ascii=False))
try:
 with sync_playwright() as w:
  browser=w.chromium.launch(headless=True);p=browser.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:result['errors'].append(str(e)))
  p.goto(os.environ.get('HONRO_QA_URL','http://127.0.0.1:8870/HONRO.html'),wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=60000)
  if os.environ.get('HONRO_ENTRY_PROFILE'):
   entry=json.loads(Path(os.environ['HONRO_ENTRY_PROFILE']).read_text());profile=entry.get('profile',entry);result['entryFixture']=os.environ['HONRO_ENTRY_PROFILE'];p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',profile);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp')
  else:result['entryFixture']='fresh browser storage / normal new journey'
  p.locator('.title-actions button.primary:visible').click()
  deadline=time.monotonic()+180
  while time.monotonic()<deadline:
   if p.evaluate(f'HonroApp.engine?.b?.honroStage==={stage} && HonroApp.canInput()'):break
   nxt=p.locator('[data-action="dialogue-next"]:visible');enter=p.locator(f'[data-action="journey-enter"][data-id="{stage}"]:visible')
   if nxt.count() and nxt.first.is_enabled():nxt.first.click()
   elif p.evaluate('!!HonroApp.dialogue'):p.keyboard.press('Enter')
   elif enter.count():enter.first.click()
   p.wait_for_timeout(350)
  p.wait_for_function(f'HonroApp.engine?.b?.honroStage==={stage} && HonroApp.canInput()',timeout=1000)
  def state():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active;return{round:b.round,side:b.side,phase:b.phase,active:u?.id,cls:u?.cls,x:u?.x,y:u?.y,angle:u?.angle,facing:u?.facing,moveLeft:u?.moveLeft,jumpCost:u&&e.jumpCost(u),grounded:u&&e.grounded(u),can:a.canInput(),dialogue:!!a.dialogue,shots:b.shots,drop:u&&e.canDrop(),camera:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale},health:b.units.filter(v=>v.side===0&&!v.summoned).map(v=>({id:v.id,hp:v.hp,maxHp:v.maxHp,dead:v.dead,x:v.x,y:v.y})),enemies:b.units.filter(v=>v.side===1).map(v=>({id:v.id,hp:v.hp,dead:v.dead,x:v.x,y:v.y,kind:v.honroVariant})),seed:b.seed,rng:b.rng}}''')
  def record(op,**extra):
   row={'op':op,'state':state(),'time':time.time(),**extra};events.append(row);save();print(json.dumps(row,ensure_ascii=False),flush=True)
  def ready():
   for _ in range(150):
    s=state()
    if s['phase'] in ['won','lost']:return False
    if s['dialogue']:
     nxt=p.locator('[data-action="dialogue-next"]:visible')
     if nxt.count() and nxt.first.is_enabled():nxt.first.click()
     else:p.keyboard.press('Enter')
    elif s['can'] and s['side']==0 and s['grounded']:return True
    p.wait_for_timeout(350)
   return False
  p.wait_for_timeout(1600);record('initial');p.screenshot(path=str(out/'initial-normal.png'))
  p.locator('#battlecanvas').hover();p.mouse.wheel(0,4000);p.wait_for_timeout(900);p.screenshot(path=str(out/'initial-monsters-overview.png'));record('initial-overview')
  for _ in range(14):
   if state()['camera']['scale']>=.6:break
   p.mouse.wheel(0,-120);p.wait_for_timeout(100)
  assert stage==19, 'Only calibrated Act2 farewell route supported by this driver'
  for action in range(45):
   if not ready():break
   choice=p.evaluate("""()=>{const a=HonroApp,b=a.engine.b,steps=HonroAct2.readySteps(b);return steps.map(s=>({s,m:b.honroMarkers.find(m=>m.id===s.id)})).filter(v=>v.m).map(v=>({...v.m,requiredClass:v.s.requiredClass,eligible:HonroInteractions.eligibility(a,v.m).ok})).sort((a,z)=>Number(z.eligible)-Number(a.eligible))[0]||null}""")
   if not choice:
    p.wait_for_timeout(1000);record('story-wait');continue
   if choice.get('requiredClass') and choice['requiredClass']!=state()['cls']:
    chip=p.locator('[data-action="select-hero"][data-id="p-'+choice['requiredClass']+'"]:visible')
    if chip.count():chip.click();p.wait_for_timeout(200);record('select-required-hero')
   initial=state();still=0
   for pulse in range(240):
    st=state()
    if not st['can'] or st['active']!=initial['active'] or st['moveLeft']<6:break
    eligible=p.evaluate("id=>HonroInteractions.eligibility(HonroApp,HonroApp.engine.b.honroMarkers.find(m=>m.id===id)).ok",choice['id'])
    if eligible:break
    if abs(st['x']-choice['x'])<15:break
    if still>=3 and st['grounded'] and st['moveLeft']>st['jumpCost']+80:p.keyboard.press('Control');record('obstacle-jump');still=0
    key='ArrowRight' if choice['x']>st['x'] else 'ArrowLeft';p.keyboard.down(key);p.wait_for_timeout(100);p.keyboard.up(key)
    still=still+1 if abs(state()['x']-st['x'])<1 else 0
   if not ready():break
   eligible=p.evaluate("id=>HonroInteractions.eligibility(HonroApp,HonroApp.engine.b.honroMarkers.find(m=>m.id===id)).ok",choice['id'])
   if eligible:p.keyboard.press('e');record('objective-interact',marker=choice['id'])
   else:p.keyboard.press('f');record('defend-after-move',marker=choice['id'])
   p.screenshot(path=str(out/f'objective-action-{action}.png'));p.wait_for_timeout(600)
  result['final']=state();result['passed']=result['final']['phase']=='won' and not result['errors'];result['roundTargetAssessment']='Recorded separately; UI clear is not whole gameplay/fun approval';p.screenshot(path=str(out/'terminal.png'));result['stored']=json.loads(p.evaluate('localStorage.getItem("honro-first-act-profile-1")'));browser.close()
except Exception:
 result['exception']=traceback.format_exc()
 try:result['last']=state();p.screenshot(path=str(out/'failure.png'))
 except Exception:pass
finally:save()
if not result['passed']:raise SystemExit(1)
