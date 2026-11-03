"""Natural R6 save from exact prior full play. Actual UI/touch, no actor writes."""
import json,gzip,time,traceback,os,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('_local/reports/stage6-art-preview/checkpoint-review');OUT.mkdir(parents=True,exist_ok=True)
ROOT=Path('_local/stage6-prior');saved=json.loads(gzip.decompress((ROOT/'integrated-play/natural-lookout-save.json.gz').read_bytes()))
R={'source':os.environ.get('GITHUB_SHA'),'checkpointSource':'4fa4a106d4e42215f0f67a799385e07627fb2c66','checkpointArtifact':13269315735,'scope':'Natural R6 checkpoint; actual Chromium UI and touch emulation, not physical-device performance','views':[],'errors':[]}
STATE="""()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,s=a.scene,c=s.canvas.getBoundingClientRect(),screen=(x,y)=>({x:c.width/2+(x-s.x)*s.scale,y:c.height/2+(y-s.y)*s.scale}),ground=HonroWorld.top(b,u.x,u.y,'lower-road'),landing=screen(u.x,ground);return{round:b.round,phase:b.phase,can:a.canInput(),revision:b.honroCampaignMapRevision,active:{id:u.id,x:u.x,y:u.y,hp:u.hp,move:u.moveLeft,ground:e.grounded(u),support:e.contactSurface(u.x,u.y-4,u.y+5)?.t.id,canDrop:e.canDrop(u),screen:screen(u.x,u.y)},camera:{x:s.x,y:s.y,scale:s.scale,manual:s.manual},landing:{y:ground,screen:landing,visible:landing.x>=0&&landing.x<=c.width&&landing.y>=0&&landing.y<=c.height},canvas:{width:c.width,height:c.height},shots:b.shot,projectiles:b.projectiles.length,documentWidth:document.documentElement.scrollWidth,bodyPoseValid:HONRO_CORE.validTerrainContactPose(b.terrain,u)};}"""
def snap(p,label):
 s=p.evaluate(STATE);p.screenshot(path=str(OUT/(label+'.png')));return s
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for label,w,h,mobile in [('desktop',1440,900,False),('portrait',390,844,True),('landscape',844,390,True)]:
   ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1);page=ctx.new_page();page.on('pageerror',lambda e:R['errors'].append(str(e)))
   page.goto('http://127.0.0.1:8870/HONRO.html',wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000);page.evaluate('(p)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',saved);page.reload(wait_until='domcontentloaded');page.locator('.title-actions button[data-action="continue"]:visible').first.click();page.wait_for_function('HonroApp.canInput()&&(!document.getElementById("turn-banner")||document.getElementById("turn-banner").hidden)',timeout=60000)
   row={'label':label,'before':snap(page,label+'-lookout')};R['views'].append(row);row['terrainSame']=page.evaluate('(t)=>JSON.stringify(HonroApp.engine.b.terrain)===JSON.stringify(t)',saved['honroBattle']['terrain']);assert row['before']['active']['support']=='lower-lookout' and row['before']['active']['canDrop'],row
   if mobile:page.locator('#drop').tap()
   else:page.locator('#drop').click()
   page.wait_for_function('()=>{const e=HonroApp.engine,u=e.active;return e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id==="lower-road"}',timeout=30000);page.wait_for_timeout(350);row['landed']=snap(page,label+'-landed');row['dropHpLoss']=row['before']['active']['hp']-row['landed']['active']['hp']
   if mobile:
    cdp=ctx.new_cdp_session(page);box=page.locator('#joystick').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x-35,'y':y}]});page.wait_for_timeout(300);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
   else:page.keyboard.down('ArrowLeft');page.wait_for_timeout(300);page.keyboard.up('ArrowLeft')
   page.wait_for_timeout(250);row['moved']=snap(page,label+'-moved')
   if mobile:
    box=page.locator('#fire').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2;cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});page.wait_for_timeout(450);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
   else:page.keyboard.down('Space');page.wait_for_timeout(450);page.keyboard.up('Space')
   page.wait_for_timeout(80);row['fired']=snap(page,label+'-fired');row['actualShot']=row['fired']['shots']>row['moved']['shots'];row['movedLeft']=row['moved']['active']['x']<row['landed']['active']['x']
   assert row['dropHpLoss']==0 and row['movedLeft'] and row['actualShot'] and row['terrainSame'],row
   assert all(row[k]['active']['ground'] and row[k]['bodyPoseValid'] for k in ['before','landed','moved']),row
   ctx.close()
  browser.close()
except Exception:R['error']=traceback.format_exc()
finally:(OUT/'result.json').write_text(json.dumps(R,ensure_ascii=False,indent=2));print(json.dumps(R,ensure_ascii=False),flush=True)
if R.get('error') or R['errors']:raise SystemExit(1)
