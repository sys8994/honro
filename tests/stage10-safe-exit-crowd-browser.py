"""Adversarial terminal fixture: enemies at the exit must not surround dialogue.
This is a scene/save boundary check, not a combat playthrough.
"""
from pathlib import Path
import json,hashlib,subprocess,argparse
from playwright.sync_api import sync_playwright
from browser_support import launch
from story_browser_server import story_base_url
parser=argparse.ArgumentParser();parser.add_argument('--out',default='game/docs/stage10-world-outro-ending-replay/evidence/crowded-exit');args=parser.parse_args()
OUT=Path(args.out);OUT.mkdir(parents=True,exist_ok=True);rows=[];errors=[]
profile=json.loads(Path('game/docs/stage-review/act-endings/evidence/normal-21-escape-save.json').read_text())['profile']
with sync_playwright() as p:
 b=launch(p);page=b.new_page(viewport={'width':390,'height':844})
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(story_base_url()+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
 for w,h in [(390,844),(844,390)]:
  page.set_viewport_size({'width':w,'height':h})
  with page.expect_navigation():page.evaluate('p=>{localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p));location.reload()}',profile)
  page.wait_for_function('!!globalThis.HonroApp',timeout=120000);page.evaluate('HonroApp.continue()')
  # Explicit fixture: a live enemy is frozen at the intended default conversation point.
  before=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,u=b.units.find(u=>u.side===1&&!u.dead&&u.hp>0);u.x=HonroSodanWithdrawal.exit(b).x-200;u.y=HonroWorld.top(b,u.x,2900,b.honroMapAnchors.exit.support);b.phase='won';b.honroState.sodanWithdrawal={phase:'safe'};b.honroState.storyQueue=[];b.honroState.deferredStory=[];const enemies=JSON.stringify(b.units.filter(u=>u.side===1)),heroes=JSON.stringify(b.heroes),items=JSON.stringify(b.items);a.outcome();return {enemies,heroes,items}}''')
  page.wait_for_function('!!HonroApp.dialogue');page.wait_for_timeout(1000)
  state=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,party=b.units.filter(u=>!u.dead&&u.hp>0&&(u.side===0&&!u.summoned||u.id==='boss')),foes=b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0);return{phase:b.phase,points:party.map(u=>({x:u.x,y:u.y,ground:HonroMapEngine.surfaceY(b.honroWorldTerrain,u.x,u.y,b.honroMapAnchors.exit.support)?.y})),minimumClearance:Math.min(...party.flatMap(u=>foes.map(v=>Math.hypot(u.x-v.x,u.y-v.y)))),enemies:JSON.stringify(b.units.filter(u=>u.side===1)),heroes:JSON.stringify(b.heroes),items:JSON.stringify(b.items),frame:a.scene.storyFrameReport}}''')
  assert state['phase']=='won' and state['minimumClearance']>650
  assert all(point['x']>5000 and abs(point['y']-point['ground'])<1 for point in state['points'])
  assert all(state[k]==before[k] for k in before)
  page.screenshot(path=str(OUT/f'crowded-safe-map-{w}x{h}.jpg'),type='jpeg',quality=88)
  # The terminal actors on the canonical extension must survive actual App/Engine reload unchanged.
  saved=page.evaluate('JSON.stringify(HonroApp.engine.b.units)')
  page.reload();page.wait_for_function('!!globalThis.HonroApp',timeout=120000);page.evaluate('HonroApp.continue()');page.wait_for_function('!!HonroApp.dialogue');page.wait_for_timeout(800)
  assert saved==page.evaluate('JSON.stringify(HonroApp.engine.b.units)')
  page.locator('[data-action="dialogue-next"]').click();page.wait_for_timeout(700)
  page.screenshot(path=str(OUT/f'crowded-safe-resume-{w}x{h}.jpg'),type='jpeg',quality=88)
  rows.append({'viewport':[w,h],'minimumClearance':state['minimumClearance'],'points':state['points'],'frame':state['frame'],'enemyUnitsByteExact':True,'heroesItemsByteExact':True,'reloadUnitsByteExact':True})
 assert not errors,errors
 b.close()
(OUT/'summary.json').write_text(json.dumps({'executionSHA':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'sourceHash':hashlib.sha256(Path('shared/runtime/sodan-withdrawal.js').read_bytes()).hexdigest(),'rows':rows,'errors':errors,'scope':'adversarial terminal fixture with one enemy at gate, not normal combat'},ensure_ascii=False,indent=2)+'\n')
print('PASS crowded exit uses existing east world surface; actual terrain, >650 clearance, enemies/resources frozen, saved units exact after reload')
