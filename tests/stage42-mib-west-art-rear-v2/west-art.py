"""Normal Workshop stock geometry and world-space rear/BODY/ruin A/B. No campaign."""
import base64, copy, hashlib, json, os, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
here=Path(__file__).parent
sha=lambda x:hashlib.sha256(x).hexdigest()
manifest=json.loads((here/'manifest.json').read_bytes())
source=(here/'fused-physical.json').read_bytes()
assert sha(source)==manifest['sourceCollisionHashUnchanged']=='a8b7efcc61af1ef8eff156dddb0ff45b67881e7a984a42af5cc1c3701501d473'
raw=json.loads(source)
owners=['MAIN_ESCORT_C_FULL','LOWER_ROOT','WEST_OPTIONAL_LOOKOUT','EAST_OPTIONAL_LOOKOUT']
assert [v['id'] for v in raw['owners']]==owners and [len(v['ring']) for v in raw['owners']]==manifest['Rings']==[416,235,58,97]
rings={v['id']:v['ring'] for v in raw['owners']}
wanted={k:[dict(x=x,y=y) for x,y in r] for k,r in rings.items()}
expected=[dict(id=id,oneWay=False,vertices=wanted[id]) for id in owners]
def mounted(rows):
  poses=[];arts=[]
  for m in rows:
    b=(here/m['libraryFile']).read_bytes();assert sha(b)==m['sha256']
    art=json.loads(b);pose=m['placement']
    assert pose['assetId']==art['id'] and art['collision']==art['visual']==[] and art['anchor']==dict(x=0,y=0)
    assert [pose[k] for k in ('x','y','scale','rotation','snap')]==[0,0,1,0,False]
    assert not art.get('interactionType') and not art.get('renderer')
    arts.append(art);poses.append(pose)
  assert [a['params']['semanticLayer'] for a in arts]==['REAR_SCENERY','BODY','REAR_PROP']
  assert [p['layer'] for p in poses]==['structural-back','prop','prop'] and all(p['depthLayer']=='L1' for p in poses)
  assert all(a['params'].get('silhouetteUnderpaint') is False for a in arts)
  return arts,poses
arms={'v1':mounted(manifest['assetsInOrder']),'v2':mounted([manifest['rearV2'],*manifest['assetsInOrder'][1:]])}
assert arms['v1'][0][1:]==arms['v2'][0][1:] and arms['v1'][1][1:]==arms['v2'][1][1:]
def surface(id,at):
    p=rings[id]
    return min(y+(at-x)*(Y-y)/(X-x) for (x,y),(X,Y) in zip(p,p[1:]+p[:1]) if x<=at<X)
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
url=sys.argv[2];assert url=='http://127.0.0.1:8884/HONRO_WORKSHOP.html'
proof={'scope':'Unmodified stock Workshop Player on isolated 6500×1900 C solids. Synthetic real Archer, rear V1 vs V2 only; exact BODY/ruin unchanged, no FAR or campaign, no final visual verdict.','source':sha(source),'checkpoints':[],'pageErrors':[],'passed':False}
def note(label,**data):
    proof['checkpoints'].append(dict(label=label,**data))
    (out/'proof.json').write_text(json.dumps(proof,indent=2))
