"""Stock Workshop: 6 real canvas point drags in one bounded basin-knuckle edit."""
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

# Six adjacent underside vertices, indexed against immutable source B. Edit
# increases protective stone above a continuously open lower path. Same MAIN top
# and all 46 XY of real stored records. Edits are made by DOM mouse, never API.
patch=[(307,9),(306,27),(305,46),(304,38),(303,19),(302,5)]
main=B['terrains'][0]['points'];lower=B['terrains'][1]['points']
assert [main[i]['x'] for i,d in patch]==[3397.65625,3425,3450,3488.44828,3508.27586,3522.95]
assert [i for i,d in patch]==list(range(307,301,-1)) and all(main[i]['y']>1000 for i,d in patch)
report.update(scope='Real editor canvas authoring on reopened stock eroded basin source B, not stage runtime/playtest; six pointer edits as one local buttress shape, normal undo/redo/export/reopen.',
              sourceArm='B',pointMoves=[],views={},phase='static',authoredNoneViaAPI=True)
def preserve_only(project, original, done):
    s=project['stages'][0];origin=original['stages'][0]
    q=project['stages'][0]['terrains'][0]['points']; p=origin['terrains'][0]['points']
    assert len(q)==len(p)
    expected_indices={i for i,_ in done}
    actual_indices={i for i,(a,b) in enumerate(zip(p,q)) if a!=b}
    assert actual_indices==expected_indices,(actual_indices,expected_indices)
    for i,dy in done:
        assert abs(q[i]['x']-p[i]['x'])<1e-8,(i,'x drift',p[i],q[i])
        assert abs(q[i]['y']-p[i]['y']-dy)<0.7,(i,'ry drift',p[i],q[i],dy)
    patched=json.loads(json.dumps(project))
    patched['stages'][0]['terrains'][0]['points']=p
    assert patched==original, 'non-target source, stage or project field changed'
    assert verify_46(s)==verify_46(origin)
    return q

def min_gap(main_points, lower_points):
    left,right=main[308]['x'],main[301]['x']
    def at(r,x,sel):
        vals=[]
        for a,b in zip(r,r[1:]+r[:1]):
            xx,zz=a['x'],b['x']
            if min(xx,zz)<=x<=max(xx,zz):
                if xx==zz:vals.extend([a['y'],b['y']])
                else:vals.append(a['y']+(x-xx)*(b['y']-a['y'])/(zz-xx))
        return sel(vals)
    xs=sorted({left,right}|{p['x'] for p in main_points+lower_points if left<=p['x']<=right})
    return dict(minimumUnderpass=min(at(lower_points,x,min)-at(main_points,x,max) for x in xs),
                exactPiecewiseKnots=len(xs),changedBand=[left,right])

