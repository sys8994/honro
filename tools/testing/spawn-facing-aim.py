"""Production browser direction checks; Chromium emulation, not physical-device QA.
Stage1 normally has only Seol-o. Its extra three heroes are an explicit factory
fixture on the real stage1 terrain; stage12 entry uses its normal four-person roster.
"""
import json,os,sys,math,hashlib,subprocess
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch
from playwright.sync_api import sync_playwright
BUILD=Path(os.environ.get('BUILD_ROOT',ROOT));BASELINE=os.environ.get('BASELINE')=='1';OUT=ROOT/'_local/reports/spawn-facing-aim';OUT.mkdir(parents=True,exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(BUILD)));Thread(target=server.serve_forever,daemon=True).start()
rows=[];errors=[]
with sync_playwright() as pw:
 browser=launch(pw);context=browser.new_context(viewport={'width':720,'height':1560},has_touch=True,device_scale_factor=1);page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text());profile['cleared']['11']=True
 page.add_init_script('localStorage.clear();localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');let s=899412;Math.random=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);')
 page.goto(f'http://127.0.0.1:{server.server_port}/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady')
 def ready():
  page.wait_for_function('HonroApp.engine?.b');page.evaluate('()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);}')
  page.wait_for_function('()=>{const a=HonroApp,n=document.getElementById("turn-banner");return a.canInput()&&!a.turnNotice&&(!n||n.hidden);}',timeout=30000);page.wait_for_timeout(350)
 def snap(tag):
  r=page.evaluate('''()=>{const a=HonroApp,u=a.engine.active;return {stage:a.stageId,cls:u.cls,id:u.id,x:u.x,y:u.y,angle:u.angle,facing:u.facing,display:a.displayAngle(u),moveLeft:u.moveLeft,phase:a.engine.b.phase,intent:a.stick.intent,axes:{x:a.stick.x,y:a.stick.y},heroes:a.engine.b.units.filter(u=>u.side===0).map(u=>({id:u.id,cls:u.cls,facing:u.facing,angle:u.angle}))};}''');r['tag']=tag;rows.append(r);return r
 def shot(name):
  page.evaluate('()=>{const a=HonroApp,u=a.engine.active;Object.assign(a.scene,{manual:true,x:u.x,y:u.y-200,scale:.94,storyTween:null,goalFocus:null,focusUntil:0,speakerUntil:0});a.updateHUD(true);}')
  page.wait_for_timeout(70);page.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=88)
 def coherent(row):return all((1 if math.cos(math.radians(u['angle']))>=0 else -1)==u['facing'] for u in row['heroes'])
 for stage in [1,12]:
  page.evaluate('(n)=>HonroApp.launch(n)',stage);ready();page.wait_for_function('(n)=>HonroAuthoredFarArt.ready(n)',arg=stage)
  initial=snap(f'entry-{stage}');shot(('before' if BASELINE else 'after')+f'-stage{stage}-entry')
  if BASELINE:
   if stage==12:
    assert initial['facing']==-1 and initial['angle']==44 and initial['display']==136
    page.evaluate('HonroApp.beginCharge()');page.wait_for_timeout(500);shot('before-stage12-charge');page.evaluate('HonroApp.cancelInput()')
   continue
  assert coherent(initial),initial
  if stage==1:
   page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,u=a.engine.active;for(const [i,cls]of ['mage','knight','occultist'].entries()){const r=HonroUnits.record(cls,'facing-fixture-'+cls,u.x+120*(i+1),u.y,'player'),v=HonroUnits.create(r,b,a.profile,a.stage),pose=HonroTerrain.place(b,v,{maxDistance:500});Object.assign(v,pose,{spawnX:pose.x,spawnY:pose.y});b.units.push(v);}a.updateHUD(true);}''')
   snap('stage1-extra-heroes-factory-fixture')
  ids=page.evaluate('HonroApp.engine.b.units.filter(u=>u.side===0).map(u=>u.id)')
  for uid in ids:
   page.evaluate('(id)=>HonroApp.selectHero(id)',uid);page.wait_for_timeout(100);selected=snap(f'select-{stage}-{uid}');assert selected['id']==uid and coherent(selected)
   for direction,key in [(-1,'KeyA'),(1,'KeyD')]:
    before=snap('walk-before');page.keyboard.down(key);page.wait_for_timeout(110);page.keyboard.up(key);after=snap(f'walk-{stage}-{uid}-{direction}');assert after['facing']==direction and coherent(after) and (after['x']-before['x'])*direction>0,(before,after)
  if stage==1:continue
  # Trusted touch follows the owning pointer from vertical lock -> turn -> lock.
  cdp=context.new_cdp_session(page)
  for uid in ids:
   page.evaluate('(id)=>HonroApp.selectHero(id)',uid)
   for sy in [-1,1]:
    rect=page.locator('#joystick').bounding_box();x=rect['x']+rect['width']/2;y=rect['y']+rect['height']/2;r=min(rect['width'],rect['height'])*.41
    def touch(kind,dx=0,dy=0):
     cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if kind=='touchEnd' else [{'id':1,'x':x+dx*r,'y':y-dy*r,'radiusX':2,'radiusY':2,'force':1}]});page.wait_for_timeout(40)
    touch('touchStart');touch('touchMove',0,sy);page.wait_for_timeout(100);locked=snap('vertical-lock');assert locked['intent']=='aimOnly' and locked['axes']['x']==0
    old=locked['display'];direction=-locked['facing'];touch('touchMove',direction*.8,0);turned=snap('locked-turn');assert turned['facing']==direction and coherent(turned) and abs(turned['display']-old)<3
    touch('touchMove',0,sy);page.wait_for_timeout(100);again=snap('vertical-relock');assert again['intent']=='aimOnly' and again['axes']['x']==0 and coherent(again);touch('touchEnd')
  # Real charge/release; restore through production save/Continue between shots.
  for uid in ids:
   for facing in [-1,1]:
    page.evaluate('''({id,f})=>{const a=HonroApp;a.selectHero(id);a.engine.face(f);a.profile.honroBattle=structuredClone(a.engine.b);a.persist();}''',{'id':uid,'f':facing})
    assert page.evaluate('HonroApp.beginCharge()');page.wait_for_timeout(500);shot(f'after-{uid}-charge-'+('left' if facing<0 else 'right'))
    result=page.evaluate('''()=>{const a=HonroApp,e=a.engine,u=e.active,skill=HONRO_CORE.SKILLS[a.selected],before=structuredClone(u);a.releaseCharge();const power=u.lastPower,v=e.velocity(before,skill,before.angle,power),o=e.projectileOrigin(before,skill,before.angle),prediction=e.predict(before,skill,before.angle,power),p=e.b.projectiles.find(p=>p.owner===u.id);return {cls:u.cls,facing:u.facing,angle:u.angle,phase:e.b.phase,power,skill:skill.id,expected:v,origin:o,firstPoint:prediction.points?.[0],projectile:p?{x:p.x,y:p.y,vx:p.vx,vy:p.vy}:null,melee:u.meleeAction};}''');rows.append({'tag':'actual-release',**result});assert (1 if math.cos(math.radians(result['angle']))>=0 else -1)==facing
    q=result['projectile']
    if q:
     assert abs(q['vx']-result['expected']['vx'])<1e-5 and abs(q['vy']-result['expected']['vy'])<1e-5 and abs(q['x']-result['origin']['x'])<1e-5 and q['vx']*facing>0,result
     assert (result['firstPoint']['x']-result['origin']['x'])*facing>=0,result
    else:assert result['cls']=='knight' and result['melee'],result
    page.evaluate('HonroApp.stopBattle();HonroApp.continue()');ready();saved=snap('continue-after-shot');assert saved['facing']==facing and saved['angle']==result['angle'] and saved['phase']=='aim',saved
  # Explicit legacy mismatch is a deliberate save fixture, never auto-repaired.
  exact=page.evaluate('''()=>{const a=HonroApp;Object.assign(a.engine.active,{facing:-1,angle:44});a.profile.honroBattle=structuredClone(a.engine.b);const saved=a.engine.b.units.map(u=>[u.id,u.angle,u.facing]);a.persist();a.stopBattle();a.continue();return {saved,loaded:a.engine.b.units.map(u=>[u.id,u.angle,u.facing])};}''');assert exact['saved']==exact['loaded'];rows.append({'tag':'explicit-legacy-continue',**exact})
  page.evaluate('HonroApp.retry()');ready();retried=snap('retry-fresh');assert coherent(retried),retried;shot('after-stage12-retry')
 result={'passed':not errors,'baseline':BASELINE,'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=BUILD,text=True).strip(),'trackedTreeDirty':bool(subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],cwd=BUILD,text=True).strip()),'manifestSha256':hashlib.sha256((BUILD/'web/manifest.json').read_bytes()).hexdigest(),'browser':browser.version,'viewport':[720,1560],'rows':rows,'errors':errors,'limits':['Stage1 extra three heroes are an explicit fresh factory fixture; normal campaign1 still has only Seol-o.','Production natural App rAF, trusted keyboard/touch and actual Engine/App release, fresh entry/Continue/retry; prepared QA progress. Not normal campaign completion or physical mobile device QA.']}
 (OUT/('before.json' if BASELINE else 'browser.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({'passed':result['passed'],'rows':len(rows),'errors':errors}));assert not errors
 browser.close()
server.shutdown()
