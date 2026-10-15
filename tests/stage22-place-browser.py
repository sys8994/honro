"""Actual Game viewport review, isolated fixture profile, camera-only changes.
Not a normal-resource combat completion; enemies and battle rules remain live.
"""
import ast,json,subprocess
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
OUT=ROOT/'review/stage22/browser';OUT.mkdir(parents=True,exist_ok=True)
before=ROOT/'_local/reports/stage22-before.html';before.parent.mkdir(parents=True,exist_ok=True);before.write_bytes(subprocess.check_output(['git','show','d7c1f8457dd33decda5481c7c3b57d8505f6f157:HONRO.html'],cwd=ROOT))
m=ast.parse((ROOT/'tests/evidence-quests-browser.py').read_text());SETUP=next(ast.literal_eval(n.value)for n in m.body if isinstance(n,ast.Assign)and any(isinstance(t,ast.Name)and t.id=='SETUP'for t in n.targets))
BASE=story_base_url();rows=[];errors=[]
with sync_playwright()as p:
 browser=launch(p)
 for mobile in [False,True]:
  tag='mobile'if mobile else'desktop'
  for version in ['before','after']:
   ctx=browser.new_context(viewport={'width':390,'height':844}if mobile else{'width':1440,'height':900},is_mobile=mobile,has_touch=mobile);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+('/_local/reports/stage22-before.html'if version=='before'else'/HONRO.html'));page.wait_for_function('window.HonroApp');page.evaluate(SETUP,22)
   for label,x,y,z in [('entry',1270,5070,.57),('west-court',920,2370,.48 if mobile else .55),('comparison',2420,1140,.48 if mobile else .65)]:
    page.evaluate('''q=>{const a=HonroApp;Object.assign(a.scene,{x:q[0],y:q[1],scale:q[2],manual:true,goalFocus:null,focusUntil:0,focusId:null,storyTween:null});a.turnNotice=null;}''',[x,y,z]);page.wait_for_timeout(180);name=f'{version}-{tag}-{label}.png';page.screenshot(path=str(OUT/name));rows.append({'file':name,'device':tag,'camera':[x,y,z],'version':version,'actualCamera':page.evaluate('({x:HonroApp.scene.x,y:HonroApp.scene.y,z:HonroApp.scene.scale,manual:HonroApp.scene.manual})'),'enemies':page.evaluate('HonroApp.engine.b.units.filter(u=>u.side===1&&!u.dead).length')})
   ctx.close()
 browser.close()
assert not errors,errors
(OUT/'report.json').write_text(json.dumps({'scope':__doc__,'rows':rows,'errors':errors},ensure_ascii=False,indent=2));print('PASS actual browser desktop/mobile camera captures',len(rows))
