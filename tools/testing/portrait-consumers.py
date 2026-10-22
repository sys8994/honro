"""Approved image consumers: real Training/Camp/Dialogue, shared cache lifetime."""
import json,hashlib,subprocess,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
before='--before' in sys.argv;phase='before'if before else 'after';OUT=ROOT/'_local/reports/portrait-consumers';OUT.mkdir(exist_ok=True,parents=True);shots=OUT/phase;shots.mkdir(exist_ok=True)
profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text());checks=[];geometry=[]
def check(n,ok,detail=None):checks.append({'name':n,'passed':bool(ok),'detail':detail});assert ok,(n,detail);print('PASS',n,flush=True)
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw);c=b.new_context(viewport={'width':390,'height':844},has_touch=True);p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');p.goto(base+'/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady');held=[]
 if not before:p.route('**/portrait-*-base.*.webp',lambda r:held.append(r))
 p.evaluate('HonroApp.launch(1,true,"A01")');p.wait_for_function('HonroApp.training&&document.querySelector(".training-current")');p.evaluate('HonroTraining.open(HonroApp)');p.wait_for_timeout(200)
 if not before:
  p.wait_for_function('HonroPortraits.stats().pending===4');cold=p.evaluate('''()=>({stats:HonroPortraits.stats(),cards:[...document.querySelectorAll('.training-heroes canvas')].map(c=>c.dataset.portraitState),legacy:document.querySelectorAll('.training-heroes img').length,current:!!document.querySelector('.training-current canvas[data-portrait-framing="bust"]')})''');check('cold training cards use approved loading policy without vector flash',cold['stats']['vectorBuilds']==0 and cold['cards']==['loading']*4 and cold['legacy']==0 and cold['current'],cold)
  for route in held:route.continue_()
  p.unroute('**/portrait-*-base.*.webp');p.wait_for_function('HonroPortraits.stats().decodes===4&&HonroPortraits.stats().pending===0');p.wait_for_function('[...document.querySelectorAll(".training-heroes canvas")].every(c=>c.dataset.portraitState==="ready")')
 initial=p.evaluate('HonroPortraits.stats()')
 for w,h,label in [(390,844,'mobile'),(844,390,'landscape')]:
  p.set_viewport_size({'width':w,'height':h});p.evaluate('HonroTraining.open(HonroApp)');p.wait_for_timeout(220);p.screenshot(path=str(shots/(label+'-training.jpg')),type='jpeg',quality=93)
  g=p.evaluate('''()=>[...document.querySelectorAll('.training-heroes button')].map(e=>{const c=e.querySelector('canvas,img'),r=c.getBoundingClientRect();return {cls:e.dataset.value,box:[r.width,r.height],kind:c.tagName,state:c.dataset.portraitState,framing:c.dataset.portraitFraming};})''');geometry.append({'view':label,'cards':g})
  if not before:check(label+' 4 training cards share bust framing',len(g)==4 and all(x['kind']=='CANVAS'and x['state']=='ready'and x['framing']=='bust'for x in g),g)
  for cls in ['archer','mage','knight','occultist']:
   p.locator('[data-training-action="hero"][data-value="'+cls+'"]').tap()
  p.locator('[data-training-action="apply"]').tap();p.wait_for_timeout(120);p.screenshot(path=str(shots/(label+'-current.jpg')),type='jpeg',quality=92)
  if not before:check(label+' current hero uses approved bust',p.evaluate('document.querySelector(".training-current canvas")?.dataset.portraitState==="ready"&&document.querySelector(".training-current canvas").dataset.portraitFraming==="bust"'))
 if not before:
  cycles=p.evaluate('''()=>{const a=HonroApp,rows=[],start=HonroPortraits.stats();HonroTraining.open(a);const old=[...a.modal.querySelectorAll('.training-heroes canvas')];for(let i=0;i<12;i++){a.close();HonroTraining.open(a);rows.push(old.every((c,j)=>c===a.modal.querySelectorAll('.training-heroes canvas')[j]));}return {same:rows.every(Boolean),before:start,after:HonroPortraits.stats()};}''');check('12 training open/close cycles retain nodes and raster/decode cache',cycles['same'] and all(cycles['before'][k]==cycles['after'][k]for k in ['requests','decodes','paints']),cycles)
 p.evaluate('HonroApp.close();HonroApp.showCamp("mage")');p.wait_for_timeout(200)
 for w,h,label in [(390,844,'mobile'),(844,390,'landscape')]:
  p.set_viewport_size({'width':w,'height':h});p.wait_for_timeout(100);p.screenshot(path=str(shots/(label+'-camp.jpg')),type='jpeg',quality=92)
  if not before:check(label+' camp tabs/stat summary use approved busts',p.evaluate('''()=>{const c=[...document.querySelectorAll('.hero-tabs canvas,.summary-identity canvas')];return c.length===5&&c.every(c=>c.dataset.portraitState==='ready'&&c.dataset.portraitFraming==='bust');}'''))
 if not before:
  p.evaluate('HonroApp.launch(11)');p.wait_for_function('HonroApp.engine?.b.honroStage===11');p.evaluate('()=>{while(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroStory.start(HonroApp,[["담허",HONRO_CONTENT.hero.mage.desc||"담허"]],{title:HonroApp.stage.name});}')
  # Same requested portrait framing policy across canvas aspect ratios, HUD
  # explicitly remains icon purpose. Only test fixtures use the description.
  check('dialogue bust and small HUD icon purposes are explicit',p.evaluate('document.getElementById("story-portrait-canvas").dataset.portraitFraming==="bust"&&[...document.querySelectorAll("#hero-switches canvas")].every(c=>c.dataset.portraitFraming==="icon")'))
  end=p.evaluate('HonroPortraits.stats()');check('all surfaces reuse the same 4 image request/decode entries',end['requests']==end['decodes']==4 and end['imageEntries']==4 and end['waiters']==0,end)
 check('no browser exceptions',not errors,errors)
 if not before:
  fctx=b.new_context(viewport={'width':390,'height':844});f=fctx.new_page();f.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');f.route('**/portrait-hwigyeom-base.*.webp',lambda r:r.abort());f.goto(base+'/HONRO.html');f.wait_for_function('document.documentElement.dataset.honroReady');f.evaluate('HonroApp.launch(1,true,"A01")');f.wait_for_function('HonroApp.training&&document.querySelector(".training-current")');f.evaluate('HonroTraining.open(HonroApp)');f.wait_for_function('HonroPortraits.stats().errors===1&&HonroPortraits.stats().pending===0');failure=f.evaluate("""()=>{const a=HonroApp,before=HonroPortraits.stats();for(let i=0;i<12;i++){a.close();HonroTraining.open(a);}return {before,after:HonroPortraits.stats(),states:[...document.querySelectorAll('.training-heroes canvas')].map(c=>c.dataset.portraitState)};}""");check('failed training asset keeps bounded fallback across12 openings',failure['states'].count('error')==1 and all(failure['before'][k]==failure['after'][k]for k in ['requests','decodes','fallbackPaints','vectorBuilds']),failure);f.screenshot(path=str(shots/'mobile-training-fallback.jpg'),type='jpeg',quality=91);fctx.close()
 b.close()
if not before:
 old=json.loads((OUT/'before.json').read_text())
 for a,z in zip(old['geometry'],geometry):
  for x,y in zip(a['cards'],z['cards']):assert x['box']==y['box'],(x,y)
report={'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'geometry':geometry,'checks':checks,'errors':errors};(OUT/(phase+'.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2));print('DONE',phase,len(checks))
