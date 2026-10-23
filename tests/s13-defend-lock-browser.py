"""Actual training UI inputs reproduce/check the S13 -> defend -> next-round lock."""
import json,os,time
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
MODE=os.environ.get('HONRO_S13_EXPECT','unlocked');OUT=ROOT/f'_local/reports/s13-defend-lock/{MODE}';OUT.mkdir(parents=True,exist_ok=True)
rows=[]
def state(p,name):
 s=p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active;return{phase:b.phase,side:b.side,round:b.round,active:b.active,skill:a.selected,name:HONRO_CORE.SKILLS.S13.name,follow:u.meleeFollow||null,origin:u.meleeFollowOrigin||null,action:u.meleeAction||null,x:u.x,y:u.y,vx:u.vx,vy:u.vy,angle:u.angle,moveLeft:u.moveLeft,maxMove:u.maxMove,focus:u.focus,hp:u.hp,shield:u.shield,acted:u.acted,grounded:e.grounded(u),canInput:a.canInput(),jumpDisabled:document.querySelector('#jump').disabled}}''');rows.append({'name':name,**s});return s
with sync_playwright() as pw,serve_game() as url:
 b=launch(pw);p=b.new_page(viewport={'width':1280,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(url+'/HONRO.html');p.wait_for_function('window.HonroApp');p.locator('.title-actions [data-action="rest"]').click();p.wait_for_selector('.rest-screen')
 for _ in range(60):
  n=p.locator('[data-action="dialogue-next"]:visible').first
  if not n.count():break
  n.click()
 p.locator('[data-action="training"]').click();p.wait_for_selector('.training-dialog');p.locator('[data-training-action="hero"][data-value="knight"]').click();p.locator('[data-training-action="branch"][data-value="1"]').click();p.locator('[data-training-action="skill"][data-value="S13"]').click();assert p.locator('.training-detail-name h3').inner_text()=='파진연격';p.locator('[data-training-action="apply"]').click()
 p.wait_for_function('HonroApp.canInput()');state(p,'before-S13')
 p.locator('[data-action="combat-skill"][data-skill="S13"]').click();p.keyboard.down('Space');p.wait_for_timeout(230);p.keyboard.up('Space')
 p.wait_for_function('HonroApp.engine.active.meleeFollow==="ready"&&HonroApp.canInput()',timeout=25000);state(p,'follow-ready');p.screenshot(path=str(OUT/'follow-ready.png'))
 p.locator('[data-action="defend"]').click();state(p,'defend-input');p.wait_for_function('HonroApp.engine.b.round>=2&&HonroApp.engine.b.side===0&&HonroApp.canInput()',timeout=45000);state(p,'next-turn');p.screenshot(path=str(OUT/'next-turn.png'))
 start=state(p,'before-move');p.keyboard.down('ArrowRight');p.wait_for_timeout(320);p.keyboard.up('ArrowRight');end=state(p,'after-move')
 locked=end['x']==start['x'] and end['moveLeft']>0 and end['follow']=='ready'
 assert locked==(MODE=='locked'),{'expected':MODE,'start':start,'end':end}
 if MODE!='locked':
  assert end['x']>start['x'] and end['follow'] is None and end['origin'] is None and not end['jumpDisabled']
  angle=end['angle'];p.keyboard.down('ArrowUp');p.wait_for_timeout(160);p.keyboard.up('ArrowUp');assert state(p,'after-aim')['angle']!=angle
  p.locator('#jump').click();p.wait_for_function('!HonroApp.engine.grounded(HonroApp.engine.active)',timeout=5000);state(p,'jump');p.wait_for_function('HonroApp.engine.grounded(HonroApp.engine.active)',timeout=10000)
  p.locator('[data-action="combat-skill"][data-skill="S13"]').click();p.keyboard.down('Space');p.wait_for_timeout(180);p.keyboard.up('Space');p.wait_for_function('HonroApp.engine.active.meleeFollow==="ready"&&HonroApp.canInput()',timeout=25000);state(p,'repeat-follow');p.locator('[data-action="defend"]').click();p.wait_for_function('HonroApp.engine.b.round>=3&&HonroApp.canInput()',timeout=45000);assert state(p,'repeat-next')['follow'] is None
 p.screenshot(path=str(OUT/'movement-result.png'));assert not errors,errors;b.close()
(OUT/'trace.json').write_text(json.dumps({'expected':MODE,'locked':locked,'rows':rows,'errors':errors,'scope':'Native UI in production training; no battle-state injection or direct Engine calls.'},ensure_ascii=False,indent=2));print(json.dumps({'expected':MODE,'locked':locked,'round':end['round'],'xBefore':start['x'],'xAfter':end['x'],'follow':end['follow'],'moveLeft':end['moveLeft'],'jumpDisabled':end['jumpDisabled'],'errors':errors},ensure_ascii=False))
