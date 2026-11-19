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
art_bytes=Path(__file__).with_name('A16-honro-asset.json').read_bytes()  # fixed QA fixture slot; exact A18 bytes
assert sha(art_bytes)=='c48a840f7b6a0f68748dc9967c2f9bcf7aa2cb0b2be81e5d5517bb0835543a53'
art=json.loads(art_bytes)
pose=dict(id='qa-p6-r5-a18-surface',assetId=art['id'],layer='prop',depthLayer='L1',
          x=0,y=0,scale=1,rotation=0,snap=False)
assert art['collision']==art['visual']==[] and art['anchor']==dict(x=0,y=0)
assert art['id']=='mib-p6r5-a18-world' and art['vector']['viewBox']==[-2050,-620,5790,2580]
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
start_x=95
sid='qa-p6r4-slice'
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
assert sys.argv[2]=='http://127.0.0.1:8884/HONRO_WORKSHOP.html'
url=sys.argv[2]
prior_line={'run':44552672189,'asset':'A16','label':'09-east-tile','pngSHA256':'60c5f95f0b8bc712b9de443c08cab8022d63def72b481d122b95a8e7cc34a541',
 'camera':[1450,290,.7,960,440],'rasterScale':.68,'measure':{'1620':{'length':273,'worstConsecutive':145,'worstTotal':268},'1506':{'length':179,'worstConsecutive':0,'worstTotal':0}},
 'scope':'Previously observed actual stock PNG, separately calibrated using same two-shoulder formula; not loaded into this browser.'}
