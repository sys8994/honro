"""Combined production Chromium contracts; unlocked/terminal/growth states are explicit fixtures."""
import ast,json,hashlib,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'game/docs/feedback-integration-20261022/evidence/final-combined';OUT.mkdir(parents=True,exist_ok=True)
KEY='honro-first-act-profile-1';checks=[];errors=[]
report_ast=ast.parse((ROOT/'tests/stage-clear-report-browser.py').read_text())
SETUP=next(ast.literal_eval(n.value) for n in report_ast.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in n.targets))
def check(name,ok,data=None):
 assert ok,(name,data)
 checks.append({'name':name,'data':data});print('PASS',name,flush=True)
def shot(p,name):
 f=OUT/(name+'.jpg');p.screenshot(path=str(f),type='jpeg',quality=84);assert f.stat().st_size<1000000
with sync_playwright() as pw,serve_game() as base:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},has_touch=True);p.on('pageerror',lambda e:errors.append(str(e)));p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp')
 for w,h in [(390,844),(360,800),(844,390)]:
  p.set_viewport_size({'width':w,'height':h});r=p.evaluate(SETUP,16)
  check(f'{w} main XP matches final retained growth',p.evaluate('()=>{const a=HonroApp,r=a.engine.b.honroReport.final;return Object.entries(r.xp).every(([cls,x])=>x.last===a.engine.b.heroes[cls].xp&&x.last-x.before===x.combat+x.settlement+x.reunion+(x.recovered||0));}'))
  shot(p,f'focus1-summary-{w}x{h}')
  p.locator('[data-action=clear-report]').click();p.locator('.report-hero details summary').first.click();shot(p,f'focus1-detail-{w}x{h}');p.locator('.report-close').click()
  check(f'{w} summary detail close restores frozen rewards',p.evaluate('(r)=>JSON.stringify(HonroApp.engine.b.honroReport.final)===JSON.stringify(r)',r))
  # Supply an explicitly labeled historical-report fixture for each completed act.
  for stage in [10,20,30]:
   p.evaluate('''stage=>{const a=HonroApp;a.stopBattle();a.engine=null;a.close();a.profile.honroActEnding=null;for(let i=1;i<=stage;i++)a.profile.cleared[i]={visits:1,rounds:7};const report=structuredClone(a.profile.honroClearReports[16]);report.stage=stage;a.profile.honroClearReports[stage]=report;a.showMap();HonroRestJourney.showBook(a,stage,null,Math.ceil(stage/10));HonroRestJourney.selectBook(a,stage);a.persist();}''',stage)
   p.wait_for_function('document.querySelector(".journey-map-scroll")');p.wait_for_timeout(200)
   report=p.locator(f'[data-action=clear-report][data-id="{stage}"]');replay=p.locator(f'[data-action=act-ending-replay][data-id="{stage}"]')
   check(f'{w} act{stage//10} compact footer offers report and ending',report.count()==1 and replay.count()==1)
   geom=p.evaluate('''()=>{const s=x=>{const r=document.querySelector(x).getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}};return{head:s('.journey-heading'),foot:s('.journey-detail'),map:s('.journey-map-viewport'),screen:{w:innerWidth,h:innerHeight}}}''')
   check(f'{w} act{stage//10} map area and footer fit',geom['head']['h']<=60 and geom['foot']['h']<=100 and geom['map']['h']>=h-160,geom)
   check(f'{w} act{stage//10} curved progress routes',p.locator('.journey-progress path[data-from]').count()==9 and p.locator('.journey-progress path[data-from]').evaluate_all('xs=>xs.every(x=>/[CS]/.test(x.getAttribute("d")))'))
   p.locator('.journey-records>summary').click()
   if stage==10:
    controls=p.locator('.journey-record-menu button').evaluate_all('xs=>xs.map(x=>{const r=x.getBoundingClientRect();return{w:r.width,h:r.height}})')
    check(f'{w} record actions visible and touch accessible',report.is_visible() and replay.is_visible() and all(min(x.values())>=44 for x in controls),controls);shot(p,f'focus2-record-menu-{w}x{h}')
    p.keyboard.press('Escape');check(f'{w} Escape closes records and restores summary focus',p.locator('.journey-records').get_attribute('open') is None and p.locator('.journey-records>summary').evaluate('e=>e===document.activeElement'));p.locator('.journey-records>summary').click()
   report.click();p.locator('.report-close').click();check(f'{w} historical report closes to same journal',p.evaluate('(stage)=>HonroApp.screen==="journey"&&(Number(HonroApp.journeySelection)===stage||(stage===30&&HonroApp.journeySelection==="end"))',stage))
   if stage==10:
    p.evaluate('HonroRestJourney.fitBook(HonroApp)');shot(p,f'focus2-map-fit-{w}x{h}')
    p.evaluate('''()=>{const a=HonroApp,v=document.querySelector('.journey-map-scroll').getBoundingClientRect();HonroRestJourney.zoomBook(a,1.35,v.x+v.width/2,v.y+v.height/2);HonroRestJourney.revealBook(a);}''');shot(p,f'focus2-map-zoom-{w}x{h}')
   else:shot(p,f'focus2-map-act{stage//10}-{w}x{h}')
   before=p.evaluate('JSON.stringify(HonroApp.profile)');storage=p.evaluate(f'localStorage.getItem("{KEY}")')
   view=p.evaluate('''()=>{const a=HonroApp,v=document.querySelector('.journey-map-scroll');window.integratedMap=v;window.presentationCalls={finish:0,complete:0};if(!window.restoreReportFinish){window.restoreReportFinish=HonroClearReport.finish;window.restoreGrowthComplete=HonroProgression.complete;}HonroClearReport.finish=(...args)=>{presentationCalls.finish++;return restoreReportFinish(...args)};HonroProgression.complete=(...args)=>{presentationCalls.complete++;return restoreGrowthComplete(...args)};return{act:a.journeyAct,selection:a.journeySelection,zoom:a.journeyZoom,left:v.scrollLeft,top:v.scrollTop}}''')
   p.locator('.journey-records>summary').click();replay.click();p.wait_for_selector('#act-ending[data-mode=gallery]');p.wait_for_function('document.querySelector("#act-ending img").complete&&!document.querySelector("#act-ending img").hidden');shot(p,f'focus3-gallery-act{stage//10}-{w}x{h}')
   if stage==10:p.keyboard.press('Escape')
   elif stage==20:p.locator('[data-ending-return]').click()
   else:p.evaluate('for(let n=0;n<5;n++){HonroApp.endingInputAfter=0;HonroActEndings.next(HonroApp)}')
   p.wait_for_function('HonroApp.screen==="journey"');p.wait_for_timeout(180)
   restored=p.evaluate('''()=>{const a=HonroApp,v=document.querySelector('.journey-map-scroll');return{act:a.journeyAct,selection:a.journeySelection,zoom:a.journeyZoom,left:v.scrollLeft,top:v.scrollTop,same:v===integratedMap,calls:presentationCalls}}''')
   check(f'{w} act{stage//10} gallery never settles and preserves full profile/save',before==p.evaluate('JSON.stringify(HonroApp.profile)') and storage==p.evaluate(f'localStorage.getItem("{KEY}")') and restored['calls']=={'finish':0,'complete':0},restored)
   check(f'{w} act{stage//10} original selected view and DOM restored',restored['same'] and all(restored[k]==view[k] for k in view),{'before':view,'after':restored})
   p.evaluate('()=>{HonroClearReport.finish=restoreReportFinish;HonroProgression.complete=restoreGrowthComplete;}')
  # Separate holistic view after both auxiliary actions and every act return.
  shot(p,f'holistic-journal-return-{w}x{h}')
 check('no Chromium page exceptions',not errors,errors);version=b.version;b.close()
source=['shared/runtime/main.js','shared/runtime/rest-journey.js','shared/runtime/clear-report.js','shared/runtime/clear-report-ui.js','shared/runtime/act-endings.js','shared/runtime/sodan-withdrawal.js','game/src/journey.css','web/manifest.json']
(OUT/'checks.json').write_text(json.dumps({'executionSha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'browser':version,'checks':checks,'sourceHashes':{x:hashlib.sha256((ROOT/x).read_bytes()).hexdigest() for x in source},'limits':['Terminal victory and completed-act report records are fixtures, not fullplay.','Chromium viewport/touch emulation, not physical mobile.']},ensure_ascii=False,indent=2)+'\n')
