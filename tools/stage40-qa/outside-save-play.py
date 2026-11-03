"""Unpublished Stage40 prepared-profile UI diagnostic, never fun/cohort approval.
All live mutations use exposed DOM, keyboard or minimap controls. Planner clones
current state only. No HP/pose/kill/scene-flag injection or hidden item actions.
"""
import os,json,lzma,time,hashlib,traceback,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'act4-ci'))
from precise_aim import aim_with_joystick
from role_outcome import useful_role_effect
root=Path(os.environ.get('HONRO_REPO_ROOT','.')).resolve();out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=False)
bridge=(Path(__file__).parent/'browser-planner.js').read_text()
stage=int(os.environ.get('HONRO_OLD_SAVE_STAGE','40'));assert stage in [31,40]
entry=18 if stage==40 else 21;target_id='final40-dock-stair-5' if stage==40 else 'pilot31-ridge-court-3'
record_file='41690685003-r18-outside-layer-profile.json.xz' if stage==40 else '41721169502-stage31-last-storage.json.xz'
expected='f03fcde9fb4123512af7492e37f788c7a5a74e9c02b8cedff78d9708e94c0a7d' if stage==40 else '7360f60500bc58a5bcde09c21225b06bb589ee245c98ce45cba61b7ea0d59aee'
raw=lzma.decompress((root/'tools/stage40-qa/records'/record_file).read_bytes());assert hashlib.sha256(raw).hexdigest()==expected
(out/'source-profile.json').write_bytes(raw);saved=json.loads(raw);old=next(v for v in saved['honroBattle']['units'] if v['id']==target_id)
result={'passed':False,'sourceCommit':os.environ.get('GITHUB_SHA'),'stage':stage,'sourceRun':41690685003 if stage==40 else 41721169502,'sourceRound':saved['honroBattle']['round'],'sourceProfileSha256':expected,'scope':'Exact normal old-save import, read-only physical candidate traces and ordinary enemy response. Not fresh whole-stage or user fun acceptance.','events':[],'errors':[]}
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True);p=browser.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:result['errors'].append(str(e)))
 def state():return p.evaluate("""id=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,t=e.unit(id);return{round:b.round,phase:b.phase,side:b.side,can:a.canInput(),grounded:u&&e.grounded(u),dialogue:!!a.dialogue,active:u?.id,target:{x:t.x,y:t.y,hp:t.hp,moveLeft:t.moveLeft,lastAct:t.lastAct,cell:t.honroDensityCell,lastShot:b.lastShots?.[t.id],support:e.contactSurface(t.x,t.y-4,t.y+5)?.t.id},heroes:b.units.filter(v=>v.side===0&&!v.summoned).map(v=>({id:v.id,hp:v.hp,dead:v.dead,x:v.x,y:v.y}))}}""",target_id)
 def ready():
  for _ in range(160):
   s=state()
   if s['dialogue']:p.wait_for_timeout(850);p.keyboard.press('Enter')
   elif s['can'] and s['side']==0 and s['grounded']:return
   p.wait_for_timeout(250)
  raise TimeoutError('Input readiness bound')
 def record(label,extra=None):
  result['events'].append({'label':label,'state':state(),'detail':extra});(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
 try:
  p.goto(os.environ['HONRO_CAPTURE_URL'],wait_until='domcontentloaded');p.wait_for_function('window.HonroApp')
  p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str((out/'source-profile.json').resolve()))
  p.wait_for_function('stage=>HonroApp.profile?.lastStage===stage',arg=stage);p.reload();p.wait_for_function('window.HonroApp');p.locator('.title-actions [data-action="continue"]').first.click();p.wait_for_function('stage=>HonroApp.engine?.b.honroStage===stage',arg=stage);ready()
  if stage==31 and state()['active']!='knight':p.locator('[data-action="select-hero"][data-id="knight"]').click();ready()
  initial=state();assert initial['round']==entry and initial['target']['support']==('approved40-coast-west' if stage==40 else 'approved31-upper-east'),initial
  for key in ['x','y','hp']:assert initial['target'][key]==old[key],(key,initial['target'],old[key])
  assert p.evaluate('HonroApp.profile.heroes')==saved['heroes']
  for h in initial['heroes']:
   prior=next(v for v in saved['honroBattle']['units'] if v['id']==h['id']);assert h['hp']==prior['hp']
  candidates=p.evaluate("""id=>{const e=HonroApp.engine,C=HONRO_CORE,u=e.unit(id),before=JSON.stringify(e.b),rows=[];for(const t of e.b.units.filter(v=>v.side===0&&!v.dead&&v.hp>0))rows.push({target:t.id,options:C.debugMoveOptions(e,u,t)});if(JSON.stringify(e.b)!==before)throw Error('Candidate diagnostic changed live state');return rows}""",target_id)
  assert any(o['reach'] for row in candidates for o in row['options']),'No paid physical candidate survives for the old outside-layer pose'
  record('normal-old-save-and-read-only-candidates',candidates)
  box=p.locator('#minimap').bounding_box();dims=p.evaluate('({w:HonroApp.engine.b.width,h:HonroApp.engine.b.height})');p.mouse.move(720,400);p.mouse.wheel(0,1400);p.mouse.click(box['x']+box['width']*old['x']/dims['w'],box['y']+box['height']*(old['y']-150)/dims['h']);p.wait_for_timeout(450);p.screenshot(path=str(out/'old-save.png'))
  for _ in range(8):
   if state()['round']>entry:break
   p.keyboard.press('f');p.wait_for_timeout(1000);ready();record('normal-defense')
  final=state();assert final['round']==entry+1,final;record('normal-enemy-response');p.screenshot(path=str(out/'response.png'))
  result['targetActuallyMoved']=abs(final['target']['x']-initial['target']['x'])>1 or abs(final['target']['y']-initial['target']['y'])>1
  result['targetActuallyActed']=final['target']['lastAct']>=entry;result['candidateTraceOnly']=not result['targetActuallyMoved'];assert not result['errors'];result['passed']=True
 except Exception as ex:
  result['failure']=str(ex);result['traceback']=traceback.format_exc()
  try:p.screenshot(path=str(out/'failure.png'))
  except Exception:pass
 finally:
  (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));browser.close()
if not result['passed']:raise SystemExit(1)
