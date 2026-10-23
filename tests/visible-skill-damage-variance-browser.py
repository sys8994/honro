"""Native clicks through shipped skill detail surfaces; no render/data-function probes."""
import json,os
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
PHASE=os.environ.get('HONRO_VARIANCE_PHASE','after')
DOCUMENT=os.environ.get('HONRO_VARIANCE_DOCUMENT','HONRO.html')
OUT=ROOT/f'_local/reports/visible-skill-variance/{PHASE}';OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def record(name,ok,data=None):
 assert ok,(name,data)
 checks.append({'name':name,'data':data});print('PASS',name,flush=True)
def story(p):
 for _ in range(100):
  button=p.locator('[data-action="dialogue-next"]:visible').first
  if not button.count():break
  button.click()
def snapshot(p,name,id,percent,container):
 root=p.locator(container);root.wait_for(state='visible')
 note=root.locator(f'[data-skill-damage-variance="{id}"]')
 if PHASE=='after' and percent:
  note.wait_for(state='visible');note.scroll_into_view_if_needed()
 data=root.evaluate('''(el)=>{const notes=[...el.querySelectorAll('[data-skill-damage-variance]')],r=el.getBoundingClientRect();return{content:el.innerText,notes:notes.map(n=>{const b=n.getBoundingClientRect(),s=getComputedStyle(n);return{id:n.dataset.skillDamageVariance,text:n.innerText,height:b.height,top:b.top,bottom:b.bottom,width:b.width,visible:s.visibility==='visible'&&s.display!=='none'&&b.width>0&&b.height>0&&b.top>=0&&b.bottom<=innerHeight,overflow:n.scrollWidth>n.clientWidth+1};}),html:el.outerHTML,viewport:{width:innerWidth,height:innerHeight},root:{top:r.top,bottom:r.bottom}}}''')
 if PHASE=='after' and percent:
  record(name,len(data['notes'])==1 and data['notes'][0]['id']==id and data['notes'][0]['text']==f'피해 수치는 평균 · 행동당 ±{percent}%' and data['notes'][0]['visible'] and not data['notes'][0]['overflow'],data)
 else:record(name,len(data['notes'])==0,data)
 p.screenshot(path=str(OUT/(name+'.png')))
 (OUT/(name+'.dom.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2))
with sync_playwright() as pw,serve_game() as url:
 b=launch(pw)
 for width,height in [(1280,900),(390,844)]:
  context=b.new_context(viewport={'width':width,'height':height});p=context.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(url+'/'+DOCUMENT);p.wait_for_function('window.HonroApp');p.locator('.title-actions [data-action="rest"]').click();p.wait_for_selector('.rest-screen');story(p)
  growth=p.evaluate('JSON.stringify([HonroApp.profile.heroes,HonroApp.profile.loadouts,HonroApp.profile.cleared,HonroApp.profile.honroBattle])')
  p.locator('.rest-fire[data-action="camp"]').click();p.wait_for_selector('.camp-screen')
  p.locator('[data-action="slot"][data-slot="0"]').click();snapshot(p,f'{width}-camp-A01','A01',5,'.talent-dialog');p.locator('.talent-dialog [data-action="close"]').click()
  p.locator('[data-action="talent"][data-skill="A14"]').first.click();snapshot(p,f'{width}-camp-A14','A14',5,'.talent-dialog');p.locator('.talent-dialog [data-action="close"]').click()
  record(f'{width}-camp-read-only',p.evaluate('JSON.stringify([HonroApp.profile.heroes,HonroApp.profile.loadouts,HonroApp.profile.cleared,HonroApp.profile.honroBattle])')==growth)
  p.locator('.camp-screen .top [data-action="rest"]').click();story(p);p.locator('[data-action="training"]').click();p.wait_for_selector('.training-dialog')
  snapshot(p,f'{width}-training-initial-A01','A01',5,'.training-detail')
  p.locator('[data-training-action="branch"][data-value="0"]').click();p.locator('[data-training-action="skill"][data-value="A14"]').click();snapshot(p,f'{width}-training-A14','A14',5,'.training-detail')
  p.locator('[data-training-action="branch"][data-value="2"]').click();p.locator('[data-training-action="skill"][data-value="A04"]').click();snapshot(p,f'{width}-training-A04','A04',10,'.training-detail')
  p.locator('[data-training-action="hero"][data-value="mage"]').click();p.locator('[data-training-action="branch"][data-value="0"]').click();p.locator('[data-training-action="skill"][data-value="M06"]').click();snapshot(p,f'{width}-training-M06','M06',15,'.training-detail')
  p.locator('[data-training-action="branch"][data-value="2"]').click();p.locator('[data-training-action="skill"][data-value="M10"]').click();snapshot(p,f'{width}-training-healing-M10','M10',0,'.training-detail')
  for cls,id,percent in [('mage','M01',10),('knight','S00',5),('occultist','O01',10)]:
   p.locator(f'[data-training-action="hero"][data-value="{cls}"]').click();p.locator('[data-training-action="branch"][data-value="-1"]').click();p.locator(f'[data-training-action="skill"][data-value="{id}"]').click();snapshot(p,f'{width}-training-basic-{id}',id,percent,'.training-detail')
  p.locator('[data-training-action="hero"][data-value="archer"]').click();p.locator('[data-training-action="branch"][data-value="0"]').click();p.locator('[data-training-action="skill"][data-value="A14"]').click();p.locator('[data-training-action="apply"]').click();p.wait_for_selector('.training-tools')
  p.locator('.training-tools [data-training-action="open"]').click();snapshot(p,f'{width}-battle-training-reopen-A14','A14',5,'.training-detail')
  p.locator('[data-training-action="branch"][data-value="-1"]').click();p.locator('[data-training-action="skill"][data-value="A01"]').click();snapshot(p,f'{width}-battle-training-reopen-A01','A01',5,'.training-detail')
  p.locator('[data-training-action="close"]').click();p.locator('[data-action="pause"]').click();p.locator('.pause-menu [data-action="rest"]').click();story(p);p.locator('[data-action="journey-enter"]').click();p.wait_for_selector('.battle-screen');story(p)
  p.locator('[data-action="combat-skill"][data-skill="A01"]').click()
  record(f'{width}-campaign-hud-is-selection-only',p.locator('.talent-dialog').count()==0 and p.locator('[data-action="training-info"]').count()==0 and p.locator('[data-action="combat-skill"][data-skill="A01"]').get_attribute('aria-pressed')=='true')
  record(f'{width}-no-pageerror',not errors,errors);context.close()
 b.close()
(OUT/'checks.json').write_text(json.dumps({'phase':PHASE,'document':DOCUMENT,'checks':checks,'limits':['Only shipped click controls open details. Normal campaign HUD intentionally selects a skill and has no detail opener; no UI path was invented.','Desktop Chromium viewports; not physical devices.']},ensure_ascii=False,indent=2))
