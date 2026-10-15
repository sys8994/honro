"""Actual Game and Workshop iframe HUD from observed normal-input snapshots.
No actor edits. Restored snapshots are render evidence, not browser playthrough.
"""
import json,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
out=ROOT/'_local/reports/stage21-eupseong/live-browser';out.mkdir(parents=True,exist_ok=True)
trace=json.loads((ROOT/'_local/reports/stage21-eupseong/fullplay/trace.json').read_text())
assert hashlib.sha256((ROOT/'shared/data/campaign.json').read_bytes()).hexdigest()==trace['source']['campaign']
select={}
for row in trace['snapshots']:
 if not row['label'].startswith('round:'):continue
 done=row['battle']['honroState']['act3']['done'];goal='rescue' if not done.get('gate-resident') else 'hold' if not done.get('refuge-hold') else 'exit'
 if goal not in select:select[goal]=row
assert len(select)==3
select["market"]=next(r for r in trace["snapshots"] if r["label"]=="round:7")
select["office"]=next(r for r in trace["snapshots"] if r["label"]=="round:9")
setup='''p=>{const a=HonroApp;a.frame=()=>{};a.profile={...HONRO_TOOLS.fresh(),...p};a.continue();a.turnNotice=null;a.updateHUD(true);const before=JSON.stringify(a.engine.b.units.map(u=>[u.id,u.x,u.y,u.hp]));for(let i=0;i<120;i++)a.scene.render(a.engine,1/60,a.selected,.6,false,0);if(before!==JSON.stringify(a.engine.b.units.map(u=>[u.id,u.x,u.y,u.hp])))throw Error('Render changed actor state');return{goal:document.querySelector('#objective-text').textContent,party:a.engine.heroesAlive().map(u=>u.id),targets:a.scene.missionTargets,debug:a.debugMode,stage:a.engine.b.honroStage};}'''
results=[];errors=[]
with sync_playwright() as p:
 b=launch(p);base=story_base_url()
 for name,row in select.items():
  for form,w,h in [('pc',1440,960),('mobile',844,390),('portrait',390,844)]:
   page=b.new_page(viewport={'width':w,'height':h},is_mobile=form!='pc',has_touch=form!='pc');page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp');state={**trace['profile'],'honroBattle':row['battle']};result=page.evaluate(setup,state);assert result['stage']==21 and not result['debug'];page.wait_for_timeout(150);page.screenshot(path=str(out/(name+'-'+form+'.png')));page.close();results.append({'goal':name,'form':form,'sourceSnapshot':row['label'],'frame':row['frame'],'result':result})
 editor=b.new_page(viewport={'width':1440,'height':960});editor.on('pageerror',lambda e:errors.append(str(e)));editor.goto(base+'/HONRO_WORKSHOP.html');editor.wait_for_function('window.HonroWorkshopAPI');editor.evaluate('HonroWorkshopAPI.selectStage("stage-21")');editor.click('[data-tab="play"]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');play=editor.frames[1]
 for name,row in select.items():
  result=play.evaluate(setup,{**trace['profile'],'honroBattle':row['battle']});expected=next(r['result'] for r in results if r['goal']==name and r['form']=='pc');assert result['goal']==expected['goal'];assert result['party']==expected['party'];editor.screenshot(path=str(out/(name+'-iframe.png')));results.append({'goal':name,'form':'iframe','result':result,'goalAndPartyEqualGame':True})
 editor.click('#stopPlay');assert editor.locator('#runtimeFrame').count()==0;b.close()
assert not errors,errors
(out/'result.json').write_text(json.dumps({'source':trace['source'],'scope':'Actual Chromium normal Game/iframe HUD, restored observed snapshots, no actor modifications; not full browser input replay or HUD pixel identity','results':results,'errors':errors},ensure_ascii=False,indent=2))
print('PASS actual Game/iframe three objective HUD states and mobile/portrait snapshots',len(results))
