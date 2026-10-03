"""Real wheel/pan, portrait overscan, old saves and shared Game/Editor/Playtest."""
import hashlib
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT=ROOT/'_local/reports/camera-bounds'
OUT.mkdir(parents=True,exist_ok=True)
checks,rows,errors=[],[],[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail})
    print('PASS',name,flush=True)
def digest(v):
    return hashlib.sha256(json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
baseline=json.loads((ROOT/'tests/fixtures/camera-bounds-baseline.json').read_text(encoding='utf8'))
project=json.loads((ROOT/'shared/data/campaign.json').read_text(encoding='utf8'))
for s,old in zip(project['stages'],baseline['stages']):
    check(s['id']+': original collision records preserved',all(digest(next(t for t in s['terrains'] if t['id']==tid))==sha for tid,sha in old['terrain'].items()))
    if s['id']!='stage-1':
        check(s['id']+': gameplay data unchanged',digest({k:s.get(k) for k in ['width','height','terrains','materials','units','markers','objectives','events','encounters','initialState']})==old['gameplayHash'])

SETUP='''sid=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
 a.launchMap(HONRO_PROJECT,'stage-'+sid,{story:false});a.dialogue=null;a.turnNotice=null;a.close();
 const b=a.engine.b,s=a.scene;Object.assign(s,{manual:true,storyTween:null,goalFocus:null,x:b.width/2,y:b.height/2,scale:.66});
 s.render(a.engine,0,'A01',.7,false,0);return{width:b.width,height:b.height};}'''
with sync_playwright() as pw:
    browser=launch(pw)
    page=browser.new_page(viewport={'width':1440,'height':900})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((ROOT/'HONRO.html').as_uri())
    page.wait_for_function('window.HonroApp && window.HonroAct1Background?.ready()')
    for width,height in [(1440,900),(844,390),(390,844),(320,1100)]:
        page.set_viewport_size({'width':width,'height':height})
        for sid in range(1,11):
            page.evaluate(SETUP,sid)
            # Wheel uses the actual canvas listener; no direct min-scale assignment.
            canvas=page.locator('#battlecanvas');box=canvas.bounding_box()
            page.mouse.move(box['x']+box['width']*.5,box['y']+box['height']*.5)
            page.mouse.wheel(0,18000)
            page.wait_for_timeout(45)
            r=page.evaluate('''()=>{const a=HonroApp,s=a.scene,b=a.engine.b,{w,h}=s.size(),B=HonroBounds;
              s.render(a.engine,0,'A01',.7,false,0);const before=JSON.stringify(b),positions=[],f=B.focus(b),z=s.scale;
              for(const [x,y] of [[f.left,f.top],[f.right,f.top],[f.left,f.bottom],[f.right,f.bottom],[b.width/2,b.height/2]]){
                Object.assign(s,{x,y});s.render(a.engine,0,'A01',.7,false,0);const v=B.viewport(s,w,h),o=s.overscanStats.bounds;
                positions.push({center:[s.x,s.y],stable:s.x===x&&s.y===y,covered:o.left<=v.left&&o.right>=v.right&&o.top<=v.top&&o.bottom>=v.bottom});}
              const data=s.ctx.getImageData(0,0,s.canvas.width,s.canvas.height).data;let transparent=0;for(let i=3;i<data.length;i+=4)if(data[i]!==255)transparent++;
              const builds=s.overscanStats.builds;s.render(a.engine,0,'A01',.7,false,0);
              return {w,h,z,span:w/z,actorPx:B.POLICY.smallestActorWorldHeight*z,limits:B.zoomLimits(w),positions,transparent,
                terrainStable:before===JSON.stringify(b),paths:s.overscanStats.paths,cached:s.overscanStats.builds===builds,
                heightOverscan:h/z>b.height};}''')
            r.update(stage=sid,viewport=[width,height]);rows.append(r)
            check(f'{sid} @ {width}x{height}: tactical zoom, focus, coverage, readability, immutable battle',
                  abs(r['z']-r['limits']['min'])<1e-8 and r['actorPx']>=3.75-1e-7 and r['span']>=min(6800,width/(3.75/66))-.1
                  and all(p['stable'] and p['covered'] for p in r['positions']) and not r['transparent'] and r['terrainStable'] and r['cached'] and r['paths']<30,r)
            if sid in [1,2,7,10]:
                canvas.screenshot(path=str(OUT/f'stage-{sid}-{width}x{height}.png'))
            if sid in [1,2,7] and width in [1440,390]:
                page.evaluate('''()=>{const a=HonroApp,s=a.scene;s.x=0;s.y=a.engine.b.height*.65;s.render(a.engine,0,'',.6,false,0);}''')
                canvas.screenshot(path=str(OUT/f'edge-{sid}-{width}x{height}.png'))
        # Keep an actor rather than only terrain centered in the readable crop.
        page.evaluate(SETUP,1)
        page.evaluate('''()=>{const a=HonroApp,s=a.scene,{w,h}=s.size();s.zoom(.001,w/2,h/2);
          s.x=2700;s.y=1350;s.render(a.engine,0,'A01',.8,true,0);}''')
        canvas.screenshot(path=str(OUT/f'aim-{width}x{height}.png'))

    page.set_viewport_size({'width':1440,'height':900});page.evaluate(SETUP,2)
    smooth=page.evaluate('''()=>{const a=HonroApp,s=a.scene,{w,h}=s.size();s.x=290;s.y=590;const centers=[],scales=[];
      for(let i=0;i<90;i++){s.zoom(.96,w/2,h/2);s.render(a.engine,0,'A01',.6,false,0);centers.push([s.x,s.y]);scales.push(s.scale);}
      return {stable:centers.every(p=>Math.abs(p[0]-290)<1e-7&&Math.abs(p[1]-590)<1e-7),monotone:scales.every((v,i)=>!i||v<=scales[i-1]),span:w/s.scale};}''')
    check('Zoom transition keeps center through both former confiner thresholds',smooth['stable'] and smooth['monotone'],smooth)
    # A drag can move the center at minimum zoom; a tall viewport cannot pin it.
    box=page.locator('#battlecanvas').bounding_box()
    page.mouse.move(box['width']*.6,box['height']*.5);page.mouse.down()
    page.mouse.move(box['width']*.6-90,box['height']*.5+20,steps=8);page.mouse.up()
    check('Actual drag pans at maximum zoom-out',page.evaluate('HonroApp.scene.x>400'))
    page.evaluate('''st=>{const p=JSON.parse(JSON.stringify(HONRO_PROJECT));p.stages[0]=st;
      HonroApp.launchMap(p,'stage-1',{story:false});HonroApp.dialogue=null;HonroApp.turnNotice=null;}''',baseline['stage1OldMap'])
    old=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;delete b.honroCamera;b.units[0].hp-=11;b.honroState.flags.savedBoundary=true;
      const saved=JSON.stringify(b);a.mount(JSON.parse(saved));const s=a.scene;s.manual=true;s.x=-90;s.y=-700;s.zoom(.001,200,200);s.render(a.engine,0,'A01',.6,false,0);
      return {unchanged:JSON.stringify(a.engine.b)===saved,width:a.engine.b.width,defaultFocus:HonroBounds.focus(a.engine.b)};}''')
    check('Old 4200-wide Stage 1 without camera metadata keeps terrain, progress and HP on remount',old['unchanged'] and old['width']==4200,old)
    page.evaluate(SETUP,2)
    tracking=page.evaluate('''()=>{const a=HonroApp,e=a.engine,s=a.scene,b=e.b,u=e.active,skill=HONRO_CORE.SKILLS.A01;
      const prediction=JSON.stringify(e.predict(u,skill,55,.8));const f=HonroBounds.focus(b);s.manual=false;s.focusId=null;s.storyTween=null;
      e.fire('A01',.8);const q=b.projectiles[0];if(!q)throw Error('Real projectile setup failed');Object.assign(q,{x:b.width+120,y:-650});s.render(e,.2,'',.6,false,0);b.projectiles.pop();
      return {tracks:Math.abs(s.x-q.x)<1e-8&&Math.abs(s.y-q.y)<1e-8,prediction:JSON.stringify(e.predict(u,skill,55,.8))===prediction};}''')
    check('Projectile outside Play Bounds is tracked and trajectory prediction unchanged',tracking['tracks'] and tracking['prediction'],tracking)

    editor=browser.new_page(viewport={'width':1440,'height':900})
    editor.on('pageerror',lambda e:errors.append(str(e)))
    editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
    editor.check('#boundsToggle');editor.evaluate('HonroWorkshopAPI.setCamera({x:2700,y:320,zoom:.05})');editor.screenshot(path=str(OUT/'editor-bounds.png'))
    check('Editor exposes independent bounds overlay',editor.locator('#boundsToggle').is_checked())
    editor.click('[data-tab="play"]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
    frame=editor.frames[1];frame.evaluate(SETUP,1)
    same=frame.evaluate('''()=>{const a=HonroApp,s=a.scene,{w,h}=s.size();s.zoom(.001,w/2,h/2);s.render(a.engine,0,'A01',.6,false,0);
      return {z:s.scale,min:HonroBounds.zoomLimits(w).min,paths:s.overscanStats.paths};}''')
    check('Playtest uses the shared tactical zoom and skirt renderer',abs(same['z']-same['min'])<1e-9 and same['paths']>0,same)
    frame.locator('#battlecanvas').screenshot(path=str(OUT/'playtest.png'))
    mobile=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    mobile.on('pageerror',lambda e:errors.append(str(e)))
    mobile.goto((ROOT/'HONRO.html').as_uri());mobile.wait_for_function('window.HonroApp && window.HONRO_PROJECT');mobile.evaluate(SETUP,1)
    session=mobile.context.new_cdp_session(mobile);box=mobile.locator('#battlecanvas').bounding_box();cy=box['y']+box['height']*.5;cx=box['width']*.5
    def touches(gap):return [{'x':cx-gap,'y':cy,'id':1},{'x':cx+gap,'y':cy,'id':2}]
    session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':touches(80)})
    for gap in [60,40,20,10,4]:session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':touches(gap)})
    session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    touch=mobile.evaluate('''()=>{const a=HonroApp,s=a.scene;s.render(a.engine,0,'',.6,false,0);return {z:s.scale,min:HonroBounds.zoomLimits(s.size().w).min,contacts:a.contacts.size};}''')
    check('Real mobile pinch reaches the same tactical zoom and releases both contacts',abs(touch['z']-touch['min'])<1e-8 and touch['contacts']==0,touch)
    mobile.set_viewport_size({'width':844,'height':390})
    rotated=mobile.evaluate('''()=>{const a=HonroApp,s=a.scene;s.render(a.engine,0,'',.6,false,0);return {z:s.scale,min:HonroBounds.zoomLimits(s.size().w).min,span:s.size().w/s.scale};}''')
    check('Portrait-to-landscape rotation retains a readable horizontal view',rotated['z']>=rotated['min'] and 3000<rotated['span']<=6800.01,rotated)
    browser.close()
check('No browser errors',not errors,errors)
(OUT/'report.json').write_text(json.dumps({'checks':checks,'views':rows,'errors':errors},ensure_ascii=False,indent=2),encoding='utf8')
(OUT/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>HONRO bounds review</title><style>body{background:#111d22;color:#d8ddca;font:16px sans-serif}section{display:flex;flex-wrap:wrap;gap:14px}figure{margin:0;width:460px}img{max-width:100%;max-height:760px}a{color:inherit}</style><h1>HONRO camera / visual bounds</h1><p>Game, portrait, world edges, Workshop and Playtest. <a href="report.json">Checks</a></p><section>'+''.join(f'<figure><a href="{p.name}"><img src="{p.name}"></a><figcaption>{p.name}</figcaption></figure>' for p in sorted(OUT.glob('*.png')) )+'</section>',encoding='utf8')
print('CAMERA BOUNDS PASS',len(checks))
