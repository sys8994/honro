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
sources={}
for var,i,digest in [('A18','mib-p6r5-a18-world','c48a840f7b6a0f68748dc9967c2f9bcf7aa2cb0b2be81e5d5517bb0835543a53'),
                     ('A24','mib-p6r5-a24-shelter','59c0faf849f59c79bf213b0da30f28c5a00474c1e78b411b4451e245652232e0')]:
    bs=Path(__file__).with_name(var+'-honro-asset.json').read_bytes();assert sha(bs)==digest
    asset=json.loads(bs);assert asset['id']==i and asset['vector']['viewBox']==[-2050,-620,5790,2580]
    assert asset['collision']==asset['visual']==[] and not asset.get('interactionType') and 'renderer' not in asset
    sources[var]=(asset,dict(id='qa-refuge-visual-only',assetId=i,layer='prop',depthLayer='L1',x=0,y=0,scale=1,rotation=0,snap=False),digest)
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
start_x=95
sid='qa-p6-shelter-readability'
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
assert sys.argv[2]=='http://127.0.0.1:8884/HONRO_WORKSHOP.html'
url=sys.argv[2]
proof={'scope':'Two isolated actual Player runs over exact R5; A18 versus A24 source-only visual comparison, non-shooting live projectile collision probes.',
       'source':sha(src),'domain':sha(domain_bytes),'assets':{k:v[2] for k,v in sources.items()},'checkpoints':[],'pageErrors':[],'passed':False}
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
      const s=HonroMaps.emptyStage(sid,'P6r5 isolated refuge comparison',1620,560);
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
    r5=t.evaluate("""({data,domain})=>{
        for(const k of ['playBounds','terrainBounds','terrainDomainVersion','terrains'])data.stages[0][k]=domain[k];
        if(HonroTerrainDomain.validate(data.stages[0]).length)throw Error('Invalid R5');
        return HonroMaps.finalize(data);
    }""",dict(data=data,domain=domain))
    t.context.close()
    js="""()=>{const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,u=e.active;
      return {id:u.id,side:u.side,x:u.x,y:u.y,vy:u.vy,h:u.h,move:u.moveLeft,round:e.b.round,hp:u.hp,
      walkSpeed:u.walkSpeed,launch:!!u.jumping,grounded:e.grounded(u),ready:a.canInput(),
      support:e.contactSurface(u.x,u.y-4,u.y+4)?.t.id??null,
      keys:[a.keys.has('KeyA'),a.keys.has('KeyD')]};}"""
    compare_photos={}; baseline_physics=None; collision_rows={}
    for var,(art,pose,digest) in sources.items():
        t=fresh()
        authored=t.evaluate("""({r5,art,pose})=>{
           if(HonroVectorArt.validate(art.vector).length)throw Error('Invalid native vector');
           art.reference=HonroEnvironment.referenceForLegacyAsset(art);
           r5.library.push(art);r5.stages[0].elements=[pose];return HonroMaps.finalize(r5);
        }""",dict(r5=r5,art=art,pose=pose))
        exact_places(authored,True,True)
        test=copy.deepcopy(authored);test['library'].pop();test['stages'][0]['elements']=[]
        assert test==r5
        load(t,buffered(var+'-initial.honro-map.json',authored));before=project(t)
        with t.expect_download() as d:t.locator('#exportBtn').click()
        p=out.parent/(var+'-synthetic.honro-map.json');d.value.save_as(p)
        assert json.loads(p.read_bytes())==before
        t.context.close();t=fresh();load(t,p)
        assert project(t)==before and preview(t)['compile']==preview(t)['preview']==expected
        open_player(t);assert actual(t)==expected and check_domain(t,1)
        if baseline_physics is None: baseline_physics=physics(t)
        else: assert physics(t)==baseline_physics
        note(var+'-stock-native-reopen',exactCollision=True,asset=digest)
        state=lambda:t.evaluate(js)
        start=state();actor=start['id']
        def verify(role,x0,x1):
            t.wait_for_function("""({sid,actor})=>{const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,u=e.active;
              return u.id===actor&&e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+4)?.t.id===sid;}""",
              arg={'sid':names[role],'actor':actor},timeout=5400)
            z=state();assert x0<=z['x']<=x1 and abs(z['y']-surface(rings[role],z['x']))<4
            assert actual(t)==expected and project(t)==before and check_domain(t,1)
            return z
        verify('B',94,96)
        def hold(key,x,d,timeout=8000):
            t.keyboard.down(key)
            try:t.wait_for_function("""({x,d})=>{const u=HonroWorkshopAPI.getPlayApp().engine.active;
               return (u.x-x)*d>=0||u.moveLeft<=0;}""",arg=dict(x=x,d=d),polling='raf',timeout=timeout)
            finally:t.keyboard.up(key)
        def photo(label,prior=None):
            a=t.evaluate("""async ({pose,prior})=>{
              const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,b=e.b,w=a.scene.canvas.ownerDocument.defaultView,doc=w.document,
               width=960,height=440,z=.7,x=815,y=230;
              const cmp=prior?await new Promise((ok,err)=>{const i=new w.Image();i.onload=()=>ok(i);i.onerror=err;i.src=prior;}):null;
              const can=doc.createElement('canvas');Object.assign(can.style,{position:'fixed',left:'-200vw',width:width+'px',height:height+'px'});doc.body.append(can);
              const snapshot=()=>JSON.stringify([b.terrain,b.units,b.phase,b.round,a.scene.x,a.scene.y,a.scene.scale,b.honroLandmarks]);
              const old=snapshot(),rand=w.Math.random;
              try{
                let s=3910;w.Math.random=()=>((s=(s*1664525+1013904223)>>>0)/4294967296);
                const sc=new w.HonroScene(can);Object.assign(sc,{battle:b,x,y,scale:z,manual:true,time:2});
                let calls=0;
                const land=sc.landmark;sc.landmark=function(c,l){if(l.id===pose.id&&l.asset.id===pose.assetId)calls++;return land.call(this,c,l);};
                sc.render(e,0,'',.6,false,0);
                if(old!==snapshot()||[sc.x-x,sc.y-y,sc.scale-z].some(v=>Math.abs(v)>.0001)||can.width!==width||can.height!==height||
                   !calls||!sc._cacheStats.domainTileBuilds)throw Error('Wrong stock camera/owner or simulation mutation');
                let changed=null;
                if(cmp){
                  const other=doc.createElement('canvas');other.width=width;other.height=height;
                  const cc=other.getContext('2d');cc.drawImage(cmp,0,0);
                  const p=cc.getImageData(0,0,width,height).data,q=sc.ctx.getImageData(0,0,width,height).data;
                  // Crop well above physics tread to avoid feet. Characters may move a few world pixels at true contacts.
                  changed=0;const roi={x0:738,x1:900,y0:124,y1:182};
                  for(let yy=0;yy<height;yy++)for(let xx=0;xx<width;xx++){
                    const px=(xx-width/2)/z+x,py=(yy-height/2)/z+y,i=(yy*width+xx)*4;
                    if(px<roi.x0||px>roi.x1||py<roi.y0||py>roi.y1)continue;
                    if([0,1,2].some(j=>Math.abs(p[i+j]-q[i+j])>10))changed++;
                  }
                }
                return {png:can.toDataURL(),cam:[x,y,z,width,height],calls,tiles:sc._cacheStats.domainTileBuilds,roofRGBChanged:changed};
              }finally{w.Math.random=rand;can.remove();}
            }""",dict(prior=prior,pose=pose))
            d=a.pop('png')
            write_url(('06' if label=='approach' else '07')+'-'+var+'-'+label,d)
            note(var+'-matched-stock-'+label,**a)
            if prior:assert a['roofRGBChanged']>=120,a
            else:compare_photos[label]=d
        hold('KeyD',599,1);launch=verify('B',598,614)
        assert launch['ready'] and launch['move']>180
        t.keyboard.press('ControlLeft')
        t.wait_for_function("""()=>{const u=HonroWorkshopAPI.getPlayApp().engine.active;
           return u.jumping&&u.vy<0&&u.y<=232;}""",timeout=1800,polling='raf')
        hold('KeyD',686,1,2600)
        m=verify('M',685,710);note(var+'-normal-M-approach',state=m)
        snap(t,'02-'+var+'-live-M')
        photo('approach',compare_photos.get('approach'))
        assert m['move']>=160,m
        hold('KeyD',810,1,2800)
        arrived=verify('M',809,825);assert arrived['id']==actor and arrived['hp']==start['hp']
        note(var+'-normal-M-arrival',state=arrived)
        snap(t,'03-'+var+'-live-arrival')
        photo('arrival',compare_photos.get('arrival'))
        collision_rows[var]=t.evaluate("""()=>{
          const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,b=e.b,u=e.active;
          const origin={x:818,y:189},dest={x:818,y:121};
          const next={x:818,y:346};
          const read=(p,q)=>{const v=e.projectileCollision(p,q,2,u.id,[],false);return v?{owner:v.terrain?.id,x:v.x,y:v.y}:null;};
          const before=JSON.stringify([b.terrain,b.shot,b.units,e.active.x,e.active.y]);
          const result={roof:[origin,dest],roofHit:read(origin,dest),groundHit:read(origin,next)};
          if(before!==JSON.stringify([b.terrain,b.shot,b.units,e.active.x,e.active.y]))throw Error('Probe changed state');
          return result; 
        }""")
        assert collision_rows[var]['roofHit'] is None
        assert collision_rows[var]['groundHit']['owner']==names['M']
        note(var+'-live-stock-projectile-collision-probe',scope='read-only swept roof geometry probe, not a fired arrow',**collision_rows[var])
        t.context.close()
    assert collision_rows['A18']==collision_rows['A24']
    assert not proof['pageErrors']
    proof['passed']=True;note('pass-A18-vs-A24-stock-route-visual-collision')
