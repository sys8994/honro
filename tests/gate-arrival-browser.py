"""Focused real UI: shared readiness, pointer/E, fallback, save lock and stage5 slope."""
import json,os
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/mage-volley-gate/gate';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,value):
 assert value,name
 checks.append({'name':name,'ok':True});print('PASS',name,flush=True)
SETUP=r'''async()=>{await HONRO_APP_READY;await HonroCampaignLoader.ensureStage(5);const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();window.dismiss=()=>{let n=100;while(a.dialogue&&n--)HonroStory.finish(a);a.turnNotice=null;const banner=document.getElementById('turn-banner');if(banner)banner.hidden=true;};
for(let id=1;id<5;id++)a.profile.cleared[id]=true;a.profile.recruited=['archer','mage'];a.profile.party=['archer','mage'];a.launch(5,false);dismiss();window.growthBefore=JSON.stringify(a.profile.heroes);window.loadoutBefore=JSON.stringify(a.profile.loadouts);
window.gateUI=()=>{const a=HonroApp;a.selected='M09';a.selectedByUnit[a.engine.b.active]='M09';a.updateHUD(true);const r=a.scene.size();a.scene.manual=true;a.scene.storyTween=null;a.scene.scale=Math.min(.8,(r.w-32)/1100);a.scene.x=700;a.scene.y=925;a.scene.render(a.engine,0,'M09',.5,false,0);};
window.makeArena=(kind)=>{const a=HonroApp,C=HONRO_CORE,e=a.engine,b=e.b,u=e.heroesAlive().find(v=>v.cls==='mage');Object.assign(b,{width:3000,height:1600,honroStage:1,honroCustom:true,honroBackdrop:'forest',terrain:[{id:'gate-floor',x:0,y:1000,w:3000,h:600,mat:'rock',hp:99999,maxHp:99999}],waters:[],drafts:[],fields:[],zones:[],projectiles:[],honroMarkers:[],honroLandmarks:[],round:1,phase:'aim',side:0});b.units=[u];b.active=u.id;Object.assign(u,{x:400,y:1000,vx:0,vy:0,airborne:false,jumping:false,acted:false,dead:false,focus:50,maxFocus:100,hp:500,maxHp:1000,moveLeft:100,maxMove:1000});delete u.gateTurn;delete u.retreat;
b.stakes=[{id:2001,skill:'M09',owner:u.id,side:0,x:400,y:1000,rank:8,damage:0,shot:0,expires:12},{id:2002,skill:'M09',owner:u.id,side:0,x:1000,y:1000,rank:8,damage:0,shot:0,expires:12}];
if(kind==='ceiling'||kind==='blocked')b.terrain.push({id:'gate-roof',x:kind==='blocked'?650:870,y:1000-u.h-35,w:kind==='blocked'?700:260,h:55,mat:'rock',hp:99999,maxHp:99999});
if(kind==='occupied')b.units.push(C.makeUnit('archer',1,1000,1000,{id:'gate-occupied',hp:1000,maxHp:1000}));
e.checkEnd=()=>false;b.sceneVersion++;dismiss();gateUI();const plan=e.gateResolution();return{ok:plan.ok,reason:plan.reason,spot:plan.spot&&{x:plan.spot.x,y:plan.spot.y,distance:plan.spot.distance},disabled:document.querySelector('#context-interact button')?.disabled};};}'''
with sync_playwright() as pw,serve_game() as url:
 browser=launch(pw)
 for width in [int(w) for w in os.environ.get('HONRO_GATE_WIDTHS','1280,390,360').split(',')]:
  page=browser.new_page(viewport={'width':width,'height':900 if width==1280 else 844},is_mobile=width<600,has_touch=width<600);page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url+'/HONRO.html');page.wait_for_function('window.HonroApp');page.evaluate(SETUP)
  # The unchanged authored stage5 restriction and real one-way/slope contact.
  stage=page.evaluate(r'''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.heroesAlive().find(u=>u.cls==='mage'),m=b.honroMarkers.find(m=>m.action==='ritual'),home=e.surface(2100,2000,b.height);Object.assign(u,{x:2100,y:home.y,vx:0,vy:0,airborne:false,jumping:false,acted:false,ranks:{...u.ranks,M09:1},loadout:['M09'],focus:1000,maxFocus:1000});b.active=u.id;b.phase='aim';b.side=0;const fired=e.fire('M09',130,.5),p=b.projectiles[0],floor=e.surface(m.x,m.y-100,m.y+5);e.impact(p,{x:m.x,y:floor.y,n:{x:0,y:-1},terrain:floor.t,t:0});b.phase='aim';u.acted=false;dismiss();a.updateHUD(true);const plan=e.gateResolution(),used=e.useGate();return{fired,ok:plan.ok,used,reason:plan.reason,delta:Math.hypot(u.x-m.x,u.y-floor.y),grounded:e.grounded(u)};}''')
  check(f'{width}: real stage5 slope arrival',stage['fired'] and stage['ok'] and stage['used'] and stage['grounded'] and stage['delta']<1)
  page.evaluate("()=>{const a=HonroApp,u=a.engine.heroesAlive().find(v=>v.cls==='mage');dismiss();a.scene.manual=true;a.scene.storyTween=null;a.scene.x=u.x;a.scene.y=u.y-100;a.scene.scale=.55;a.scene.render(a.engine,0,'M09',.5,false,0);}");page.screenshot(path=str(OUT/f'stage5-slope-{width}.png'))
  if os.environ.get('HONRO_GATE_STAGE_ONLY'):
   page.close();continue
  for kind in ['occupied','ceiling','blocked']:
   plan=page.evaluate('kind=>makeArena(kind)',kind);page.screenshot(path=str(OUT/f'{kind}-{width}-before.png'))
   if kind=='blocked':
    check(f'{width}: blocked plan disables the actual context button',not plan['ok'] and plan['disabled'] and '도착지 없음' in plan['reason'])
    state=page.evaluate("()=>{const a=HonroApp,u=a.engine.active,old=JSON.stringify(u);document.querySelector('#context-interact button').click();return{same:old===JSON.stringify(u),reason:document.querySelector('#context-interact button').textContent};}")
    check(f'{width}: disabled pointer does not consume state',state['same']);continue
   check(f'{width}: {kind} button matches the ready plan',plan['ok'] and plan['disabled'] is False)
   (page.locator('#context-interact button').tap() if width<600 else page.locator('#context-interact button').click());page.evaluate('gateUI()');page.screenshot(path=str(OUT/f'{kind}-{width}-after.png'))
   arrived=page.evaluate('''()=>{const a=HonroApp,e=a.engine,u=e.active;return{x:u.x,y:u.y,grounded:e.grounded(u),used:!!u.gateTurn,heroes:JSON.stringify(a.profile.heroes)===growthBefore,loadouts:JSON.stringify(a.profile.loadouts)===loadoutBefore};}''')
   check(f'{width}: {kind} pointer lands on the planned valid pose and preserves growth',arrived['x']==plan['spot']['x'] and arrived['y']==plan['spot']['y'] and arrived['grounded'] and arrived['used'] and arrived['heroes'] and arrived['loadouts'])
   if kind=='occupied':
    saved=page.evaluate('''()=>{const a=HonroApp,b=structuredClone(a.engine.b);a.mount(b);dismiss();gateUI();return{locked:!a.engine.gateResolution().ok,disabled:document.querySelector('#context-interact button')?.disabled};}''')
    check(f'{width}: saved reentry preserves same-turn lock',saved['locked'] and saved['disabled'])
    page.evaluate("()=>{HonroApp.engine.b.round++;gateUI();}");page.locator('#battlecanvas').focus();page.locator('#battlecanvas').press('e')
    check(f'{width}: next turn E returns through the same pair',page.evaluate('Math.abs(HonroApp.engine.active.x-400)<1'))
  page.close()
 browser.close()
check('No browser exceptions',not errors)
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2)+'\n')
