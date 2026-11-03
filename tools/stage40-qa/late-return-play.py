"""Late functional continuation from the actual R21 failed whole-run save.
No reset or rewritten battle state; not a replacement whole-run/time pass.
"""
import os,json,lzma,time,hashlib,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
from navigation_proof import verify_navigation
from escort_inputs import finish_escort
root=Path(os.environ.get('HONRO_REPO_ROOT','.')).resolve()
out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=False)
raw=lzma.decompress((root/'tools/stage40-qa/records/41690685003-final-storage.json.xz').read_bytes())
assert hashlib.sha256(raw).hexdigest()=='a83ec3c644b23fa613ff81f7d13853c2b6dc3b5e1f2e44de0a40d2ad5935737e'
(out/'source-profile.json').write_bytes(raw);saved=json.loads(raw)
result={'functionalPassed':False,'originalWholeRunPassed':False,'releaseApproved':False,'continuationOf':41690685003,'sourceCommit':os.environ.get('GITHUB_SHA'),'entryRound':21,'errors':[],'scope':'Actual normal saved-state R21 continuation only; prior total20R failure retained; not a new whole-run, cohort or fun acceptance'}
start=time.monotonic()
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True);context=browser.new_context(viewport={'width':1440,'height':900});p=context.new_page()
 p.on('pageerror',lambda error:result['errors'].append(str(error)))
 try:
  verify_navigation(p.goto(os.environ['HONRO_CAPTURE_URL'],wait_until='domcontentloaded'),out,'entry');p.wait_for_function('window.HonroApp')
  p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str((out/'source-profile.json').resolve()))
  p.wait_for_function('HonroApp.profile?.lastStage===40',timeout=120000);verify_navigation(p.reload(),out,'import-reload');p.wait_for_function('window.HonroApp');p.locator('.title-actions [data-action="continue"]').first.click();p.wait_for_function('HonroApp.engine?.b.honroStage===40&&HonroApp.engine.b.round===21',timeout=120000)
  actual=p.evaluate('()=>({heroes:HonroApp.profile.heroes,round:HonroApp.engine.b.round,units:HonroApp.engine.b.units.map(u=>({id:u.id,hp:u.hp,dead:!!u.dead,x:u.x,y:u.y})),foes:HonroApp.engine.b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).map(u=>u.id)})')
  assert actual['heroes']==saved['heroes'] and actual['round']==21 and not actual['foes']
  for u in actual['units']:
   old=next(v for v in saved['honroBattle']['units'] if v['id']==u['id']);assert u['hp']==old['hp'] and u['dead']==bool(old.get('dead'))
  (out/'resume-resource-proof.json').write_text(json.dumps(actual,ensure_ascii=False,indent=2));p.screenshot(path=str(out/'resumed-r21.png'))
  result['escort']=finish_escort(p,out,functional_continuation=True)
  assert not result['errors'];result['functionalPassed']=True
 except Exception as error:
  result['failure']=str(error);result['traceback']=traceback.format_exc()
  try:p.screenshot(path=str(out/'failure.png'))
  except Exception:pass
 finally:
  try:(out/'final-storage.json.xz').write_bytes(lzma.compress(p.evaluate("localStorage.getItem('honro-first-act-profile-1')").encode()))
  except Exception:pass
  result['elapsedSeconds']=time.monotonic()-start;(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));browser.close()
if not result['functionalPassed']:raise SystemExit(1)