camera={'x':3460.,'y':1040.,'zoom':.8}
whole={'x':3250,'y':810,'zoom':.13}
observe="""()=>{
 window.__qaBasinPointers=[];
 for(const type of ['pointerdown','pointerup','pointermove']){
  document.querySelector('#stageCanvas').addEventListener(type,e=>{
   if(type==='pointermove'&&!e.buttons)return;
   window.__qaBasinPointers.push({type,trusted:e.isTrusted,x:e.offsetX,y:e.offsetY,ctrl:e.ctrlKey,buttons:e.buttons});
  },{capture:true,passive:true});
 }
}"""
checkCanvas="""()=>{
 const c=document.querySelector('#stageCanvas'),r=c.getBoundingClientRect();
 const [w,h]=[c.clientWidth,c.clientHeight];
 return {left:r.left,top:r.top,w,h,dpr:window.devicePixelRatio,hit:document.elementFromPoint(r.left+w/2,r.top+h/2)?.id};
}"""
def cover(pg,cam,path):
    seen=pg.evaluate(inspectorjs,cam)
    assert seen['readback']==[cam[k] for k in ('x','y','zoom')]
    assert seen['size'][0]>600
    pg.evaluate('()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
    pg.screenshot(path=str(out/path),animations='disabled')
    return {'camera':[cam[k] for k in ('x','y','zoom')],'canvasSize':seen['size']}

try:
    with sync_playwright() as driver:
        browser=driver.chromium.launch(executable_path=os.environ['HONRO_CHROME'],headless=True,args=['--no-sandbox'])
        def fresh():
            ctx=browser.new_context(viewport={'width':1500,'height':900},device_scale_factor=1,accept_downloads=True)
            page=ctx.new_page()
            page.on('pageerror',lambda e:report['pageErrors'].append(str(e)[:360]))
            page.goto(url,wait_until='domcontentloaded')
            page.wait_for_function('!!window.HonroWorkshopAPI && !!window.HonroMaps',timeout=60000)
            return page
        def load(pg,item):
            with pg.expect_file_chooser(timeout=10000) as fc:pg.locator('#importBtn').click()
            fc.value.set_files(item)
            pg.wait_for_function("""x=>{const s=HonroWorkshopAPI.queryScene().stage;
                 return s?.id==='stage-42'&&s.terrains[1].points.some(p=>p.x===x[0]&&p.y===x[1]);}""",
                 arg=[changed[order[1]][42][k] for k in (0,2)],timeout=30000)
        def project(pg):return pg.evaluate('HonroWorkshopAPI.getProject()')
        def capture(p,f):p.screenshot(path=str(out/f),animations='disabled')
        t=fresh()
        canonical=t.evaluate(projectjs,B);terrain_check(canonical['stages'][0],B)
        body=json.dumps(canonical,ensure_ascii=False,separators=(',',':')).encode()
        report['phase']='file-chooser-import';write()
        load(t,dict(name='B-input.honro-map.json',mimeType='application/json',buffer=body))
        assert project(t)==canonical
        baseview=playworld('B',t.evaluate(previewjs))
        assert t.evaluate('HonroWorkshopAPI.getEditorState().tool')=='select'
        report['views']['A-close']=cover(t,camera,'A-01-before-close.png')
        report['views']['A-whole']=cover(t,whole,'A-02-before-whole.png')
        initial=t.evaluate('HonroWorkshopAPI.getEditorState()')
        t.evaluate(observe)
        report['phase']='real canvas drags';write()
        for i,dy in patch:
            pt=canonical['stages'][0]['terrains'][0]['points'][i]
            # Center x on the original fractional knot. Native event offsets
            # become integer canvas x at viewport 1500×900 / canvas width 910.
            # Set origin y on its alignment to the lower half-pixel as needed.
            z=2
            c=t.evaluate(checkCanvas)
            assert c['dpr']==1 and c['w']%2==0 and c['hit']=='stageCanvas',c
            px=c['left']+c['w']/2
            sy=c['h']//2; py=c['top']+sy
            v={'x':pt['x'],'y':pt['y']+(c['h']/2-sy)/z,'zoom':z}
            seen=t.evaluate(inspectorjs,v)
            assert seen['readback']==[v[k] for k in ('x','y','zoom')]
            t.evaluate('()=>window.__qaBasinPointers.length=0')
            t.mouse.move(px,py)
            t.keyboard.down('Control')
            t.mouse.down()
            try:
                s=t.evaluate('HonroWorkshopAPI.getEditorState()')
                assert s['selected']=={'type':'terrain','id':order[0]} and s['selectedNode']==i,(i,s)
                if i==305:capture(t,'M-01-native-selected-node.png')
            finally:
                # Control chooses the exact ring but is lifted before the move
                # so grid snap neither rounds x nor changes the point owner.
                t.keyboard.up('Control')
            t.mouse.move(px,py+z*dy,steps=5)
            t.mouse.up()
            events=t.evaluate('()=>window.__qaBasinPointers.slice()')
            assert events and all(p['trusted'] for p in events),(i,events)
            assert [p['type'] for p in events if p['type']!='pointermove']==['pointerdown','pointerup'] and any(p['type']=='pointermove' and not p['ctrl'] for p in events)
            done=patch[:patch.index((i,dy))+1]
            now=project(t)
            q=preserve_only(now,canonical,done)
            assert t.evaluate('HonroWorkshopAPI.getEditorState().history')==initial['history']+len(done)
            report['pointMoves'].append({'owner':order[0],'index':i,'from':pt,'to':q[i],'requestedDeltaY':dy,'nativePointerEvents':events});write()

        edited=project(t);newpoints=preserve_only(edited,canonical,patch)
        report['oldClearance']=min_gap(main,lower)
        report['newClearance']=min_gap(newpoints,lower)
        assert report['newClearance']['minimumUnderpass']>=160
        # Undo/redo through toolbar; no application setter. Ensure exact serialized
        # point geometry follows the history as opposed to DOM appearance only.
        t.locator('#undoBtn').click()
        preserve_only(project(t),canonical,patch[:-1])
        t.locator('#redoBtn').click()
        assert project(t)==edited
        report['normalUndoRedoExact']=True
        report['phase']='ordinary-export';write()
        with t.expect_download(timeout=15000) as x:t.locator('#exportBtn').click()
        f=Path(os.environ['RUNNER_TEMP'])/'basin-point-actual.honro-map.json';assert not f.exists()
        x.value.save_as(f)
        downloaded=f.read_bytes()
        assert json.loads(downloaded)==edited
        report['editedExportSHA256']=digest(downloaded)
        t.context.close()
        report['phase']='fresh-reopen';write()
        page=fresh();load(page,f)
        reopened=project(page);assert reopened==edited
        preserve_only(reopened,canonical,patch)
        effect=playworld('B',page.evaluate(previewjs))
        for source in ('compiledPlay','compiledWorld','previewPlay','previewWorld'):
            assert [a['id'] for a,b in zip(baseview[source],effect[source]) if a!=b]==[order[0]],source
        report['exactOldAndNewViaFreshReopen']=True
        assert cover(page,camera,'B-01-after-reopened-close.png')==report['views']['A-close']
        assert cover(page,whole,'B-02-after-reopened-whole.png')==report['views']['A-whole']
        report['distinctAuthoredPoints']=len(patch)
        assert not report['pageErrors'],report['pageErrors']
        report['phase']='done';report['passed']=True
        browser.close()
except Exception as error:
    report['error']=str(error);report['traceback']=traceback.format_exc()[-4500:];write();raise
write()
