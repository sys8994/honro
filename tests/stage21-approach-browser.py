"""Same initial profile/seed, before/after map fixtures; actual keyboard movement.
Prediction comparisons are read-only diagnostics, not damage/combat completion.
"""
import json,time,os
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
from stage21_source_preview import install_source_preview,source_preview_metadata
out=ROOT/os.environ.get('HONRO_STAGE21_APPROACH_OUT','_local/reports/stage21-approach/browser');out.mkdir(parents=True,exist_ok=True)
rows=[];errors=[]
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw)
 for version in os.environ.get('HONRO_STAGE21_APPROACH_VERSIONS','before,after').split(','):
  entry=json.loads((ROOT/f'_local/reports/stage21-approach/{version}-entry.json').read_text())
  for route in ['ground','roof']:
   page=browser.new_page(viewport={'width':1280,'height':800});install_source_preview(page);page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp');page.evaluate('p=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',{**entry['profile'],'honroBattle':entry['initial']});page.reload();page.locator('[data-action="continue"]').click();page.wait_for_function('HonroApp.engine?.b?.honroStage===21')
   def state():return page.evaluate('''()=>{const a=HonroApp,e=a.engine,u=e.active;return{x:u.x,y:u.y,move:u.moveLeft,ground:e.grounded(u),can:a.canInput(),dialogue:!!a.dialogue,round:e.b.round,hp:u.hp};}''')
   for _ in range(150):
    s=state()
    if s['dialogue']:page.keyboard.press('Enter')
    elif s['can'] and s['ground']:break
    page.wait_for_timeout(150)
   start=state();travel=[]
   def walk(goal,limit=70):
    for _ in range(limit):
     s=state();travel.append(s)
     if not s['can'] or s['move']<10 or abs(s['x']-goal)<12:break
     key='ArrowRight' if s['x']<goal else 'ArrowLeft';page.keyboard.down(key);page.wait_for_timeout(min(100,max(15,abs(s['x']-goal)/1.1)));page.keyboard.up(key)
   walk(1200)
   if route=='roof':
    page.keyboard.press('Control');walk(1260);page.wait_for_timeout(900)
    page.keyboard.press('Control');walk(1410);page.wait_for_timeout(900);walk(1650);page.wait_for_timeout(400)
   else:walk(1410);page.wait_for_timeout(400)
   end=state()
   shots=page.evaluate('''()=>{const e=HonroApp.engine,b=e.b,u=e.active,C=HONRO_CORE,t=e.unit('v4.gate-cart'),before=JSON.stringify(b),hits=[];for(const id of u.loadout){const skill=C.SKILLS[id];if(!skill.damage)continue;for(const angle of [-60,-45,-30,-15,10,25,40,55,70,85])for(const power of [.2,.4,.6,.8,1]){const v=C.shotViable(e,u,skill,t,angle,power);if(v.ok&&v.risk<1&&(v.hit?.unit===t.id||e.damageDistance(t,v.hit)<e.effective(skill,u).radius))hits.push({id,angle,power,net:v.net});}}if(before!==JSON.stringify(b))throw Error('prediction wrote battle');return hits;}''')
   page.screenshot(path=str(out/f'{version}-{route}-desktop.png'))
   if route=='ground':
    page.evaluate('''()=>{const a=HonroApp,s=a.scene;s.manual=true;s.x=2050;s.y=2680;s.scale=.65;s.storyTween=null;s.cinematic=null;s.goalFocus=null;s.render(a.engine,0,a.selected,.6,false,0,true);}''');page.screenshot(path=str(out/f'{version}-overview.png'))
   if version=='after':
    page.set_viewport_size({'width':360,'height':800});page.wait_for_timeout(300);page.screenshot(path=str(out/f'{version}-{route}-mobile.png'))
   rows.append({'version':version,'route':route,'start':start,'end':end,'travel':travel,'viableCartShots':shots});print(version,route,end,'shots',len(shots),flush=True);page.close()
 browser.close()
(out/'result.json').write_text(json.dumps({'scope':__doc__,'sourcePreview':source_preview_metadata(),'rows':rows,'errors':errors},ensure_ascii=False,indent=2))
assert not errors,errors
assert all(r['end']['round']==1 for r in rows)
print('PASS actual movement before/after comparison')
