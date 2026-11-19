"""Unrun native Workshop smoke. Fixture is simple non-art terrain; no existing stages imported."""
import hashlib,json,os,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright

# Independently staged world geometry based on E's rhythm, not pixel traces.
# Shallow start shoulder → two unequal descents → short rounded transition →
# staggered climb and recovery ridge. Bottom two points are a closed fill only.
WEST=[[0,1370],[94,1364],[201,1372],[322,1408],[423,1450],[504,1460],
     [571,1478],[643,1522],[722,1584],[801,1637],[862,1657],
     [919,1659],[980,1645],[1052,1617],[1122,1571],[1211,1518],
     [1302,1498],[1374,1490],[1468,1438],[1552,1381],[1672,1357],[1800,1325],[1900,1313]]
# Ground is still deliberately continuous through the future bridge site: no
# false drop, duplicate crossing or actual bridge asset in this graybox.
CENTRAL=[[2028,1264],[2142,1232],[2225,1231],[2358,1174],[2474,1101],
 [2625,1020],[2808,966],[2950,955],[3050,980],[3168,1004],[3264,1002],
 [3382,1047],[3520,1118],[3660,1146],[3778,1158],[3890,1190],[3982,1198],[4080,1166],
 [4180,1149],[4300,1139],[4422,1092]]
EAST=[[4580,1045],[4699,984],[4860,921],[4992,918],[5088,892],[5186,889],
 [5290,926],[5387,950],[5490,929],[5600,871],[5727,811],
 [5826,744],[5920,709],[6012,691],[6100,686],[6208,690],[6330,692],[6500,690]]
TOP=WEST+CENTRAL+EAST
RING=TOP+[[6500,4300],[0,4300]]
WIDTH,HEIGHT=6500,4300
NAME='Act 5-2 E full ordinary ground graybox'
p=Path(sys.argv[1]);p.mkdir(parents=True,exist_ok=True); url=sys.argv[2]
assert url.startswith('http://127.0.0.1:') and url.endswith('/HONRO_WORKSHOP.html')
def get(t):
    return t.evaluate("HonroWorkshopAPI.queryScene().stage")
def digest(data):
    return hashlib.sha256(data).hexdigest()
