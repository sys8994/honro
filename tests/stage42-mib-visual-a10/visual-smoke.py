"""Apply exact external A10 as one visual-only owner over approved stock P6r3 source."""
import base64,copy,hashlib,json,os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
src=Path(__file__).with_name('slice.json').read_bytes()
sha=lambda data:hashlib.sha256(data).hexdigest()
assert sha(src)=='7a6cc9aa56d0916634be76e5a3baf359596c0da7725d9f45f0eb284e13fac498'
raw=json.loads(src)
art_bytes=Path(__file__).with_name('A10-honro-asset.json').read_bytes()
assert sha(art_bytes)=='e04c8abf48f35d9550de0207d86f53953d131debf3ef6478ee45b4349a4a8359'
art=json.loads(art_bytes)
pose=dict(id='qa-p6-r3-a10-surface',assetId=art['id'],layer='prop',depthLayer='L1',
          x=0,y=0,scale=1,rotation=0,snap=False)
assert art['collision']==art['visual']==[] and art['anchor']==dict(x=0,y=0)
assert art['vector']['viewBox']==[0,0,1210,560] and art['params']==dict(semanticLayer='BODY',silhouetteUnderpaint=False)
assert not art.get('interactionType') and art.get('renderer') is None
names={'B':'SupplyBasin','W':'WestLookout','M':'RescueOverhang'}
assert [r['id'] for r in raw['owners']]==list(names.values())
rings={k:raw['owners'][i]['ring'] for i,k in enumerate(names)}
assert list(map(len,rings.values()))==[74,61,70]
wanted={names[k]:[dict(x=x,y=y) for x,y in p] for k,p in rings.items()}
assert all(sum(x*Y-y*X for (x,y),(X,Y) in zip(p,p[1:]+p[:1]))>0 for p in rings.values())
def surface(p,q):
    return min(y+(q-x)*(Y-y)/(X-x) for (x,y),(X,Y) in zip(p,p[1:]+p[:1]) if min(x,X)<=q<max(x,X))
