"""Native authored separate closed B, M, U supports. No prior art or asset."""
import hashlib,json,os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
WIDTH,HEIGHT=4560,1200
SID='qa-stage42-solid-switchback'; NAME='5-2 NEW playable heights proof'
# All positions are native pointer targets in a freshly blank map, not imported vectors.
# Lower supply road to x~.62 plus a dedicated east ramp skirt outside the core lane.
# Middle is rooted at the tall right shoulder, and upper independent at the left formation.
B=[(230,1000),(421,1004),(635,985),(748,970),(925,976),(1133,999),(1337,1009),(1460,1000),
 (1665,973),(1854,952),(2060,934),(2280,917),(2490,921),(2620,930),(2770,944),(2860,940),(3000,908),
 (3140,883),(3270,860),(3390,839),(3425,826),(3470,806),(3530,752),(3585,697),(3660,688),
 (3725,786),(3680,991),(3680,1190),(2150,1190),(230,1190)]
M=[(1370,658),(1550,638),(1680,620),(1830,627),(2020,651),(2230,646),(2388,635),
 (2508,617),(2615,603),(2680,578),(2750,568),(2890,585),(3070,605),(3192,620),
 (3280,609),(3378,592),(3425,587),
 (3425,675),(3348,701),(3210,683),(3075,665),(2900,647),(2688,647),(2490,733),
 (2210,712),(1960,706),(1770,698),(1530,695),(1400,683)]
U=[(2770,476),(2840,467),(2930,475),(3140,479),(3260,466),(3420,455),(3545,432),(3680,405),
 (3770,388),(3860,378),(3970,383),(4060,373),(4180,377),(4280,387),
 (4292,462),(4190,484),(4080,470),(3900,454),(3705,485),(3510,493),(3360,522),(3180,515),
 (3000,534),(2860,550),(2770,525)]
