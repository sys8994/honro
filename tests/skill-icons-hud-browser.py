"""Final HUD art captures use the production training character/skill selector."""
import json
from playwright.sync_api import sync_playwright
from browser_support import launch,ROOT,serve_game
OUT=ROOT/'game/docs/skill-icons-v1/integration/evidence'
rows=[];errors=[]
with sync_playwright() as pw,serve_game() as base:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate("HonroApp.profile.settings.music=false;HonroApp.profile.settings.sound=false;HonroApp.startTraining()")
 p.wait_for_selector('.training-dialog');p.evaluate('HonroApp.close()')
 for cls,ids in [('archer',['A01','A08','A14','A09']),('knight',['S00','S11','S13','S03']),('mage',['M01','M05','M04','M14']),('occultist',['O01','O14','O13','O16'])]:
  p.evaluate('HonroTraining.open(HonroApp)')
  p.locator(f'[data-training-action=hero][data-value={cls}]').tap()
  branch=p.evaluate('(id)=>HONRO_CORE.TALENT_MAP[id].branch',ids[1])
  p.locator(f'[data-training-action=branch][data-value="{branch}"]').tap()
  p.locator(f'[data-training-action=skill][data-value={ids[1]}]').tap()
  p.locator('[data-training-action=apply]').tap()
  assert p.evaluate('HonroApp.engine.active.cls')==cls
  assert p.evaluate('HonroApp.trainingClass')==cls
  for w,h in [(360,800),(390,844),(844,390),(1280,900)]:
   p.set_viewport_size({'width':w,'height':h})
   for state in ['selected','unavailable']:
    p.evaluate("opts=>{const a=HonroApp,u=a.engine.active;u.loadout=opts.ids;u.ranks={...u.ranks,...Object.fromEntries(opts.ids.map(id=>[id,1]))};u.focus=opts.state==='selected'?u.maxFocus:0;u.cooldowns={};a.selected=opts.ids[1];a.updateHUD(true)}",{'ids':ids,'state':state})
    p.wait_for_function("()=>HonroSkillImages.status().active===0&&HonroSkillImages.status().queued===0")
    p.wait_for_function("()=>[...document.querySelectorAll('#combat-skills .skill-art')].every(e=>e.dataset.imageState==='ready')")
    p.wait_for_timeout(100)
    for id in ids:assert p.locator(f'#combat-skills [data-skill-icon={id}] img').is_visible()
    assert p.locator(f'#combat-skills [data-skill={ids[1]}]').get_attribute('aria-pressed')=='true'
    g=p.locator('#combat-skills .skill-button').evaluate_all("es=>es.map(e=>{const r=e.getBoundingClientRect(),i=e.querySelector('.skill-art').getBoundingClientRect();return {width:r.width,height:r.height,art:[i.width,i.height],inside:i.top>=r.top&&i.bottom<=r.bottom,opacity:getComputedStyle(e).opacity}})")
    assert all(x['width']>=44 and x['height']>=44 and min(x['art'])>=32 and max(x['art'])<=36 and x['inside'] and x['opacity']=='1' for x in g)
    name=f'hud-{cls}-{w}-{state}.jpg';p.screenshot(path=str(OUT/name),type='jpeg',quality=85)
    rows.append({'file':name,'class':cls,'actualTrainingSelection':True,'state':state,'size':[w,h],'geometry':g})
 assert not errors
 (OUT/'hud-final-results.json').write_text(json.dumps({'browser':b.version,'rows':rows,'pageErrors':errors},ensure_ascii=False,indent=2)+'\n');b.close()
print('PASS final HUD: actual training selector, 4 classes x 4 sizes x selected/unavailable, 32-36px art, >=44px controls, no exceptions')
