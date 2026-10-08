"""Real input and pause/save behavior in both static shells; controlled battle fixtures."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/combat-story';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)
def fire(page,hold=100):
    owner=page if hasattr(page,'mouse') else page.page
    box=page.locator('#fire').bounding_box();owner.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);owner.mouse.down();owner.wait_for_timeout(hold);owner.mouse.up()
def capture(page,name):
    owner=page if hasattr(page,'mouse') else page.page
    owner.wait_for_timeout(550)
    page.evaluate('HonroApp.scene.render(HonroApp.engine,0,"",.4,false,0);HonroApp.updateHUD(true)')
    owner.screenshot(path=str(OUT/name))
def suite(page,shell):
    owner=page if hasattr(page,'mouse') else page.page
    page.evaluate(r'''()=>{const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};for(let id=1;id<=10;id++)a.profile.cleared[id]=true;a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();
    window.endActor=()=>{const a=HonroApp,e=a.engine,u=e.active;if(e.canAct())a.defend();for(let i=0;i<3000&&!a.dialogue&&!u.acted;i++)e.tick(1/120);};
    window.dismiss=()=>{let guard=80;while(a.dialogue&&guard--)HonroStory.finish(a);a.turnNotice=null;};
    window.combatArena=id=>{a.trainingClass=C.SKILLS[id].cls;a.trainingSkill=id;a.trainingRanks[id]=8;a.launch(1,true,id);dismiss();const e=a.engine,b=e.b,u=e.active;Object.assign(b,{width:4200,height:2100,practiceCombat:true,terrain:[{id:'floor',x:0,y:1500,w:4200,h:600,mat:'rock',hp:99999,maxHp:99999}],waters:[],drafts:[],fields:[],zones:[],honroLandmarks:[],honroSurfaceZones:[],honroMarkers:[],wind:0});b.units=[u];Object.assign(u,{x:800,y:1500,spawnX:800,spawnY:1500,loadout:[id],ranks:{[C.baseSkill(u.cls)]:1,[id]:8},angle:25,acted:false,airborne:false,jumping:false,vx:0,vy:0,focus:1000,maxFocus:1000,cooldowns:{}});a.selected=id;b.active=u.id;b.phase='aim';b.sceneVersion++;Object.assign(a.scene,{manual:true,x:1050,y:1350,scale:1});a.updateHUD(true);return{a,e,b,u};};}''')
    page.evaluate("combatArena('M02')")
    fire(page)
    first=page.evaluate("(()=>{const a=HonroApp;a.updateHUD(true);return{ready:a.engine.iceGourdReady(),button:document.querySelector('#fire .fire-label').textContent,disabled:document.getElementById('fire').disabled,count:a.engine.b.projectiles.length};})()")
    check(shell+': releasing the first press launches a live ice gourd and enables its detonate button',first['ready'] and not first['disabled'] and first['button']=='폭발',first)
    fire(page,30)
    check(shell+': second fire press detonates once without consuming another action',page.evaluate("!HonroApp.engine.iceGourdReady()&&!HonroApp.engine.b.projectiles.some(p=>p.mode==='gourdIce')&&HonroApp.engine.b.shot===1"))
    page.evaluate("{const {e}=combatArena('M02');e.fire('M02',30,.3);HonroApp.updateHUD(true);}")
    page.locator('#battlecanvas').focus();page.locator('#battlecanvas').press('Space')
    check(shell+': Space also detonates during flight',page.evaluate('!HonroApp.engine.iceGourdReady()'))
    visual=page.evaluate(r'''()=>{const {a,e,b,u}=combatArena('S00'),C=HONRO_CORE;u.angle=35;const target=C.makeUnit('knight',1,895,1433,{id:'flash-target',honroType:'beast',honroVariant:'hound',fixed:true,hp:2000,maxHp:2000,armor:0,h:u.h,r:20});b.units.push(target);e.random=()=>0;e.fire('S00',35,.4);for(let i=0;i<18;i++)C.tickWarrior(e,1/120);const fx=[...(a.scene.damageNumbers?.values()||[])].find(f=>f.critical&&f.targetId===target.id),sword=a.scene.arcFx.fxs.find(f=>f.kind==='swordCut');a.scene.render(e,0,'',.4,false,0);window.flashTarget=target;const cv=document.createElement('canvas');cv.width=240;cv.height=240;const c=cv.getContext('2d');c.translate(120-target.x,190-target.y);a.scene.unit(c,target,false);const hurt=cv.toDataURL();target.hurt=0;c.clearRect(target.x-120,target.y-190,240,240);a.scene.unit(c,target,false);const idle=cv.toDataURL();target.hurt=.65;return{damage:2000-target.hp,critical:fx?.critical,color:fx?.color,text:fx?.text,angle:JSON.parse(sword?.text||'{}').angle,flashDifferent:hurt!==idle};}''')
    check(shell+': real sword hit creates a gold critical label, directional cut and visible target flash',visual['damage']>0 and visual['critical'] and visual['color']=='#ffd45c' and visual['flashDifferent'] and abs(visual['angle']+35*3.141592653589793/180)<1e-6,visual)
    capture(page,shell+'-critical.png')
    # Read the actual guide and queued continuation, then advance the saved round.
    entry=page.evaluate(r'''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-3');return{count:a.dialogue.lines.length,pending:a.engine.b.honroState.deferredStory,guide:a.dialogue.lines.find(l=>l[2]?.kind==='guide')?.[1],current:HonroObjectives.state(a.engine.b,a.stage).currentInstruction};}''')
    check(shell+': staged entry retains one short current guide and deferred explanations',entry['count']==11 and entry['guide']==entry['current'] and len(entry['guide'])<50 and len(entry['pending'])>0,entry)
    # Read through the authored entrance as well as its lines. Moving only the
    # text index leaves the new pre-dialogue choreography on screen.
    page.evaluate("{const a=HonroApp;for(let i=0;i<30&&a.dialogue&&(!a.dialogue.staging?.complete||a.dialogue.index<a.dialogue.lines.length-1);i++)HonroStory.next(a);HonroStory.draw(a);}")
    check(shell+': dedicated guide panel has no character portrait',page.locator('.story-guide').count()==1 and page.locator('.story-portrait').count()==0)
    capture(page,shell+'-guide.png')
    if shell=='Game':
        for width,height in [(390,844),(844,390)]:
            owner.set_viewport_size({'width':width,'height':height})
            fits=page.locator('.story-guide').evaluate('(el)=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&el.scrollWidth<=el.clientWidth+1;}')
            check(f'Guide fits {width}x{height}',fits)
        owner.set_viewport_size({'width':1440,'height':900})
    deferred=page.evaluate("(()=>{const a=HonroApp;dismiss();a.engine.b.round=2;HonroStory.tick(a,performance.now());endActor();return{dialogue:!!a.dialogue,count:a.dialogue?.lines.length,pending:a.engine.b.honroState.deferredStory.length};})()")
    check(shell+': next-round explanation waits for the actor and consumes one authored beat',deferred['dialogue'] and deferred['count']<=5 and deferred['pending']==1,deferred)
    # Stage 7 must speak with enemies still alive and without ending the player team.
    rescue=page.evaluate(r'''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-7');dismiss();const e=a.engine,b=e.b,m=b.honroMarkers.find(m=>m.action==='rescue');Object.assign(e.active,{x:m.x,y:m.y,vx:0,vy:0});a.updateHUD(true);window.rescueMarker=m.id;return{enemies:e.alive(1).length,round:b.round};}''')
    page.locator('#battlecanvas').focus();page.locator('#battlecanvas').press('e')
    check(shell+': rescue waits through action review',page.evaluate('!HonroApp.dialogue&&HonroApp.engine.b.phase==="review"'))
    page.evaluate('endActor()')
    now=page.evaluate("({dialogue:!!HonroApp.dialogue,count:HonroApp.engine.b.honroState.rescuedCount,enemies:HonroApp.engine.alive(1).length,blocked:!HonroApp.canInput(),round:HonroApp.engine.b.round})")
    check(shell+': rescue E input opens testimony at actor end with enemies alive',now['dialogue'] and now['count']==1 and now['enemies']==rescue['enemies'] and now['blocked'] and now['round']==rescue['round'],now)
    capture(page,shell+'-rescue.png')
    saved=page.evaluate(r'''()=>{const a=HonroApp;a.dialogue.index=2;HonroStory.draw(a);const saved=structuredClone(a.profile.honroBattle),text=a.dialogue.lines[2][1];a.dialogue=null;a.mount(saved);const same=a.dialogue?.lines[a.dialogue.index][1]===text;dismiss();return{same,count:a.engine.b.honroState.rescuedCount,collected:a.engine.b.honroMarkers.find(m=>m.id===rescueMarker).collected};}''')
    check(shell+': mid-testimony save resumes the exact line without re-rescuing',saved['same'] and saved['count']==1 and saved['collected'],saved)
    # Stage 5 ritual uses the real interaction control once, and then a normal attack.
    setup=page.evaluate(r'''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-5');dismiss();const e=a.engine,b=e.b,u=e.heroesAlive().find(u=>u.cls==='mage'),m=b.honroMarkers.find(m=>m.action==='ritual');b.active=u.id;Object.assign(u,{x:m.x,y:m.y,acted:false,vx:0,vy:0,airborne:false,jumping:false,loadout:['M01'],focus:1000,maxFocus:1000});a.selected='M01';a.selectedByUnit[u.id]='M01';b.phase='aim';a.updateHUD(true);return{grounded:e.grounded(u),eligible:HonroInteractions.eligibility(a,m)};}''')
    check(shell+': ritual position accepts the first interaction',setup['eligible']['ok'],setup)
    page.locator('#battlecanvas').focus();page.locator('#battlecanvas').press('e')
    result=page.evaluate(r'''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.heroesAlive().find(u=>u.cls==='mage'),m=b.honroMarkers.find(m=>m.action==='ritual');dismiss();const initial=!!b.honroState.ritual?.active;b.round++;b.phase='aim';b.side=0;b.active=u.id;u.acted=false;HonroMission.tick(a,0);dismiss();const same=b.honroState.ritual.active,duplicate=HonroInteractions.use(a,m);a.updateHUD(true);return{initial,same,duplicate,fireEnabled:!document.getElementById('fire').disabled};}''')
    check(shell+': standing ritual survives the next turn and permits attack without another interaction',result['initial'] and result['same'] and not result['duplicate'] and result['fireEnabled'],result)
    fire(page,90)
    check(shell+': ritual holder actually fires from the maintained position',page.evaluate("HonroApp.engine.b.projectiles.length>0&&HonroApp.engine.b.honroState.ritual.active"))
    leave=page.evaluate(r'''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.heroesAlive().find(u=>u.cls==='mage'),m=b.honroMarkers.find(m=>m.action==='ritual');u.x=m.x+300;HonroMission.tick(a,0);dismiss();const closed=!b.honroState.ritual.active&&!b.terrain.find(t=>t.id==='waterfall-veil').broken;Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0,acted:false});b.phase='aim';b.active=u.id;b.projectiles=[];const used=HonroInteractions.use(a,m);return{closed,used,repeatedDialogue:!!a.dialogue};}''')
    check(shell+': leaving closes the waterfall; restarting does not repeat the explanation',leave['closed'] and leave['used'] and not leave['repeatedDialogue'],leave)
    instant=page.evaluate(r'''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-7');dismiss();const e=a.engine,b=e.b,hs=b.honroState;b.round=12;hs.rescuedCount=3;hs.objectiveReadyRound=10;b.phase='aim';const rounds=b.teamEnds.slice(),allies=b.honroCounters.allyActions,alive=e.alive(1).length;const won=a.checkMission(e);return{won,phase:b.phase,alive,same:JSON.stringify(rounds)===JSON.stringify(b.teamEnds),alliesUnchanged:allies===b.honroCounters.allyActions};}''')
    check(shell+': completed objective wins during player aim with surviving enemies and no allied actions',instant['won'] and instant['phase']=='won' and instant['alive']>0 and instant['same'] and instant['alliesUnchanged'],instant)
    ending=page.evaluate(r'''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-1');dismiss();const b=a.engine.b,hs=b.honroState;hs.pendingEvents=['witness'];delete hs.flags['event:witness'];b.phase='won';a.outcome();const lines=a.dialogue.lines,first=lines[0][2]?.storyId;return{first,witness:lines.filter(l=>l[2]?.storyId?.endsWith('event-1-witness')).length,outro:lines.some(l=>l[2]?.storyId?.endsWith('outcome-1'))};}''')
    check(shell+': final-frame discovery precedes the ending exactly once',ending['first'].endswith('event-1-witness') and ending['witness']==10 and ending['outro'],ending)
    legacy=page.evaluate(r'''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-1');dismiss();const b=a.engine.b,hs=b.honroState;b.phase='review';b.reviewLeft=.01;hs.storyQueue=[['설오','이전 저장에서 기다리던 이야기',{storyId:'legacy-queue',waitForClear:true,delivery:'banter'}]];HonroStory.tick(a,performance.now());if(a.dialogue)throw Error('Legacy scene interrupted action');endActor();return{paused:!!a.dialogue&&!a.canInput(),text:a.dialogue?.lines[0][1],queued:hs.storyQueue.length,enemies:a.engine.alive(1).length};}''')
    check(shell+': old waiting dialogue resumes at actor end despite surviving enemies',legacy['paused'] and legacy['queued']==0 and legacy['enemies']>0 and legacy['text']=='이전 저장에서 기다리던 이야기',legacy)
with sync_playwright() as p:
    browser=launch(p);game=browser.new_page(viewport={'width':1440,'height':900});game.on('pageerror',lambda e:errors.append(str(e)));game.goto((ROOT/'HONRO.html').as_uri());game.wait_for_function('window.HonroApp');suite(game,'Game');game.close()
    editor=browser.new_page(viewport={'width':1440,'height':900});editor.on('pageerror',lambda e:errors.append(str(e)));editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI');editor.click('[data-tab=play]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');suite(editor.frames[1],'Workshop');editor.close()
    touch=browser.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True);touch.on('pageerror',lambda e:errors.append(str(e)));touch.goto((ROOT/'HONRO.html').as_uri());touch.wait_for_function('window.HonroApp')
    touch.evaluate("HonroApp.frame=()=>{};HonroApp.trainingClass='mage';HonroApp.trainingSkill='M02';HonroApp.launch(1,true,'M02');if(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.turnNotice=null;HonroApp.updateHUD(true)")
    touch.locator('#fire').tap();touch.evaluate('HonroApp.updateHUD(true)');check('Touch tap launches a live ice gourd',touch.evaluate('HonroApp.engine.iceGourdReady()'))
    touch.locator('#fire').tap();check('Second touch tap detonates it once',touch.evaluate('!HonroApp.engine.iceGourdReady()&&HonroApp.engine.b.shot===1'));browser.close()
check('No uncaught browser errors',not errors,errors)
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
