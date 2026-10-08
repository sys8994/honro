"""Real HTML skill-key/pause UI with controlled poses; not a normal combat clear."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
OUT=ROOT/'_local/reports/stake-preparation-browser'
OUT.mkdir(parents=True,exist_ok=True)
SETUP=r'''()=>{
 const a=HonroApp;a.frame=()=>{};a.profile.settings.sound=false;a.profile.settings.music=false;a.updateAudio();
 a.launchMap(HONRO_PROJECT,'stage-25',{story:false});a.frame=()=>{};a.dialogue=null;a.turnNotice=null;a.close();
 const e=a.engine,b=e.b,P=HonroStakeCrossing,u=b.units.find(u=>u.side===0&&u.cls==='mage'),c=P.current(b);
 b.units=b.units.filter(u=>u.side===0&&!u.summoned);b.wind=0;e.checkEnd=()=>false;a.checkMission=()=>false;
 for(const [i,v]of b.units.entries())Object.assign(v,{x:c.from.x-90+i*90,y:c.from.y,vx:0,vy:0,jumping:false,airborne:false,acted:false,focus:v.maxFocus});
 b.active=u.id;b.phase='aim';b.side=0;P.takeCheckpoint(b);a.updateHUD(true);
 const canvas=document.getElementById('battlecanvas');canvas.tabIndex=0;canvas.focus();
 return {slot:u.loadout.indexOf('M09')+1,skills:u.loadout,permanent:a.profile.loadouts.mage};
}'''
checks=[];errors=[]
with sync_playwright() as p:
 browser=launch(p)
 for host in ['HONRO.html','HONRO_WORKSHOP.html']:
  owner=browser.new_page(viewport={'width':1440,'height':900})
  owner.on('pageerror',lambda e:errors.append(str(e)))
  owner.goto((ROOT/host).as_uri())
  if 'WORKSHOP' in host:
   owner.click('[data-tab="play"]');owner.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');page=owner.frames[1]
  else:
   page=owner;page.wait_for_function('window.HonroApp')
  state=page.evaluate(SETUP)
  assert 1<=state['slot']<=4,state
  assert page.locator('#combat-skills .skill-button').count()==4
  assert page.locator('#stake-crossing-tools').count()==0
  owner.keyboard.press(str(state['slot']))
  assert page.evaluate('HonroApp.selected')=='M09'
  page.evaluate('HonroApp.updateHUD(true)')
  assert page.locator('#combat-skills [data-skill="M09"].selected').count()==1
  owner.keyboard.press('5');assert page.evaluate('HonroApp.selected')=='M09'
  page.evaluate('HonroApp.scene.render(HonroApp.engine,0,HonroApp.selected,.6,false,0)')
  page.locator('#battlecanvas').screenshot(path=str(OUT/(host+'-slots.png')))
  before=page.evaluate('JSON.stringify(HonroApp.profile.heroes)')
  owner.keyboard.press('Escape')
  page.locator('[data-action="stake-retry"]').click()
  assert page.evaluate('HonroApp.engine.b.honroStakeCrossing.retries')==1
  assert page.evaluate('JSON.stringify(HonroApp.profile.heroes)')==before
  assert not page.evaluate('HonroApp.modal.classList.contains("open")')
  assert page.evaluate('HonroApp.engine.b.units.find(u=>u.cls==="mage").loadout.includes("M09")')
  checks.append({'host':host,'slot':state['slot'],'checks':['four real cards','actual number key','no fifth UI','pause retry','no XP grant','prepared slot retained']})
  print('PASS',host,checks[-1],flush=True)
  owner.close()
 browser.close()
assert not errors,errors
(OUT/'summary.json').write_text(json.dumps({'checks':checks,'errors':errors,'limits':['Pose fixture; no enemy combat clear.']},ensure_ascii=False,indent=2))
