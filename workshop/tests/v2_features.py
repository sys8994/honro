from playwright.sync_api import sync_playwright
from pathlib import Path
import json, math
ROOT=Path('/mnt/data/HONRO_MAP_WORKSHOP_V2')
HTML=(ROOT/'HONRO_MAP_WORKSHOP.html').read_text()
checks=[]
def ck(name, cond, detail=None):
    if not cond: raise AssertionError(f'{name}: {detail}')
    checks.append((name,detail))
    print('PASS',name,detail or '')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1600,'height':950})
    errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(HTML,wait_until='load'); page.wait_for_timeout(200)
    # CSS anti-drag
    us=page.evaluate("()=>getComputedStyle(document.querySelector('.panel-title')).userSelect")
    ck('UI text selection disabled',us=='none',us)
    # Grid setting UI
    page.fill('#gridSize','32');page.locator('#gridSize').press('Tab');page.wait_for_timeout(80)
    grid=page.evaluate('HonroWorkshopAPI.getProject().settings.grid')
    ck('Grid size adjustable',grid==32,grid)
    # terrain optimization through shared API
    before=page.evaluate('HonroWorkshopAPI.exportHonroSpec().grounds[0].top.length')
    page.evaluate("HonroWorkshopAPI.applyCommands([{op:'terrain.optimize',id:'ground_main',epsilon:10}])")
    after=page.evaluate('HonroWorkshopAPI.exportHonroSpec().grounds[0].top.length')
    ck('Terrain epsilon optimization reduces nodes',after<before,{'before':before,'after':after})
    # solid / overhang data support and export
    page.evaluate("HonroWorkshopAPI.applyCommands([{op:'terrain.addSolid',id:'overhang_test',name:'Overhang',points:[[100,2200],[650,2200],[650,2310],[100,2310]],material:'rock'}])")
    solids=page.evaluate('HonroWorkshopAPI.exportHonroSpec().solids')
    ck('Solid polygon exported for cave/overhang',any(x['id']=='overhang_test' for x in solids),len(solids))
    # ceiling collision in playtest
    player_id=page.evaluate("HonroWorkshopAPI.getProject().stages[0].units[0].id")
    page.evaluate("id=>HonroWorkshopAPI.applyCommands([{op:'unit.move',id,x:220,y:2450}])",player_id)
    page.click('[data-tab="play"]');page.wait_for_timeout(100)
    page.keyboard.press('Space')
    min_y=1e9
    for _ in range(25):
        page.wait_for_timeout(30)
        st=page.evaluate('HonroWorkshopAPI.getPlayState()')
        if st: min_y=min(min_y,st['y'])
    ck('Playtest respects solid underside ceiling',min_y>=2355,round(min_y,2))
    # element optimizer
    page.click('[data-tab="element"]');page.wait_for_timeout(100)
    nodes_before=page.evaluate("HonroWorkshopAPI.getProject().library.find(a=>a.id==='rock_large').visual.reduce((n,s)=>n+s.points.length,0)")
    page.evaluate("HonroWorkshopAPI.applyCommands([{op:'asset.optimize',id:'rock_large',epsilon:9}])")
    nodes_after=page.evaluate("HonroWorkshopAPI.getProject().library.find(a=>a.id==='rock_large').visual.reduce((n,s)=>n+s.points.length,0)")
    ck('Element polygon optimizer reduces nodes',nodes_after<nodes_before,{'before':nodes_before,'after':nodes_after})
    # ctrl drag element vertex -> grid snap
    page.click('[data-edit-asset="rock_small"]');page.wait_for_timeout(50)
    asset=page.evaluate("HonroWorkshopAPI.getProject().library.find(a=>a.id==='rock_small')")
    pt=asset['visual'][0]['points'][0]
    box=page.locator('#elementCanvas').bounding_box(); assert box
    ev=page.evaluate('HonroWorkshopAPI.getEditorState().elementView')
    sx=box['x']+box['width']/2+(pt['x']-ev['x'])*ev['zoom']; sy=box['y']+box['height']/2+(pt['y']-ev['y'])*ev['zoom']
    tx=box['x']+box['width']/2+(53-ev['x'])*ev['zoom']; ty=box['y']+box['height']/2+(67-ev['y'])*ev['zoom']
    page.keyboard.down('Control');page.mouse.move(sx,sy);page.mouse.down();page.mouse.move(tx,ty,steps=4);page.mouse.up();page.keyboard.up('Control');page.wait_for_timeout(50)
    moved=page.evaluate("HonroWorkshopAPI.getProject().library.find(a=>a.id==='rock_small').visual[0].points[0]")
    ck('Ctrl+drag element node snaps to grid',moved['x']%32==0 and moved['y']%32==0,moved)
    # whole element polygon click-select + drag
    asset_now=page.evaluate("HonroWorkshopAPI.getProject().library.find(a=>a.id==='rock_small')")
    sh=asset_now['visual'][0]['points']
    cx=sum(q['x'] for q in sh)/len(sh); cy=sum(q['y'] for q in sh)/len(sh)
    ev=page.evaluate('HonroWorkshopAPI.getEditorState().elementView')
    def epos(x,y): return (box['x']+box['width']/2+(x-ev['x'])*ev['zoom'],box['y']+box['height']/2+(y-ev['y'])*ev['zoom'])
    s0=epos(cx,cy); s1=epos(cx+80,cy+40)
    before_shape=page.evaluate("HonroWorkshopAPI.getProject().library.find(a=>a.id==='rock_small').visual[0].points.map(p=>({...p}))")
    page.mouse.move(*s0);page.mouse.down();page.mouse.move(*s1,steps=5);page.mouse.up();page.wait_for_timeout(60)
    after_shape=page.evaluate("HonroWorkshopAPI.getProject().library.find(a=>a.id==='rock_small').visual[0].points")
    dx=round(after_shape[0]['x']-before_shape[0]['x'],1);dy=round(after_shape[0]['y']-before_shape[0]['y'],1)
    ck('Element polygon can be selected and dragged as a whole',abs(dx-80)<2 and abs(dy-40)<2,{'dx':dx,'dy':dy})
    # polygon addition UI
    count_before=page.evaluate("HonroWorkshopAPI.getProject().library.find(a=>a.id==='rock_small').visual.length")
    page.click('[data-etool="polygon"]')
    # world points in element canvas
    ev=page.evaluate('HonroWorkshopAPI.getEditorState().elementView')
    def ep(x,y): return (box['x']+box['width']/2+(x-ev['x'])*ev['zoom'],box['y']+box['height']/2+(y-ev['y'])*ev['zoom'])
    for x,y in [(-100,80),(-45,120)]: page.mouse.click(*ep(x,y))
    page.mouse.dblclick(*ep(0,78));page.wait_for_timeout(80)
    count_after=page.evaluate("HonroWorkshopAPI.getProject().library.find(a=>a.id==='rock_small').visual.length")
    ck('Element editor can add polygon',count_after==count_before+1,{'before':count_before,'after':count_after})
    # stage auto-select after placement
    page.click('[data-tab="stage"]');page.wait_for_timeout(80)
    page.click('[data-asset="rock_small"]')
    sb=page.locator('#stageCanvas').bounding_box(); assert sb
    page.mouse.click(sb['x']+sb['width']*.56,sb['y']+sb['height']*.55);page.wait_for_timeout(80)
    active=page.locator('[data-tool].active').get_attribute('data-tool')
    ck('Single element placement returns to select mode',active=='select',active)

    # ctrl drag stage terrain node -> grid snap, even when decorations overlap terrain
    stage=page.evaluate('HonroWorkshopAPI.getProject().stages[0]')
    ground=next(t for t in stage['terrains'] if t['id']=='ground_main')
    cp=ground['control'][4]
    sv=page.evaluate('HonroWorkshopAPI.getEditorState().stageView')
    sb=page.locator('#stageCanvas').bounding_box(); assert sb
    sx=sb['x']+sb['width']/2+(cp['x']-sv['x'])*sv['zoom']; sy=sb['y']+sb['height']/2+(cp['y']-sv['y'])*sv['zoom']
    target_world={'x':cp['x']+57,'y':cp['y']-61}
    tx=sb['x']+sb['width']/2+(target_world['x']-sv['x'])*sv['zoom']; ty=sb['y']+sb['height']/2+(target_world['y']-sv['y'])*sv['zoom']
    page.keyboard.down('Control');page.mouse.move(sx,sy);page.mouse.down();page.mouse.move(tx,ty,steps=5);page.mouse.up();page.keyboard.up('Control');page.wait_for_timeout(80)
    moved_stage=page.evaluate("HonroWorkshopAPI.getProject().stages[0].terrains.find(t=>t.id==='ground_main').control[4]")
    ck('Ctrl+drag stage node snaps to grid',moved_stage['x']%32==0 and moved_stage['y']%32==0,moved_stage)
    # whole terrain click-select + drag from its filled body
    ground_before=page.evaluate("HonroWorkshopAPI.getProject().stages[0].terrains.find(t=>t.id==='ground_main').control.map(p=>({...p}))")
    sv=page.evaluate('HonroWorkshopAPI.getEditorState().stageView')
    wx,wy=1900,3000; dxw,dyw=55,-65
    axy=(sb['x']+sb['width']/2+(wx-sv['x'])*sv['zoom'],sb['y']+sb['height']/2+(wy-sv['y'])*sv['zoom'])
    bxy=(sb['x']+sb['width']/2+(wx+dxw-sv['x'])*sv['zoom'],sb['y']+sb['height']/2+(wy+dyw-sv['y'])*sv['zoom'])
    page.mouse.move(*axy);page.mouse.down();page.mouse.move(*bxy,steps=5);page.mouse.up();page.wait_for_timeout(80)
    ground_after=page.evaluate("HonroWorkshopAPI.getProject().stages[0].terrains.find(t=>t.id==='ground_main').control")
    tdx=round(ground_after[0]['x']-ground_before[0]['x'],1);tdy=round(ground_after[0]['y']-ground_before[0]['y'],1)
    ck('Stage terrain body can be click-selected and dragged',abs(tdx-dxw)<3 and abs(tdy-dyw)<3,{'dx':tdx,'dy':tdy})
    # toolbar solid exists
    ck('Solid polygon tool visible',page.locator('[data-tool="solid"]').count()==1)
    # no runtime exceptions
    ck('No browser runtime errors',not errors,errors)
    page.screenshot(path=str(ROOT/'WORKSHOP_V2_PREVIEW.png'))
    browser.close()
print('TOTAL',len(checks))
