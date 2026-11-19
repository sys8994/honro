"""Fused C arch and the optional EAST lookout in stock Player."""
import hashlib,json,os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
src=Path(__file__).with_name('integrated.json').read_bytes()
sha=lambda data:hashlib.sha256(data).hexdigest()
assert sha(src)=='3ba9842d145315bdb5480d016d8a751c51f318bb3970c95e9466615464d043c9'
raw=json.loads(src)
assert raw['width']==6500 and raw['source']['master']=='1e043b09d4ce107e1d2dcf70fe2274dff7098476'
assert raw['erodedCap']['maxX']==6325 and raw['eastOutlet']['roofEnd'][0]==6300
names={'M':'MAIN_ESCORT_C_FULL','B':'LOWER_ROOT','E':'EAST_OPTIONAL_LOOKOUT'}
assert [r['id'] for r in raw['owners']]==list(names.values())
rings={k:raw['owners'][i]['ring'] for i,k in enumerate(names)}
assert list(map(len,rings.values()))==[416,235,97]
wanted={names[k]:[dict(x=x,y=y) for x,y in p] for k,p in rings.items()}
assert all(sum(x*Y-y*X for (x,y),(X,Y) in zip(p,p[1:]+p[:1]))>0 for p in rings.values())
assert max(y for p in rings.values() for x,y in p)==1900
def surface(p,q):
    return min(y+(q-x)*(Y-y)/(X-x) for (x,y),(X,Y) in zip(p,p[1:]+p[:1]) if min(x,X)<=q<max(x,X))
