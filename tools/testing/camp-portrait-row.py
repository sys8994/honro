"""Mobile camp four-column portrait row; no hero-order rules are changed."""
from pathlib import Path
import json,sys,subprocess,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
phase='before'if '--before'in sys.argv else 'after';OUT=ROOT/'_local/reports/camp-portrait-row';OUT.mkdir(parents=True,exist_ok=True);rows=[]
profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text())
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},has_touch=True);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');p.goto(base+'/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady');p.evaluate('HonroApp.showCamp("archer")');p.wait_for_function('HonroPortraits.stats().pending===0&&HonroPortraits.stats().decodes===4')
 for w,h in [(320,780),(360,780),(390,844),(844,390)]:
  p.set_viewport_size({'width':w,'height':h});p.wait_for_timeout(150);p.locator('.hero-tabs').screenshot(path=str(OUT/(phase+'-'+str(w)+'.png')))
  row=p.evaluate('''()=>{const n=document.querySelector('.hero-tabs'),nr=n.getBoundingClientRect(),rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};return {width:innerWidth,nav:rect(n),scroll:[n.scrollWidth,n.clientWidth],cards:[...n.querySelectorAll('.hero-tab')].map(c=>({cls:c.dataset.class,rect:rect(c),photo:c.querySelector('canvas')?rect(c.querySelector('canvas')):null,name:rect(c.querySelector('strong')),text:c.textContent,disabled:c.disabled,selected:c.getAttribute('aria-pressed')}))};}''');rows.append(row)
  if phase=='after':
   assert row['scroll'][0]<=row['scroll'][1] and len(row['cards'])==4,row
   assert max(c['rect']['y']for c in row['cards'])-min(c['rect']['y']for c in row['cards'])<1,row
   for c in row['cards']:assert c['rect']['x']>=0 and c['rect']['right']<=w and c['photo']['bottom']<=c['name']['y']+1,c
  for cls in ['mage','knight','occultist','archer']:
   p.locator('.hero-tab[data-class="'+cls+'"]').tap();assert p.evaluate('HonroApp.cls')==cls
 if phase=='after':
  p.evaluate('HonroApp.profile.recruited=["archer"];HonroApp.showCamp("archer")');p.set_viewport_size({'width':320,'height':780});p.wait_for_timeout(100);p.locator('.hero-tabs').screenshot(path=str(OUT/'after-unrecruited.png'));locked=p.evaluate('''()=>[...document.querySelectorAll('.hero-tab')].map(c=>({disabled:c.disabled,photo:!!c.querySelector('canvas'),name:c.querySelector('strong').textContent}))''');assert locked[0]['photo'] and all(c['disabled'] and not c['photo'] and c['name']=='미합류'for c in locked[1:]),locked
 assert not errors,errors;b.close()
(OUT/(phase+'.json')).write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'rows':rows,'errors':errors},ensure_ascii=False,indent=2));print('PASS',phase,'camp4 widths selection/unrecruited')
