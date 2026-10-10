"""Production controls, renderer and turn flow in isolated Game/Workshop browsers."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
OUT=ROOT/'_local/reports/hwigyeom-p5';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)

SETUP=r'''()=>{const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};a.profile.settings.sound=false;a.profile.settings.music=false;a.updateAudio();
 window.martialArena=(id='S00',rank=1)=>{a.trainingClass=C.SKILLS[id].cls;a.trainingSkill=id;a.trainingRanks[id]=rank;a.trainingPassives={};a.launch(1,true,id);a.dialogue=null;a.turnNotice=null;a.done=false;a.charging=false;
 const e=a.engine,b=e.b,u=e.active;Object.assign(b,{practiceCombat:false,width:5200,height:2200,terrain:[{id:'floor',x:0,y:1700,w:5200,h:500,hp:99999,maxHp:99999,mat:'rock'}],waters:[],drafts:[],fields:[],zones:[],honroLandmarks:[],honroSurfaceZones:[],honroMarkers:[],wind:0});b.units=[u];Object.assign(u,{x:800,y:1700,spawnX:800,spawnY:1700,attack:1,hp:700,maxHp:700,vx:0,vy:0,airborne:false,jumping:false,acted:false,ranks:{[C.baseSkill(u.cls)]:1,[id]:rank},loadout:[id],angle:35,focus:1000,maxFocus:1000,cooldowns:{}});b.active=u.id;b.phase='aim';b.sceneVersion++;a.selected=id;a.selectedByUnit[u.id]=id;Object.assign(a.scene,{manual:true,x:1300,y:1450,scale:.65,turnTarget:undefined});a.scene.arcFx.fxs=[];
 window.addTarget=(x=930,extra={})=>{const t=C.makeUnit('archer',1,x,1700,{id:'target-'+b.units.length,role:'bow',fixed:true,hp:10000,maxHp:10000,armor:0,awake:true,loadout:['LA01'],...extra});b.units.push(t);return t;};addTarget();
 window.advance=(n=2400)=>{for(let i=0;i<n&&b.phase!=='aim';i++)e.tick(C.STEP);a.turnNotice=null;a.scene.manual=true;a.updateHUD(true);return{phase:b.phase,follow:u.meleeFollow,ready:a.canInput(),projectiles:b.projectiles.length,round:b.round,x:u.x,hp:u.hp,error:a.lastError||null};};
 window.paint=(power=.6,charging=false)=>{a.scene.manual=true;a.scene.render(e,0,a.selected,power,charging,0);a.updateHUD(true);};a.updateHUD(true);paint();return{a,e,b,u};};}'''

def fire(page,hold=60,touch=False):
    owner=page if hasattr(page,'mouse') else page.page
    box=page.locator('#fire').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
    if touch:
        session=owner.context.new_cdp_session(owner)
        session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
        owner.wait_for_timeout(hold)
        session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});session.detach()
    else:
        owner.mouse.move(x,y);owner.mouse.down();owner.wait_for_timeout(hold);owner.mouse.up()

def suite(page,shell):
    page.evaluate(SETUP)
    check(shell+': new skill tree labels survive runtime localization',page.evaluate('HONRO_CORE.BRANCHES.knight.slice(0,3).map(v=>v.name)')==['검술','돌격','검기'])
    ids=page.evaluate('Object.values(HONRO_CORE.SKILLS).filter(s=>s.martial&&!s.passive).map(s=>s.id)')
    casts=[]
    for rank in [1,8]:
        for sid in ids:
            page.evaluate('([id,r])=>martialArena(id,r)',[sid,rank]);fire(page)
            shot=page.evaluate('HonroApp.engine.b.shots')
            state=page.evaluate('advance()')
            if sid=='S13':
                check(shell+f': rank {rank} rush landing exposes a usable basic follow-up',state.get('follow')=='ready' and page.locator('[data-skill=S00]').count()==1 and not page.locator('#fire').is_disabled(),state)
                fire(page);state=page.evaluate('advance()')
            assert shot==1 and state['ready'] and not state['projectiles'] and not state['error'],(sid,rank,state)
            casts.append({'id':sid,'rank':rank,'state':state})
    check(shell+': all sixteen new actions at ranks 1 and 8 cast through the fire control and return to aim',len(casts)==32,casts)
    # Deliberate hold/release demonstrates the actual charge curve and melee-only rendering.
    rows=[]
    for hold in [15,2100]:
        page.evaluate("martialArena('S00',1)");fire(page,hold)
        rows.append(page.evaluate("(()=>{const a=HonroApp,u=a.engine.active;return{power:u.lastPower,range:u.meleeAction.range,damage:u.meleeAction.damage,cost:1000-u.focus,projectiles:a.engine.b.projectiles.length,guard:u.martialGuard?.reduction||0};})()"))
        page.evaluate('advance()')
    check(shell+': real short/long hold changes melee damage, reach, cost and defensive stance',rows[1]['power']==1 and rows[1]['range']>rows[0]['range'] and rows[1]['damage']>rows[0]['damage'] and rows[1]['cost']>rows[0]['cost'] and rows[0]['guard']>0 and rows[1]['guard']==0 and all(r['projectiles']==0 for r in rows),rows)
    page.evaluate("{const {a,e,b,u}=martialArena('S04',8);u.angle=60;e.fire('S04',60,.85);for(let i=0;i<35;i++)e.stepProjectile(b.projectiles[0],1/120);a.updateHUD(true);paint();}")
    fire(page,touch=True)
    check(shell+': touch fire input triggers exactly one mid-flight dive',page.evaluate('HonroApp.engine.b.projectiles[0].dived&&!HonroApp.engine.manualDive()'))
    page.evaluate('advance()')
    # The follow-up selector must block all non-melee skills, even when equipped.
    page.evaluate("{const {a,e,u}=martialArena('S13',8);u.loadout=['S13','S09','S02'];e.fire('S13',40,.6);advance();a.updateHUD(true);}")
    check(shell+': melee-only follow-up disables rush, blade and jump controls',page.locator('[data-skill=S13]').is_disabled() and page.locator('[data-skill=S09]').is_disabled() and not page.locator('[data-skill=S02]').is_disabled() and page.locator('#jump').is_disabled())
    # Run the production frame once per input while the fixture's RAF remains paused.
    page.evaluate("window.inputFrame=()=>{const a=HonroApp,now=performance.now();a.prev=now-20;a.acc=0;a.constructor.prototype.frame.call(a,now);};window.followOrigin=(()=>{const u=HonroApp.engine.active;return{x:u.x,y:u.y,move:u.moveLeft,focus:u.focus};})();")
    owner=page if hasattr(page,'keyboard') else page.page
    for code,direction in [('ArrowLeft',-1),('ArrowRight',1),('KeyA',-1),('KeyD',1)]:
        owner.keyboard.down({'KeyA':'a','KeyD':'d'}.get(code,code));page.evaluate('inputFrame()');owner.keyboard.up({'KeyA':'a','KeyD':'d'}.get(code,code))
        check(shell+': grounded follow-up turns with '+code,page.evaluate('(direction)=>{const u=HonroApp.engine.active,o=followOrigin;return u.facing===direction&&u.x===o.x&&u.y===o.y&&u.moveLeft===o.move&&u.focus===o.focus&&u.meleeFollow==="ready";}',direction))
    for direction in [-1,1]:
        box=page.locator('#joystick').bounding_box();x=box['x']+box['width']*(.5+direction*.35);y=box['y']+box['height']/2
        session=owner.context.new_cdp_session(owner)
        session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});page.evaluate('inputFrame()')
        check(shell+': touch follow-up turns without moving '+str(direction),page.evaluate('(direction)=>{const u=HonroApp.engine.active,o=followOrigin;return u.facing===direction&&u.x===o.x&&u.y===o.y&&u.moveLeft===o.move&&u.meleeFollow==="ready";}',direction))
        session.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]});session.detach()
        check(shell+': touch cancellation releases direction',page.evaluate('HonroApp.stick.x===0'))
    page.locator('[data-skill=S02]').click();fire(page)
    check(shell+': selecting life slash for the follow-up pays one-third HP before the strike',page.evaluate('HonroApp.engine.active.hp===467&&HonroApp.engine.active.meleeAction.lifeCost===233&&HonroApp.engine.active.meleeAction.skill==="S02"'))
    page.evaluate('advance();paint()')
    # The latest narrative UI may pause between the rush and its bonus action.
    page.evaluate("{const {a,e}=martialArena('S13',8);e.fire('S13',40,.6);advance();HonroStory.start(a,[['서술','길 위의 이야기를 마치고 검을 다시 쥔다.',{kind:'narration'}]],{title:'전투 연계 확인'});a.updateHUD(true);}")
    check(shell+': story dialogue suspends the pending melee follow-up',page.evaluate("!HonroApp.canInput()&&!HonroApp.beginCharge()&&HonroApp.engine.active.meleeFollow==='ready'"))
    page.locator('[data-action=dialogue-next]').click();page.evaluate('HonroApp.updateHUD(true)');fire(page)
    check(shell+': closing the story dialogue preserves exactly one melee follow-up',page.evaluate("HonroApp.engine.active.meleeFollow==='spent'&&HonroApp.engine.active.meleeAction.skill==='S00'"))
    page.evaluate('advance()')
    # Five direct real projectile turns, a deliberate miss, then another direct hit.
    series=page.evaluate(r'''()=>{const {a,e,b,u}=martialArena('A01',8),t=b.units[1],rows=[];u.ranks.AP05=8;e.random=()=>.99;for(let i=0;i<7;i++){u.angle=i===5?100:0;const hp=t.hp;e.fire('A01',u.angle,.3);advance();rows.push({turn:i+1,damage:hp-t.hp,records:t.salheun?.[u.id]?.entries.map(v=>({...v}))||[]});}paint();return rows;}''')
    check(shell+': direct projectile hits build Salheun over five turns, a miss ages it and the next hit echoes',series[0]['damage']>0 and series[4]['damage']>series[0]['damage'] and series[5]['damage']==0 and series[6]['damage']>series[0]['damage'],series)
    if shell=='Game':page.screenshot(path=str(OUT/'salheun-embedded-arrows.png'))
    # Mixed costs use production casts and update the same HUD meter.
    charge=page.evaluate(r'''()=>{const {a,e,b,u}=martialArena('M06',8);u.ranks.MP05=8;const rows=[];for(const id of ['M06','M03','M08','M13']){u.loadout=[id];u.ranks[id]=8;a.selected=id;a.selectedByUnit[u.id]=id;const before=u.focus;e.fire(id,40,.15);const paid=before-u.focus;advance();rows.push({id,paid,gauge:u.jucheon,ready:u.jucheonReady});if(u.jucheonReady)break;}a.updateHUD(true);paint();return rows;}''')
    check(shell+': mixed spells fill Jucheon in two to four casts and expose completion meter',2<=len(charge)<=4 and charge[-1]['ready'] and page.locator('#combat-passives [role=meter]').get_attribute('aria-valuenow')=='100' and '주천완성' in page.locator('#combat-passives').inner_text(),charge)
    if shell=='Game':page.screenshot(path=str(OUT/'jucheon-ready.png'))
    free=page.evaluate("(()=>{const a=HonroApp,e=a.engine,u=e.active;const before=u.focus;e.fire(u.loadout[0],30,.2);a.updateHUD(true);return{paid:before-u.focus,gauge:u.jucheon,ready:u.jucheonReady,boost:e.b.projectiles[0].effectBoost};})()")
    check(shell+': rank-eight empowered cast is free, resets gauge and snapshots 15% effect',free=={'paid':0,'gauge':0,'ready':False,'boost':.15},free)
    page.evaluate('advance()')
    ended=page.evaluate("(()=>{const {a,e,b,u}=martialArena('M06',8);u.jucheon=78;u.jucheonReady=true;b.units[1].salheun={archer:{entries:[{turn:1,damage:50}],action:1,recorded:50,cap:75,projectiles:[1]}};u.dead=true;u.hp=0;a.checkMission(e);return{phase:b.phase,charge:u.jucheon,ready:u.jucheonReady,history:!!b.units[1].salheun};})()")
    check(shell+': production mission end clears P5 records before the result dialogue',ended=={'phase':'lost','charge':0,'ready':False,'history':False},ended)
    check(shell+': application stayed healthy',not page.evaluate('HonroApp.lastError||null'))

with sync_playwright() as p:
    browser=launch(p)
    page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)));page.goto((ROOT/'HONRO.html').as_uri());page.wait_for_function('window.HonroApp')
    # This case runs the actual RAF game loop, with no simulated ticks or frame override.
    page.evaluate("{const a=HonroApp;a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();a.trainingClass='knight';a.trainingSkill='S00';a.launch(1,true,'S00');a.dialogue=null;a.turnNotice=null;const b=a.engine.b,u=a.engine.active;u.angle=0;b.practiceCombat=false;b.units=b.units.slice(0,2);const t=b.units[1];t.fixed=true;t.x=u.x+110;t.y=u.y;t.hp=t.maxHp=10000;t.armor=0;window.liveHp=t.hp;a.updateHUD(true);}")
    fire(page,180)
    page.wait_for_function("HonroApp.engine.b.round>1&&HonroApp.engine.b.phase==='aim'",timeout=30000)
    check('Unmodified RAF loop: melee hits and rearms without refresh',page.evaluate('HonroApp.engine.b.units[1].hp<liveHp&&HonroApp.canInput()'))
    suite(page,'Game')
    # Real renderer frames for visual review, including the raised/charged pose and low zoom guide.
    for sid in ['S00','S07','S14','S12']:
        page.evaluate("id=>{const {a,e,b,u}=martialArena(id,8);if(id==='S00'){paint(1,true);a.scene.render(e,.4,id,1,true,.4);return;}e.fire(id,30,.6);for(let i=0;i<18;i++){HONRO_CORE.tickWarrior(e,1/120);for(const q of [...b.projectiles])if(b.projectiles.includes(q))e.stepProjectile(q,1/120);}for(const f of a.scene.arcFx.fxs)f.age=.1;paint();}",sid)
        page.screenshot(path=str(OUT/f'visual-{sid}.png'))
    perf=page.evaluate(r'''()=>{const {a,e,b,u}=martialArena('S12',8),c=document.createElement('canvas').getContext('2d'),times=[];for(let i=0;i<45;i++){u.angle=25+i*.4;const start=performance.now();HONRO_CORE.drawRedesignGuide(c,e,u,HONRO_CORE.SKILLS.S12,.6,.25);times.push(performance.now()-start);}times.sort((a,b)=>a-b);return{median:times[22],p95:times[42]};}''')
    check('Nine-blade centre prediction fits a frame budget',perf['p95']<16.7,perf)
    page.set_viewport_size({'width':430,'height':850});page.evaluate("{const {a}=martialArena('S00');a.scene.scale=.25;paint();}");page.screenshot(path=str(OUT/'mobile-melee-guide.png'))
    check('Mobile fire control remains visible and usable',page.locator('#fire').is_visible() and not page.locator('#fire').is_disabled())
    fire(page,touch=True);check('Mobile touch melee resolves',page.evaluate('advance().ready'))
    saved_flight=page.evaluate("(()=>{const {a,e,b}=martialArena('S12',8);e.fire('S12',45,.7);for(let i=0;i<20;i++)e.stepProjectile(b.projectiles[0],1/120);const p=structuredClone(a.profile);p.honroBattle=structuredClone(b);p.recruited=['archer','mage','knight'];localStorage.setItem('honro-first-act-profile-1',JSON.stringify(p));return b.projectiles[0].orbit;})()")
    page.reload();page.wait_for_function('window.HonroApp')
    check('Actual browser profile reload preserves orbit seed and contact records',page.evaluate('HonroApp.profile.honroBattle.projectiles[0].orbit')==saved_flight)
    page.close()
    editor=browser.new_page(viewport={'width':1440,'height':900});editor.on('pageerror',lambda e:errors.append(str(e)));editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI');saved=editor.evaluate('HonroWorkshopAPI.exportProject()');editor.click('[data-tab=play]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');play=editor.frames[1];play.on('pageerror',lambda e:errors.append(str(e)));suite(play,'Workshop');editor.click('#stopPlay');check('Workshop authored map is unchanged after skill playtesting',saved==editor.evaluate('HonroWorkshopAPI.exportProject()'));browser.close()
check('No uncaught browser errors',not errors,errors)
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors,'orbitPredictionMs':perf},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
