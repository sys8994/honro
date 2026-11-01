"""Normal UI import of the actual baseline capture save, on the new artwork build."""
import os,json,lzma,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
base=Path(os.environ['OUT']);out=base/'resume';out.mkdir(parents=True,exist_ok=True);raw=lzma.decompress((base/'before/profile.json.xz').read_bytes());source=json.loads(raw);original=json.loads((base/'before/capture.json').read_text());file=out/'import.json';file.write_bytes(raw);result={'passed':False,'scope':'baseline actual UI-created stage38 save resumes on new art build without map restart','errors':[]}
state_js='''async()=>{const b=HonroApp.engine.b,a=b.honroLandmarks.find(l=>l.id==='approved38-body').asset;const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(a)));return{stage:b.honroStage,round:b.round,revision:b.honroCampaignMapRevision,body:{id:a.id,sha256:Array.from(new Uint8Array(d),x=>x.toString(16).padStart(2,'0')).join('')},heroes:b.units.filter(u=>u.side===0&&!u.honroAct4Resident&&!u.summoned).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp})),terrain:b.terrain}}'''
with sync_playwright() as w:
 b=w.chromium.launch(headless=True);p=b.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:result['errors'].append(str(e)))
 try:
  p.goto(os.environ['HONRO_CAPTURE_URL'],wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str(file.resolve()))
  p.wait_for_function('HonroApp.profile?.honroBattle?.honroStage===38',timeout=90000);p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===38',timeout=90000)
  restored=p.evaluate(state_js);assert restored['body']==original['body'],restored['body'];assert restored['round']==source['honroBattle']['round'] and restored['revision']==5
  expected=[{k:u[k] for k in ['id','x','y','hp']} for u in source['honroBattle']['units'] if u['side']==0 and not u.get('honroAct4Resident') and not u.get('summoned')];assert restored['heroes']==expected,(restored['heroes'],expected);assert restored['terrain']==source['honroBattle']['terrain']
  p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===38',timeout=90000);again=p.evaluate(state_js);assert again['body']==restored['body'] and again['heroes']==restored['heroes'] and again['terrain']==restored['terrain'];assert not result['errors']
  p.screenshot(path=str(out/'continued.png'));result.update(passed=True,originalBody=original['body'],restoredBody=again['body'],round=again['round'],heroes=again['heroes'],terrainEqual=True)
 finally:
  (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));b.close()
