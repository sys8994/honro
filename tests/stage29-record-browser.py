"""Independent browser contexts; actual Game/Workshop rendering, camera fixtures only. Not normal clear."""
import ast,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
m=ast.parse((ROOT/'tests/evidence-quests-browser.py').read_text());SETUP=next(ast.literal_eval(n.value) for n in m.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in n.targets));out=ROOT/'review/stage29';base=story_base_url();rows=[];errors=[]
with sync_playwright() as p:
 b=launch(p)
 for host,mobile in [('HONRO.html',False),('HONRO.html',True),('HONRO_WORKSHOP.html',False)]:
  c=b.new_context(viewport={'width':844,'height':390} if mobile else {'width':1440,'height':900},is_mobile=mobile,has_touch=mobile);page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/'+host);owner=page
  if 'WORKSHOP' in host:
   page.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene');page.click('[data-tab="play"]');page.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');page=owner.frames[1]
  else: page.wait_for_function('window.HonroApp')
  page.evaluate(SETUP,29)
  for label,x,y,z in [('entry',850,2550,.65),('record-room',2950,2070,.7),('route-choice',4350,2310,.56)]:
   page.evaluate('''v=>{const a=HonroApp;Object.assign(a.scene,{x:v[0],y:v[1],scale:v[2],manual:true,goalFocus:null,focusUntil:0});}''',[x,y,z]);page.wait_for_timeout(120);name=('workshop' if 'WORKSHOP' in host else 'mobile' if mobile else 'game')+'-'+label+'.png';owner.screenshot(path=str(out/name));rows.append({'file':name,'host':host,'camera':[x,y,z],'enemies':page.evaluate('HonroApp.engine.alive(1).length')})
  c.close()
 b.close()
(out/'browser.json').write_text(json.dumps({'passed':not errors,'errors':errors,'rows':rows,'scope':__doc__},ensure_ascii=False,indent=2));assert not errors,errors;print('PASS',len(rows),'actual browser captures')
