#!/usr/bin/env python3
"""Isolated normal-key calibration; observes UI charge and shots, never writes game charge/state."""
import hashlib,json,statistics,time
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];out=root/'_local/reports/stage35-rc-fullplay/calibration';out.mkdir(parents=True,exist_ok=True)
profile=json.loads((root/'tools/qa-stage35-fullplay/stage30-base-fixture.json').read_text())['profile']
for n in range(31,35):profile['cleared'][str(n)]={'visits':1,'rounds':15,'stars':1,'shots':0}
profile['lastStage']=35;profile['settings']['sound']=False
profile['heroes']['mage']['ranks'].update({'M07':3,'M10':3});profile['loadouts']['mage']=['M01','M06','M03','M10']
with sync_playwright() as w:
 browser=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=browser.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto('http://127.0.0.1:8779/HONRO.html');p.wait_for_function('window.HonroApp&&window.HONRO_CORE')
 p.evaluate('''p=>{for(const cls of HONRO_CORE.CLASS_IDS)p.heroes[cls].xp=HONRO_CORE.xpAtLevel(25);const checked=HONRO_CORE.validate(p);for(const cls of HONRO_CORE.CLASS_IDS)if(JSON.stringify(checked.heroes[cls].ranks)!==JSON.stringify(p.heroes[cls].ranks)||JSON.stringify(checked.loadouts[cls])!==JSON.stringify(p.loadouts[cls])||JSON.stringify(checked.heroes[cls].equipmentIds)!==JSON.stringify(p.heroes[cls].equipmentIds))throw Error('fixture changed '+cls);localStorage.setItem('honro-first-act-profile-1',JSON.stringify(p));}''',profile)
 p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('여정 이어가기',exact=True).click();p.wait_for_timeout(2500);p.get_by_text('여정첩',exact=True).click();p.wait_for_timeout(1000);p.locator('[data-action=journey-select][data-id="35"]').click();p.wait_for_timeout(500);p.locator('[data-action=journey-travel][data-id="35"]').click();p.wait_for_function('HonroApp.engine?.b?.honroStage===35',timeout=60000);p.wait_for_timeout(2000)
 for _ in range(20):
  if p.evaluate('HonroApp.canInput()'):break
  p.keyboard.press('Enter');p.wait_for_timeout(1000)
 assert p.evaluate('HonroApp.canInput()')
 # Read-only fixed-band viability: visible real enemies and real prediction only.
 band=p.evaluate('''()=>{const a=HonroApp,e=a.engine,u=e.active,C=HONRO_CORE,sc=a.scene,r=sc.canvas.getBoundingClientRect(),lo=sc.world(0,0),hi=sc.world(r.width,r.height),sk=C.SKILLS[u.loadout[0]],targets=e.b.units.filter(v=>v.side===1&&!v.dead&&v.x>=Math.min(lo.x,hi.x)&&v.x<=Math.max(lo.x,hi.x)&&v.y>=Math.min(lo.y,hi.y)&&v.y-v.h<=Math.max(lo.y,hi.y));let shots=[];for(const t of targets)for(let angle=0;angle<=85;angle+=5){const v=C.shotViable(e,u,sk,t,angle,.6),h=e.predict(u,sk,angle,.6,t,false);if(v.ok&&v.risk<.5&&h.unit===t.id)shots.push({target:t.id,angle,power:.6,enemyDamage:v.enemyDamage});}return {skill:sk.id,visible:targets.map(t=>t.id),directHitCandidates:shots};}''')
 (out/'fixed-band-plan.json').write_text(json.dumps(band,ensure_ascii=False,indent=2)+'\n')
 rows=[]
 for i in range(4):
  p.wait_for_function('HonroApp.canInput()&&HonroApp.engine.b.side===0&&HonroApp.engine.b.phase==="aim"&&HonroApp.engine.grounded(HonroApp.engine.active)',timeout=60000)
  p.keyboard.press('Digit1');before=p.evaluate('''()=>({actor:HonroApp.engine.active.id,angle:HonroApp.engine.active.angle,shots:HonroApp.engine.b.shots,skill:HonroApp.selected})''')
  # Normal angle key for 150ms; the game itself integrates its visible aim.
  p.keyboard.down('ArrowUp');p.wait_for_timeout(150);p.keyboard.up('ArrowUp')
  aim=p.evaluate('''()=>({angle:HonroApp.engine.active.angle,now:performance.now()})''')
  target=.6;compensation=0 if i<2 else .025;threshold=target-compensation
  p.keyboard.down('Space')
  try:
   p.wait_for_function('''target=>HonroApp.charging&&HonroApp.chargePower(performance.now())>=target''',arg=threshold,timeout=8000,polling=16)
   observed=p.evaluate('''()=>({now:performance.now(),chargeAt:HonroApp.chargeAt,power:HonroApp.chargePower(performance.now()),duration:HonroApp.engine.chargeDuration(HonroApp.engine.active,HONRO_CORE.SKILLS[HonroApp.selected])})''')
  finally:p.keyboard.up('Space')
  p.wait_for_timeout(100);actual=p.evaluate('''id=>({shots:HonroApp.engine.b.shots,last:HonroApp.engine.b.lastShots?.[id]||null})''',before['actor'])
  assert actual['shots']==before['shots']+1 and actual['last'] and actual['last']['skill']==before['skill'],(before,actual)
  shot=actual['last'];lag=None if shot['power']>=1 else observed['chargeAt']+shot['power']*observed['duration']*1000-observed['now']
  rows.append({'actor':before['actor'],'skill':before['skill'],'angleBefore':before['angle'],'angleAfterNormal150msKey':aim['angle'],'targetPower':target,'releaseThreshold':threshold,'observed':observed,'actual':shot,'inferredObservationToKeyupMs':lag,'powerError':shot['power']-target})
  p.wait_for_timeout(3000)
 p.screenshot(path=str(out/'calibration-after-four-shots.png'))
 raw=p.evaluate("()=>localStorage.getItem('honro-first-act-profile-1')").encode();(out/'calibration-storage.raw').write_bytes(raw)
 result={'scope':'Isolated fresh legal declared prior-clear fixture; four real UI casts, not a campaign completion or statistical estimate. First two use threshold .600, latter two .575; actors/skills differ so this does not establish a controlled treatment effect. No charge or Engine.fire mutation. Fixed-band predictions are read-only and do not count as hits.','candidateSha256':'9f3fbf1956d568f5f6cad54a570e5dd59886379b4772b5cc6bc7a774895869ab','rows':rows,'fixedBand':band,'storageSha256':hashlib.sha256(raw).hexdigest(),'pageErrors':errors}
 (out/'calibration.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False),flush=True);browser.close()
