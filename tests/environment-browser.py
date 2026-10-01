"""Focused real-browser check for finite-depth scenery and Workshop editing."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

out = ROOT / '_local/reports/environment-depth'
out.mkdir(parents=True, exist_ok=True)
rows = []
errors = []

with sync_playwright() as p:
    browser = launch(p)
    game = browser.new_page(viewport={'width': 1280, 'height': 720})
    game.on('pageerror', lambda e: errors.append(str(e)))
    game.goto((ROOT / 'HONRO.html').as_uri())
    game.wait_for_function('window.HonroApp && window.HonroEnvironment')
    game.evaluate('HonroApp.frame=()=>{}')
    for sid in range(1, 11):
        for zoom in (.16, 1.65):
            for edge in (0, 1):
                result = game.evaluate('''([sid,zoom,edge])=>{
                  const a=HonroApp,st=HONRO_PROJECT.stages[sid-1];a.launchMap(HONRO_PROJECT,st.id,{story:false});
                  a.dialogue=null;a.turnNotice=null;
                  const s=a.scene,w=s.canvas.clientWidth,h=s.canvas.clientHeight;
                  Object.assign(s,{manual:true,storyTween:null,goalFocus:null,cinematic:null,
                    x:edge?st.width:0,y:edge?st.height:0,scale:zoom,time:0});
                  const t=performance.now();s.render(a.engine,0,'',.6,false,0);
                  const ms=performance.now()-t,pixel=s.ctx.getImageData(0,0,1,1).data;
                  return {stage:sid,zoom,edge,x:s.x,y:s.y,ms,alpha:pixel[3],placements:a.engine.b.honroEnvironment.placements.length};
                }''', [sid, zoom, edge])
                assert result['alpha'] == 255 and result['placements'] > 0, result
                rows.append(result)
    for sid in range(1, 11):
        game.evaluate('''sid=>{const a=HonroApp,st=HONRO_PROJECT.stages[sid-1];a.launchMap(HONRO_PROJECT,st.id,{story:false});
          a.dialogue=null;a.turnNotice=null;Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,
          x:st.width/2,y:st.height*.5,scale:.66,time:0});a.scene.render(a.engine,0,'',.6,false,0)}''', sid)
        game.locator('#battlecanvas').screenshot(path=str(out / f'stage-{sid}-normal.png'))

    editor = browser.new_page(viewport={'width': 1440, 'height': 900})
    editor.on('pageerror', lambda e: errors.append(str(e)))
    editor.goto((ROOT / 'HONRO_WORKSHOP.html').as_uri())
    editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
    editor.evaluate('HonroWorkshopAPI.selectStage("stage-3")')
    editor.evaluate('HonroWorkshopAPI.applyCommands([{op:"scenery.place",id:"depth-drag-check",assetId:"ancient_pine",depthLayer:"L2",x:1800,y:1600,scale:1}])')
    editor.evaluate('HonroWorkshopAPI.setCamera({x:1800,y:1600,zoom:.66})')
    editor.locator('[data-tool="select"]').click()
    bounds = editor.evaluate('''()=>{const api=HonroWorkshopAPI,st=api.getProject().stages[2],e=st.environment.placements.find(x=>x.id==='depth-drag-check');
      return HonroEnvironment.screenBounds(api.getProject().library.find(a=>a.id===e.assetId),e,api.getEditorState().stageView,
        document.querySelector('#stageOverlay').clientWidth,document.querySelector('#stageOverlay').clientHeight,st)}''')
    canvas = editor.locator('#stageOverlay').bounding_box()
    x = canvas['x'] + bounds['x'] + bounds['w']*.5
    y = canvas['y'] + bounds['y'] + bounds['h']*.43
    editor.mouse.move(x, y)
    editor.mouse.down()
    editor.mouse.move(x+42, y+16, steps=5)
    editor.mouse.up()
    selected = editor.evaluate('HonroWorkshopAPI.getEditorState().selected')
    assert selected == {'type':'scenery','id':'depth-drag-check'}, selected
    moved = editor.evaluate('''()=>{const api=HonroWorkshopAPI,p=api.getProject(),st=p.stages[2],e=st.environment.placements.find(x=>x.id==='depth-drag-check');
      const scale=api.getEditorState().stageView.zoom,ratio=HonroEnvironment.ratio(st,'L2',scale);
      return {x:e.x,y:e.y,expectedX:1800+42/(scale*ratio),expectedY:1600+16/(scale*ratio)}}''')
    assert abs(moved['x']-moved['expectedX']) < 2 and abs(moved['y']-moved['expectedY']) < 2, moved
    snapshot = editor.evaluate('JSON.parse(HonroWorkshopAPI.exportProject())')
    editor.evaluate('p=>HonroWorkshopAPI.importProject(p)', snapshot)
    reloaded = editor.evaluate('''()=>{const st=HonroWorkshopAPI.getProject().stages[2];return st.environment.placements.find(e=>e.id==='depth-drag-check')}''')
    assert reloaded['x'] == moved['x'] and reloaded['y'] == moved['y'] and reloaded['depthLayer'] == 'L2', reloaded
    editor.locator('#stageCanvas').screenshot(path=str(out / 'stage-3-editor.png'))
    browser.close()

assert not errors, errors
report={'views':len(rows),'maxRenderMs':round(max(r['ms'] for r in rows),2),'meanRenderMs':round(sum(r['ms'] for r in rows)/len(rows),2),'drag':moved,'pageErrors':errors}
(out / 'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('PASS environment browser',report)
