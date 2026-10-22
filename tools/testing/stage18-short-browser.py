"""Three focused views of actual short-quest input checkpoints, no combat replay.
The initial battle comes from the real entry record; later views use native exports.
Only frame scheduling/camera are inspection controls; no actor/quest writes.
"""
import copy,gzip,json,shutil,subprocess,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from story_browser_server import story_base_url
base=ROOT/'_local/reports/stage18-short-20261022/fresh-free-interaction'
out=ROOT/'_local/reports/stage18-short-20261022/browser';out.mkdir(parents=True,exist_ok=True)
def checkpoint(name,fixture):
 path=base/name
 return json.loads(path.read_text() if path.exists() else gzip.decompress((ROOT/'tests/fixtures/stage18-short-20261022'/fixture).read_bytes()))
first=checkpoint('initial.json','fresh-entry.json.gz')['initial'];entry=copy.deepcopy(first['profile']);entry['honroBattle']=first['battle']
cases=[('entry',entry,1180,757,3050,5350,.55),('lowering-warning',checkpoint('warning-continue.json','actual-warning-r3.json.gz')['profile'],1180,757,3650,5350,.45),('mobile-leak',checkpoint('late-continue.json','actual-leak-r8.json.gz')['profile'],390,844,6770,7050,.48)]
selected=sys.argv[1:]
if selected:cases=[v for v in cases if v[0] in selected]
rows=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for name,profile,width,height,x,y,scale in cases:
  page=browser.new_page(viewport={'width':width,'height':height});errors=[];http=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:http.append(r.url)if r.status>=400 else None)
  page.goto(story_base_url()+'/HONRO.html',wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=90000)
  page.evaluate('async()=>{await HonroCampaignLoader.ensureStage(18);HonroApp.frame=()=>{};}');page.wait_for_timeout(80)
  page.evaluate('p=>{const a=HonroApp;a.debugMode=false;a.profile=p;a.normalProfile=p;a.continue();}',profile)
  page.wait_for_function('HonroApp.engine?.b.honroStage===18',timeout=90000)
  actual=json.loads(page.evaluate('JSON.stringify(HonroApp.engine.b)'))
  expected_load=copy.deepcopy(profile['honroBattle'])
  if name=='entry':
   # In-memory entry record precedes the first export; Continue initializes this
   # empty diagnostic bucket. No actor, resource, goal or event fact differs.
   assert 'existingWarnings' not in expected_load['honroState']['encounterDensity']
   expected_load['honroState']['encounterDensity']['existingWarnings']={}
  assert actual==expected_load,'Continue difference '+name
  # Entry opening dialogue advances via normal dialogue buttons; no simulation tick.
  if name=='entry':
   for _ in range(70):
    if not page.evaluate('!!HonroApp.dialogue'):break
    page.locator('[data-action=dialogue-next]').click();page.wait_for_timeout(10)
  page.wait_for_function('HonroAuthoredFarArt.ready(18)',timeout=90000)
  if name=='entry':
   page.wait_for_timeout(1100);page.evaluate('HonroStory.tick(HonroApp,performance.now())')
  expected=page.evaluate('JSON.stringify(HonroApp.engine.b)')
  info=page.evaluate('''v=>{const a=HonroApp,b=a.engine.b;a.close();a.updateHUD(true);Object.assign(a.scene,{manual:true,x:v.x,y:v.y,scale:v.scale,goalFocus:null,cinematic:null,storyTween:null});a.scene.render(a.engine,0,'',.6,false,0);return {round:b.round,phase:b.phase,goal:HonroAct2.current(b)?.id,summary:HonroAct2.state(b).summary,guide:HonroObjectiveRevision.contentFor(b,a.stage).guide,heroes:a.engine.heroesAlive().map(u=>({id:u.id,hp:u.hp,x:u.x,y:u.y})),descent:HonroStage18Bell.memory(b).status}}''',dict(x=x,y=y,scale=scale))
  page.screenshot(path=str(out/(name+'.jpg')),type='jpeg',quality=85);assert(out/(name+'.jpg')).stat().st_size<1_000_000
  assert page.evaluate('JSON.stringify(HonroApp.engine.b)')==expected
  assert not errors and not http,(errors,http)
  rows.append(dict(name=name,viewport=[width,height],wholeBattleContinueExact=name!='entry',entryOnlyEmptyWarningBucket=name=='entry',renderPure=True,view=info));page.close()
 browser.close()
if selected and (out/'result.json').exists():
 rows=[v for v in json.loads((out/'result.json').read_text())['rows'] if v['name'] not in selected]+rows
(out/'result.json').write_text(json.dumps(dict(entry=json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],checkedCommit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),rows=rows,scope='Actual entry/R3/R8 checkpoints; frozen presentation inspection. No second combat run.'),ensure_ascii=False,indent=2)+'\n')
print('PASS actual entry/warning/mobile leak Continue, current goal and preserved gameplay; errors0')
