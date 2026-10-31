"""Diagnostic continuation of an unmodified real UI storage snapshot.
Not a fresh full-play run; no battle flags, positions or health are changed."""
import hashlib,json,os,time,pathlib
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[2];source=pathlib.Path(os.environ['HONRO_SOURCE_SNAPSHOT']);raw=source.read_text();profile=json.loads(raw);battle=profile['honroBattle'];assert battle['honroStage']==31 and battle['round']==12 and battle['active']=='mage'
print('original snapshot sha256',hashlib.sha256(raw.encode()).hexdigest(),flush=True)
out=root/'_local/act4-rc/slope-resume';out.mkdir(parents=True,exist_ok=True);events=[]
with sync_playwright() as w:
 browser=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=browser.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(os.environ.get('HONRO_QA_URL','http://127.0.0.1:8899')+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('(raw)=>localStorage.setItem("honro-first-act-profile-1",raw)',raw);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===31',timeout=60000);p.wait_for_timeout(1200)
 def snap(label):
  q=p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.unit('pilot31-lookout-return-5');return {round:b.round,phase:b.phase,side:b.side,active:e.active?.id,can:a.canInput(),dialogue:!!a.dialogue,actor:u&&{x:u.x,y:u.y,hp:u.hp,dead:u.dead,grounded:e.grounded(u),role:u.role},party:b.units.filter(x=>x.side===0&&!x.summoned).map(x=>({id:x.id,x:x.x,y:x.y,hp:x.hp,dead:x.dead})),shots:b.projectiles.filter(x=>x.owner==='pilot31-lookout-return-5').map(x=>({skill:x.skill,x:x.x,y:x.y}))}}''');q['label']=label;q['time']=time.time();events.append(q);return q
 initial=snap('resumed');assert initial['round']==12 and initial['active']=='mage' and initial['actor']['hp']==332 and not initial['actor']['dead'];p.screenshot(path=str(out/'resumed.png'))
 # Actual movement toward the target, then ordinary defense on each ally turn.
 p.keyboard.down('ArrowRight');p.wait_for_timeout(1900);p.keyboard.up('ArrowRight');p.wait_for_timeout(900);snap('mage-move');p.mouse.move(700,400);p.mouse.wheel(0,1800);p.wait_for_timeout(500)
 acted=set();seen_active=False
 for i in range(240):
  q=snap('poll')
  if q['active']=='pilot31-lookout-return-5':
   if not seen_active:p.screenshot(path=str(out/'target-active.png'));seen_active=True
  if seen_active and q['active']!='pilot31-lookout-return-5' and q['phase'] not in ('flight','enemy'):break
  if q['dialogue']:p.keyboard.press('Enter');p.wait_for_timeout(500);continue
  if q['can'] and q['side']==0 and q['phase']=='aim' and q['active'] not in acted:
   acted.add(q['active']);p.keyboard.press('f');p.wait_for_timeout(500);snap('normal-defend');continue
  p.wait_for_timeout(250)
 p.screenshot(path=str(out/'final.png'));(out/'observations.json').write_text(json.dumps({'sourceSha256':hashlib.sha256(raw.encode()).hexdigest(),'events':events,'pageErrors':errors},ensure_ascii=False,indent=2));print('observations',len(events),'targetActive',seen_active,'pageErrors',errors,flush=True);assert not errors;browser.close()