proof={'scope':'Exact P6r5 exterior domain+A18 stock Workshop Player. Retains P6r4 collision and controls. Synthetic one Archer, no story/combat/W route or final art.','source':sha(src),'asset':sha(art_bytes),'domain':sha(domain_bytes),'checkpoints':[],'pageErrors':[],'priorLowContrastLine':prior_line,'passed':False}
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
      const s=HonroMaps.emptyStage(sid,'P6r4 isolated physical slice',1620,560);
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
    def render_view(page,label,cam,colored=False,aba=None,strips=()):
        result=page.evaluate("""async ({cam,colored,aba,strips,pose})=>{
          const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,b=e.b,w=a.scene.canvas.ownerDocument.defaultView,doc=w.document;
          const W=960,H=440,rgba=c=>c.getImageData(0,0,W,H).data;
          const old=aba?await new Promise((ok,err)=>{const im=new w.Image();im.onload=()=>ok(im);im.onerror=err;im.src=aba; }):null;
          const snapshot=()=>JSON.stringify([b.terrain,b.honroWorldTerrain,b.units,b.phase,b.round,
             b.honroLandmarks,a.scene.x,a.scene.y,a.scene.scale,a.scene.manual]);
          const before=snapshot();
          const photo=()=>{
            const canvas=doc.createElement('canvas');Object.assign(canvas.style,{position:'fixed',left:'-200vw',width:W+'px',height:H+'px'});doc.body.append(canvas);
            const scene=new w.HonroScene(canvas);Object.assign(scene,{battle:b,x:cam.x,y:cam.y,scale:cam.z,manual:true,time:2});
            const stockSkirt=scene.terrainSkirt,stockLand=scene.landmark,stockTerrain=scene.terrain;
            let skirt=0,skirtChanges=0,land=0,ext=0;
            scene.terrainSkirt=function(c,...args){
              const pre=rgba(c);skirt++;
              const result=stockSkirt.call(this,c,...args),post=rgba(c);
              skirtChanges+=Number(pre.some((v,i)=>v!==post[i]));return result;
            };
            scene.landmark=function(c,l){if(l.id===pose.id)land++;return stockLand.call(this,c,l);};
            scene.terrain=function(c,t){if(t.honroDomain&&t.vertices.some(v=>v.x<0||v.x>1620||v.y>560))ext++;return stockTerrain.call(this,c,t);};
            const r=w.Math.random;
            try {
              let seed=3910;w.Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
              scene.render(e,0,'',.6,false,0);
              if([scene.x-cam.x,scene.y-cam.y,scene.scale-cam.z].some(x=>Math.abs(x)>1e-6)||canvas.width!==W||canvas.height!==H)
                throw Error('Fixed normal diagnostic camera changed '+[scene.x,scene.y,scene.scale,canvas.width,canvas.height]);
              const mask=doc.createElement('canvas');mask.width=W;mask.height=H;
              const c=mask.getContext('2d');c.translate(W/2,H/2);c.scale(scene.scale,scene.scale);c.translate(-scene.x,-scene.y);
              if(colored)stockLand.call(scene,c,b.honroLandmarks.find(l=>l.id===pose.id));
              return {png:canvas.toDataURL(),mask:colored?mask.toDataURL():null,maskPix:rgba(c),pixels:rgba(scene.ctx),
                tiles:scene._cacheStats.domainTileBuilds||0,cacheTiles:scene._domainTiles?.tiles.size||0,
                rs:scene._domainTiles?.rs??null,skirt,skirtChanges,land,ext};
            } finally {w.Math.random=r;canvas.remove();}
          };
          const q=photo(),p2=photo();
          if(snapshot()!==before)throw Error('View changed live battle or camera');
          let diff=0,offAlphaLost=0;
          if(old){
            if(old.width!==W||old.height!==H)throw Error('Bare R5 comparison dimensions drift');
            const c=doc.createElement('canvas');c.width=W;c.height=H;
            const cx=c.getContext('2d');cx.drawImage(old,0,0);
            const base=rgba(cx),pix=q.pixels;if(base.length!==pix.length)throw Error('A/B size');
            for(let i=0;i<pix.length;i+=4){
              if(q.maskPix[i+3]<245)continue;
              const xy=[(i/4)%W,Math.floor(i/4/W)],x=cam.x+(xy[0]-W/2)/cam.z,y=cam.y+(xy[1]-H/2)/cam.z;
              if(x>=0&&x<=1620&&y>=0&&y<=560)continue;
              if(Math.max(...[0,1,2].map(k=>Math.abs(base[i+k]-pix[i+k])))>8)diff++;
              if(base[i+3]>=245&&pix[i+3]<245)offAlphaLost++;
            }
          }
          const use=[...strips];
          if(colored&&cam.x===1450&&q.rs)use.push(['x',Math.round(2*512/q.rs),210,465]);
          const out=[];
          for(const [axis,key,start,end] of use){
            const T=(x,y)=>[Math.round(W/2+(x-cam.x)*cam.z),Math.round(H/2+(y-cam.y)*cam.z)];
            const split=T(axis==='x'?key:start,axis==='y'?key:start)[axis==='x'?0:1];
            const span0=T(start,start)[axis==='x'?1:0],span1=T(end,end)[axis==='x'?1:0];
            let total=0,opaque=0;
            const cols=[];
            for(let d=-8;d<=8;d++){
              let gt12=0,gt24=0,max=0;
              for(let j=span0;j<span1;j++){
                const xy=axis==='x'?[split+d,j]:[j,split+d],before=axis==='x'?[xy[0]-1,xy[1]]:[xy[0],xy[1]-1];
                if(before[0]<0||before[1]<0||xy[0]>=W||xy[1]>=H)throw Error('Seam strip outside camera '+JSON.stringify([axis,key,xy]));
                const i=(xy[1]*W+xy[0])*4,k=(before[1]*W+before[0])*4;
                if(Math.abs(d)<=3){total++;if(q.maskPix[i+3]>=240)opaque++;}
                const v=Math.max(...[0,1,2].map(z=>Math.abs(q.pixels[i+z]-q.pixels[k+z])));
                if(v>12)gt12++;if(v>24)gt24++;max=Math.max(max,v);
              }
              cols.push({d,gt12,gt24,max});
            }
            const mid=cols.filter(r=>Math.abs(r.d)<=1),ref=cols.filter(r=>Math.abs(r.d)>=3);
            const rows=span1-span0,pass=rows>32&&opaque===total&&
              mid.every(r=>r.gt12<=Math.max(9,...ref.map(s=>s.gt12))+Math.ceil(rows*.045)&&r.gt24<=Math.ceil(rows*.05));
            out.push({axis,key,start,end,total,opaque,rows,cols,pass});
          }
          // Old step detector intentionally ignored faint lines. Measure the
          // same exact old east tile bands in final actual composed pixels.
          // Test single- and two-pixel lines; use the brighter centre, and
          // mean RGB of two outside pixels on *each* flank. Both flanks
          // must agree within 4 per channel and each channel must darken >=1.
          let low=null;
          if(colored&&cam.x===1450&&cam.z===.7){
            if(q.rs!==.68)throw Error('Not the pinned old .68 native cache photo: '+q.rs);
            const rows=[];
            for(const [worldX,y0,y1] of [[1620,120,510],[Math.round(2*512/q.rs),210,465]]){
              const ix=Math.round(W/2+(worldX-cam.x)*cam.z),
                begin=Math.round(H/2+(y0-cam.y)*cam.z),end=Math.round(H/2+(y1-cam.y)*cam.z);
              const all=[];
              for(const width of [1,2])for(let d=-3;d<=3;d++){
                let current=0,longest=0,total=0;const x=ix+d;
                for(let iy=begin;iy<end;iy++){
                  const here=c=>4*(iy*W+c), c0=here(x),left=here(x-2),right=here(x+width);
                  let yes=true;
                  for(let xx=x-2;xx<x+width+2;xx++)if(q.maskPix[here(xx)+3]<240){yes=false;break;}
                  for(let k=0;k<3&&yes;k++){
                    const A=(q.pixels[left+k]+q.pixels[left+4+k])/2,
                      B=(q.pixels[right+k]+q.pixels[right+4+k])/2,
                      center=width===1?q.pixels[c0+k]:Math.max(q.pixels[c0+k],q.pixels[c0+4+k]);
                    if(Math.abs(A-B)>4||Math.min(A,B)-center<1)yes=false;
                  }
                  if(yes){total++;current++;longest=Math.max(longest,current);}else current=0;
                }
                all.push({width,offset:d,longest,total});
              }
              const maxRun=Math.max(...all.map(x=>x.longest)),maxTotal=Math.max(...all.map(x=>x.total)),len=end-begin;
              rows.push({worldX,y0,y1,ix,length:len,maxRun,maxTotal,all,pass:maxRun<=25&&maxTotal<=Math.ceil(len*.12)});
            }
            low={camera:[cam.x,cam.y,cam.z,W,H],rs:q.rs,measure:rows,pass:rows.every(x=>x.pass)};
          }
          // This aperture is a per-pixel negative control: no stock background
          // or paint extension may count as a rock bridge between west owners.
          let westGap=null;
          if(colored&&cam.x===100){
            let tested=0,hole=0;
            for(let y=330;y<=410;y+=4)for(let x=-52;x<=52;x+=4){
              const X=Math.round(W/2+(x-cam.x)*cam.z),Y=Math.round(H/2+(y-cam.y)*cam.z);
              if(X<0||X>=W||Y<0||Y>=H)continue;
              tested++;if(q.maskPix[(Y*W+X)*4+3]<2)hole++;
            }
            westGap={hole,tested};
          }
          const stableRaster=q.pixels.every((v,i)=>v===p2.pixels[i]);
          const routePass=cam.z<=1.05?q.tiles>0&&q.cacheTiles<=24:q.tiles===0;
          const pass=routePass&&q.skirt===1&&q.skirtChanges===0&&q.ext>=1&&
            (colored?q.land>0:q.land===0)&&(!old||diff>=3000&&!offAlphaLost)&&out.every(x=>x.pass)&&
            (!westGap||westGap.hole===westGap.tested&&westGap.tested>=150)&&(!low||low.pass);
          return {png:q.png,mask:q.mask,pass,cam,screen:[W,H],tiles:q.tiles,cacheTiles:q.cacheTiles,rs:q.rs,
            skirt:q.skirt,skirtChanges:q.skirtChanges,land:q.land,worldTerrainCalls:q.ext,offDomainArtRgbChanges:diff,offAlphaLost,out,westGap,stableRaster,lowContrastLine:low};
        }""",dict(cam=cam,colored=colored,aba=aba,strips=strips,pose=pose))
        png=result.pop('png');mask=result.pop('mask')
        write_url(label,png)
        if mask:write_url(label+'-body-mask',mask)
        note(label,detachedActualStockPlayer=True,**result)
        assert result['pass'],result
        return png
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
    load(t,buffered('isolated-bare-r5.honro-map.json',r5))
    open_player(t)
    assert actual(t)==expected and physics(t)==bare_battle
    check_domain(t,0)
    bare_domain=render_view(t,'06-bare-domain-camera',{'x':700,'y':280,'z':.7})
    t.context.close();t=fresh()
    data_color=t.evaluate("""({data,art,pose})=>{
        const errors=HonroVectorArt.validate(art.vector);
        if(errors.length)throw Error('Invalid stock A18 tree: '+errors);
        art.reference=HonroEnvironment.referenceForLegacyAsset(art);
        data.library.push(art);data.stages[0].elements=[pose];
        return HonroMaps.finalize(data);
    }""",dict(data=r5,art=art,pose=pose))
    exact_places(data_color,True,True)
    just_bare=copy.deepcopy(data_color);just_bare['library'].pop();just_bare['stages'][0]['elements']=[]
    assert just_bare==r5,'Beyond single appearance-owner addition'
    load(t,buffered('isolated-r5-a18.honro-map.json',data_color))
    before=project(t);exact_places(before,True,True)
    with t.expect_download() as d:t.locator('#exportBtn').click()
    export=out.parent/'r5-a18-synthetic.honro-map.json';d.value.save_as(export)
    assert json.loads(export.read_bytes())==before
    old=t;t=fresh();load(t,export);old.context.close()
    assert project(t)==before;exact_places(project(t),True,True)
    c=preview(t);assert c['compile']==c['preview']==expected
    note('exact-native-import-export-fresh-reopen',exportDigest=sha(export.read_bytes()),exactStockGeometry=True,pose=pose,vectorSource=sha(art_bytes))
    t.evaluate("HonroWorkshopAPI.setCamera({x:810,y:275,zoom:.65})")
    snap(t,'01-native-a18-reopened')
    open_player(t)
    assert actual(t)==expected and physics(t)==bare_battle and check_domain(t,1)
    note('live-exact-r4-r5-r5-a18-physics',fields=list(bare_battle.keys()))
    render_view(t,'07-a18-domain-camera',{'x':700,'y':280,'z':.7},colored=True,aba=bare_domain,
       strips=[['y',560,185,570]])
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
        note('normal-input-'+label,frames=a)
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
    render_view(t,'09-east-tile',{'x':1450,'y':290,'z':.7},colored=True,strips=[['x',1620,120,510],['y',560,835,1450]])
    render_view(t,'09-west-tile',{'x':100,'y':260,'z':.7},colored=True,strips=[['x',0,150,260],['x',0,478,538]])
    render_view(t,'09-domain-wide',{'x':760,'y':400,'z':.4},colored=True,strips=[['x',1620,150,490],['y',560,185,570]])
    render_view(t,'09-east-direct',{'x':1480,'y':400,'z':1.1},colored=True,strips=[['x',1620,230,520],['y',560,1150,1430]])
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
