"""Four approved faces across actual dialogue/training/camp surfaces.
Screenshot composition is evidence only; no portrait asset pixels are edited.
"""
import json,hashlib,subprocess,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
phase='before'if '--before'in sys.argv else 'after';OUT=ROOT/'_local/reports/hwigyeom-face-scale';OUT.mkdir(parents=True,exist_ok=True);shots=OUT/phase;shots.mkdir(exist_ok=True);rows=[]
profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text())
classes=['archer','mage','knight','occultist'];names=['설오','담허','휘겸','소단'];face={'archer':[340,240,650,535],'mage':[360,225,640,535],'knight':[430,310,745,555],'occultist':[430,225,715,510]}
def sample(p,selector,kind,view,cls):
 info=p.evaluate('''async({selector,cls})=>{const c=document.querySelector(selector),r=c.getBoundingClientRect(),v=HonroPortraits.draw(c,null,cls,{identity:HONRO_CONTENT.hero[cls].name,framing:c.dataset.portraitFraming}),bytes=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return {pixels:[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join(''),size:[r.width,r.height],crop:v.crop,head:v.head,framing:v.framing};}''',{'selector':selector,'cls':cls});info.update({'kind':kind,'view':view,'cls':cls});rows.append(info)
 if phase=='after' and cls=='knight' and info['framing']=='bust':
  x1,y1,x2,y2=face[cls];c=info['crop'];assert c['x']<=x1 and c['x']+c['width']>=x2 and c['y']<=y1 and c['y']+c['height']>=y2,info
 return info
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},has_touch=True);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');p.goto(base+'/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady');p.evaluate('HonroApp.launch(1,true,"A01")');p.wait_for_function('HonroApp.training');p.evaluate('HonroTraining.open(HonroApp)');p.wait_for_function('HonroPortraits.stats().decodes===4&&HonroPortraits.stats().pending===0')
 for w,h,view in [(390,844,'mobile'),(844,390,'landscape')]:
  p.set_viewport_size({'width':w,'height':h});p.evaluate('HonroTraining.open(HonroApp)');p.wait_for_timeout(180)
  p.locator('.training-heroes').screenshot(path=str(shots/(view+'-training-cards.png')))
  for cls in classes:sample(p,'.training-heroes [data-value="'+cls+'"] canvas','card',view,cls)
  for cls in classes:
   p.evaluate('HonroTraining.open(HonroApp)');p.locator('[data-training-action="hero"][data-value="'+cls+'"]').tap();p.locator('[data-training-action="apply"]').tap();p.wait_for_timeout(90);sample(p,'.training-current canvas','toolbar',view,cls);p.locator('.training-tools').screenshot(path=str(shots/(view+'-toolbar-'+cls+'.png')))
 for w,h,view in [(390,844,'mobile'),(844,390,'landscape')]:
  p.set_viewport_size({'width':w,'height':h})
  for cls in classes:
   p.evaluate('cls=>HonroApp.showCamp(cls)',cls);p.wait_for_timeout(100);sample(p,'.summary-identity canvas','summary',view,cls);p.locator('.hero-summary').screenshot(path=str(shots/(view+'-summary-'+cls+'.png')))
  p.locator('.hero-tabs').screenshot(path=str(shots/(view+'-camp-tabs.png')))
  for cls in classes:sample(p,'.hero-tab[data-class="'+cls+'"] canvas','tab',view,cls)
 p.evaluate('HonroApp.launch(11)');p.wait_for_function('HonroApp.engine?.b.honroStage===11');p.evaluate('()=>{while(HonroApp.dialogue)HonroStory.finish(HonroApp);const lines=s=>[...(s.story||[]),...Object.values(s.beats||{}).flat(),...(s.outro||[])];window.faceReview={};for(const name of ["설오","담허","휘겸","소단"])faceReview[name]=[...lines(HonroApp.stage),...HONRO_CONTENT.stages.flatMap(lines)].find(l=>l[0]===name).slice(0,2);}')
 for w,h,view in [(390,844,'mobile'),(844,390,'landscape')]:
  p.set_viewport_size({'width':w,'height':h})
  for cls,name in zip(classes,names):
   p.evaluate('name=>HonroStory.start(HonroApp,[faceReview[name],faceReview[name]],{title:HonroApp.stage.name})',name);p.wait_for_timeout(230);sample(p,'#story-portrait-canvas','dialogue',view,cls);p.locator('.story-scene').screenshot(path=str(shots/(view+'-dialogue-'+cls+'.png')))
  for cls,name in zip(classes,names):sample(p,'#hero-switches [data-portrait-host="'+cls+'"] canvas','hud',view,cls)
 stats=p.evaluate('HonroPortraits.stats()');assert stats['requests']==stats['decodes']==4 and stats['waiters']==0,stats;assert not errors,errors;b.close()
report={'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'rows':rows,'stats':stats,'errors':errors}
if phase=='after':
 old=json.loads((OUT/'before.json').read_text());changed=[]
 for x,y in zip(old['rows'],rows):
  assert (x['kind'],x['view'],x['cls'])==(y['kind'],y['view'],y['cls']);assert all(abs(a-b)<.01 for a,b in zip(x['size'],y['size'])),(x,y)
  if y['cls']=='knight' and y['kind']!='hud':assert x['pixels']!=y['pixels'];changed.append([y['kind'],y['view']])
  else:assert x['pixels']==y['pixels'],(x,y)
 report['comparison']={'onlyHwigyeomBustPixelsChanged':changed,'allOther3AndHUDExact':True,'allSizesPreserved':True}
(OUT/(phase+'.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS',phase,len(rows),'surfaces, shared4 requests/decode')
