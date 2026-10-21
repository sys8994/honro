"""Actual browser downloads and file-input imports of genuine integration win profiles.
No combat replay. Stage2 is the recorded pre-result terminal save; Stage5 is its completed save.
"""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/integration-20261021/victory-save-browser';OUT.mkdir(parents=True,exist_ok=True)
VIEW="()=>{const a=HonroApp,p=a.profile;return Object.fromEntries(['heroes','loadouts','cleared','honroGrowth','recruited','party','record'].map(k=>[k,p[k]??null]))}"
rows=[];errors=[]
with sync_playwright() as pw,serve_game() as base:
 b=launch(pw);page=b.new_page(viewport={'width':390,'height':844},accept_downloads=True);page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp');page.evaluate('HonroApp.frame=()=>{}')
 for stage,path in [(2,ROOT/'_local/reports/integration-20261021/stage2-normal/profile-terminal.json'),(5,ROOT/'_local/reports/stage5-positioning/fullplay.json')]:
  raw=json.loads(path.read_text());profile=raw['profile'] if stage==5 else raw
  page.evaluate("async sid=>{await HonroCampaignLoader.ensureStage(sid)}",stage)
  page.evaluate('''p=>{const a=HonroApp;a.engine=null;a.done=false;a.dialogue=null;a.debugMode=false;a.profile=p;a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();if(p.honroBattle){a.continue();while(a.dialogue)HonroStory.finish(a);a.outcome();while(a.dialogue)HonroStory.finish(a);}else a.showTitle();}''',profile)
  before=page.evaluate(VIEW);assert before['cleared'].get(str(stage))
  if stage==2:
   result=page.evaluate("()=>{const a=HonroApp;a.outcome();return{done:a.done,dialogue:!!a.dialogue,battle:!!a.profile.honroBattle}}")
   assert result=={'done':True,'dialogue':False,'battle':False},result
  for repeat in range(2):
   with page.expect_download() as info:page.evaluate('HonroApp.export()')
   download=info.value;file=OUT/f'stage{stage}-export{repeat}.json';download.save_as(str(file));saved=json.loads(file.read_text());assert saved.get('honroBattle') is None
   page.locator('#file-import').set_input_files(str(file));page.wait_for_function('document.querySelector("#file-import").value===""')
   after=page.evaluate(VIEW);assert after==before,(stage,repeat)
   rows.append({'stage':stage,'repeat':repeat,'actualDownload':file.name,'sameXpSpLoadoutRewardVisits':True,'terminalBattleAbsent':True})
  page.screenshot(path=str(OUT/f'stage{stage}-after-import.png'))
 assert not errors,errors;b.close()
(OUT/'checks.json').write_text(json.dumps({'scope':__doc__,'rows':rows,'errors':errors},ensure_ascii=False,indent=2));print('PASS actual browser download/file-input import, repeated terminal outcome, XP/SP/loadouts/reward ledger/visits2x2')
