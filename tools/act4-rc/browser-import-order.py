"""Scoped UI import cancellation and overlapping file-change order, isolated context."""
import json,os,tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];f=json.loads((root/'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];f.setdefault('honroFlags',{})['qaImportOrder']='second';f.pop('honroBattle',None)
with tempfile.NamedTemporaryFile(mode='w',suffix='.json',encoding='utf8') as small:
 json.dump(f,small,ensure_ascii=False);small.flush()
 with sync_playwright() as w:
  b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page();p.goto(os.environ.get('HONRO_QA_URL','http://127.0.0.1:8774/HONRO.html'));p.wait_for_function('window.HonroApp && window.HonroCampaignLoader');p.evaluate("localStorage.setItem('honro-first-act-profile-1',JSON.stringify(HonroApp.profile))");before=p.evaluate("localStorage.getItem('honro-first-act-profile-1')")
  p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('취소',exact=True).click();assert p.evaluate("localStorage.getItem('honro-first-act-profile-1')")==before;print('UI cancel preserves storage',flush=True)
  p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click()
  # Hold only the first file's real stage load so a second ordinary input change can overtake it.
  p.evaluate('''()=>{const real=HonroCampaignLoader.ensureStage;window.qaLoadStarted=false;window.qaGate=new Promise(r=>window.qaRelease=r);HonroCampaignLoader.ensureStage=async id=>{if(id===40){qaLoadStarted=true;await qaGate}return real(id)}}''')
  p.locator('#file-import').set_input_files(os.environ['HONRO_STAGE40_IMPORT']);p.wait_for_function('window.qaLoadStarted',timeout=30000);p.locator('#file-import').set_input_files(small.name);p.wait_for_function("HonroApp.profile.honroFlags?.qaImportOrder==='second'",timeout=30000);p.evaluate('qaRelease()');p.wait_for_timeout(7000)
  r=p.evaluate("({marker:HonroApp.profile.honroFlags.qaImportOrder,stage:HonroApp.profile.honroBattle?.honroStage,stored:JSON.parse(localStorage.getItem('honro-first-act-profile-1')).honroFlags.qaImportOrder})");assert r['marker']=='second' and r['stored']=='second' and r.get('stage')!=40,r;print('older asynchronous import cannot replace later file',r,flush=True);b.close()