start_x=2860
sid='qa-c-fused-east-lookout-6500'
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
assert sys.argv[2]=='http://127.0.0.1:8884/HONRO_WORKSHOP.html'
url=sys.argv[2]
proof={'scope':'Unchanged stock bare Workshop Player, synthetic Archer same legal MAIN spawn, fused #31 MAIN/LOWER and #32 EAST. No campaign/escort/art claim.','source':sha(src),'checkpoints':[],'pageErrors':[],'passed':False}
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
      const s=HonroMaps.emptyStage(sid,'C arch and east lookout · bare terrain',6500,1900);
      s.environment.placements=[];s.environment.hiddenLayers=['L2','L3','L4','L5'];
      s.environment.atmosphere.overrides={skyTop:'#151c23',skyBottom:'#151c23'};
      s.terrains=Object.values(names).map(id=>({id,name:id,layer:'terrain',type:'solid',points:wanted[id],baseMaterial:'rock',oneWay:false,breakable:false}));
      s.units=[HonroUnits.record('archer','east-lookout-qa-scout',spawn[0],spawn[1],'player')];
      s.objectives=[{id:'qa-never-reached',type:'reach',label:'QA only',x:20,y:100,radius:25,required:true}];
      const a={id:'qa-inert-empty',name:'Empty toolbar sentinel',category:'scenery',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
      a.reference=HonroEnvironment.referenceForLegacyAsset(a);
      return HonroMaps.finalize({schema:'honro-map',version:HonroMaps.VERSION,activeStageId:s.id,name:s.name,
        environmentVersion:HonroEnvironment.VERSION,settings:{autosave:false,grid:10},stages:[s],library:[a]});
      }""",dict(sid=sid,wanted=wanted,names=names,spawn=[start_x,surface(rings['M'],start_x)]))
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
    t.evaluate("HonroWorkshopAPI.setCamera({x:3890,y:640,zoom:.28})")
    snap(t,'01-native-slice-reopened')
    def enter(page):
        page.locator('[data-tab=play]').click()
        page.wait_for_function('!!HonroWorkshopAPI.getPlayApp()?.engine',timeout=45000)
        page.wait_for_function('HonroWorkshopAPI.getPlayApp().canInput()',timeout=17000)
        page.locator('#runtimeFrame').evaluate('f=>f.contentWindow.focus()')
    enter(t)
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
    start=verify('02-main-control-entry','M',2859,2861)
    def hold(target,timeout=8500):
        t.keyboard.down('KeyD')
        try:t.wait_for_function("""x=>{const u=HonroWorkshopAPI.getPlayApp().engine.active;
                return u.x>=x||u.moveLeft<=8;}""",arg=target,timeout=timeout,polling='raf')
        finally:t.keyboard.up('KeyD')
    def trace(limit):
        t.evaluate("""({script,limit})=>{
           const read=eval(script),r={done:false,frames:[]},s=performance.now();window.__trial=r;
           function tick(now){if(r.done||now-s>limit||r.frames.length>=2500)return;
             r.frames.push({ms:Math.round(now-s),...read()});requestAnimationFrame(tick);}
           requestAnimationFrame(tick);
        }""",dict(script=js,limit=limit))
    def done(label):
        rows=t.evaluate("()=>{window.__trial.done=true;return window.__trial.frames;}")
        note('input-'+label,frames=rows);return rows
    def end_turn(label):
        old=state();assert old['ready'] and old['id']==actor and old['grounded']
        t.keyboard.press('KeyF')
        t.wait_for_function("""r=>{const a=HonroWorkshopAPI.getPlayApp();return a.canInput()&&a.engine.b.round>r;}""",
                             arg=old['round'],timeout=13000)
        new=state()
        assert new['id']==actor and new['support']==old['support'] and new['move']>old['move']+30 and abs(new['x']-old['x'])<2
        note('ordinary-F-'+label,before=old,after=new)
    def walk(label,role,target,min_x,max_x,n):
        trace(43000);used=0
        try:
            for _ in range(5):
                pre=state()
                assert pre['id']==actor and pre['support']==names[role] and pre['grounded'] and pre['ready']
                hold(target);z=state()
                if min_x<=z['x']<=max_x:
                    end=verify(label,role,min_x,max_x);break
                if z['move']>8 or z['x']-pre['x']<40 or used==4:
                    raise AssertionError(('Stopped before endpoint, do not modify exact geometry',label,pre,z))
                end_turn(label);used+=1
            else:raise AssertionError(('Leg incomplete',label))
        finally:rows=done(label)
        taken=[f for f in rows if f['keys'][1]]
        assert len(taken)>=n and all(f['id']==actor and f['support']==names[role] and not f['launch'] and f['grounded'] for f in taken)
        note(label+'-grounded-walking',normalF=used,end=end)
        return end
    control=walk('03-main-bypass','M',4980,4979,4998,70)
    assert control['hp']==start['hp']
    t.context.close();t=fresh();load(t,export)
    assert project(t)==before
    enter(t);assert actual()==expected
    fresh_start=verify('04-main-branch-entry','M',2859,2861)
    assert fresh_start==start,('Independent stock spawn mismatch',start,fresh_start)
    launch=walk('05-main-launch','M',2962,2961,2978,4)
    assert launch['move']>370
    trace(6500)
    try:
        t.keyboard.press('ControlLeft')
        t.wait_for_function("""()=>{const u=HonroWorkshopAPI.getPlayApp().engine.active;
            return u.jumping&&u.vy<0&&u.y<=629;}""",timeout=1600,polling='raf')
        hold(3210,3800)
        landing=verify('06-east-lookout-contact','E',3208,3226)
    finally:j=done('normal-jump')
    first_e=next((f for f in j if f['grounded'] and f['support']==names['E'] and not f['launch']),None)
    assert first_e and 3097<first_e['x']<=landing['x']+2 and landing['hp']==start['hp'],first_e
    assert any(f['launch'] and f['keys'][1] and 2975<f['x']<3085 for f in j)
    note('first-real-east-contact',first=first_e,final=landing)
    threshold=walk('07-east-lookout-traverse','E',4756,4754,4775,65)
    if threshold['move']<300:end_turn('return-step-off-budget')
    trace(6500)
    try:
        hold(4980,4600)
        home=verify('08-main-return','M',4979,4998)
    finally:j=done('east-visible-step-off')
    assert any(f['keys'][1] and 4815<f['x']<4978 and not f['grounded'] and not f['launch'] for f in j)
    assert all(not f['launch'] for f in j)
    assert home['id']==actor and home['hp']==start['hp'] and not proof['pageErrors']
    proof['routes']={'control':['MAIN','MAIN-bypass'],'choice':['MAIN','EAST','EAST-step-off','MAIN']}
    proof['passed']=True;note('passed-stock-east-lookout-choice-and-main-bypass')
