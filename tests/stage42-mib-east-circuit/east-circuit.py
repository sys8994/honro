"""Controlled stock daytime east circuit; three exact full-width C solids."""
import hashlib,json,os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
src=Path(__file__).with_name('integrated.json').read_bytes()
sha=lambda data:hashlib.sha256(data).hexdigest()
assert sha(src)=='740bcff991e67c3107be927c0e5ecc42f641ad2a19e59dd32d225f35fb231611'
raw=json.loads(src)
assert raw['width']==6500 and raw['source']['master']=='1e043b09d4ce107e1d2dcf70fe2274dff7098476'
assert raw['erodedCap']['maxX']==6325 and raw['eastOutlet']['roofEnd'][0]==6300
names={'M':'MAIN_ESCORT_C_FULL','B':'LOWER_ROOT','U':'UPPER_LOOKOUT_ROOT'}
assert [r['id'] for r in raw['owners']]==list(names.values())
rings={k:raw['owners'][i]['ring'] for i,k in enumerate(names)}
assert list(map(len,rings.values()))==[402,235,56]
wanted={names[k]:[dict(x=x,y=y) for x,y in p] for k,p in rings.items()}
assert all(sum(x*Y-y*X for (x,y),(X,Y) in zip(p,p[1:]+p[:1]))>0 for p in rings.values())
assert max(y for p in rings.values() for x,y in p)==1900
def surface(p,q):
    return min(y+(q-x)*(Y-y)/(X-x) for (x,y),(X,Y) in zip(p,p[1:]+p[:1]) if min(x,X)<=q<max(x,X))
