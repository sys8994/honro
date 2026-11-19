"""Exact new W native geometry, controlled normal bottom-to-shoulder-to-crest route."""
import hashlib,json,os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
src=Path(__file__).with_name('slice.json').read_bytes()
sha=lambda data:hashlib.sha256(data).hexdigest()
assert sha(src)=='8f29f00d834a842087e4877ce271d6a20d58bcc02c236d59471cb7073e8398a1'
raw=json.loads(src)
base_bytes=Path(__file__).with_name('baseline-r4.json').read_bytes()
assert sha(base_bytes)=='212f0ecda5e0d835f0e051c680f460dbad7d1e7556dd4b25721fbef9d663cd3a'
stock=json.loads(base_bytes)
assert all(raw['owners'][i]==stock['owners'][i] for i in (0,2))
assert stock['owners'][1]!=raw['owners'][1] and not raw['art']
assert raw['owners'][1]['ring'][0]==stock['owners'][1]['ring'][0] and raw['owners'][1]['ring'][-1]==stock['owners'][1]['ring'][-1]
names={'B':'SupplyBasin','W':'WestLookout','M':'RescueOverhang'}
assert [r['id'] for r in raw['owners']]==list(names.values())
rings={k:raw['owners'][i]['ring'] for i,k in enumerate(names)}
assert list(map(len,rings.values()))==[74,73,112]
wanted={names[k]:[dict(x=x,y=y) for x,y in p] for k,p in rings.items()}
assert all(sum(x*Y-y*X for (x,y),(X,Y) in zip(p,p[1:]+p[:1]))>0 for p in rings.values())
def surface(p,q):
    return min(y+(q-x)*(Y-y)/(X-x) for (x,y),(X,Y) in zip(p,p[1:]+p[:1]) if min(x,X)<=q<max(x,X))
start_x=95
sid='qa-p6-new-west-shoulder'
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
assert sys.argv[2]=='http://127.0.0.1:8884/HONRO_WORKSHOP.html'
url=sys.argv[2]
proof={'scope':'Unchanged stock bare Workshop Player; exact new closed W shoulder, B and M equal original R4. Starts on B. No A18 art/domain/full campaign.','source':sha(src),'r4Source':sha(base_bytes),'visualBoundaryContextRun':44555134569,'checkpoints':[],'pageErrors':[],'passed':False}
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
      const s=HonroMaps.emptyStage(sid,'P6 new west ledge · bare terrain',1620,560);
      s.environment.placements=[];s.environment.hiddenLayers=['L2','L3','L4','L5'];
      s.environment.atmosphere.overrides={skyTop:'#151c23',skyBottom:'#151c23'};
      s.terrains=Object.values(names).map(id=>({id,name:id,layer:'terrain',type:'solid',points:wanted[id],baseMaterial:'rock',oneWay:false,breakable:false}));
      s.units=[HonroUnits.record('archer','p6-new-west-qa-scout',spawn[0],spawn[1],'player')];
      s.objectives=[{id:'qa-never-reached',type:'reach',label:'QA only',x:1170,y:74,radius:25,required:true}];
      const a={id:'qa-inert-empty',name:'Empty toolbar sentinel',category:'scenery',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
      a.reference=HonroEnvironment.referenceForLegacyAsset(a);
      return HonroMaps.finalize({schema:'honro-map',version:HonroMaps.VERSION,activeStageId:s.id,name:s.name,
        environmentVersion:HonroEnvironment.VERSION,settings:{autosave:false,grid:10},stages:[s],library:[a]});
      }""",dict(sid=sid,wanted=wanted,names=names,spawn=[start_x,surface(rings['B'],start_x)]))
    def exact_places(p):
        s=p['stages'][0]
        assert len(p['stages'])==1 and [s['width'],s['height']]==[1620,560]
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
    t.evaluate("HonroWorkshopAPI.setCamera({x:510,y:280,zoom:.65})")
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
    verify('02-live-B-entry','B',94,96)
    def key_hold(key,expr,arg,timeout=8000):
        t.keyboard.down(key)
        try:t.wait_for_function(expr,arg=arg,polling='raf',timeout=timeout)
        finally:t.keyboard.up(key)
    stopX="""({x,d})=>{const e=HonroWorkshopAPI.getPlayApp().engine;return (e.active.x-x)*d>=0||e.active.moveLeft<=0;}"""
    key_hold('KeyD',stopX,dict(x=589,d=1))
    launch=verify('03-live-B-launch','B',588,605)
    assert launch['ready'] and launch['move']>260,launch
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
    def jump_left(label,limit,target_x,role,min_x,max_x):
        before=state()
        assert before['ready'] and before['grounded'] and before['move']>=210,before
        trace(label)
        try:
            t.keyboard.press('ControlLeft')
            t.wait_for_function("""y=>{const u=HonroWorkshopAPI.getPlayApp().engine.active;
              return u.jumping&&u.vy<0&&u.y<=y;}""",arg=limit,timeout=1800,polling='raf')
            key_hold('KeyA',stopX,dict(x=target_x,d=-1),timeout=3000)
            after=verify(label,role,min_x,max_x)
        finally:j=save_trace(label)
        assert any(f['launch'] and f['vy']<0 for f in j)
        assert any(f['keys'][0] and f['launch'] and f['x']<before['x']-20 for f in j)
        assert after['move']<before['move'] and after['id']==actor and after['hp']==start['hp']
        return after
    mid=jump_left('04-live-W-shoulder',234,520,'W',505,521)
    assert 262<=mid['y']<=271,mid
    # Second independent jump starts on proved intermediate part of same W solid.
    # No reset if adequate budget; only the game's normal F if truly needed.
    if mid['move']<210:
        t.keyboard.press('KeyF')
        t.wait_for_function("r=>{const a=HonroWorkshopAPI.getPlayApp();return a.canInput()&&a.engine.b.round>r;}",arg=mid['round'],timeout=14000)
        n=state();assert n['id']==actor and n['support']==names['W'] and n['move']>=210 and abs(mid['x']-n['x'])<1
        note('ordinary-end-turn',before=mid,after=n)
    summit=jump_left('05-live-W-crest',126,424,'W',404,425)
    assert 139<=summit['y']<=147 and mid['y']-summit['y']>110 and not proof['pageErrors']
    proof['route']=['B','W:shoulder','W:crest'];proof['M']='unchanged exact R4 geometry, no HONRO replay in this run';proof['passed']=True
    note('passed-scoped-stock-player')
