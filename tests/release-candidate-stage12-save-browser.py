"""Browser Continue and export/import of migrated genuine chapter12 normal saves.
Frozen saved scenes are distinct from actual native input continuation; no combat replay.
"""
import json,hashlib,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'game/docs/stage-review/release-candidate-20261021/evidence/stage12-save-browser';OUT.mkdir(parents=True,exist_ok=True)
BASE=ROOT/'game/docs/stage-review/release-candidate-20261021/evidence/stage12-saves'
keys=['terrain','honroWorldTerrain','units','heroes','items','honroState','honroRouteChoice','honroCampaignMapRevision','honroLandmarks','honroElements']
rows=[];errors=[];failed=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:failed.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 def load(name):
  v=json.loads((BASE/(name+'-current.json')).read_text());p=v['profile'];p['honroBattle']=v['b']
  page.goto('http://127.0.0.1:8000/HONRO.html');page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
  page.evaluate('p=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',p)
  page.reload();page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
  page.evaluate('''()=>{HonroApp.frame=()=>{};HonroApp.profile.settings.music=false;HonroApp.profile.settings.sound=false;HonroApp.continue();}''')
  page.wait_for_function('HonroApp.engine?.b.honroStage===12',timeout=90000)
  actual=page.evaluate('(ks)=>Object.fromEntries(ks.map(k=>[k,HonroApp.engine.b[k]??null]))',keys)
  expected={k:v['b'].get(k) for k in keys}
  # Browser HUD observes encounter warnings; the native DOM double has no HUD.
  # Only this exact empty lazy field may be added, every other field is exact.
  expected['honroState']['encounterDensity'].setdefault('existingWarnings',{})
  if actual!=expected:
   (OUT/'failure-actual.json').write_text(json.dumps(actual));(OUT/'failure-expected.json').write_text(json.dumps(expected))
  assert actual==expected,(name,'Continue changed current snapshot')
  page.wait_for_function('HonroAuthoredFarArt.ready(12)',timeout=90000)
  return v
 def capture(name,x,y,zoom,width=1440,height=900):
  page.set_viewport_size({'width':width,'height':height})
  page.evaluate('''v=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);a.updateHUD(true);a.close();Object.assign(a.scene,{manual:true,x:v.x,y:v.y,scale:v.zoom,storyTween:null,cinematic:null,goalFocus:null});a.scene.render(a.engine,0,'',.6,false,0);}''',{'x':x,'y':y,'zoom':zoom})
  page.screenshot(path=str(OUT/(name+'.png')))
  if width==1440:page.screenshot(path=str(OUT/(name+'.q85.jpg')),type='jpeg',quality=85)
 for name,x,y,zoom in [('lower-initial',10000,2340,.6),('lower-sign-action',6520,4660,.65),('lower-gate-open',7150,5200,.55),('lower-terminal',8350,5800,.65),('upper-terminal',8910,4180,.65)]:
  v=load(name);capture(name,x,y,zoom);row={'name':name,'round':v['b']['round'],'phase':v['b']['phase'],'currentContinueExactAfterEmptyHUDWarningInitialization':True}
  if name=='lower-gate-open':
   before=page.evaluate('(ks)=>Object.fromEntries(ks.map(k=>[k,HonroApp.engine.b[k]??null]))',keys)
   with page.expect_download() as info:page.evaluate('HonroApp.export()')
   file=OUT/'actual-gate-export.json';info.value.save_as(str(file));page.locator('#file-import').set_input_files(str(file));page.wait_for_function('document.querySelector("#file-import").value===""');page.evaluate('HonroApp.continue()');page.wait_for_function('!!HonroApp.engine')
   assert page.evaluate('(ks)=>Object.fromEntries(ks.map(k=>[k,HonroApp.engine.b[k]??null]))',keys)==before
   row['browserDownloadFileInputAndContinueExact']=True;capture('gate-open-mobile',7150,5200,.55,390,844)
  if name.endswith('terminal'):
   route='A' if name.startswith('upper') else 'B'
   page.evaluate('''()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);a.outcome();while(a.dialogue)HonroStory.finish(a);if(!a.profile.cleared[12])throw Error('Actual checkpoint outcome failed');}''')
   paid=page.evaluate('JSON.stringify(HonroApp.profile)');page.evaluate('HonroApp.outcome()');assert paid==page.evaluate('JSON.stringify(HonroApp.profile)')
   page.locator('[data-action="result-continue"]').click();page.wait_for_function('HonroApp.screen==="rest"');page.evaluate('while(HonroApp.dialogue)HonroStory.finish(HonroApp)')
   page.locator('[data-action="journey-enter"][data-id="13"]').click();page.wait_for_function('HonroApp.engine?.b.honroStage===13',timeout=90000)
   assert page.evaluate('HonroApp.engine.b.honroEntryVariant.choice')==route;row.update({'rewardOnce':True,'nextStage':13,'entry':route})
  rows.append(row)
 result={'pass':True,'sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'rows':rows,'errors':errors,'httpFailures':failed,'scope':__doc__};(OUT/'trace.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));assert not errors and not failed;print('PASS actual current normal12 Continue, browser download/fileinput, won12 rewards once and both13 entries; pageerror/HTTPfail0');browser.close()
