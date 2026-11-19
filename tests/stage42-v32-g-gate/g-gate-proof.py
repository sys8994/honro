"""Independent SOP 3.2 G full ordinary ground native editor preview; no existing stage imported."""
import hashlib,json,os,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright

# Intent only from G: ascending first shoulder, angled catch before the main
# descents, different-length lower quieter relief. Nothing traced from an image.
WEST=[[0,1950],[76,1928],[159,1902],[231,1844],[300,1796],[376,1771],
     [430,1724],[503,1661],[548,1638],[617,1632],
     [680,1622],[728,1593],[754,1578],[827,1568],[906,1568],
     [994,1580],[1045,1625],[1076,1666],[1134,1712],
     [1234,1753],[1340,1777],[1474,1808],[1604,1849],
     [1690,1877],[1812,1874],[1940,1860],[2070,1880]]
# New B: small original x~42% crossing seat, unequal landings, then one
# tilted traverse gradually releasing into the quiet local shelter ledge.
CENTRAL=[[2151,1912],[2258,1930],[2376,1955],[2480,1985],[2574,1995],
 [2634,2009],[2713,2016],[2785,2013],[2871,1995],[2948,1967],
 [3018,1912],[3084,1870],[3190,1820],[3294,1802],[3380,1805],
 [3514,1823],[3635,1850],[3711,1858],[3801,1888],[3938,1909],
 [4044,1926],[4157,1933],[4221,1923],[4333,1921],[4434,1947]]
# New C: late broad but short-depth saddle, one sustained first rise, a
# short angled rest, then a more compressed different rise to the gate bearing.
EAST=[[4552,1991],[4672,2019],[4781,2023],[4853,2004],[4930,1952],
 [5025,1888],[5129,1810],[5205,1766],[5284,1733],[5406,1707],
 [5506,1695],[5555,1676],[5672,1601],[5765,1503],[5858,1424],
 [5941,1393],[6042,1343],[6112,1319],[6196,1308],[6298,1317],
 [6392,1313],[6500,1330]]
