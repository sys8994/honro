"""Real touch/mouse card order gestures and existing App save/turn integration.
Prior-clear profiles are fixtures; no normal campaign completion claim.
"""
import json,sys,subprocess,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
PREP=ROOT/'_local/reports/player-turn-order-20261023';OUT=ROOT/os.environ.get('HONRO_CARD_ORDER_OUT','_local/reports/camp-card-turn-order-20261023/browser');OUT.mkdir(parents=True,exist_ok=True)
KEY='honro-first-act-profile-1';rows=[]
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw);ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);page=ctx.new_page();errors=[];http=[]
 def watch(p):
  p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:http.append(r.url)if r.status>=400 else None)
 watch(page)
 def load(profile,stage):
  page.goto(base+'/HONRO.html',wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=90000);page.evaluate('(v)=>localStorage.setItem(v.key,JSON.stringify(v.profile))',dict(key=KEY,profile=profile));page.reload();page.wait_for_function('window.HonroApp',timeout=90000);page.evaluate('async id=>{await HonroCampaignLoader.ensureStage(id);HonroApp.frame=()=>{}}',stage)
 def camp():page.evaluate("HonroApp.showCamp('archer')");page.wait_for_selector('.hero-tabs .hero-tab');assert page.locator('[data-action=player-order-open]').count()==0
 def tap(action,extra=''):page.locator(f'[data-action="{action}"]'+extra).click()
 def cards():return page.locator('.hero-tabs>.hero-tab').evaluate_all('(els)=>els.map(e=>e.dataset.class)')
 def point(cls):
  b=page.locator(f'.hero-tab[data-class={cls}]').bounding_box();return dict(x=b['x']+b['width']/2,y=b['y']+b['height']/2,id=0)
 def touch(kind,points):cdp.send('Input.dispatchTouchEvent',dict(type=kind,touchPoints=points))
 def drag(cls,target,cancel=None,shot=False):
  a,z=point(cls),point(target);original=cards();saved_order=page.evaluate('HonroPlayerTurnOrder.order(HonroApp.profile)');saved_count=counter();selected=page.evaluate('HonroApp.cls');touch('touchStart',[a]);page.wait_for_timeout(50 if cancel=='early-escape' else 350)
  if cancel!='early-escape':
   assert page.locator('.order-dragging').count()==0,'not armed before500ms';page.wait_for_timeout(210);assert page.locator('.order-dragging').count()==1;assert page.evaluate('HonroApp.cls')==selected
  if cancel=='multi':
   second={**point('mage'),'id':1};touch('touchStart',[a,second]);touch('touchMove',[z,second]);touch('touchEnd',[])
  elif cancel in ['escape','early-escape']:page.keyboard.press('Escape');touch('touchMove',[a if cancel=='early-escape' else z]);touch('touchEnd',[])
  elif cancel=='cancel':touch('touchMove',[z]);touch('touchCancel',[])
  elif cancel=='outside':touch('touchMove',[{**z,'x':-30}]);touch('touchEnd',[])
  else:
   for n in range(1,7):touch('touchMove',[dict(x=a['x']+(z['x']-a['x'])*n/6,y=a['y'],id=0)]);page.wait_for_timeout(20)
   preview=cards();assert page.evaluate('HonroPlayerTurnOrder.order(HonroApp.profile)')==saved_order and counter()==saved_count,'preview never saves';assert page.evaluate('HonroApp.cls')==selected
   if shot:
    metrics=page.locator('.hero-tab').evaluate_all('(cards)=>cards.map(c=>({cls:c.dataset.class,left:c.getBoundingClientRect().left,transform:getComputedStyle(c).transform,animations:c.getAnimations().length}))');assert any(c['animations']for c in metrics if c['cls']!=cls),metrics
    page.screenshot(path=str(OUT/'mobile-dragging.jpg'),type='jpeg',quality=90);page.wait_for_timeout(190);settled=page.locator('.hero-tab').evaluate_all('(cards)=>cards.map(c=>({cls:c.dataset.class,left:c.getBoundingClientRect().left}))');page.screenshot(path=str(OUT/'mobile-preview-settled.jpg'),type='jpeg',quality=90);rows.append(dict(check='unselected500ms/live-preview',selected=selected,dragged=cls,before=original,preview=preview,stored=saved_order,animations=metrics,settled=settled))
   touch('touchEnd',[])
  page.wait_for_timeout(90)
 def counter():return page.evaluate('window.cardOrderSaves')
 def count_saves():page.evaluate('''()=>{window.cardOrderSaves=0;const a=HonroApp;a.qaOrderBasePersist??=a.persist.bind(a);const persist=a.qaOrderBasePersist;a.persist=()=>{window.cardOrderSaves++;return persist();};}''')
 # Recruited-only drag and ordinary short-tap selection, no modal.
 load(json.loads((PREP/'two-profile.json').read_text()),3);cdp=ctx.new_cdp_session(page);camp();count_saves();page.locator('.hero-tab[data-class=mage]').tap();assert page.evaluate('HonroApp.cls')=='mage';assert counter()==0;assert cards()[:2]==['archer','mage'];assert page.locator('.hero-tab[data-class=occultist]').inner_text().strip()=='미합류'
 drag('mage','archer');assert cards()[:2]==['mage','archer'];assert counter()==1;assert page.evaluate('HonroApp.cls')=='mage';assert page.locator('.player-turn-order').count()==0
 page.screenshot(path=str(OUT/'mobile-known-only.jpg'),type='jpeg',quality=85)
 assert page.locator('[data-card-order-hint]').inner_text()=='길게 눌러 순서 변경'
 # Four cards: commit once, selected character stays fixed, each abort rolls back.
 load(json.loads((PREP/'four-profile.json').read_text()),18);camp();count_saves();page.evaluate('''()=>{window.cardEvents=[];for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture','click'])document.addEventListener(type,e=>cardEvents.push({type,id:e.pointerId,primary:e.isPrimary,button:e.button,cls:e.target.closest?.('.hero-tab')?.dataset.class,target:e.target.tagName,x:e.clientX,y:e.clientY,detail:e.detail,selected:HonroApp.cls}),true);}''');page.locator('.hero-tab[data-class=mage]').tap();assert page.evaluate('HonroApp.cls')=='mage';assert not page.locator('.hero-tab[data-class=occultist]').evaluate('(c)=>c.classList.contains("on")');page.screenshot(path=str(OUT/'mobile-before.jpg'),type='jpeg',quality=90);drag('occultist','archer',shot=True);assert cards()==['occultist','archer','mage','knight'];assert counter()==1;assert page.evaluate('HonroApp.cls')=='mage'
 page.locator('.hero-tab[data-class=archer]').tap();(OUT/'tap-events.json').write_text(json.dumps(page.evaluate('cardEvents'),indent=2));assert page.evaluate('HonroApp.cls')=='archer',page.evaluate('({cls:HonroApp.cls,after:HonroApp.journeyInputAfter,now:performance.now(),events:cardEvents})');assert counter()==1;rows.append(dict(check='immediate tap after drop',selected='archer',noExtraSave=True))
 committed=cards();selected=page.evaluate('HonroApp.cls');
 for kind in ['cancel','escape','early-escape','outside','multi']:
  before=counter();drag('knight','archer',cancel=kind);assert cards()==committed,(kind,cards());assert counter()==before;assert page.evaluate('HonroApp.cls')==selected;rows.append(dict(check=kind,orderUnchanged=True,noSave=True,noSelection=True))
 # Modal lifecycle cancels both held previews and pending presses.
 a,z=point('knight'),point('archer');touch('touchStart',[a]);page.wait_for_timeout(560);touch('touchMove',[z]);page.evaluate('HonroApp.open("<p>검사 안내</p>","")');page.wait_for_timeout(40);page.evaluate('HonroApp.close()');touch('touchEnd',[]);page.wait_for_timeout(80);assert cards()==committed and counter()==1 and page.locator('.order-dragging').count()==0;rows.append(dict(check='modal open/close rolls preview back',noOrderSave=True))
 # A swipe before long-press disarms without turning into a character tap.
 a=point('knight');touch('touchStart',[a]);touch('touchMove',[{**a,'x':a['x']-45}]);touch('touchEnd',[]);page.wait_for_timeout(80);assert cards()==committed and counter()==1 and page.evaluate('HonroApp.cls')==selected
 # Vertical native scrolling wins over pending reorder.
 before_scroll=page.locator('.camp-scroll').evaluate('(e)=>e.scrollTop');a=point('mage');touch('touchStart',[a]);
 for n in range(1,7):touch('touchMove',[{**a,'y':a['y']-n*18}]);page.wait_for_timeout(25)
 touch('touchEnd',[]);page.wait_for_timeout(250);after_scroll=page.locator('.camp-scroll').evaluate('(e)=>e.scrollTop');assert after_scroll>before_scroll,(before_scroll,after_scroll);assert cards()==committed and counter()==1;page.locator('.camp-scroll').evaluate('(e)=>e.scrollTo({top:0,behavior:"instant"})');page.wait_for_timeout(150);rows.append(dict(check='native vertical scroll',before=before_scroll,after=after_scroll,noSave=True))
 # New independent drag after multi-touch/scroll must work and save once.
 drag('knight','archer');assert cards()==['occultist','knight','archer','mage'];assert counter()==2;assert page.evaluate('HonroApp.cls')==selected;page.screenshot(path=str(OUT/'mobile-saved-cards.jpg'),type='jpeg',quality=85);saved_profile=page.evaluate('HonroApp.profile');page.reload();page.wait_for_function('window.HonroApp');page.evaluate('HonroApp.frame=()=>{}');camp();assert cards()==['occultist','knight','archer','mage'];assert page.evaluate('HonroApp.profile.playerTurnOrder')==cards();assert page.locator('.hero-tabs').evaluate('(n)=>n.scrollWidth<=n.clientWidth+1')
 # Screen exit restores the stored order, allowing unrelated normal rest saves.
 original=cards();page.evaluate('''()=>{window.exitOrderWrites=[];const a=HonroApp,save=a.persist.bind(a);a.persist=()=>{exitOrderWrites.push(HonroPlayerTurnOrder.order(a.profile));return save();};}''');a,z=point('knight'),point('archer');touch('touchStart',[a]);page.wait_for_timeout(560);touch('touchMove',[z]);page.evaluate('HonroApp.showRest()');touch('touchEnd',[]);page.wait_for_timeout(60);camp();assert cards()==original and page.locator('.order-dragging').count()==0;assert all(o==original for o in page.evaluate('exitOrderWrites'));rows.append(dict(check='screen exit/reenter no ghost or wrong-order write',order=cards(),persistedOrders=page.evaluate('exitOrderWrites')))
 # Desktop pointer movement and inline keyboard alternative, still no editor.
 ctx2=browser.new_context(viewport={'width':1180,'height':757});page=ctx2.new_page();watch(page);load(saved_profile,18);camp();count_saves();a,z=point('mage'),point('archer');page.mouse.move(a['x'],a['y']);page.mouse.down();page.mouse.move(z['x'],z['y'],steps=8);page.mouse.up();page.wait_for_timeout(80);assert cards()==['occultist','knight','mage','archer'];assert counter()==1
 page.locator('.hero-tab[data-class=occultist]').focus();page.keyboard.press('Alt+ArrowRight');assert cards()==['knight','occultist','mage','archer'];assert counter()==2;assert page.evaluate('document.activeElement.dataset.class')=='occultist';a,z=point('occultist'),point('knight');page.mouse.move(a['x'],a['y']);page.mouse.down();page.mouse.move(z['x'],z['y'],steps=8);page.mouse.up();page.wait_for_timeout(80);assert cards()==['occultist','knight','mage','archer'];assert counter()==3
 page.screenshot(path=str(OUT/'desktop-cards.jpg'),type='jpeg',quality=85);rows.append(dict(check='mouse and Alt arrows',order=cards(),saves=counter(),noModal=True))
 def finish_story():
  for _ in range(80):
   if not page.evaluate('!!HonroApp.dialogue'):break
   tap('dialogue-next');page.wait_for_timeout(15)
  assert not page.evaluate('!!HonroApp.dialogue')
 def ready():
  page.wait_for_timeout(300);page.evaluate('''()=>{const a=HonroApp,C=HONRO_CORE;for(let n=0;n<2000&&!a.engine.canAct();n++){a.engine.tick(C.STEP);if(!a.dialogue)a.missionTick(C.STEP);}HonroStory.tick(a,performance.now()+2000);a.updateHUD(true);}''');finish_story()
 def state():return page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;return {active:b.active,cls:a.engine.active.cls,round:b.round,preference:b.playerTurnOrder,units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,acted:u.acted,dead:u.dead}))}}''')
 page.evaluate('HonroApp.launch(18)');page.wait_for_function('HonroApp.engine?.b.honroStage===18',timeout=90000);finish_story();ready();fresh=state();assert fresh['cls']=='occultist';tap('defend');ready();assert state()['cls']=='knight';tap('select-hero','[data-id=p-archer]');assert state()['cls']=='archer';with_export=None
 with page.expect_download() as download:page.evaluate('HonroApp.export()')
 exported=json.loads(Path(download.value.path()).read_text());snapshot=exported['honroBattle'];page.evaluate('HonroApp.persist()');page.reload();page.wait_for_function('window.HonroApp');page.evaluate('async()=>{await HonroCampaignLoader.ensureStage(18);HonroApp.frame=()=>{};HonroApp.continue()}');page.wait_for_function('HonroApp.engine?.b.honroStage===18');assert json.loads(page.evaluate('JSON.stringify(HonroApp.engine.b)'))==snapshot;continued=state();camp();count_saves();a,z=point('mage'),point('occultist');page.mouse.move(a['x'],a['y']);page.mouse.down();page.mouse.move(z['x'],z['y'],steps=10);page.mouse.up();page.wait_for_timeout(80);assert cards()==['mage','occultist','knight','archer'];assert counter()==1;page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.engine?.b.honroStage===18');assert state()['active']==continued['active'];assert state()['units']==continued['units'];ready();tap('defend');ready();after=state();assert after['cls']=='mage';assert next(u for u in after['units']if u['id']=='p-occultist')['acted'];assert next(u for u in after['units']if u['id']=='p-archer')['acted']
 page.evaluate('''()=>{const a=HonroApp,u=a.engine.active;Object.assign(a.scene,{manual:true,x:u.x,y:u.y-140,scale:.5,goalFocus:null,cinematic:null,storyTween:null});a.updateHUD(true);a.scene.render(a.engine,0,a.selected,a.power,false,0)}''');page.wait_for_function('HonroAuthoredFarArt.ready(18)',timeout=90000);page.evaluate('HonroApp.scene.render(HonroApp.engine,0,HonroApp.selected,HonroApp.power,false,0)');page.screenshot(path=str(OUT/'continued-next-mage.jpg'),type='jpeg',quality=85)
 (OUT/'actual-window.json').write_text(json.dumps(page.evaluate('''()=>{const a=HonroApp;return {profile:{...a.profile,honroBattle:JSON.parse(JSON.stringify(a.engine.b))}}}''')))
 assert not errors and not http,(errors,http)
 result=dict(checkedCommit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),entry=json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],rows=rows,fresh=fresh,wholeBattleContinueExact=True,manualAndSpentPreserved=continued,afterChangedCardsAndDefend=after,errors=errors,httpFailures=http,scope='Touch/mouse/keyboard browser fixtures; prepared prior-clear entry and small ordinary select/defend window. No stage completion or physical device claim; frozen frame save loop invokes actual App.persist once.')
 (OUT/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');browser.close()
print('PASS direct card touch/mouse reorder, tap/scroll/cancel/multi, save/reload, fresh and current-action Continue')
