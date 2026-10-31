import json,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2]; f=json.loads((root/'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile']; f['cleared']={str(i):{'visits':1,'rounds':5,'stars':1,'shots':0} for i in range(1,39)};f['lastStage']=39;f['mapNode']=39;f.pop('honroBattle',None)
base=sys.argv[1]; mode=sys.argv[2]
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']); c=b.new_context(viewport={'width':1440,'height':900});p=c.new_page();ev=[];p.on('request',lambda q: ev.append({'t':time.monotonic(),'url':q.url,'type':'request'}) if 'chapter-40' in q.url else None);p.on('requestfinished',lambda q: ev.append({'t':time.monotonic(),'url':q.url,'type':'finished'}) if 'chapter-40' in q.url else None);p.on('requestfailed',lambda q: ev.append({'t':time.monotonic(),'url':q.url,'type':'failed','error':q.failure}) if 'chapter-40' in q.url else None);p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(f,ensure_ascii=False))+');');t=time.monotonic();p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp && window.HonroCampaignLoader',timeout=120000);ready=time.monotonic();screen=p.evaluate('HonroApp.screen'); buttons=p.locator('button').all_text_contents(); print('READY',mode,round(ready-t,2),screen,buttons,flush=True)
 if mode=='entry':
  p.evaluate('HonroApp.launch(39)');p.wait_for_function('HonroApp.screen==="battle"',timeout=60000);entered=time.monotonic();p.wait_for_timeout(10000)
 else:
  entered=None;p.wait_for_timeout(13000)
 result={'base':base,'mode':mode,'readySeconds':ready-t,'enteredSeconds':entered-t if entered else None,'events':[dict(e,t=round(e['t']-t,3)) for e in ev],'screen':p.evaluate('HonroApp.screen'),'loaded40':p.evaluate('HonroCampaignLoader.has(40)')};out=root/'_local/act4-perf'/('prewarm-'+mode+'-'+base.rsplit(':',1)[1]+'.json');out.write_text(json.dumps(result,indent=2));print(json.dumps(result),flush=True);c.close();b.close()
