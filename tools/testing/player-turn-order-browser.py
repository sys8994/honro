"""Camp touch editor + ordinary App start/save/Continue input windows.
Prepared prior-clear profiles; no campaign completion or physical device claim.
"""
import json,sys,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
BASE=ROOT/'_local/reports/player-turn-order-20261023';OUT=BASE/'browser';OUT.mkdir(parents=True,exist_ok=True)
KEY='honro-first-act-profile-1'
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw);ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);page=ctx.new_page();errors=[];http=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:http.append(r.url)if r.status>=400 else None)
 def load(profile,stage):
  page.goto(base+'/HONRO.html',wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=90000)
  page.evaluate('(v)=>localStorage.setItem(v.key,JSON.stringify(v.profile))',dict(key=KEY,profile=profile));page.reload();page.wait_for_function('window.HonroApp',timeout=90000)
  page.evaluate('async id=>{await HonroCampaignLoader.ensureStage(id);HonroApp.frame=()=>{}}',stage)
 def camp():
  page.evaluate("HonroApp.showCamp('archer')");page.wait_for_selector('[data-action=player-order-open]')
 def tap(action,extra=''):page.locator(f'[data-action="{action}"]'+extra).tap()
 def finish_story():
  for _ in range(80):
   if not page.evaluate('!!HonroApp.dialogue'):break
   tap('dialogue-next');page.wait_for_timeout(15)
  assert not page.evaluate('!!HonroApp.dialogue')
 def ready():
  page.wait_for_timeout(300)
  page.evaluate('''()=>{const a=HonroApp,C=HONRO_CORE;for(let n=0;n<2000&&!a.engine.canAct();n++){a.engine.tick(C.STEP);if(!a.dialogue)a.missionTick(C.STEP);}HonroStory.tick(a,performance.now()+2000);a.updateHUD(true);}''');finish_story()
 def battle_shot(name):
  expected=page.evaluate('JSON.stringify(HonroApp.engine.b)')
  page.evaluate("()=>{const a=HonroApp,u=a.engine.active;Object.assign(a.scene,{manual:true,x:u.x,y:u.y-140,scale:.6,goalFocus:null,cinematic:null,storyTween:null});a.updateHUD(true);a.scene.render(a.engine,0,a.selected,a.power,false,0)}")
  page.wait_for_function('HonroAuthoredFarArt.ready(18)',timeout=90000)
  page.evaluate('HonroApp.scene.render(HonroApp.engine,0,HonroApp.selected,HonroApp.power,false,0)')
  assert page.evaluate('JSON.stringify(HonroApp.engine.b)')==expected
  page.screenshot(path=str(OUT/name),type='jpeg',quality=85)
 def get():return page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;return{active:b.active,cls:a.engine.active.cls,round:b.round,preference:b.playerTurnOrder,units:b.units.map(u=>({id:u.id,cls:u.cls,x:u.x,y:u.y,hp:u.hp,focus:u.focus,acted:u.acted,dead:u.dead}))}}''')
 # Unjoined characters must not be exposed by the new editor.
 load(json.loads((BASE/'two-profile.json').read_text()),3);camp();tap('player-order-open');text=page.locator('.player-turn-order').inner_text();assert '소단' not in text and '휘겸' not in text;assert '설오' in text and '담허' in text
 page.screenshot(path=str(OUT/'mobile-known-only.jpg'),type='jpeg',quality=85);tap('player-order-cancel')
 load(json.loads((BASE/'four-profile.json').read_text()),18);camp();cards_before=page.locator('.hero-tab').evaluate_all('(els)=>els.map(e=>e.dataset.class)');tap('player-order-open')
 for cls,count in [('occultist',3),('knight',2),('mage',1)]:
  for _ in range(count):tap('player-order-move',f'[data-class={cls}][data-direction="-1"]')
 draft=page.evaluate('HonroApp.playerTurnOrderDraft');assert draft==['occultist','knight','mage','archer'];assert page.locator('.player-turn-order').evaluate('(n)=>n.scrollWidth<=n.clientWidth+1')
 page.screenshot(path=str(OUT/'mobile-editor.jpg'),type='jpeg',quality=85);tap('player-order-save');assert page.evaluate('HonroApp.profile.playerTurnOrder')==draft;assert page.locator('.hero-tab').evaluate_all('(els)=>els.map(e=>e.dataset.class)')==cards_before
 page.reload();page.wait_for_function('window.HonroApp');assert page.evaluate('HonroApp.profile.playerTurnOrder')==draft;page.evaluate('async()=>{await HonroCampaignLoader.ensureStage(18);HonroApp.frame=()=>{};HonroApp.launch(18)}');page.wait_for_function('HonroApp.engine?.b.honroStage===18',timeout=90000);finish_story();ready();fresh=get();assert fresh['cls']=='occultist'
 battle_shot('fresh-selected-sodan.jpg')
 tap('defend');ready();assert get()['cls']=='knight';tap('select-hero','[data-id=p-archer]');assert get()['cls']=='archer';assert next(u for u in get()['units']if u['id']=='p-occultist')['acted']
 with page.expect_download() as download:page.evaluate('HonroApp.export()')
 exported=json.loads(Path(download.value.path()).read_text());saved=exported['honroBattle'];page.evaluate('HonroApp.persist()');page.reload();page.wait_for_function('window.HonroApp');page.evaluate('async()=>{await HonroCampaignLoader.ensureStage(18);HonroApp.frame=()=>{};HonroApp.continue()}');page.wait_for_function('HonroApp.engine?.b.honroStage===18',timeout=90000);actual=json.loads(page.evaluate('JSON.stringify(HonroApp.engine.b)'))
 if actual!=saved:(OUT/'continue-difference.json').write_text(json.dumps(dict(expected=saved,actual=actual)))
 assert actual==saved
 continued=get();assert continued['cls']=='archer';camp();tap('player-order-open');tap('player-order-move','[data-class=mage][data-direction="-1"]');tap('player-order-move','[data-class=mage][data-direction="-1"]');tap('player-order-save');assert page.evaluate('HonroApp.profile.playerTurnOrder[0]')=='mage'
 page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.engine?.b.honroStage===18');resumed=get();assert resumed['active']==continued['active'];assert resumed['units']==continued['units'];ready();tap('defend');ready();after=get();assert after['cls']=='mage';assert next(u for u in after['units']if u['id']=='p-occultist')['acted'];assert next(u for u in after['units']if u['id']=='p-archer')['acted']
 battle_shot('continued-next-mage.jpg')
 current=page.evaluate('''()=>{const a=HonroApp;return {profile:{...a.profile,honroBattle:JSON.parse(JSON.stringify(a.engine.b))}}}''');(OUT/'actual-window.json').write_text(json.dumps(current))
 assert not errors and not http,(errors,http)
 result=dict(checkedCommit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),entry=json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],mobileTouch=True,battleInspectionRenderPure=True,unjoinedNamesHidden=True,cardsBefore=cards_before,cardsUnchanged=True,savedAndReloaded=draft,fresh=fresh,wholeBattleContinueExact=True,manualAndSpentPreserved=resumed,afterOrderEditAndDefend=after,errors=errors,httpFailures=http,scope='Prior-clear entry fixtures; actual touch buttons, fresh18 entry and a few ordinary defend/select actions, export/reload/Continue. No18 full completion or physical mobile-device claim.')
 (OUT/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');browser.close()
print('PASS real mobile order editor/known-only/reload/fresh/manual/spent/Continue/new preference, cards unchanged')
