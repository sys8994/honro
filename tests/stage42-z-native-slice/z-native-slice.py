"""Genuine native Workshop terrain-depth slice. No previous geometry/foreground."""
import base64,hashlib,json,os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright

WIDTH,HEIGHT=2900,3120
SID='qa-stage42-torn-saddle-z'; NAME='5-2 NEW torn saddle Z | native slice'
TOP=[(0,1310),(210,1318),(398,1301),(589,1274),(715,1217),(844,1163),
     (932,1128),(1019,1121),(1119,1135),(1238,1184),(1344,1236),(1490,1260),
     (1718,1252),(1832,1229),(1964,1170),(2024,1138),(2130,1103),
     (2294,1095),(2452,1114),(2642,1122),(2900,1110)]
RING=TOP+[(2900,3120),(0,3120)]
# Native pointer destinations only. Two separate rock bodies, with different geology,
# no modern contour/geometry receipts loaded; none of these rows are project input.
BODIES=[
 ('z-back fissured wall','structural-back',1430,[
   ([(-823,-862),(-548,-927),(-381,-899),(-260,-735),(-99,-674),(-45,-552),(-10,-418),
     (146,-334),(205,-220),(343,-132),(490,45),(555,253),(456,480),(-746,583),(-862,415)],
    '#414e59'),
   ([(-765,-818),(-543,-883),(-393,-858),(-338,-738),(-445,-543),(-535,-409),(-579,-227),(-797,-328)],
    '#53616f'),
   ([(-321,-724),(-257,-700),(-113,-650),(-66,-557),(-29,-418),(125,-331),(145,-269),
     (15,-308),(-142,-378),(-185,-532),(-290,-594)],
    '#33414e')
 ]),
 ('z-front sheared talus','mid',1070,[
   ([(-535,595),(-482,415),(-337,322),(-231,302),(-143,233),(-22,220),
     (85,152),(165,144),(231,111),(267,167),(250,232),(367,359),(419,545),(253,651),(-504,672)],
    '#293934'),
   ([(-438,438),(-314,343),(-220,326),(-147,257),(-36,247),(84,177),(165,160),(225,130),
     (198,202),(73,301),(-69,363),(-168,402),(-329,465)],
    '#45534a'),
   ([(256,192),(250,232),(367,359),(419,545),(330,589),(229,515),(153,434),
     (168,321),(212,282)],
    '#35463c')
 ])
]
# Rear anchor at the right-hand seat leaves native starter hex completely clear
# while the rear node list describes an asymmetric body in its own coordinates.
n,l,rx,back=BODIES[0]
BODIES[0]=(n,l,rx,[([(x-580,y-90) for x,y in pts],c) for pts,c in back])
def sha(b):return hashlib.sha256(b).hexdigest()
def stable(x):return sha(json.dumps(x,sort_keys=True,separators=(',',':')).encode())
def data(page):return page.evaluate('HonroWorkshopAPI.getProject()')
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
url=sys.argv[2];assert url=='http://127.0.0.1:8884/HONRO_WORKSHOP.html'
evidence={'scope':'new central terrain-depth slice, not full campaign, no art adoption or parallax','checkpoints':[],'errors':[]}
def report(n,**values):
    evidence['checkpoints'].append({'id':n,**values})
    (out/'proof.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2))
with sync_playwright() as pw:
    b=pw.chromium.launch(headless=True,executable_path=os.environ['HONRO_CHROME'],args=['--no-sandbox'])
    def fresh():
        c=b.new_context(viewport={'width':1500,'height':900},device_scale_factor=1,accept_downloads=True)
        t=c.new_page()
        t.on('pageerror',lambda e:evidence['errors'].append(str(e)[:450]))
        t.on('dialog',lambda d:d.dismiss())
        t.goto(url);t.wait_for_function('!!window.HonroWorkshopAPI',timeout=60000)
        return t
    t=fresh()
    def file_import(page,path_or_buffer):
        with page.expect_file_chooser() as f:page.locator('#importBtn').click()
        f.value.set_files(path_or_buffer)
        page.wait_for_function('id=>HonroWorkshopAPI.queryScene().stage.id===id',arg=SID)
    def snap(page,n):
        page.screenshot(path=str(out/(n+'.png')))
    def cam(page,x,y,z):
        return page.evaluate('([x,y,zoom])=>{HonroWorkshopAPI.setCamera({x,y,zoom});return HonroWorkshopAPI.getEditorState().stageView}',[x,y,z])
    def shot_canvas(page,n):
        v=page.evaluate('''label=>{const cv=document.querySelector('#stageCanvas'),w=cv.width,h=cv.height;
          if(label.includes('only-')||label.includes('-minus-')||label.includes('composite-native-fresh')||label.includes('neutral-stock')) {
           window.__qaReadOnlyZLayers??={};
           window.__qaReadOnlyZLayers[label]={w,h,p:cv.getContext('2d').getImageData(0,0,w,h).data};
          }
          return cv.toDataURL('image/png');
        }''',n)
        blob=base64.b64decode(v.split(',',1)[1],validate=True)
        (out/(n+'.png')).write_bytes(blob);return sha(blob)
    def locate(page,selector,xy,stage):
        return page.evaluate("""({selector,xy,stage})=>{
         const c=document.querySelector(selector),r=c.getBoundingClientRect(),s=HonroWorkshopAPI.getEditorState(),
          v=stage?s.stageView:s.elementView,x=r.left+r.width*.5+(xy[0]-v.x)*v.zoom,y=r.top+r.height*.5+(xy[1]-v.y)*v.zoom;
         return {x,y,z:v.zoom,hit:document.elementFromPoint(x,y)?.id,pad:Math.min(x-r.left,r.right-x,y-r.top,r.bottom-y),
           center:[r.left+r.width/2,r.top+r.height/2],delta:[xy[0]-v.x,xy[1]-v.y],width:r.width,height:r.height};
        }""",{'selector':selector,'xy':xy,'stage':stage})
    def click_pt(page,selector,xy,stage=False):
        q=locate(page,selector,xy,stage)
        if q['hit']!=selector[1:] or q['pad']<7:
            report('failed-owned-pointer',selector=selector,world=xy,projected=q);snap(page,'09-pointer-failure')
            raise AssertionError((selector,xy,q))
        if stage and xy[0] in (0,WIDTH):page.keyboard.down('Control')
        try:page.mouse.click(q['x'],q['y'])
        finally:
            if stage and xy[0] in (0,WIDTH):page.keyboard.up('Control')
    def field(page,selector,value):
        e=page.locator(selector);e.fill(value);e.press('Tab')
    blank=t.evaluate("""([id,n,w,h])=>{
      const s=HonroMaps.emptyStage(id,n,w,h);s.environment.placements=[];
      s.environment.atmosphere.overrides={skyTop:'#151c23',skyBottom:'#151c23'};
      s.environment.hiddenLayers=['L2','L3','L4','L5'];
      s.units.push(HonroUnits.record('archer','z-scout',510,1290,'player'));
      s.objectives.push({id:'z-fixture-far-reach',type:'reach',label:'QA only',x:2680,y:1120,radius:25,required:true});
      const a={id:'qa-inert-empty',name:'Empty toolbar sentinel',category:'scenery',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
      a.reference=HonroEnvironment.referenceForLegacyAsset(a);
      return HonroMaps.finalize({schema:'honro-map',version:HonroMaps.VERSION,activeStageId:s.id,name:n,
       environmentVersion:HonroEnvironment.VERSION,settings:{autosave:false,grid:10},stages:[s],library:[a]});
    }""",[SID,NAME,WIDTH,HEIGHT])
    assert len(blank['stages'])==1 and not blank['stages'][0]['terrains'] and not blank['stages'][0]['elements']
    assert not blank['stages'][0]['environment']['placements'] and not blank['library'][0]['visual']
    file_import(t,{'name':'empty-only.honro-map.json','mimeType':'application/json','buffer':json.dumps(blank).encode()})
    assert data(t)['stages'][0]['terrains']==[] and data(t)['stages'][0]['elements']==[]
    cam(t,1180,1050,.48);t.locator('#overlayToggle').uncheck();snap(t,'01-actual-zero')
    report('actual-blank')
    t.locator('[data-tool=solid]').click()
    for xy in RING:
        cam(t,*xy,.90);click_pt(t,'#stageCanvas',xy,True)
    t.keyboard.press('Enter')
    cam(t,1180,1050,.48);snap(t,'02-one-solid')
    base=data(t);s=base['stages'][0];assert len(s['terrains'])==1 and not s['elements']
    rotor=s['terrains'][0];assert rotor['type']=='solid' and len(rotor['points'])==len(RING)
    assert all(max(abs(a['x']-x),abs(a['y']-y))<=3 for a,(x,y) in zip(rotor['points'],RING))
    def compile_state(page):
        return page.evaluate("""()=>{const p=HonroWorkshopAPI.getProject(),s=p.stages[0],m=HonroMaps.compile(s,p),b=HonroWorkshopAPI.getRuntime().engine.b;
          return {collision:m.terrain,world:m.worldTerrain,previewCollision:b.terrain,
            owners:m.landmarks.map(x=>[x.id,x.asset?.id,x.layer,x.collisionIds||[]]),
            previewOwners:b.honroLandmarks.map(x=>x.id),scenery:s.environment.placements.length};}""")
    physics=compile_state(t)
    assert len(physics['collision'])==len(physics['previewCollision'])==1
    report('true-solid',points=len(rotor['points']),baseColliderSha=stable(physics['collision']))
    native=[]
    for idx,(name,layer,anchorX,faces) in enumerate(BODIES):
        t.locator('[data-tab=element]').click();t.locator('#newAsset').click()
        field(t,'#assetName',name);field(t,'#assetLayer',layer)
        t.locator('#assetCollision').uncheck()
        def asset():
            return next(x for x in data(t)['library'] if x['name']==name)
        seed=asset()['visual'][0]
        # Pure UI center zoom and middle-button pan; no editor state setter for Element.
        verts=[q for pts,_ in faces for q in pts]+[(0,0)]
        xmin,ymin=min(q[0] for q in verts),min(q[1] for q in verts)
        xmax,ymax=max(q[0] for q in verts),max(q[1] for q in verts)
        q=locate(t,'#elementCanvas',(0,0),False)
        desired=min((q['width']-40)/(xmax-xmin),(q['height']-40)/(ymax-ymin),.65)
        assert desired>.05,min(q['width'],q['height'])
        import math
        t.mouse.move(*q['center']);t.mouse.wheel(0,math.ceil(-math.log(desired/q['z'])/.0015))
        t.wait_for_function('z=>Math.abs(HonroWorkshopAPI.getEditorState().elementView.zoom-z)<.012',arg=desired,timeout=3000)
        target=((xmax+xmin)/2,(ymax+ymin)/2)
        for _ in range(20):
            q=locate(t,'#elementCanvas',target,False)
            dx=q['center'][0]-q['x'];dy=q['center'][1]-q['y']
            if max(abs(dx),abs(dy))<2:break
            cx,cy=q['center'];dx=max(-q['width']*.35,min(q['width']*.35,dx));dy=max(-q['height']*.35,min(q['height']*.35,dy))
            t.mouse.move(cx,cy);t.mouse.down(button='middle')
            try:t.mouse.move(cx+dx,cy+dy,steps=8)
            finally:t.mouse.up(button='middle')
        fits=[locate(t,'#elementCanvas',pt,False) for pt in verts]
        assert all(q['hit']=='elementCanvas' and q['pad']>=8 for q in fits),(name,fits)
        snap(t,f'03-{idx}-stock-fit')
        def poly(pts,color):
            t.locator('[data-etool=polygon]').click()
            for pt in pts:click_pt(t,'#elementCanvas',pt)
            t.keyboard.press('Enter')
            field(t,'#nativeShapeFill',color)
            assert asset()['visual'][-1]['fill']==color
        # Remove the auto-created hex through the genuine Point selector while
        # retaining the separate major body. Both anchors are outside body paint.
        order=[0,1,2]
        first=order[0];poly(*faces[first])
        t.locator('[data-etool=point]').click();click_pt(t,'#elementCanvas',(0,0));t.keyboard.press('Delete')
        assert len(asset()['visual'])==1 and asset()['visual'][0]!=seed
        for k in order[1:]:poly(*faces[k])
        t.locator('[data-etool=anchor]').click();click_pt(t,'#elementCanvas',(0,0))
        auth=asset();assert auth['layer']==layer and not auth['collision'] and not auth.get('interactionType')
        assert len(auth['visual'])==3 and all(len(auth['visual'][i]['points'])==len(faces[k][0]) for i,k in enumerate(order))
        # Confirm actual editor world from the accepted vertices, not merely the script.
        tol=max(4,2.2/fits[0]['z'])
        assert all(max(abs(u['x']-x),abs(u['y']-y))<=tol for i,k in enumerate(order)
                   for u,(x,y) in zip(auth['visual'][i]['points'],faces[k][0]))
        snap(t,f'03-{idx}-native-body-edit')
        t.locator('[data-tab=stage]').click()
        y=t.evaluate('x=>HonroMapEngine.surfaceY(HonroWorkshopAPI.getRuntime().engine.b.terrain,x,1200)?.y',anchorX)
        assert y is not None
        cam(t,anchorX,y,.58)
        t.locator(f'.asset-card[data-asset="{auth["id"]}"]').click()
        click_pt(t,'#stageCanvas',(anchorX,y),True)
        rn=data(t)['stages'][0]
        assert rn['terrains']==[rotor] and len(rn['elements'])==idx+1 and not rn['environment']['placements']
        q=rn['elements'][-1]
        assert q['assetId']==auth['id'] and q['depthLayer']=='L1' and q['layer']==layer
        native.append([auth,q])
        assert compile_state(t)['collision']==physics['collision']
        report(f'body-{idx}-native-l1',name=name,layer=layer,shapes=3,instance=q['id'],asset=auth['id'],
               actualAnchor=[q['x'],q['y']],points=sum(len(s['points']) for s in auth['visual']))
    authored=data(t)
    path=out/'private-native-z-stage.json'
    with t.expect_download() as dl:t.locator('#exportBtn').click()
    dl.value.save_as(path)
    t=fresh();file_import(t,path)
    raw=path.read_bytes()
    assert data(t)==authored,'Full native draft changed across new browser context'
    c=compile_state(t)
    assert c['collision']==physics['collision'] and c['previewCollision']==physics['previewCollision'] and c['world']==physics['world']
    assert len(c['owners'])==2 and all(not r[3] for r in c['owners'])
    assert c['scenery']==0
    report('manual-save-fresh-reopen',receiptSha=sha(raw),bytes=len(raw),collisionSha=stable(c['collision']),owners=c['owners'])
    t.locator('#overlayToggle').uncheck()
    layers=('terrain','structural-back','mid')
    def set_visible(layers_on):
        for l in layers:
            state=next(x['visible'] for x in data(t)['stages'][0]['layers'] if x['id']==l)
            if state!=(l in layers_on):t.locator(f'[data-eye="{l}"]').click()
        got={x['id'] for x in data(t)['stages'][0]['layers'] if x['visible']}
        assert got.intersection(layers)==set(layers_on)
    def pixel_evidence(label):
        capture_cam=cam(t,1180,1050,.5)
        ids=compile_state(t)
        d=shot_canvas(t,label)
        report(label,camera=capture_cam,sha=d,physicalRowsInThisPreviewOnly=len(ids['previewCollision']),previewOwnerIds=ids['previewOwners'])
        return d
    all_digest=pixel_evidence('04-composite-native-fresh')
    contributions={}
    for l in layers:
        set_visible(set(layers)-{l})
        contributions[l]=pixel_evidence(f'04-minus-{l}')
        assert contributions[l]!=all_digest,'Actual image unchanged on disabling '+l
    set_visible(set())
    flat=pixel_evidence('04-neutral-stock-background-only')
    singles={}
    for l in layers:
        set_visible({l});singles[l]=pixel_evidence(f'04-only-{l}')
        assert singles[l]!=flat,'Solo layer did not render '+l
    assert len(set(singles.values()))==3
    set_visible(set(layers))
    assert pixel_evidence('04-composite-native-restored')==all_digest
    footprints=t.evaluate('''()=>{
      const k=window.__qaReadOnlyZLayers,base=k['04-neutral-stock-background-only'],F=k['04-composite-native-fresh'];
      const names=['terrain','structural-back','mid'];
      const same=(a,b,i)=>a[i]===b[i]&&a[i+1]===b[i+1]&&a[i+2]===b[i+2]&&a[i+3]===b[i+3];
      const count={solo:{},visibleContribution:{},rearTerrainVolumeOverlap:0,frontTerrainVolumeOverlap:0,frontOrRearVisible:0};
      for(const n of names){count.solo[n]=0;count.visibleContribution[n]=0;}
      const solo=Object.fromEntries(names.map(n=>[n,k['04-only-'+n].p]));
      const minus=Object.fromEntries(names.map(n=>[n,k['04-minus-'+n].p]));
      for(let i=0;i<base.p.length;i+=4){
       const m=names.map(n=>!same(solo[n],base.p,i));
       names.forEach((n,j)=>{if(m[j])count.solo[n]++;if(!same(F.p,minus[n],i))count.visibleContribution[n]++;});
       if(m[0]&&m[1])count.rearTerrainVolumeOverlap++;if(m[0]&&m[2])count.frontTerrainVolumeOverlap++;
       if(!same(F.p,minus[names[1]],i)||!same(F.p,minus[names[2]],i))count.frontOrRearVisible++;
      }
      delete window.__qaReadOnlyZLayers;
      return {viewport:[base.w,base.h],...count};
    }''')
    report('native-real-pixel-occlusion',**footprints)
    assert min(footprints['visibleContribution'].values())>=1200
    assert min(footprints['rearTerrainVolumeOverlap'],footprints['frontTerrainVolumeOverlap'])>=1200
    assert compile_state(t)['collision']==physics['collision']
    cam(t,1100,1030,1.12);shot_canvas(t,'04-native-close-direct')
    cam(t,1180,1050,.5)
    t.locator('[data-tab=play]').click()
    try:t.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine',timeout=45000)
    finally:snap(t,'05-stock-playtest-entry')
    observed=t.evaluate("""()=>{const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,b=e.b,u=e.active;
     return {terrain:b.terrain.map(t=>[t.id,t.vertices]),owners:b.honroLandmarks.map(l=>[l.id,l.layer,l.collisionIds||[]]),
      actor:[u.id,u.x,u.y,u.h,e.grounded(u)],phase:b.phase,canInput:a.canInput()};}""")
    assert observed['terrain']==[[rotor['id'],physics['collision'][0]['vertices']]]
    assert sorted(observed['owners'])==sorted([q[0],q[2],[]] for q in c['owners'])
    report('actual-stock-playtest',frame=observed)
    assert observed['actor'][4] and not evidence['errors'],evidence['errors']
    snap(t,'05-stock-playtest-grounded')
    # One short true stock approach; no fake path or setting of actor position.
    app=t.frame_locator('#runtimeFrame').locator('canvas').first
    assert app.is_visible(),'Actual game canvas not visible'
    t.wait_for_function("()=>HonroWorkshopAPI.getPlayApp()?.canInput()",timeout=15000)
    state=lambda:t.evaluate("""()=>{const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,u=e.active;
      return {id:u.id,x:u.x,y:u.y,grounded:e.grounded(u),support:e.contactSurface(u.x,u.y-4,u.y+4)?.t?.id??null,round:e.b.round};}""")
    t.locator('#runtimeFrame').evaluate("f=>f.contentWindow.focus()")
    start=state()
    t.keyboard.down('KeyD')
    try:
        t.wait_for_function('x=>HonroWorkshopAPI.getPlayApp().engine.active.x>=x',
           arg=start['x']+205,timeout=9000)
    finally:t.keyboard.up('KeyD')
    t.wait_for_timeout(170)
    advanced=state();snap(t,'05-stock-playtest-walk')
    assert start['id']==advanced['id'] and advanced['x']-start['x']>=195 and advanced['grounded'] and advanced['support']==rotor['id']
    report('real-walk-contact',start=start,advanced=advanced)
    # Never upload a draft, only SHA+scoped counts and screenshots.
    report('done',layerDifferenceHashes=contributions,independentNativeRoleCount=3,foregroundPhysicalRowsAdded=0,
           limitation='local authored L1 occlusion, not actual relative parallax or 5-2 campaign')
