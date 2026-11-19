"""Pinned unmodified stock Workshop; stage source import, real file chooser, export, fresh reopen."""
import hashlib,json,os,sys,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE=Path(__file__).resolve().parent
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
url=sys.argv[2]
assert url=='http://127.0.0.1:8884/HONRO_WORKSHOP.html'
srcsha={'A':'f4ef8f67dd560bffe675b3536c3ece1904b4a354d1fb555145732e2000ab4afe','B':'b29b4aeb7130a687cd750d2b6a29a54cc9b564c6999e971a207400f67d8e201b'}
ledger_sha='3cdab24c8a9d2e6ce1bab9984a772d7993fe538b52508e2a95d65436b0fd0a44'
digest=lambda byt:hashlib.sha256(byt).hexdigest()
def pin(f,d):
    x=(HERE/f).read_bytes();assert digest(x)==d,(f,'artifact SHA mismatch');return json.loads(x)

def xy(value):return [value['x'],value['y']]
def xyrows(s):
    a=s['design']['act5']; d={}
    for u in s['units']:d[('unit',u['id'])]=xy(u)
    for j,v in a['sites'].items():d[('site',j)]=xy(v)
    for j,v in s['anchors'].items():d[('anchor',j)]=xy(v)
    for w in a['waves']:
        for key in ('entry','fallback'):d[('wave',w['id']+'.'+key)]=xy(w[key])
    p=next(t for t in s['terrains'] if t['id']=='a5-device-0')['points']
    d[('device','a5-device-0')]=[(min(g['x'] for g in p)+max(g['x'] for g in p))/2,max(g['y'] for g in p)]
    return d
def verify_46(s):
    exact=xyrows(s)
    assert set(exact)==set((q['kind'],q['id']) for q in ledger)
    for q in ledger:
        v=exact[(q['kind'],q['id'])]
        assert all(abs(a-b)<1e-8 for a,b in zip(v,xy(q))),(q,v)
    return exact
def terrain_check(s,expected):
    assert [q['id'] for q in s['terrains']]==order
    for native,orig in zip(s['terrains'],expected['terrains']):
        assert {k:v for k,v in native.items() if k!='detail'}==orig,(native['id'],'authored fields mutated')
        assert native.get('detail') in (None,{'spacing':18,'roughness':0,'seed':1,'optimizeEpsilon':0})
    assert {k:v for k,v in s.items() if k!='terrains'}=={k:v for k,v in expected.items() if k!='terrains'},'non-terrain stage data mutated'
    return verify_46(s)

order=['MAIN_ESCORT_C_FULL','LOWER_ROOT','WEST_OPTIONAL_LOOKOUT','EAST_OPTIONAL_LOOKOUT','a5-device-0']
sources={k:pin('source-'+k+'.json',v) for k,v in srcsha.items()}
ledger=pin('ledger-46.json',ledger_sha)['records'];assert len(ledger)==46
A,B=(sources[k] for k in ('A','B'))
assert A['id']==B['id']=='stage-42' and A['metadata']['stageId']==42
assert A['width']==B['width']==6500 and A['height']==B['height']==2861
assert A['metadata']['campaign'] is True and B['metadata']['campaign'] is True
assert not A['elements'] and not B['elements'] and not A['environment']['placements']
assert {**A,'terrains':B['terrains']}==B
assert [t['id'] for t in A['terrains']]==[t['id'] for t in B['terrains']]==order
assert [i for i,(a,b) in enumerate(zip(A['terrains'],B['terrains'])) if a!=b]==[0,1]
changed={}
for i in (0,1):
    a,b=A['terrains'][i],B['terrains'][i]
    assert {**a,'points':b['points']}==b and len(a['points'])==len(b['points'])
    moved=[]
    for u,v in zip(a['points'],b['points']):
        assert u['x']==v['x']
        if u['y']!=v['y']:
            assert 2420<u['x']<5200
            moved.append([u['x'],u['y'],v['y']])
    assert len(moved)>50
    changed[a['id']]=moved
assert verify_46(A)==verify_46(B) and A['design']['act5']['links']==B['design']['act5']['links']
report={'scope':'Unmodified stock HONRO Workshop, real native load/export/fresh reopen, native editor Scene and compiled/preview checks only. No campaign or art signoff. A and B are separately imported QA source maps.',
        'stage':'stage-42','pin':'1e043b09d4ce107e1d2dcf70fe2274dff7098476','sourceSHA256':srcsha,
        'changedSourceVertices':{k:len(v) for k,v in changed.items()},'contactsExact':46,
        'arms':{},'pageErrors':[],'passed':False}
