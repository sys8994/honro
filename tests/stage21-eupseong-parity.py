"""Browser acceptance against the two real static entry points, including actual iframe playtest."""
import base64
import io
import json
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
from story_browser_server import story_base_url
BASE=story_base_url()

OUT=ROOT/'_local/reports/stage21-eupseong/parity';OUT.mkdir(parents=True,exist_ok=True)
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
    editor.goto(BASE+'/HONRO_WORKSHOP.html');editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
    game=browser.new_page(viewport={'width':1440,'height':900});listen(game)
    game.goto(BASE+'/HONRO.html');game.wait_for_function('window.HonroApp')
    game.evaluate('HonroApp.frame=()=>{}')
    project=editor.evaluate('HonroWorkshopAPI.getProject()')
    stage_count=len(project['stages'])
    check('Canonical Stage 1–30 loaded',stage_count==30)
    check('Edit mode has no audio engine',editor.evaluate('typeof window.HonroApp')=='undefined')
    # Fix both actual host canvas viewports. Screenshots read the world layer, overlay is separate.
    editor.add_style_tag(content='#stageView .canvas-wrap{position:fixed;left:0;top:0;width:960px;height:540px;z-index:99}#stageToolbar,.canvas-help,.hud-overlay{display:none!important}')
    game.add_style_tag(content='.battle-view{position:fixed!important;left:0!important;top:0!important;width:960px!important;height:540px!important}#battlecanvas{width:960px!important;height:540px!important}')
    editor.evaluate('HonroWorkshopAPI.setOverlay(false)')
    for sid in [21]:
        editor.evaluate('id=>HonroWorkshopAPI.selectStage("stage-"+id)',sid)
        st=project['stages'][sid-1]
        camera={'x':st['width']/2,'y':st['height']/2,'zoom':.2}
        editor.evaluate('v=>HonroWorkshopAPI.setCamera(v)',camera)
        actual_camera=editor.evaluate('HonroWorkshopAPI.getEditorState().stageView')
        # Compare fresh authored state before cinematic blocking changes actor positions.
        # World pixels share a renderer; objective labels use each host's HUD
        # safe area and are checked through their own UI/browser tests.
        editor.evaluate('''()=>{HonroWorkshopAPI.getRuntime().scene.missionTargets=[];HonroWorkshopAPI.render()}''')
        game.evaluate('''([id,camera])=>{const a=HonroApp,st=HONRO_PROJECT.stages[id-1];
          a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(st)};
          for(let i=1;i<=HONRO_PROJECT.stages.length;i++)a.profile.cleared[i]={};a.launchMap(HONRO_PROJECT,'stage-'+id,{story:false});
          a.turnNotice=null;Object.assign(a.scene,{time:0,walkTime:0,manual:true,storyTween:null,goalFocus:null,cinematic:null,x:camera.x,y:camera.y,scale:camera.zoom});
          a.scene.missionTargets=[];a.scene.editorView=true;a.scene.render(a.engine,0,'',.6,false,0);a.scene.editorView=false;
        }''',[sid,actual_camera])
        a=canvas_image(editor,'#stageCanvas');b=canvas_image(game,'#battlecanvas')
        assert a.size==b.size,(a.size,b.size)
        diff=ImageChops.difference(a,b).convert('RGB');pixels=list(diff.get_flattened_data() if hasattr(diff,'get_flattened_data') else diff.getdata());changed=sum(max(px)>3 for px in pixels);ratio=changed/len(pixels)
        if sid in [1,2,8,10] or ratio>=.0001:
            a.save(OUT/f'editor-stage-{sid}.png');b.save(OUT/f'game-stage-{sid}.png');diff.save(OUT/f'diff-stage-{sid}.png')
        check(f'Rendering equivalence Stage {sid}',ratio<.0001,{'differentPixels':changed,'ratio':ratio,'bbox':diff.getbbox()})
    editor.reload();editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
    editor.evaluate('HonroWorkshopAPI.selectStage("stage-21")')
    saved=editor.evaluate('HonroWorkshopAPI.exportProject()');state=editor.evaluate('HonroWorkshopAPI.getEditorState()')
    editor.click('[data-tab="play"]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
    play=editor.frames[1]
    check('Actual Stage21 iframe',play.evaluate('HonroApp.engine.b.honroStage')==21)
    play.evaluate('HonroApp.frame=()=>{};if(HonroApp.dialogue)HonroStory.finish(HonroApp)')
    editor.screenshot(path=str(OUT/'iframe.png'))
    editor.click('#stopPlay')
    check('Stop preserves project',editor.evaluate('HonroWorkshopAPI.exportProject()')==saved)
    check('Stop restores editor camera',editor.evaluate('HonroWorkshopAPI.getEditorState()')==state)
    check('Iframe disposed',editor.locator('#runtimeFrame').count()==0)
    check('No browser errors',not errors,errors)
    browser.close()
(OUT/'result.json').write_text(json.dumps({'checks':checks,'errors':errors},indent=2))
