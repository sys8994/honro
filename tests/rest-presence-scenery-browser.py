"""Actual retained SVG/DOM, talk, journey-book and localStorage regression.
Profiles and prior evidence are explicit fixtures; no user save is read."""
import os,json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'_local/reports/rest-scenery-hotfix';OUT.mkdir(parents=True,exist_ok=True);BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8771')
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=browser.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroRestJourney');page.evaluate("""()=>{globalThis.restSceneBuilds=0;const build=HonroWorld.build;HonroWorld.build=function(...args){if(HonroApp.screen==='rest')restSceneBuilds++;return build.apply(this,args);};}""")
 def setup(n=24,evidence=False,version=2,dead=None,party=None):
  page.evaluate("""({n,evidence,version,dead,party})=>{const a=HonroApp;a.stopBattle();a.engine=null;a.close();a.debugMode=n>=25&&n<=28;a.debugRestStage=a.debugMode?n:null;const p=HonroProfileStore.fresh();p.revision=13;p.recruited=['archer','mage','knight','occultist'];p.party=party||[...p.recruited];for(let i=1;i<n;i++)p.cleared[i]={visits:1,rounds:3};for(const cls of p.recruited)HONRO_CORE.grantXP(p.heroes[cls],HONRO_CORE.xpAtLevel(16));p.honroJourney={version:1,restStageId:n,talked:{},newGrowth:{}};p.record=[{place:'fixture-history',text:'fixture retained record'}];p.honroAct23V4History={revision:1,stages:evidence?{22:{run:'fixture-real22',reviewedNarrative:{compared:{map:true}}},23:{run:'fixture-real23',reviewedNarrative:{proof:{safe:true,goods:{familyCrest:'family-three-petals'}}}},29:{run:'fixture-real29',reviewedNarrative:{proof:{trace:{mage:true}}}}}:{}};
  for(const key of Object.keys(p.honroAct23V4History.stages))if(+key>=n)delete p.honroAct23V4History.stages[key];
  // Previous faulty previews must not create or keep scene witnesses.
  p.honroReviewed24RestObservation={crest:true,sourceRun:'old-canvas'};p.honroReviewed23RestObservation={goods:true,sourceRun:'old-canvas'};p.honroReviewed30RestObservation={people:true,sourceRun:'old-canvas'};
  if(n>=25&&n<=28)p.honroSplitCampaign={version,stage:n,finished:false,vitals:dead?{[dead]:{hp:0,dead:true}}:{}};a.profile=p;globalThis.restKeep=JSON.stringify({heroes:p.heroes,record:p.record,cleared:p.cleared,history:p.honroAct23V4History,party:p.recruited});HonroRestJourney.showRest(a);}""",dict(n=n,evidence=evidence,version=version,dead=dead,party=party))
  page.wait_for_selector('.rest-background>svg');finish()
 def finish():
  for _ in range(40):
   if not page.evaluate('!!HonroApp.dialogue'):return
   page.keyboard.press('Enter')
  assert not page.evaluate('!!HonroApp.dialogue')
 def inspect(expected):
  assert page.locator('.rest-background>canvas').count()==0
  assert page.locator('.rest-background>svg[data-journey-art^="shared-"]').count()==1
  rows=page.evaluate("""()=>[...document.querySelectorAll('.rest-person')].map(n=>({cls:n.dataset.class,disabled:n.disabled,alpha:getComputedStyle(n).opacity,canvasAlpha:getComputedStyle(n.querySelector('canvas')).opacity}))""")
  assert [r['cls'] for r in rows]==expected,rows;assert all(r['alpha']=='1' and r['canvasAlpha']=='1' for r in rows),rows
  for c in ['archer','mage','knight','occultist']:
   if c not in expected:assert page.locator('[data-class="'+c+'"],canvas[data-rest-person="'+c+'"]').count()==0
  assert page.evaluate('restSceneBuilds')==0,'rest must never create a battle model'
  assert page.evaluate("""()=>{const p=HonroApp.profile;return JSON.stringify({heroes:p.heroes,record:p.record,cleared:p.cleared,history:p.honroAct23V4History,party:p.party})===restKeep;}"""),'normal progression or history mutated'
  return rows
 setup();rows=inspect(['archer','mage','knight','occultist']);assert all(r['disabled'] for r in rows);assert not page.evaluate('!!HonroApp.profile.honroAct23V4History.stages[24]');page.screenshot(path=str(OUT/'after-24-no-evidence-mobile.png'))
 page.reload();page.wait_for_function('!!globalThis.HonroApp');page.evaluate('globalThis.restSceneBuilds=0');page.locator('.title-actions .primary').click();page.wait_for_selector('.rest-background>svg');finish();assert page.locator('.rest-person').count()==4;assert page.locator('.rest-background>canvas').count()==0;page.screenshot(path=str(OUT/'after-24-continue-mobile.png'))
 setup(evidence=True);rows=inspect(['archer','mage','knight','occultist']);assert all(r['disabled'] for r in rows[:3]) and not rows[3]['disabled'],'only actual prior porter rescue unlocks Sodan; no mansion-crest witness';page.screenshot(path=str(OUT/'after-24-prior-evidence-mobile.png'))
 page.wait_for_function('performance.now()>=(HonroApp.journeyInputAfter||0)');page.locator('[data-action="journey-book"]').click();page.wait_for_selector('.journey-screen');page.wait_for_function('performance.now()>=(HonroApp.journeyInputAfter||0)');page.locator('[data-action="rest"]').click();page.wait_for_selector('.rest-background>svg');finish();inspect(['archer','mage','knight','occultist'])
 for n,team in [(25,['archer','mage']),(26,['knight','occultist']),(27,['archer','mage']),(28,['archer','mage','knight','occultist'])]:
  setup(n);inspect(team);page.screenshot(path=str(OUT/f'after-{n}-actual-roster-mobile.png'))
 for n,team in [(25,['mage','knight']),(26,['archer','occultist']),(27,['archer','mage','knight','occultist'])]:
  setup(n,version=1);inspect(team)
 setup(25,dead='archer');rows=inspect(['archer','mage']);assert rows[0]['disabled'];assert page.locator('.rest-archer small').text_content()=='전투불능';assert page.evaluate('HonroApp.profile.honroSplitCampaign.vitals.archer.hp')==0
 setup(24,party=['archer','mage']);inspect(['archer','mage','knight','occultist'])
 setup(23,True);rows=inspect(['archer','mage','knight','occultist']);assert not rows[1]['disabled'];assert rows[3]['disabled'];page.locator('.rest-mage').click();page.wait_for_function('!!HonroApp.dialogue');finish();inspect(['archer','mage','knight','occultist']);page.screenshot(path=str(OUT/'after-23-talk-rerender-mobile.png'))
 for n in [21,22,30]:
  setup(n,True);inspect(['archer','mage','knight','occultist']);assert page.locator('.rest-background filter[id^="honro-rest-overcast"]').count()==(0 if n==22 else 1);page.screenshot(path=str(OUT/f'after-{n}-original-art-mobile.png'))
 assert not errors,errors;(OUT/'result.json').write_text(json.dumps({'pageErrors':errors,'restBattleBuilds':0,'currentTeams':{'24':'all','25':'archer,mage','26':'knight,occultist','27':'archer,mage','28':'all'},'legacyTeams':'v1 retained','paths':['rest entry','talk rerender','journey book roundtrip','Continue reload','portrait mobile'],'limits':'Fixture profiles/prior proof only; original SVG and actual DOM/input/storage verified. No user save read or campaign combat claim.'},ensure_ascii=False,indent=2)+'\n');browser.close()
print('PASS actual retained SVG, opaque/absent/dead separate, v2/v1 split rosters, locked stale witnesses, talk/journal/Continue/mobile, no battle build; pageerror0')
