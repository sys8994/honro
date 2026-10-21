"""Native inspection fixtures for reverse-shot continuity and supported legacy/void scenes."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/story-special-views';OUT.mkdir(parents=True,exist_ok=True)
DRAW="""()=>{const a=HonroApp;HonroStoryStaging.lineEnd(a);a.scene.render(a.engine,0,a.selected,0,false,0,true);a.updateHUD(true);return a.scene.storyFrameReport;}"""
with sync_playwright() as p:
 b=launch(p);page=b.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://localhost:8014/HONRO.html');page.wait_for_function('window.HonroApp',timeout=120000);page.evaluate("()=>{const a=HonroApp;a.frame=()=>{};a.profile=HONRO_TOOLS.fresh();for(let i=1;i<30;i++)a.profile.cleared[i]={rounds:5};a.launch(2);}");page.wait_for_function('HonroApp.engine?.b.honroStage===2&&HonroApp.dialogue')
 rows=[]
 for index in range(2,7):
  page.evaluate('n=>{while(HonroApp.dialogue.index<n)HonroStory.next(HonroApp);}',index)
  for label,size in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
   page.set_viewport_size(size);r=page.evaluate(DRAW);name=f'stage02-page{index+1:02}-{label}.png';page.screenshot(path=str(OUT/name));rows.append({'scene':'reverse-shot-sequence','page':index+1,'label':label,'image':name,'framing':r})
 page.evaluate("""()=>{const a=HonroApp;a.dialogue=null;a.profile=HONRO_TOOLS.fresh();for(let i=1;i<=26;i++)a.profile.cleared[i]={rounds:5};a.profile.honroSplitCampaign={version:1,mode:'continuous',stage:27,nextStage:27,finished:false,vitals:{},starts:{},completed:{24:true,25:true,26:true},items:null,activeRoster:['archer','mage','knight','occultist']};a.launch(27);}""");page.wait_for_function('HonroApp.engine?.b.honroStage===27&&HonroApp.engine.b.honroSplit.version===1&&HonroApp.dialogue',timeout=120000)
 setup=page.evaluate("""()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;const b=a.engine.b,m=HonroAct3.marker(b,'party-reunion');for(const [i,u]of HonroAct3.heroes(b).entries()){u.x=m.x+(i-1.5)*35;u.y=m.y;}a.actorBoundary=b.active;const opened=HonroStoryStaging.request(a,'act3-party-reunion-v1');a.actorBoundary=null;return{opened,version:b.honroSplit.version,marker:m,actors:HonroAct3.heroes(b).map(u=>({id:u.id,x:u.x,y:u.y}))};}""");assert setup['opened']
 count=page.evaluate('HonroApp.dialogue.lines.length')
 for index in range(count):
  for label,size in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
   page.set_viewport_size(size);r=page.evaluate(DRAW);assert not r['missing'];name=f'legacy27-page{index+1:02}-{label}.jpg';page.screenshot(path=str(OUT/name),type='jpeg',quality=72);rows.append({'scene':'supported-v1-reunion','page':index+1,'label':label,'image':name,'framing':r})
  if index+1<count:page.evaluate('HonroStory.next(HonroApp)')
 page.evaluate("""()=>{const a=HonroApp;a.dialogue=null;a.engine=null;a.profile=HONRO_TOOLS.fresh();for(let i=1;i<=27;i++)a.profile.cleared[i]={rounds:5};a.launch(27);}""");page.wait_for_function('HonroApp.engine?.b.honroStage===27&&HonroApp.engine.b.honroSplit.version===2&&HonroApp.dialogue',timeout=120000)
 rejected=page.evaluate("""()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;return !HonroStoryStaging.request(a,'act3-party-reunion-v1')&&!a.dialogue;}""");assert rejected
 began=page.evaluate("""()=>{const a=HonroApp;return HonroAct3Void.begin(a,'inspection-fixture');}""");assert began
 page.evaluate('()=>{for(let i=0;i<90;i++)HonroAct3Void.frame(HonroApp,.06);}')
 assert page.evaluate("HonroApp.engine.b.honroAct3Void.state==='VOID'")
 for index in range(8):
  for label,size in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
   page.set_viewport_size(size);page.evaluate('HonroAct3Void.frame(HonroApp,.06)');name=f'void-page{index+1:02}-{label}.jpg';page.screenshot(path=str(OUT/name),type='jpeg',quality=72);rows.append({'scene':'bespoke-void-manual-scene','page':index+1,'label':label,'image':name,'worldCamera':'intentional isolated experience, unchanged','text':page.locator('.honro-void-text').inner_text()})
  page.evaluate('()=>{for(let i=0;i<60;i++)HonroAct3Void.frame(HonroApp,.06);}')
  assert page.evaluate('HonroApp.honroVoidSession.line')==index,'must not auto advance'
  assert page.evaluate('HonroAct3Void.advance(HonroApp)')
 page.evaluate('()=>{for(let i=0;i<8;i++)HonroAct3Void.frame(HonroApp,.06);}')
 assert page.evaluate("HonroApp.engine.b.honroAct3Void.state==='RESOLVED'&&!!HonroApp.dialogue")
 assert not errors,errors
 (OUT/'checks.json').write_text(json.dumps({'rows':rows,'legacySetup':setup,'v1RejectedInCurrentV2':rejected,'voidManualPages':8,'errors':errors,'limits':['Explicit in-range group and legacy profile are inspection fixtures; no normal campaign completion is claimed.','Void timing advances through the original presentation frame function; battle simulation is paused.']},ensure_ascii=False,indent=2));b.close()
