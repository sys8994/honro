"""Approved v08 integration captures. Actual debug UI entry; fixed inspection cameras, no combat completion."""
import json,sys,subprocess,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/mukjong-v08-integration-20261023';OUT.mkdir(parents=True,exist_ok=True)
with serve_game()as base,sync_playwright()as pw:
 b=launch(pw);p=b.new_page(viewport={'width':1440,'height':1100});errors=[];failures=[];rows=[]
 p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:failures.append({'url':r.url,'status':r.status})if r.status>=400 else None)
 p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp',timeout=90000)
 def skip():
  for _ in range(30):
   p.wait_for_timeout(100)
   if not p.evaluate('!!HonroApp.dialogue'):break
   x=p.locator('[data-action=dialogue-skip]');y=p.locator('[data-action=dialogue-next]')
   if x.count():x.click()
   elif y.count():y.click()
 p.locator('[data-action=settings]').click();p.locator('[data-action=settings-page][data-id=records]').click();p.locator('[data-action=settings-page][data-id=debug]').click();p.locator('#debug-mode-setting').click();skip()
 p.locator('[data-action=journey-book]').click();p.locator('[data-action=journey-act][data-id="2"]').click();p.locator('[data-action=journey-select][data-id="18"]').click();p.wait_for_timeout(250);p.locator('[data-action=journey-travel][data-id="18"]').click();p.wait_for_function('HonroApp.screen==="rest"&&HonroApp.debugRestStage===18');skip();p.wait_for_timeout(250);p.locator('[data-action=journey-enter][data-id="18"]').click();p.wait_for_function('HonroApp.engine?.b.honroStage===18&&HonroApp.screen==="battle"',timeout=90000);skip();p.wait_for_function('HonroAuthoredFarArt.ready(18)',timeout=90000)
 p.wait_for_timeout(1400);p.evaluate('HonroApp.frame=()=>{}');p.wait_for_timeout(60)
 original=p.evaluate('JSON.stringify(HonroApp.engine.b)')
 def capture(name,x,y,z):
  row=p.evaluate('''v=>{const a=HonroApp,s=a.scene;a.close();Object.assign(s,{manual:true,x:v.x,y:v.y,scale:v.z,goalFocus:null,cinematic:null,storyTween:null});s.render(a.engine,0,'',.6,false,0);const l=a.engine.b.honroLandmarks.find(l=>l.id==='sb-bell-body');return{camera:[s.x,s.y,s.scale],stage:a.engine.b.honroStage,round:a.engine.b.round,bell:{x:l.x,y:l.y,revision:l.asset.params.approvedArtRevision,nodes:l.asset.params.nodeCount},descent:structuredClone(HonroStage18Bell.memory(a.engine.b))}}''',{'x':x,'y':y,'z':z})
  p.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=90);row['file']=name+'.jpg';rows.append(row);assert p.evaluate('JSON.stringify(HonroApp.engine.b)')==original
 capture('stage18-full',7200,4500,.13);capture('stage18-near',7200,4500,.19)
 # Mechanical compiler parity with the exact SVG, not an art redesign/review.
 parity=p.evaluate('''async()=>{const a=HONRO_PROJECT.library.find(a=>a.id==='stage18:bell-hollow-body'),image=new Image();image.src=URL.createObjectURL(new Blob([a.vector.source],{type:'image/svg+xml'}));await image.decode();const make=()=>{const c=document.createElement('canvas');c.width=600;c.height=900;return c;},x=make(),y=make(),c=y.getContext('2d');x.getContext('2d').drawImage(image,0,0,600,900);c.setTransform(.5/2.7,0,0,.5/2.7,300,810);HonroVectorArt.draw(c,a,{x:0,y:0,scale:1});const q=x.getContext('2d').getImageData(0,0,600,900).data,r=c.getImageData(0,0,600,900).data;let sum=0,n=0,max=0;for(let i=0;i<q.length;i++){const d=Math.abs(q[i]-r[i]);sum+=d;if(d)n++;max=Math.max(max,d);}URL.revokeObjectURL(image.src);return{meanChannelDifference:sum/q.length,changedChannels:n,totalChannels:q.length,maxChannelDifference:max};}''');assert parity['meanChannelDifference']<.5,parity
 # Existing saved art object is resolved at draw time; snapshot untouched.
 old=json.loads(subprocess.check_output(['git','show','4487dbac:shared/data/campaign.json'],cwd=ROOT));legacy=next(a for a in old['library']if a['id']=='stage18:bell-hollow-body')
 resolved=p.evaluate('''legacy=>{const old=JSON.stringify(legacy),q=HonroStage18BellArt.approvedBody(legacy);return{revision:q.params.approvedArtRevision,legacyUnchanged:JSON.stringify(legacy)===old,apertureBypassed:HonroStage18BellArt.bellPaint(q,HonroApp.engine.b)===null};}''',legacy);assert resolved=={'revision':8,'legacyUnchanged':True,'apertureBypassed':True}
 # Stage19 shares the same production factory and settled anchor. No completion claim.
 p.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(19);HonroApp.launch(19);}''');p.wait_for_function('HonroApp.engine?.b.honroStage===19');skip();p.wait_for_function('HonroAuthoredFarArt.ready(19)',timeout=90000);p.wait_for_timeout(1200);p.evaluate('HonroStory.tick(HonroApp,performance.now())');original=p.evaluate('JSON.stringify(HonroApp.engine.b)');capture('stage19-full',7200,4700,.13)
 assert not errors,errors;assert not failures,failures
 report={'sourceHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'runtimeHashes':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest()for f in['shared/runtime/stage18-bell-art.js','shared/map/vector-art.js','shared/assets/environment/stage18-hollow-bell.svg']},'entry':json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],'rows':rows,'svgNativeParity':parity,'oldSaveVisualResolution':resolved,'errors':errors,'httpFailures':failures,'scope':'Actual debug UI enters18, explicitly fixed production Scene cameras;19 factory entry; battle frozen for captures and state exact before/after. No normal victory or physical device claim.'};(OUT/'capture.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False));b.close()