start_x=95
sid='qa-p6r3-slice'
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
assert sys.argv[2]=='http://127.0.0.1:8884/HONRO_WORKSHOP.html'
url=sys.argv[2]
proof={'scope':'Exact A10 visual-only specimen over established external P6r3 solids, native stock Workshop Player. Synthetic one Archer, no story/combat/W route or final art.','source':sha(src),'asset':sha(art_bytes),'checkpoints':[],'pageErrors':[],'passed':False}
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
      const s=HonroMaps.emptyStage(sid,'P6r3 isolated physical slice',1210,560);
      s.environment.placements=[];s.environment.hiddenLayers=['L2','L3','L4','L5'];
      s.environment.atmosphere.overrides={skyTop:'#151c23',skyBottom:'#151c23'};
      s.terrains=Object.values(names).map(id=>({id,name:id,layer:'terrain',type:'solid',points:wanted[id],baseMaterial:'rock',oneWay:false,breakable:false}));
      s.units=[HonroUnits.record('archer','p6-r3-qa-scout',spawn[0],spawn[1],'player')];
      s.objectives=[{id:'qa-never-reached',type:'reach',label:'QA only',x:1170,y:74,radius:25,required:true}];
      const a={id:'qa-inert-empty',name:'Empty toolbar sentinel',category:'scenery',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
      a.reference=HonroEnvironment.referenceForLegacyAsset(a);
      return HonroMaps.finalize({schema:'honro-map',version:HonroMaps.VERSION,activeStageId:s.id,name:s.name,
        environmentVersion:HonroEnvironment.VERSION,settings:{autosave:false,grid:10},stages:[s],library:[a]});
      }""",dict(sid=sid,wanted=wanted,names=names,spawn=[start_x,surface(rings['B'],start_x)]))
    def exact_places(p,colored=False):
        s=p['stages'][0]
        assert len(p['stages'])==1 and [s['width'],s['height']]==[1210,560]
        assert (not s['elements'] if not colored else s['elements']==[pose])
        assert not s['materials'] and not s['environment']['placements'] and len(s['units'])==1
        assert len(p['library'])==(2 if colored else 1) and not p['library'][0]['visual'] and not p['library'][0]['collision']
        if colored:assert {key:p['library'][1][key] for key in art}==art
        assert list(v['id'] for v in s['terrains'])==list(names.values())
        assert all(v['type']=='solid' and v['oneWay'] is False and not v.get('playProjection') for v in s['terrains'])
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
    def native_png(page,baseline=None,colored=False):
        ans=page.evaluate("""async ({pose,colored,baseline})=>{
          const app=HonroWorkshopAPI.getPlayApp(),e=app.engine,b=e.b,
            cv=app.scene.canvas,w=cv.ownerDocument.defaultView,p=HonroWorkshopAPI.getProject(),
            compile=HonroMaps.compile(p.stages[0],p),
            clone=x=>JSON.stringify(x),snapshot=()=>clone([b.terrain,b.units,b.phase,b.round,b.honroLandmarks,
                app.scene.x,app.scene.y,app.scene.scale]);
          const landmarks=b.honroLandmarks||[];
          if((colored?1:0)!==landmarks.length||b.terrain.some(t=>t.honroElementCollision))throw Error('Unexpected native owner/physics');
          if(colored){
            const l=landmarks[0],s=compile.landmarks[0];
            if(l.kind!=='canonical-element'||l.asset?.id!==pose.assetId||l.collisionIds.length||l.asset.collision.length||
               clone(l.asset.vector)!==clone(s.asset.vector)||Object.keys(pose).some(k=>l[k]!==pose[k]))throw Error('Visual owner/pose drift');
          }
          const decoded=baseline?await new Promise((ok,err)=>{const img=new w.Image();img.onload=()=>ok(img);img.onerror=err;img.src=baseline;}):null;
          const before=snapshot();
          const raster=()=>{
            const det=cv.ownerDocument.createElement('canvas'),scene=new w.HonroScene(det);
            Object.assign(scene,{battle:b,x:605,y:280,scale:.7,time:2,manual:true});
            let calls=0;
            const land=scene.landmark;
            scene.landmark=function(c,l){if(l.id===pose.id)calls++;return land.call(this,c,l);};
            const rng=w.Math.random;let z=3910;
            try{
              w.Math.random=()=>((z=(z*1664525+1013904223)>>>0)/2**32);
              const q=scene._buildStaticWorld(b,1210);
              return {canvas:q.canvas,rs:q.rs,calls};
            }finally{w.Math.random=rng;}
          };
          const p0=raster(),p1=raster();
          const pixels=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
          const img1=pixels(p0.canvas),img2=pixels(p1.canvas);
          if(img1.some((x,i)=>x!==img2[i]))throw Error('Same-arm stock raster was not exact');
          if(colored&&p0.calls<1||!colored&&p0.calls!==0)throw Error('Expected native land pass not drawn');
          let stats=null;
          if(decoded){
            if(decoded.width!==p0.canvas.width||decoded.height!==p0.canvas.height)throw Error('Raster comparison size drift');
            const base=cv.ownerDocument.createElement('canvas');
            base.width=decoded.width;base.height=decoded.height;
            base.getContext('2d').drawImage(decoded,0,0);
            const bare=pixels(base);let changed=0,material=0,clipAlphaLost=0;
            for(let i=0;i<img1.length;i+=4){
             let d=0;for(let k=0;k<3;k++)d=Math.max(d,Math.abs(bare[i+k]-img1[i+k]));
             if(d>8)changed++;
             if(d>8&&bare[i+3]>=240&&img1[i+3]>=240)material++;
             if(bare[i+3]>=240&&img1[i+3]<240)clipAlphaLost++;
            }
            if(changed<7000||material<6000||clipAlphaLost)throw Error('Native vector did not visibly paint existing solids: '+JSON.stringify({changed,material,clipAlphaLost}));
            stats={changed,maxChannelDeltaThreshold:8,material,clipAlphaLost};
          }
          if(snapshot()!==before)throw Error('Diagnostic modified active battle/camera');
          return {png:p0.canvas.toDataURL('image/png'),size:[p0.canvas.width,p0.canvas.height],scale:p0.rs,
                  cameraWorld:[0,0,b.width,b.height],calls:p0.calls,stats,repeatExact:true};
        }""",dict(pose=pose,colored=colored,baseline=baseline))
        data_url=ans.pop('png')
        label='07-a10-stock-static' if colored else '06-bare-stock-static'
        (out/(label+'.png')).write_bytes(base64.b64decode(data_url.split(',',1)[1],validate=True))
        note(label,diagnosticOnly=True,remoteRuntimeChanges=False,**ans)
        return data_url
    def buffered(name,d):
        return dict(name=name,mimeType='application/json',buffer=json.dumps(d).encode())
    load(t,buffered('isolated-p6r3-bare.honro-map.json',data))
    assert preview(t)['compile']==preview(t)['preview']==expected
    open_player(t);assert actual(t)==expected
    bare_battle=physics(t)
    snap(t,'08-bare-player-entry')
    bare_png=native_png(t)
    t.context.close();t=fresh()
    data_color=t.evaluate("""({data,art,pose})=>{
        if(HonroVectorArt.validate(art.vector).length)throw Error('Invalid stock A10 tree');
        art.reference=HonroEnvironment.referenceForLegacyAsset(art);
        data.library.push(art);data.stages[0].elements=[pose];
        return HonroMaps.finalize(data);
    }""",dict(data=data,art=art,pose=pose))
    exact_places(data_color,True)
    just_bare=copy.deepcopy(data_color)
    just_bare['library'].pop();just_bare['stages'][0]['elements']=[]
    assert just_bare==data,'Other source changes were accidentally introduced'
    load(t,buffered('isolated-p6r3-a10.honro-map.json',data_color))
    before=project(t);exact_places(before,True)
    with t.expect_download() as d:t.locator('#exportBtn').click()
    export=out.parent/'p6r3-a10-only-synthetic.honro-map.json';d.value.save_as(export)
    assert json.loads(export.read_bytes())==before
    old=t;t=fresh();load(t,export);old.context.close()
    assert project(t)==before;exact_places(project(t),True)
    c=preview(t);assert c['compile']==c['preview']==expected
    note('exact-native-import-export-fresh-reopen',exportDigest=sha(export.read_bytes()),closedCounts={k:len(v) for k,v in rings.items()},exactStockGeometry=True,pose=pose,vectorSource=sha(art_bytes))
    t.evaluate("HonroWorkshopAPI.setCamera({x:605,y:275,zoom:.7})")
    snap(t,'01-native-a10-reopened')
    open_player(t)
    assert actual(t)==expected and physics(t)==bare_battle,'Actual baseline/visual physics drift'
    note('stock-player-ab-physics-exact',fields=list(bare_battle.keys()))
    native_png(t,bare_png,True)
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
        assert actual(t)==expected and project(t)==before
        snap(t,label);note(label,state=z,postSnapshotCollider=True,unchangedNativeSource=True)
        return z
    verify('02-live-B-entry','B',94,96)
    def key_hold(key,expr,arg,timeout=8000):
        t.keyboard.down(key)
        try:t.wait_for_function(expr,arg=arg,polling='raf',timeout=timeout)
        finally:t.keyboard.up(key)
    stopX="""({x,d})=>{const e=HonroWorkshopAPI.getPlayApp().engine;return (e.active.x-x)*d>=0||e.active.moveLeft<=0;}"""
    key_hold('KeyD',stopX,dict(x=599,d=1))
    launch=verify('03-live-B-launch','B',598,614)
    assert launch['ready'] and launch['move']>180,launch
    def trace(label):
        t.evaluate("""({label,script})=>{
          const read=eval(script), s={done:false,frames:[]}, start=performance.now();window.__p6Trace=s;
          function tick(now){if(s.done||now-start>5300||s.frames.length>320)return;
            s.frames.push({ms:now-start,...read()});requestAnimationFrame(tick);}
          requestAnimationFrame(tick);
        }""",dict(label=label,script=js))
    def save_trace(label):
        a=t.evaluate("()=>{window.__p6Trace.done=true;return window.__p6Trace.frames}")
        dump('trace-'+label+'.json',a)
        return a
    trace('jump')
    try:
        t.keyboard.press('ControlLeft')
        t.wait_for_function("""()=>{const u=HonroWorkshopAPI.getPlayApp().engine.active;
          return u.jumping&&u.vy<0&&u.y<=232;}""",timeout=1800,polling='raf')
        key_hold('KeyD',stopX,dict(x=686,d=1),timeout=2600)
        m=verify('04-live-M-land','M',685,710)
    finally:j=save_trace('jump')
    assert any(f['launch'] and f['vy']<0 for f in j)
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
    proof['route']=['B','M','B'];proof['W']='exact solid only; no HONRO traversal verified';proof['passed']=True
    note('passed-scoped-stock-player')
