"""Original App/Scene/Engine controlled chapter fixtures; not a normal campaign playthrough."""
import json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act4-preview/coast-first';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8772/HONRO.html');page.wait_for_function('!!window.HonroApp')
 page.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(30);await HonroCampaignLoader.ensureStage(21);await HonroCampaignLoader.ensureStage(13);HonroApp.frame=()=>{};const ss=await Promise.all(['31-35-36','32-33-34-37','38-39-40'].map(async s=>(await fetch('game/docs/act4/dialogue-seeds-'+s+'-reviewed-final.json')).json()));HONRO_ACT4_PREVIEW_SEEDS={scenes:ss.flatMap(s=>s.scenes),ui:ss.flatMap(s=>s.ui)};window.ownerBefore=JSON.stringify(HonroApp.profile);}''')
 for name in ['review-art','terrain-preview','coast-maps','coast-art','preview-events','coast-events','preview-lifecycle']:page.add_script_tag(url='http://127.0.0.1:8772/tools/act4/'+name+'.js')
 import os,hashlib
 tag=os.environ.get('HONRO_ACT4_CAPTURE','coast-loop2');OUT=ROOT/'_local/reports/act4-preview'/tag;OUT.mkdir(parents=True,exist_ok=True)
 page.evaluate('HonroAct4TerrainPreview.freezeReviewClock=true')
 cameras={32:(4784,1780,.8),33:(3700,1990,.65),34:(3100,3740,.65),37:(7600,2040,.65),38:(3750,2710,.6),39:(4400,2040,.48),40:(3300,1870,.65)}
 rows=[]
 for n,(cx,cy,zoom) in cameras.items():
  page.set_viewport_size({'width':1440,'height':900})
  page.evaluate('n=>HonroAct4TerrainPreview.launch(n)',n)
  page.evaluate("""()=>{const a=HonroApp,e=a.engine;Object.assign(a.scene,{manual:true,editorView:true,skillPreview:true,storyTween:null,cinematic:null,storyFrame:null,goalFocus:null});a.scene.render(e,0,'',.5,false,0);}""")
  page.wait_for_function("HonroAuthoredFarArt.frames(HonroApp.scene,1440,900,HonroApp.engine.b).every(v=>!!v.frame)",timeout=10000)
  for kind in ['wide','play','mobile']:
   w,h=(390,844) if kind=='mobile' else (1440,900);page.set_viewport_size({'width':w,'height':h})
   view={'x':cx,'y':cy,'scale':zoom}
   if kind=='wide':
    cfg=page.evaluate('HonroApp.engine.b');view={'x':cfg['width']/2,'y':(cfg['height']/2 if n==34 else cy+200),'scale':min(.18,1300/cfg['width'])}
   if kind=='mobile':view['scale']=.52
   result=page.evaluate("""v=>{const a=HonroApp,e=a.engine,b=e.b;if(v.kind!=='wide'){for(const [i,u]of b.units.filter(u=>u.side===0).entries()){const x=Math.max(40,Math.min(b.width-50,v.x-200+i*120)),y=HonroMapEngine.surfaceY(b.terrain,x,v.y+200)?.y;const p=HonroTerrain.place(b,u,{x,y,maxDistance:180});if(p)Object.assign(u,p,{vx:0,vy:0});}}Object.assign(a.scene,{x:v.x,y:v.y,scale:v.scale});if(b.honroAct4Design.tide){b.round=2;HonroAct4TerrainPreview.coast.tide(b);b.round=3;HonroAct4TerrainPreview.coast.tide(b);}a.scene.render(e,0,'',.5,false,0);return {units:b.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,grounded:e.grounded(u)})),errors:HonroMaps.validate(a.customMap.project).filter(v=>v.level==='err')};}""",dict(**view,kind=kind))
   page.locator('#battlecanvas').screenshot(path=str(OUT/f'{n}-{kind}.png'));rows.append(dict(chapter=n,kind=kind,camera=view,width=w,height=h,result=result));print(tag,n,kind,flush=True)
 assert not errors,errors
 digest=hashlib.sha256(b''.join((ROOT/'tools/act4'/f).read_bytes() for f in ['coast-art.js','coast-maps.js','coast-events.js','review-art.js'])).hexdigest()
 (OUT/'captures.json').write_text(json.dumps({'scope':'Original Canvas art camera/pose fixtures; no normal encounter completion','sourceSHA256':digest,'rows':rows,'pageErrors':errors},ensure_ascii=False,indent=2));browser.close()
