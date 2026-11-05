"""Interactive real-UI Stage5 observer: portable normal profile, output directory.
Prior-chapter reward fixtures are not prior browser play. Resume profiles must be
actual exported observations. Battle access is read-only; inputs use the UI.
"""
import sys,json,time
from pathlib import Path
from browser_support import ROOT,launch,serve_game
from playwright.sync_api import sync_playwright
out=Path(sys.argv[2]).resolve();out.mkdir(parents=True,exist_ok=True)
seed=json.loads(Path(sys.argv[1]).read_text());assert not seed.get('settings',{}).get('debugMode')
mobile='--mobile' in sys.argv
trace={'scope':'Real Chromium UI. Entry profiles are prior-chapter reward fixtures, not prior browser play; resume profiles are observed exports. No battle state writes.','seed':seed,'profileSource':str(Path(sys.argv[1]).resolve()),'resumed':bool(seed.get('honroBattle')),'commands':[],'dialogue':[],'errors':[]}
STATE='''()=>{const a=HonroApp,e=a.engine,b=e?.b;return {screen:a.screen,dialogue:a.dialogue?.id,canInput:a.canInput(),selected:a.selected,round:b?.round,phase:b?.phase,active:b?.active,ritual:b?.honroState?.ritual,shot:b?.shot,cleared:a.profile.cleared[5],heroes:b?.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,move:u.moveLeft,ground:e.grounded(u),angle:u.angle,facing:u.facing,loadout:u.loadout})),foes:b?.units.filter(u=>u.side===1&&!u.dead).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,objective:!!u.honroObjectiveTarget})),error:a.lastError}}'''
with serve_game() as base,sync_playwright() as p:
 browser=launch(p);ctx=browser.new_context(viewport={'width':390 if mobile else 1440,'height':844 if mobile else 900},has_touch=True,is_mobile=mobile,accept_downloads=True);page=ctx.new_page();page.on('pageerror',lambda e:trace['errors'].append(str(e)));cdp=ctx.new_cdp_session(page)
 page.add_init_script('if(!sessionStorage.getItem("seeded")){localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(seed))+');sessionStorage.setItem("seeded","1");}')
 page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp');page.evaluate('async()=>await HONRO_APP_READY')
 def touch_start(x,y):cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
 def touch_end():cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 def hold(key,ms,amount=.42):
  if not mobile:
   page.keyboard.down(key);page.wait_for_timeout(ms);page.keyboard.up(key);return
  box=page.locator('#joystick').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
  touch_start(x,y);dx={'ArrowRight':1,'ArrowLeft':-1}.get(key,0);dy={'ArrowDown':1,'ArrowUp':-1}.get(key,0)
  cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+dx*box['width']*amount,'y':y+dy*box['height']*amount}]})
  page.wait_for_timeout(ms);touch_end()
 def state():return page.evaluate(STATE)
 def save():
  (out/'trace.json').write_text(json.dumps(trace,ensure_ascii=False,indent=2));(out/'state.json').write_text(json.dumps(state(),ensure_ascii=False,indent=2))
 def dialogue():
  if page.locator('[data-action="dialogue-next"]:visible').count():
   trace['dialogue'].append({'id':page.evaluate('()=>HonroApp.dialogue?.id'),'text':page.locator('#story-line').inner_text()});page.locator('[data-action="dialogue-next"]:visible').click();return True
  return False
 def settle():
  deadline=time.monotonic()+55
  while time.monotonic()<deadline:
   if dialogue():continue
   s=state()
   if s.get('canInput') or s.get('cleared') or s.get('screen')=='rest':return s
   page.wait_for_timeout(150)
  raise Exception('settle timeout '+str(state()))
 def walk(x):
  s=settle();actor=s['active'];deadline=time.monotonic()+20;last=None;stuck=0
  while time.monotonic()<deadline:
   s=state();u=next(u for u in s['heroes'] if u['id']==actor)
   if not s['canInput'] or abs(u['x']-x)<18 or u['move']<4:break
   key='ArrowRight' if u['x']<x else 'ArrowLeft'
   hold(key,20 if abs(u['x']-x)<40 else 70)
   stuck=stuck+1 if last is not None and abs(last-u['x'])<.2 else 0;last=u['x']
   if stuck>4:break
  page.wait_for_timeout(150)
 def jump(x):
  s=settle();u=next(u for u in s['heroes'] if u['id']==s['active']);actor=u['id']
  page.locator('#jump').tap() if mobile else page.keyboard.press('Control');deadline=time.monotonic()+6;start=time.monotonic()
  key=None
  while time.monotonic()<deadline:
   s=state();u=next(u for u in s['heroes'] if u['id']==actor)
   if time.monotonic()-start>.3 and u['ground']:break
   wanted=None if abs(u['x']-x)<5 else 'ArrowRight' if u['x']<x else 'ArrowLeft'
   if key and key!=wanted:page.keyboard.up(key)
   if wanted:hold(wanted,20)
   key=None;page.wait_for_timeout(15)
  if key:page.keyboard.up(key)
 def shoot(target,skill,angle=None,power=None):
  s=settle();actor=s['active'];u=next(u for u in s['heroes'] if u['id']==actor);t=next(u for u in s['foes'] if u['id']==target)
  # Use UI facing input before reading the same production aim preview.
  if (t['x']>=u['x']) != (u['facing']>0):
   hold('ArrowRight' if t['x']>=u['x'] else 'ArrowLeft',35)
  plan=page.evaluate('''({target,skill,angle,power})=>{const e=HonroApp.engine,u=e.active,t=e.unit(target),C=HONRO_CORE,s=C.SKILLS[skill];const choices=angle!=null?[{angle,power}]:[...e.shotSeeds(u,s,t),...(t.honroObjectiveTarget?Array.from({length:131},(_,i)=>({angle:i-45,power:1})):[]),...[-25,0,15,30,45,60,75].flatMap(a=>[.25,.5,.75,1].map(p=>({angle:t.x>=u.x?a:180-a,power:p})))];for(const a of choices){if(e.manaCost(s,u,a.power)>u.focus)continue;const p=e.predict(u,s,a.angle,a.power,undefined,false),v=C.shotViable(e,u,s,t,a.angle,a.power);if(t.honroObjectiveTarget?p.unit===t.id||p.terrain===t.id:v.ok&&v.risk<.5)return {...a,display:u.facing>0?a.angle:180-a.angle,duration:e.chargeDuration(u,s)*a.power};}return null}''',{'target':target,'skill':skill,'angle':angle,'power':power})
  if not plan:raise Exception('no safe preview '+target)
  page.locator('[data-action="combat-skill"][data-skill="'+skill+'"]').click()
  for i in range(80):
   a=page.evaluate('()=>HonroApp.displayAngle(HonroApp.engine.active)');delta=plan['display']-a
   if abs(delta)<.6:break
   k='ArrowUp' if delta>0 else 'ArrowDown';hold(k,max(12,min(150,abs(delta)/65*1000)),.12 if abs(delta)<8 else .42)
  actual=page.evaluate('()=>HonroApp.engine.active.angle');print('AIM',target,plan,'actual',actual,flush=True)
  assert abs(actual-plan['angle'])<1.5,'UI aim did not converge; no shot released'
  # Use real keyboard/touch charge duration; never call fire/releaseCharge directly.
  if mobile:
   box=page.locator('#fire').bounding_box();touch_start(box['x']+box['width']/2,box['y']+box['height']/2);page.wait_for_timeout(plan['duration']*1000+25);touch_end()
  else:
   page.keyboard.down('Space');page.wait_for_timeout(plan['duration']*1000+25);page.keyboard.up('Space')
  settle()
 print('READY',json.dumps(page.locator('button:visible').evaluate_all('(ns)=>ns.map(n=>({text:n.textContent,action:n.dataset.action,id:n.dataset.id}))'),ensure_ascii=False),flush=True)
 for line in sys.stdin:
  try:
   cmd=json.loads(line);before=state();op=cmd['op']
   if op=='click':page.locator(cmd['selector']).click();page.wait_for_timeout(200)
   elif op=='settle':settle()
   elif op=='walk':walk(cmd['x'])
   elif op=='jump':jump(cmd['x'])
   elif op=='shoot':shoot(cmd['target'],cmd['skill'],cmd.get('angle'),cmd.get('power'))
   elif op=='defend':settle();page.locator('[data-action="defend"]').click();settle()
   elif op=='interact':
    settle()
    if mobile:page.locator('#context-interact button').tap()
    else:page.keyboard.press('e')
    settle()
   elif op=='reload':
    prior=state();page.reload();page.wait_for_function('window.HonroApp');page.evaluate('async()=>await HONRO_APP_READY');page.locator('[data-action="continue"]').click();settle();after=state()
    for field in ['round','active','heroes','ritual']:assert prior[field]==after[field],field
   elif op=='export':
    page.locator('[data-action="pause"]').click();page.locator('[data-action="settings"]').click();page.locator('[data-action="settings-page"][data-id="records"]').click()
    with page.expect_download() as download:page.locator('[data-action="export"]').click()
    download.value.save_as(str(out/cmd.get('name','export.json')))
   elif op=='resize':page.set_viewport_size({'width':cmd['w'],'height':cmd['h']})
   elif op=='screenshot':page.screenshot(path=str(out/(cmd['name']+'.png')))
   elif op=='buttons':print('BUTTONS',json.dumps(page.locator('button:visible').evaluate_all('(ns)=>ns.map(n=>({text:n.textContent,action:n.dataset.action,id:n.dataset.id}))'),ensure_ascii=False),flush=True)
   elif op=='quit':save();break
   elif op!='state':raise Exception('unknown '+op)
   trace['commands'].append({'command':cmd,'before':before,'after':state()});save();print('STATE',json.dumps(state(),ensure_ascii=False),flush=True)
  except Exception as e:
   page.keyboard.up('ArrowRight');page.keyboard.up('ArrowLeft');page.keyboard.up('Space');trace['commands'].append({'command':cmd,'error':str(e),'state':state()});save();print('ERROR',str(e),flush=True)
 ctx.close();browser.close()