def write():
    (out/'workshop-ab.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
write()

# Pin canonical serializer; index order is compared after import, export and reopen.
projectjs="""s=>{
 const inert={id:'qa-geometry-only-no-collider',name:'QA noncolliding palette sentinel',category:'scenery',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
 inert.reference=HonroEnvironment.referenceForLegacyAsset(inert);
 const p=HonroMaps.finalize({schema:'honro-map',version:HonroMaps.VERSION,activeStageId:s.id,name:s.name,
                             environmentVersion:HonroEnvironment.VERSION,settings:{autosave:false,grid:10},stages:[s],library:[inert]});
 const errors=HonroMaps.validate(p).filter(x=>x.level==='err');
 if(errors.length||p.version!==6||p.stages.length!==1||p.library.length!==1) throw Error('Invalid Workshop geometry schema');
 return p;
}"""
previewjs="""()=>{
 const p=HonroWorkshopAPI.getProject(),s=p.stages[0],c=HonroMaps.compile(s,p),b=HonroWorkshopAPI.getRuntime()?.engine?.b;
 const arr=t=>t.map(x=>({id:x.id,oneWay:x.oneWay,vertices:x.vertices}));
 if(!b||!c.worldTerrain||!Array.isArray(b.honroWorldTerrain))throw Error('Actual editor domain missing');
 return {compiledPlay:arr(c.terrain),compiledWorld:arr(c.worldTerrain),previewPlay:arr(b.terrain),
         previewWorld:arr(b.honroWorldTerrain),domain:!!HonroTerrainDomain.active(b),
         actualWorldBounds:b.honroTerrainBounds,actualPlayBounds:b.honroPlayBounds,authored:s.id};
}"""
inspectorjs="""c=>{
 const r=HonroWorkshopAPI.setCamera(c);
 const {camera,stage}=HonroWorkshopAPI.queryScene();
 if(!stage||stage.id!=='stage-42')throw Error('Missing Scene stage');
 let view=camera;
 if(!view||![view.x,view.y,view.zoom].every(Number.isFinite)){
   const z=HonroWorkshopAPI.getRuntime()?.scene?.camera??HonroWorkshopAPI.getRuntime()?.scene;
   if(z&&[z.zoom].every(Number.isFinite)){
      const x=z.x??z.cx??z.camX,y=z.y??z.cy??z.camY; if([x,y].every(Number.isFinite))view={x,y,zoom:z.zoom};
   }
 }
 const canvas=document.querySelector('#stageCanvas');
 return {readback:view&&[view.x,view.y,view.zoom].every(Number.isFinite)?[view.x,view.y,view.zoom]:null,
         size:[canvas.clientWidth,canvas.clientHeight],returned:r??null};
}"""
CAMERAS=[('01-whole',{'x':3250,'y':810,'zoom':.13}),
         ('02-refuge',{'x':3300,'y':890,'zoom':.52}),
         ('03-lower-basin',{'x':3540,'y':1140,'zoom':.58}),
         ('04-east-tip-control',{'x':6170,'y':860,'zoom':.67})]

def playworld(arm,p):
    assert p['authored']=='stage-42' and p['domain']
    assert p['actualPlayBounds']==sources[arm]['playBounds'] and p['actualWorldBounds']==sources[arm]['terrainBounds']
    for suffix in ('Play','World'):
        all_=p['compiled'+suffix]
        preview=p['preview'+suffix]
        assert [q['id'] for q in all_]==order
        fixture=[q for q in all_ if q['id']!='a5-device-0']
        # The sole recognized optional removal is stock Act5 migration of the
        # drum out of terrain into the runtime objective actor. Never drop others.
        assert preview==all_ or preview==fixture,(arm,suffix,'editor vs compiled domain')
        assert all(len(q['vertices'])>2 for q in preview)
    return p

try:
    with sync_playwright() as driver:
        br=driver.chromium.launch(executable_path=os.environ['HONRO_CHROME'],headless=True,args=['--no-sandbox'])
        def fresh():
            ctx=br.new_context(viewport={'width':1500,'height':900},device_scale_factor=1,accept_downloads=True)
            pg=ctx.new_page();pg.on('pageerror',lambda e:report['pageErrors'].append(str(e)[:360]))
            pg.goto(url,wait_until='domcontentloaded')
            pg.wait_for_function('!!window.HonroWorkshopAPI && !!window.HonroMaps',timeout=60000)
            return pg
        def load(pg,item,arm):
            with pg.expect_file_chooser(timeout=10000) as fc:pg.locator('#importBtn').click()
            fc.value.set_files(item)
            pg.wait_for_function("""x=>{const s=HonroWorkshopAPI.queryScene().stage;
                 return s?.id==='stage-42'&&s.terrains[0].points.some(p=>p.x===x[0]&&p.y===x[1]);}""",
                 arg=[changed[order[0]][len(changed[order[0]])//2][k] for k in (0,1 if arm=='A' else 2)],timeout=25000)
        matrix={}
        for arm,src in sources.items():
            row=report['arms'][arm]={'phase':'fresh-editor-open'};write()
            original=fresh();canonical=original.evaluate(projectjs,src);terrain_check(canonical['stages'][0],src)
            body=json.dumps(canonical,ensure_ascii=False,separators=(',',':')).encode()
            load(original,dict(name=f'{arm}.honro-map.json',mimeType='application/json',buffer=body),arm)
            live=original.evaluate('HonroWorkshopAPI.getProject()')
            assert live==canonical;terrain_check(live['stages'][0],src)
            row['phase']='native-export';write()
            with original.expect_download(timeout=15000) as transfer:original.locator('#exportBtn').click()
            saved=Path(os.environ['RUNNER_TEMP'])/f'basin-{arm}-roundtrip.honro-map.json'
            assert not saved.exists()
            transfer.value.save_as(saved)
            raw=saved.read_bytes();assert json.loads(raw)==canonical
            row['exportSHA256']=digest(raw);row['phase']='fresh-reopen';write()
            original.context.close()
            page=fresh();load(page,saved,arm)
            reopened=page.evaluate('HonroWorkshopAPI.getProject()')
            assert reopened==canonical; terrain_check(reopened['stages'][0],src)
            row['importExportFreshRoundTripExact']=True
            try:
                page.wait_for_function('!!HonroWorkshopAPI.getRuntime()?.engine?.b?.honroWorldTerrain',timeout=12000)
            except Exception:
                page.screenshot(path=str(out/f'{arm}-00-preview-unavailable.png'))
                raise
            effective=playworld(arm,page.evaluate(previewjs))
            matrix[arm]=effective
            row['compiledCounts']={k:[(v['id'],len(v['vertices'])) for v in q] for k,q in effective.items() if k.startswith('compiled') or k.startswith('preview')}
            row['cameras']={};row['phase']='real-same-camera-screens'
            for lab,c in CAMERAS:
                seen=page.evaluate(inspectorjs,c)
                page.evaluate('()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
                page.screenshot(path=str(out/f'{arm}-{lab}.png'),animations='disabled')
                assert seen['readback']==[c['x'],c['y'],c['zoom']],(arm,lab,seen)
                vw,vh=seen['size']; assert vw>600 and vh>450
                if lab=='01-whole':assert vw/c['zoom']>=6500,(arm,lab,vw)
                row['cameras'][lab]={'requested':c,'observed':seen['readback'],'canvasSize':seen['size']}
                assert page.evaluate('HonroWorkshopAPI.getProject()')==canonical
                write()
            page.context.close()
            row['phase']='done';write()
        for use in ('compiledPlay','compiledWorld','previewPlay','previewWorld'):
            a,b=matrix['A'][use],matrix['B'][use]
            assert [v['id'] for v in a]==[v['id'] for v in b]
            assert [u['id'] for u,v in zip(a,b) if u!=v]==order[:2],use
        assert report['arms']['A']['cameras']==report['arms']['B']['cameras'],'A/B camera requests or observed values differ'
        # A camera result is optional only if stock public query exposes no
        # readback; note proof limitation rather than claim actual equality without it.
        report['cameraReadbackAvailable']=all(v['observed'] is not None for v in report['arms']['A']['cameras'].values())
        assert report['cameraReadbackAvailable']
        report['matchedActualCameraReadback']=True
        assert not report['pageErrors'],report['pageErrors']
        report['geometryDifferedInExactTwoOwnersAcrossCompilerAndRealEditorPreview']=True
        report['passed']=True
        br.close()
except Exception as e:
    report['error']=str(e);report['traceback']=traceback.format_exc()[-4500:];write();raise
write()
