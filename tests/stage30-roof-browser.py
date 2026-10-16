"""Production browser roof locomotion fixture; no normal combat completion claim."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
out=ROOT/'review/stage30/roof';out.mkdir(parents=True,exist_ok=True);base=story_base_url();rows=[]
with sync_playwright() as p:
 browser=launch(p)
 for mobile in [False,True]:
  ctx=browser.new_context(viewport={'width':390,'height':844} if mobile else {'width':1440,'height':900},is_mobile=mobile,has_touch=mobile);page=ctx.new_page();page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp')
  page.evaluate('''()=>{HonroApp.frame=()=>{};const cv=document.createElement('canvas');cv.width=innerWidth;cv.height=innerHeight;cv.style.cssText='width:100vw;height:100vh;display:block';document.body.replaceChildren(cv);const b=HonroMaps.createBattle(HONRO_PROJECT.stages[29],HONRO_PROJECT),u=b.units.find(u=>u.cls==='archer'&&u.side===0);Object.assign(u,{x:5320,y:5470,vx:0,vy:0});b.active=u.id;const e=new HONRO_CORE.Engine(b,()=>{},true),s=new HonroScene(cv);Object.assign(s,{x:5280,y:5320,scale:.65,manual:true});window.roof={b,u,e,s};s.render(e,0,'',.6,false,0)}''')
  prefix='mobile' if mobile else 'desktop'
  for phase in ['under','rising','landed','drop-return']:
   result=page.evaluate('''phase=>{const{b,u,e,s}=roof;if(phase==='rising'){e.jump(u);for(let i=0;i<30;i++)e.integrateBody(u,1/120);}if(phase==='landed'){for(let i=0;i<220;i++){e.integrateBody(u,1/120);if(e.grounded(u))break;}}if(phase==='drop-return'){if(!e.drop(u))throw Error('Down jump denied');for(let i=0;i<300;i++){e.integrateBody(u,1/120);if(i>40&&e.grounded(u))break;}}s.render(e,0,'',.6,false,0);return{x:u.x,y:u.y,support:e.contactSurface(u.x,u.y-5,u.y+5)?.t?.id,jumping:u.jumping}}''',phase)
   page.wait_for_timeout(80);page.evaluate("roof.s.render(roof.e,0,'',.6,false,0)");page.screenshot(path=str(out/f'{prefix}-{phase}.png'));rows.append({'mobile':mobile,'phase':phase,**result})
   if phase=='landed':assert result['support']=='sf-quay-west-loft',result
   if phase=='drop-return':assert result['support']=='sf-ferry-court',result
  # Real old save from the preceding approved-layout test keeps its old roof.
  old=json.loads((ROOT/'_local/reports/stage30-review-high/post-hold-continue.json').read_text())['profile']
  page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp')
  retained=page.evaluate('''async p=>{const a=HonroApp,old=JSON.stringify(p.honroBattle.terrain);a.close();a.stopBattle();a.profile=p;a.normalProfile=p;await a.continue();a.frame=()=>{};return{exact:JSON.stringify(a.engine.b.terrain)===old,roofY:a.engine.b.terrain.find(t=>t.id==='sf-quay-west-loft').y}}''',old)
  assert retained['exact'] and retained['roofY']==5220,retained
  rows.append({'mobile':mobile,'oldSave':retained});ctx.close()
 browser.close()
(out/'browser.json').write_text(json.dumps({'rows':rows,'limits':['Initial actor fixture at the actual landing floor, original enemies retained. Ordinary jump/integrateBody/drop only after setup.','These are actual browser renderer frames, not normal combat completion.','Old-save check uses untouched native normal-run saved battle from before the roof-height correction.']},ensure_ascii=False,indent=2));print('PASS PC/mobile actual jump-through, roof landing, down-jump and old terrain Continue')
