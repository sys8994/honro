"""Unrun native Workshop smoke. Fixture is simple non-art terrain; no existing stages imported."""
import hashlib,json,os,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright

# Independently staged world geometry based on E's rhythm, not pixel traces.
# Shallow start shoulder → two unequal descents → short rounded transition →
# staggered climb and recovery ridge. Bottom two points are a closed fill only.
TOP=[[0,1372],[94,1364],[201,1372],[322,1408],[423,1450],[504,1460],
     [571,1478],[643,1522],[722,1584],[801,1637],[862,1657],
     [919,1659],[980,1645],[1052,1617],[1122,1571],[1211,1518],
     [1302,1498],[1374,1490],[1468,1438],[1552,1381],[1672,1357],
     [1800,1325],[1900,1313]]
RING=TOP+[[1900,4280],[0,4280]]
WIDTH,HEIGHT=1900,4300
NAME='Act 5-2 West E fresh ground proof'
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
           s.objectives.push({id:'qa-contact-destination',type:'reach',label:'Mechanical test destination',x:1830,y:1321,radius:50,required:true});
           const sentinel={id:'qa-unplaced-empty',name:'Empty toolbar sentinel',category:'scenery',visual:[],
             collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
           sentinel.reference=HonroEnvironment.referenceForLegacyAsset(sentinel);
           const project={schema:'honro-map',version:HonroMaps.VERSION,activeStageId:s.id,
             name:'Blank stock Solid mechanical fixture',environmentVersion:HonroEnvironment.VERSION,
             settings:{autosave:false},stages:[s],library:[sentinel]};
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
        t.mouse.click(*q);vertices.append(q)
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
    saved=p/'private-smoke.honro-map.json'
    with t.expect_download() as event:t.locator('#exportBtn').click()
    event.value.save_as(saved); raw=saved.read_bytes()
    fresh=open_page()
    with fresh.expect_file_chooser() as event:fresh.locator('#importBtn').click()
    event.value.set_files(saved)
    fresh.wait_for_function("(n)=>HonroWorkshopAPI.queryScene().stage.name===n",arg=NAME)
    assert get(fresh)['terrains']==s['terrains']
    fresh.locator('#overlayToggle').uncheck()
    cam=[]
    def capture_saved_view(label, request):
        data=fresh.evaluate("""([x,y,zoom])=>{
          HonroWorkshopAPI.setCamera({x,y,zoom});
          const v=HonroWorkshopAPI.getEditorState().stageView,c=document.querySelector('#stageCanvas');
          const a=HonroWorkshopAPI.queryScene().stage.terrains[0];
          const closedAt=Math.min(a.points.at(-1).y,a.points.at(-2).y);
          const view=HonroBounds.viewport(v,c.clientWidth,c.clientHeight);
          return {actual:[v.x,v.y,v.zoom],view,canvas:[c.clientWidth,c.clientHeight],
                  closedAt,minClearance:closedAt-view.bottom,solidId:a.id,
                  overlayOn:document.querySelector('#overlayToggle').checked};
        }""",request)
        fresh.screenshot(path=str(p/f'03-fresh-reopen-{label}-overlay-off.png'))
        cam.append({'label':label,'requested':request,'saved_file_sha256':digest(raw),**data})
    capture_saved_view('overall-wide',[950,1490,.195735])
    capture_saved_view('west-fit',[950,1508,.37])
    capture_saved_view('near',[720,1520,.5])
    (p/'camera-proof.json').write_text(json.dumps(cam,indent=2))
    assert all(not z['overlayOn'] and z['solidId']==a['id'] and z['minClearance']>=10 for z in cam),'Saved proof has overlay or bottom closure visible'
    assert all(abs(z['actual'][2]-z['requested'][2])<=.0001 for z in cam),'Stock camera constrained requested zoom; see actual projection and screenshots'
    assert get(fresh)['terrains']==s['terrains'],'Camera inspection changed reopened project terrain'

    fresh.locator('[data-tab=play]').click()
    try:fresh.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine',timeout=45000)
    finally:fresh.screenshot(path=str(p/'04-native-playtest-entry.png'))
    r=fresh.evaluate("""q=>{
       const t=HonroWorkshopAPI.getPlayApp().engine.b.terrain.find(x=>x.id===q);
       if(!t)return null;return {id:t.id,vertices:t.vertices};
    }""",a['id'])
    assert r and r['vertices']==preview['compiled']['vertices'],'Real Playtest polygon differs from Stage preview'
    fresh.screenshot(path=str(p/'04-native-playtest.png'))
    def state():
        return fresh.evaluate("""()=>{
          const a=HonroWorkshopAPI.getPlayApp(), e=a.engine,u=e.active,w=a.scene.canvas.ownerDocument.defaultView;
          return {id:u.id,x:u.x,y:u.y,move:u.moveLeft,grounded:e.grounded(u),aim:e.b.phase,
            actualStockCamera:{x:a.scene.x,y:a.scene.y,zoom:a.scene.scale},
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
    # This mechanical JSON is not an assertion artists accept the stock style. Inspect all PNGs.
    (p/'proof.json').write_text(json.dumps({'scope':'fresh Stage42 western ground only; no bridge/east/whole stage/gameplay completion','actual_shape_id':a['id'],'pointer_clicks':len(vertices),
      'same_stage_preview_and_playtest_collider':True,'dragged_real_vertex':5,'fresh_reopen_exact':True,
      'collision_vertex_count':len(r['vertices']),'private_saved_sha256':digest(raw),
      'visual_fill':'Inspect overlay-off preview + native Playtest; machine geometry success is not a visual pass'},indent=2))

    if move_error:raise RuntimeError(move_error)
