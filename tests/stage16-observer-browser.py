"""Real Chromium UI from explicit synthetic App checkpoints, not natural fullplay.
No player saves, live state mutation, skipped guards, or injected runtime modules.
"""
import json, traceback, hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch, serve_game
OUT=ROOT/'_local/reports/stage16-observer-browser';OUT.mkdir(parents=True,exist_ok=True)
INPUT=ROOT/'_local/reports/stage16-observer-app'
R={'passed':False,'scope':__doc__,'errors':[],'cases':[]}
STATE='''()=>{const a=HonroApp,b=a.engine?.b,q=b?HonroAct23V4ReviewedChapters.memory(b):null;return {stage:b?.honroStage,revision:b?.honroCampaignMapRevision,session:b?.session,round:b?.round,phase:b?.phase,active:b?.active,can:a.canInput(),row:a.dialogue?.lines[a.dialogue.index]?.[2]?.rowId,approach:q?.witnessApproach||null,soul:q?.trappedObserved||null,events:q?.events,witnessPresented:q?.witnessPresented,journals:a.profile.record.filter(r=>r.rowId==='A2.S16.JOURNAL.01').length,heroes:b?.units.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,cls:u.cls,x:u.x,y:u.y,hp:u.hp,dead:!!u.dead})),heard:b?HonroAct23V4Reviewed16.heard(b):false}}'''
def state(p):return p.evaluate(STATE)
def open_profile(browser,base,name):
 ctx=browser.new_context(viewport={'width':1440,'height':900});p=ctx.new_page();p.on('pageerror',lambda e:R['errors'].append(str(e)))
 response=p.goto(base+'/HONRO.html');assert response.status==200;p.wait_for_function('window.HonroApp',timeout=90000)
 p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str(INPUT/name))
 p.wait_for_function('HonroApp.profile?.lastStage===16',timeout=60000);p.reload();p.wait_for_function('window.HonroApp',timeout=90000);p.locator('.title-actions [data-action="continue"]').first.click();p.wait_for_function('HonroApp.engine?.b.honroStage===16',timeout=90000)
 return ctx,p
try:
 with serve_game() as base,sync_playwright() as pw:
  browser=launch(pw)
  ctx,p=open_profile(browser,base,'witness-both-down.json')
  for _ in range(80):
   s=state(p)
   if not s['row']:break
   assert s['row'].startswith('A2.S16.WITNESS.'),s
   p.locator('[data-action="dialogue-next"]').click();p.wait_for_timeout(200)
  p.wait_for_function('HonroApp.canInput()&&!HonroApp.turnNotice',timeout=30000)
  before=state(p);assert before['revision']==516 and before['heard'] and not before['approach'] and not before['soul'],before
  for cls in ['mage','occultist']:
   units=[u for u in before['heroes'] if u['cls']==cls]
   assert len(units)==1 and (units[0]['hp']<=0 or units[0]['dead']),(cls,units)
  p.screenshot(path=str(OUT/'before-approach.png'))
  for _ in range(80):
   s=state(p)
   if s['row']:break
   p.keyboard.down('ArrowRight');p.wait_for_timeout(100);p.keyboard.up('ArrowRight');p.wait_for_timeout(50)
  after=state(p);assert after['row']=='A2.S16.MID.07' and after['approach'] and not after['soul'],after
  assert after['approach']['basis']=='elder-testimony' and after['approach']['position']['x']>next(u['x'] for u in before['heroes'] if u['id']==before['active'])
  p.screenshot(path=str(OUT/'elder-followup.png'));receipt=after['approach'];session=after['session']
  p.reload();p.wait_for_function('window.HonroApp',timeout=90000);p.locator('.title-actions [data-action="continue"]').first.click();p.wait_for_function('HonroApp.dialogue!=null',timeout=90000)
  resumed=state(p);assert resumed['session']==session and resumed['row']=='A2.S16.MID.07' and resumed['approach']==receipt and not resumed['soul'],resumed
  for _ in range(10):
   if not state(p)['row']:break
   assert state(p)['row']=='A2.S16.MID.07'
   p.locator('[data-action="dialogue-next"]').click();p.wait_for_timeout(250)
  p.wait_for_timeout(500)
  settled=state(p);assert settled['events']['souls']['status']=='done' and settled['journals']==1 and not settled['soul'],settled
  p.reload();p.wait_for_function('window.HonroApp',timeout=90000);p.locator('.title-actions [data-action="continue"]').first.click();p.wait_for_function('HonroApp.engine?.b.honroStage===16',timeout=90000);p.wait_for_timeout(500)
  final=state(p);assert final['session']==session and final['approach']==receipt and final['journals']==1 and final['events']['souls']['status']=='done' and not final['soul'],final
  assert final['row'] not in ['A2.S16.MID.06','A2.S16.MID.07'];R['cases'].append({'name':'actual-arrow-input-followup-and-two-reloads','before':before,'approach':after,'resumed':resumed,'final':final});ctx.close();browser.close()
 R['passed']=not R['errors']
except Exception:
 R['failure']=traceback.format_exc()
 try:R['failureState']=state(p);p.screenshot(path=str(OUT/'failure.png'))
 except Exception:pass
finally:
 (OUT/'result.json').write_text(json.dumps(R,ensure_ascii=False,indent=2));print(json.dumps(R,ensure_ascii=False));assert R['passed'],R.get('failure',R['errors'])
