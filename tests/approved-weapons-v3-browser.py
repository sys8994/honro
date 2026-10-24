"""Prepared production App/Engine, real WebAudio source observation; no listening claim."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/approved-weapons-v3-20261024';OUT.mkdir(parents=True,exist_ok=True)
checks=[]
SMOKE='--smoke' in sys.argv
def check(name,condition,data=None):
 assert condition,(name,data)
 checks.append(name);print('PASS',name,flush=True)
INIT="""(()=>{window.trace=[];const edges=new WeakMap(),connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(to,...args){edges.set(this,to);return connect.call(this,to,...args)};const make=AudioContext.prototype.createBufferSource;AudioContext.prototype.createBufferSource=function(){const s=make.call(this),start=s.start;s.start=function(...args){const a=window.HonroApp?.audio,match=[...(a?.skills?.entries||[])].find(([,v])=>v.buffer===s.buffer),legacy=[...(a?.buffers||[])].find(([,v])=>v===s.buffer);let n=edges.get(s),gains=[];for(let i=0;n&&i<5;i++,n=edges.get(n))if(n.gain)gains.push(n.gain.value);trace.push({asset:match?.[0]||('legacy:'+legacy?.[0]),at:performance.now(),duration:s.buffer?.duration,rate:s.playbackRate.value,gains});return start.apply(this,args)};return s}})()"""
LAUNCH="""id=>{const a=HonroApp,s=HONRO_CORE.SKILLS[id];a.trainingClass=s.cls;a.trainingSkill=id;if(id==='S07')a.trainingRanks[id]=8;a.launch(1,true,id);a.engine.active.angle=0;window.trace=[];window.signals=[];const e=a.engine,old=e.onEvent;e.onEvent=ev=>{if(ev.type==='sound')signals.push({...ev,at:performance.now()});old(ev)};return a.selected}"""
expected=json.loads((ROOT/'shared/assets/sfx/weapons-v3/manifest.json').read_text())['assets']+json.loads((ROOT/'shared/assets/sfx/weapons-v3/arrow-hits.json').read_text())['assets']+[{'id':'cheonroe_thunder','file':'cheonroe_thunder.mp3'},{'id':'bow_release','file':'bowstring_release.mp3','folder':'bowstring-v4'}]
old_hashes=['b3e6c5d8466d7b21','15cab9304e57fa86','27a582c724b054af','2c3f18adcebde9eb','a3394e509c34c7d3','37ea535d57c69e11','2ad14e3d4dc6953b']
with sync_playwright() as pw,serve_game() as url:
 b=launch(pw);p=b.new_page(viewport={'width':844,'height':390});p.add_init_script(INIT);errors=[];requests=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('request',lambda r:requests.append(r.url));p.goto(url+'/HONRO.html');p.wait_for_function('window.HonroApp',timeout=60000)
 check('title fetches no weapon samples',not any('honro_skill_audio-assets-'in r for r in requests))
 p.evaluate("async()=>{const a=HonroApp;a.profile.settings.music=false;a.profile.settings.sound=true;a.audio.configure(a.profile.settings);await HonroOptionalRuntime.load('training')}");p.keyboard.press('Shift');p.wait_for_function("HonroApp.audio.context?.state==='running'")
 cases=[]
 for id in (['A01','S00'] if SMOKE else ['A01','A01-block','A01-soft','S00','S08','S09','S07','M04','M05']):
  base=id.split('-')[0];check(id+' actual selection',p.evaluate(LAUNCH,base)==base);p.evaluate('async()=>{await HonroApp.audio.skills.prepareWanted()}')
  p.evaluate("id=>{const e=HonroApp.engine,t=e.b.units.find(v=>v.side===1);t.hp=t.maxHp=['S07','M04','M05'].includes(id)?1000000:1;if(['S00','S08','S07'].includes(id)){t.x=e.active.x+70;t.y=e.active.y}if(['M04','M05'].includes(id)){const list=e.b.units.filter(v=>v.side===1);for(let i=list.length;i<10;i++)e.b.units.push(HONRO_CORE.makeUnit('archer',1,t.x+i*5,t.y,{id:'thunder-'+i,hp:1000000,maxHp:1000000,fixed:true,armor:0}));e.b.units.filter(v=>v.side===1).forEach((v,i)=>{v.x=t.x+i*5;v.y=t.y;v.hp=v.maxHp=1000000;v.armor=0})}}",base)
  if base in ['A01','S00']:
   p.keyboard.down('Space');p.wait_for_timeout(350)
   if base=='S00':check('S00 held input produces no qi charge',not p.evaluate("trace.some(x=>x.asset.includes('charge'))"),p.evaluate('trace'))
   p.keyboard.up('Space')
  else:p.evaluate('id=>HonroApp.engine.fire(id,0,.6)',base)
  if base in ['A01','S09','M04','M05']:p.evaluate("id=>{const e=HonroApp.engine,q=e.b.projectiles.find(v=>v.owner===e.active.id),t=e.b.units.find(v=>v.side===1);if(!q)throw Error('No actual projectile');if(['A01','S09'].includes(id))e.hurt(t,q.damage,e.active.id,true,q,q);else{const floor=e.b.terrain.find(v=>!v.broken);if(id.startsWith('A01-'))floor.mat=id==='A01-soft'?'wood':'rock';e.impact(q,{x:t.x,y:t.y,t:0,n:{x:0,y:-1},terrain:floor});if(id==='M05')for(let i=0;i<600&&e.b.projectiles.includes(q);i++)e.stepProjectile(q,1/120)}}",id)
  if id=='S08':p.evaluate("()=>{const e=HonroApp.engine;e.b.side=1;e.b.phase='enemy';HONRO_CORE.tickWarrior(e,1/120)}")
  p.wait_for_timeout(780 if id=='S07'else 220);trace=p.evaluate('trace');names=[x['asset']for x in trace];signals=p.evaluate('signals');cases.append({'id':id,'trace':trace,'signals':signals})
  wanted={'A01':['bow_release','bow_hit'],'A01-block':['arrow_block'],'A01-soft':['arrow_block'],'S00':['sword_swing','sword_hit'],'S08':['sword_parry','sword_hit'],'S09':['blade_launch','sword_hit'],'S07':['sword_swing','sword_hit'],'M04':['thunder_hit'],'M05':['cheonroe_thunder']}[id]
  check(id+' approved sources and no old weapon down',all(x in names for x in wanted)and (base.startswith('M')or 'legacy:down'not in names),names)
  if not base.startswith('M'):check(id+' no qi/procedural weapon fallback',not any(x in ['qi_charge','qi_charge_loop','legacy:sword','legacy:hit','legacy:arrow']for x in names),names)
  if id=='S00':
   swing=[x for x in trace if x['asset']=='sword_swing'];hit=[x for x in trace if x['asset']=='sword_hit'];check('S00 swing once before contact, no contact re-fire',len(swing)==1 and len(hit)==1 and hit[0]['at']-swing[0]['at']>25,trace)
  if id=='S07':check('S07 seven real-time swing starts, no contact duplicates',names.count('sword_swing')==7,names)
  if id in ['A01-block','A01-soft']:
   cue=next(x for x in trace if x['asset']=='arrow_block');check(id+' uses existing material gain',abs(cue['gains'][0]-(.25 if id=='A01-soft'else .45))<1e-5,cue)
  if id in ['M04','M05']:
   key='thunder_hit'if id=='M04'else'cheonroe_thunder';thunder=[x for x in trace if x['asset']==key];check(id+' ten targets one body and exact gain',len(thunder)==1 and abs(thunder[0]['gains'][0]-(.75 if id=='M04'else .90))<1e-5,trace);check(id+' separate thunder file',('cheonroe_thunder'not in names)if id=='M04'else('thunder_hit'not in names),names)
 served=[]
 for a in expected:
  if SMOKE and a['id'] not in ['bow_release','bow_hit','sword_swing','sword_hit']:continue
  src=p.evaluate('id=>HONRO_SKILL_AUDIO.assets[id].src',a['id']);raw=p.request.get(src);check(a['id']+' served bytes exact parent input',raw.ok and raw.body()==(ROOT/'shared/assets/sfx'/a.get('folder','weapons-v3')/a['file']).read_bytes());check(a['id']+' buffer used by actual source',any(any(x['asset']==a['id']for x in c['trace'])for c in cases));served.append({'id':a['id'],'file':src.rsplit('/',1)[-1]})
 check('old seven replaced hashes never requested',not any(h in r for r in requests for h in old_hashes))
 credit=p.evaluate("HONRO_SKILL_AUDIO.assets.bow_hit");check('attribution in active metadata',credit['credit']=='Additional Sound FX by Will Leamon'and credit['workTitle']=='Fleshy Fight Sounds'and credit['licenseURL']=='https://static.opengameart.org/OGA-BY-3.0.txt'and bool(credit['processing']),credit)
 p.evaluate(LAUNCH,'A01');p.evaluate("()=>{const a=HonroApp;a.profile.settings.sound=false;a.audio.configure(a.profile.settings);window.trace=[];a.engine.fire('A01',0,.6)}");p.wait_for_timeout(50);check('muted new event produces no source',not p.evaluate('trace'),p.evaluate('trace'));p.evaluate("()=>{const a=HonroApp;a.profile.settings.sound=true;a.audio.configure(a.profile.settings)}");p.wait_for_timeout(50);check('unmute does not replay old event',not p.evaluate('trace'))
 check('no browser exceptions',not errors,errors)
 p2=b.new_page();p2.add_init_script(INIT);r2=[];p2.on('request',lambda r:r2.append(r.url));p2.route('**/*honro_skill_audio-assets-bow_release-src*.mp3',lambda route:route.fulfill(status=503,body='temporary'))
 p2.goto(url+'/HONRO.html');p2.wait_for_function('window.HonroApp',timeout=60000);p2.evaluate("async()=>{await HonroOptionalRuntime.load('training')}");p2.keyboard.press('Shift');p2.evaluate(LAUNCH,'A01');p2.evaluate('async()=>{await HonroApp.audio.skills.prepareWanted()}');p2.evaluate("HonroApp.engine.fire('A01',0,.6)");p2.wait_for_timeout(100)
 check('failed release no synthetic/old-file fallback',not p2.evaluate("trace.some(x=>x.asset==='bow_release'||x.asset==='legacy:arrow')")and not any(h in r for r in r2 for h in old_hashes),p2.evaluate('trace'))
 report={'checks':checks,'cases':cases,'served':served,'requests':requests,'errors':errors,'stats':p.evaluate('HonroApp.audio.skills.stats()'),'limits':['Prepared App training/real Engine/real Chromium decode+start; no subjective quality, physical-device or public deployment claim.']};(OUT/'browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));b.close()
