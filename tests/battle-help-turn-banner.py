"""Focused CSS regression with synthetic stage/turn fixtures, not combat proof."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
from stage21_source_preview import install_source_preview,source_preview_metadata
out=ROOT/'_local/reports/stage21-polish/help-banner';out.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw)
 for stage in [1,7,21]:
  for w,h in [(360,800),(1280,800)]:
   page=browser.new_page(viewport={'width':w,'height':h});install_source_preview(page);page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp')
   page.evaluate('''id=>{const a=HonroApp;a.profile=HONRO_TOOLS.fresh();for(let i=1;i<=30;i++)a.profile.cleared[i]={rounds:5};a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=a.profile.recruited.slice();a.launch(id);}''',stage)
   page.wait_for_function('id=>HonroApp.engine?.b.honroStage===id',arg=stage)
   page.evaluate('''()=>{const a=HonroApp;a.frame=()=>{};a.dialogue=null;document.getElementById("dialogue-root")?.replaceChildren();a.close();HonroStory.turn(a,true);}''')
   assert page.locator('#turn-banner').is_visible()
   page.locator('#objective-text').click()
   assert page.locator('.battle-help-dialog').is_visible()
   assert page.locator('#turn-banner').evaluate('(e)=>getComputedStyle(e).visibility')=='hidden'
   baseline=page.add_style_tag(content='body:has(#modal.open .battle-help-dialog) #turn-banner{visibility:visible}')
   assert page.locator('#turn-banner').is_visible()
   baseline.evaluate('(e)=>e.remove()')
   page.screenshot(path=str(out/f'stage-{stage}-{w}.png'))
   page.locator('button.close[data-action="close"]').click()
   assert page.locator('#turn-banner').is_visible()
   page.evaluate('HonroStory.tick(HonroApp,HonroApp.turnNotice.until+1)')
   assert page.locator('#turn-banner').is_hidden()
   checks.append({'stage':stage,'width':w,'helpHidesBanner':True,'closeRestoresLiveBanner':True,'expiredBannerHidden':True});page.close()
 browser.close()
assert not errors,errors
(out/'result.json').write_text(json.dumps({'scope':__doc__,'sourcePreview':source_preview_metadata(),'checks':checks,'errors':errors},ensure_ascii=False,indent=2))
print('PASS battle help banner regression',len(checks))
