"""Prepared R4 save, real UI/input. Not the unseen user save or full combat play."""
import argparse,json,subprocess,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
parser=argparse.ArgumentParser();parser.add_argument('--phase',choices=['before','after'],required=True);args=parser.parse_args()
OUT=ROOT/'_local/reports/interaction-enemy-gates';profile=json.loads((OUT/'gate-r4-save.json').read_text());rows=[];errors=[];http=[]
with serve_game()as base,sync_playwright()as p:
 browser=launch(p)
 for name,w,h in [('mobile',390,844),('landscape',1180,757)]:
  ctx=browser.new_context(viewport={'width':w,'height':h},has_touch=True);ctx.add_init_script('if(!localStorage.getItem("honro-first-act-profile-1"))localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile,ensure_ascii=False))+')');page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:http.append({'url':r.url,'status':r.status})if r.status>=400 else None)
  page.goto(base+'/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady');page.locator('[data-action="continue"]').click();page.wait_for_function('HonroApp.engine?.b.honroStage===13&&HonroApp.canInput()&&!HonroApp.turnNotice',timeout=45000);page.wait_for_function('HonroAuthoredFarArt.ready(13)',timeout=45000)
  page.evaluate('''()=>{const a=HonroApp,s=a.scene;Object.assign(s,{manual:true,x:4380,y:3860,scale:.66,storyTween:null,goalFocus:null,speakerUntil:0,focusUntil:0});HonroInteractions.refresh(a)}''');page.wait_for_timeout(250)
  button=page.locator('[data-context-interact="gate"]');button.wait_for();before=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,m=b.honroMarkers.find(m=>m.id==='gate'),t=HonroQuestTargets.records(b).find(t=>t.id==='gate-gate');return{eligibility:HonroInteractions.eligibility(a,m),gateBroken:!!t.broken,round:b.round,active:a.engine.active.id,enemyVitals:JSON.stringify(b.units.filter(u=>u.side===1).map(u=>[u.id,u.hp,!!u.dead])),current:HonroAct2.current(b)?.id}}''');box=button.bounding_box();assert box and box['x']>=0 and box['y']+box['height']<=h
  page.screenshot(path=str(OUT/f'{args.phase}-{name}-gate.jpg'),type='jpeg',quality=86)
  if args.phase=='before':assert button.is_disabled()and before['eligibility']['reason']=='주변 들림을 먼저 제압하세요'
  else:
   assert button.is_enabled()
   if name=='mobile':page.touchscreen.tap(box['x']+box['width']/2,box['y']+box['height']/2)
   else:page.keyboard.press('e')
   page.wait_for_function('HonroAct2.memory(HonroApp.engine.b).done.gate&&HonroQuestTargets.records(HonroApp.engine.b).find(t=>t.id==="gate-gate").broken')
   for _ in range(20):
    if not page.evaluate('!!HonroApp.dialogue'):break
    skip=page.locator('[data-action="dialogue-skip"]');nxt=page.locator('[data-action="dialogue-next"]')
    (skip if skip.count()else nxt).click();page.wait_for_timeout(100)
   assert page.evaluate('HonroAct2.current(HonroApp.engine.b)?.id')=='exit';assert page.evaluate('JSON.stringify(HonroApp.engine.b.units.filter(u=>u.side===1).map(u=>[u.id,u.hp,!!u.dead]))')==before['enemyVitals']
   page.evaluate('HonroApp.profile.honroBattle=structuredClone(HonroApp.engine.b);HonroApp.persist()');page.reload();page.wait_for_function('document.documentElement.dataset.honroReady');page.locator('[data-action="continue"]').click();page.wait_for_function('HonroApp.engine?.b.honroStage===13');assert page.evaluate('HonroQuestTargets.records(HonroApp.engine.b).find(t=>t.id==="gate-gate").broken');assert page.evaluate('HonroAct2.memory(HonroApp.engine.b).checkpoints.filter(c=>c.id==="gate").length')==1
   for _ in range(40):
    if page.evaluate('!!HonroApp.dialogue'):
     button=page.locator('[data-action="dialogue-skip"]');box2=button.bounding_box();assert box2 and box2['y']+box2['height']<=h
     button.click()
    elif page.evaluate('HonroApp.canInput()&&!HonroApp.turnNotice'):break
    page.wait_for_timeout(160)
   assert page.evaluate('HonroApp.canInput()&&!HonroApp.dialogue')
   page.evaluate('Object.assign(HonroApp.scene,{manual:true,x:4380,y:3860,scale:.66,storyTween:null,goalFocus:null,speakerUntil:0,focusUntil:0})');page.wait_for_timeout(150);page.screenshot(path=str(OUT/f'after-{name}-opened-resume.jpg'),type='jpeg',quality=86)
  rows.append({'viewport':[w,h],'input':'touch'if name=='mobile'else'KeyE','before':before,'button':box,'openedAndContinued':args.phase=='after'});ctx.close()
 browser.close()
assert not errors and not http
report={'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'manifestSHA256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'phase':args.phase,'cases':rows,'errors':errors,'httpFailures':http,'scope':__doc__};(OUT/f'{args.phase}-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'phase':args.phase,'cases':len(rows),'errors':errors,'httpFailures':http}))