TOP=WEST+CENTRAL+EAST
RING=TOP+[[6500,4420],[0,4420]]
WIDTH,HEIGHT=6500,4420
NAME='Act 5-2 G full from blank ordinary contour'
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
          and cur['units'][0]==['archer','player',157,1810])
    before=summary('stock-ui-start')
    diag_case='manual-import-of-verified-blank-scratch'
    # Actual native creation rollback was already verified. Import a clean one-stage
    # private file through the standard file chooser, without copying the loaded project.
    try:
        scratch=t.evaluate("""([n,w,h])=>{
           const s=HonroMaps.emptyStage('stage42-g-full-ordinary',n,w,h);
           s.environment.placements=[];
           s.units.push(HonroUnits.record('archer','g-west-archer',157,1810,'player'));
           // An unreachable-at-start QA destination prevents the unmodified stock
           // no-enemy objective from instantly winning before walking. No rendered mesh.
           s.objectives.push({id:'qa-contact-destination',type:'reach',label:'Geometry test goal',x:6455,y:1323,radius:30,required:true});
           const sentinel={id:'qa-unplaced-empty',name:'Empty toolbar sentinel',category:'scenery',visual:[],
             collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
           sentinel.reference=HonroEnvironment.referenceForLegacyAsset(sentinel);
           const project={schema:'honro-map',version:HonroMaps.VERSION,activeStageId:s.id,
             name:'New v3.2 G full native route',environmentVersion:HonroEnvironment.VERSION,
             settings:{autosave:false,grid:10},stages:[s],library:[sentinel]};
           const q=HonroMaps.finalize(project);
           if(q.stages.length!==1||q.stages[0].terrains.length||q.stages[0].elements.length||
              q.stages[0].environment.placements?.length||q.library[0].visual.length||q.library[0].collision.length)throw Error('Scratch zero-content guard failed');
           return q;
        }""",[NAME,WIDTH,HEIGHT])
        with t.expect_file_chooser() as ask:t.locator('#importBtn').click()
        ask.value.set_files({'name':'qa-empty-scratch.honro-map.json','mimeType':'application/json',
                             'buffer':json.dumps(scratch,ensure_ascii=False).encode()})
        t.wait_for_function("HonroWorkshopAPI.queryScene().stage.id==='stage42-g-full-ordinary'",timeout=12000)
    finally:after=summary('manual-blank-file-import-result')
    assert after['id']=='stage42-g-full-ordinary' and after['asset_count']==1,'Stock scratch import did not isolate the project'
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
    t.evaluate('()=>HonroWorkshopAPI.setCamera({x:850,y:1660,zoom:.5})')
    t.screenshot(path=str(p/'02-pointer-solid-enter.png'))
    s=get(t); assert len(s['terrains'])==1 and not s['elements']
    a=s['terrains'][0];assert a['type']=='solid' and len(a['points'])==len(RING)
    assert all(max(abs(q['x']-x),abs(q['y']-y))<=3 for q,(x,y) in zip(a['points'],RING))
    t.screenshot(path=str(p/'02-stage-visible-overlay-off.png'))
    # Test real dragging of an edited route knot, not just an untouched save.
    t.locator('[data-tool=select]').click(); t.locator('#overlayToggle').check(); v=screen(RING[9]);t.mouse.move(*v);t.mouse.down();t.mouse.move(v[0]+3,v[1]-5,steps=5);t.mouse.up()
    t.screenshot(path=str(p/'02-pointer-solid-dragged.png'))
    s=get(t);q=s['terrains'][0]
    assert sum(x!=y for x,y in zip(q['points'],a['points']))==1 and q['points'][9]['y']<a['points'][9]['y']-5
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
    # The West replay uses actual native pointer and its verified predecessor
    # snapshot. Canonical roundings must match exact prior 44517131751 West.
    accepted_west=WEST[:9]+[[623,1622]]+WEST[10:]
    got=[[v['x'],v['y']] for v in preview['compiled']['vertices'][:len(WEST)]]
    (p/'west-replay-proof.json').write_text(json.dumps({'reference_run':44517131751,
      'knots_checked':len(accepted_west),'exact':got==accepted_west,
      'same_prior_west':got==accepted_west},indent=2))
    assert got==accepted_west,'Actual authored West no longer matches accepted native predecessor'
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
    assert domain['play']=={'left':0,'top':0,'right':6500,'bottom':4420}
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
    for label,v in [('true-entire-width',[3250,1650,.14]),
                    ('a-matched-west-shoulder',[580,1625,.5]),
                    ('b-crossing-seat-earlier',[2740,1870,.5]),
                    ('b-tilted-traverse-to-relief',[3720,1820,.5]),
                    ('c-late-saddle-first-rise',[4890,1850,.5]),
                    ('c-second-rise-and-gate-bearing',[5790,1510,.5])]:
        capture_saved_view(label,v,True)
    (p/'camera-proof.json').write_text(json.dumps(cam,indent=2))
    assert all(not c['overlayOn'] and c['exteriorActive'] and c['view']['left']>c['bounds'][0]+5
      and c['view']['right']<c['bounds'][1]-5 and c['view']['bottom']<c['bounds'][2]-5 for c in cam[1:]),'Stock continued outer closure enters a checked camera'
    full_camera=next(c for c in cam if c['label']=='true-entire-width')
    assert full_camera['view']['left']<=.01 and full_camera['view']['right']>=6499.99,'Actual overview did not include whole play extent'
    # A bounded native geometry receipt, never a full project or profile.
    (p/'g-native-geometry-receipt.json').write_text(json.dumps({
        'schema':'honro.qa.g.single-surface-receipt.v1','stage_scope':'g-full-ordinary',
        'actual_solid_id':a['id'],'manual_native_draft_sha256':digest(raw),'fresh_domain_sha256':digest(domain_bytes),
        'world_width':WIDTH,'world_height':HEIGHT,'native_source_points':s['terrains'][0]['points'],
        'native_play_collider':domain['projected'],'unchanged_west_reference_run':44517131751,
        'no_old_art_props_or_profile':True},indent=2))
    accepted_pin='5c8c1f5a2fb9d5cd5d8d478600a34c77f9a1ecb5a58ae583eb88e467d1e6e676'
    current_pin=digest(json.dumps(domain['original'],separators=(',',':')).encode())
    assert current_pin==accepted_pin,'Actual whole G geometry replay differs from the accepted immutable collision receipt'
    # The verified whole contour was replayed with actual pointers, not loaded as a prior project.
    bridge_name='G early narrow timber crossing - native fill QA'
    aid='';span=[2644,2713,2785,2820];center=2713
    def ground_at(t,x):
        return t.evaluate("""x=>{
          const b=HonroWorkshopAPI.getRuntime().engine.b;
          const h=HonroMapEngine.surfaceY(b.terrain,x,2014);
          if(!h)throw Error('Missing intended ordinary sole ground at '+x);
          return h.y;
        }""",x)
    surfaces=[ground_at(fresh,x) for x in span]
    anchorY=surfaces[2]
    deck=[(x-center,y-anchorY) for x,y in zip(span,surfaces)]
    camera_seat=[2740,1870,.5]
    capture_saved_view('native-bridge-before',camera_seat,True)
    base_stage=get(fresh)
    stage_id=base_stage['id']
    old_fills=base_stage.get('elements',[])
    assert not old_fills,'Expected verified G without any previous prop'
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
    def face(pts,fill):
        fresh.locator('[data-etool=polygon]').click()
        for pt in pts:asset_pointer(fresh,pt)
        fresh.keyboard.press('Enter')
        active=fresh.locator('#nativeShapeFill')
        assert active.is_enabled(),'Disposable native Fill missing for authored closed polygon'
        active.fill(fill);active.press('Tab')
        assert props(fresh)['visual'][-1]['fill']==fill,'Native selected-only Fill failed to persist'
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
    rail=[[-69,-45],[-13,-43],[27,-42],[27,-34],[-13,-35],[-69,-37]]
    other_faces=(
      (deck+[(x,y+14) for x,y in reversed(deck)],'#785637'),
      ([[-95,deck[0][1]+5],[-73,deck[0][1]+6],[-56,deck[0][1]+24],[-85,deck[0][1]+27],[-98,deck[0][1]+19]],'#50585a'),
      ([[88,deck[-1][1]+3],[111,deck[-1][1]+1],[125,deck[-1][1]+12],[120,deck[-1][1]+27],[91,deck[-1][1]+22]],'#5a6160'),
      ([[-69,-48],[-60,-48],[-60,deck[0][1]+12],[-68,deck[0][1]+11]],'#473329'),
      ([[-53,deck[0][1]+8],[-45,deck[0][1]+8],[-28,-34],[-38,-32]],'#594233'),
      ([[49,-57],[55,-54],[101,-55],[101,-47],[55,-47],[49,-49]],'#62452d'),
      ([[91,-59],[100,-59],[100,deck[-1][1]+9],[91,deck[-1][1]+10]],'#48372a'),
      ([[-30,3],[-22,3],[-22,12],[-30,12]],'#a48157'),
      ([[41,2],[48,2],[48,11],[41,11]],'#a48157'))
    faces=[rail,*[pts for pts,_ in other_faces]]
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
    face(rail,'#674a32')
    fresh.locator('[data-etool=point]').click();asset_pointer(fresh,[0,0]);fresh.keyboard.press('Delete')
    still=props(fresh)
    assert len(still['visual'])==1 and still['visual'][0]!=temp and not still['collision'],'Starter hex or unwanted collision remains'
    for pts,fill in other_faces:face(pts,fill)
    fresh.locator('[data-etool=anchor]').click();asset_pointer(fresh,[0,0])
    fresh.screenshot(path=str(p/'08-bridge-native-editor.png'))
    authored=props(fresh);aid=authored['id']
    assert len(authored['visual'])==10 and not authored['collision'] and not authored['oneWay']
    assert authored['material']=='wood' and authored['layer']=='prop'
    assert not authored.get('interactionType') and not authored.get('climbable') and not authored['breakable']
    assert [v['fill'] for v in authored['visual']]==['#674a32',*[f for _,f in other_faces]],'Native Fill palette roles changed'
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
       'forms':10,'authored_width':span[-1]-span[0],'native_fills':[v['fill'] for v in authored['visual']],
       'fill_ui':'verified pinned disposable native fill; no stock application modification',
       'deck_to_ground_absolute_error_by_knot':gaps,'bridge_saved_sha256':digest(new_bytes),'fresh_reopen':True},indent=2))
    # Preserve the already re-opened in-run G bridge exactly; its previous
    # external evidence did not contain a whole bridge asset, so don't claim
    # equality with another run's raw bytes. Both props are new native clicks.
    gate_name='G weathered ridge gate - native shape review'
    gc=6162; gate_camera=[6162,1325,.5]
    gate_world_y=ground_at(fresh,gc)
    leftY=ground_at(fresh,gc-68)-gate_world_y
    rightY=ground_at(fresh,gc+69)-gate_world_y
    bridge_preserved=props(fresh)
    capture_saved_view('native-gate-before',gate_camera,True)
    cam[-1]['sha256']=digest(new_bytes)
    def gate_props(t):
        return t.evaluate("n=>HonroWorkshopAPI.getProject().library.find(x=>x.name===n)",gate_name)
    gate_shapes=[
      ([[-116,-145],[-98,-146],[-76,-158],[-61,-171],[-26,-174],[21,-177],[55,-174],[78,-160],[97,-148],[112,-146],
        [105,-136],[77,-140],[48,-148],[-5,-150],[-57,-147],[-89,-137],[-109,-137]],'#404b54'),
      ([[-83,-148],[-61,-162],[-19,-167],[28,-169],[62,-162],[86,-147],[60,-153],[26,-158],[-16,-157],[-55,-154]],'#4e5960'),
      ([[-108,-137],[-78,-141],[-47,-148],[-4,-151],[36,-150],[72,-145],[103,-137],[94,-128],[57,-134],[20,-138],
        [-32,-137],[-71,-132],[-101,-128]],'#303b41'),
      ([[-79,-137],[-57,-138],[-58,leftY+4],[-78,leftY+7]],'#64594d'),
      ([[55,-137],[79,-135],[77,rightY+5],[54,rightY+3]],'#554b43'),
      ([[-77,-133],[-66,-135],[-65,leftY+5],[-77,leftY+7]],'#47413d'),
      ([[-84,-132],[-55,-136],[52,-136],[84,-130],[79,-118],[52,-123],[-52,-123],[-82,-120]],'#554b43'),
      ([[-91,leftY-4],[-67,leftY-8],[-48,leftY-3],[-51,leftY+14],[-89,leftY+18]],'#666967'),
      ([[44,rightY-4],[70,rightY-7],[87,rightY-4],[89,rightY+13],[48,rightY+11]],'#5c605e'),
      ([[-49,-121],[-39,-122],[-35,-112],[-39,-106],[-48,-107],[-52,-113]],'#4c4945')]
    def gate_face(pts,fill):
        fresh.locator('[data-etool=polygon]').click()
        for pt in pts:asset_pointer(fresh,pt)
        fresh.keyboard.press('Enter')
        active=fresh.locator('#nativeShapeFill')
        assert active.is_enabled(),'Gate native Fill missing'
        active.fill(fill);active.press('Tab')
        assert gate_props(fresh)['visual'][-1]['fill']==fill,'Exact selected gate Fill missing'
    fresh.locator('[data-tab=element]').click()
    fresh.locator('#newAsset').click();field(fresh,'#assetName',gate_name)
    fresh.locator('#assetCollision').uncheck()
    field(fresh,'#assetLayer','prop')
    seed=gate_props(fresh)['visual'][0]
    faces=[pts for pts,_ in gate_shapes]
    fit_result=camera_fit()
    for step in (85,40,40):
        if fit(fit_result):break
        if fit_result['minGapPx']<4:break
        fresh.mouse.move(*fit_result['center'])
        prior_zoom=fit_result['zoom'];fresh.mouse.wheel(0,step)
        fresh.wait_for_function('z=>HonroWorkshopAPI.getEditorState().elementView.zoom<z',arg=prior_zoom,timeout=2000)
        fit_result=camera_fit()
    (p/'gate-pointer-fit.json').write_text(json.dumps(fit_result,indent=2))
    if not fit(fit_result):fresh.screenshot(path=str(p/'08-gate-stock-pointer-blocked.png'))
    assert fit(fit_result),'Native gate project art points do not fit accessible canvas'
    gate_face(*gate_shapes[0])
    fresh.locator('[data-etool=point]').click();asset_pointer(fresh,[0,0]);fresh.keyboard.press('Delete')
    assert len(gate_props(fresh)['visual'])==1 and gate_props(fresh)['visual'][0]!=seed,'Default hex still present'
    for part in gate_shapes[1:]:gate_face(*part)
    fresh.locator('[data-etool=anchor]').click();asset_pointer(fresh,[0,0])
    fresh.screenshot(path=str(p/'08-gate-native-editor.png'))
    ag=gate_props(fresh);gid=ag['id']
    assert len(ag['visual'])==10 and not ag['collision'] and ag['layer']=='prop' and not ag.get('interactionType')
    assert [v['fill'] for v in ag['visual']]==[f for _,f in gate_shapes],'Original G gate palette roles changed'
    fresh.locator('[data-tab=stage]').click();fresh.evaluate('([x,y,zoom])=>HonroWorkshopAPI.setCamera({x,y,zoom})',gate_camera)
    fresh.locator(f'.asset-card[data-asset="{gid}"]').click()
    q=fresh.evaluate("""([x,y])=>{
      const c=document.querySelector('#stageCanvas'),r=c.getBoundingClientRect(),v=HonroWorkshopAPI.getEditorState().stageView;
      return [r.left+r.width/2+(x-v.x)*v.zoom,r.top+r.height/2+(y-v.y)*v.zoom];
    }""",[gc,gate_world_y])
    assert fresh.evaluate("q=>document.elementFromPoint(...q)?.id==='stageCanvas'",q)
    fresh.mouse.click(*q)
    both=get(fresh)
    assert len(both['elements'])==2 and both['elements'][0]==ready['elements'][0] and both['terrains']==ready['terrains']
    assert both['units']==ready['units'] and props(fresh)==bridge_preserved and both['elements'][1]['assetId']==gid
    gi=both['elements'][1]
    def worldpart(k):
        return [(gi['x']+v['x']-ag['anchor']['x'],gi['y']+v['y']-ag['anchor']['y']) for v in ag['visual'][k]['points']]
    left,right=worldpart(3),worldpart(4)
    gapL=max(x for x,y in left);gapR=min(x for x,y in right)
    lintel=max(y for _,y in worldpart(6))
    ground_line=min(ground_at(fresh,x) for x in (gapL,gi['x'],gapR))
    assert 100<=gapR-gapL<=130 and ground_line-lintel>=115,'Actual wood gate portal is not wide/high enough'
    min_lamp_y=ground_line-max(y for _,y in worldpart(9))
    assert min_lamp_y>=98,'Native lantern visually hangs into the actor envelope'
    contacts=[]
    for bx in [gc-68,gc+69]:
        land=ground_at(fresh,bx)
        seat=worldpart(7 if bx<gc else 8)
        contacts.append([land,min(y for _,y in seat),max(y for _,y in seat)])
        assert min(y for _,y in seat)<land<max(y for _,y in seat),'G gate stone not embedded at intended contact'
    receipt=p/'private-g-gate.honro-map.json'
    with fresh.expect_download() as ask:fresh.locator('#exportBtn').click()
    ask.value.save_as(receipt)
    gate_bytes=receipt.read_bytes()
    fresh=open_page()
    with fresh.expect_file_chooser() as ask:fresh.locator('#importBtn').click()
    ask.value.set_files(receipt)
    fresh.wait_for_function("g=>HonroWorkshopAPI.queryScene().stage.elements.some(x=>x.assetId===g)",arg=gid)
    assert get(fresh)==both and gate_props(fresh)==ag and props(fresh)==bridge_preserved,'Native gate/bridge fresh file differs'
    fresh.locator('#overlayToggle').uncheck()
    capture_saved_view('native-gate-after',gate_camera,True)
    cam[-1]['sha256']=digest(gate_bytes)
    assert cam[-2]['actual']==cam[-1]['actual']
    capture_saved_view('full-with-native-g-props',[3250,1650,.14],True)
    cam[-1]['sha256']=digest(gate_bytes)
    (p/'camera-proof.json').write_text(json.dumps(cam,indent=2))
    (p/'gate-proof.json').write_text(json.dumps({'native_gate_id':gid,'forms':10,'same_sole_ground':True,
       'unchanged_same_run_full_native_bridge':True,'fresh_reopen':True,'additional_collision':0,
       'pillar_aperture':[gapL,gapR],'aperture_width':gapR-gapL,'lintel_headroom':ground_line-lintel,
       'lamp_headroom':min_lamp_y,'actual_two_foundation_contacts':contacts,'native_gate_sha256':digest(gate_bytes)},indent=2))
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
          return {id:u.id,x:u.x,y:u.y,spawnX:u.spawnX,spawnY:u.spawnY,move:u.moveLeft,grounded:e.grounded(u),aim:e.b.phase,
            round:e.b.round,side:e.b.side,dialogue:!!a.dialogue,actualStockCamera:{x:a.scene.x,y:a.scene.y,zoom:a.scene.scale},
            canInput:a.canInput(),activeFocused:a.scene.canvas.ownerDocument.hasFocus(),store:[w.localStorage.length,w.sessionStorage.length],
            support:e.contactSurface(u.x,u.y-3,u.y+3)?.t?.id??null};
        }""")
    # Playtest is launched by the stock Workshop tab. It focuses the real iframe, no synthetic event dispatch.
    # Same hero, up to two stock F turn advances; held D across both ledges and then
    # downslope, followed by real A back toward the crest with remaining budget.
    samples=[];move_error=None;checkpoints={}
    def capture(name,v): 
        checkpoints[name]=v
        fresh.screenshot(path=str(p/f'07-{name}.png'))
    try:
        fresh.wait_for_function("(id)=>{const a=HonroWorkshopAPI.getPlayApp(),e=a?.engine,u=e?.active;return u&&a.canInput()&&e.grounded(u)&&e.contactSurface(u.x,u.y-3,u.y+3)?.t?.id===id}",arg=a['id'],timeout=12000)
        start=state();samples.append(start)
        planned_stock_spawn=fresh.evaluate("""()=>{
          const app=HonroWorkshopAPI.getPlayApp(),e=app.engine,u=e.active,w=app.scene.canvas.ownerDocument.defaultView;
          // Native sanitizeStageBattle uses the exact stock terrain-space solver.
          return w.HonroTerrain.place(e.b,u,{x:157,y:1810,flying:false,maxDistance:Math.max(e.b.width,e.b.height)});
        }""")
        (p/'spawn-proof.json').write_text(json.dumps({'authored':[157,1810],'stock_placement':planned_stock_spawn,'actual_spawn':start},indent=2))
        assert start['id']=='g-west-archer' and 115<=start['x']<=235 and start['grounded'] and start['activeFocused'] and start['move']>950,'Not the expected stock grounded initial entry area'
        assert planned_stock_spawn and abs(start['spawnX']-planned_stock_spawn['x'])<=.01 and abs(start['spawnY']-planned_stock_spawn['y'])<=.01,'Stock mount mismatches its native spawn solver'

        capture('start',start);lower_ledge=None;upper_ledge=None;descent=None;reverse=None
        deadline=time.monotonic()+28; used_rounds=set()
        while time.monotonic()<deadline:
            now=state();samples.append(now)
            assert now['id']==start['id'] and now['aim'] not in ('lost','won') and now['store']==[0,0] and now['activeFocused'],'Stock actor or input integrity changed'
            hit=now['grounded'] and now['support']==a['id']
            if lower_ledge is None and hit and 550<=now['x']<=680 and now['y']<=start['y']-190:
                lower_ledge=now;capture('climbed-to-long-lower-ledge',lower_ledge)
            if lower_ledge and upper_ledge is None and hit and 790<=now['x']<=945 and now['y']<=lower_ledge['y']-38:
                upper_ledge=now;capture('climbed-second-bedrock-ledge',upper_ledge)
            if upper_ledge and hit and 1090<=now['x']<=1330 and now['y']>=upper_ledge['y']+120 and now['move']>=35:
                descent=now;break
            if now['canInput'] and now['grounded'] and now['move']>=40:
                fresh.keyboard.down('KeyD')
                try:fresh.wait_for_timeout(85)
                finally:fresh.keyboard.up('KeyD')
            elif now['canInput'] and now['round'] not in used_rounds and len(used_rounds)<2:
                used_rounds.add(now['round']);fresh.keyboard.press('KeyF')
            else:fresh.wait_for_timeout(135)
        assert lower_ledge and upper_ledge and descent,'Actual character did not record both distinct ledges and a grounded descent'
        capture('descended-after-shoulder',descent)
        fresh.keyboard.down('KeyA')
        try:
            until=time.monotonic()+2.4
            while time.monotonic()<until:
                fresh.wait_for_timeout(42);now=state();samples.append(now)
                assert now['id']==start['id'] and now['aim']=='aim' and now['store']==[0,0]
                if now['grounded'] and now['support']==a['id'] and now['x']<=descent['x']-20 and now['y']<=descent['y']-8:
                    reverse=now;break
                if now['move']<=0:break
        finally:fresh.keyboard.up('KeyA')
        assert reverse,'Actual A did not return toward the crest on the sole same terrain'
        capture('reversed-up-slope',reverse)
    except Exception as ex:
        move_error=f'{type(ex).__name__}: {ex}'
        fresh.screenshot(path=str(p/'08-g-west-play-partial.png'))
    (p/'movement.json').write_text(json.dumps({'pass':move_error is None,'samples':samples,'checkpoints':checkpoints,'failure':move_error},indent=2))
    if not move_error:
        full={'passed':False,'checkpoints':[],'reason':None}
        route=[('before-actual-bridge',2570),('standing-on-actual-deck',2690),('after-actual-bridge',2890),('tilted-traverse',3800),
               ('later-saddle',4720),('first-rise-rest',5380),('gate-west-approach',5990),('inside-native-gate',6130),('gate-east-exit',6260)]
        deadline=time.monotonic()+78; advanced=set()
        try:
            for name,x in route:
                while time.monotonic()<deadline:
                    now=state()
                    assert now['id']==start['id'] and now['aim'] not in ('lost','won') and now['store']==[0,0] and now['activeFocused'],'Local ordinary run authenticity check failed'
                    if now['grounded'] and now['support']==a['id'] and now['x']>=x:
                        full['checkpoints'].append({'name':name,**now})
                        fresh.screenshot(path=str(p/f'08-{name}.png'))
                        break
                    if now['canInput'] and now['grounded'] and now['move']>18:
                        fresh.keyboard.down('KeyD')
                        try:fresh.wait_for_timeout(130)
                        finally:fresh.keyboard.up('KeyD')
                    elif now['canInput'] and now['round'] not in advanced:
                        advanced.add(now['round']);fresh.keyboard.press('KeyF')
                    else:fresh.wait_for_timeout(140)
                else:raise RuntimeError('Next full-width grounded checkpoint not observed before timeout: '+name)
            inside=next(q for q in full['checkpoints'] if q['name']=='inside-native-gate')
            assert gapL+8<inside['x']<gapR-8,'Actual hero not inside the authored portal during checkpoint'
            end=full['checkpoints'][-1]
            if end['move']<180:
                fresh.keyboard.press('KeyF')
                fresh.wait_for_function("""([actor,round])=>{const a=HonroWorkshopAPI.getPlayApp(),e=a.engine;
                  return e.b.round>round&&e.active?.id===actor&&a.canInput()&&e.grounded(e.active)&&e.active.moveLeft>=180;
                }""",arg=[start['id'],end['round']],timeout=6500)
                post=state()
                assert abs(end['x']-post['x'])<1 and abs(end['y']-post['y'])<1,'Actual turn advance unexpectedly changed actor location'
                full['ordinary_turn_after_east']=post
            fresh.keyboard.down('KeyA')
            try:
                until=time.monotonic()+2.5
                while time.monotonic()<until:
                    fresh.wait_for_timeout(45);back=state()
                    if back['grounded'] and back['id']==start['id'] and back['support']==a['id'] and gapL+8<back['x']<gapR-8:
                        full['return']=back
                        fresh.screenshot(path=str(p/'08-actual-east-return.png'))
                        break
            finally:fresh.keyboard.up('KeyA')
            assert 'return' in full,'Actual A return not observed from eastern marker'
            full['passed']=True
        except Exception as ex:
            full['reason']=f'{type(ex).__name__}: {ex}'
            fresh.screenshot(path=str(p/'08-geographic-walk-partial.png'))
        (p/'whole-geographic-walk.json').write_text(json.dumps(full,indent=2))
    (p/'proof.json').write_text(json.dumps({'scope':'G full native replay + short existing G bridge replay and original gate; no grade change, escort, combat or final art',
      'actual_shape_id':a['id'],'pointer_clicks':len(vertices),'same_stage_preview_and_playtest_collider':True,'dragged_real_vertex':9,
      'fresh_reopen_exact':True,'collision_vertex_count':len(r['vertices']),'private_saved_sha256':digest(raw)},indent=2))
    if move_error:raise RuntimeError(move_error)

    if not full['passed']:raise RuntimeError(full['reason'])
