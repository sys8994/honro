"""Actual Chromium decode and Story/Engine audio events on prepared battle entries."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/mukjong-audio-20261023';sign=json.loads((OUT/'sign-ready.json').read_text());keeper=json.loads((OUT/'keeper-ready.json').read_text());ROW='12.beats.sign:a6e603d56a'
with serve_game()as base,sync_playwright()as pw:
 browser=launch(pw);c=browser.new_context(viewport={'width':1180,'height':757});p=c.new_page();requests=[];errors=[];p.on('request',lambda r:requests.append(r.url)if r.url.endswith('.mp3')and'/graphics/'in r.url else None);p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('if(!localStorage.getItem("honro-first-act-profile-1"))localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(sign))+');');p.goto(base+'/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady',timeout=90000);assert len(requests)==0,'Title must not request bell recording';p.locator('[data-action=continue]').click();p.wait_for_function('HonroApp.engine?.b.honroStage===12&&HonroApp.canInput()&&!HonroApp.dialogue&&!HonroApp.turnNotice',timeout=90000);p.wait_for_function('HonroMukjongAudio.stats(HonroApp.audio)?.ready',timeout=30000)
 stats=lambda:p.evaluate('HonroMukjongAudio.stats(HonroApp.audio)')
 decoded=stats();assert 5.7<decoded['duration']<5.9 and decoded['decodes']==1 and len(requests)==1
 p.keyboard.press('e');p.wait_for_function('!!HonroApp.dialogue')
 def target():return p.evaluate('HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId')==ROW
 def forward():
  for _ in range(25):
   if target():return
   p.locator('[data-action=dialogue-next]').click();p.wait_for_timeout(120)
  assert target()
 forward();p.wait_for_function('HonroMukjongAudio.stats(HonroApp.audio).plays===1');first=stats();assert first['lastRate']==1
 p.locator('[data-action=dialogue-prev]').click();forward();p.evaluate('for(let i=0;i<120;i++)HonroStory.draw(HonroApp)');assert stats()['plays']==1 and stats()['decodes']==1 and len(requests)==1
 p.evaluate('HonroApp.persist()');p.reload();p.wait_for_function('document.documentElement.dataset.honroReady',timeout=90000);p.locator('[data-action=continue]').click();p.wait_for_function('HonroApp.engine?.b.honroStage===12&&!!HonroApp.dialogue',timeout=90000);p.wait_for_function('HonroMukjongAudio.stats(HonroApp.audio)?.ready',timeout=30000);assert stats()['plays']==0
 p.evaluate('''()=>{const a=HonroApp;a.profile.settings.sound=false;a.audio.configure(a.profile.settings);HonroStory.draw(a);a.profile.settings.sound=true;a.audio.configure(a.profile.settings);HonroStory.draw(a);}''');assert stats()['plays']==0
 requestsBeforeKeeper=len(requests);p.evaluate('''async profile=>{const a=HonroApp;a.frame=()=>{};await HonroCampaignLoader.ensureStage(18);a.profile=profile;a.normalProfile=profile;a.continue();a.close();a.turnNotice=null;a.audio.configure(a.profile.settings);}''',keeper);p.wait_for_function('HonroApp.engine?.b.honroStage===18');beforeKeeper=stats();p.evaluate('HonroApp.engine.enemyAction()');p.wait_for_function('HonroMukjongAudio.stats(HonroApp.audio).plays===1');ritual=p.evaluate('({stats:HonroMukjongAudio.stats(HonroApp.audio),ritual:structuredClone(HonroApp.engine.b.keeperRitual)})');assert ritual['ritual']['cast']and ritual['stats']['lastRate']==1.059463;assert ritual['stats']['decodes']==beforeKeeper['decodes']and len(requests)==requestsBeforeKeeper
 p.evaluate('for(let i=0;i<120;i++)HonroMukjongAudio.keeper(HonroApp)');assert stats()['plays']==1
 p.evaluate('''()=>{const a=HonroApp;a.profile.honroBattle=structuredClone(a.engine.b);a.persist();a.continue();HonroMukjongAudio.keeper(a);}''');assert stats()['plays']==1
 assert not errors,errors
 # One temporary503, consume the current event, retry asset without delayed playback.
 d=browser.new_context();q=d.new_page();q.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(sign))+');');q.route('**/graphics/*.mp3',lambda r:r.fulfill(status=503,body='temporary'));q.goto(base+'/HONRO.html');q.wait_for_function('document.documentElement.dataset.honroReady',timeout=90000);q.locator('[data-action=continue]').click();q.wait_for_function('HonroMukjongAudio.stats(HonroApp.audio)?.attempts===1&&!HonroMukjongAudio.stats(HonroApp.audio)?.ready',timeout=90000);q.evaluate('''row=>{const a=HonroApp;a.frame=()=>{};a.dialogue={index:0,lines:[['서술','approved row fixture',{rowId:row}]]};HonroMukjongAudio.line(a);}''',ROW);q.unroute('**/graphics/*.mp3');q.wait_for_timeout(1100);q.evaluate('HonroMukjongAudio.warm(HonroApp)');q.wait_for_function('HonroMukjongAudio.stats(HonroApp.audio).ready');failure=q.evaluate('''()=>{HonroMukjongAudio.line(HonroApp);return HonroMukjongAudio.stats(HonroApp.audio);}''');assert failure['requests']==2 and failure['decodes']==1 and failure['plays']==0
 report={'entry':json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],'titleBellRequests':0,'decoded':decoded,'signFirst':first,'signPrevious120RedrawNoReplay':True,'signContinueMuteNoReplay':True,'keeper':ritual,'keeperNoNewRequestOrDecode':True,'keeper120CallsAndContinueNoReplay':True,'temporary503RecoveryNoLatePlayback':failure,'errors':errors,'scope':'Real Chromium MP3 decode and12 Story UI; prepared positions/prior state,18 actual enemyAction ritual fixture with fixed frame;503 edge uses exact rowId fixture. No normal campaign completion or physical audio device listening claim.'};(OUT/'browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False));browser.close()
