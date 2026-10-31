"""Isolated official-entry QA fixture. No combat outcomes or mission flags injected."""
import sys,json,threading,functools,hashlib
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
root=Path('/workspace/honro-native-integration');sys.path.insert(0,str(root/'tests'));from browser_support import launch
raw=(root/'_local/inputs/stage39-presentation/stage39.json').read_bytes();assert hashlib.sha256(raw).hexdigest()=='0bb8dd43bf33af941c88800c4e7e13bbf2c7d3dd924444c035c997daad8f5dcb';project=json.loads(raw);out=root/'_local/reports/stage39-fullplay-debug';out.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));threading.Thread(target=srv.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{srv.server_port}';result={'scope':'Isolated official-entry fixture with prior 1–38 cleared, official entry-level XP, official automatic talent training and mandatory/recruit equipment migration. No claim of actually playing prior chapters. Candidate is injected in memory only.','candidateSha256':hashlib.sha256(raw).hexdigest(),'errors':[]}
with sync_playwright() as pw:
 browser=launch(pw);ctx=browser.new_context(viewport={'width':1440,'height':900});page=ctx.new_page();page.on('pageerror',lambda e:result['errors'].append(str(e)));page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT&&window.HONRO_AUTHORED_FAR',timeout=60000)
 result['fixture']=page.evaluate('''async project=>{const a=HonroApp,C=HONRO_CORE,s=project.stages[0],p={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(s)};if(!C.autoTrain||!C.pointsEarned||!C.pointsSpent)throw Error('official progression functions missing');p.cleared={};for(let i=1;i<=38;i++)p.cleared[i]={visits:1,rounds:10};p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];p.lastStage=39;p.settings={...p.settings,debugMode:false,sound:false,music:false,speed:1,playerSpeed:1};for(const id of p.recruited){C.autoTrain(p.heroes[id],id);C.sanitizeLoadout(p,id);}delete p.equipment;HonroEquipment.migrate(p);const used=new Set();for(const cls of p.recruited){for(const slot of ['personal','common']){const item=[...p.equipment.ownedItemIds].reverse().find(id=>{const x=C.EQUIPMENT_MAP[id];return x.slot===slot&&(!x.characterClass||x.characterClass===cls)&&!used.has(id)});if(item){p.equipment.equippedByClass[cls][slot]=item;used.add(item);}}}HonroEquipment.sync(p);HonroEquipment.validate(p.equipment);const rec=p.recruited.map(cls=>({cls,level:C.levelOf(p.heroes[cls]),xp:p.heroes[cls].xp,earned:C.pointsEarned(p.heroes[cls]),spent:C.pointsSpent(p.heroes[cls],cls),left:C.pointsLeft(p.heroes[cls],cls),ranks:p.heroes[cls].ranks,loadout:p.loadouts[cls],equipment:p.equipment.equippedByClass[cls]}));if(rec.some(x=>x.spent>x.earned||x.level!==HonroProgression.plan(39).entryLevel))throw Error('illegal entry build');await HonroCampaignLoader.ensureStage(39);const s39=project.stages[0],all=globalThis.HONRO_PROJECT;all.stages=all.stages.filter(s=>s.metadata.stageId!==39).concat([s39]);const ids=new Set(project.library.map(x=>x.id));all.library=all.library.filter(x=>!ids.has(x.id)).concat(project.library);HONRO_AUTHORED_FAR.images.act4Estuary='/_local/inputs/stage32-sharp/act4-estuary.webp';a.profile=p;a.normalProfile=p;if(!a.profileStore.save(p))throw Error('fixture profile save failed');return{profile:p,build:rec,plan:HonroProgression.plan(39),equipment:{owned:p.equipment.ownedItemIds,ledger:p.equipment.rewardLedger,validated:true},schema:HonroMaps.validate(project).filter(e=>e.level==='err')};}''',project)
 fixture=result['fixture'];assert not fixture['schema'];profile_json=json.dumps(fixture.pop('profile'),ensure_ascii=False,separators=(',',':')).encode();(out/'entry-profile.json').write_bytes(profile_json);fixture['profileSha256']=hashlib.sha256(profile_json).hexdigest();result['launch']=page.evaluate('''()=>{const a=HonroApp;a.launch(39);const e=a.engine;if(!e)throw Error('campaign launch deferred or blocked');const b=e.b;return{stage:b.honroStage,official:b.honroAct4Official,custom:b.honroCustom,mode:b.mode,phase:b.phase,units:b.units.map(u=>({id:u.id,side:u.side,x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,loadout:u.loadout,grounded:e.grounded(u)})),dialogue:!!a.dialogue}}''');page.wait_for_timeout(1200);page.screenshot(path=str(out/'initial.png'));result['afterWait']=page.evaluate('''()=>({screen:HonroApp.screen,dialogue:!!HonroApp.dialogue,phase:HonroApp.engine.b.phase,round:HonroApp.engine.b.round,events:HonroApp.engine.b.honroAct4PreviewState?.events,storage:HonroApp.profileStore.locked})''');(out/'entry.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'fixture':fixture,'launch':result['launch'],'afterWait':result['afterWait'],'errors':result['errors']},ensure_ascii=False));
 # Advance the initial story through actual keyboard events, preserving evidence.
 trace=[]
 for i in range(40):
  state=page.evaluate("""()=>({dialogue:!!HonroApp.dialogue, text:document.querySelector('#story-line')?.innerText,phase:HonroApp.engine.b.phase,round:HonroApp.engine.b.round,active:HonroApp.engine.b.active,canInput:HonroApp.canInput(),screen:HonroApp.screen})""")
  trace.append(state)
  if not state['dialogue']: break
  page.wait_for_timeout(650);page.keyboard.press('Space')
 page.wait_for_timeout(1000)
 page.screenshot(path=str(out/'post-dialogue.png'))
 result['dialogueTrace']=trace
 result['postDialogue']=page.evaluate("""()=>{let a=HonroApp,e=a.engine,u=e.active,b=e.b;return {phase:b.phase,round:b.round,canInput:a.canInput(),active:u&&{id:u.id,x:u.x,y:u.y,angle:u.angle,facing:u.facing,loadout:u.loadout,focus:u.focus},foes:b.units.filter(v=>v.side===1&&!v.dead).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp})),dialogue:!!a.dialogue}}""")
 print('POST',json.dumps(result['postDialogue'],ensure_ascii=False),flush=True)
 plan=page.evaluate("""()=>{const e=HonroApp.engine,u=e.active,C=HONRO_CORE,t=e.unit('a4-39-w-1');let found=[];for(const id of u.loadout){let sk=C.SKILLS[id];if(!sk||sk.passive||!e.skillAllowed(sk,u))continue;for(const aim of [...e.shotSeeds(u,sk,t),...[-40,-20,0,15,30,45,60,75].flatMap(angle=>[.3,.5,.7,.9,1].map(power=>({angle,power})))]){let r=C.shotViable(e,u,sk,t,aim.angle,aim.power);if(r.ok&&r.risk===0)found.push({id,aim,r:{ok:r.ok,risk:r.risk,enemyDamage:r.enemyDamage,hit:{unit:r.hit.unit,terrain:r.hit.terrain,x:r.hit.x,y:r.hit.y}},duration:e.chargeDuration(u,sk)});if(found.length>=4)break}if(found.length>=4)break}return found}""")
 result['shotPlans']=plan
 print('PLANS',json.dumps(plan,ensure_ascii=False),flush=True)
 if plan:
  choice=plan[0];slot=result['postDialogue']['active']['loadout'].index(choice['id'])+1;page.keyboard.press(str(slot))
  for _ in range(25):
   u=page.evaluate("()=>({angle:HonroApp.engine.active.angle,can:HonroApp.canInput()})")
   difference=choice['aim']['angle']-u['angle']
   if not u['can'] or abs(difference)<1.5:break
   key='ArrowUp' if difference>0 else 'ArrowDown';page.keyboard.down(key);page.wait_for_timeout(min(300,max(35,int(abs(difference)*1000/62))));page.keyboard.up(key)
  before=page.evaluate("()=>({shot:HonroApp.engine.b.shot,angle:HonroApp.engine.active.angle,active:HonroApp.engine.active.id})")
  page.keyboard.down('Space');page.wait_for_timeout(max(100,int(choice['duration']*choice['aim']['power']*1000)));actualCharge=page.evaluate("()=>({power:HonroApp.power,angle:HonroApp.engine.active.angle})");page.keyboard.up('Space');page.wait_for_timeout(3500)
  after=page.evaluate("""()=>{let a=HonroApp,b=a.engine.b;return{shot:b.shot,round:b.round,phase:b.phase,projectiles:b.projectiles.length,heroes:b.units.filter(u=>u.side===0).map(u=>({id:u.id,hp:u.hp,acted:u.acted,x:u.x,y:u.y})),target:b.units.find(u=>u.id==='a4-39-w-1')?.hp,damaged:b.units.filter(u=>u.side===1&&u.hp<u.maxHp).map(u=>({id:u.id,hp:u.hp,maxHp:u.maxHp})),dialogue:!!a.dialogue}}""")
  result['firstShot']={'choice':choice,'before':before,'actualCharge':actualCharge,'after':after};page.screenshot(path=str(out/'first-shot.png'));print('FIRSTSHOT',json.dumps(result['firstShot'],ensure_ascii=False),flush=True)

 (out/'entry.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 ctx.close();browser.close()
srv.shutdown();srv.server_close()
assert result['launch']['official']==1 and not result['launch']['custom'] and result['launch']['stage']==39 and not result['errors']
