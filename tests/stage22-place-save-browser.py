"""Actual old/new HTML Continue: isolated prepared profile, no user save."""
import ast,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
BASE=story_base_url();rows=[];errors=[]
m=ast.parse((ROOT/'tests/evidence-quests-browser.py').read_text());SETUP=next(ast.literal_eval(n.value)for n in m.body if isinstance(n,ast.Assign)and any(isinstance(t,ast.Name)and t.id=='SETUP'for t in n.targets))
STATE='JSON.stringify({terrain:HonroApp.engine.b.terrain,world:HonroApp.engine.b.honroWorldTerrain,elements:HonroApp.engine.b.honroElements,map:HonroApp.engine.b.honroMap,goals:HonroApp.engine.b.honroState.act3})'
with sync_playwright()as p:
 browser=launch(p)
 for mobile in [False,True]:
  for version in ['old','new']:
   ctx=browser.new_context(viewport={'width':390,'height':844}if mobile else{'width':1440,'height':900},is_mobile=mobile,has_touch=mobile);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+('/_local/reports/stage22-before.html'if version=='old'else'/HONRO.html'));page.wait_for_function('window.HonroApp');page.evaluate(SETUP,22)
   page.evaluate('()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);a.profile.honroBattle=structuredClone(a.engine.b);a.persist();}');before=page.evaluate(STATE);page.goto(BASE+'/HONRO.html');page.wait_for_function('window.HonroApp');page.locator('[data-action="continue"]').click();page.wait_for_function('HonroApp.engine');assert page.evaluate(STATE)==before
   rows.append({'device':'mobile'if mobile else'desktop','source':version,'continueExact':True});ctx.close()
 browser.close()
assert not errors,errors
(ROOT/'review/stage22/browser/save.json').write_text(json.dumps({'scope':__doc__,'rows':rows},indent=2));print('PASS',rows)
