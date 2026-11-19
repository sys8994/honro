"""Actual R5 domain: exact R4 collision and native exterior on stock Player."""
import base64,copy,hashlib,json,os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
src=Path(__file__).with_name('slice.json').read_bytes()
sha=lambda data:hashlib.sha256(data).hexdigest()
assert sha(src)=='212f0ecda5e0d835f0e051c680f460dbad7d1e7556dd4b25721fbef9d663cd3a'
raw=json.loads(src)
domain_bytes=Path(__file__).with_name('domain.json').read_bytes()
assert sha(domain_bytes)=='5d42211ab6241504a3e80638eb140e206dd64100dbb91b35bfb7759124c39a78'
domain=json.loads(domain_bytes)
assert domain['sourceSHA256']==sha(src) and [domain[k] for k in ('width','height','terrainDomainVersion')]==[1620,560,1]
assert list(map(lambda t:len(t['points']),domain['terrains']))==[112,108,163]
assert domain['playBounds']==dict(left=0,top=0,right=1620,bottom=560)
assert domain['terrainBounds']==dict(left=-2050,top=-620,right=3740,bottom=1960)
art_bytes=Path(__file__).with_name('A16-honro-asset.json').read_bytes()
assert sha(art_bytes)=='f2dbabb2dad6b7abae71b5e5f35067568f82fdb32f730f2d186fb66078f2a0cd'
art=json.loads(art_bytes)
pose=dict(id='qa-p6-r5-a16-surface',assetId=art['id'],layer='prop',depthLayer='L1',
          x=0,y=0,scale=1,rotation=0,snap=False)
assert art['collision']==art['visual']==[] and art['anchor']==dict(x=0,y=0)
assert art['id']=='mib-p6r5-a16-world' and art['vector']['viewBox']==[-2050,-620,5790,2580]
assert art['params'].get('semanticLayer')=='BODY' and art['params'].get('silhouetteUnderpaint') is False
assert not art.get('interactionType') and art.get('renderer') is None
names={'B':'SupplyBasin','W':'WestLookout','M':'RescueOverhang'}
assert [r['id'] for r in raw['owners']]==list(names.values())
rings={k:raw['owners'][i]['ring'] for i,k in enumerate(names)}
assert list(map(len,rings.values()))==[74,61,112]
wanted={names[k]:[dict(x=x,y=y) for x,y in p] for k,p in rings.items()}
assert all(sum(x*Y-y*X for (x,y),(X,Y) in zip(p,p[1:]+p[:1]))>0 for p in rings.values())
canonical=lambda data:sha(json.dumps(data,sort_keys=True,separators=(',',':')).encode())
assert canonical(raw['owners'][0])=='8105b51adf4f1eaf6144284d692ad86ac397c839d75bb58804bb5a9ab98d2416'
assert canonical(raw['owners'][1])=='a03727c6ac9a60cec356933ea89194a2f93809b418de84dbd6a54ad25d9928bd'
mring=rings['M']
assert canonical(mring[:62])=='590e540cb0b2dad8f8d58e4de71fb13998c03057d4b536df4080e56bcb310207'
assert canonical(mring[-7:])=='e0a4262c6a283ac33de899ed89575155cdc233b7fb44c3ff2355e9c047a88c87'
assert mring[61]==[1210,64] and max(x for x,y in mring)==1620
assert not any(x==X==1210 for (x,y),(X,Y) in zip(mring,mring[1:]+mring[:1]))
def surface(p,q):
    return min(y+(q-x)*(Y-y)/(X-x) for (x,y),(X,Y) in zip(p,p[1:]+p[:1]) if min(x,X)<=q<max(x,X))
start_x=412
sid='qa-p6r5-west-route'
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
assert sys.argv[2]=='http://127.0.0.1:8884/HONRO_WORKSHOP.html'
url=sys.argv[2]
proof={'scope':'P6r5 alternate physical branch on stock Player with A16, controlled native Archer spawn on W before launch; not standard start, reach W, or campaign.','source':sha(src),'asset':sha(art_bytes),'domain':sha(domain_bytes),'checkpoints':[],'pageErrors':[],'baselineRun':44552672189,'passed':False}
def dump(n,obj):
    (out/n).write_text(json.dumps(obj,ensure_ascii=False,indent=2))
def note(label,**kw):
    proof['checkpoints'].append(dict(label=label,**kw));dump('proof.json',proof)