start_x=6460
sid='qa-p6-east-circuit-6500'
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
assert sys.argv[2]=='http://127.0.0.1:8884/HONRO_WORKSHOP.html'
url=sys.argv[2]
proof={'scope':'Unchanged stock bare Workshop Player, single synthetic Archer controlled start on legal east LOWER_ROOT, exact C east eroded solid geometry. No campaign/escort/art claim.','source':sha(src),'checkpoints':[],'pageErrors':[],'passed':False}
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
      const s=HonroMaps.emptyStage(sid,'C east circuit 6500 · bare terrain',6500,1900);
      s.environment.placements=[];s.environment.hiddenLayers=['L2','L3','L4','L5'];
      s.environment.atmosphere.overrides={skyTop:'#151c23',skyBottom:'#151c23'};
      s.terrains=Object.values(names).map(id=>({id,name:id,layer:'terrain',type:'solid',points:wanted[id],baseMaterial:'rock',oneWay:false,breakable:false}));
      s.units=[HonroUnits.record('archer','east-circuit-qa-scout',spawn[0],spawn[1],'player')];
      s.objectives=[{id:'qa-never-reached',type:'reach',label:'QA only',x:20,y:100,radius:25,required:true}];
      const a={id:'qa-inert-empty',name:'Empty toolbar sentinel',category:'scenery',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
      a.reference=HonroEnvironment.referenceForLegacyAsset(a);
      return HonroMaps.finalize({schema:'honro-map',version:HonroMaps.VERSION,activeStageId:s.id,name:s.name,
        environmentVersion:HonroEnvironment.VERSION,settings:{autosave:false,grid:10},stages:[s],library:[a]});
      }""",dict(sid=sid,wanted=wanted,names=names,spawn=[start_x,surface(rings['B'],start_x)]))
    def exact_places(p):
        s=p['stages'][0]
        assert len(p['stages'])==1 and [s['width'],s['height']]==[6500,1900]
        assert not s['elements'] and not s['materials'] and not s['environment']['placements'] and len(s['units'])==1
        assert len(p['library'])==1 and not p['library'][0]['visual'] and not p['library'][0]['collision']
        assert list(v['id'] for v in s['terrains'])==list(names.values())
        assert all(v['type']=='solid' and v['oneWay'] is False and not v.get('playProjection') for v in s['terrains'])
        assert {v['id']:v['points'] for v in s['terrains']}==wanted
    exact_places(data)
    load(t,dict(name='isolated-p6r3.honro-map.json',mimeType='application/json',buffer=json.dumps(data).encode()))
    before=project(t);exact_places(before)
    with t.expect_download() as d:t.locator('#exportBtn').click()
    export=out.parent/'p6r3-only-synthetic.honro-map.json';d.value.save_as(export)
    assert json.loads(export.read_bytes())==before
    old=t;t=fresh();load(t,export);old.context.close()
    assert project(t)==before;exact_places(project(t))
    expected=[{'id':i,'oneWay':False,'vertices':v} for i,v in wanted.items()]
    c=preview(t);assert c['compile']==c['preview']==expected
    note('exact-native-import-export-fresh-reopen',exportDigest=sha(export.read_bytes()),closedCounts={k:len(v) for k,v in rings.items()},exactStockGeometry=True)
    t.evaluate("HonroWorkshopAPI.setCamera({x:3250,y:960,zoom:.18})")
    snap(t,'01-native-slice-reopened')
    t.locator('[data-tab=play]').click()
    t.wait_for_function('!!HonroWorkshopAPI.getPlayApp()?.engine',timeout=45000)
    t.wait_for_function('HonroWorkshopAPI.getPlayApp().canInput()',timeout=17000)
    t.locator('#runtimeFrame').evaluate('f=>f.contentWindow.focus()')
    def actual():return t.evaluate("""()=>HonroWorkshopAPI.getPlayApp().engine.b.terrain.map(t=>({id:t.id,oneWay:t.oneWay,vertices:t.vertices}))""")
    assert actual()==expected
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
        assert actual()==expected and project(t)==before
        snap(t,label);note(label,state=z,postSnapshotCollider=True,unchangedNativeSource=True)
        return z
    start=verify('02-live-east-outdoor','B',6459,6461)
    assert start['ready'] and start['grounded']
    def hold(key,x,d,timeout=8500):
        t.keyboard.down(key)
        try:
            t.wait_for_function("""({x,d})=>{const u=HonroWorkshopAPI.getPlayApp().engine.active;
                return (u.x-x)*d>=0||u.moveLeft<=8;}""",arg=dict(x=x,d=d),timeout=timeout,polling='raf')
        finally:t.keyboard.up(key)
    def log_start(label,ms):
        t.evaluate("""({label,script,ms})=>{
           const read=eval(script),r={done:false,frames:[]},start=performance.now();window.__eastTrace=r;
           function tick(now){if(r.done||now-start>ms||r.frames.length>2500)return;
             const f=read();r.frames.push({ms:Math.round(now-start),...f});requestAnimationFrame(tick);}
           requestAnimationFrame(tick);
        }""",dict(label=label,script=js,ms=ms))
    def log_end(label):
        rows=t.evaluate("()=>{window.__eastTrace.done=true;return window.__eastTrace.frames;}")
        note('input-'+label,frames=rows);return rows
    def real_turn(label):
        old=state()
        assert old['ready'] and old['id']==actor and old['grounded']
        t.keyboard.press('KeyF')
        t.wait_for_function("""r=>{const a=HonroWorkshopAPI.getPlayApp();return a.canInput()&&a.engine.b.round>r;}""",
                            arg=old['round'],timeout=13000)
        new=state()
        assert new['id']==actor and new['support']==old['support'] and new['move']>old['move']+30 and abs(new['x']-old['x'])<2
        note('normal-F-'+label,before=old,after=new)
    def walk_leg(label,dir,target,min_x,max_x):
        key='KeyA' if dir<0 else 'KeyD'
        log_start(label,43000)
        used=0
        try:
            for _ in range(5):
                pre=state()
                assert pre['id']==actor and pre['support']==names['B'] and pre['grounded'] and pre['ready']
                hold(key,target,dir)
                z=state()
                if min_x<=z['x']<=max_x:
                    end=verify(label,'B',min_x,max_x)
                    break
                if z['move']>8 or (z['x']-pre['x'])*dir<50 or used==4:
                    raise AssertionError(('Stopped before endpoint, do not alter geometry',label,pre,z))
                real_turn(label);used+=1
            else:raise AssertionError(('No route completion',label))
        finally:rows=log_end(label)
        assert len(rows)>70 and all(f['id']==actor for f in rows)
        advancing=[f for f in rows if f['keys'][0 if dir<0 else 1]]
        assert advancing and all(f['support']==names['B'] and not f['launch'] and f['grounded'] for f in advancing)
        note(label+'-scope',normalF=used,groundedAllObservedMovement=True,direction=dir,end=end)
        return end
    beneath=walk_leg('03-live-lower-below-refuge',-1,3602,3585,3604)
    assert beneath['y']-surface(rings['M'],beneath['x'])>350
    launch=walk_leg('04-live-east-portal-return',1,6367,6366,6382)
    assert launch['x']>raw['erodedCap']['maxX']+33
    if launch['move']<330:real_turn('portal-jump-budget')
    log_start('east-lip-jump',6500)
    try:
        t.keyboard.press('ControlLeft')
        t.wait_for_function("""()=>{const u=HonroWorkshopAPI.getPlayApp().engine.active;
            return u.jumping&&u.vy<0&&u.y<=657;}""",timeout=1800,polling='raf')
        hold('KeyA',6190,-1,4000)
        land=verify('05-live-main-eastern-tread','M',6173,6191)
    finally:rows=log_end('east-lip-jump')
    first_land=next((f for f in rows if f['support']==names['M'] and f['grounded'] and not f['launch']),None)
    assert first_land and first_land['x']<=6301 and first_land['x']>=land['x']-4,first_land
    assert any(f['launch'] and f['keys'][0] and 6280<f['x']<6326 and f['y']<664 for f in rows)
    assert land['id']==actor and land['hp']==start['hp'] and not proof['pageErrors']
    note('first-actual-upper-main-landing',state=first_land,finalTread=land)
    proof['route']=['outdoor-Lower','below-refuge-Lower','east-return-Lower','ordinaryCtrl-main']
    proof['passed']=True;note('passed-scoped-native-east-circuit')
