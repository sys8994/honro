"""Prepared high-ledge fixture in actual Game/practice UI, then Engine inputs.
Frozen animation scheduling and declared camera only; no writes to live shot,
actor resources or objectives after fire. Sequential PNG frames form a clip.
"""
import json,sys,hashlib,subprocess,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/returning-wraith-fall-20261022/browser';OUT.mkdir(parents=True,exist_ok=True)
setup=r'''mode=>{const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};a.trainingClass='occultist';a.trainingSkill='O05';a.trainingRanks={O05:1};a.launch(1,true,'O05');const e=a.engine,b=e.b,u=e.active;
// Prepared comparison geometry. No field below is changed after firing.
Object.assign(b,{width:12000,height:6500,mode,wind:0,fields:[],drafts:[],waters:[],zones:[],units:[u],terrain:[{id:'deep-floor',x:0,y:6200,w:12000,h:300,mat:'rock',hp:99999,maxHp:99999},{id:'launch-ledge',x:2820,y:3000,w:180,h:25,mat:'rock',hp:99999,maxHp:99999}],phase:'aim',side:0,active:u.id,sceneVersion:b.sceneVersion+1});Object.assign(u,{x:3000,y:3000,spawnX:3000,spawnY:3000,vx:0,vy:0,acted:false,loadout:['O01','O05'],ranks:{O01:1,O05:1}});const ally=C.makeUnit('archer',0,2900,3000,{id:'fixture-ally',loadout:['A01'],acted:false});const foe=C.makeUnit('knight',1,10500,6200,{id:'fixture-foe',fixed:true,awake:false,hp:9000,maxHp:9000,loadout:['LS09']});b.units.push(ally,foe);a.training=mode==='practice';a.close();a.turnNotice=null;const banner=document.getElementById('turn-banner');if(banner)banner.hidden=true;
const prediction=e.predict(u,C.SKILLS.O05,-25,.3),focus=u.focus,cost=e.manaCost(C.SKILLS.O05,u,.3);if(!e.fire('O05',-25,.3))throw Error('fire');const p=b.projectiles.find(q=>q.skill==='O05');window.fall={e,b,p,focus,cost,prediction,trace:[],contact:null,maxPoints:0};return{prediction:{x:prediction.x,y:prediction.y,terrain:prediction.terrain},focus,cost};}'''
step=r'''target=>{const q=fall,{e,b,p}=q,C=HONRO_CORE;let iterations=0;while(b.projectiles.includes(p)&&p.age<target&&iterations++<20000){const before=p.wraithState;e.tick(C.STEP);q.trace.push([p.age,p.x,p.y,p.wraithState]);q.maxPoints=Math.max(q.maxPoints,p.wraithPath.length);if(before==='outbound'&&p.wraithState==='manifest')q.contact={age:p.age,x:p.x,y:p.y};}return{age:p.age,x:p.x,y:p.y,state:p.wraithState,alive:b.projectiles.includes(p),contact:q.contact,maxPoints:q.maxPoints};}'''
rows=[]
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw)
 for mode in ['campaign','practice']:
  page=browser.new_page(viewport={'width':1180,'height':757});errors=[];http=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:http.append(r.url)if r.status>=400 else None)
  page.goto(base+'/HONRO.html',wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=90000)
  page.evaluate("async()=>{await HonroCampaignLoader.ensureStage(1);await HonroOptionalRuntime.load('training')}")
  info=page.evaluate(setup,mode);samples=[];frame=0
  for target in [n/4 for n in range(61)]:
   sample=page.evaluate(step,target);samples.append(sample)
   page.evaluate('''()=>{const a=HonroApp,q=fall;a.updateHUD(true);Object.assign(a.scene,{manual:true,x:q.p.x,y:q.p.y+160,scale:.55,goalFocus:null,cinematic:null,storyTween:null});a.scene.render(a.engine,0,'O05',.3,false,0);}''')
   if mode=='practice':page.screenshot(path=str(OUT/f'frame-{frame:02}.png'));frame+=1
  assert samples[14]['alive'] and samples[32]['alive'] and samples[32]['state']=='outbound'
  assert samples[-1]['contact'] and not samples[-1]['alive']
  trace=page.evaluate('fall.trace');signature=hashlib.sha256(json.dumps(trace,separators=(',',':')).encode()).hexdigest()
  continuation=page.evaluate('''()=>{const q=fall,{e,b}=q,C=HONRO_CORE;for(let n=0;!e.canAct()&&n<2000;n++)e.tick(C.STEP);return{phase:b.phase,round:b.round,canAct:e.canAct(),follow:e.canAct()?e.fire(C.baseSkill(e.active.cls),10,.2):false,remaining:b.projectiles.map(p=>p.skill)};}''')
  assert continuation['follow']
  assert not errors and not http,(errors,http)
  key_samples=[s for i,s in enumerate(samples) if i in [0,14,32,60] or s['state']=='manifest']
  rows.append(dict(mode=mode,initial=info,samples=key_samples,trajectorySha256=signature,followUp=continuation,errors=errors,httpFailures=http));page.close()
 assert rows[0]['trajectorySha256']==rows[1]['trajectorySha256'],'Same production trajectory in campaign/practice'
 # Real preview cycle: a deliberately deep prepared scenario runs beyond22s.
 page=browser.new_page(viewport={'width':1180,'height':757});page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp')
 page.evaluate("async()=>{await HonroOptionalRuntime.load('skill-preview')}")
 preview=page.evaluate(r'''()=>{const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};const cv=document.createElement('canvas');cv.width=720;cv.height=360;cv.style.width='720px';cv.style.height='360px';document.body.appendChild(cv);const h=structuredClone(a.profile.heroes.occultist);h.ranks.O05=1;const p=HonroSkillPreview.setup(a,'O05',h,cv);a.preview=p;const b=p.b,u=p.hero;
 Object.assign(b,{width:12000,height:6500,units:[u],terrain:[{id:'deep-floor',x:0,y:6200,w:12000,h:300,mat:'rock',hp:99999,maxHp:99999},{id:'launch-ledge',x:2820,y:3000,w:180,h:25,mat:'rock',hp:99999,maxHp:99999}],sceneVersion:b.sceneVersion+1});Object.assign(u,{x:3000,y:3000,spawnX:3000,spawnY:3000,vx:0,vy:0});p.aim={angle:80,power:.7};let at23=null,contact=false;for(let n=0;n<2700&&a.preview===p;n++){HonroSkillPreview.tick(a,p,1/60);contact||=b.projectiles.some(q=>q.wraithState==='manifest'||q.wraithState==='return');if(!at23&&p.age>=23)at23={same:a.preview===p,alive:b.projectiles.length>0,age:p.age};}return{at23,contact,cycledAfterCompletion:a.preview!==p,age:p.age,returnObserved:p.metrics.wraithReturn};}''')
 assert preview['at23']['same'] and preview['at23']['alive'] and preview['contact'] and preview['returnObserved'] and preview['cycledAfterCompletion'],preview
 browser.close()
result=dict(checkedCommit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),entry=json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],rows=rows,preview=preview,scope='Prepared geometry in final production UI, real Engine fire/tick and sequential frames; no normal campaign arrival/playthrough claim.')
(OUT/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('PASS actual campaign/practice trajectory exact; long preview survives22s and completes, follow-up input works')
