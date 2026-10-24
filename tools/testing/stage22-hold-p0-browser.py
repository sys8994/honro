"""Prepared comparison checkpoint; normal App/rAF, actual movement/defend/reader/Continue and23 navigation."""
import json,sys,os,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/stage22-hold-20261024';saved=json.loads((OUT/'blocked-profile.json').read_text());baseline=os.environ.get('HONRO_STAGE22_BASELINE')=='1';old=json.loads(subprocess.check_output(['git','show','78818166:web/manifest.json'],cwd=ROOT));rows=[];errors=[]
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw);c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('if(!localStorage.getItem("honro-first-act-profile-1"))localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(saved))+');');url=base+'/'+(old['playtest'].split('?')[0]if baseline else 'HONRO.html');p.goto(url);p.wait_for_function('document.documentElement.dataset.honroReady',timeout=90000);p.locator('[data-action=continue]').tap();p.wait_for_function('HonroApp.engine?.b.honroStage===22&&HonroApp.canInput()&&!HonroApp.turnNotice',timeout=90000)
 def state():return p.evaluate('''(()=>{const a=HonroApp,b=a.engine.b;return{stage:b.honroStage,round:b.round,teamEnds:[...b.teamEnds],goal:HonroAct3.current(b)?.id,hold:structuredClone(b.honroState.act3.holds['compare-ledgers']),pairReady:HonroEvidenceQuests.pairReady(b),cargo:structuredClone(b.honroState.fieldEvidence.cargo),hud:document.getElementById('objective-text')?.textContent,waves:b.units.filter(u=>u.honroSpawnSource==='act3-compare-ledgers').map(u=>u.id),enemies:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).map(u=>({id:u.id,x:u.x,y:u.y})),units:b.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp})),modal:a.modalKind,dialogue:!!a.dialogue,canInput:a.canInput(),draws:window.__holdDraws||0,error:a.lastError||null}})()''')
 def watch():p.evaluate('''()=>{__holdDraws=0;const s=HonroApp.scene,render=s.render.bind(s);s.render=(...args)=>{__holdDraws++;return render(...args)};Object.assign(s,{x:2475,y:1020,scale:.65,manual:true})}''')
 def capture(name):p.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=82,scale='css')
 def readers():
  if p.evaluate('!!HonroApp.dialogue'):
   p.locator('[data-action=dialogue-skip]'if p.locator('[data-action=dialogue-skip]').count() else '[data-action=dialogue-next]').tap();p.wait_for_timeout(80);return True
  return False
 watch();p.wait_for_timeout(500);initial=state();assert not initial['pairReady']and not initial['hold']['contested'];rows.append({'initial':initial});capture('before-blocked'if baseline else 'fixed-blocked')
 if not baseline:
  assert '소단'in initial['hud']and'설오'in initial['hud']and'나란히'in initial['hud'];p.keyboard.down('ArrowLeft');p.wait_for_function('HonroEvidenceQuests.pairReady(HonroApp.engine.b)',timeout=8000);p.keyboard.up('ArrowLeft');p.wait_for_timeout(200);assert state()['pairReady'];capture('fixed-records-together')
 target=initial['teamEnds'][1]+2;reloaded=False;actions=0;progress1=False
 for step in range(1600):
  s=state()
  if s['error']:raise AssertionError(s['error'])
  if s['modal']=='result':break
  if readers():continue
  if baseline and s['teamEnds'][1]>=target:
   assert s['hold']['progress']==0 and not s['pairReady'];rows.append({'twoRealEnemyEndsStillBlocked':s});capture('before-two-enemy-ends');break
  if not baseline and s['hold']['progress']==1 and not reloaded and s['canInput']:
   capture('fixed-one-enemy-end');p.wait_for_function('JSON.parse(localStorage.getItem("honro-first-act-profile-1")).honroBattle?.honroState.act3.holds["compare-ledgers"]?.progress===1',timeout=15000);before=state();p.reload();p.wait_for_function('document.documentElement.dataset.honroReady',timeout=90000);p.locator('[data-action=continue]').tap();p.wait_for_function('HonroApp.engine?.b.honroStage===22',timeout=90000);watch();p.wait_for_timeout(200);after=state();assert after['hold']['progress']==1 and after['waves']==before['waves'] and after['pairReady'];rows.append({'midHoldContinue':True,'before':before,'after':after});reloaded=True
  if s['canInput']and not p.evaluate('!!HonroApp.turnNotice'):
   p.keyboard.press('f');actions+=1;p.wait_for_timeout(120)
  else:p.wait_for_timeout(80)
  assert actions<60,('too many defend actions',s)
 else:raise AssertionError('No terminal within normal-frame observation budget')
 if not baseline:
  p.wait_for_function('HonroApp.modalKind==="result"',timeout=30000);final=state();assert final['hold']['progress']>=2 and final['hold']['spawned']==2 and reloaded;assert len(final['enemies'])>0,'Distant enemies are not an all-clear prerequisite';capture('fixed-clear-modal');rows.append({'actualClear':final,'defendActions':actions});p.locator('[data-action=result-continue]').tap();p.wait_for_function('HonroApp.screen==="rest"',timeout=30000)
  for _ in range(30):
   if not readers():break
  p.locator('[data-action=journey-enter]').tap();p.wait_for_function('HonroApp.engine?.b.honroStage===23',timeout=90000)
  for _ in range(30):
   if not readers():break
  capture('fixed-stage23');assert p.evaluate('!!HonroApp.profile.cleared[22]&&HonroApp.engine.heroesAlive().length===4');rows.append({'actual23Entry':True})
 assert not errors,errors
 (OUT/('browser-before.json'if baseline else 'browser.json')).write_text(json.dumps({'entry':old['gameEntry']if baseline else json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],'rows':rows,'errors':errors,'scope':__doc__+' Prior pickups/courts, actor poses, round11 and camera are prepared; no later objective/counter/HP writes, no frame shutdown. User original save/image pixels unavailable.'},ensure_ascii=False,indent=2));b.close();print('PASS',('baseline normal enemy ends blocked with misleading HUD'if baseline else 'real record movement, normal enemy ends, mid-Continue, clear modal with lower survivors and23 entry'))
