"""Exact failed Stage31 normal-save continuation, never a within20/gate pass."""
import os,json,lzma,hashlib,time,traceback,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'act4-ci'))
from precise_aim import aim_with_joystick
from boarding_inputs import board_party
root=Path('.');out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=False)
raw=lzma.decompress((root/'tools/stage40-qa/records/41721169502-stage31-last-storage.json.xz').read_bytes())
assert hashlib.sha256(raw).hexdigest()=='7360f60500bc58a5bcde09c21225b06bb589ee245c98ce45cba61b7ea0d59aee'
saved=json.loads(raw);(out/'source-profile.json').write_bytes(raw)
result={'functionalPassed':False,'within20':False,'releaseApproved':False,'sourceCommit':os.environ.get('GITHUB_SHA'),'continuationOf':41721169502,'scope':'Exact R20-review save, normal Continue to R21 and last enemy/boarding. Diagnostic only, old whole run remains failed. No state injection or release-gate override.','errors':[],'events':[]}
planner=(root/'tools/act4-ci/normal-shot-plan.js').read_text();started=time.monotonic()
with sync_playwright() as w:
 b=w.chromium.launch(headless=True);p=b.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:result['errors'].append(str(e)))
 def state():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active;return{round:b.round,phase:b.phase,side:b.side,active:u?.id,x:u?.x,y:u?.y,angle:u?.angle,facing:u?.facing,moveLeft:u?.moveLeft,can:a.canInput(),grounded:u&&e.grounded(u),dialogue:!!a.dialogue,shots:b.shots,enemies:b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0).map(v=>({id:v.id,hp:v.hp,x:v.x,y:v.y})),heroes:b.units.filter(v=>v.side===0&&!v.summoned).map(v=>({id:v.id,hp:v.hp,dead:v.dead,x:v.x,y:v.y,acted:v.acted})),boat:b.honroAct4PreviewState?.boat}}''')
 def record(label,value=None):
  result['events'].append({'label':label,'state':state(),'detail':value});(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(label,flush=True)
 def ready():
  for _ in range(120):
   s=state()
   if s['dialogue']:p.wait_for_timeout(850);p.keyboard.press('Enter')
   elif s['phase']=='won' or s['can'] and s['side']==0 and s['grounded']:return
   p.wait_for_timeout(250)
  raise TimeoutError('Normal readiness bound')
 def show_actor():
  s=state();p.mouse.move(720,400);p.mouse.wheel(0,1200);p.wait_for_timeout(200)
  box=p.locator('#minimap').bounding_box();dims=p.evaluate('({w:HonroApp.engine.b.width,h:HonroApp.engine.b.height})');p.mouse.click(box['x']+box['width']*s['x']/dims['w'],box['y']+box['height']*(s['y']-150)/dims['h']);p.wait_for_timeout(350)
 try:
  p.goto(os.environ['HONRO_CAPTURE_URL'],wait_until='domcontentloaded');p.wait_for_function('window.HonroApp')
  p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str((out/'source-profile.json').resolve()))
  p.wait_for_function('HonroApp.profile?.lastStage===31');p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('여정 이어가기',exact=True).click();p.wait_for_function('HonroApp.engine?.b.honroStage===31');ready()
  s=state();assert s['round']==21 and len(s['enemies'])==1 and s['enemies'][0]['hp']==2,s
  assert p.evaluate('HonroApp.profile.heroes')==saved['heroes']
  for h in s['heroes']:
   old=next(v for v in saved['honroBattle']['units'] if v['id']==h['id']);assert h['hp']==old['hp'] and bool(h['dead'])==bool(old.get('dead'))
  record('normal-resume');p.screenshot(path=str(out/'resumed.png'))
  for n in range(12):
   ready();s=state()
   if not s['enemies']:break
   assert s['round']<=24 and time.monotonic()-started<600
   knight=next(h for h in s['heroes'] if h['id']=='knight')
   if n==0 and not knight['acted'] and not knight['dead']:p.locator('[data-action="select-hero"][data-id="knight"]').click();ready()
   show_actor();q=p.evaluate(planner,False);choice=q['best'];record('current-visible-plan',q)
   if not choice:
    p.keyboard.press('f');p.wait_for_timeout(900);continue
   face=-1 if choice['angle']>90 else 1
   if state()['facing']!=face:
    key='ArrowLeft' if face<0 else 'ArrowRight';p.keyboard.down(key);p.wait_for_timeout(60);p.keyboard.up(key);p.wait_for_timeout(200);ready();q=p.evaluate(planner,True);choice=q['best']
   assert choice,'Facing revalidation has no safe shot'
   p.keyboard.press('Digit'+str(choice['idx']+1));p.wait_for_timeout(100);aim=aim_with_joystick(p,choice['angle'],state);assert aim['passed'],aim
   before=state();p.keyboard.down('Space')
   try:p.wait_for_function('HonroApp.charging&&HonroApp.chargePower(performance.now())>=1',timeout=8000,polling=16)
   finally:p.keyboard.up('Space')
   p.wait_for_timeout(1200);ready();record('normal-cast',{'choice':choice,'before':before});p.screenshot(path=str(out/'last-enemy-cast.png'))
  assert not state()['enemies'],state()
  result['combatEnd']=state();record('combat-complete')
  result['final']=board_party(p,record,lambda name:p.screenshot(path=str(out/(name+'.png'))),functional_continuation=True)
  assert not result['errors'];result['within20']=result['final']['round']<=20;result['functionalPassed']=True
 except Exception as e:
  result['failure']=str(e);result['traceback']=traceback.format_exc()
  try:p.screenshot(path=str(out/'failure.png'))
  except Exception:pass
 finally:
  try:(out/'final-storage.json.xz').write_bytes(lzma.compress(p.evaluate("localStorage.getItem('honro-first-act-profile-1')").encode()))
  except Exception:pass
  result['elapsedSeconds']=time.monotonic()-started;(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));b.close()
if not result['functionalPassed']:raise SystemExit(1)
