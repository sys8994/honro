"""Real game and Workshop input/render/save checks. Terminal campaign checks use
explicit fixtures, separately from movement/fire tests; no user storage is used."""
import json,base64
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/act2';OUT.mkdir(parents=True,exist_ok=True)
rows=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    rows.append({'name':name,'detail':detail});print('PASS',name,detail or '',flush=True)
def skip(page):
    page.evaluate('while(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.turnNotice=null;HonroApp.banterCurrent=null')
with sync_playwright() as p:
    browser=launch(p);page=browser.new_page(viewport={'width':1440,'height':900})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((ROOT/'HONRO.html').as_uri());page.wait_for_function('window.HonroApp')
    page.evaluate('HonroApp.frame=()=>{}')
    for sid in range(11,21):
        data=page.evaluate('''id=>{const a=HonroApp;a.profile=HONRO_TOOLS.fresh();for(let j=1;j<id;j++)a.profile.cleared[j]={rounds:12};
          a.profile.recruited=['archer','mage','knight'];for(const cls of a.profile.recruited){a.profile.heroes[cls].xp=HONRO_CORE.xpAtLevel(12);HONRO_CORE.autoTrain(a.profile.heroes[cls],cls);}
          a.launch(id);return{stage:a.engine.b.honroStage,party:a.engine.heroesAlive().map(u=>u.cls),entry:a.dialogue.lines.length}}''',sid)
        check(f'2-{sid-10} entry and party',data['stage']==sid and len(data['party'])==4 and data['entry']<=8,data)
        skip(page)
        data=page.evaluate('''()=>{const a=HonroApp,e=a.engine,u=e.active,x=u.x;a.keys.clear();for(let j=0;j<40;j++){e.move(1,1/120);e.tick(1/120);}const moved=u.x-x;
         const fired=e.fire(u.loadout.find(id=>!HONRO_CORE.SKILLS[id].passive),30,.35);for(let j=0;j<320&&e.b.projectiles.length;j++)e.tick(1/120);
         a.scene.manual=true;a.scene.storyTween=null;a.scene.goalFocus=null;a.scene.x=e.b.width/2;a.scene.y=e.b.height/2;a.scene.scale=.29;a.scene.render(e,0);return{moved,fired,finite:e.b.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y))}}''')
        check(f'2-{sid-10} real move/fire',data['moved']>20 and data['fired'] and data['finite'],data)
        page.screenshot(path=str(OUT/f'stage-{sid}.png'))
    page.evaluate('HonroApp.launch(11)');skip(page)
    page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,u=b.units.find(u=>u.cls==='occultist'&&u.side===0),m=b.honroMarkers.find(m=>m.id==='knot-west');b.active=u.id;Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0,acted:false});a.updateHUD(true);HonroInteractions.refresh(a)}''')
    page.keyboard.press('e')
    check('PC E commits knot exactly once',page.evaluate('!!HonroApp.engine.b.honroState.act2.done["knot-west"]'))
    page.evaluate('HonroApp.engine.finishAction(true);HonroApp.startQueuedStory();HonroApp.profile.honroBattle=structuredClone(HonroApp.engine.b);HonroApp.persist()')
    saved=page.evaluate('JSON.stringify({a:HonroApp.engine.b.honroState.act2,heroes:HonroApp.profile.heroes,index:HonroApp.dialogue?.index})')
    page.reload();page.wait_for_function('window.HonroApp');page.evaluate('HonroApp.frame=()=>{}');page.click('[data-action="continue"]')
    check('Save/reload restores objective and story page',page.evaluate('JSON.stringify({a:HonroApp.engine.b.honroState.act2,heroes:HonroApp.profile.heroes,index:HonroApp.dialogue?.index})')==saved)
    skip(page)
    for width,height in [(390,844),(844,390)]:
        page.set_viewport_size({'width':width,'height':height});page.evaluate('HonroApp.launch(11)');skip(page)
        page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,u=b.units.find(u=>u.cls==='occultist'&&u.side===0),m=b.honroMarkers.find(m=>m.id==='knot-west');b.active=u.id;Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0,acted:false});a.updateHUD(true);HonroInteractions.refresh(a)}''')
        page.click('[data-context-interact="knot-west"]')
        check(f'Mobile {width} context interaction',page.evaluate('!!HonroApp.engine.b.honroState.act2.done["knot-west"]'))
        page.evaluate('HonroApp.engine.finishAction(true);HonroApp.startQueuedStory()')
        check(f'Mobile {width} no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        page.screenshot(path=str(OUT/f'mobile-{width}.png'))
        for sid in [14,15,18,20]:
            page.evaluate('id=>HonroApp.launch(id)',sid);skip(page)
            result=page.evaluate('''()=>{const a=HonroApp,e=a.engine,u=e.active;a.scene.storyTween=null;a.scene.goalFocus=null;a.scene.cinematic=null;a.scene.manual=true;a.scene.x=u.x+450;a.scene.y=u.y-180;const minimum=HonroBounds.zoomLimits(innerWidth).min;a.scene.scale=minimum;a.scene.render(e,0);return{stage:e.b.honroStage,overflow:document.documentElement.scrollWidth>innerWidth,scale:a.scene.scale,minimum,finite:Number.isFinite(a.scene.x)&&Number.isFinite(a.scene.y)}}''')
            check(f'Mobile {width} cave/exit {sid} tactical view',result['stage']==sid and not result['overflow'] and result['finite'] and abs(result['scale']-result['minimum'])<1e-6,result)
            page.screenshot(path=str(OUT/f'mobile-{width}-stage-{sid}.png'))
    page.set_viewport_size({'width':1440,'height':900});skip(page)
    page.evaluate('HonroApp.showMap()');skip(page);page.click('[data-act-focus="11"]')
    check('Journey has all Act 2 nodes and focus navigation',page.locator('.map-node').count()==20 and page.evaluate('HonroApp.stageId===11'))
    page.screenshot(path=str(OUT/'journey.png'))
    # Explicit terminal fixtures exercise the real application reward/unlock/outro
    # path. The separate Node bot covers movement and combat without these fixtures.
    page.evaluate('''()=>{const a=HonroApp;a.profile=HONRO_TOOLS.fresh();for(let j=1;j<=10;j++)a.profile.cleared[j]={rounds:12};a.profile.recruited=['archer','mage','knight'];for(const cls of a.profile.recruited)a.profile.heroes[cls].xp=HONRO_CORE.xpAtLevel(12)}''')
    for sid in range(11,21):
        page.evaluate('id=>HonroApp.launch(id)',sid);skip(page)
        result=page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,st=a.stage;const before=b.heroes.archer.xp;
          for(const s of st.steps){const u=e.heroesAlive().find(u=>u.cls===(s.requiredClass||(s.kind==='rescue'?'occultist':'archer'))),m=b.honroMarkers.find(m=>m.id===s.id);b.active=u.id;b.phase='aim';b.side=0;u.acted=false;u.vx=u.vy=0;
           if(s.kind==='destroy')e.damageTerrain(b.terrain.find(t=>t.id===s.id),1000,0,u.id);
           else if(s.kind==='defeat')e.hurt(e.unit(s.target),1e9,u.id);
           else if(s.kind==='reach')Object.assign(u,{x:m.x,y:m.y});
           else if(s.kind==='escort')Object.assign(e.unit('objective'),{x:m.x,y:m.y});
           else {Object.assign(u,{x:m.x,y:m.y});HonroAct2.use(a,m);}
           HonroAct2.tick(a,0);while(a.dialogue)HonroStory.finish(a);
          }
          a.checkMission(e);const phase=b.phase;a.outcome();while(a.dialogue)HonroStory.finish(a);
          const xp=a.profile.heroes.archer.xp;a.outcome(true);return{phase,cleared:!!a.profile.cleared[st.id],xpGained:xp-before,oneTime:a.profile.heroes.archer.xp===xp,next:st.id===20?HONRO_CONTENT.nextAct.available===false:a.isOpen(HONRO_CONTENT.stages[st.id])}}''')
        check(f'Campaign {sid} victory, outro, reward and next unlock',result['phase']=='won' and result['cleared'] and result['xpGained']>0 and result['oneTime'] and result['next'],result)
    page.evaluate('HonroApp.launch(14)');skip(page)
    result=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;a.engine.unit('objective').hp=0;a.engine.unit('objective').dead=true;a.checkMission(a.engine);a.outcome(true);return{phase:b.phase,reason:b.winnerReason,xp:a.profile.heroes.archer.xp}}''')
    check('Protected resident loss produces an explicit failure',result['phase']=='lost' and '주민' in result['reason'],result)
    page.click('[data-action="retry"]');skip(page)
    check('Retry resets objectives and preserves earned XP',page.evaluate('HonroApp.engine.b.phase==="aim"&&!HonroAct2.memory(HonroApp.engine.b).done["family-upper"]&&HonroApp.profile.heroes.archer.xp')==result['xp'])
    sprites=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,cv=document.createElement('canvas'),atlas=document.createElement('canvas');cv.width=cv.height=256;atlas.width=1280;atlas.height=512;const c=cv.getContext('2d'),ac=atlas.getContext('2d'),rows=[];a.scene.time=0;
      for(const [i,[kind,d]] of Object.entries(HonroWorld.archetypes).filter(([,d])=>d.act2).entries()){
        const u=HonroWorld.createEnemy(b,a.stage,128,kind,900+i,224);Object.assign(u,{x:128,y:224,h:128,facing:1});const before=JSON.stringify(u);c.clearRect(0,0,256,256);a.scene.unitBody(c,u,0);const data=c.getImageData(0,0,256,256).data;let pixels=0;for(let j=3;j<data.length;j+=4)if(data[j]>24)pixels++;rows.push({kind,pixels,pure:JSON.stringify(u)===before});ac.drawImage(cv,(i%5)*256,Math.floor(i/5)*256);
      }return{rows,png:atlas.toDataURL().split(',')[1]}}''')
    check('All ten Act 2 enemy types have visible, state-pure shared art',len(sprites['rows'])==10 and all(r['pixels']>100 and r['pure'] for r in sprites['rows']),sprites['rows'])
    (OUT/'monster-atlas.png').write_bytes(base64.b64decode(sprites['png']))
    # Workshop uses the same compiled maps and gameplay rules in its iframe.
    editor=browser.new_page(viewport={'width':1440,'height':900});editor.on('pageerror',lambda e:errors.append(str(e)))
    editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
    check('Workshop exposes all twenty maps',editor.evaluate('HonroWorkshopAPI.getProject().stages.length')==20)
    for sid in [14,15,18,19,20]:
        editor.evaluate('id=>HonroWorkshopAPI.selectStage("stage-"+id)',sid)
        check(f'Workshop stage {sid} compiles',editor.evaluate('HonroWorkshopAPI.getRuntime().engine.b.honroStage')==sid)
    editor.evaluate('HonroWorkshopAPI.selectStage("stage-18")')
    saved=editor.evaluate('HonroWorkshopAPI.exportProject()')
    editor.click('[data-tab="play"]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
    play=editor.frames[1];play.evaluate('HonroApp.frame=()=>{}');skip(play)
    result=play.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.heroesAlive().find(u=>u.cls==='mage'),m=b.honroMarkers.find(m=>m.id==='silence');b.active=u.id;Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0,acted:false});a.updateHUD(true);HonroInteractions.refresh(a);return{stage:b.honroStage,party:e.heroesAlive().length,active:HonroAct2.active(b)}}''')
    play.locator('[data-context-interact="silence"]').click()
    check('Actual Workshop iframe runs Act 2 ritual rules',result['stage']==18 and result['party']==4 and result['active'] and play.evaluate('!!HonroAct2.memory(HonroApp.engine.b).done.silence'),result)
    editor.click('#stopPlay')
    check('Stop Playtest preserves the authored project',editor.evaluate('HonroWorkshopAPI.exportProject()')==saved)
    check('No browser exceptions',not errors,errors)
    browser.close()
(OUT/'browser.json').write_text(json.dumps({'checks':rows,'errors':errors},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
