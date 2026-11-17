"""Resume the unedited d96e actual-UI QA autosave after 29-round enemy clear.
Not a user save, not a fresh combat, not natural 1-39 completion.
Official UI import/continue only; no battle reset or injected state.
"""
import json,lzma,os,sys,hashlib,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(root/'tools/stage40-app-flow'))
from escort_inputs import finish_escort
out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=True)
raw=lzma.decompress((root/'tools/stage40-qa-resume/ui-d96e-round29.json.xz').read_bytes())
assert hashlib.sha256(raw).hexdigest()=='ada2099bcb273de6d7031cf1a8c8c3b361fa75054d73975521892ce112b7c3ed'
source=out/'source.json';source.write_bytes(raw)
result={'passed':False,'sourceCommit':'d96e6387c4971641143ec52778074f601e64864b','sourceRun':44155794619,'sourceArtifact':14362952464,'sourceRawSha256':hashlib.sha256(raw).hexdigest(),'checkout':os.environ.get('GITHUB_SHA'),'scope':__doc__}
STATE="""()=>{const a=HonroApp,b=a.engine?.b;return{screen:a.screen,dialogue:a.dialogue,stage:b?.honroStage,round:b?.round,phase:b?.phase,foes:b?.units.filter(u=>u.side===1&&u.hp>0&&!u.dead).length,heroes:b?.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAct4Resident).map(u=>({id:u.id,hp:u.hp,dead:u.dead,x:u.x,y:u.y})),quest:b?.honroAct4PreviewState,storedRound:a.profile.honroBattle?.round,restart:a.profile.honroMapRestart}}"""
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True);context=browser.new_context(viewport={'width':1440,'height':900});p=context.new_page()
 def snapshot(label):
  (out/(label+'.json')).write_text(json.dumps(p.evaluate(STATE),ensure_ascii=False,indent=2))
  stored=p.evaluate("localStorage.getItem('honro-first-act-profile-1')")
  if stored:(out/(label+'-storage.json.xz')).write_bytes(lzma.compress(stored.encode()))
  p.screenshot(path=str(out/(label+'.jpg')),type='jpeg',quality=88)
 try:
  p.goto(os.environ['HONRO_CAPTURE_URL'],wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=120000)
  result['emptyContextStorage']=p.evaluate('Object.keys(localStorage)')
  p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str(source.resolve()))
  p.wait_for_function('HonroApp.profile?.honroBattle?.round===29',timeout=30000)
  live=p.evaluate('()=>({heroes:HonroApp.profile.heroes,proof:HonroApp.profile.honroAct4,restart:HonroApp.profile.honroMapRestart,battle:HonroApp.profile.honroBattle,run:HonroApp.profile.equipment.runId})')
  original=json.loads(raw)
  assert live['heroes']==original['heroes'] and live['run']==original['equipment']['runId']
  assert live['proof']==original['honroAct4'] and not live['restart']
  assert live['battle']['round']==29 and not [u for u in live['battle']['units'] if u['side']==1 and u['hp']>0 and not u.get('dead')]
  result['importPreservedBattleAndGrowth']=True;snapshot('imported')
  p.get_by_text('이어서 걷기',exact=True).click()
  p.wait_for_function('HonroApp.engine?.b?.honroStage===40&&HonroApp.engine.b.round===29',timeout=60000)
  result['initial']=p.evaluate(STATE);snapshot('resumed')
  assert result['initial']['foes']==0 and result['initial']['phase']=='aim'
  result['escort']=finish_escort(p,out);result['passed']=True
 except Exception as e:
  result['failure']=str(e);result['traceback']=traceback.format_exc()
  try:snapshot('failure')
  except Exception:pass
  raise
 finally:
  (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));context.close();browser.close()
