"""Normal input clears a party-body escort blockage from an actual R21 save.
The entry save is a disclosed fixture; no unit/terrain writes follow loading.
"""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
from stage21_source_preview import install_source_preview,source_preview_metadata
profile=json.loads((ROOT/'_local/reports/stage21-polish/body-block-save.json').read_text())
out=ROOT/'_local/reports/stage21-polish/body-feedback';out.mkdir(parents=True,exist_ok=True)
errors=[]
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw);page=browser.new_page(viewport={'width':390,'height':844});install_source_preview(page);page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp');page.evaluate('p=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',profile);page.reload();page.locator('[data-action="continue"]').click();page.wait_for_function('HonroApp.engine?.b?.honroStage===21&&HonroApp.canInput()')
 def state():return page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;return{round:b.round,city:HonroAct23V4City.memory(b),targets:HonroAct23V4.state(b).targets,units:b.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,move:u.moveLeft})),terrain:JSON.stringify(b.terrain)};}''')
 before=state();assert any(t['id']=='21-escort-route' for t in before['targets']),before['targets'];page.screenshot(path=str(out/'blocked.png'))
 for hero in ['p-archer','p-mage','p-occultist']:
  page.locator('[data-action="select-hero"][data-id="'+hero+'"]').click()
  for _ in range(28):
   s=page.evaluate('({x:HonroApp.engine.active.x,can:HonroApp.canInput(),move:HonroApp.engine.active.moveLeft})')
   if not s['can'] or s['x']<1800 or s['move']<20:break
   page.keyboard.down('ArrowLeft');page.wait_for_timeout(160);page.keyboard.up('ArrowLeft')
   if abs(page.evaluate('HonroApp.engine.active.x')-s['x'])<2:page.keyboard.press('Control')
 page.wait_for_timeout(4000);after=state();page.screenshot(path=str(out/'freed.png'));browser.close()
assert before['round']==after['round'] and before['terrain']==after['terrain']
assert after['city']['actors']['v4.gwakjin']['distance']>before['city']['actors']['v4.gwakjin']['distance']+100
assert after['city']['actors']['act3-resident']['safe']
assert after['targets'][0]['id']=='21-escort-clearance'
assert not any(t['id']=='21-escort-route' for t in after['targets'])
assert not errors,errors
(out/'result.json').write_text(json.dumps({'sourcePreview':source_preview_metadata(),'scope':__doc__,'before':before,'after':after,'errors':errors},ensure_ascii=False,indent=2))
print('PASS normal party movement frees actual escort blockage',after['city']['actors']['v4.gwakjin']['distance']-before['city']['actors']['v4.gwakjin']['distance'])
