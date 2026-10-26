"""Real built game and Chromium. Controlled XP/combat fixtures, not full campaign play."""
import json
from playwright.sync_api import sync_playwright, Error
from browser_support import launch,ROOT,serve_game
OUT=ROOT/'_local/reports/levelup-companion-growth';OUT.mkdir(parents=True,exist_ok=True)
rows=[];errors=[]
SETUP=r'''()=>{
 const a=HonroApp,C=HONRO_CORE,P=HonroProgression;a.frame=()=>{};a.stopBattle();a.close();a.dialogue=null;a.done=false;
 a.profile=HonroProfileStore.fresh();a.profile.heroes.archer.xp=C.xpAtLevel(2)-1;a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();a.launch(1);
 for(let i=0;a.dialogue&&i<30;i++)HonroStory.finish(a);if(a.dialogue)throw Error("entry dialogue did not finish");HonroStory.tick(a,performance.now()+1100);a.storyCamera=null;a.scene.storyFrame=null;a.scene.storyTween=null;a.scene.storyFrozen=false;a.close();
 const e=a.engine,b=e.b,u=e.active;e.checkEnd=()=>false;u.hp=20;u.focus=3;
 const s=P.contributionState(b);s.total=8000;s.combatLimit=8000;b.honroGrowth.weight=1;
 // Keep the real first-stage world. Its one diagnostic kill settles a large
 // declared XP batch so the screenshot can verify a multi-level label.
 const foe=b.units.find(v=>v.side===1);for(const row of Object.values(s.enemies))if(row.id!==foe.id)delete s.enemies[row.id];
 b.honroGrowth.weight=s.enemies[foe.id].weight;window.probe={foeId:foe.id,events:[],before:{round:b.round,phase:b.phase,acted:u.acted},unitId:u.id};
 const event=e.onEvent;e.onEvent=ev=>{probe.events.push(ev);event(ev);};
 a.scene.manual=true;a.scene.x=u.x;a.scene.y=u.y-130;a.scene.scale=innerWidth<600?.72:.9;
 window.paint=dt=>{a.scene.render(e,dt,a.selected,.5,false,dt);a.updateHUD(true);};paint(0);
 return {hp:u.hp,focus:u.focus,level:u.level};
}'''
with sync_playwright() as pw,serve_game() as base:
 browser=launch(pw)
 for width,height,name in [(1440,960,'desktop'),(390,844,'mobile')]:
  context=browser.new_context(viewport={'width':width,'height':height},has_touch=width<600)
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp && window.HONRO_CORE')
  before=page.evaluate(SETUP);page.screenshot(path=str(OUT/f'{name}-before.png'))
  result=page.evaluate(r'''()=>{
   const a=HonroApp,e=a.engine,b=e.b,u=e.active,foe=e.unit(probe.foeId);
   e.hurt(foe,foe.maxHp*2,u.id,false,undefined,undefined,'salheun');HonroProgression.flushContribution(e);a.scene.manual=true;a.scene.goalFocus=null;a.scene.focusUntil=0;a.scene.storyTween=null;a.scene.x=u.x;a.scene.y=u.y-130;probe.painted=[];const fill=a.scene.ctx.fillText.bind(a.scene.ctx);a.scene.ctx.fillText=(text,...args)=>{probe.painted.push(text);return fill(text,...args);};paint(.22);
   const f=a.scene.levelUps.get(u.id),events=probe.events.filter(ev=>ev.type==='level');
   return {painted:probe.painted.filter(t=>t.startsWith('레벨업')),level:u.level,hp:u.hp,maxHp:u.maxHp,focus:u.focus,maxFocus:u.maxFocus,events,feedback:f,
    canInput:a.canInput(),dialogue:!!a.dialogue,modal:a.modal.classList.contains('open'),phase:b.phase,round:b.round,acted:u.acted};
  }''')
  assert result['hp']==result['maxHp'] and result['focus']==result['maxFocus'],result
  assert len(result['events'])==1 and result['feedback']['after']-result['feedback']['before']>1,result
  assert result['canInput'] and not result['dialogue'] and not result['modal'] and result['painted'],result
  assert page.locator('#dialogue-root').inner_text()=='',page.locator('#dialogue-root').inner_text()
  assert page.locator('#turn-banner').is_hidden(),'entry turn notice must finish before feedback capture'
  page.screenshot(path=str(OUT/f'{name}-levelup.png'))
  after=page.evaluate(r'''()=>{
   const a=HonroApp,e=a.engine,u=e.active;paint(1.4);u.hp-=13;u.focus-=7;
   const expected={hp:u.hp,focus:u.focus,xp:e.b.heroes.archer.xp};
   HonroProgression.flushContribution(e);a.profile.heroes=structuredClone(e.b.heroes);a.profile.honroBattle=structuredClone(e.b);a.persist();
   return {remaining:a.scene.levelUps.size,expected,actual:{hp:u.hp,focus:u.focus,xp:e.b.heroes.archer.xp},profile:structuredClone(a.profile)};
  }''')
  assert after['remaining']==0 and after['expected']==after['actual'],after
  # Reload through the production profile store + Continue, preserving spent resources.
  page.evaluate('(p)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',after['profile'])
  page.reload();page.wait_for_function('window.HonroApp');
  loaded=page.evaluate(r'''()=>{const a=HonroApp;a.frame=()=>{};a.continue();return {engine:!!a.engine,dialogue:!!a.dialogue};}''')
  page.wait_for_function('HonroApp.engine && HonroApp.scene');
  stable=page.evaluate(r'''()=>{const a=HonroApp,u=a.engine.active;return {hp:u.hp,focus:u.focus,xp:a.engine.b.heroes.archer.xp,feedback:a.scene.levelUps?.size||0};}''')
  assert {k:stable[k] for k in ['hp','focus','xp']}==after['expected'],stable
  assert stable['feedback']==0,stable
  rows.append({'viewport':name,'before':before,'levelup':result,'reload':stable})
  print('PASS',name,'actual XP event, full recovery, multi-level single seal, input retained, expiry and reload without recovery/replay',flush=True)
  context.close()
 # Try the published UI directly; an HTTP denial is an access limitation, not a failed game assertion.
 public=browser.new_page()
 try:
  response=public.goto('https://sys8994.github.io/honro/HONRO.html',wait_until='domcontentloaded')
  access={'url':public.url,'status':response.status if response else None,'title':public.title()}
  if response and response.status==200:
   public.wait_for_function('window.HonroApp',timeout=30000);access['runtimeReady']=True
  else:access['body']=public.locator('body').inner_text()[:500]
 except Error as error:
  access={'url':'https://sys8994.github.io/honro/HONRO.html','status':'access blocked','error':str(error).split('Call log:')[0].strip()}

 browser.close()
assert not errors,errors
report={'scope':'Built production game in local Chromium, controlled XP fixtures; no fullplay claim','rows':rows,'pageErrors':errors,'publicAccessBeforeDeploy':access}
(OUT/'browser-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Public UI access:',json.dumps(access,ensure_ascii=False))
