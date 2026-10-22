"""Actual Chromium report UI fixtures. Terminal victories are not normal fullplay."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch,serve_game,ROOT
OUT=ROOT/os.environ.get('HONRO_REPORT_OUT','game/docs/stage-clear-report/evidence/report');OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def check(name,ok,data=None):
 assert ok,(name,data)
 checks.append({'name':name,'data':data});print('PASS',name,flush=True)
def shot(p,name):
 target=OUT/(name+'.jpg');p.screenshot(path=str(target),type='jpeg',quality=82);assert target.stat().st_size<1000000
FINISH='for(let i=0;HonroApp.dialogue&&i<60;i++)HonroStory.finish(HonroApp)'
SETUP="""async(id)=>{const a=HonroApp,C=HONRO_CORE;await HonroCampaignLoader.ensureStage(id);if(a.debugMode)a.setDebugMode(false);a.stopBattle();a.close();a.profile.honroBattle=null;a.profile.honroGrowth={version:4,stages:{}};a.profile.honroSplitCampaign=null;a.profile.honroActEnding=null;a.profile.honroClearReports={};a.profile.honroJourney={};a.profile.honroFlags={};a.profile.seen={};a.profile.cleared={};for(let i=1;i<id;i++)a.profile.cleared[i]={visits:1,rounds:4};a.profile.recruited=id===1?['archer']:id===10?['archer','mage','knight']:['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];for(const cls of a.profile.recruited){a.profile.heroes[cls].xp=C.xpAtLevel(id===1?2:16)-10;C.sanitizeLoadout(a.profile,cls);}a.profile.settings.sound=false;a.profile.settings.music=false;a.launch(id);for(let i=0;a.dialogue&&i<60;i++)HonroStory.finish(a);const b=a.engine.b,u=b.units.find(HonroClearReport.hero),enemy=b.units.find(u=>u.side===1&&!u.honroObjectiveTarget&&!u.summoned);if(enemy){enemy.hp=40;enemy.maxHp=40;enemy.armor=0;enemy.shield=10;enemy.boss=undefined;enemy.honroNonlethal=false;enemy.existenceDefense={form:1,qi:1,soul:1};a.engine.hurt(enemy,1000,u.id,false,undefined,undefined,'salheun','A01');HonroProgression.flushContribution(a.engine);}HonroProgression.objective(b,'report-browser-goal',[{id:u.id,weight:1}],20);b.honroReport.seconds=127.5;b.round=7;b.phase='won';a.outcome(true);return b.honroReport.final;}"""
with sync_playwright() as pw,serve_game() as url:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},accept_downloads=True);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(url+'/HONRO.html');p.wait_for_function('window.HonroApp')
 for w,h in [(360,800),(390,844),(844,390),(1280,900)]:
  p.set_viewport_size({'width':w,'height':h});r=p.evaluate(SETUP,16);p.wait_for_selector('.clear-summary')
  check(f'focus1 {w}: four summary cells, four actual participants, actual XP level-up',p.locator('.clear-summary-grid>div').count()==4 and p.locator('[data-report-growth]').count()==4 and p.locator('.report-level-up').count()>0)
  box=p.locator('.dialog.result').bounding_box();nextbox=p.locator('[data-action=result-continue]').bounding_box()
  check(f'focus1 {w}: fixed Next and close fit',box['x']>=0 and box['y']>=0 and box['x']+box['width']<=w+1 and box['y']+box['height']<=h+1 and nextbox['y']>=0 and nextbox['y']+nextbox['height']<=h+1 and p.locator('.dialog>.close').is_visible() and p.locator('#turn-banner').evaluate('e=>getComputedStyle(e).visibility==="hidden"'))
  shot(p,f'focus1-summary-{w}x{h}')
  summary=p.locator('#modal').inner_html();profile=p.evaluate('JSON.stringify(HonroApp.profile)');report=p.evaluate('JSON.stringify(HonroApp.engine.b.honroReport.final)')
  p.locator('[data-action=clear-report]').click();p.wait_for_selector('.report-shell')
  check(f'focus2 {w}: dedicated responsive panel and true participant rows',p.locator('.dialog').count()==1 and p.locator('[data-report-hero]').count()==4 and p.locator('.report-close').evaluate('e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.top>=0&&r.bottom<=innerHeight}') and p.locator('.report-body').evaluate('e=>e.clientHeight>80&&e.scrollWidth<=e.clientWidth+1'))
  p.locator('.report-hero details summary').first.click();check(f'focus2 {w}: native skill expansion',p.locator('.report-hero details').first.get_attribute('open') is not None and p.locator('.report-skills').first.is_visible())
  shot(p,f'focus2-detail-skills-{w}x{h}')
  p.keyboard.press('Escape');check(f'focus3 {w}: Escape restores exact summary and immutable rewards',p.locator('#modal').inner_html()==summary and p.evaluate('JSON.stringify(HonroApp.profile)')==profile and p.evaluate('JSON.stringify(HonroApp.engine.b.honroReport.final)')==report)
  p.locator('[data-action=clear-report]').click();p.locator('.report-close').click();check(f'focus3 {w}: X returns without Next',p.evaluate('HonroApp.modalKind==="result"&&HonroApp.engine.b.honroStage===16'))
  p.locator('.result-body').evaluate('e=>e.scrollTop=e.scrollHeight');check(f'{w}: summary scroll never runs beneath X',p.locator('.result-body').evaluate('e=>e.getBoundingClientRect().top>=document.querySelector(".dialog>.close").getBoundingClientRect().bottom'));shot(p,f'holistic-summary-bottom-{w}x{h}')
 # Verify primary transition exactly once, then reopen the immutable journal record.
 p.locator('[data-action=result-continue]').dblclick(delay=55);p.wait_for_timeout(500);p.evaluate(FINISH)
 check('Next double click preserves one clear and does not skip a stage',p.evaluate('HonroApp.profile.cleared[16].visits===1&&!HonroApp.profile.cleared[17]'))
 p.evaluate('HonroApp.showRest()');p.evaluate(FINISH);p.evaluate('HonroApp.showMap();HonroRestJourney.showBook(HonroApp,16,null,2);HonroRestJourney.selectBook(HonroApp,16)')
 check('journal retains travel CTA alongside report access',p.locator('[data-action=journey-travel]').count()==1 and p.locator('[data-action=clear-report][data-id="16"]').count()==1)
 old=p.evaluate('JSON.stringify(HonroApp.profile.honroClearReports[16])');p.locator('[data-action=clear-report][data-id="16"]').click();p.locator('.report-close').click();check('journal report close returns to journal without reward changes',p.evaluate('HonroApp.screen==="journey"&&!HonroApp.modal.classList.contains("open")') and p.evaluate('JSON.stringify(HonroApp.profile.honroClearReports[16])')==old);shot(p,'holistic-journal-report-access')
 # All three existing endings remain four cuts -> title -> rest, including pending reload.
 p.set_viewport_size({'width':390,'height':844})
 for stage in [10,20,30]:
  p.evaluate(SETUP,stage);p.wait_for_selector('#act-ending');check(f'ending {stage}: report exists before presentation without result buttons',p.evaluate(f'!!HonroApp.profile.honroClearReports[{stage}]') and p.locator('#act-ending button').count()==0 and p.locator('#act-ending').get_attribute('data-cut')=='1')
  paid=p.evaluate(f'JSON.stringify(HonroApp.profile.honroClearReports[{stage}])')
  p.reload();p.wait_for_function('window.HonroApp');p.evaluate('HonroApp.continue()');p.wait_for_selector('#act-ending');check(f'ending {stage}: pending reload retains exact report',p.evaluate(f'JSON.stringify(HonroApp.profile.honroClearReports[{stage}])')==paid)
  with p.expect_download() as pending_export:p.evaluate('HonroApp.export()')
  export_path=OUT/f'ending-{stage}-pending-export.json';pending_export.value.save_as(str(export_path))
  p.locator('#file-import').set_input_files(str(export_path));p.wait_for_function('document.querySelector("#file-import").value===""');p.evaluate('HonroApp.continue()');p.wait_for_selector('#act-ending')
  check(f'ending {stage}: pending file import retains exact report',p.evaluate(f'JSON.stringify(HonroApp.profile.honroClearReports[{stage}])')==paid)
  for cut in range(5):p.evaluate('HonroApp.endingInputAfter=0;HonroActEndings.next(HonroApp)')
  p.evaluate(FINISH);p.wait_for_function('HonroApp.screen==="rest"');check(f'ending {stage}: unobtrusive rest access and existing camp/departure',p.locator('.rest-report').count()==1 and p.locator('[data-action=camp]').count()==1 and (stage==30 or p.locator('[data-action=journey-enter]').count()==1))
  shot(p,f'ending-{stage}-rest-report')
  p.locator('.rest-report').click();p.locator('.report-close').click();check(f'ending {stage}: report close stays in rest',p.evaluate('HonroApp.screen==="rest"&&HonroApp.engine===null'))
  p.reload();p.wait_for_function('window.HonroApp');p.evaluate('HonroApp.continue()');p.evaluate(FINISH);check(f'ending {stage}: seen reload never repays or reopens ending',p.locator('#act-ending').count()==0 and p.evaluate(f'JSON.stringify(HonroApp.profile.honroClearReports[{stage}])')==paid)
 check('no browser page errors',not errors,errors);b.close()
(OUT/'checks.json').write_text(json.dumps({'checks':checks,'errors':errors,'limits':['Terminal victories, XP/timing and unlocked-progress fixtures, not normal combat clears.','Desktop Chromium viewports, not physical-device/full-campaign evidence.']},ensure_ascii=False,indent=2))
