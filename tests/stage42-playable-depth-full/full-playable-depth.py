"""Fresh concept A 3.8:1 all-solid topology/route fixture, not prior geometry."""
import hashlib,json,os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright

plan=json.loads(Path(__file__).with_name('native-itinerary.json').read_text())
WIDTH=plan['stage']['width'];HEIGHT=plan['stage']['height']
assert WIDTH/HEIGHT==3.8
SID='qa-stage42-full-native-topology';NAME='5-2 fresh three-height topology'
PLANS=[(s['role'],s['name'],s['vertices']) for s in plan['rings']]
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
      s.units.push(HonroUnits.record('archer','z-scout',468,1225,'player'));
      s.objectives.push({id:'z-fixture-far-reach',type:'reach',label:'QA only',x:5860,y:930,radius:25,required:true});
      const a={id:'qa-inert-empty',name:'Empty toolbar sentinel',category:'scenery',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
      a.reference=HonroEnvironment.referenceForLegacyAsset(a);
      return HonroMaps.finalize({schema:'honro-map',version:HonroMaps.VERSION,activeStageId:s.id,name:n,
       environmentVersion:HonroEnvironment.VERSION,settings:{autosave:false,grid:10},stages:[s],library:[a]});
    }""",[SID,NAME,WIDTH,HEIGHT])
    assert len(blank['stages'])==1 and not blank['stages'][0]['terrains'] and not blank['stages'][0]['elements']
    assert not blank['stages'][0]['environment']['placements'] and not blank['library'][0]['visual']
    file_import(t,{'name':'empty-only.honro-map.json','mimeType':'application/json','buffer':json.dumps(blank).encode()})
    assert data(t)['stages'][0]['terrains']==[] and data(t)['stages'][0]['elements']==[]
    cam(t,3040,760,.14);t.locator('#overlayToggle').uncheck();snap(t,'01-actual-zero')
    report('actual-blank')
    ports={}
    for i,(role,name,ring) in enumerate(PLANS):
        t.locator('[data-tool=solid]').click()
        for xy in ring:
            cam(t,*xy,.86)
            click_pt(t,'#stageCanvas',xy,True)
        t.keyboard.press('Enter')
        field(t,'#objName',name)  # actual native inspector; no automatic commands
        cam(t,3040,735,.14); snap(t,f'02-real-authored-{i}')
        s=data(t)['stages'][0]
        assert len(s['terrains'])==i+1
        v=s['terrains'][-1]
        assert v['name']==name and v['type']=='solid' and not v.get('oneWay')
        assert len(v['points'])==len(ring)
        assert all(max(abs(q['x']-x),abs(q['y']-y))<=4 for q,(x,y) in zip(v['points'],ring))
        ports[role]=v['id']
        report('authored-'+role,id=v['id'],vertices=len(v['points']),material=v.get('baseMaterial'),oneWay=v.get('oneWay',False))
    project=data(t)
    path=out/'private-full-native-rings.json'
    with t.expect_download() as dl:t.locator('#exportBtn').click()
    dl.value.save_as(path)
    t=fresh();file_import(t,path)
    assert data(t)==project,'Manual native artifact did not reopen exactly'
    report('manual-save-and-fresh-reopen',sha256=sha(path.read_bytes()),bytes=path.stat().st_size,roles=ports)
    t.locator('#overlayToggle').uncheck();cam(t,3040,735,.14);snap(t,'03-full-native-reopened')
    t.locator('#overlayToggle').check();cam(t,2360,1050,.5);snap(t,'03-geometry-overlay-real')
    t.locator('#overlayToggle').uncheck();cam(t,2500,1035,.5);snap(t,'03-stock-three-physical-lanes')
    check=t.evaluate("""({ports,xs})=>{
      const p=HonroWorkshopAPI.getProject(),st=p.stages[0],m=HonroMaps.compile(st,p),b=HonroWorkshopAPI.getRuntime().engine.b;
      const heights=xs.map(x=>['B','M','U'].map(r=>{
        const t=m.terrain.find(v=>v.id===ports[r]);const e=HONRO_CORE.terrainSurfaces(t,x).filter(f=>Math.abs(f.slope)<1.35);
        if(e.length!==1)throw Error('Expected one exact exposed author face '+r+'/'+x);
        return e[0].y;
      }));
      const heads=[];
      // Positive runtime polygon thickness clearance, not a model of actor movement.
      for(const [below,above,x0,x1] of [['B','M',1774,4546],['M','U',1774,2896]]){
        const t=m.terrain.find(z=>z.id===ports[below]),r=m.terrain.find(z=>z.id===ports[above]);
        let best=null;
        for(let x=x0;x<=x1;x+=3){
          const hit=HONRO_CORE.terrainSurfaces(t,x).filter(f=>Math.abs(f.slope)<1.35)[0];
          const spans=HONRO_CORE.poly(r).flatMap((a,i,arr)=>{
            const c=arr[(i+1)%arr.length];return Math.min(a.x,c.x)<=x&&x<Math.max(a.x,c.x)?
              [a.y+(x-a.x)*(c.y-a.y)/(c.x-a.x)]:[];});
          if(!hit||!spans.length)throw Error('Probe unavailable at '+x);
          const gap=hit.y-Math.max(...spans);
          if(!best||gap<best.gap)best={x,gap};
        }
        heads.push({below,above,...best});
      }
      return {heights,heads,compile:m.terrain,preview:b.terrain,noElements:!st.elements.length&&!st.environment.placements.length};
    }""",{'ports':ports,'xs':plan['tests']['overlapX']})
    assert len(check['compile'])==len(check['preview'])==len(PLANS) and check['noElements']
    assert all(not t.get('oneWay') for t in check['compile'])
    assert all(b-m>250 and m-u>240 for b,m,u in check['heights'])
    assert check['heads'][0]['gap']>=125 and check['heads'][1]['gap']>=120
    for i,v in enumerate(check['compile']):
        assert v['id']==check['preview'][i]['id'] and v['vertices']==check['preview'][i]['vertices']
    collider={v['id']:v['vertices'] for v in check['compile']}
    geometry_only=stable([v['vertices'] for v in check['compile']])
    report('actual-three-body-overlap',x=plan['tests']['overlapX'],heightB_M_U=check['heights'],
           headroom=check['heads'],geometrySha=geometry_only)
    def enter_case(case,prior=None):
        new=fresh();file_import(new,path)
        assert data(new)==project
        cam(new,1350,1080,.5);new.locator('[data-tab=play]').click()
        try:new.wait_for_function('!!HonroWorkshopAPI.getPlayApp()?.engine',timeout=45000)
        finally:snap(new,'05-play-start-'+case)
        new.wait_for_function('HonroWorkshopAPI.getPlayApp().canInput()',timeout=17000)
        new.locator('#runtimeFrame').evaluate("f=>f.contentWindow.focus()")
        actual=new.evaluate("""()=>Object.fromEntries(HonroWorkshopAPI.getPlayApp().engine.b.terrain.map(q=>[q.id,q.vertices]))""")
        assert actual==collider,'Real play terrain drifted'
        if prior:prior.context.close()
        return new
    t=enter_case('east-direct',t)
    state=lambda:t.evaluate("""()=>{const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,u=e.active,b=e.b;
      return {id:u.id,x:u.x,y:u.y,h:u.h,side:b.side,round:b.round,phase:b.phase,move:u.moveLeft,
       grounding:e.grounded(u),jumping:!!u.jumping,airborne:!!u.airborne,vx:u.vx,vy:u.vy,walkSpeed:u.walkSpeed,ready:a.canInput(),
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
    def move_to(x,max_turns=8):
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
    def start_trace(label):
        t.evaluate("""label=>{
          let frames=[];const info=window.__nativeTraj={label,frames,closed:false};
          const start=performance.now();
          function f(now){
            if(info.closed||info!==window.__nativeTraj||now-start>4500||frames.length>=300)return;
            const a=HonroWorkshopAPI.getPlayApp(),e=a.engine,u=e.active;
            frames.push({ms:+(now-start).toFixed(2),x:u.x,y:u.y,vx:u.vx,vy:u.vy,
              move:u.moveLeft,jump:!!u.jumping,airborne:!!u.airborne,grounded:e.grounded(u),
              support:e.contactSurface(u.x,u.y-4,u.y+4)?.t.id??null,
              keys:[a.keys.has('KeyA'),a.keys.has('KeyD'),a.keys.has('ControlLeft')]});
            requestAnimationFrame(f);
          }requestAnimationFrame(f);
        }""",label)
    timings={}
    def end_trace(label,edge,y,d):
        frames=t.evaluate("""()=>{const t=window.__nativeTraj;if(!t)return [];t.closed=true;return t.frames}""")
        first_move=next((f for f in frames if f['keys'][0 if d<0 else 1]),None)
        crossing=next((f for f in frames if (f['x']-edge)*d>=0),None)
        apex=min((f for f in frames if f['jump']),key=lambda f:f['y'],default=None)
        below=next((f for f in frames if f['jump'] and f['vy']>0 and f['y']>=y),None)
        wall_candidate=next((f for f in frames if f['jump'] and f['vy']>0 and abs(f['x']-edge)<10 and f['y']>y+2),None)
        launch=next((f for f in frames if f['jump']),None)
        if launch and first_move:
            timings[label]={'launchX':launch['x'],'delay':round(first_move['ms']-launch['ms'],2)}
        report('trace-'+label,rows=len(frames),edge=edge,targetY=y,lateralStart=first_move,
               firstCrossing=crossing,measuredApex=apex,firstBelowLipOnDescent=below,
               sideProximityCandidate=wall_candidate)
        (out/('trace-'+label+'.json')).write_text(json.dumps({'measuredOnly':True,'samples':frames},indent=2))
    def jump_to(label,sr,tr,launch,edge,landing_direction,ceiling_y,margin):
        move_to(launch)
        cur=verified(label+'-outside-start',sr)
        assert 40<(edge-cur['x'])*landing_direction<130,cur
        assert 110<cur['y']-ceiling_y<183,cur
        if cur['move']<145:
            t.keyboard.press('KeyF')
            t.wait_for_function("""r=>{const a=HonroWorkshopAPI.getPlayApp();return a.canInput()&&a.engine.b.round>r}""",arg=cur['round'],timeout=13000)
        start_trace(label)
        try:
            t.keyboard.press('ControlLeft')
            # Sample open-side arc. Two predeclared position and timing
            # variants measure actual input latitude, not a frame-perfect script.
            early_state=t.wait_for_function("""lim=>{const u=HonroWorkshopAPI.getPlayApp().engine.active;
                return u.jumping&&u.y<lim?{x:u.x,y:u.y,vy:u.vy}:false;}""",
                                 arg=ceiling_y-margin,
                                 polling='raf',timeout=1500)
            key='KeyD' if landing_direction>0 else 'KeyA'
            t.keyboard.down(key)
            try:
                t.wait_for_function("""({edge,d})=>(HonroWorkshopAPI.getPlayApp().engine.active.x-edge)*d>=38""",
                      arg={'edge': edge, 'd':landing_direction},polling='raf',timeout=3000)
            finally:
                t.keyboard.up(key)
                report(label+'-in-flight',state=early_state.json_value(),edge=edge,landingY=ceiling_y,
                       clearanceBeforeLateral=margin)
            verified(label,tr);route.append(tr)
        finally:end_trace(label,edge,ceiling_y,landing_direction)
    def descend(label,sr,tr,edge,d,outside):
        verified(label+'-before-step',sr)
        assert (outside-edge)*d>25
        move_to(outside)
        verified(label,tr);route.append(tr)

    limits=plan['tests'];entries={a[0]:a[1:] for a in limits['launches']}
    # Fixed read-only physical line-of-sight, not a live attack or claim about arcs/damage.
    def ray(label):
        return t.evaluate("""({name,point})=>{
          const a=HonroWorkshopAPI.getPlayApp(),w=a.scene.canvas.ownerDocument.defaultView,
             e=a.engine,u=e.active,C=w.HONRO_CORE,from={x:u.x,y:u.y-u.h*.7};
          const segment=(from,to)=>e.b.terrain.flatMap(t=>{
             const hit=C.segmentTerrain(from,to,t);return hit?[{id:t.id,fraction:hit.t}]:[];
          }).sort((a,b)=>a.fraction-b.fraction);
          return {name,from,to:point,anglesDegrees:Math.atan2(from.y-point.y,point.x-from.x)*180/Math.PI,
            occludingSolids:segment(from,point),scope:'static straight terrain ray; no projectile/attack claimed'};
        }""",{'name':label,'point':limits['shotTarget']})
    stage_ref={};failures=[];ray_results={}
    labels=('east-middle','west-first','west-second','west-upper')
    initial_mount=True
    def take(label,variant):
        role0,role1,launch,edge,d,y=entries[label]
        return jump_to(label+'-'+variant,role0,role1,launch+(17 if variant=='near' else -17)*d,
                       edge,d,y,(8 if variant=='near' else 29))
    for kind in ('east','west'):
        for variant in ('near','far'):
            case=kind+'-'+variant
            if initial_mount:initial_mount=False
            else:t=enter_case(case,t)
            again=state();route=['B']
            assert [again[k] for k in ('id','x','y','support')]==[first[k] for k in ('id','x','y','support')]
            report('same-native-spawn-'+case,state=again)
            try:
                if kind=='east':
                    move_to(limits['lowerShotX']);verified(case+'-low-line','B')
                    ray_results[case]=ray(case+'-below-lane')
                    report('read-only-below-ray',**ray_results[case])
                    take('east-middle',variant)
                    move_to(limits['rescueX']);verified(case+'-real-rescue-approach','M')
                    move_to(limits['refugeX']);verified(case+'-contiguous-same-M-refuge','M')
                    descend(case+'-return-to-baggage','M','B',4550,1,4635)
                    move_to(limits['gateX']);verified(case+'-gate-shoulder-via-native-ground','B')
                    assert route==['B','M','B']
                else:
                    for label in ('west-first','west-second','west-upper'):take(label,variant)
                    move_to(limits['westShotX']);verified(case+'-independent-upper-attack-line','U')
                    ray_results[case]=ray(case+'-high-lane')
                    report('read-only-upper-ray',**ray_results[case])
                    descend(case+'-upper-open-edge-to-middle','U','M',2900,1,2965)
                    move_to(limits['rescueX']);verified(case+'-real-rescue-approach','M')
                    move_to(limits['refugeX']);verified(case+'-contiguous-same-M-refuge','M')
                    assert route==['B','L1','L2','U','M']
                assert t.evaluate("""()=>Object.fromEntries(HonroWorkshopAPI.getPlayApp().engine.b.terrain.map(q=>[q.id,q.vertices]))""")==collider
                stage_ref[case]=route
            except Exception as e:
                bad={'case':case,'route':route,'state':state(),'error':str(e)[:900]}
                failures.append(bad);report('authentic-full-route-failure',**bad)
                snap(t,'09-route-fail-'+case)
    margin_results={}
    for label in labels:
        a=timings.get(label+'-near');b=timings.get(label+'-far')
        dx=round(abs(a['launchX']-b['launchX']),2) if a and b else None
        dt=round(b['delay']-a['delay'],2) if a and b else None
        margin_results[label]={'measured': [a,b], 'launchSeparately':dx,'laterLateralByMs':dt,
                               'observedDistinct': dx is not None and dx>=15 and dt is not None and dt>=16}
    tactical=(len(ray_results)==4 and all(bool(s['occludingSolids'])==(k.startswith('east')) for k,s in ray_results.items()))
    report('full-native-two-choices',routes=stage_ref,geometrySha=geometry_only,failures=failures,
           timingEvidence=margin_results,tacticalRayPass=tactical,
           scope='pure native fixture, west short player-only step-ups, same continuous M rescue/refuge floor, no NPC shown, no attack or campaign')
    assert not failures and len(stage_ref)==4,'A genuine route variant did not finish; review geometry'
    assert all(v['observedDistinct'] for v in margin_results.values()),'Do not claim input latitude from indistinguishable trials'
    assert tactical,'Expected static shot occlusion/opening differs; no claim about live projectile'
    assert not evidence['errors'],evidence['errors']
