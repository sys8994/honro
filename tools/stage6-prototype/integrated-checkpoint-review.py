"""Natural R6 save from exact prior full play. Actual UI/touch, no actor writes."""
import json,gzip,time,traceback,os,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('_local/reports/stage6-art-preview/checkpoint-review');OUT.mkdir(parents=True,exist_ok=True)
ROOT=Path('_local/stage6-prior');saved=json.loads(gzip.decompress((ROOT/'integrated-play/natural-lookout-save.json.gz').read_bytes()))
R={'source':os.environ.get('GITHUB_SHA'),'checkpointSource':'4fa4a106d4e42215f0f67a799385e07627fb2c66','checkpointArtifact':13269315735,'scope':'Natural R6 checkpoint; actual Chromium UI and touch emulation, not physical-device performance','views':[],'errors':[]}
STATE="""()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,s=a.scene,c=s.canvas.getBoundingClientRect(),screen=(x,y)=>({x:c.width/2+(x-s.x)*s.scale,y:c.height/2+(y-s.y)*s.scale}),ground=HonroWorld.top(b,u.x,u.y,'lower-road'),landing=screen(u.x,ground);return{round:b.round,phase:b.phase,can:a.canInput(),revision:b.honroCampaignMapRevision,active:{id:u.id,x:u.x,y:u.y,hp:u.hp,angle:u.angle,h:u.h,move:u.moveLeft,ground:e.grounded(u),support:e.contactSurface(u.x,u.y-4,u.y+5)?.t.id,canDrop:e.canDrop(u),screen:screen(u.x,u.y)},camera:{x:s.x,y:s.y,scale:s.scale,manual:s.manual},landing:{y:ground,screen:landing,visible:landing.x>=0&&landing.x<=c.width&&landing.y>=0&&landing.y<=c.height},canvas:{width:c.width,height:c.height},descent:HonroStage6DescentView.snapshot(s),protectedFrame:(()=>{const f=HonroStage6DescentView.snapshot(s)?.follow;if(!f)return null;const a=f.bounds;return{left:c.width/2+(a.left-s.x)*s.scale,right:c.width/2+(a.right-s.x)*s.scale,top:c.height/2+(a.top-s.y)*s.scale,bottom:c.height/2+(a.bottom-s.y)*s.scale,safe:f.safe}})(),shots:b.shot,projectiles:b.projectiles.length,documentWidth:document.documentElement.scrollWidth,bodyPoseValid:HONRO_CORE.validTerrainContactPose(b.terrain,u)};}"""
def snap(p,label):
 s=p.evaluate(STATE);p.screenshot(path=str(OUT/(label+'.png')));return s
def opened(browser,w,h,mobile):
 ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1);page=ctx.new_page();page.on('pageerror',lambda e:R['errors'].append(str(e)))
 page.goto('http://127.0.0.1:8870/HONRO.html',wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000);page.evaluate('(p)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',saved);page.reload(wait_until='domcontentloaded');page.locator('.title-actions button[data-action="continue"]:visible').first.click();page.wait_for_function('HonroApp.canInput()&&(!document.getElementById("turn-banner")||document.getElementById("turn-banner").hidden)',timeout=60000);page.wait_for_timeout(350)
 return ctx,page

def protected(s):
 a=s.get('protectedFrame');return bool(a and a['left']>=a['safe']['left']-3 and a['right']<=a['safe']['right']+3 and a['top']>=a['safe']['top']-3 and a['bottom']<=a['safe']['bottom']+3)

try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for label,w,h,mobile in [('desktop',1440,900,False),('portrait',390,844,True),('landscape',844,390,True)]:
   ctx,page=opened(browser,w,h,mobile)
   row={'label':label,'before':snap(page,label+'-lookout')};R['views'].append(row);row['terrainSame']=page.evaluate('(t)=>JSON.stringify(HonroApp.engine.b.terrain)===JSON.stringify(t)',saved['honroBattle']['terrain']);assert row['before']['active']['support']=='lower-lookout' and row['before']['active']['canDrop'],row
   assert row['before']['descent']['insetVisible'],row
   row['presentationNoMutation']=page.evaluate('''()=>{const a=HonroApp,s=a.scene,read=()=>JSON.stringify({units:a.engine.b.units,terrain:a.engine.b.terrain,profile:a.profile,x:s.x,y:s.y,scale:s.scale}),before=read();HonroStage6DescentView.drawBelow(s,a.engine);return before===read();}''');assert row['presentationNoMutation']
   # Existing user zoom, not a new button or a scripted camera assignment.
   box=page.locator('#battlecanvas').bounding_box();cy=box['y']+box['height']*.45
   if mobile:
    cdp=ctx.new_cdp_session(page);cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':w*.25,'y':cy},{'x':w*.75,'y':cy}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':w*.4,'y':cy},{'x':w*.6,'y':cy}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
   else:page.mouse.move(w*.5,cy);page.mouse.wheel(0,800)
   page.wait_for_timeout(250);row['manual']=snap(page,label+'-manual-existing-zoom');page.wait_for_timeout(600);row['manualLater']=page.evaluate(STATE)
   assert row['manual']['camera']['manual'] and not row['manual']['descent']['insetVisible'],row
   assert all(abs(row['manual']['camera'][k]-row['manualLater']['camera'][k])<.001 for k in ['x','y','scale']),row
   assert row['manual']['active']['angle']==row['before']['active']['angle'],row
   # Fresh natural Continue avoids altering the user's selected manual zoom.
   ctx.close();ctx,page=opened(browser,w,h,mobile);row['beforeDrop']=snap(page,label+'-before-drop')
   if mobile:page.locator('#drop').tap()
   else:page.locator('#drop').click()
   page.wait_for_function('()=>{const e=HonroApp.engine,u=e.active;return e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id==="lower-road"}',timeout=30000);row['landingImmediate']=page.evaluate(STATE);page.wait_for_timeout(200);row['landing200ms']=page.evaluate(STATE);page.wait_for_timeout(650);row['landed']=snap(page,label+'-landed');row['dropHpLoss']=row['before']['active']['hp']-row['landed']['active']['hp']
   if mobile:
    cdp=ctx.new_cdp_session(page);box=page.locator('#joystick').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x-35,'y':y}]});page.wait_for_timeout(300);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
   else:page.keyboard.down('ArrowLeft');page.wait_for_timeout(300);page.keyboard.up('ArrowLeft')
   page.wait_for_timeout(700);row['moved']=snap(page,label+'-moved')
   if mobile:
    box=page.locator('#fire').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2;cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});page.wait_for_timeout(450);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
   else:page.keyboard.down('Space');page.wait_for_timeout(450);page.keyboard.up('Space')
   page.wait_for_timeout(80);row['fired']=snap(page,label+'-fired');row['actualShot']=row['fired']['shots']>row['moved']['shots'];row['movedLeft']=row['moved']['active']['x']<row['landed']['active']['x']
   row['landingProtected']=protected(row['landed']);row['movementProtected']=protected(row['moved']);assert row['landingProtected'] and row['movementProtected'],row
   assert row['dropHpLoss']==0 and row['movedLeft'] and row['actualShot'] and row['terrainSame'],row
   assert all(row[k]['active']['ground'] and row[k]['bodyPoseValid'] for k in ['before','landed','moved']),row
   ctx.close()
  browser.close()
except Exception:R['error']=traceback.format_exc()
finally:(OUT/'result.json').write_text(json.dumps(R,ensure_ascii=False,indent=2));print(json.dumps(R,ensure_ascii=False),flush=True)
if R.get('error') or R['errors']:raise SystemExit(1)
