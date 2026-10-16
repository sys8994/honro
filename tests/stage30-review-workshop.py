"""Actual Stage View / iframe start-stop contract; not a full combat playthrough."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
BASE=story_base_url();out=ROOT/'review/stage30';rows=[];errors=[]
with sync_playwright() as p:
 b=launch(p)
 for mobile in [False,True]:
  ctx=b.new_context(viewport={'width':390,'height':844} if mobile else {'width':1440,'height':900},is_mobile=mobile,has_touch=mobile)
  page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/HONRO_WORKSHOP.html');page.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
  page.evaluate('HonroWorkshopAPI.selectStage("stage-30")');saved=page.evaluate('HonroWorkshopAPI.exportProject()')
  stage=page.evaluate('''()=>{const r=HonroWorkshopAPI.getRuntime(),b=r.engine.b;return{stage:b.honroStage,terrain:JSON.stringify(b.terrain),art:b.honroLandmarks.filter(x=>x.id.startsWith('sf-art-')).map(x=>x.id)}}''')
  assert stage['stage']==30 and 'sf-art-landing-frame' in stage['art']
  page.locator('[data-tab="play"]').click();page.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');frame=page.frames[1]
  play=frame.evaluate('''()=>{const a=HonroApp;a.frame=()=>{};const b=a.engine.b;return{stage:b.honroStage,terrain:JSON.stringify(b.terrain),first:b.honroAct3Steps[0],art:b.honroLandmarks.filter(x=>x.id.startsWith('sf-art-')).map(x=>x.id)}}''')
  assert play['stage']==30 and play['terrain']==stage['terrain'] and play['art']==stage['art']
  assert play['first']['kind']=='reach' and play['first']['radius']==260
  page.locator('#stopPlay').click()
  assert page.evaluate('HonroWorkshopAPI.exportProject()')==saved
  rows.append({'mobile':mobile,'stageViewAndPlaytestSameTerrainAndArt':True,'stopPreservesProject':True,'firstGoal':play['first']});ctx.close()
 b.close()
(out/'workshop-results.json').write_text(json.dumps({'rows':rows,'errors':errors,'limits':['Actual StageView and Playtest iframe launch/stop only; not combat completion.']},ensure_ascii=False,indent=2));assert not errors,errors
print('PASS desktop/mobile actual Workshop Stage View and Playtest same terrain/art, stop preserves project')
