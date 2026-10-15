"""Controlled real Game/Workshop document UI, not full campaign completion."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
from story_browser_server import story_base_url
OUT=ROOT/'_local/reports/document-reader';OUT.mkdir(parents=True,exist_ok=True)
BASE=story_base_url();checks=[];errors=[]
SETUP='''() => {const a=HonroApp;a.close();a.stopBattle();const p=HONRO_TOOLS.fresh();for(let i=1;i<30;i++)p.cleared[i]={visits:1};p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];p.settings.sound=false;p.settings.music=false;a.profile=p;a.normalProfile=p;a.launch(30);while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;const b=a.engine.b,m=b.honroMarkers.find(m=>m.id==='transport-map');Object.assign(a.scene,{x:m.x,y:m.y-110,scale:1,manual:true,storyTween:null,goalFocus:null,cinematic:null,focusId:null,speakerId:null,focusUntil:0,speakerUntil:0});document.getElementById('turn-banner').hidden=true;a.lastTurnNotice=`${b.round}:player`;return m;}'''
with sync_playwright() as p:
 browser=launch(p)
 for mobile in [False,True]:
  tag='mobile' if mobile else 'desktop';context=browser.new_context(viewport={'width':390,'height':844} if mobile else {'width':1440,'height':900},is_mobile=mobile,has_touch=mobile)
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/HONRO.html');page.wait_for_function('window.HonroApp');page.evaluate(SETUP)
  page.wait_for_timeout(200);page.screenshot(path=str(OUT/f'after-{tag}-world.png'))
  result=page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,m=b.honroMarkers.find(m=>m.id==='transport-map');Object.assign(e.active,{x:m.x,y:m.y,vx:0,vy:0,airborne:false,jumping:false});a.turnNotice=null;a.actorBoundary=b.active;const ok=HonroAct3.use(a,m);a.actorBoundary=b.active;a.startQueuedStory();return {ok,done:b.honroState.act3.done['transport-map'],dialogue:!!a.dialogue};}''')
  assert result['ok'] and result['done'],result
  page.wait_for_selector('.story-document')
  assert page.locator('.story-document').get_attribute('data-document-kind')=='map'
  assert '저문골 → 무명사: 시신·금속' in page.locator('#story-line').inner_text()
  before=page.evaluate('JSON.stringify({units:HonroApp.engine.b.units,round:HonroApp.engine.b.round,state:HonroApp.engine.b.honroState.act3})')
  page.wait_for_timeout(300)
  assert before==page.evaluate('JSON.stringify({units:HonroApp.engine.b.units,round:HonroApp.engine.b.round,state:HonroApp.engine.b.honroState.act3})'),'combat must freeze'
  assert page.evaluate('HonroApp.canInput()') is False
  page.screenshot(path=str(OUT/f'after-{tag}-map.png'))
  page.locator('[data-story-tool="document-zoom"]').click();assert page.locator('.document-enlarged').count()==1
  page.keyboard.press('Tab');assert page.evaluate('document.activeElement.dataset.storyTool')=='document-close'
  page.keyboard.press('Tab');assert page.evaluate('document.activeElement.classList.contains("document-scroll")')
  page.keyboard.press('End');page.screenshot(path=str(OUT/f'after-{tag}-zoom.png'))
  # Save/continue preserves this acquired page and the completed target, not a second use.
  snapshot=page.evaluate('JSON.stringify({index:HonroApp.dialogue.index,lines:HonroApp.dialogue.lines,goals:HonroApp.engine.b.honroState.act3})')
  page.reload();page.wait_for_function('window.HonroApp');page.locator('[data-action="continue"]').click();page.wait_for_selector('.story-document')
  assert snapshot==page.evaluate('JSON.stringify({index:HonroApp.dialogue.index,lines:HonroApp.dialogue.lines,goals:HonroApp.engine.b.honroState.act3})')
  assert page.evaluate("HonroAct3.use(HonroApp,HonroApp.engine.b.honroMarkers.find(m=>m.id==='transport-map'))") is False
  page.locator('[data-story-tool="history"]').click();assert page.locator('.record-document').count()>0;page.keyboard.press('Escape')
  page.keyboard.press('Escape');assert page.locator('.story-document').count()==0;assert page.evaluate('!!HonroApp.dialogue'),'close must retain the following conversation'
  page.locator('[data-action="dialogue-prev"]').click();assert page.locator('.story-document').count()==1
  page.locator('[data-story-tool="document-close"]').click();assert page.locator('.story-document').count()==0
  # All authored document pages fit the viewport; original text is untouched.
  inventory=page.evaluate('''()=>{while(HonroApp.dialogue)HonroStory.finish(HonroApp);const docs=[];function walk(x,stage){if(Array.isArray(x)&&typeof x[0]==='string'&&typeof x[1]==='string'&&x[2]?.kind==='document'){docs.push({stage,line:x});return;}if(x&&typeof x==='object')for(const v of Object.values(x))walk(v,stage);}for(const s of HONRO_CONTENT.stages)walk(s,s.id);walk(HonroStoryContent.interaction(HonroApp,{action:'ledger'}),3);window.readerDocs=docs;return docs.map(d=>({stage:d.stage,id:d.line[2].documentId,title:d.line[2].documentTitle}));}''')
  (OUT/'inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2))
  for kind,docid in [('ledger','hongman-ledger'),('note','hyeonmuk-letter')]:
   page.evaluate('''id=>{const d=readerDocs.find(d=>d.line[2].documentId===id);if(!d)throw Error(id);HonroStory.start(HonroApp,[d.line]);}''',docid)
   assert page.locator('.story-document').get_attribute('data-document-kind')==kind
   page.screenshot(path=str(OUT/f'after-{tag}-{kind}.png'))
   page.locator('[data-story-tool="document-zoom"]').click()
   if mobile:
    page.set_viewport_size({'width':844,'height':390});page.locator('.document-scroll').evaluate('(el)=>el.scrollTop=el.scrollHeight');assert page.locator('[data-story-tool="document-close"]').is_visible();page.screenshot(path=str(OUT/f'after-{tag}-{kind}-landscape.png'));page.set_viewport_size({'width':390,'height':844})
   page.locator('[data-story-tool="document-close"]').click()
  layout=page.evaluate("""()=>{const bad=[];for(const {line}of readerDocs){HonroStory.start(HonroApp,[line]);const el=document.querySelector('.story-document'),r=el.getBoundingClientRect(),scroll=el.querySelector('.document-scroll');if(r.left<0||r.right>innerWidth+1||r.top<0||r.bottom>innerHeight+1||scroll.scrollWidth>scroll.clientWidth+1)bad.push(line[2].documentId);HonroStory.finish(HonroApp);}return bad;}""");assert not layout,layout
  # Expanded reader scrolls independently, including touch input.
  page.evaluate("HonroStory.start(HonroApp,[readerDocs.find(d=>d.line[2].documentId==='hongman-ledger').line])")
  page.locator('[data-story-tool="document-zoom"]').click()
  if mobile:
   page.set_viewport_size({'width':390,'height':500});box=page.locator('.document-scroll').bounding_box();cdp=context.new_cdp_session(page)
   for typ,dy in [('touchStart',0),('touchMove',-70),('touchMove',-120),('touchEnd',-120)]:
    cdp.send('Input.dispatchTouchEvent',{'type':typ,'touchPoints':[] if typ=='touchEnd' else [{'x':box['x']+60,'y':box['y']+box['height']-20+dy}]});page.wait_for_timeout(40)
   assert page.locator('.document-scroll').evaluate('(el)=>el.scrollTop')>0
  bounds=page.locator('.story-document').evaluate('(el)=>{const r=el.getBoundingClientRect();return {fit:r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1,width:el.scrollWidth<=el.clientWidth+1}}');assert all(bounds.values()),bounds
  checks.append({'viewport':tag,'interaction':result,'freeze':True,'saveRestore':True,'duplicateRejected':True,'keyboardClosePreviousHistory':True,'touchScroll':mobile,'layout':bounds,'documents':len(inventory)});context.close()
 # Workshop shared Playtest reader, with its own storage context.
 context=browser.new_context(viewport={'width':1440,'height':900});page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/HONRO_WORKSHOP.html');page.wait_for_function('window.HonroWorkshopAPI')
 page.evaluate("HonroWorkshopAPI.selectStage('stage-30')");page.locator('[data-tab="play"]').click();page.wait_for_selector('iframe');frame=page.frames[-1];frame.wait_for_function('window.HonroApp')
 frame.evaluate("()=>{while(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroStory.start(HonroApp,HONRO_CONTENT.stages[29].beats['transport-map']);}");assert frame.locator('.story-document').count()==1;page.screenshot(path=str(OUT/'after-workshop-reader.png'));checks.append({'workshop':True});context.close();browser.close()
assert not errors,errors
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));print(json.dumps(checks,ensure_ascii=False))
