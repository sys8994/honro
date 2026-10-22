"""Old opened release -> deployment switch -> 12 result -> retry ->13.
Stage12 terminal state is a fixture, not a claimed combat playthrough.
"""
import json,threading,hashlib,subprocess,tarfile,io
from pathlib import Path
from urllib.parse import unquote,urlsplit
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/stage12-next-load-hotfix';OUT.mkdir(parents=True,exist_ok=True)
OLD=OUT/'old934';KEY='honro-first-act-profile-1'
OLD_SHA='934fcabd74767d662aee3830585ba807234934cc'
BROKEN_SHA='c5b51319ef887943726434d84db596f07254bbd3'
OLD.mkdir(parents=True,exist_ok=True)
archive=subprocess.check_output(['git','archive',OLD_SHA,'HONRO.html','web'],cwd=ROOT)
with tarfile.open(fileobj=io.BytesIO(archive)) as bundle:bundle.extractall(OLD,filter='data')
if not (OLD/'assets').exists():(OLD/'assets').symlink_to(ROOT/'assets',target_is_directory=True)
old_manifest=json.loads((OLD/'web/manifest.json').read_text())
broken_paths=set(subprocess.check_output(['git','ls-tree','-r','--name-only',BROKEN_SHA,'web'],cwd=ROOT,text=True).splitlines())
missing={f['path'] for f in old_manifest['files'] if f['path'] not in broken_paths};mode={'value':'old'};http=[]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(OLD if mode['value']=='old' else ROOT),**kwargs)
 def log_message(self,*args):pass
 def do_GET(self):
  path=unquote(urlsplit(self.path).path).lstrip('/')
  if mode['value']=='broken' and path in missing:self.send_error(404);http.append({'mode':'broken','path':path,'status':404});return
  super().do_GET()
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}'
SETUP=r'''async choice=>{await HonroCampaignLoader.ensureStage(12);const a=HonroApp;a.close();a.stopBattle();a.debugMode=false;a.customMap=null;a.training=false;const p=HONRO_TOOLS.fresh();for(let i=1;i<12;i++)p.cleared[i]={visits:1,rounds:5};p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(const c of p.recruited)p.heroes[c].xp=HONRO_CORE.xpAtLevel(16);p.settings.music=false;p.settings.sound=false;a.profile=p;a.normalProfile=p;a.audio.configure(p.settings);a.launch(12);while(a.dialogue)HonroStory.finish(a);a.close();a.turnNotice=null;const b=a.engine.b;b.phase='won';b.round=8;b.honroRouteChoice={revision:1,selectedRoute:choice,sourceRun:b.session,fromStage:12,toStage:13,round:8};a.outcome();for(let n=0;a.dialogue&&n<40;n++)HonroStory.finish(a);return {profile:JSON.parse(localStorage.getItem('honro-first-act-profile-1')),heroes:JSON.stringify(a.profile.heroes),cleared:JSON.stringify(a.profile.cleared),record:JSON.stringify(a.profile.record),report:JSON.stringify(a.profile.honroClearReports?.[12]),attempt:b.honroReport.final.attempt};}'''
rows=[];errors=[]
def finish(page):page.evaluate('for(let i=0;HonroApp.dialogue&&i<40;i++)HonroStory.finish(HonroApp)')
def arrived(page,choice,before):
 page.wait_for_function('HonroApp.screen==="rest"&&HonroApp.profile.honroJourney?.stageId===13');assert page.evaluate('HonroApp.profile.heroes&&JSON.stringify(HonroApp.profile.heroes)')==before['heroes']
 assert page.evaluate('JSON.stringify(HonroApp.profile.cleared)')==before['cleared'];assert page.evaluate('JSON.stringify(HonroApp.profile.honroClearReports?.[12])')==before['report'];assert page.evaluate('HonroApp.profile.cleared[12].visits')==1
 assert page.evaluate('JSON.stringify(HonroApp.profile.record)')==before['record']
 assert page.evaluate('HonroApp.profile.honroRouteHandoff.choice')==choice
 finish(page);page.locator('[data-action="journey-enter"][data-id="13"]').click();page.wait_for_function('HonroApp.engine?.b.honroStage===13');assert page.evaluate('HonroApp.engine.b.honroEntryVariant.choice')==choice
 return page.evaluate('({stage:HonroApp.engine.b.honroStage,route:HonroApp.engine.b.honroEntryVariant.choice,screen:HonroApp.screen,visits:HonroApp.profile.cleared[12].visits})')
try:
 with sync_playwright() as p:
  browser=launch(p)
  for choice in ['A','B']:
   mode['value']='old';ctx=browser.new_context(viewport={'width':390,'height':844});page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady');page.locator('.title-actions button').first.click();before=page.evaluate(SETUP,choice);assert not page.evaluate('HonroCampaignLoader.has(13)')
   page.locator('[data-action="result-continue"]').wait_for();mode['value']='broken';page.locator('[data-action="result-continue"]').click();page.get_by_text('다시 시도',exact=True).wait_for();assert page.evaluate('HonroApp.screen')=='battle';assert page.evaluate('JSON.stringify(HonroApp.profile.heroes)')==before['heroes'];assert page.evaluate('JSON.stringify(HonroApp.profile.cleared)')==before['cleared']
   page.get_by_text('다시 시도',exact=True).click();page.get_by_text('다시 시도',exact=True).wait_for();assert page.evaluate('JSON.stringify(HonroApp.profile.honroClearReports?.[12])')==before['report']
   mode['value']='fixed';page.get_by_text('다시 시도',exact=True).click();result=arrived(page,choice,before);print('PASS old client retry',choice,flush=True);rows.append({'case':'opened-old-retry','route':choice,'result':result,'attempt':before['attempt'],'project':old_manifest['project']});page.screenshot(path=str(OUT/f'old-client-route-{choice}.jpg'),type='jpeg',quality=82)
   # Already-completed old save opens in current release; no replay or re-award.
   saved=before['profile'];ctx.close();ctx=browser.new_context(viewport={'width':390,'height':844});ctx.add_init_script('localStorage.setItem('+json.dumps(KEY)+','+json.dumps(json.dumps(saved,ensure_ascii=False))+')');page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady');page.evaluate('HonroApp.continue()');result=arrived(page,choice,before);print('PASS completed save Continue',choice,flush=True);rows.append({'case':'completed-save-current-Continue','route':choice,'result':result,'project':json.loads((ROOT/'web/manifest.json').read_text())['project']});ctx.close()
  assert any('chapter-13.516170b245a8b075.json' in r['path'] for r in http);assert any('chapter-13-assets.1387b6a1f088fc74.json' in r['path'] for r in http);assert not errors,errors;browser.close()
finally:server.shutdown();server.server_close()
report={'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'cases':rows,'simulatedMissingResponses':http,'errors':errors,'limits':['Local server switches release trees; missing responses reproduce c5 Git absence. Public GET blocked by environment proxy, not claimed as observed public404.','Terminal stage12 outcome fixture; no full combat clear.']}
(OUT/'browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'cases':rows,'simulated404s':len(http),'errors':errors},ensure_ascii=False))
