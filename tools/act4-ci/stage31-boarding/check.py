"""Focused current-runtime boarding regression from a recorded real R13 save.
Not a fresh battle, success-rate sample or natural 1-30 campaign proof.
"""
import os,json,lzma,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
here=Path(__file__).resolve().parent;out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=True)
raw=lzma.decompress((here/'checkpoint.json.xz').read_bytes())
assert hashlib.sha256(raw).hexdigest()=='7a58b7fbe5dff81dbb630974e4b4112e10623f4aef74cdbd866ca07273af69ee'
source=out/'recorded-profile.json';source.write_bytes(raw)
commands=json.loads((here/'inputs.json').read_text())
result={'passed':False,'releaseApproved':False,'scope':'recorded R13 real checkpoint -> four-person boarding with current browser runtime',
        'sourceCommit':os.environ.get('GITHUB_SHA'),'checkpointSha256':hashlib.sha256(raw).hexdigest(),'observations':[],'errors':[]}
state_js='''()=>{const e=HonroApp.engine,b=e.b,q=b.honroAct4PreviewState;return {stage:b.honroStage,phase:b.phase,round:b.round,
 active:b.active,dialogue:!!HonroApp.dialogue,boat:q.boat,complete:!!q.complete,enemies:b.units.filter(u=>u.side===1&&!u.dead).length,
 heroes:b.units.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead,grounded:e.grounded(u)}))}}'''
try:
 with sync_playwright() as w:
  browser=w.chromium.launch(headless=True);p=browser.new_page(viewport={'width':1440,'height':900})
  p.on('pageerror',lambda e:result['errors'].append(str(e)))
  p.goto(os.environ['HONRO_CAPTURE_URL'],wait_until='domcontentloaded');p.wait_for_function('window.HonroApp')
  p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click()
  p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click()
  p.locator('#file-import').set_input_files(str(source.resolve()))
  p.wait_for_function('HonroApp.profile?.honroBattle?.honroStage===31',timeout=60000)
  p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click()
  p.wait_for_function('HonroApp.engine?.b?.honroStage===31',timeout=60000)
  first=p.evaluate(state_js);assert first['round']==13 and first['enemies']==0 and len(first['heroes'])==4,first
  result['initial']=first;p.screenshot(path=str(out/'initial.jpg'),type='jpeg',quality=88)
  for i,c in enumerate(commands):
   op,args=c['op'],c['input']
   if op=='hold':
    p.keyboard.down(args[0]);p.wait_for_timeout(int(args[1]));p.keyboard.up(args[0]);p.wait_for_timeout(int(args[2]))
   elif op=='key':p.keyboard.press(args[0]);p.wait_for_timeout(int(args[1]))
   elif op=='wait':p.wait_for_timeout(int(args[0]))
   current=p.evaluate(state_js);result['observations'].append({'input':c,'actual':current})
   assert all(h['hp']>0 and not h['dead'] for h in current['heroes']),current
   if op=='key' and args[0]=='f':
    p.screenshot(path=str(out/f'handoff-{i}.jpg'),type='jpeg',quality=85)
  final=p.evaluate(state_js);result['final']=final;p.screenshot(path=str(out/'objective.jpg'),type='jpeg',quality=88)
  assert final['phase']=='won' and final['complete'] and final['boat']['phase']=='boarded',final
  assert final['round']==13 and not result['errors'],result['errors']
  result['passed']=True;browser.close()
finally:
 (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
