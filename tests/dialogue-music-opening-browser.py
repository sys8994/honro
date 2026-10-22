"""Real local MP3 streams; synthetic ended events exercise playlist boundaries.
Fresh chapter/retry/save states are navigation fixtures, not combat victories.
"""
import json,subprocess
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
OUT=ROOT/'_local/reports/dialogue-music-opening';OUT.mkdir(parents=True,exist_ok=True)

with sync_playwright() as p:
 browser=launch(p);context=browser.new_context(viewport={'width':1280,'height':800});page=context.new_page();errors=[];checks=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(story_base_url()+'/HONRO.html');page.wait_for_function('window.HonroApp',timeout=120000);page.mouse.click(12,12)
 def song(track,label):
  page.wait_for_function('''n=>{const m=HonroApp.audio.music;return m.track===n-1&&m.current?.currentTime>.1&&!m.current.paused&&!m.outgoing;}''',arg=track,timeout=30000)
  value=page.evaluate('''()=>({music:HonroApp.audio.music.status(),label:document.getElementById('bgm-now-playing').textContent,hidden:document.getElementById('bgm-now-playing').hidden})''');assert value['label'].startswith('배경음 - ');assert not value['hidden'];checks.append({'name':label,**value});print(label,value,flush=True)
 def start(sid):
  page.evaluate('''id=>{const a=HonroApp;HonroStoryFraming.clear(a.scene);a.dialogue=null;a.engine=null;a.profile=HONRO_TOOLS.fresh();for(let i=1;i<=30;i++)a.profile.cleared[i]={rounds:5};a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=a.profile.recruited.slice();a.launch(id);}''',sid)
  page.wait_for_function('id=>HonroApp.engine?.b.honroStage===id',arg=sid,timeout=120000)
 for sid in [9,10]:
  start(sid);song(4,f'chapter {sid} opening');assert page.locator('#bgm-now-playing').inner_text()=='배경음 - 산 자와 남은 자'
  page.wait_for_timeout(600);page.evaluate('''()=>{const a=HonroApp,m=a.audio.music;window.keptSong=m.current;window.keptStarts=m.starts;window.keptTime=m.current.currentTime;for(let i=0;i<120;i++)a.updateAudio();m.unlock();}''');page.wait_for_timeout(200)
  assert page.evaluate('HonroApp.audio.music.current===keptSong&&HonroApp.audio.music.current.currentTime>=keptTime&&HonroApp.audio.music.starts===keptStarts')
  page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));}");frozen=page.evaluate('HonroApp.audio.music.current.currentTime');page.wait_for_timeout(300);assert abs(page.evaluate('HonroApp.audio.music.current.currentTime')-frozen)<.05
  page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));}");page.wait_for_timeout(250);assert page.evaluate('HonroApp.audio.music.current===keptSong&&HonroApp.audio.music.current.currentTime>=keptTime')
  page.screenshot(path=str(OUT/f'stage{sid}-desktop.png'))
  for track in [2,3,4,2]:page.evaluate("HonroApp.audio.music.current.dispatchEvent(new Event('ended'))");song(track,f'chapter {sid} rotation {track}')
  session=page.evaluate('HonroApp.engine.b.session');page.evaluate('HonroApp.retry()');page.wait_for_function('s=>HonroApp.engine.b.session!==s',arg=session);song(4,f'chapter {sid} retry')
  page.evaluate('HonroStory.save(HonroApp);HonroApp.persist()');page.reload();page.wait_for_function('window.HonroApp',timeout=120000);page.locator('[data-action="continue"]').click();song(4,f'chapter {sid} Continue')
  page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(600);page.screenshot(path=str(OUT/f'stage{sid}-mobile.png'));label=page.locator('#bgm-now-playing').bounding_box();assert label['x']>=0 and label['x']+label['width']<=391;page.set_viewport_size({'width':1280,'height':800})
 # Return through the actual title playlist before an ordinary chapter.
 page.evaluate("()=>{const a=HonroApp;a.dialogue=null;a.screen='title';a.updateAudio();}");song(1,'return to title');start(3);song(2,'ordinary chapter opening')
 for track in [3,4,2]:page.evaluate("HonroApp.audio.music.current.dispatchEvent(new Event('ended'))");song(track,f'ordinary chapter rotation {track}')
 assert not errors,errors
 (OUT/'checks.json').write_text(json.dumps({'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'checks':checks,'errors':errors,'limits':['Local Chromium streaming, synthetic ended/visibility events; not physical-device audio or whole-track listening.']},ensure_ascii=False,indent=2));browser.close();print('DONE',len(checks),'music transitions',flush=True)
