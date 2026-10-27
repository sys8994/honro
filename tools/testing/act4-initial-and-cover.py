"""Actual unposed initial deployment and separately labelled shot-pose fixtures."""
import json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act4-preview/initial-and-cover';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:8772/HONRO.html');page.wait_for_function('!!window.HonroApp')
 page.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(30);await HonroCampaignLoader.ensureStage(21);HonroApp.frame=()=>{};HonroApp.profile.settings.music=HonroApp.profile.settings.sound=false;window.HONRO_ACT4_PREVIEW_SEEDS=await(await fetch('game/docs/act4/dialogue-seeds-31-35-36-reviewed-final.json')).json();}''')
 for path in ['review-art.js','terrain-preview.js','preview-events.js']:page.add_script_tag(url='http://127.0.0.1:8772/'+{'review-art':'shared/runtime/act4-art.js','terrain-preview':'shared/runtime/act4-maps.js','coast-maps':'shared/runtime/act4-coast-maps.js','coast-art':'shared/runtime/act4-coast-art.js','preview-events':'shared/runtime/act4-events.js','coast-events':'shared/runtime/act4-coast-events.js'}.get(path.removesuffix('.js'),'tools/act4/'+path))
 def ev(s):return page.evaluate(s)
 def finish():
  for i in range(8):
   if not ev('!!HonroApp.dialogue'):return
   page.wait_for_timeout(100);ev('HonroStory.next(HonroApp)')
 rows=[]
 for w,h in [(1440,900),(390,844)]:
  page.set_viewport_size({'width':w,'height':h})
  for n in [31,35,36]:
   page.evaluate('n=>HonroAct4TerrainPreview.launch(n)',n)
   ev('''()=>{const a=HonroApp;for(let i=0;i<50;i++){HonroAct4TerrainPreview.observe(a,.1);a.scene.render(a.engine,0,'',.6,false,0);} }''');finish();page.wait_for_timeout(150)
   result=page.evaluate('''v=>{const a=HonroApp,b=a.engine.b;const initial=b.units.filter(u=>u.side===0).map(u=>[u.id,u.x,u.y]);for(let i=0;i<300;i++)a.engine.tick(HONRO_CORE.STEP);Object.assign(a.scene,{manual:true,x:470,y:a.engine.active.y-40,scale:v.w<600?.62:.80,storyTween:null,cinematic:null,goalFocus:null,storyFrame:null,editorView:true,skillPreview:true});a.scene.render(a.engine,0,'',.6,false,0);return{chapter:v.n,viewport:[v.w,v.h],controlledPose:false,initial,after:b.units.filter(u=>u.side===0).map(u=>[u.id,u.x,u.y]),nearestEnemyGap:Math.min(...b.units.filter(u=>u.side===1).flatMap(v=>b.units.filter(u=>u.side===0).map(u=>Math.abs(u.x-v.x)))),tour:b.honroAct4PreviewState.arrivalTour,grounded:b.units.filter(u=>u.side===0).every(u=>a.engine.grounded(u))};}''',{'n':n,'w':w,'h':h})
   assert result['initial']==result['after'],result;assert result['grounded'];assert result['nearestEnemyGap']>=590,result
   page.locator('#battlecanvas').screenshot(path=str(OUT/(str(n)+'-initial-'+str(w)+'.png')));rows.append(result)
 page.set_viewport_size({'width':1440,'height':900})
 for label,x in [('blocked',3040),('open',3350)]:
  ev('HonroAct4TerrainPreview.launch(35)');page.wait_for_timeout(120);finish()
  result=page.evaluate('''x=>{const a=HonroApp,e=a.engine,u=e.b.units.find(u=>u.id==='archer');e.b.active=u.id;const desired=HonroMapEngine.surfaceY(e.b.terrain,x,1900)?.y??1900,spot=HonroTerrain.place(e.b,u,{x,y:desired,maxDistance:32});if(!spot)throw Error('illegal pose '+x);Object.assign(u,spot,{vx:0,vy:0,angle:5,acted:false,critChance:0});a.selected='A01';a.power=.2;a.turnNotice=null;Object.assign(a.scene,{manual:true,x:3220,y:1760,scale:.82,storyTween:null,cinematic:null,goalFocus:null,storyFrame:null,editorView:true,skillPreview:true});a.scene.render(e,0,'A01',.2,false,0);const target=e.b.units.find(u=>u.id==='a4-35-g1-1');window.shotTarget=target;window.shotHP=target.hp;window.shotImpacts=[];const impact=e.impact.bind(e);e.impact=(p,h)=>{shotImpacts.push(h.terrain?.honroElementId||h.terrain?.id||h.unit?.id);return impact(p,h);};return{controlledPose:true,x:u.x,y:u.y,grounded:e.grounded(u),bodyClear:e.b.terrain.filter(t=>t.honroElementCollision).every(t=>!HONRO_CORE.terrainRectIntersects(t,u.x-u.r,u.y-u.h,u.r*2,u.h-2,.12)),prediction:e.predict(u,HONRO_CORE.SKILLS.A01,5,.2),targetHP:target.hp};}''',x)
  assert result['grounded'] and result['bodyClear'],result
  page.locator('#battlecanvas').screenshot(path=str(OUT/(label+'-aim.png')))
  outcome=ev('''()=>{const a=HonroApp,e=a.engine;if(!e.fire('A01',5,.2))throw Error('cast refused');for(let i=0;i<2000&&e.b.projectiles.length;i++)for(const p of [...e.b.projectiles])if(e.b.projectiles.includes(p))e.stepProjectile(p,HONRO_CORE.STEP);a.scene.render(e,0,'',.2,false,0);return{impacts:shotImpacts,damage:shotHP-shotTarget.hp};}''')
  if label=='blocked':assert outcome['damage']==0 and any('thick-bamboo' in str(i) for i in outcome['impacts']),outcome
  else:assert outcome['damage']>0,outcome
  page.locator('#battlecanvas').screenshot(path=str(OUT/(label+'-impact.png')));rows.append({'label':label,**result,**outcome})
 assert not errors,errors
 (OUT/'results.json').write_text(json.dumps({'scope':__doc__,'rows':rows,'pageErrors':errors},ensure_ascii=False,indent=2))
 print('PASS unposed starts/300tick stable/nearest gaps; grounded body-clear aim and real blocked/open shots; pageerror0')
 browser.close()
