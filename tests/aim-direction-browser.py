"""Direction signatures through the live prediction renderer and actual charge controls."""
import base64,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/aim-direction';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)

SETUP=r'''()=>{const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();
 window.aimSetup=(id,angle=35,zoom=.9)=>{a.trainingClass=C.SKILLS[id].cls;a.trainingSkill=id;a.trainingRanks[id]=8;a.launch(1,true,id);a.dialogue=null;a.turnNotice=null;a.charging=false;const e=a.engine,u=e.active;u.angle=angle;a.selected=id;Object.assign(a.scene,{manual:true,x:u.x+150,y:u.y-120,scale:zoom});a.updateHUD(true);
 window.aimPaint=(dt=.1)=>{window.directionMarks=[];const fx=a.scene.arcFx,orig=fx.predictionGuide;fx.predictionGuide=function(c,...args){const old=c.createLinearGradient;c.createLinearGradient=function(...v){const m=c.getTransform();directionMarks.push({axis:v,m:[m.a,m.b,m.c,m.d,m.e,m.f]});return old.apply(c,v);};try{return orig.call(this,c,...args);}finally{c.createLinearGradient=old;}};try{a.scene.render(e,dt,a.selected,a.power,a.charging,dt);}finally{fx.predictionGuide=orig;}return directionMarks;};return{a,e,u};};}'''

def suite(page,shell):
    owner=page if hasattr(page,'mouse') else page.page
    page.evaluate(SETUP)
    for sid in ['A01','M01','S09','O01','S00','S01']:
        for angle in [35,145]:
            page.evaluate('([id,angle])=>aimSetup(id,angle)',[sid,angle])
            box=page.locator('#fire').bounding_box();owner.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);owner.mouse.down();owner.wait_for_timeout(90)
            marks=page.evaluate('aimPaint()')
            state=page.evaluate("({charging:HonroApp.charging,phase:HonroApp.engine.b.phase,dpr:HonroApp.scene.size().d,zoom:HonroApp.scene.scale})")
            expected=angle
            import math
            check(shell+f': {sid} charge at {angle} degrees draws a separate correctly oriented direction signature',state['charging'] and len(marks)==1 and abs(marks[0]['m'][0]/state['dpr']-math.cos(math.radians(expected))*math.sqrt(state['zoom']))<1e-7 and abs(marks[0]['m'][1]/state['dpr']+math.sin(math.radians(expected))*math.sqrt(state['zoom']))<1e-7,{'marks':marks,'state':state})
            if angle==35:owner.screenshot(path=str(OUT/(shell+'-'+sid+'.png')))
            owner.mouse.up()
            check(shell+f': {sid} release hides the aiming signature during the actual attack',not page.evaluate('aimPaint()') and page.evaluate('HonroApp.engine.b.phase')!='aim')
    # Pixel scale, four distinctive animated drawings, unchanged simulation and no diagonal melee miscue.
    result=page.evaluate(r'''()=>{const C=HONRO_CORE,rows=[],sheet=document.createElement('canvas');sheet.width=1000;sheet.height=560;const sc=sheet.getContext('2d');sc.fillStyle='#152a30';sc.fillRect(0,0,1000,560);const signatures=[];
     for(const [i,id] of ['A01','M01','S09','O01'].entries()){
      const {e,u}=aimSetup(id,0),s=C.SKILLS[id],before=JSON.stringify(e.b),frames=[],widths=[];
      for(const zoom of [.2,.5,1.2]){const cv=document.createElement('canvas');cv.width=230;cv.height=100;const c=cv.getContext('2d'),origin=e.origin(u,0);c.translate(28,50);c.scale(zoom,zoom);c.translate(-origin.x,-origin.y);let width=0;const old=c.stroke;c.stroke=function(){if(this.strokeStyle instanceof CanvasGradient)width=this.lineWidth*Math.hypot(this.getTransform().a,this.getTransform().b);return old.call(this);};C.drawAimDirection(c,e,u,s,1,true,.4,zoom);frames.push(cv.toDataURL());widths.push(width);}
      const animation=[];for(const [j,time] of [.2,.6,1.1].entries()){const cv=document.createElement('canvas');cv.width=250;cv.height=120;const c=cv.getContext('2d'),origin=e.origin(u,0);c.translate(40-origin.x,60-origin.y);C.drawAimDirection(c,e,u,s,1,true,time,1);animation.push(cv.toDataURL());sc.drawImage(cv,230+j*250,i*140);}
      sc.fillStyle='#e4e6d9';sc.font='18px sans-serif';sc.fillText({A01:'설오 · 활시위와 화살깃',M01:'담허 · 붓결과 기의 흐름',S09:'휘겸 · 검의 날과 바람',O01:'소단 · 혼불과 혼의 실'}[id],15,i*140+63);
      signatures.push(animation[0]);rows.push({id,widths,animated:new Set(animation).size===3,pure:JSON.stringify(e.b)===before});
     }window.aimSheet=sheet.toDataURL();return{rows,distinct:new Set(signatures).size};}''')
    check(shell+': all four signatures animate, remain distinct and scale with square-root zoom',result['distinct']==4 and all(r['animated'] and r['pure'] and all(abs(w-1.35*math.sqrt(z))<1e-6 for w,z in zip(r['widths'],[.2,.5,1.2])) for r in result['rows']),result)
    (OUT/(shell+'-signatures.png')).write_bytes(base64.b64decode(page.evaluate('aimSheet').split(',')[1]))
    page.evaluate("{const {a}=aimSetup('A15',55,.2);a.charging=true;a.power=.75;aimPaint();}");owner.screenshot(path=str(OUT/(shell+'-zoom-out.png')))
    check(shell+': redesigned seven-star keeps direction and trajectory simultaneously',len(page.evaluate('aimPaint()'))==1)
    page.evaluate("HonroApp.scene.storyFrozen=true")
    check(shell+': story pause hides direction together with the other aim aids',not page.evaluate('aimPaint()'))
    page.evaluate("HonroApp.scene.storyFrozen=false")
    # Full authored training map with 12 enemies: changing angle must keep prediction responsive.
    cost=page.evaluate(r'''()=>{const {a,e,u}=aimSetup('A15',55,.4),c=document.createElement('canvas').getContext('2d'),times=[];for(let i=0;i<36;i++){u.angle=35+i*.6;const t=performance.now();a.scene.arcFx.predictionGuide(c,e,u,'A15',.7,true);times.push(performance.now()-t);}times.sort((a,b)=>a-b);return{p50:times[18],p95:times[34],units:e.b.units.length};}''')
    check(shell+': full training seven-star aiming fits the frame budget',cost['p95']<16.7,cost)

with sync_playwright() as p:
    browser=launch(p);page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)));page.goto((ROOT/'HONRO.html').as_uri());page.wait_for_function('window.HonroApp');suite(page,'Game')
    page.set_viewport_size({'width':430,'height':850});page.evaluate("{const {a}=aimSetup('M01',45,.25);a.charging=true;a.power=.8;aimPaint();}");page.screenshot(path=str(OUT/'mobile-mage.png'));check('Mobile charge direction remains visible',len(page.evaluate('aimPaint()'))==1);page.close()
    editor=browser.new_page(viewport={'width':1440,'height':900});editor.on('pageerror',lambda e:errors.append(str(e)));editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI');editor.click('[data-tab=play]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');suite(editor.frames[1],'Workshop');browser.close()
check('No uncaught aim-guide browser errors',not errors,errors)
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