# Real body clearance across the play overlap; the upper tip has a thin
# exposed lip, with depth building toward the higher rocky gate terrain.
U=[(x,y-(60 if i<14 else (91 if x<=3000 else 74))) for i,(x,y) in enumerate(U)]
PLANS=[('B-bottom supply and east approach',B),('M-middle right-rooted shelf',M),('U-upper left formation',U)]
def sha(b):return hashlib.sha256(b).hexdigest()
def stable(x):return sha(json.dumps(x,sort_keys=True,separators=(',',':')).encode())
def data(page):return page.evaluate('HonroWorkshopAPI.getProject()')
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
url=sys.argv[2];assert url=='http://127.0.0.1:8884/HONRO_WORKSHOP.html'
evidence={'scope':'new solid closed geometry transfer fixture, not campaign or rendered art','checkpoints':[],'errors':[]}
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
      s.units.push(HonroUnits.record('archer','z-scout',2280,906,'player'));
      s.objectives.push({id:'z-fixture-far-reach',type:'reach',label:'QA only',x:4100,y:410,radius:25,required:true});
      const a={id:'qa-inert-empty',name:'Empty toolbar sentinel',category:'scenery',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
      a.reference=HonroEnvironment.referenceForLegacyAsset(a);
      return HonroMaps.finalize({schema:'honro-map',version:HonroMaps.VERSION,activeStageId:s.id,name:n,
       environmentVersion:HonroEnvironment.VERSION,settings:{autosave:false,grid:10},stages:[s],library:[a]});
    }""",[SID,NAME,WIDTH,HEIGHT])
    assert len(blank['stages'])==1 and not blank['stages'][0]['terrains'] and not blank['stages'][0]['elements']
    assert not blank['stages'][0]['environment']['placements'] and not blank['library'][0]['visual']
    file_import(t,{'name':'empty-only.honro-map.json','mimeType':'application/json','buffer':json.dumps(blank).encode()})
    assert data(t)['stages'][0]['terrains']==[] and data(t)['stages'][0]['elements']==[]
    cam(t,2300,600,.17);t.locator('#overlayToggle').uncheck();snap(t,'01-actual-zero')
    report('actual-blank')
    ports={}
    for i,(name,ring) in enumerate(PLANS):
        t.locator('[data-tool=solid]').click()
        for xy in ring:
            cam(t,*xy,.86)
            click_pt(t,'#stageCanvas',xy,True)
        t.keyboard.press('Enter')
        field(t,'#objName',name)  # actual native inspector; no automatic commands
        cam(t,2400,620,.18); snap(t,f'02-real-authored-{i}')
        s=data(t)['stages'][0]
        assert len(s['terrains'])==i+1
        v=s['terrains'][-1]
        assert v['name']==name and v['type']=='solid' and not v.get('oneWay')
        assert len(v['points'])==len(ring)
        assert all(max(abs(q['x']-x),abs(q['y']-y))<=4 for q,(x,y) in zip(v['points'],ring))
        ports[name[0]]=v['id']
        report('authored-'+name[0],id=v['id'],vertices=len(v['points']),material=v.get('baseMaterial'),oneWay=v.get('oneWay',False))
    project=data(t)
    path=out/'private-three-native-rings.json'
    with t.expect_download() as dl:t.locator('#exportBtn').click()
    dl.value.save_as(path)
    t=fresh();file_import(t,path)
    assert data(t)==project,'Manual native artifact did not reopen exactly'
    report('manual-save-and-fresh-reopen',sha256=sha(path.read_bytes()),bytes=path.stat().st_size,roles=ports)
    t.locator('#overlayToggle').uncheck();cam(t,2290,590,.18);snap(t,'03-full-native-reopened')
    t.locator('#overlayToggle').check();cam(t,2900,675,.5);snap(t,'03-geometry-overlay-real')
    t.locator('#overlayToggle').uncheck();cam(t,2975,655,.5);snap(t,'03-stock-three-physical-lanes')
    check=t.evaluate("""ports=>{
      const p=HonroWorkshopAPI.getProject(),st=p.stages[0],m=HonroMaps.compile(st,p),b=HonroWorkshopAPI.getRuntime().engine.b;
      const x=2910;
      const points=Object.entries(ports).map(([r,id])=>{const q=m.terrain.find(z=>z.id===id);
        if(!q)return null;
        const edges=HONRO_CORE.terrainSurfaces(q,x).filter(f=>Math.abs(f.slope)<1.35);
        return {role:r,id,edges:edges.map(j=>[j.y,j.slope]),count:q.vertices.length,oneWay:!!q.oneWay};});
      return {x,points,compile:m.terrain,preview:b.terrain,noElements:!st.elements.length&&!st.environment.placements.length};
    }""",ports)
    assert len(check['compile'])==len(check['preview'])==3 and check['noElements']
    assert all(q and len(q['edges'])==1 and not q['oneWay'] for q in check['points'])
    assert (check['points'][0]['edges'][0][0]-check['points'][1]['edges'][0][0])>250
    assert (check['points'][1]['edges'][0][0]-check['points'][2]['edges'][0][0])>100
    for i,q in enumerate(check['compile']):
        assert q['id']==check['preview'][i]['id'] and q['vertices']==check['preview'][i]['vertices']
    collider={v['id']:v['vertices'] for v in check['compile']}
    report('separate-true-surfaces-at-same-x',x=check['x'],points=check['points'],sha=stable(collider))
    t.locator('[data-tab=play]').click()
    try:t.wait_for_function('!!HonroWorkshopAPI.getPlayApp()?.engine',timeout=45000)
    finally:snap(t,'05-native-playtest-entry')
    t.wait_for_function('HonroWorkshopAPI.getPlayApp().canInput()',timeout=17000)
    t.locator('#runtimeFrame').evaluate("f=>f.contentWindow.focus()")
    live=t.evaluate("""()=>Object.fromEntries(HonroWorkshopAPI.getPlayApp().engine.b.terrain.map(q=>[q.id,q.vertices]))""")
    assert live==collider,'Real play terrain drifted'
    state=lambda:t.evaluate("""()=>{const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,u=e.active,b=e.b;
      return {id:u.id,x:u.x,y:u.y,h:u.h,side:b.side,round:b.round,phase:b.phase,move:u.moveLeft,
       grounding:e.grounded(u),jumping:!!u.jumping,vy:u.vy,ready:a.canInput(),
       support:e.contactSurface(u.x,u.y-4,u.y+4)?.t.id??null,
       camera:{x:a.scene.x,y:a.scene.y,z:a.scene.scale}};
    }""")
    first=state(); report('real-start',state=first)
    assert first['grounding'] and first['support']==ports['B']
    actor=first['id']
    route=['B']
    def verified(label,role):
        t.wait_for_function("""({id,sid})=>{const e=HonroWorkshopAPI.getPlayApp().engine,u=e.active;
             return u?.id===id&&e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+4)?.t.id===sid;}""",
          arg={'id':actor,'sid':ports[role]},timeout=5500)
        s=state()
        assert s['id']==actor and s['support']==ports[role] and s['grounding']
        snap(t,'05-'+label); report(label,role=role,state=s)
        return s
    def move_to(x,max_turns=5):
        for _ in range(max_turns):
            s=state()
            if abs(s['x']-x)<=13:return s
            assert s['id']==actor and s['side']==0
            d=1 if x>s['x'] else -1
            key='KeyD' if d>0 else 'KeyA'
            t.keyboard.down(key)
            try:
                t.wait_for_function("""({x,d})=>{const a=HonroWorkshopAPI.getPlayApp(),u=a.engine.active;
                        return (u.x-x)*d>=0||u.moveLeft<=10;}""",
                    arg={'x':x,'d':d},timeout=8500)
            finally:t.keyboard.up(key)
            end=state()
            if abs(end['x']-x)<=13:return end
            if end['move']>10:raise AssertionError(('Stopped before planned grounded path',x,end))
            t.keyboard.press('KeyF')
            t.wait_for_function("""r=>{const a=HonroWorkshopAPI.getPlayApp();return a.canInput()&&a.engine.b.round>r}""",arg=end['round'],timeout=13000)
        raise AssertionError(('Round budget for approach',x,state()))
    def jump_to(label,sr,tr,launch,edge,landing_direction,ceiling_y):
        move_to(launch)
        cur=verified(label+'-outside-start',sr)
        assert (edge-cur['x'])*landing_direction>24
        if cur['move']<145:
            t.keyboard.press('KeyF')
            t.wait_for_function("""r=>{const a=HonroWorkshopAPI.getPlayApp();return a.canInput()&&a.engine.b.round>r}""",arg=cur['round'],timeout=13000)
        t.keyboard.press('ControlLeft')
        t.wait_for_function("""lim=>{const u=HonroWorkshopAPI.getPlayApp().engine.active;return u.jumping&&u.y<lim;}""",
                             arg=ceiling_y-14,timeout=1500)
        # Real Ctrl launch is recorded; wait until the foot clears the open edge, then move across.
        report(label+'-in-flight',state=state(),edge=edge,landingY=ceiling_y)
        key='KeyD' if landing_direction>0 else 'KeyA'
        t.keyboard.down(key)
        try:
            t.wait_for_function("""({edge,d})=>(HonroWorkshopAPI.getPlayApp().engine.active.x-edge)*d>=38""",
                  arg={'edge':edge,'d':landing_direction},timeout=3000)
        finally:t.keyboard.up(key)
        verified(label,tr);route.append(tr)
    def step_off(label,sr,tr,edge,off_direction,outboard):
        assert (outboard-edge)*off_direction>25
        verified(label+'-before-step',sr)
        move_to(outboard)
        verified(label,tr);route.append(tr)
    try:
        # Solid, open edge beside upper body; never jump through underside.
        jump_to('east-B-to-M', 'B','M',3585,3425,-1,587)
        move_to(2510);verified('middle-shelf-role-band', 'M')
        jump_to('west-M-to-U','M','U',2712,2770,1,416)
        move_to(3150);verified('upper-defence-approach', 'U')
        step_off('west-U-to-M','U','M',2770,-1,2702)
        move_to(3310);verified('middle-return-reapproach','M')
        step_off('east-M-to-B','M','B',3425,1,3490)
        assert route==['B','M','U','M','B']
    except BaseException as err:
        report('first-authentic-route-failure',route=route,state=state(),error=str(err)[:900])
        snap(t,'09-first-route-failure')
        raise
    assert t.evaluate("""()=>Object.fromEntries(HonroWorkshopAPI.getPlayApp().engine.b.terrain.map(q=>[q.id,q.vertices]))""")==collider
    assert not evidence['errors'],evidence['errors']
    report('first-route-bidirectional-result',route=route,movement='real stock A/D, CtrlLeft, gravity; no E or script actor motion',
      oldArt=False,geometryDigest=stable(collider),limits='real actor engineering case only; no continuous two-way stairs or NPC/AI escort, no full campaign or art')
