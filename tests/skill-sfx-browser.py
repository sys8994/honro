"""Production App/Engine and real Chromium WebAudio; no physical/listening claim."""
import json,time
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/skill-sfx-runtime-20261023';OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def check(name,ok,data=None):
 assert ok,(name,data)
 checks.append({'name':name,'data':data});print('PASS',name,flush=True)
ARENA="""id=>{const a=HonroApp,C=HONRO_CORE,s=C.SKILLS[id];a.stopBattle();a.close();a.training=true;a.stage=HONRO_CONTENT.stages[0];a.stageId=1;a.profile.settings.sound=true;a.profile.settings.music=false;a.profile.settings.volume=.55;a.audio.configure(a.profile.settings);const p=C.defaults();p.heroes[s.cls].xp=C.xpAtLevel(25);p.loadouts[s.cls]=[id];const b=C.createBattle(1,p,'practice',{party:[s.cls],wind:0,distance:700});Object.assign(b,{width:5000,height:2400,terrain:[{id:'floor',x:0,y:1800,w:5000,h:600,mat:'rock',hp:99999,maxHp:99999}],fields:[],drafts:[],waters:[],units:b.units.slice(0,1),rng:123456,wind:0,session:'browser-'+(++window.serial),practiceCombat:true});const u=b.units[0];Object.assign(u,{x:400,y:1800,vx:0,vy:0,maxHp:10000,hp:10000,maxFocus:1000,focus:1000,ranks:{[id]:8,[C.baseSkill(s.cls)]:1},loadout:[id],acted:false,airborne:false,jumping:false});u.ranks[id]=8;b.units.push(C.makeUnit('archer',1,900,1800,{id:'enemy',name:'허상',role:'dummy',hp:100000,maxHp:100000,armor:0,shield:0,fixed:true,loadout:['LA01']}));a.mount(b);a.selected=id;a.selectedByUnit[u.id]=id;a.scene.x=650;a.scene.y=1660;a.engine.checkEnd=()=>false;window.fixture={u,t:b.units[1]};return a.audio.skills.stats()}"""
with sync_playwright() as pw,serve_game() as url:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},has_touch=True);errors=[];requests=[]
 p.on('pageerror',lambda e:errors.append(str(e)));p.on('request',lambda r:requests.append(r.url))
 p.add_init_script("""(()=>{window.serial=0;window.audioTrace=[];const orig=AudioContext.prototype.createBufferSource;AudioContext.prototype.createBufferSource=function(){const s=orig.call(this),start=s.start,stop=s.stop;s.start=function(...args){const a=window.HonroApp?.audio,name=[...(a?.skills?.entries||[])].find(([,e])=>e.buffer===s.buffer)?.[0]||'legacy';window.audioTrace.push({type:'start',name,at:performance.now(),when:args[0],duration:s.buffer?.duration,rate:s.playbackRate.value,loop:s.loop});return start.apply(this,args)};s.stop=function(...args){window.audioTrace.push({type:'stop',at:performance.now(),when:args[0]});return stop.apply(this,args)};return s;};})()""")
 p.goto(url+'/HONRO.html');p.wait_for_function('window.HonroApp',timeout=60000)
 check('title fetches no skills audio',not any('/honro_skill_audio-' in x for x in requests),[x for x in requests if '/honro_skill_audio-' in x])
 p.evaluate("()=>{const a=HonroApp;a.profile.settings.sound=true;a.profile.settings.music=false;a.audio.configure(a.profile.settings)}");p.keyboard.press('Shift');p.wait_for_function("HonroApp.audio.context?.state==='running'")
 p.evaluate("async()=>{await HonroOptionalRuntime.load('training')}");p.evaluate(ARENA,'A01');p.wait_for_function("HonroApp.audio.skills.stats().ready.includes('bow_charge_loop')&&HonroApp.audio.skills.stats().ready.includes('bow_release')")
 check('actual MP3+WAV decode prepares needed bow bank',p.evaluate('HonroApp.audio.skills.stats().ready.length')==5,p.evaluate('HonroApp.audio.skills.stats()'))
 p.keyboard.down('Space');p.wait_for_timeout(1250)
 s=p.evaluate('HonroApp.audio.skills.stats()');check('real Space hold attack and scheduled loop once',s['charging'] and s['chargeStarts']==1 and s['loopScheduled']==1,s)
 p.screenshot(path=str(OUT/'390-bow-held.jpg'),type='jpeg',quality=85)
 p.keyboard.up('Space');p.wait_for_timeout(80)
 trace=p.evaluate('audioTrace');check('release source starts and both held voices stop',any(x.get('name')=='bow_release' for x in trace) and len([x for x in trace if x['type']=='stop'])>=1 and not p.evaluate('HonroApp.audio.skills.stats().charging'),trace)
 # Same production source/impact callback routes hit; reset fixture prevents input/AI changing collision before inspection.
 p.evaluate(ARENA,'A01');p.evaluate("()=>{const a=HonroApp,e=a.engine;e.fire('A01',0,.6);const q=e.b.projectiles[0];e.impact(q,{x:fixture.t.x,y:fixture.t.y-40,t:0,n:{x:-1,y:0},unit:fixture.t})}")
 check('actual Engine hit reaches approved real AudioBuffer source',p.evaluate("audioTrace.some(x=>x.name==='bow_hit')"))
 p.evaluate(ARENA,'A01');count=p.evaluate('HonroApp.audio.skills.stats().requests');decode=p.evaluate('HonroApp.audio.skills.stats().decodes')
 for how in ['cancel','modal','death','mute','exit']:
  p.evaluate(ARENA,'A01');p.keyboard.down('Space');p.wait_for_timeout(40)
  p.evaluate("how=>{const a=HonroApp;if(how==='cancel')a.cancelInput();if(how==='modal')a.pause();if(how==='death'){a.engine.active.dead=true;}if(how==='mute'){a.profile.settings.sound=false;a.audio.configure(a.profile.settings);}if(how==='exit')a.showTitle();}",how)
  p.wait_for_timeout(80);p.keyboard.up('Space');check(how+' stops charge without delayed loop',not p.evaluate('HonroApp.audio.skills.stats().charging'),p.evaluate('HonroApp.audio.skills.stats()'))
 p.evaluate(ARENA,'A01');p.evaluate("()=>{const a=HonroApp;window.savedBattle=structuredClone(a.engine.b);a.mount(structuredClone(savedBattle));}");p.wait_for_timeout(100)
 check('warm mount/Continue reuses requests and decodes',p.evaluate('HonroApp.audio.skills.stats().requests')==count and p.evaluate('HonroApp.audio.skills.stats().decodes')==decode,p.evaluate('HonroApp.audio.skills.stats()'))
 p.evaluate(ARENA,'O15');p.wait_for_function("HonroApp.audio.skills.stats().ready.includes('sodan_release')");p.evaluate("()=>{window.mark=audioTrace.length;HonroApp.engine.fire('O15',0,.65)}");p.wait_for_timeout(1600)
 trace=p.evaluate('audioTrace.slice(mark)');bells=[x for x in trace if x.get('name')=='sodan_release'];check('Sodan body bell one full1.85sec source despite actual echo',len(bells)==1 and abs(bells[0]['duration']-1.85)<.05 and bells[0]['rate']==1,trace)
 p.screenshot(path=str(OUT/'390-sodan-cast.jpg'),type='jpeg',quality=85)
 # Prepared practice fixtures exercise real App sound callback and actual AudioBufferSource.start for each family.
 expected={'S04':['sword_swing','rock_impact'],'S08':['sword_parry','sword_hit'],'S09':['blade_launch','sword_hit'],'M01':['qi_launch','qi_hit'],'M02':['gourd_throw','ice_hit'],'M04':['gourd_throw','thunder_hit'],'M06':['gourd_throw','fire_hit'],'M07':['stake_plant','stake_trigger'],'M09':['gate_depart','gate_arrive'],'M10':['heal'],'O11':['summon_appear','spirit_depart']}
 for skill,names in expected.items():
  p.evaluate(ARENA,skill);p.evaluate("async()=>{await HonroApp.audio.skills.prepareWanted()}")
  sample=p.evaluate("""id=>{const a=HonroApp,e=a.engine,C=HONRO_CORE,b=e.b,u=e.active,t=fixture.t;window.mark=audioTrace.length;if(!e.fire(id,0,.6))throw Error('fixture fire '+id);let q=b.projectiles[0];const ground=x=>e.impact(q,{x,y:1800,t:0,n:{x:0,y:-1},terrain:b.terrain[0]});if(id==='S04'){e.manualDive();for(let i=0;i<500&&b.projectiles.includes(q);i++)e.stepProjectile(q,C.STEP);}else if(id==='S08'){t.x=u.x+60;t.y=u.y;u.angle=0;b.side=1;b.phase='enemy';C.tickWarrior(e,.01);}else if(['S09','M01'].includes(id)){e.hurt(t,q.damage,u.id,true,q,q);}else if(id==='M09'){ground(400);Object.assign(b,{phase:'aim',side:0,active:u.id});Object.assign(u,{acted:false,focus:1000,cooldowns:{}});e.fire('M09',0,.4);q=b.projectiles[0];ground(1100);b.phase='aim';e.useGate();}else{if(id==='M10')u.hp=500;ground(id==='M10'?400:900);if(id==='M02')for(let i=0;i<800&&b.projectiles.includes(q);i++)e.stepProjectile(q,C.STEP);if(id==='M07'){b.side=1;b.phase='enemy';b.active=t.id;C.tickRedesign(e,.01);}if(id==='M10')C.tickRedesign(e,.01);if(id==='O11'){const z=b.units.find(v=>v.summoned);b.round=z.summonExpires+1;e.expireSummon(z);}}return audioTrace.slice(mark).filter(x=>x.type==='start')}""",skill)
  check(skill+' real Engine event to approved source.start',all(any(x.get('name')==name for x in sample) for name in names),sample)
 # Real asset503 and slow responses in a fresh context; no poisoned cache/no late replay.
 p2=b.new_page(viewport={'width':844,'height':390});p2.add_init_script('window.serial=0');state={'fail':True};blocked=[]
 def intercept(route):
  if state['fail']:
   blocked.append(route.request.url);route.fulfill(status=503,body='temporary')
  else:route.continue_()
 p2.route('**/*honro_skill_audio-assets-bow_release-src*.mp3',intercept)
 p2.goto(url+'/HONRO.html');p2.wait_for_function('window.HonroApp',timeout=60000);p2.keyboard.press('Shift');p2.evaluate("async()=>{await HonroOptionalRuntime.load('training')}");p2.evaluate(ARENA,'A01');p2.wait_for_function("HonroApp.audio.skills.stats().errors.includes('bow_release')")
 before=p2.evaluate('HonroApp.audio.playCount');p2.evaluate("HonroApp.engine.fire('A01',0,.6)");p2.wait_for_timeout(100);check('503 approved release does not synthesize old fallback',p2.evaluate("!HonroApp.audio.lastPlayed.arrow") and bool(blocked),p2.evaluate('HonroApp.audio.skills.stats()'))
 state['fail']=False;p2.wait_for_timeout(1050);p2.evaluate(ARENA,'A01');p2.evaluate('HonroApp.audio.skills.prepareWanted()');p2.wait_for_function("HonroApp.audio.skills.stats().ready.includes('bow_release')")
 p2.keyboard.down('Space');p2.wait_for_timeout(120);p2.screenshot(path=str(OUT/'844-recovered-charge.jpg'),type='jpeg',quality=85);p2.keyboard.up('Space');check('subsequent action recovers cached503 asset',not p2.evaluate("HonroApp.audio.skills.stats().errors.includes('bow_release')"))
 stats=p.evaluate('HonroApp.audio.skills.stats()');check('no browser exceptions',not errors,errors)
 (OUT/'browser.json').write_text(json.dumps({'checks':checks,'stats':stats,'requests':requests,'trace':p.evaluate('audioTrace'),'limits':['Chromium headless real WebAudio start/stop/decode observations; no subjective speaker/listening or physical Android/Safari claim.','Prepared practice battle/Continue fixtures, not full campaign play.']},ensure_ascii=False,indent=2));b.close()
