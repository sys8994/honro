"""Official entry/save/outcome wiring fixtures, not a normal ten-chapter playthrough."""
import json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act4-official';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8772/HONRO.html');page.wait_for_function('!!window.HonroAct4Campaign',timeout=30000)
 print(page.evaluate('({enabled:HONRO_ACT4_RELEASE,chapters:HONRO_CONTENT.stages.length,loader:HonroCampaignLoader.catalog.length})'),flush=True)
 page.evaluate('''()=>{const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};for(let n=1;n<=30;n++)a.profile.cleared[n]={visits:1,rounds:1};a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];for(const cls of a.profile.recruited)a.profile.heroes[cls].xp=C.xpAtLevel(22);a.profile.lastStage=30;a.persist();}''')
 rows=[]
 for n in range(31,41):
  page.evaluate('n=>HonroCampaignLoader.ensureStage(n)',n)
  page.evaluate('n=>{HonroApp.launch(n);HonroApp.close();}',n)
  page.wait_for_timeout(150)
  row=page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b;for(let i=0;i<300;i++)e.tick(HONRO_CORE.STEP);a.scene.render(e,0,'',.5,false,0);return {stage:b.honroStage,official:b.honroAct4Official,custom:b.honroCustom,customContext:!!a.customMap,goal:a.stage.goal,growth:!!b.honroGrowth,finite:b.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.attack)),entry:b.honroAct4EntryProof||null};}''')
  assert row['stage']==n and row['official']==1 and row['custom']==False and not row['customContext'] and row['finite'],row
  page.evaluate('''()=>{const a=HonroApp;HonroProgression.syncRoster(a.profile,a.engine.b);a.profile.honroBattle=structuredClone(a.engine.b);a.persist();}''')
  saved=page.evaluate('HonroApp.engine.b.units.filter(u=>u.side===0).map(u=>[u.id,u.x,u.y,u.hp,u.focus])')
  page.evaluate('HonroApp.stopBattle();HonroApp.continue()');page.wait_for_timeout(80)
  assert page.evaluate('HonroApp.engine.b.honroStage')==n
  assert saved==page.evaluate('HonroApp.engine.b.units.filter(u=>u.side===0).map(u=>[u.id,u.x,u.y,u.hp,u.focus])')
  rows.append(row);print('PASS official',n,'native mount/finite budget/same-revision Continue',flush=True)
  page.evaluate('n=>{HonroApp.profile.cleared[n]={visits:1,rounds:1};HonroApp.profile.honroBattle=null;HonroApp.stopBattle();}',n)
 page.evaluate('HonroApp.showRest()');page.wait_for_timeout(120)
 assert page.locator('.rest-screen').count()==1
 assert page.locator('.rest-next').is_disabled()
 assert page.locator('#battlecanvas').count()==0
 page.evaluate('HonroApp.journey()') if page.evaluate('typeof HonroApp.journey')=='function' else page.evaluate('HonroRestJourney.showBook(HonroApp)')
 page.wait_for_timeout(200)
 assert page.locator('.journey-act-4').count()==1
 assert page.locator('.journey-pin').count()==10
 assert not errors,errors
 (OUT/'smoke.json').write_text(json.dumps({'scope':__doc__,'rows':rows,'errors':errors},ensure_ascii=False,indent=2));browser.close()