with sync_playwright() as play:
    b=play.chromium.launch(executable_path=os.environ['HONRO_CHROME'],headless=True,args=['--no-sandbox'])
    def open_page():
        c=b.new_context(viewport={'width':1500,'height':900},accept_downloads=True)
        t=c.new_page();t.goto(url);t.wait_for_function('window.HonroWorkshopAPI')
        return t
    t=open_page()
    diagnostics={'page_errors':[],'dialogs':[],'states':[]}
    t.on('pageerror',lambda error: diagnostics['page_errors'].append(str(error)[:4000]))
    def handle(dialog):
        diagnostics['dialogs'].append({'type':dialog.type,'message':dialog.message[:1200]})
        dialog.dismiss()
    t.on('dialog',handle)
    def summary(name):
        d=t.evaluate("""()=>{
          const {stage:s}=HonroWorkshopAPI.queryScene(),p=HonroWorkshopAPI.getContext();
          return {id:s.id,name:s.name,width:s.width,height:s.height,terrain_count:s.terrains.length,
             placement_count:s.elements.length+s.environment.placements.length,asset_count:p.availableAssets.length,
             units:s.units.map(u=>[u.kind??u.cls,u.team,u.x,u.y]),
             new_dialog_open:document.querySelector('#newStageModal').classList.contains('open'),
             toast:document.querySelector('#toast').textContent};
        }""")
        diagnostics['states'].append({'checkpoint':name,'data':d})
        t.screenshot(path=str(p/f'01-{name}.png'))
        (p/'blank-diagnostics.json').write_text(json.dumps(diagnostics,ensure_ascii=False,indent=2))
        return d
    def true_blank(cur):
        return (cur['name']==NAME and cur['width']==WIDTH and cur['height']==HEIGHT and
          cur['terrain_count']==0 and cur['placement_count']==0 and len(cur['units'])==1
          and cur['units'][0]==['archer','player',220,1320])
    before=summary('stock-ui-start')
    diag_case='manual-import-of-verified-blank-scratch'
    # Actual native creation rollback was already verified. Import a clean one-stage
    # private file through the standard file chooser, without copying the loaded project.
    try:
        scratch=t.evaluate("""([n,w,h])=>{
           const s=HonroMaps.emptyStage('qa-blank-solid-scratch',n,w,h);
           s.environment.placements=[];
           s.units.push(HonroUnits.record('archer','qa-new-fixture-archer',220,1320,'player'));
           // An unreachable-at-start QA destination prevents the unmodified stock
           // no-enemy objective from instantly winning before walking. No rendered mesh.
           s.objectives.push({id:'qa-contact-destination',type:'reach',label:'Mechanical test destination',x:6250,y:691,radius:50,required:true});
           const sentinel={id:'qa-unplaced-empty',name:'Empty toolbar sentinel',category:'scenery',visual:[],
             collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
           sentinel.reference=HonroEnvironment.referenceForLegacyAsset(sentinel);
           const project={schema:'honro-map',version:HonroMaps.VERSION,activeStageId:s.id,
             name:'Blank stock Solid mechanical fixture',environmentVersion:HonroEnvironment.VERSION,
             settings:{autosave:false,grid:10},stages:[s],library:[sentinel]};
           const q=HonroMaps.finalize(project);
           if(q.stages.length!==1||q.stages[0].terrains.length||q.stages[0].elements.length||
              q.stages[0].environment.placements?.length||q.library[0].visual.length||q.library[0].collision.length)throw Error('Scratch zero-content guard failed');
           return q;
        }""",[NAME,WIDTH,HEIGHT])
        with t.expect_file_chooser() as ask:t.locator('#importBtn').click()
        ask.value.set_files({'name':'qa-empty-scratch.honro-map.json','mimeType':'application/json',
                             'buffer':json.dumps(scratch,ensure_ascii=False).encode()})
        t.wait_for_function("HonroWorkshopAPI.queryScene().stage.id==='qa-blank-solid-scratch'",timeout=12000)
    finally:after=summary('manual-blank-file-import-result')
    assert after['id']=='qa-blank-solid-scratch' and after['asset_count']==1,'Stock scratch import did not isolate the project'
    assert after['id']!=before['id'] and true_blank(after),f'Stock blank state failed exact gates: {after}'
    diagnostics['entry_case']=diag_case
    (p/'blank-diagnostics.json').write_text(json.dumps(diagnostics,ensure_ascii=False,indent=2))
    s0=get(t)
    t.locator('#overlayToggle').uncheck()
    t.screenshot(path=str(p/'01-true-blank.png'))
    t.locator('[data-tool=solid]').click()
    vertices=[]
    def screen(xy):
        return t.evaluate("""([x,y])=>{
          const c=document.querySelector('#stageCanvas'),r=c.getBoundingClientRect(),v=HonroWorkshopAPI.getEditorState().stageView;
          return [r.left+r.width/2+(x-v.x)*v.zoom,r.top+r.height/2+(y-v.y)*v.zoom];
        }""",xy)
    for idx,xy in enumerate(RING):
        t.evaluate('([x,y])=>HonroWorkshopAPI.setCamera({x,y,zoom:.9})',xy)
        q=screen(xy)
        if not t.evaluate("q=>document.elementFromPoint(...q)?.id==='stageCanvas'",q):
            t.screenshot(path=str(p/'01-solid-input-hit-failure.png'))
            (p/'pointer-diagnostic.json').write_text(json.dumps({'knots_clicked':len(vertices),'index':idx,'world':xy,'screen':q},indent=2))
            raise AssertionError(f'Configured camera failed to expose owned pointer {idx}: {xy}')
        edge=xy[0] in (0,WIDTH)
        if edge:t.keyboard.down('Control')
        try:t.mouse.click(*q)
        finally:
            if edge:t.keyboard.up('Control')
        vertices.append(q)
    t.keyboard.press('Enter')
    t.evaluate('()=>HonroWorkshopAPI.setCamera({x:950,y:1520,zoom:.5})')
    t.screenshot(path=str(p/'02-pointer-solid-enter.png'))
    s=get(t); assert len(s['terrains'])==1 and not s['elements']
    a=s['terrains'][0];assert a['type']=='solid' and len(a['points'])==len(RING)
    assert all(max(abs(q['x']-x),abs(q['y']-y))<=3 for q,(x,y) in zip(a['points'],RING))
    t.screenshot(path=str(p/'02-stage-visible-overlay-off.png'))
    # Test real dragging of an edited route knot, not just an untouched save.
    t.locator('[data-tool=select]').click(); t.locator('#overlayToggle').check(); v=screen(RING[5]);t.mouse.move(*v);t.mouse.down();t.mouse.move(v[0]+4,v[1]-11,steps=5);t.mouse.up()
    t.screenshot(path=str(p/'02-pointer-solid-dragged.png'))
    s=get(t);q=s['terrains'][0]
    assert sum(x!=y for x,y in zip(q['points'],a['points']))==1 and q['points'][5]['y']<a['points'][5]['y']-8
    t.locator('#overlayToggle').uncheck()
    preview=t.evaluate("""()=>{
      const p=HonroWorkshopAPI.getProject(),st=p.stages.find(s=>s.id===p.activeStageId);
      const {engine}=HonroWorkshopAPI.getRuntime(),art=st.terrains[0];
      const compiled=HonroMaps.compile(st,p).terrain.find(q=>q.id===art.id);
      const live=engine.b.terrain.find(q=>q.id===art.id);
      return {id:art.id,points:art.points,compiled,live};
    }""")
    assert preview['compiled']['vertices']==preview['live']['vertices']
    assert all(q['points'][i]['x']==RING[i][0] and q['points'][i]['y']==RING[i][1] for i in (0,len(RING)-3,len(RING)-2,len(RING)-1)),'Exact stock-grid boundary roles not authored'
    saved=p/'private-smoke.honro-map.json'
    with t.expect_download() as event:t.locator('#exportBtn').click()
    event.value.save_as(saved); raw=saved.read_bytes()
    fresh=open_page()
    with fresh.expect_file_chooser() as event:fresh.locator('#importBtn').click()
    event.value.set_files(saved)
    fresh.wait_for_function("(n)=>HonroWorkshopAPI.queryScene().stage.name===n",arg=NAME)
    assert get(fresh)['terrains']==s['terrains']
    editor_original=fresh
    # Stock File Export does not call the terrain-domain author. Preserve manual
    # GUI bytes and use an independently labeled exact stock-domain conversion.
    domain=editor_original.evaluate("""()=>{
      const raw=HonroWorkshopAPI.getProject(),before=raw.stages[0];
      const authored=HonroMaps.finalize(HonroTerrainDomain.author(raw)),after=authored.stages[0];
      const un=HonroMaps.compile(before,raw),co=HonroMaps.compile(after,authored);
      const original=un.terrain[0],projected=co.terrain[0],world=co.worldTerrain[0];
      return {bytes:JSON.stringify(authored),original:original.vertices,projected:projected.vertices,
         world:world.vertices,play:after.playBounds,terrain:after.terrainBounds,owner:world.id};
    }""")
    domain_bytes=domain.pop('bytes').encode()
    (p/'domain-proof.json').write_text(json.dumps({'original_saved_sha256':digest(raw),'domain_sha256':digest(domain_bytes),**domain},indent=2))
    assert domain['play']=={'left':0,'top':0,'right':6500,'bottom':4300}
    assert domain['original']==domain['projected']==preview['compiled']['vertices'],'Exterior projection changed original stock simulation polygon'
    assert min(v['x'] for v in domain['world'])<0 and max(v['x'] for v in domain['world'])>6500
    cam=[]
    def capture_saved_view(label, request, extended):
        data=fresh.evaluate("""([x,y,zoom])=>{
          HonroWorkshopAPI.setCamera({x,y,zoom});
          const v=HonroWorkshopAPI.getEditorState().stageView,c=document.querySelector('#stageCanvas');
          const a=HonroWorkshopAPI.queryScene().stage.terrains[0],b=HonroWorkshopAPI.getRuntime().engine.b;
          const r=a.points.map(v=>[v.x,v.y]),s=HonroBounds.viewport(v,c.clientWidth,c.clientHeight);
          const west=Math.min(...r.map(p=>p[0])),east=Math.max(...r.map(p=>p[0])),bottom=Math.max(...r.map(p=>p[1]));
          return {actual:[v.x,v.y,v.zoom],view:s,bounds:[west,east,bottom],solidId:a.id,
                  exteriorActive:HonroTerrainDomain.active(b),overlayOn:document.querySelector('#overlayToggle').checked};
        }""",request)
        fresh.screenshot(path=str(p/f'03-{label}-overlay-off.png'))
        cam.append({'label':label,'requested':request,'sha256':digest(domain_bytes if extended else raw),**data})
    fresh.locator('#overlayToggle').uncheck()
    capture_saved_view('stock-original-west-edge',[0,1450,.5],False)
    fresh=open_page()
    with fresh.expect_file_chooser() as ask:fresh.locator('#importBtn').click()
    ask.value.set_files({'name':'qa-stock-domain-continuation.honro-map.json','mimeType':'application/json','buffer':domain_bytes})
    fresh.wait_for_function("HonroWorkshopAPI.queryScene().stage.terrainDomainVersion===1")
    fresh.locator('#overlayToggle').uncheck()
    for label,v in [('full',[3250,1430,.14]),('west',[850,1490,.5]),
                    ('future-bridge-seat',[3970,1150,.5]),('east',[5525,1050,.5]),
                    ('left-extreme',[-320,1340,.5]),('right-extreme',[6820,1010,.5])]:
        capture_saved_view('stock-continued-'+label,v,True)
    (p/'camera-proof.json').write_text(json.dumps(cam,indent=2))
    assert all(not c['overlayOn'] and c['exteriorActive'] and c['view']['left']>c['bounds'][0]+5
      and c['view']['right']<c['bounds'][1]-5 and c['view']['bottom']<c['bounds'][2]-5 for c in cam[1:]),'Stock continued outer closure enters a checked camera'
    # The verified whole contour was replayed with actual pointers, not loaded as a prior project.
    bridge_name='E central flush bridge - native neutral material proof'
    aid='';span=[3790,3890,3982,4080,4150];center=3982
    def ground_at(t,x):
        return t.evaluate("""x=>{
          const b=HonroWorkshopAPI.getRuntime().engine.b;
          const h=HonroMapEngine.surfaceY(b.terrain,x,1200);
          if(!h)throw Error('Missing intended ordinary sole ground at '+x);
          return h.y;
        }""",x)
    surfaces=[ground_at(fresh,x) for x in span]
    anchorY=surfaces[2]
    deck=[(x-center,y-anchorY) for x,y in zip(span,surfaces)]
    camera_seat=[3982,1160,.5]
    capture_saved_view('native-bridge-before',camera_seat,True)
    base_stage=get(fresh)
    stage_id=base_stage['id']
    def props(t):
        return t.evaluate("n=>HonroWorkshopAPI.getProject().library.find(x=>x.name===n)",bridge_name)
    def field(t,selector,value):
        el=t.locator(selector);el.fill(value);el.press('Tab')
    def asset_pointer(t,pt):
        q=t.evaluate("""([x,y])=>{
          const c=document.querySelector('#elementCanvas'),r=c.getBoundingClientRect(),v=HonroWorkshopAPI.getEditorState().elementView;
          const px=r.left+r.width/2+(x-v.x)*v.zoom,py=r.top+r.height/2+(y-v.y)*v.zoom;
          return {x:px,y:py,hit:document.elementFromPoint(px,py)?.id};
        }""",pt)
        if q['hit']!='elementCanvas':
            t.screenshot(path=str(p/'08-bridge-asset-pointer-blocked.png'))
            raise AssertionError(f'Actual Element canvas pointer outside: {pt}, {q}')
        t.mouse.click(q['x'],q['y'])
    def face(pts):
        fresh.locator('[data-etool=polygon]').click()
        for pt in pts:asset_pointer(fresh,pt)
        fresh.keyboard.press('Enter')
    fresh.locator('[data-tab=element]').click()
    fresh.locator('#newAsset').click()
    field(fresh,'#assetName',bridge_name)
    fresh.locator('#assetCollision').uncheck()
    # The empty native record displays a stock 'wood' fallback before any
    # onChange. Commit an actual distinct value on this unplaced art-only asset,
    # then commit wood through the same real field; never infer from label text.
    field(fresh,'#assetMaterial','stone')
    fresh.wait_for_function("n=>HonroWorkshopAPI.getProject().library.find(x=>x.name===n)?.material==='stone'",arg=bridge_name,timeout=4000)
    field(fresh,'#assetMaterial','wood')
    fresh.wait_for_function("n=>HonroWorkshopAPI.getProject().library.find(x=>x.name===n)?.material==='wood'",arg=bridge_name,timeout=4000)
    field(fresh,'#assetLayer','prop')
    temp=props(fresh)['visual'][0]
    rail=[[-157,-76],[-57,-53],[52,-51],[144,-72],[145,-63],[53,-43],[-57,-44],[-157,-66]]
    other_faces=(
      deck+[(x,y+13) for x,y in reversed(deck)],
      [[-176,deck[0][1]+7],[-142,deck[0][1]+6],[-136,deck[0][1]+30],[-182,deck[0][1]+27]],
      [[125,deck[-1][1]+8],[155,deck[-1][1]+5],[177,deck[-1][1]+11],[177,deck[-1][1]+25],[126,deck[-1][1]+31]],
      [[-150,-78],[-143,-77],[-143,deck[0][1]+5],[-151,deck[0][1]+6]],
      [[135,-75],[144,-76],[145,deck[-1][1]+4],[136,deck[-1][1]+5]])
    faces=[rail,*other_faces]
    def camera_fit():
        return fresh.evaluate("""faces=>{
          const c=document.querySelector('#elementCanvas'),r=c.getBoundingClientRect(),v=HonroWorkshopAPI.getEditorState().elementView;
          const project=([x,y])=>[r.left+r.width/2+(x-v.x)*v.zoom,r.top+r.height/2+(y-v.y)*v.zoom];
          const projected=faces.map(f=>f.map(project));
          const checks=projected.flat().map(([x,y])=>({x,y,hit:document.elementFromPoint(x,y)?.id,
             padding:Math.min(x-r.left,r.right-x,y-r.top,r.bottom-y)}));
          const minGapPx=Math.min(...projected.flatMap(f=>f.map(([x,y],i)=>Math.hypot(x-f[(i+1)%f.length][0],y-f[(i+1)%f.length][1]))));
          return {zoom:v.zoom,canvas:[r.left,r.top,r.width,r.height],minGapPx,checks,center:[r.left+r.width/2,r.top+r.height/2]};
        }""",faces)
    states=[]
    result=camera_fit();states.append(result)
    fit=lambda v:v['minGapPx']>=4 and all(q['hit']=='elementCanvas' and q['padding']>=8 for q in v['checks'])
    for wheel in (150,40,40,40):
        if fit(result):break
        if result['minGapPx']<4:break
        fresh.mouse.move(*result['center'])
        prior=result['zoom']
        fresh.mouse.wheel(0,wheel)
        fresh.wait_for_function('z=>HonroWorkshopAPI.getEditorState().elementView.zoom<z',arg=prior,timeout=2000)
        result=camera_fit();states.append(result)
    fresh.screenshot(path=str(p/'08-bridge-stock-wheel-fit.png'))
    (p/'bridge-pointer-fit.json').write_text(json.dumps({'passed':fit(result),'states':states},indent=2))
    assert fit(result),'Stock wheel did not expose all planned vertices with safe spacing/padding'
    # A high short rail strip is drawn first; its y cannot mask the temporary
    # hex center. Delete that original shape through normal Point selection.
    face(rail)
    fresh.locator('[data-etool=point]').click();asset_pointer(fresh,[0,0]);fresh.keyboard.press('Delete')
    still=props(fresh)
    assert len(still['visual'])==1 and still['visual'][0]!=temp and not still['collision'],'Starter hex or unwanted collision remains'
    for pts in other_faces:face(pts)
    fresh.locator('[data-etool=anchor]').click();asset_pointer(fresh,[0,0])
    fresh.screenshot(path=str(p/'08-bridge-native-editor.png'))
    authored=props(fresh);aid=authored['id']
    assert len(authored['visual'])==6 and not authored['collision'] and not authored['oneWay']
    assert authored['material']=='wood' and authored['layer']=='prop'
    assert not authored.get('interactionType') and not authored.get('climbable') and not authored['breakable']
    assert len({v['fill'] for v in authored['visual']})==1,'Unexpected native paint workflow: stock mode is purely neutral'
    fresh.locator('[data-tab=stage]').click();fresh.evaluate('([x,y,zoom])=>HonroWorkshopAPI.setCamera({x,y,zoom})',camera_seat)
    fresh.locator(f'.asset-card[data-asset="{aid}"]').click()
    q=fresh.evaluate("""([x,y])=>{
      const c=document.querySelector('#stageCanvas'),r=c.getBoundingClientRect(),v=HonroWorkshopAPI.getEditorState().stageView;
      return [r.left+r.width/2+(x-v.x)*v.zoom,r.top+r.height/2+(y-v.y)*v.zoom];
    }""",[center,anchorY])
    assert fresh.evaluate("q=>document.elementFromPoint(...q)?.id==='stageCanvas'",q)
    fresh.mouse.click(*q)
    ready=get(fresh)
    assert ready['id']==stage_id and ready['terrains']==base_stage['terrains'] and ready['units']==base_stage['units']
    assert len(ready['elements'])==1 and ready['elements'][0]['assetId']==aid and ready['elements'][0]['depthLayer']=='L1'
    inst=ready['elements'][0]
    deck_pts=authored['visual'][1]['points'][:len(span)]
    world_pts=[(inst['x']+q['x']-authored['anchor']['x'],inst['y']+q['y']-authored['anchor']['y']) for q in deck_pts]
    gaps=[abs(y-ground_at(fresh,x)) for x,y in world_pts]
    assert max(gaps)<=5.5,'A deck edge does not meet the sole ground contact: '+str(gaps)
    bridged=p/'private-bridge-draft.honro-map.json'
    with fresh.expect_download() as ask:fresh.locator('#exportBtn').click()
    ask.value.save_as(bridged)
    new_bytes=bridged.read_bytes()
    fresh=open_page()
    with fresh.expect_file_chooser() as ask:fresh.locator('#importBtn').click()
    ask.value.set_files(bridged)
    fresh.wait_for_function("a=>HonroWorkshopAPI.queryScene().stage.elements.some(x=>x.assetId===a)",arg=aid)
    assert get(fresh)==ready and props(fresh)==authored,'Fresh bridged file did not exactly reopen'
    fresh.locator('#overlayToggle').uncheck()
    capture_saved_view('native-bridge-after',camera_seat,True)
    cam[-1]['sha256']=digest(new_bytes)
    assert cam[-1]['actual']==cam[-2]['actual'],'Stock camera changed between matched bridge views'
    (p/'camera-proof.json').write_text(json.dumps(cam,indent=2))
    (p/'bridge-proof.json').write_text(json.dumps({'native_asset':aid,'terrain_unchanged':True,'new_collision':0,
       'forms':6,'authored_width':span[-1]-span[0],'raw_stock_fill':authored['visual'][1]['fill'],
       'deck_to_ground_absolute_error_by_knot':gaps,'bridge_saved_sha256':digest(new_bytes),'fresh_reopen':True},indent=2))
    fresh.locator('[data-tab=play]').click()
    try:fresh.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine',timeout=45000)
    finally:fresh.screenshot(path=str(p/'04-native-playtest-entry.png'))
    r=fresh.evaluate("""q=>{
       const t=HonroWorkshopAPI.getPlayApp().engine.b.terrain.find(x=>x.id===q);
       if(!t)return null;return {id:t.id,vertices:t.vertices,count:HonroWorkshopAPI.getPlayApp().engine.b.terrain.length};
    }""",a['id'])
    assert r and r['vertices']==domain['projected'] and r['count']==1,'Real Playtest polygon differs from Stage preview'
    fresh.screenshot(path=str(p/'04-native-playtest.png'))
    def state():
        return fresh.evaluate("""()=>{
          const a=HonroWorkshopAPI.getPlayApp(), e=a.engine,u=e.active,w=a.scene.canvas.ownerDocument.defaultView;
          return {id:u.id,x:u.x,y:u.y,move:u.moveLeft,grounded:e.grounded(u),aim:e.b.phase,
            round:e.b.round,side:e.b.side,dialogue:!!a.dialogue,actualStockCamera:{x:a.scene.x,y:a.scene.y,zoom:a.scene.scale},
            canInput:a.canInput(),activeFocused:a.scene.canvas.ownerDocument.hasFocus(),store:[w.localStorage.length,w.sessionStorage.length],
            support:e.contactSurface(u.x,u.y-3,u.y+3)?.t?.id??null};
        }""")
    # Playtest is launched by the stock Workshop tab. It focuses the real iframe, no synthetic event dispatch.
    samples=[];move_error=None
    try:
        fresh.wait_for_function("(id)=>{const a=HonroWorkshopAPI.getPlayApp(),e=a?.engine,u=e?.active;return u&&a.canInput()&&e.grounded(u)&&e.contactSurface(u.x,u.y-3,u.y+3)?.t?.id===id}",arg=a['id'],timeout=12000)
        start=state();samples.append(start)
        assert abs(start['x']-220)<5 and start['grounded'],'ordinary new stage hero did not start at GUI default'
        assert start['activeFocused'],'stock Playtest iframe did not receive keyboard focus'
        assert start['move']>1020 and start['aim'] not in ('won','lost'),f'insufficient real initial move budget or immediate win: {start}'
        fresh.screenshot(path=str(p/'05-live-descent-start.png'))
        downs=None;asc=None
        fresh.keyboard.down('KeyD')
        try:
            end=time.monotonic()+15
            while time.monotonic()<end:
                fresh.wait_for_timeout(48)
                now=state();samples.append(now)
                assert now['id']==start['id'] and now['activeFocused'],'active actor or real input focus shifted'
                if now['grounded'] and now['support']==a['id'] and 815<=now['x']<=970 and now['y']>=start['y']+225 and not downs:
                    downs=now
                    fresh.screenshot(path=str(p/'06-live-descended.png'))
                if downs and now['grounded'] and now['support']==a['id'] and now['x']>=1120 and now['y']<=downs['y']-70:
                    asc=now
                    break
                if now['aim'] in ('won','lost') or now['move']<=0:break
        finally:fresh.keyboard.up('KeyD')
        assert downs is not None,'held D did not produce actual grounded descent'
        assert asc is not None,'held D did not produce actual grounded ascent after descent'
        fresh.screenshot(path=str(p/'07-live-ascended.png'))
        # Short actual A confirmation if same-turn budget remains; never write stats or select a fabricated next turn.
        if asc['move']>=30:
            fresh.keyboard.down('KeyA')
            try:
                more=time.monotonic()+2
                while time.monotonic()<more:
                    fresh.wait_for_timeout(40)
                    back=state(); samples.append(back)
                    if back['x']<=asc['x']-15 and back['grounded'] and back['support']==a['id']:break
            finally:fresh.keyboard.up('KeyA')
            if back['x']<=asc['x']-15 and back['grounded'] and back['support']==a['id']:
                fresh.screenshot(path=str(p/'07-live-ascended-real-a.png'))
    except Exception as e:
        move_error=f'{type(e).__name__}: {e}'
        fresh.screenshot(path=str(p/'08-partial-live.png'))
    (p/'movement.json').write_text(json.dumps({'pass':move_error is None,'samples':samples,'failure':move_error},indent=2))
    # Independent optional geographic walk: don't turn partial exploration
    # into a complete play claim or fail the preserved western witness.
    if not move_error:
        extended={'passed':False,'checkpoints':[],'reason':None,'official_inputs_only':True}
        probes=[('bridge-west-approach',3710),('bridge-anchor-midpoint',3965),('bridge-east-exit',4160)]
        actor=start['id'];deadline=time.monotonic()+52; rounds=set()
        try:
            for name,x in probes:
                while time.monotonic()<deadline:
                    st=state()
                    if st['store']!=[0,0]:raise RuntimeError('Disposable Playtest attempted unexpected storage effect')
                    if st['id']!=actor or st['aim'] in ('lost','won'):
                        raise RuntimeError('Stock actor or ordinary play phase ended')
                    if st['canInput'] and st['grounded'] and st['support']==a['id'] and st['x']>=x:
                        fresh.screenshot(path=str(p/f'08-{name}.png'))
                        extended['checkpoints'].append({'name':name,**st})
                        break
                    if st['canInput'] and st['grounded'] and st['move']>=10:
                        fresh.keyboard.down('KeyD')
                        try:fresh.wait_for_timeout(160)
                        finally:fresh.keyboard.up('KeyD')
                    elif st['canInput'] and st['round'] not in rounds:
                        rounds.add(st['round']);fresh.keyboard.press('KeyF')
                    else:fresh.wait_for_timeout(160)
                else:raise RuntimeError('Geographic walk stopped without time to observe next real checkpoint')
            end=extended['checkpoints'][-1]
            if end['move']>=45:
                fresh.keyboard.down('KeyA')
                try:
                    until=time.monotonic()+1.8
                    while time.monotonic()<until:
                        fresh.wait_for_timeout(45); rev=state()
                        if rev['grounded'] and rev['support']==a['id'] and rev['id']==actor and rev['x']<=end['x']-30:
                            fresh.screenshot(path=str(p/'08-bridge-east-reverse.png'))
                            extended['reverse']=rev;break
                finally:fresh.keyboard.up('KeyA')
            extended['passed']=True
        except Exception as ex:
            extended['reason']=str(ex);fresh.screenshot(path=str(p/'08-geographic-walk-partial.png'))
        (p/'whole-geographic-walk.json').write_text(json.dumps(extended,indent=2))
    # This mechanical JSON is not an assertion artists accept the stock style. Inspect all PNGs.
    (p/'proof.json').write_text(json.dumps({'scope':'fresh full ground replay + one native bridge shape with sole valid terrain; not bridge colors, gate, combat or escort','actual_shape_id':a['id'],'pointer_clicks':len(vertices),
      'same_stage_preview_and_playtest_collider':True,'dragged_real_vertex':5,'fresh_reopen_exact':True,
      'collision_vertex_count':len(r['vertices']),'private_saved_sha256':digest(raw),
      'visual_fill':'Inspect overlay-off preview + native Playtest; machine geometry success is not a visual pass'},indent=2))

    if move_error:raise RuntimeError(move_error)
    if not extended['passed']:raise RuntimeError('Native bridge authored; actual both-end traverse incomplete: '+str(extended['reason']))
