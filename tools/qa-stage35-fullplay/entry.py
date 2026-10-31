import json,time,hashlib,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];out=root/'_local/reports/stage35-browser-fullplay';out.mkdir(parents=True,exist_ok=True)
profile=json.loads((root/'tools/qa-stage35-fullplay/stage30-base-fixture.json').read_text())['profile']
for n in range(31,35):profile['cleared'][str(n)]={'visits':1,'rounds':15,'stars':1,'shots':0}
profile['lastStage']=35;profile['settings']['sound']=False
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto('http://127.0.0.1:8769/HONRO.html');p.wait_for_function('window.HonroApp&&window.HONRO_CORE')
 fixture=p.evaluate('''p=>{const C=HONRO_CORE;for(const cls of C.CLASS_IDS)p.heroes[cls].xp=C.xpAtLevel(25);let report=Object.fromEntries(C.CLASS_IDS.map(cls=>[cls,{xp:p.heroes[cls].xp,level:C.levelOf(p.heroes[cls]),earned:C.pointsEarned(p.heroes[cls]),spent:C.pointsSpent(p.heroes[cls],cls),loadout:p.loadouts[cls],ranks:p.heroes[cls].ranks,equipment:p.heroes[cls].equipmentIds}]));localStorage.setItem('honro-first-act-profile-1',JSON.stringify(p));return {profile:p,report,validate:typeof C.validate,plan:HonroProgression.plan(35)};}''',profile)
 (out/'fixture.json').write_text(json.dumps({'scope':'Declared prior clears 1–34; level 25 assumes full share through 34; existing legal skill and equipment ledger from the stage-30 fixture. No prior play claim.','fixture':fixture},ensure_ascii=False,indent=2)+'\n')
 p.reload();p.wait_for_function('window.HonroApp');print('PROFILE',p.evaluate('''()=>({clear:Object.keys(HonroApp.profile.cleared),next:HonroJourneyContent.next(HonroApp.profile),last:HonroApp.profile.lastStage})'''),flush=True);print('BUTTONS',p.locator('button:visible').all_text_contents(),flush=True);p.get_by_text('여정 이어가기',exact=True).click();p.wait_for_timeout(2500);print('REST',p.locator('button:visible').all_text_contents(),p.evaluate('''()=>({journey:HonroApp.profile.honroJourney,split:HonroApp.profile.honroSplitCampaign,next:HonroJourneyContent.next(HonroApp.profile),button:document.querySelector('[data-action=journey-enter]')?.outerHTML})'''),flush=True);p.get_by_text('여정첩',exact=True).click();p.wait_for_timeout(1000);p.locator('[data-action=journey-select][data-id="35"]').click();p.wait_for_timeout(500);print('SELECT',p.locator('button:visible').all_text_contents(),flush=True);p.locator('[data-action=journey-travel][data-id="35"]').click();p.wait_for_function('HonroApp.engine?.b?.honroStage===35',timeout=60000);p.wait_for_timeout(2500)
 loaded=p.evaluate('''async()=>{const c=await (await fetch('/candidate-35.json')).json(),s=HONRO_PROJECT.stages.find(x=>x.metadata?.stageId===35),b=HonroApp.engine.b;return {identical:JSON.stringify(s)===JSON.stringify(c.stages[0]),enemies:b.units.filter(u=>u.side===1).length,allies:b.units.filter(u=>u.side===0).length,round:b.round,stage:b.honroStage,custom:b.honroCustom,profile:HonroApp.profile.heroes,errors:[]};}''');print('LOADED',json.dumps(loaded,ensure_ascii=False),flush=True);assert loaded['identical'] and loaded['enemies']==30 and loaded['allies']==4 and not loaded['custom'];p.screenshot(path=str(out/'entry.png'));(out/'entry.json').write_text(json.dumps({'fixture':fixture['report'],'loaded':loaded,'errors':errors},ensure_ascii=False,indent=2)+'\n')
 for _ in range(20):
  if p.evaluate('HonroApp.canInput()'):break
  p.keyboard.press('Enter');p.wait_for_timeout(1000)
 print('READY',p.evaluate('''()=>({dialogue:!!HonroApp.dialogue,can:HonroApp.canInput(),phase:HonroApp.engine.b.phase})'''),flush=True);p.screenshot(path=str(out/'ready.png'))
 for line in sys.stdin:
  try:
   z=line.split();op=z[0]
   if op=='stop':break
   if op=='state':print('STATE',p.evaluate('''()=>{let a=HonroApp,e=a.engine,b=e.b,u=e.active;return {round:b.round,side:b.side,phase:b.phase,can:a.canInput(),dialogue:!!a.dialogue,active:u&&{id:u.id,x:u.x,y:u.y,hp:u.hp,angle:u.angle,facing:u.facing,grounded:e.grounded(u),support:e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id,loadout:u.loadout},enemies:b.units.filter(v=>v.side===1&&!v.dead).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp})),heroes:b.units.filter(v=>v.side===0).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead})),shots:b.shots,events:b.honroAct4PreviewState,done:a.done}}'''),flush=True)
   if op=='key':p.keyboard.press(z[1]);p.wait_for_timeout(int(z[2]) if len(z)>2 else 700)
   if op=='hold':p.keyboard.down(z[1]);p.wait_for_timeout(int(z[2]));p.keyboard.up(z[1]);p.wait_for_timeout(int(z[3]) if len(z)>3 else 700)
   if op=='shot':p.screenshot(path=str(out/z[1]))
  except Exception as e:print('ERROR',repr(e),flush=True)
 b.close()
