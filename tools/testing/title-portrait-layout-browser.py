"""Check CSS-only title placement against the fixed previous master stylesheet."""
import json,os,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch
from story_browser_server import story_base_url
from playwright.sync_api import sync_playwright
BASE='1ebd7985e21487329cc079102eeaa3bfd945da3b'
OUT=Path(os.environ.get('HONRO_TITLE_LAYOUT_OUT',str(ROOT/'game/docs/evidence/title-portrait-layout-2026-10-21')));OUT.mkdir(parents=True,exist_ok=True)
old_css=subprocess.check_output(['git','show',BASE+':game/src/title.css'],cwd=ROOT,text=True)
rows=[]
measure='''()=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right}},title=document.querySelector('.honro-title'),brand=title.querySelector('.title-brand'),img=title.querySelector('.title-painting img');return {logo:rect(brand),tagline:rect(title.querySelector('.title-tagline')),buttons:[...title.querySelectorAll('.title-actions>button')].map(e=>({...rect(e),text:e.textContent})),settings:rect(title.querySelector('[data-action=settings]')),footer:rect(title.querySelector('.footer')),background:{fit:getComputedStyle(img).objectFit,position:getComputedStyle(img).objectPosition,url:img.currentSrc},logoStyle:{filter:getComputedStyle(brand.querySelector('.title-hanja')).filter,color:getComputedStyle(brand).color}}}'''
def intersects(a,b):return a['x']<b['right'] and a['right']>b['x'] and a['y']<b['bottom'] and a['bottom']>b['y']
with sync_playwright() as p:
 browser=launch(p)
 # Make a valid saved battle with the current runtime; no private/local fixture.
 seed=browser.new_context();seed_page=seed.new_page();seed_page.goto(story_base_url()+'/HONRO.html');seed_page.wait_for_function('document.documentElement.dataset.honroReady');seed_page.evaluate('HonroApp.launch(1)');seed_page.wait_for_function('HonroApp.engine?.b.honroStage===1');seed_page.evaluate('HonroApp.persist()');save=seed_page.evaluate('JSON.parse(localStorage.getItem("honro-first-act-profile-1"))');assert save['honroBattle'];seed.close()
 for width,height in [(360,780),(390,844),(320,480),(360,640),(844,390),(1280,800)]:
  for kind in ['new','continue']:
   context=browser.new_context(viewport={'width':width,'height':height},is_mobile=width<900,has_touch=width<900);page=context.new_page();held=[];errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   if kind=='continue':page.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(save))+')')
   pattern=re.compile(r'/web/entries/game\.[^/]+\.js(?:\?|$)');page.route(pattern,lambda route:held.append(route));page.goto(story_base_url()+'/HONRO.html',wait_until='commit');page.wait_for_function("document.querySelector('[data-startup-title]')&&[...document.querySelectorAll('.title-painting img,.honro-logo')].every(i=>i.complete&&i.naturalWidth)")
   loading_logo=None
   for phase in ['loading','ready']:
    if phase=='ready':
     for route in held:route.continue_()
     page.unroute(pattern);page.wait_for_function('document.documentElement.dataset.honroReady')
    current=page.evaluate(measure);override=page.add_style_tag(content=old_css);previous=page.evaluate(measure);override.evaluate('(e)=>e.remove()')
    for box in [current['logo'],current['tagline'],current['settings'],*current['buttons']]:
     assert box['x']>=0 and box['y']>=0 and box['right']<=width+.1 and box['bottom']<=height+.1,(width,height,kind,phase,box)
    assert current['tagline']['y']>=current['logo']['bottom'],current
    assert min(b['y'] for b in current['buttons'])>=current['tagline']['bottom']+8,current
    assert max(b['bottom'] for b in current['buttons'])<current['footer']['y'],current
    for box in [current['logo'],current['tagline'],*current['buttons']]:assert not intersects(box,current['settings']),current
    assert current['logo']['w']==previous['logo']['w'] and current['logo']['h']==previous['logo']['h']
    assert current['background']==previous['background'] and current['logoStyle']==previous['logoStyle']
    if width<height:
     if height>650:assert abs(current['logo']['y']-height*.15)<1,current
     if phase=='loading':loading_logo=current['logo']
     else:assert current['logo']==loading_logo,'portrait logo must not jump when profile actions mount'
    else:
     for key in ['logo','tagline','buttons','settings']:assert current[key]==previous[key],('landscape changed',key,current,previous)
    if phase=='ready' and kind=='continue':assert len(current['buttons'])==2,current
    page.screenshot(path=str(OUT/f'{width}x{height}-{kind}-{phase}.png'));rows.append({'width':width,'height':height,'kind':kind,'phase':phase,'current':current,'baseline':previous})
   page.get_by_role('button',name='설정',exact=True).click();page.locator('#modal.open #setting-music').wait_for();page.locator('#modal.open button.close').click();assert not errors,errors;context.close()
 browser.close()
(OUT/'checks.json').write_text(json.dumps({'baseline':BASE,'mode':'local Chromium; runtime entry held for loading capture; original image assets untouched','rows':rows},ensure_ascii=False,indent=2));print('PASS',len(rows),'loading/ready layouts, asset presentation sizes, landscape parity, two saved buttons and settings access')
