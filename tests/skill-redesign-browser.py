"""Actual game and Workshop iframe: every new cast at both ranks, UI, saves and captured frames."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/skill-redesign';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)

SETUP=r'''()=>{
 const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};a.profile.settings.sound=false;a.profile.settings.music=false;a.updateAudio();
 window.skillArena=(id,r=8,complex=false)=>{
  a.close();a.trainingClass=C.SKILLS[id].cls;a.trainingSkill=id;a.launch(1,true,id);a.frame=()=>{};a.turnNotice=null;a.dialogue=null;a.done=false;
  const e=a.engine,b=e.b,u=e.active;b.wind=0;b.width=2600;b.height=1500;b.fields=[];b.waters=[];b.drafts=[];b.zones=[];b.stakes=[];b.honroMarkers=[];b.honroSurfaceZones=[];b.honroLandmarks=[];
  b.terrain=[{id:'test-floor',x:0,y:1100,w:2600,h:400,hp:99999,maxHp:99999,mat:'rock'}];
  if(complex)b.terrain.push({id:'test-roof',x:750,y:650,w:800,h:25,hp:99999,maxHp:99999,mat:'rock'},{id:'test-wall',x:1350,y:650,w:30,h:450,hp:99999,maxHp:99999,mat:'rock'},{id:'test-platform',x:1050,y:870,w:220,h:20,hp:99999,maxHp:99999,mat:'wood',oneWay:true});
  b.units=[u];Object.assign(u,{x:400,y:1100,vx:0,vy:0,airborne:false,jumping:false,acted:false,attack:1,ranks:{[id]:r,[C.baseSkill(u.cls)]:1},loadout:[id],focus:1000,maxFocus:1000,cooldowns:{}});u.ranks[id]=r;
  for(let i=0;i<8;i++)b.units.push(C.makeUnit('archer',1,850+i*70,1100,{id:'target'+i,name:'허상',role:'dummy',fixed:true,h:92,hp:20000,maxHp:20000,armor:0,loadout:['LA01']}));
  b.phase='aim';b.active=u.id;b.rng=194512;b.sceneVersion++;a.selected=id;
  Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,cinematic:null,x:1000,y:820,scale:.60});a.scene.arcFx.fxs=[];
  window.castEvents=[];const emit=e.onEvent;e.onEvent=ev=>{castEvents.push(ev);emit(ev);};a.updateHUD(true);return {e,b,u};
 };
 window.castAll=()=>{const rows=[];for(const s of Object.values(C.SKILLS).filter(s=>s.redesigned&&!s.martial&&!s.passive))for(const r of [1,8]){
  const {e,b,u}=skillArena(s.id,r,['M02','M11','M12'].includes(s.id));const fired=e.fire(s.id,35,.60);let maxProjectiles=b.projectiles.length,ticks=0;
  for(;ticks<1900&&(b.projectiles.length||b.volley);ticks++){e.stepVolley(1/120);for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,1/120);C.tickRedesign(e,1/120);if(ticks%12===0)a.scene.render(e,.1,'',.6,false,.1);maxProjectiles=Math.max(maxProjectiles,b.projectiles.length);}
  a.scene.render(e,0,'',.6,false,0);rows.push({id:s.id,rank:r,fired,ticks,maxProjectiles,remaining:b.projectiles.length,damage:b.units.filter(v=>v.side===1).reduce((n,v)=>n+v.maxHp-v.hp,0),stakes:b.stakes.length});
 }return rows;};
}'''

with sync_playwright() as p:
    browser=launch(p)
    game=browser.new_page(viewport={'width':1440,'height':900});game.on('pageerror',lambda e:errors.append(str(e)))
    game.goto((ROOT/'HONRO.html').as_uri());game.wait_for_function('window.HonroApp')
    game.evaluate(SETUP)
    # Open actual trees, including a rankable branch capstone and free basic detail.
    tree=game.evaluate('''()=>{const a=HonroApp;a.profile.recruited=['archer','mage','knight','occultist'];a.cls='archer';a.showCamp();const host=a.root;return{nodes:host.querySelectorAll('[data-action="talent"]').length,global:host.querySelectorAll('.ultimate-panel').length,text:host.innerText};}''')
    check('Actual archer tree has 20 talents, branch names and no class ultimate',tree['nodes']==20 and tree['global']==0 and all(x in tree['text'] for x in ['절명','곡사','강궁']),tree)
    game.screenshot(path=str(OUT/'tree-archer.png'))
    game.evaluate("HonroApp.talent('A01')");check('Basic detail opens without talent allocation',game.locator('#previewcanvas').count()==1 and game.locator('#modal .rank-banner').count()==0)
    game.evaluate("HonroApp.close();HonroApp.talent('A99')");check('Capstone uses normal rank detail',game.locator('#modal .rank-banner').count()==1)
    game.evaluate('HonroApp.close()')
    rows=game.evaluate('castAll()');check('Game: all 32 attacks/actions at Lv1 and Lv8 cast, render, resolve',len(rows)==64 and all(x['fired'] and x['remaining']==0 for x in rows),rows)
    # Capture real rendered frames, not mockup art.
    for id,steps in [('M06',30),('M02',200),('A15',600),('M15',1800),('M12',1800)]:
        capture=game.evaluate('''([id,n])=>{const a=HonroApp,{e,b}=skillArena(id,8,id==='M12');e.fire(id,38,.65);let captured=false,splitFrames=0;for(let i=0;i<n;i++){for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,1/120);if(castEvents.some(e=>e.name==='skillGeometry')){captured=true;break;}if(id==='A15'&&b.projectiles.filter(p=>p.child).length===7&&++splitFrames>=18){captured=true;break;}if(i%10===0)a.scene.render(e,1/12,'',.65,false,1/12);}a.scene.render(e,0,'',.65,false,0);a.updateHUD(true);return captured;}''',[id,steps])
        if id in ['M15','M12','A15']:check(f'{id} capture contains resolved geometry or seven split arrows',capture)
        game.screenshot(path=str(OUT/f'vfx-{id}.png'))
    # Real button hold/release, then real E, one manual redirect per arrow.
    game.evaluate("skillArena('A09');HonroApp.engine.active.angle=40")
    game.locator('#fire').dispatch_event('pointerdown',{'pointerId':1,'button':0,'isPrimary':True})
    game.wait_for_timeout(240)
    game.locator('#fire').dispatch_event('pointerup',{'pointerId':1,'button':0,'isPrimary':True})
    check('Desktop fire input creates the selected projectile',game.evaluate("HonroApp.engine.b.projectiles.some(p=>p.skill==='A09')"))
    game.keyboard.press('e');check('Desktop E turns the arrow once',game.evaluate("HonroApp.engine.b.projectiles[0].turned===true"))
    before=game.evaluate('HonroApp.engine.b.projectiles.map(p=>[p.vx,p.vy])');game.keyboard.press('e');check('Second steering input is ignored',before==game.evaluate('HonroApp.engine.b.projectiles.map(p=>[p.vx,p.vy])'))
    # Actual interaction button with two allies and gates.
    gate_setup='''()=>{const a=HonroApp,C=HONRO_CORE,{e,b,u}=skillArena('M09');b.projectiles=[];b.phase='aim';b.stakes=[{id:901,skill:'M09',owner:u.id,side:0,x:400,y:1100,rank:8,damage:0,shot:1},{id:902,skill:'M09',owner:u.id,side:0,x:700,y:1100,rank:8,damage:0,shot:1}];const ally=C.makeUnit('archer',0,300,1100,{id:'second-ally',loadout:['A01']});b.units.push(ally);u.hp=100;u.focus=0;u.moveLeft=0;u.vx=u.vy=0;a.updateHUD(true);return u.x;}'''
    game.evaluate(gate_setup);game.keyboard.press('e');check('Real E gate interaction teleports and applies arrival buffs',game.evaluate('HonroApp.engine.active.x===700&&HonroApp.engine.active.focus>0&&!!HonroApp.engine.active.arrivalGuard'))
    game.keyboard.press('e');check('Same-turn gate reuse blocked',game.evaluate('HonroApp.engine.active.x===700'))
    game.evaluate("HonroApp.engine.b.teamEnds[0]++;HonroApp.updateHUD(true)");game.locator('[data-context-interact]').click();check('Mobile-compatible context button teleports',game.evaluate('HonroApp.engine.active.x===400'))
    game.evaluate("{const e=HonroApp.engine,u=e.unit('second-ally');u.x=400;e.select(u.id);HonroApp.updateHUD(true);}");game.keyboard.press('e');check('Second ally independently uses the same gates',game.evaluate("HonroApp.engine.unit('second-ally').x===700"))
    healing=game.evaluate('''()=>{const a=HonroApp,C=HONRO_CORE,{e,b,u}=skillArena('M10');const ally=C.makeUnit('archer',0,650,1100,{id:'heal-ally',hp:100,maxHp:1000,focus:0,maxFocus:100,moveLeft:0,maxMove:1000,loadout:['A01']});b.units.push(ally);b.stakes=[{id:950,skill:'M10',owner:u.id,side:0,x:650,y:1100,rank:8,damage:0,shot:1},{id:951,skill:'M09',owner:u.id,side:0,x:400,y:1100,rank:8,damage:0,shot:2},{id:952,skill:'M09',owner:u.id,side:0,x:950,y:1100,rank:8,damage:0,shot:3}];C.tickRedesign(e,1/120);a.scene.render(e,0,'',.6,false,0);return {hp:ally.hp,focus:ally.focus,move:ally.moveLeft,stakes:b.stakes.length};}''')
    check('Ally step preserves healing stake and restores all three resources',healing['hp']==240 and abs(healing['focus']-15)<1e-8 and healing['move']==360 and healing['stakes']==3,healing)
    game.screenshot(path=str(OUT/'vfx-stakes.png'))
    # Save/load old profile and unfinished battle, without touching the user's context.
    migration=game.evaluate('''()=>{const a=HonroApp,C=HONRO_CORE,p=HONRO_TOOLS.fresh();p.heroes.archer.xp=C.xpAtLevel(12);p.heroes.archer.kills=7;p.heroes.archer.damage=1234;delete p.heroes.archer.skillRevision;p.heroes.archer.ranks={A01:4,A10:3};p.heroes.mage.ranks={M01:3,M09:4};delete p.heroes.mage.skillRevision;p.honroBattle=structuredClone(a.engine.b);p.honroBattle.mode='campaign';p.honroBattle.heroes=structuredClone(p.heroes);delete p.honroBattle.skillRevision;localStorage.setItem('honro-first-act-profile-1',JSON.stringify(p));return{xp:p.heroes.archer.xp,hp:p.honroBattle.units[0].hp,knight:p.heroes.knight};}''')
    game.reload();game.wait_for_function('window.HonroApp');loaded=game.evaluate('({hero:HonroApp.profile.heroes.archer,battle:!!HonroApp.profile.honroBattle,hp:HonroApp.profile.honroBattle?.units[0].hp,knight:HonroApp.profile.heroes.knight})')
    check('Real localStorage migration refunds talents and preserves battle/stats',loaded['hero']['ranks']=={'A01':1} and loaded['hero']['xp']==migration['xp'] and loaded['hero']['kills']==7 and loaded['battle'] and loaded['hp']==migration['hp'] and loaded['knight']==migration['knight'],loaded)
    game.evaluate("HonroApp.profile.heroes.archer.ranks.A14=1;HonroApp.persist()");game.reload();game.wait_for_function('window.HonroApp');check('Reload does not repeat the talent reset',game.evaluate('HonroApp.profile.heroes.archer.ranks.A14')==1)
    # Genuine touch events for in-flight redirect.
    touch=browser.new_page(viewport={'width':844,'height':390},has_touch=True,is_mobile=True);touch.on('pageerror',lambda e:errors.append(str(e)));touch.goto((ROOT/'HONRO.html').as_uri());touch.wait_for_function('window.HonroApp');touch.evaluate(SETUP);touch.evaluate("{const {e}=skillArena('A09');e.fire('A09',40,.6);HonroApp.updateHUD(true);}");touch.locator('#battlecanvas').tap(position={'x':450,'y':130});check('Actual touch input turns 전로시',touch.evaluate('HonroApp.engine.b.projectiles[0].turned===true'));touch.close()
    editor=browser.new_page(viewport={'width':1440,'height':900});editor.on('pageerror',lambda e:errors.append(str(e)));editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI');snapshot=editor.evaluate('HonroWorkshopAPI.exportProject()');editor.click('[data-tab="play"]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');play=editor.frames[1];play.on('pageerror',lambda e:errors.append(str(e)));play.evaluate(SETUP)
    editor_rows=play.evaluate('castAll()');check('Workshop Playtest: all 64 cast/rank combinations share the runtime',len(editor_rows)==64 and all(x['fired'] and x['remaining']==0 for x in editor_rows),editor_rows)
    editor.click('#stopPlay');check('Playtest leaves the authored map unchanged',editor.evaluate('HonroWorkshopAPI.exportProject()')==snapshot)
    browser.close()
check('No browser runtime exceptions',not errors,errors)
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