note('start')
sid='qa-c-west-native-art'
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ['HONRO_CHROME'],headless=True,args=['--no-sandbox'])
    def fresh():
        t=browser.new_context(viewport={'width':1500,'height':900},device_scale_factor=1,accept_downloads=True).new_page()
        t.on('pageerror',lambda e:proof['pageErrors'].append(str(e)[:400]))
        t.goto(url);t.wait_for_function('!!window.HonroWorkshopAPI',timeout=60000)
        return t
    def load(t,source):
        with t.expect_file_chooser() as fc:t.locator('#importBtn').click()
        fc.value.set_files(source)
        t.wait_for_function('id=>HonroWorkshopAPI.queryScene().stage.id===id',arg=sid)
    def project(t):return t.evaluate('HonroWorkshopAPI.getProject()')
    def physics(t):
        return t.evaluate("""()=>{
          const c=HonroWorkshopAPI, p=c.getProject(), s=p.stages[0], m=HonroMaps.compile(s,p), a=c.getPlayApp();
          const preview=c.getRuntime().engine.b; const take=t=>({id:t.id,oneWay:t.oneWay,vertices:t.vertices});
          const live=a?.engine?.b, landmarks=live?.honroLandmarks||[];
          return {runtime:live?.terrain.map(take)??null, preview:a?null:preview.terrain.map(take), compile:m.terrain.map(take),
          collision:live?.terrain?.some(t=>t.honroElementCollision)??false,
          hidden:s.environment.hiddenLayers, controls:live?.physics??null,
          landmarks:landmarks.map(l=>({id:l.id,kind:l.kind,assetId:l.asset.id,x:l.x,y:l.y,scale:l.scale,rotation:l.rotation,layer:l.layer,
          depthLayer:l.depthLayer,snap:l.snap,collisionIds:l.collisionIds,assetCollision:l.asset.collision,
          exactArt:JSON.stringify(l.asset.vector)===JSON.stringify(p.library.find(q=>q.id===l.asset.id)?.vector)}))};
        }""")
    def make(t,role,arts,poses):
        x=manifest['starts'][role]; y=surface(owners[0 if role=='main' else 2],x)
        return t.evaluate("""({sid,wanted,owners,arts,poses,x,y})=>{
          const s=HonroMaps.emptyStage(sid,'West C native visual QA',6500,1900);
          s.environment.placements=[];s.environment.hiddenLayers=['L2','L3','L4','L5'];
          s.terrains=owners.map(id=>({id,name:id,layer:'terrain',type:'solid',points:wanted[id],baseMaterial:'rock',oneWay:false,breakable:false}));
          s.units=[HonroUnits.record('archer','west-art-qa-scout',x,y,'player')];
          s.elements=poses;
          s.objectives=[{id:'qa-never-reached',type:'reach',label:'QA only',x:20,y:100,radius:25,required:true}];
          const a={id:'qa-inert-empty',name:'Empty toolbar sentinel',category:'scenery',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
          for(const v of [a,...arts]){if(v.vector&&HonroVectorArt.validate(v.vector).length)throw Error('Invalid native vector: '+v.id);
            v.reference=HonroEnvironment.referenceForLegacyAsset(v);}
          return HonroMaps.finalize({schema:'honro-map',version:HonroMaps.VERSION,activeStageId:s.id,name:s.name,
            environmentVersion:HonroEnvironment.VERSION,settings:{autosave:false,grid:10},stages:[s],library:[a,...arts]});
        }""",dict(sid=sid,wanted=wanted,owners=owners,arts=arts,poses=poses,x=x,y=y))
    def state(t):
        return t.evaluate("""()=>{
          const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,u=e.active;
          return {id:u.id,x:u.x,y:u.y,h:u.h,r:u.r,hp:u.hp,remaining:u.moveLeft,round:e.b.round,
             grounded:e.grounded(u),support:e.contactSurface(u.x,u.y-4,u.y+4)?.t.id??null,ready:a.canInput()};
        }""")
    def photo(t,label,poses,prior):
        answer=t.evaluate("""async ({camera,ids,prior})=>{
          const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,b=e.b,w=a.scene.canvas.ownerDocument.defaultView,doc=w.document;
          const [x,y,z,width,height]=camera;
          const ref=prior?await new Promise((ok,err)=>{const im=new w.Image();im.onload=()=>ok(im);im.onerror=err;im.src=prior;}):null;
          const can=doc.createElement('canvas');
          Object.assign(can.style,{position:'fixed',left:'-200vw',width:width+'px',height:height+'px'});doc.body.append(can);
          const snapshot=()=>JSON.stringify([b.terrain,b.units,b.phase,b.round,a.scene.x,a.scene.y,a.scene.scale,b.honroLandmarks]);
          const old=snapshot(),rand=w.Math.random;
          try{
            let seed=3910;w.Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
            const sc=new w.HonroScene(can);Object.assign(sc,{battle:b,x,y,scale:z,manual:true,time:2});
            const calls=[];const land=sc.landmark;
            sc.landmark=function(c,l){if(ids.includes(l.id))calls.push(l.id);return land.call(this,c,l);};
            sc.render(e,0,'',.6,false,0);
            if(old!==snapshot()||[sc.x-x,sc.y-y,sc.scale-z].some(v=>Math.abs(v)>.0001)||can.width!==width||can.height!==height)
              throw Error('Wrong matched camera or battle mutation');
            const order=[...new Set(calls)];
            if(JSON.stringify(order)!==JSON.stringify(ids))throw Error('Native paint draw missing or out of order '+JSON.stringify(calls));
            let stats=null;
            if(ref){
              const tmp=doc.createElement('canvas');tmp.width=width;tmp.height=height;
              const c=tmp.getContext('2d');c.drawImage(ref,0,0);
              const p=c.getImageData(0,0,width,height).data,q=sc.ctx.getImageData(0,0,width,height).data;
              const regions={formerWall:[1900,2500,500,940],newBluff:[1920,2720,444,727],protectedOutside:[1200,1800,350,1100]};
              stats={};
              for(const [key,[x0,x1,y0,y1]] of Object.entries(regions)){
                let changed=0,total=0;
                for(let j=0;j<height;j++)for(let i=0;i<width;i++){
                  const X=(i-width/2)/z+x,Y=(j-height/2)/z+y;
                  if(X<x0||X>x1||Y<y0||Y>y1)continue;
                  const k=(j*width+i)*4;total++;
                  if([0,1,2].some(n=>Math.abs(p[k+n]-q[k+n])>=12))changed++;
                }
                stats[key]={changed,total};
              }
              if(stats.formerWall.changed<1200||stats.newBluff.changed<600)throw Error('No substantial paint variance '+JSON.stringify(stats));
            }
            return {png:can.toDataURL(),camera,calls:order,stats};
          }finally{w.Math.random=rand;can.remove();}
        }""",dict(camera=manifest['camera'],ids=[p['id'] for p in poses],prior=prior))
        png=answer.pop('png');(out/(label+'.png')).write_bytes(base64.b64decode(png.split(',',1)[1]));note(label,**answer)
        return png
    baseline={}; base_start={}; mechanism={}; source_projects={}
    for n,(role,version) in enumerate([('main','v1'),('main','v2'),('lookout','v1'),('lookout','v2')],1):
        label=role+'-rear-'+version; owner=owners[0 if role=='main' else 2]
        arts,poses=arms[version];t=fresh(); authored=make(t,role,arts,poses); comparable=copy.deepcopy(authored)
        assert len(authored['stages'])==1 and len(authored['stages'][0]['units'])==1 and not authored['stages'][0]['environment']['placements']
        assert [q['id'] for q in authored['library'][1:]]==[a['id'] for a in arts]
        assert authored['stages'][0]['elements']==poses
        del comparable['library'][1];del comparable['stages'][0]['elements'][0]
        if version=='v2':assert comparable==source_projects[role]
        else:source_projects[role]=comparable
        load(t,dict(name=label+'.honro-map.json',mimeType='application/json',buffer=json.dumps(authored).encode()))
        preserved=project(t);assert preserved==authored
        with t.expect_download() as d:t.locator('#exportBtn').click()
        dest=out.parent/(label+'.honro-map.json');d.value.save_as(dest)
        assert json.loads(dest.read_bytes())==preserved
        t.context.close();t=fresh();load(t,dest);assert project(t)==preserved
        b=physics(t);assert b['compile']==b['preview']==expected
        t.locator('[data-tab=play]').click()
        t.wait_for_function('!!HonroWorkshopAPI.getPlayApp()?.engine',timeout=45000)
        t.wait_for_function('HonroWorkshopAPI.getPlayApp().canInput()',timeout=17000)
        t.locator('#runtimeFrame').evaluate('f=>f.contentWindow.focus()')
        def verify(s):
            assert s['id']=='west-art-qa-scout' and s['grounded'] and s['support']==owner and abs(s['y']-surface(owner,s['x']))<4,s
            p=physics(t)
            assert p['runtime']==p['compile']==expected and not p['collision'] and project(t)==preserved
            minimal=[{k:v for k,v in pose.items() if k!='visualRole'} for pose in poses]
            assert p['landmarks']==[dict(**q,kind='canonical-element',collisionIds=[],assetCollision=[],exactArt=True) for q in minimal],p['landmarks']
            return p['controls']
        initial=state(t); checks=verify(initial)
        assert abs(initial['x']-manifest['starts'][role])<.01
        note(label+'-native-reopened-stock-actor',exportSHA=sha(dest.read_bytes()),actor=initial,geometry='exact',collisionOwners=owners)
        if version=='v2':assert initial==base_start[role] and checks==mechanism[role]
        else:base_start[role]=initial;mechanism[role]=checks
        png=photo(t,f'0{n}-{label}-matched-stock',poses,baseline.get(role))
        if version=='v1':baseline[role]=png
        t.keyboard.down('KeyD')
        try:t.wait_for_function("x=>HonroWorkshopAPI.getPlayApp().engine.active.x>=x",arg=2190,polling='raf',timeout=7500)
        finally:t.keyboard.up('KeyD')
        moved=state(t);assert 2190<=moved['x']<=2210 and moved['remaining']<initial['remaining'] and moved['hp']==initial['hp'] and moved['round']==initial['round'],moved
        assert verify(moved)==checks
        t.screenshot(path=str(out/(f'0{n+4}-{label}-live-after-D.png')))
        note(label+'-normal-D',before=initial,after=moved,physicsUnchanged=True)
        t.context.close()
    assert not proof['pageErrors'];proof['passed']=True
    note('pass-geometry-matched-native-compositor-and-legal-input-only')