dump('proof.json',proof)
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ['HONRO_CHROME'],headless=True,args=['--no-sandbox'])
    def fresh():
        page=browser.new_context(viewport={'width':1500,'height':900},device_scale_factor=1,accept_downloads=True).new_page()
        page.on('pageerror',lambda e:proof['pageErrors'].append(str(e)[:350]))
        page.goto(url);page.wait_for_function('!!window.HonroWorkshopAPI',timeout=60000)
        return page
    def load(page,source):
        with page.expect_file_chooser() as fc:page.locator('#importBtn').click()
        fc.value.set_files(source)
        page.wait_for_function('id=>HonroWorkshopAPI.queryScene().stage.id===id',arg=sid)
    def snap(page,name):page.screenshot(path=str(out/(name+'.png')))
    def project(page):return page.evaluate('HonroWorkshopAPI.getProject()')
    def preview(page):
        return page.evaluate("""()=>{const p=HonroWorkshopAPI.getProject(),
          c=HonroMaps.compile(p.stages[0],p), b=HonroWorkshopAPI.getRuntime().engine.b;
          const take=t=>({id:t.id,oneWay:t.oneWay,vertices:t.vertices});
          return {compile:c.terrain.map(take),preview:b.terrain.map(take)};}""")
    t=fresh()
    # Normal stock schema creation/finalize; import through the real native button.
    data=t.evaluate("""({sid,wanted,spawn,names})=>{
      const s=HonroMaps.emptyStage(sid,'P6r5 isolated west route',1620,560);
      s.environment.placements=[];s.environment.hiddenLayers=['L2','L3','L4','L5'];
      s.environment.atmosphere.overrides={skyTop:'#151c23',skyBottom:'#151c23'};
      s.terrains=Object.values(names).map(id=>({id,name:id,layer:'terrain',type:'solid',points:wanted[id],baseMaterial:'rock',oneWay:false,breakable:false}));
      s.units=[HonroUnits.record('archer','p6-r5-west-qa-scout',spawn[0],spawn[1],'player')];
      s.objectives=[{id:'qa-never-reached',type:'reach',label:'QA only',x:1170,y:74,radius:25,required:true}];
      const a={id:'qa-inert-empty',name:'Empty toolbar sentinel',category:'scenery',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
      a.reference=HonroEnvironment.referenceForLegacyAsset(a);
      return HonroMaps.finalize({schema:'honro-map',version:HonroMaps.VERSION,activeStageId:s.id,name:s.name,
        environmentVersion:HonroEnvironment.VERSION,settings:{autosave:false,grid:10},stages:[s],library:[a]});
      }""",dict(sid=sid,wanted=wanted,names=names,spawn=[start_x,surface(rings['W'],start_x)]))
    def exact_places(p,colored=False,extended=False):
        s=p['stages'][0]
        assert len(p['stages'])==1 and [s['width'],s['height']]==[1620,560]
        assert (not s['elements'] if not colored else s['elements']==[pose])
        assert not s['materials'] and not s['environment']['placements'] and len(s['units'])==1
        assert len(p['library'])==(2 if colored else 1) and not p['library'][0]['visual'] and not p['library'][0]['collision']
        if colored:assert {key:p['library'][1][key] for key in art}==art
        assert list(v['id'] for v in s['terrains'])==list(names.values())
        assert all(v['type']=='solid' and v['oneWay'] is False for v in s['terrains'])
        if extended:
            assert all(s[k]==domain[k] for k in ('playBounds','terrainBounds','terrainDomainVersion'))
            assert {v['id']:v['points'] for v in s['terrains']}=={v['id']:v['points'] for v in domain['terrains']}
            assert [v['playProjection'] for v in s['terrains']]==[v['playProjection'] for v in domain['terrains']]
        else:
            assert not s.get('terrainBounds') and all(not v.get('playProjection') for v in s['terrains'])
            assert {v['id']:v['points'] for v in s['terrains']}==wanted
    exact_places(data)
    expected=[{'id':i,'oneWay':False,'vertices':v} for i,v in wanted.items()]
    def open_player(page):
        page.locator('[data-tab=play]').click()
        page.wait_for_function('!!HonroWorkshopAPI.getPlayApp()?.engine',timeout=45000)
        page.wait_for_function('HonroWorkshopAPI.getPlayApp().canInput()',timeout=17000)
        page.locator('#runtimeFrame').evaluate('f=>f.contentWindow.focus()')
    def physics(page):
        return page.evaluate("""()=>{const b=HonroWorkshopAPI.getPlayApp().engine.b;return {
            terrain:b.terrain,units:b.units.map(({id,side,x,y,moveLeft,walkSpeed,h,r,hp})=>({id,side,x,y,moveLeft,walkSpeed,h,r,hp})),
            round:b.round,phase:b.phase,width:b.width,height:b.height,physics:b.physics};}""")
    def actual(page):
        return page.evaluate("""()=>HonroWorkshopAPI.getPlayApp().engine.b.terrain.map(t=>({id:t.id,oneWay:t.oneWay,vertices:t.vertices}))""")
    def data_url(png):return 'data:image/png;base64,'+base64.b64encode(png).decode()
    def write_url(label,url): (out/(label+'.png')).write_bytes(base64.b64decode(url.split(',',1)[1],validate=True))
    def buffered(name,d):
        return dict(name=name,mimeType='application/json',buffer=json.dumps(d).encode())
    def check_domain(page,expected_owners):
        result=page.evaluate("""()=>{
           const a=HonroWorkshopAPI.getPlayApp(),b=a.engine.b,w=a.scene.canvas.ownerDocument.defaultView;
           const p=HonroWorkshopAPI.getProject(),m=HonroMaps.compile(p.stages[0],p);
           const to=t=>({id:t.id,points:t.vertices,projection:t.honroDomainProjection,oneWay:t.oneWay});
           return {active:w.HonroTerrainDomain.active(b),play:b.honroPlayBounds,world:b.honroTerrainBounds,
              runtime:b.honroWorldTerrain?.map(to),render:w.HonroTerrainDomain.render(b).map(to),
              workshopCompiled:m.worldTerrain?.map(to),dynamicCollision:b.terrain.some(t=>t.honroElementCollision),
              landmarks:(b.honroLandmarks||[]).map(l=>({kind:l.kind,id:l.id,assetId:l.asset.id,
                layer:l.layer,depthLayer:l.depthLayer,x:l.x,y:l.y,scale:l.scale,rotation:l.rotation,snap:l.snap,
                collisionIds:l.collisionIds,assetCollision:l.asset.collision,agreesCompiled:JSON.stringify(l.asset.vector)===JSON.stringify(m.landmarks.find(k=>k.id===l.id)?.asset?.vector)}))};
        }""")
        expect=[dict(id=v['id'],points=v['points'],projection=v['playProjection'],oneWay=False) for v in domain['terrains']]
        assert result['active'] and not result['dynamicCollision']
        assert result['play']==domain['playBounds'] and result['world']==domain['terrainBounds']
        assert result['runtime']==result['render']==result['workshopCompiled']==expect
        landmarks=result['landmarks'];assert len(landmarks)==expected_owners
        if expected_owners==1:assert landmarks[0]==dict(**pose,kind='canonical-element',collisionIds=[],assetCollision=[],agreesCompiled=True)
        return True
    load(t,buffered('isolated-bare-r4.honro-map.json',data))
    assert preview(t)['compile']==preview(t)['preview']==expected
    open_player(t);assert actual(t)==expected
    bare_battle=physics(t)
    assert t.evaluate("""()=>{const a=HonroWorkshopAPI.getPlayApp();return !a.scene.canvas.ownerDocument.defaultView.HonroTerrainDomain.active(a.engine.b);}""")
    snap(t,'08-bare-r4-player-entry')
    t.context.close();t=fresh()
    r5=t.evaluate("""({data,domain})=>{
        const s=data.stages[0];
        for(const k of ['playBounds','terrainBounds','terrainDomainVersion','terrains'])s[k]=domain[k];
        if(HonroTerrainDomain.validate(s).length)throw Error('Stock domain schema rejected candidate');
        return HonroMaps.finalize(data);
    }""",dict(data=data,domain=domain))
    exact_places(r5,extended=True)
    data_color=t.evaluate("""({data,art,pose})=>{
        const errors=HonroVectorArt.validate(art.vector);
        if(errors.length)throw Error('Invalid stock A16 tree: '+errors);
        art.reference=HonroEnvironment.referenceForLegacyAsset(art);
        data.library.push(art);data.stages[0].elements=[pose];
        return HonroMaps.finalize(data);
    }""",dict(data=r5,art=art,pose=pose))
    exact_places(data_color,True,True)
    just_bare=copy.deepcopy(data_color);just_bare['library'].pop();just_bare['stages'][0]['elements']=[]
    assert just_bare==r5,'Beyond single appearance-owner addition'
    load(t,buffered('isolated-r5-a16.honro-map.json',data_color))
    before=project(t);exact_places(before,True,True)
    with t.expect_download() as d:t.locator('#exportBtn').click()
    export=out.parent/'r5-a16-synthetic.honro-map.json';d.value.save_as(export)
    assert json.loads(export.read_bytes())==before
    old=t;t=fresh();load(t,export);old.context.close()
    assert project(t)==before;exact_places(project(t),True,True)
    c=preview(t);assert c['compile']==c['preview']==expected
    note('exact-native-import-export-fresh-reopen',exportDigest=sha(export.read_bytes()),exactStockGeometry=True,pose=pose,vectorSource=sha(art_bytes))
    t.evaluate("HonroWorkshopAPI.setCamera({x:810,y:275,zoom:.65})")
    snap(t,'01-native-a16-reopened')
    open_player(t)
    assert actual(t)==expected and physics(t)==bare_battle and check_domain(t,1)
    note('live-exact-r4-r5-a16-physics-at-controlled-W-start',fields=list(bare_battle.keys()))
    js="""()=>{const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,u=e.active;
      return {id:u.id,side:u.side,x:u.x,y:u.y,vy:u.vy,h:u.h,move:u.moveLeft,round:e.b.round,hp:u.hp,
      walkSpeed:u.walkSpeed,launch:!!u.jumping,grounded:e.grounded(u),ready:a.canInput(),
      support:e.contactSurface(u.x,u.y-4,u.y+4)?.t.id??null,
      keys:[a.keys.has('KeyA'),a.keys.has('KeyD')]};}"""
    state=lambda:t.evaluate(js)
    start=state();actor=start['id']
    def verify(label,role,min_x,max_x):
        t.wait_for_function("""({sid,actor})=>{const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,u=e.active;
          return u.id===actor&&e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+4)?.t.id===sid;}""",arg={'sid':names[role],'actor':actor},timeout=5100)
        z=state()
        assert min_x<=z['x']<=max_x and abs(z['y']-surface(rings[role],z['x']))<4,z
        assert actual(t)==expected and project(t)==before and check_domain(t,1)
        snap(t,label);note(label,state=z,postSnapshotCollider=True,unchangedNativeSource=True)
        return z
    launch=verify('02-live-W-entry','W',411,413)
    assert launch['ready'] and launch['move']>440 and launch['h']>=70,launch
    assert 90<launch['y']<155
    def key_hold(key,expr,arg,timeout=8000):
        t.keyboard.down(key)
        try:t.wait_for_function(expr,arg=arg,polling='raf',timeout=timeout)
        finally:t.keyboard.up(key)
    stopX="""({x,d})=>{const e=HonroWorkshopAPI.getPlayApp().engine;return (e.active.x-x)*d>=0||e.active.moveLeft<=0;}"""
    def trace(label):
        t.evaluate("""({label,script})=>{
          const read=eval(script), s={done:false,frames:[]}, start=performance.now();window.__p6Trace=s;
          function tick(now){if(s.done||now-start>5300||s.frames.length>320)return;
            s.frames.push({ms:now-start,...read()});requestAnimationFrame(tick);}
          requestAnimationFrame(tick);
        }""",dict(label=label,script=js))
    def save_trace(label):
        a=t.evaluate("()=>{window.__p6Trace.done=true;return window.__p6Trace.frames}")
        note('normal-input-'+label,frames=a)
        return a
    trace('jump')
    try:
        t.keyboard.press('ControlLeft')
        t.wait_for_function("""y=>{const u=HonroWorkshopAPI.getPlayApp().engine.active;
          return u.jumping&&u.vy<0&&u.y<=y-12;}""",arg=launch['y'],timeout=1300,polling='raf')
        key_hold('KeyD',stopX,dict(x=686,d=1),timeout=3000)
        m=verify('04-live-M-land','M',685,710)
    finally:j=save_trace('jump')
    assert any(f['launch'] and f['vy']<0 for f in j)
    assert any(f['keys'][1] and f['launch'] and 456<f['x']<642 for f in j)
    assert any(f['keys'][1] and f['x']>=642 for f in j)
    assert m['move']<launch['move']
    # Descend around the real left lip, never through the solid; no Alt or changed physics.
    if m['move']<155:
        t.keyboard.press('KeyF')
        t.wait_for_function("r=>{const a=HonroWorkshopAPI.getPlayApp();return a.canInput()&&a.engine.b.round>r;}",arg=m['round'],timeout=14000)
        n=state();assert n['id']==actor and n['support']==names['M'] and n['move']>=155 and abs(m['x']-n['x'])<1
        note('ordinary-end-turn',before=m,after=n)
    trace('drop')
    try:
        key_hold('KeyA',stopX,dict(x=597,d=-1),timeout=4300)
        land=verify('05-live-B-return','B',580,600)
    finally:j=save_trace('drop')
    assert any(f['keys'][0] and f['x']<642 and not f['grounded'] for f in j)
    assert land['hp']==start['hp'] and land['id']==actor and not proof['pageErrors']
    proof['route']=['W','M','B'];proof['W']='controlled prelaunch spawn on real stock WestLookout; no lower-to-west access verified';proof['passed']=True
    note('passed-scoped-stock-player')
