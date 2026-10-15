import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
BASE=story_base_url()
OUT=ROOT/'_local/reports/sodan-radial';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=launch(p)
 for shell in ['HONRO.html','HONRO_WORKSHOP.html']:
  context=browser.new_context(viewport={'width':1280,'height':800});page=context.new_page();page.goto(BASE+'/'+shell);page.wait_for_function('window.HonroScene && window.HONRO_CORE')
  result=page.evaluate('''()=>{if(window.HonroApp)HonroApp.frame=()=>{};const C=HONRO_CORE,cv=document.createElement('canvas');cv.width=1280;cv.height=800;document.body.replaceChildren(cv);const b=C.createBattle(1,C.defaults(),'practice',{party:['occultist'],wind:0}),u=b.units[0];b.units=[u];Object.assign(u,{x:600,y:800,ranks:{O16:8},loadout:['O16'],focus:1000,maxFocus:1000});b.terrain=[{id:'floor',x:0,y:800,w:b.width,h:600,mat:'rock',hp:99999,maxHp:99999}];b.waters=[];const s=new HonroScene(cv),e=new C.Engine(b,ev=>s.event(ev));Object.assign(s,{x:800,y:650,scale:1,manual:true});e.fire('O16',35,.5);const root=b.projectiles[0];e.impact(root,{x:1100,y:720,t:1,n:{x:0,y:-1}});window.q={b,e,s};return b.projectiles.map(p=>({id:p.id,delay:p.curve.delay,angle:Math.atan2(p.curve.spread.y-p.curve.start.y,p.curve.spread.x-p.curve.start.x)}));}''')
  for i in range(8):
   page.evaluate('''()=>{for(let i=0;i<12;i++){for(const p of [...q.b.projectiles])if(q.b.projectiles.includes(p))q.e.stepProjectile(p,1/120);q.s.time+=1/120;}q.s.render(q.e,0,'',.5,false,0)}''');page.screenshot(path=str(OUT/f'{shell}-{i}.png'))
  (OUT/f'{shell}.json').write_text(json.dumps(result,indent=2));context.close()
 browser.close()
print('PASS production Game/Workshop radial sequence captures in isolated browser contexts')
