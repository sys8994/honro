"""Focused production UI on current Stage5; controlled poses, no fullplay claim."""
import json,os
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/stage5-gate-arrival';OUT.mkdir(parents=True,exist_ok=True)
rows=[];errors=[]
SETUP=r'''async()=>{
 await HONRO_APP_READY;await HonroCampaignLoader.ensureStage(5);
 const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
 a.profile.recruited=['archer','mage'];a.profile.party=['archer','mage'];for(let i=1;i<5;i++)a.profile.cleared[i]=true;
 a.launch(5,false);window.dismissGateStory=()=>{let n=100;while(a.dialogue&&n--)HonroStory.finish(a);a.turnNotice=null;const banner=document.getElementById('turn-banner');if(banner)banner.hidden=true;};dismissGateStory();
 window.paintGate=()=>{dismissGateStory();a.updateHUD(true);const e=a.engine,u=e.active;Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,x:u.x,y:u.y-120,scale:innerWidth<600?.45:.7});a.scene.render(e,0,a.selected,.3,false,0);};
 window.makeStageGate=(kind)=>{
  const e=a.engine,b=e.b,C=HONRO_CORE,m=e.unit('p-mage'),u=e.unit('p-archer'),shoulder=b.terrain.find(t=>t.id==='stage5-west-shoulder');
  Object.assign(b,{phase:'aim',side:0,active:m.id,stakes:[],projectiles:[]});b.units=b.units.filter(v=>v.side===0||v.honroObjectiveTarget);e.checkEnd=()=>false;
  Object.assign(m,{x:2400,y:C.topAt(shoulder,2400),acted:false,ranks:{...m.ranks,M09:1},loadout:['M09'],focus:200,maxFocus:200});delete m.gateTurn;
  Object.assign(u,{x:2200,y:C.topAt(shoulder,2200),acted:false,focus:0,moveLeft:0});delete u.gateTurn;
  if(!e.fire('M09',45,.3))throw Error('M09 cast failed');
  if(kind==='flight'){let n=0;while(b.projectiles.length&&n++<2400)for(const p of [...b.projectiles])e.stepProjectile(p,C.STEP);}
  else{const id=kind==='cliff'?'waterfall-cliff':'stage5-timber-high',x=kind==='cliff'?5350:3150,t=b.terrain.find(t=>t.id===id);e.impact(b.projectiles[0],{x,y:kind==='cliff'?1332:C.topAt(t,x),n:{x:0,y:-1},terrain:t,t:0});}
  if(b.stakes.length!==2)throw Error('installation did not produce a pair');
  Object.assign(u,{x:b.stakes[0].x,y:b.stakes[0].y});Object.assign(m,{x:2200,y:C.topAt(shoulder,2200),acted:true});b.active=u.id;b.phase='aim';
  a.selected='A01';a.selectedByUnit[u.id]='A01';paintGate();window.gateGrowth=JSON.stringify(a.profile.heroes);window.gateLoadouts=JSON.stringify(a.profile.loadouts);
  const p=e.gateResolution();return{ok:p.ok,reason:p.reason,spot:p.spot&&{x:p.spot.x,y:p.spot.y},stakes:b.stakes.length,disabled:document.querySelector('#context-interact button')?.disabled};
 };
}'''
def check(name,value):
 assert value,name
 print('PASS',name,flush=True)
