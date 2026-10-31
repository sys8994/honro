#!/usr/bin/env python3
"""Six fresh UI casts of the same archer skill; observation only after fixture setup."""
import hashlib,json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];out=root/'_local/reports/stage35-rc-fullplay/matched-charge';out.mkdir(parents=True,exist_ok=True)
profile=json.loads((root/'tools/qa-stage35-fullplay/stage30-base-fixture.json').read_text())['profile']
for n in range(31,35):profile['cleared'][str(n)]={'visits':1,'rounds':15,'stars':1,'shots':0}
profile['lastStage']=35;profile['settings']['sound']=False;profile['heroes']['mage']['ranks'].update({'M07':3,'M10':3});profile['loadouts']['mage']=['M01','M06','M03','M10']
rows=[]
with sync_playwright() as w:
 browser=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for i in range(6):
  p=browser.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto('http://127.0.0.1:8779/HONRO.html');p.wait_for_function('window.HonroApp&&window.HONRO_CORE')
  p.evaluate('''p=>{for(const cls of HONRO_CORE.CLASS_IDS)p.heroes[cls].xp=HONRO_CORE.xpAtLevel(25);const c=HONRO_CORE.validate(p);for(const cls of HONRO_CORE.CLASS_IDS)if(JSON.stringify(c.heroes[cls].ranks)!==JSON.stringify(p.heroes[cls].ranks)||JSON.stringify(c.loadouts[cls])!==JSON.stringify(p.loadouts[cls])||JSON.stringify(c.heroes[cls].equipmentIds)!==JSON.stringify(p.heroes[cls].equipmentIds))throw Error('invalid fixture '+cls);localStorage.setItem('honro-first-act-profile-1',JSON.stringify(p));}''',profile)
  p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('여정 이어가기',exact=True).click();p.wait_for_timeout(1200);p.get_by_text('여정첩',exact=True).click();p.wait_for_timeout(600);p.locator('[data-action=journey-select][data-id="35"]').click();p.wait_for_timeout(300);p.locator('[data-action=journey-travel][data-id="35"]').click();p.wait_for_function('HonroApp.engine?.b?.honroStage===35',timeout=60000);p.wait_for_timeout(1200)
  for _ in range(20):
   if p.evaluate('HonroApp.canInput()'):break
   p.keyboard.press('Enter');p.wait_for_timeout(600)
  assert p.evaluate('HonroApp.canInput()&&HonroApp.engine.active?.id==="archer"')
  p.keyboard.press('Digit1');p.keyboard.down('ArrowDown');p.wait_for_timeout(240);p.keyboard.up('ArrowDown');p.wait_for_timeout(100)
  before=p.evaluate('''()=>({angle:HonroApp.engine.active.angle,skill:HonroApp.selected,shots:HonroApp.engine.b.shots,enemyHp:Object.fromEntries(HonroApp.engine.b.units.filter(u=>u.side===1).map(u=>[u.id,u.hp]))})''');assert before['skill']=='A01'
  raw=p.evaluate("()=>localStorage.getItem('honro-first-act-profile-1')").encode();(out/f'{i+1:02d}-before.raw').write_bytes(raw)
  target=.6;threshold=.6 if i%2==0 else .575;p.keyboard.down('Space');samples=[]
  try:
   p.wait_for_function('HonroApp.charging',timeout=5000)
   for _ in range(400):
    q=p.evaluate('''()=>({now:performance.now(),chargeAt:HonroApp.chargeAt,power:HonroApp.chargePower(performance.now()),duration:HonroApp.engine.chargeDuration(HonroApp.engine.active,HONRO_CORE.SKILLS[HonroApp.selected])})''');samples.append(q)
    if q['power']>=threshold:break
    p.wait_for_timeout(25)
   else:raise RuntimeError('charge did not reach threshold')
  finally:p.keyboard.up('Space')
  p.wait_for_timeout(150);launch=p.evaluate('''()=>({shots:HonroApp.engine.b.shots,last:HonroApp.engine.b.lastShots?.archer})''');assert launch['shots']==before['shots']+1 and launch['last']['skill']=='A01'
  p.wait_for_timeout(4000);after=p.evaluate('''()=>({enemyHp:Object.fromEntries(HonroApp.engine.b.units.filter(u=>u.side===1).map(u=>[u.id,u.hp])),phase:HonroApp.engine.b.phase,round:HonroApp.engine.b.round})''')
  actual=launch['last']['power'];lag=None if actual>=1 else q['chargeAt']+actual*q['duration']*1000-q['now'];row={'trial':i+1,'threshold':threshold,'targetPower':target,'angleBeforeShot':before['angle'],'samples':samples,'observedBeforeKeyUp':q,'actual':launch['last'],'inferredObservationToKeyupMs':lag,'powerError':actual-target,'enemyHpBefore':before['enemyHp'],'enemyHpAfter':after['enemyHp'],'phaseAfter':after['phase'],'roundAfter':after['round'],'rawStorageSha256':hashlib.sha256(raw).hexdigest(),'pageErrors':errors};rows.append(row)
  if i==0:p.screenshot(path=str(out/'first-shot.png'))
  (out/'matched.json').write_text(json.dumps({'scope':'Six separate fresh declared prior-clear entries; same archer A01, target .60, normal 240ms aim key, alternating threshold .600/.575. UI event timing, not engine injection. Small sample, changing timing and identical initial map; no claim of human repeatability or balance.','candidateSha256':'9f3fbf1956d568f5f6cad54a570e5dd59886379b4772b5cc6bc7a774895869ab','rows':rows},ensure_ascii=False,indent=2)+'\n');p.close()
 browser.close()
print('completed',len(rows))
