"""Cold-cache real UI import regression; requires the actual stage40 provenance JSON.
HONRO_STAGE40_IMPORT=/path/to/stage40-profile.json HONRO_QA_URL=http://127.0.0.1:8774/HONRO.html python tools/act4-rc/browser-import-cold40.py
Uses isolated browser contexts, never the user's browser or storage.
"""
import hashlib,json,os,tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
source=Path(os.environ['HONRO_STAGE40_IMPORT']);raw=source.read_bytes();assert hashlib.sha256(raw).hexdigest()=='c3724ff6ff7e2417489147457c0956c1642af3907b8b5bd923b4843c41675f6f'
url=os.environ.get('HONRO_QA_URL','http://127.0.0.1:8774/HONRO.html');key='honro-first-act-profile-1'
def ui_import(p,path):
 p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str(path));p.wait_for_timeout(10000)
def info(p):return p.evaluate('''()=>({notice:document.querySelector('#notice')?.textContent,stage:HonroApp.profile.honroBattle?.honroStage,raw:localStorage.getItem('honro-first-act-profile-1'),loaded:HonroCampaignLoader.has(40)})''')
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(url);p.wait_for_function('window.HonroApp');assert not p.evaluate('HonroCampaignLoader.has(40)');ui_import(p,source);r=info(p);saved=json.loads(r['raw']);refs=json.dumps(saved['honroBattle']).count('honroStaticAssetRef');assert r['stage']==40 and r['loaded'] and refs==26 and len(r['raw'])<300000 and not errors,(r['notice'],refs,errors);print('cold UI import: stage 40,',refs,'refs,',len(r['raw']),'bytes',flush=True)
 # Invalid static reference: reject before replacing a pre-existing valid save.
 broken=json.loads(raw);broken['honroBattle']['honroLandmarks'][0]['asset']={'honroStaticAssetRef':1,'id':'qa:missing-asset','signature':'1:bad'}
 with tempfile.NamedTemporaryFile(suffix='.json',mode='w',encoding='utf8') as f:
  json.dump(broken,f,ensure_ascii=False);f.flush();before=r['raw'];ui_import(p,Path(f.name));after=info(p);assert after['raw']==before and '확인하지 못했습니다' in after['notice'],after['notice'];print('missing asset: explicit failure, existing bytes unchanged',flush=True)
 broken=json.loads(raw);asset=broken['honroBattle']['honroLandmarks'][0]['asset'];broken['honroBattle']['honroLandmarks'][0]['asset']={'honroStaticAssetRef':1,'id':asset['id'],'signature':'1:bad'}
 p.reload();p.wait_for_function('window.HonroApp')
 with tempfile.NamedTemporaryFile(suffix='.json',mode='w',encoding='utf8') as f:
  json.dump(broken,f,ensure_ascii=False);f.flush();before=info(p)['raw'];ui_import(p,Path(f.name));after=info(p);assert after['raw']==before and '확인하지 못했습니다' in after['notice'],after['notice'];print('mismatched signature: explicit failure, existing bytes unchanged',flush=True)
 p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===40',timeout=60000);print('same-context reload: stage 40',flush=True)
 # A separate fresh context uses real browser quota, not a patched storage implementation.
 q=b.new_page();q.goto(url);q.wait_for_function('window.HonroApp');q.evaluate("localStorage.setItem('honro-first-act-profile-1',JSON.stringify(HonroApp.profile))");before=q.evaluate("localStorage.getItem('honro-first-act-profile-1')");filled=q.evaluate('''()=>{let n=5242880;while(n>0){try{localStorage.setItem('qa-quota-fill','x'.repeat(n));return n}catch(e){n-=1000}}return 0}''');assert filled;ui_import(q,source);r=info(q);assert r['raw']==before and '저장하지 못했습니다' in r['notice'],(r['notice'],filled);print('real quota failure: existing bytes unchanged; fill',filled,flush=True)
 b.close()
