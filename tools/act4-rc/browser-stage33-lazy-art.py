import json,lzma,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
import os
root=Path(__file__).resolve().parents[2];out=root/'_local/act4-rc/stage33-old-save';old=json.loads(lzma.decompress((root/'tools/act4-rc/evidence-stage33-save/imported-old-provider-storage.json.xz').read_bytes()));fresh=json.loads((root/'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];fresh['cleared']={str(i):{'visits':1,'rounds':5,'stars':1,'shots':0} for i in range(1,33)};fresh['lastStage']=33;fresh['mapNode']=33;fresh.pop('honroBattle',None)
def seed(p,v):p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(v,ensure_ascii=False))+');')
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for kind,profile in [('fresh',fresh),('old',old),('failed',old)]:
  c=b.new_context(viewport={'width':1280,'height':800});p=c.new_page();events=[];p.on('request',lambda r:events.append(r.url) if 'campaign-compat-33' in r.url else None);seed(p,profile);p.goto(os.environ.get('HONRO_QA_URL','http://127.0.0.1:8781')+'/HONRO.html');p.wait_for_function('window.HonroApp');p.wait_for_timeout(1000);before=len(events);raw=p.evaluate("localStorage.getItem('honro-first-act-profile-1')")
  if kind=='fresh':p.evaluate('HonroApp.launch(33)');p.wait_for_function('HonroApp.engine?.b?.honroStage===33',timeout=60000);p.wait_for_timeout(1200);assert not events;print('fresh compatibility requests',len(events),flush=True)
  else:
   assert before==0,(kind,events)
   if kind=='failed':p.route('**/*campaign-compat-33*',lambda route:route.abort())
   p.get_by_text('이어서 걷기',exact=True).click()
   if kind=='old':p.wait_for_function('HonroApp.engine?.b?.honroStage===33',timeout=60000);assert events;print('old requests after Continue',len(events),events,flush=True)
   else:p.wait_for_timeout(7000);v=p.evaluate("({raw:localStorage.getItem('honro-first-act-profile-1'),screen:HonroApp.screen,txt:document.body.innerText})");assert v['raw']==raw and v['screen']=='title' and '길을 불러오지 못했습니다' in v['txt'];print('network failure old bytes unchanged; retry offered',flush=True);p.unroute('**/*campaign-compat-33*');p.get_by_text('다시 시도',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===33',timeout=60000);print('retry restored original battle',flush=True)
  c.close()
 b.close()
