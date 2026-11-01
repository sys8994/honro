"""Inspect exact before/after profile differences from the recorded six-turn win."""
import json,lzma,os,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=True);raw=lzma.decompress(Path(__file__).with_name('completed6.json.xz').read_bytes());source=json.loads(raw);file=out/'source.json';file.write_bytes(raw)
keys=['cleared','heroes','equipment','honroAct4','recruited'];project=lambda p:{k:p.get(k) for k in keys}
result={'scope':'separate-context diagnostic of the original six-turn victory save, not the original victory-context proof','sourceSha256':hashlib.sha256(raw).hexdigest(),'profiles':{'importedBytes':project(source)},'errors':[]}
def diff(a,b,path=''):
 if a==b:return []
 if isinstance(a,dict) and isinstance(b,dict):return sum((diff(a.get(k,'__missing__'),b.get(k,'__missing__'),path+'.'+k) for k in sorted(set(a)|set(b))),[])
 return [{'path':path,'before':a,'after':b}]
with sync_playwright() as w:
 b=w.chromium.launch(headless=True);p=b.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:result['errors'].append(str(e)))
 def record(key):result['profiles'][key]=p.evaluate('(keys)=>Object.fromEntries(keys.map(k=>[k,HonroApp.profile[k]]))',keys)
 try:
  p.goto(os.environ['HONRO_CAPTURE_URL'],wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str(file.resolve()));p.wait_for_function('HonroApp.profile?.cleared?.[40]?.rounds===6',timeout=90000);record('afterImport')
  p.get_by_text('여정 이어가기',exact=True).click();p.wait_for_function("HonroApp.screen==='rest'",timeout=60000);record('atRestNow');p.wait_for_timeout(3000);record('atRestSettled');p.screenshot(path=str(out/'rest-before.jpg'),type='jpeg',quality=88)
  p.reload();p.wait_for_function('window.HonroApp');record('reloadTitle');p.get_by_text('여정 이어가기',exact=True).click();p.wait_for_function("HonroApp.screen==='rest'",timeout=60000);p.wait_for_timeout(3000);record('reloadRest');p.screenshot(path=str(out/'rest-after.jpg'),type='jpeg',quality=88)
  for a,c in [('importedBytes','afterImport'),('atRestNow','atRestSettled'),('atRestSettled','reloadRest'),('importedBytes','reloadRest')]:result[a+'To'+c]=diff(result['profiles'][a],result['profiles'][c])
  result['diagnosticComplete']=True;result['stableAcrossReload']=not result['atRestSettledToreloadRest'];assert not result['errors']
 finally:
  (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in result.items() if k!='profiles'},ensure_ascii=False),flush=True);b.close()
