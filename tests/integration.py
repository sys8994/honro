"""Browser acceptance against the two real static entry points, including actual iframe playtest."""
import base64
import io
import json
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT=ROOT/'.test-output/integration';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,condition,detail=None):
    assert condition, f'{name}: {detail}'
    checks.append({'name':name,'detail':detail});print('PASS',name,detail if detail is not None else '',flush=True)
def listen(page):
    page.on('pageerror',lambda e:errors.append(str(e)))
def canvas_image(page,selector):
    data=page.locator(selector).evaluate('(c)=>c.toDataURL().split(",")[1]')
    return Image.open(io.BytesIO(base64.b64decode(data))).convert('RGBA')

with sync_playwright() as p:
    browser=launch(p)
    editor=browser.new_page(viewport={'width':1440,'height':900});listen(editor)
    editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
    game=browser.new_page(viewport={'width':1440,'height':900});listen(game)
    game.goto((ROOT/'HONRO.html').as_uri());game.wait_for_function('window.HonroApp')
    game.evaluate('HonroApp.frame=()=>{}')
    project=editor.evaluate('HonroWorkshopAPI.getProject()')
    check('Canonical Stage 1–10 loaded',len(project['stages'])==10)
    check('Edit mode has no audio engine',editor.evaluate('typeof window.HonroApp')=='undefined')
    # Fix both actual host canvas viewports. Screenshots read the world layer, overlay is separate.
    editor.add_style_tag(content='#stageView .canvas-wrap{position:fixed;left:0;top:0;width:960px;height:540px;z-index:99}#stageToolbar,.canvas-help,.hud-overlay{display:none!important}')
    game.add_style_tag(content='.battle-view{position:fixed!important;left:0!important;top:0!important;width:960px!important;height:540px!important}#battlecanvas{width:960px!important;height:540px!important}')
    editor.evaluate('HonroWorkshopAPI.setOverlay(false)')
    for sid in [1,2,3,4,5,6,7,8,9,10]:
        editor.evaluate('id=>HonroWorkshopAPI.selectStage("stage-"+id)',sid)
        st=project['stages'][sid-1]
        camera={'x':st['width']/2,'y':st['height']/2,'zoom':.2}
        editor.evaluate('v=>HonroWorkshopAPI.setCamera(v)',camera)
        actual_camera=editor.evaluate('HonroWorkshopAPI.getEditorState().stageView')
        game.evaluate('''([id,camera])=>{const a=HonroApp,st=HONRO_PROJECT.stages[id-1];
          a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(st)};
          for(let i=1;i<=10;i++)a.profile.cleared[i]={};a.launch(id);if(a.dialogue)HonroStory.finish(a);
          a.turnNotice=null;Object.assign(a.scene,{time:0,walkTime:0,manual:true,storyTween:null,goalFocus:null,cinematic:null,x:camera.x,y:camera.y,scale:camera.zoom});
          a.scene.render(a.engine,0,'',.6,false,0);
        }''',[sid,actual_camera])
        a=canvas_image(editor,'#stageCanvas');b=canvas_image(game,'#battlecanvas')
        assert a.size==b.size,(a.size,b.size)
        diff=ImageChops.difference(a,b).convert('RGB');pixels=list(diff.getdata());changed=sum(max(px)>3 for px in pixels);ratio=changed/len(pixels)
        if sid in [1,2,8,10]:a.save(OUT/f'editor-stage-{sid}.png');b.save(OUT/f'game-stage-{sid}.png');diff.save(OUT/f'diff-stage-{sid}.png')
        check(f'Rendering equivalence Stage {sid}',ratio<.0001,{'differentPixels':changed,'ratio':ratio})
    # Exercise all ten migrated campaigns through the real app and engine.
    for sid in range(1,11):
        smoke=game.evaluate('''sid=>{const a=HonroApp;a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(HONRO_PROJECT.stages[sid-1])};for(let i=1;i<=10;i++)a.profile.cleared[i]={};a.launch(sid);if(a.dialogue)HonroStory.finish(a);a.turnNotice=null;const e=a.engine;
          for(let i=0;i<240;i++){if(i<30)e.move(1,1/120);if(i===30)e.jump(e.active);if(i===140)e.fire(e.active.loadout[0],35,.5);e.tick(1/120);a.missionTick(1/120);if(i%60===0)a.scene.render(e,0);}
          return{finite:e.b.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)),heroes:e.heroesAlive().length,shots:e.b.shots,error:a.lastError||null};}''',sid)
        check(f'Stage {sid} movement/jump/attack runtime smoke',smoke['finite'] and smoke['heroes']>0 and not smoke['error'],smoke)
    # Return to normal editor layout for real input tests.
    editor.reload();editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
    baseline=editor.evaluate('HonroWorkshopAPI.exportProject()')
    commands=[{'op':'placeElement','assetId':'rock_small','x':1800,'scale':1.2},
              {'op':'placeUnit','kind':'ally:guard','id':'new-ally','team':'ally','x':1900},
              {'op':'placeUnit','kind':'crow','id':'new-crow','x':2300,'y':1700,'snap':False}]
    editor.evaluate('cmds=>HonroWorkshopAPI.previewCommands(cmds)',commands)
    check('Preview preserves authored state',editor.evaluate('HonroWorkshopAPI.exportProject()')==baseline)
    check('Preview uses actual runtime units',editor.evaluate('HonroWorkshopAPI.getRuntime().engine.b.units.some(u=>u.id==="new-crow"&&u.honroType==="crow")'))
    editor.evaluate('HonroWorkshopAPI.applyPreview()');applied=editor.evaluate('HonroWorkshopAPI.exportProject()')
    editor.evaluate('HonroWorkshopAPI.undo()');check('Agent apply is one Undo',editor.evaluate('HonroWorkshopAPI.exportProject()')==baseline)
    editor.evaluate('HonroWorkshopAPI.redo()');check('Redo preserves generated stable IDs',editor.evaluate('HonroWorkshopAPI.exportProject()')==applied)
    failed=editor.evaluate('''()=>{try{HonroWorkshopAPI.applyCommands([{op:'placeUnit',kind:'missing-type',x:20}]);return false}catch{return true}}''')
    check('Invalid command transaction rejected',failed and editor.evaluate('HonroWorkshopAPI.exportProject()')==applied)
    editor.evaluate('HonroWorkshopAPI.previewCommands([{op:"move",id:"new-crow",x:2450}]);HonroWorkshopAPI.discardPreview()')
    check('Discard restores actual scene',editor.evaluate('HonroWorkshopAPI.getRuntime().engine.unit("new-crow").x')==2300)
    # JSON export is consumed directly by the game; graphics definitions survive.
    edited=editor.evaluate('HonroWorkshopAPI.getProject()');game.evaluate('p=>HonroApp.launchMap(p,p.activeStageId,{story:false})',edited)
    fields=['id','cls','side','honroType','honroVariant','h','r','loadout','ranks','hp','attack']
    extract='''ids=>Object.fromEntries(ids.map(id=>{const e=typeof HonroWorkshopAPI==='object'?HonroWorkshopAPI.getRuntime().engine:HonroApp.engine,u=e.unit(id);return[id,Object.fromEntries(%s.map(k=>[k,u[k]??null]))]}))'''%json.dumps(fields)
    units=['new-crow','new-ally','p-archer']
    check('Unit asset and definition equivalence',editor.evaluate(extract,units)==game.evaluate(extract,units))
    check('Game → editor → save → game is lossless',editor.evaluate('p=>JSON.stringify(HonroMaps.normalize(JSON.parse(HonroMaps.serialize(p))))===JSON.stringify(p)',edited))
    # A separate small authored arena exercises real roof contact, projectiles and objectives.
    arena=editor.evaluate('''()=>{const p=HonroMaps.normalize(HonroWorkshopAPI.getProject()),s=HonroMaps.emptyStage('arena','Physics arena',1600,1000);
      s.terrains=[{id:'floor',type:'solid',points:[{x:0,y:800},{x:1600,y:800},{x:1600,y:1100},{x:0,y:1100}],baseMaterial:'rock',breakable:false},
        {id:'roof',type:'solid',points:[{x:100,y:610},{x:700,y:610},{x:700,y:665},{x:100,y:665}],baseMaterial:'rock',breakable:false}];
      s.units=[HonroUnits.record('archer','p-archer',220,800),HonroUnits.record('hound','target',1200,800,'enemy')];
      s.events=[{id:'greeting',type:'trigger',x:220,y:800,radius:180,label:'Trigger reached',action:null}];
      p.stages=[s];p.activeStageId=s.id;return p}''')
    editor.evaluate('p=>HonroWorkshopAPI.importProject(p)',arena)
    editor.evaluate('HonroWorkshopAPI.select("unit","p-archer")')
    saved=editor.evaluate('HonroWorkshopAPI.exportProject()');state=editor.evaluate('HonroWorkshopAPI.getEditorState()')
    editor.click('[data-tab="play"]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
    frame=editor.frame_locator('#runtimeFrame');play=editor.frames[1]
    play.evaluate('HonroApp.frame=()=>{}');game.evaluate('p=>{HonroApp.launchMap(p,p.activeStageId,{story:false});HonroApp.frame=()=>{}}',arena)
    # Reset both through the real app entry before replaying the exact timestep/input sequence.
    replay='''p=>{const a=HonroApp;a.launchMap(p,p.activeStageId,{story:false});a.frame=()=>{};a.turnNotice=null;const e=a.engine,trace=[];
      for(let i=0;i<420;i++){if(i===8)e.jump(e.active);if(i<130)e.move(1,1/120);if(i===170)e.fire('A01',20,.38);e.tick(1/120);a.missionTick(1/120);
        const u=e.unit('p-archer');trace.push({x:u.x,y:u.y,vx:u.vx,vy:u.vy,grounded:e.grounded(u),surface:e.surface(u.x,u.y-5,u.y+5)?.t?.id||null,hp:u.hp,phase:e.b.phase,projectiles:e.b.projectiles.map(p=>[p.x,p.y,p.vx,p.vy])});}
      return {trace,events:e.b.events,flags:e.b.honroState.flags,shots:e.b.shots};}'''
    left=game.evaluate(replay,arena);right=play.evaluate(replay,arena)
    check('Physics/input/projectile equivalence, 420 fixed steps',left==right)
    check('Roof contact uses actual collision solver',min(row['y'] for row in left['trace'])>=750, min(row['y'] for row in left['trace']))
    check('Actual projectile fired',left['shots']>0,left['shots'])
    editor.click('#stopPlay');check('Stop discards runtime mutations',editor.evaluate('HonroWorkshopAPI.exportProject()')==saved)
    check('Stop restores editor camera and selection',editor.evaluate('HonroWorkshopAPI.getEditorState()')==state)
    check('No iframe left running',editor.locator('#runtimeFrame').count()==0)
    # Actual UI edits, node dragging and asset authoring are tested separately below.
    editor.evaluate('p=>HonroWorkshopAPI.importProject(p)',project)
    editor.click('[data-tool="unit"]');editor.wait_for_timeout(200)
    check('Canonical unit palette renders real assets',editor.locator('[data-unit-preview]').count()>=25)
    editor.select_option('#placeUnitKind','ally:guard');editor.locator('#stageCanvas').click(position={'x':300,'y':500})
    check('One-shot unit placement returns to Select',editor.evaluate('HonroWorkshopAPI.getEditorState().tool')=='select')
    check('Full unit inspector exists',all(editor.locator('#'+i).count()==1 for i in ['stableId','unitFacing','unitLevel','unitRank','unitEncounter','unitBehavior','unitBoss','unitMiniboss','unitOverrides','objectX','objectY']))
    editor.fill('#unitRank','3');editor.locator('#unitRank').press('Tab');check('Human unit property is canonical',editor.evaluate('HonroWorkshopAPI.getProject().stages[0].units.at(-1).rank')==3)
    editor.click('[data-tab="element"]');check('Element independent collision inspector',editor.locator('#assetCollisionMode').count()==1)
    check('Non-input UI text cannot be dragged',editor.locator('.panel-title').first.evaluate('(e)=>getComputedStyle(e).userSelect')=='none')
    # Empty authoring documents must remain editable before terrain is drawn.
    empty=editor.evaluate('''()=>{const p=HonroWorkshopAPI.getProject();p.stages=[HonroMaps.emptyStage('empty')];p.activeStageId='empty';return p}''')
    editor.evaluate('p=>HonroWorkshopAPI.importProject(p)',empty);editor.click('[data-tab="stage"]')
    check('Empty map is editable',editor.evaluate('HonroWorkshopAPI.getProject().activeStageId')=='empty')
    check('No desktop browser exceptions',not errors,errors)
    # Mobile landscape uses the same real app and its own isolated browser storage.
    mobile=browser.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True);listen(mobile)
    mobile.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());mobile.wait_for_function('window.HonroWorkshopAPI')
    mobile.click('[data-tab="play"]');mobile.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
    mp=mobile.frames[1];mp.evaluate('if(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.turnNotice=null;HonroApp.updateHUD(true)')
    mobile.wait_for_timeout(500);mobile.screenshot(path=str(OUT/'mobile-playtest.png'))
    check('Mobile landscape actual HUD and runtime',mp.locator('#battlecanvas').count()==1 and not mp.evaluate('HonroApp.lastError||null'))
    mobile.click('#stopPlay');check('Mobile returns to editor',mobile.locator('#runtimeFrame').count()==0)
    check('No browser exceptions',not errors,errors)
    browser.close()
(ROOT/'reports/integration.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
print('INTEGRATION PASS',len(checks))
