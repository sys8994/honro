"""Intermediate natural-route diagnostics on exact gated A1, not release acceptance."""
import base64,json,os,pathlib
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/monster-natural';F=ROOT/'tests/fixtures/monster-natural'
BASE=os.environ.get('HONRO_MONSTER_BASE_URL','http://127.0.0.1:8871')
manifest=json.loads((OUT/'controller-manifest.json').read_text());request=json.loads((ROOT/'tools/monster-a1-qa/request.json').read_text())
rows=[];branch_errors=[]
with sync_playwright() as pw:
 browser=launch(pw)
 for stage in [5,8]:
  dest=OUT/f'stage{stage}';dest.mkdir(exist_ok=True);context=browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
  # Deterministic manual App.frame replaces scheduling only, not frame/render logic.
  context.add_init_script('(()=>{window.requestAnimationFrame=()=>0;window.cancelAnimationFrame=()=>{};})()')
  p=context.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.set_default_timeout(60000)
  def evidence(_source,name,data):
   path=dest/pathlib.Path(name).name;path.write_text(data)
   if path.name.startswith('round-'):p.screenshot(path=str(path.with_suffix('.png')))
  p.expose_binding('qaEvidence',evidence)
  failure=None
  try:
   p.goto(BASE+'/HONRO.html');p.wait_for_function('!!window.HonroApp',timeout=45000)
   p.add_script_tag(path=str(OUT/'controller.js'))
   entry=json.loads((F/f'stage{stage}-entry.json').read_text())
   if stage==5:entry['commands']=json.loads((F/'stage5-ui-commands.json').read_text())['commands']
   meta={**manifest,'stage':stage,'runtimeSha256':request['expected']['runtimeSha256'],'difficulty':'story','seed':1228 if stage==8 else 'production default'}
   if stage==8:p.evaluate('()=>{let state=1228>>>0;Math.random=()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}')
   p.evaluate('async q=>{await qaInstall(q.entry,q.meta);}',{'entry':entry,'meta':meta})
   p.wait_for_function('(stage)=>HonroApp.engine?.b.honroStage===stage',arg=stage)
   p.screenshot(path=str(dest/'entry.png'))
   if p.locator('[data-action="dialogue-next"]').count():p.locator('[data-action="dialogue-next"]').click()
   p.evaluate('async stage=>{await window["qaRun"+stage]();}',stage)
   p.screenshot(path=str(dest/'terminal.png'))
  except Exception as error:
   failure=str(error)
   try:
    p.screenshot(path=str(dest/'failure.png'));(dest/'failure-state.json').write_text(json.dumps(p.evaluate('()=>({screen:HonroApp.screen,battle:HonroApp.engine?.b,events:window.qa?.events,lastError:HonroApp.lastError,dialogue:HonroApp.dialogue,modal:HonroApp.modal.classList.contains("open")})'),ensure_ascii=False))
   except Exception as nested:failure+='; capture: '+str(nested)
  result_path=dest/'natural-result.json'
  if result_path.exists():
   result=json.loads(result_path.read_text())
   for capture in result['captures']:(dest/(capture['label']+'.png')).write_bytes(base64.b64decode(capture['canvas'].split(',',1)[1]))
   for checkpoint in result['checkpoints']:(dest/(checkpoint['label']+'.json')).write_text(json.dumps(checkpoint['profile'],ensure_ascii=False))
  rows.append({'stage':stage,'failure':failure,'pageErrors':errors,'result':json.loads(result_path.read_text())['result'] if result_path.exists() else None})
  context.close()
  # Reuse the genuine production export, with normal file import and pointer Continue.
  # No checkpoint means the pilot was not naturally offered: report that gap, never invent one.
  if result_path.exists() and result['checkpoints']:
   checkpoint=result['checkpoints'][0];savepath=dest/(checkpoint['label']+'.json')
   for mobile,kind in [(False,'accept'),(False,'dodge'),(False,'interrupt'),(True,'dodge')]:
    branch=f"{'mobile' if mobile else 'desktop'}-{kind}"
    ctx=browser.new_context(viewport={'width':390,'height':844} if mobile else {'width':1440,'height':900},is_mobile=mobile,has_touch=mobile)
    ctx.add_init_script('(()=>{window.requestAnimationFrame=()=>0;window.cancelAnimationFrame=()=>{};})()');bp=ctx.new_page()
    try:
     bp.goto(BASE+'/HONRO.html');bp.wait_for_function('!!window.HonroApp');bp.add_script_tag(path=str(OUT/'controller.js'))
     bp.evaluate('q=>{qaAttach(q.entry,q.meta);}',{'entry':entry,'meta':meta})
     bp.locator('#file-import').set_input_files(str(savepath));bp.wait_for_function('HonroApp.screen==="title"')
     button=bp.locator('[data-action="continue"]').first
     button.tap() if mobile else button.click()
     bp.wait_for_function('!!HonroApp.engine')
     exact=bp.evaluate('(expected)=>canonical(HonroApp.engine.b)===canonical(expected)',checkpoint['profile']['honroBattle']);assert exact,'Natural checkpoint import changed battle'
     bp.evaluate('()=>{const a=HonroApp;a.updateHUD(true);a.renderBattleFrame(a.engine,0,0,!!a.dialogue||!!HonroStory.turnPaused(a,performance.now())||a.modal.classList.contains("open")||!!a.done);}')
     bp.screenshot(path=str(dest/(branch+'-before.png')))
     pause=bp.locator('[data-action="pause"]').first;close=bp.locator('[data-action="close"]').last
     pause.tap() if mobile else pause.click()
     close.tap() if mobile else close.click()
     assert bp.evaluate('(expected)=>canonical(HonroApp.engine.b)===canonical(expected)',checkpoint['profile']['honroBattle']),'Pointer pause consumed natural response'
     response=bp.evaluate('async kind=>{return await qaCounter(kind);}',kind)
     (dest/(branch+'.json')).write_text(json.dumps(response,ensure_ascii=False));bp.screenshot(path=str(dest/(branch+'-after.png')))
    except Exception as error:
     branch_errors.append({'stage':stage,'branch':branch,'error':str(error)});(dest/(branch+'-failure.txt')).write_text(str(error));bp.screenshot(path=str(dest/(branch+'-failure.png')))
    finally:ctx.close()
 browser.close()
(OUT/'summary.json').write_text(json.dumps({'scope':manifest['scope'],'rows':rows,'branchErrors':branch_errors},ensure_ascii=False,indent=2))
assert all(not r['failure'] and not r['pageErrors'] for r in rows) and not branch_errors,(rows,branch_errors)
print(json.dumps(rows,ensure_ascii=False))
