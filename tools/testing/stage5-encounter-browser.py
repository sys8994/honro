"""Render unedited checkpoints from the normal App-input run via production Continue.
Snapshots are generated test saves, not user saves or new gameplay completion proof.
"""
import json,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[2];out=R/'_local/reports/stage5-review/encounter-browser';out.mkdir(exist_ok=True,parents=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=browser.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto('http://127.0.0.1:8842/HONRO.html');p.wait_for_function('window.HonroApp && window.HonroCampaignLoader',timeout=90000)
 for phase in ['round-13-p-mage','round-14-p-mage']:
  checkpoint=json.loads((R/f'_local/reports/stage5-review/acceptance8/{phase}.json').read_text());profile=checkpoint['profile'];profile['honroBattle']=checkpoint['battle']
  p.evaluate('''async profile=>{await HonroCampaignLoader.ensureStage(5);const a=HonroApp;a.profile=profile;a.debugMode=false;a.profile.settings.sound=false;a.profile.settings.music=false;a.continue();for(let i=0;i<20&&a.dialogue;i++)HonroStory.finish(a);a.close();a.frame=()=>{};}''',profile);p.wait_for_function('HonroAuthoredFarArt.ready(5)',timeout=90000)
  for width,height in [(1440,900),(390,844)]:
   p.set_viewport_size({'width':width,'height':height});p.wait_for_timeout(150)
   p.evaluate('''()=>{const a=HonroApp,s=a.scene;a.turnNotice=null;if(document.getElementById('turn-banner'))document.getElementById('turn-banner').hidden=true;Object.assign(s,{x:3400,y:2580,scale:.75,manual:true,goalFocus:null,storyTween:null,cinematic:null});s.render(a.engine,0,'',.6,false,0);a.updateHUD(true);}''');p.screenshot(path=str(out/f'{phase}-{width}.png'))
 (out/'evidence.json').write_text(json.dumps({'scope':__doc__,'errors':errors},ensure_ascii=False,indent=2));assert not errors,errors;browser.close()
