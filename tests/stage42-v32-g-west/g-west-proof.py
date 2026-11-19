"""Independent SOP 3.2 G west ordinary ground native editor preview; no existing stage imported."""
import hashlib,json,os,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright

# Intent only from G: ascending first shoulder, angled catch before the main
# descents, different-length lower quieter relief. Nothing traced from an image.
TOP=[[0,1950],[86,1910],[157,1867],[224,1822],[298,1756],[362,1726],
     [409,1688],[481,1612],[556,1554],[616,1527],[687,1533],[782,1560],
     [856,1618],[929,1688],[1020,1734],[1096,1756],[1182,1761],[1241,1786],
     [1313,1852],[1401,1909],[1522,1931],[1638,1935],[1721,1909],
     [1824,1873],[1939,1880],[2070,1890]]
RING=TOP+[[2070,4420],[0,4420]]
WIDTH,HEIGHT=2070,4420
NAME='Act 5-2 G west new contour review'
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
           const s=HonroMaps.emptyStage('stage42-g-west-ordinary',n,w,h);
           s.environment.placements=[];
           s.units.push(HonroUnits.record('archer','g-west-archer',157,1810,'player'));
           // An unreachable-at-start QA destination prevents the unmodified stock
           // no-enemy objective from instantly winning before walking. No rendered mesh.
           s.objectives.push({id:'qa-contact-destination',type:'reach',label:'Western proof endpoint',x:1967,y:1883,radius:40,required:true});
           const sentinel={id:'qa-unplaced-empty',name:'Empty toolbar sentinel',category:'scenery',visual:[],
             collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
           sentinel.reference=HonroEnvironment.referenceForLegacyAsset(sentinel);
           const project={schema:'honro-map',version:HonroMaps.VERSION,activeStageId:s.id,
             name:'New v3.2 G west native route',environmentVersion:HonroEnvironment.VERSION,
             settings:{autosave:false,grid:10},stages:[s],library:[sentinel]};
           const q=HonroMaps.finalize(project);
           if(q.stages.length!==1||q.stages[0].terrains.length||q.stages[0].elements.length||
              q.stages[0].environment.placements?.length||q.library[0].visual.length||q.library[0].collision.length)throw Error('Scratch zero-content guard failed');
           return q;
        }""",[NAME,WIDTH,HEIGHT])
        with t.expect_file_chooser() as ask:t.locator('#importBtn').click()
        ask.value.set_files({'name':'qa-empty-scratch.honro-map.json','mimeType':'application/json',
                             'buffer':json.dumps(scratch,ensure_ascii=False).encode()})
        t.wait_for_function("HonroWorkshopAPI.queryScene().stage.id==='stage42-g-west-ordinary'",timeout=12000)
    finally:after=summary('manual-blank-file-import-result')
    assert after['id']=='stage42-g-west-ordinary' and after['asset_count']==1,'Stock scratch import did not isolate the project'
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
    t.locator('[data-tool=select]').click(); t.locator('#overlayToggle').check(); v=screen(RING[10]);t.mouse.move(*v);t.mouse.down();t.mouse.move(v[0]+4,v[1]-11,steps=5);t.mouse.up()
    t.screenshot(path=str(p/'02-pointer-solid-dragged.png'))
    s=get(t);q=s['terrains'][0]
    assert sum(x!=y for x,y in zip(q['points'],a['points']))==1 and q['points'][10]['y']<a['points'][10]['y']-8
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
    assert domain['play']=={'left':0,'top':0,'right':2070,'bottom':4420}
    assert domain['original']==domain['projected']==preview['compiled']['vertices'],'Exterior projection changed original stock simulation polygon'
    assert min(v['x'] for v in domain['world'])<0 and max(v['x'] for v in domain['world'])>2070
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
    for label,v in [('whole-west-only',[1035,1620,.195735]),
                    ('entry-and-high-shoulder',[580,1625,.5]),
                    ('over-crest-and-main-descent',[1180,1710,.5]),
                    ('lower-exit-edge',[2020,1830,.5])]:
        capture_saved_view(label,v,True)
    (p/'camera-proof.json').write_text(json.dumps(cam,indent=2))
    assert all(not c['overlayOn'] and c['exteriorActive'] and c['view']['left']>c['bounds'][0]+5
      and c['view']['right']<c['bounds'][1]-5 and c['view']['bottom']<c['bounds'][2]-5 for c in cam[1:]),'Stock continued outer closure enters a checked camera'
    fresh.locator('[data-tab=play]').click()
    try:fresh.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine',timeout=45000)
    finally:fresh.screenshot(path=str(p/'04-native-playtest-entry.png'))
    r=fresh.evaluate("""q=>{
       const t=HonroWorkshopAPI.getPlayApp().engine.b.terrain.find(x=>x.id===q);
       if(!t)return null;return {id:t.id,vertices:t.vertices};
    }""",a['id'])
    assert r and r['vertices']==domain['projected'],'Real Playtest polygon differs from Stage preview'
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
    # Same hero, same initial turn, actual held D to first crest and then
    # downslope, followed by real A back toward the crest with remaining budget.
    samples=[];move_error=None;checkpoints={}
    def capture(name,v): 
        checkpoints[name]=v
        fresh.screenshot(path=str(p/f'07-{name}.png'))
    try:
        fresh.wait_for_function("(id)=>{const a=HonroWorkshopAPI.getPlayApp(),e=a?.engine,u=e?.active;return u&&a.canInput()&&e.grounded(u)&&e.contactSurface(u.x,u.y-3,u.y+3)?.t?.id===id}",arg=a['id'],timeout=12000)
        start=state();samples.append(start)
        assert abs(start['x']-157)<4 and start['grounded'] and start['activeFocused'] and start['move']>950
        capture('start',start);crest=None;descent=None;reverse=None
        fresh.keyboard.down('KeyD')
        try:
            until=time.monotonic()+15
            while time.monotonic()<until:
                fresh.wait_for_timeout(42);now=state();samples.append(now)
                assert now['id']==start['id'] and now['aim']=='aim' and now['store']==[0,0] and now['activeFocused']
                hit=now['grounded'] and now['support']==a['id']
                if crest is None and hit and 585<=now['x']<=735 and now['y']<=start['y']-260:
                    crest=now;capture('climbed-first',crest)
                if crest and hit and now['x']>=900 and now['y']>=crest['y']+110:
                    descent=now;break
                if now['move']<=0:break
        finally:fresh.keyboard.up('KeyD')
        assert crest and descent,'Actual character did not reach both independent climb and descent gates'
        capture('descended-after-crest',descent)
        assert descent['move']>=30,'No genuine reverse budget remains after downslope'
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
    (p/'proof.json').write_text(json.dumps({'scope':'G west only, native newly authored; no imported terrain, bridge, east, stage-wide or art acceptance',
      'actual_shape_id':a['id'],'pointer_clicks':len(vertices),'same_stage_preview_and_playtest_collider':True,'dragged_real_vertex':10,
      'fresh_reopen_exact':True,'collision_vertex_count':len(r['vertices']),'private_saved_sha256':digest(raw)},indent=2))
    if move_error:raise RuntimeError(move_error)