with sync_playwright() as pw,serve_game() as local:
 browser=launch(pw)
 base=os.environ.get('HONRO_GATE_BASE_URL',local)
 for width,height in [(1280,900),(390,844),(360,800)]:
  context=browser.new_context(viewport={'width':width,'height':height},is_mobile=width<600,has_touch=width<600)
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp');page.evaluate(SETUP)
  for kind in ['flight','upper','cliff']:
   plan=page.evaluate('kind=>makeStageGate(kind)',kind)
   if kind=='cliff':
    state=page.evaluate(r'''()=>{const a=HonroApp,u=a.engine.active,s=document.querySelector('#context-interact strong'),b=s.getBoundingClientRect();window.gateDeniedBefore=JSON.stringify(u);return{disabled:document.querySelector('#context-interact button').disabled,text:s.textContent,wrap:getComputedStyle(s).whiteSpace,opacity:getComputedStyle(s.closest('button')).opacity,noClip:s.scrollHeight<=s.clientHeight+1,inViewport:b.x>=0&&b.right<=innerWidth&&b.y>=0&&b.bottom<=innerHeight};}''')
    check(f'{width}: cliff denied with full readable reason',not plan['ok'] and state['disabled'] and '깊은 소' in state['text'] and state['wrap']=='normal' and state['opacity']=='1' and state['noClip'] and state['inViewport'])
    page.locator('#battlecanvas').focus();page.locator('#battlecanvas').press('e')
    feedback=page.evaluate('''()=>({same:gateDeniedBefore===JSON.stringify(HonroApp.engine.active),message:HonroApp.engine.b.events.at(-1)})''')
    check(f'{width}: denied E explains reason without consuming actor state',feedback['same'] and feedback['message']==plan['reason'])
    page.screenshot(path=str(OUT/f'cliff-denied-{width}.png'));rows.append({'width':width,'kind':kind,'plan':plan,'ui':state,'feedback':feedback});continue
   check(f'{width}: installed {kind} pair is ready for archer after mage action',plan['ok'] and plan['stakes']==2 and plan['disabled'] is False)
   page.screenshot(path=str(OUT/f'{kind}-before-{width}.png'))
   if width<600:page.locator('#context-interact button').tap()
   else:page.locator('#context-interact button').click()
   arrived=page.evaluate(r'''()=>{paintGate();const a=HonroApp,e=a.engine,u=e.active;return{x:u.x,y:u.y,grounded:e.grounded(u),used:!!u.gateTurn,focus:u.focus,move:u.moveLeft,acted:u.acted,mageActed:e.unit('p-mage').acted,growth:JSON.stringify(a.profile.heroes)===gateGrowth,loadouts:JSON.stringify(a.profile.loadouts)===gateLoadouts};}''')
   check(f'{width}: pointer arrives on exact safe spot with zero focus/movement',arrived['x']==plan['spot']['x'] and arrived['y']==plan['spot']['y'] and arrived['grounded'] and arrived['used'] and arrived['focus']==0 and arrived['move']==0 and not arrived['acted'] and arrived['mageActed'] and arrived['growth'] and arrived['loadouts'])
   page.screenshot(path=str(OUT/f'{kind}-arrived-{width}.png'))
   if kind=='upper':
    saved=page.evaluate('''()=>{const a=HonroApp;a.profile.honroBattle=structuredClone(a.engine.b);a.persist();localStorage.setItem('honro-first-act-profile-1',JSON.stringify(a.profile));return{x:a.engine.active.x,y:a.engine.active.y,token:a.engine.active.gateTurn,heroes:JSON.stringify(a.profile.heroes),loadouts:JSON.stringify(a.profile.loadouts)};}''')
    page.reload();page.wait_for_function('window.HonroApp');page.evaluate('''async()=>{await HONRO_APP_READY;await HonroCampaignLoader.ensureStage(5);const a=HonroApp;a.frame=()=>{};a.continue();}''');page.wait_for_function('HonroApp.engine && HonroApp.scene')
    restored=page.evaluate('''()=>{const a=HonroApp,e=a.engine,u=e.active;return{x:u.x,y:u.y,token:u.gateTurn,locked:!e.gateResolution().ok,heroes:JSON.stringify(a.profile.heroes),loadouts:JSON.stringify(a.profile.loadouts)};}''')
    check(f'{width}: real reload/Continue preserves arrival, growth and same-turn lock',all(restored[k]==saved[k] for k in saved) and restored['locked'])
    # Reload removes test helpers; rebuild them for the remaining isolated case.
    page.evaluate(SETUP)
   rows.append({'width':width,'kind':kind,'plan':plan,'arrived':arrived})
  context.close()
 browser.close()
check('No browser exceptions',not errors)
(OUT/'browser.json').write_text(json.dumps({'scope':'Controlled current Stage5 production UI, real projectile path, pointer/E and reload/Continue; no fullplay or physical-phone claim','base':base,'rows':rows,'errors':errors},ensure_ascii=False,indent=2)+'\n')
