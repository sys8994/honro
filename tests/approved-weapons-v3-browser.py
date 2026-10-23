"""Prepared production App/Engine, real WebAudio source observation; no listening claim."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/approved-weapons-v3-20261024';OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def check(name,condition,data=None):
 assert condition,(name,data)
 checks.append(name);print('PASS',name,flush=True)
INIT="""(()=>{window.trace=[];const edges=new WeakMap(),connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(to,...args){edges.set(this,to);return connect.call(this,to,...args)};const make=AudioContext.prototype.createBufferSource;AudioContext.prototype.createBufferSource=function(){const s=make.call(this),start=s.start;s.start=function(...args){const a=window.HonroApp?.audio,match=[...(a?.skills?.entries||[])].find(([,v])=>v.buffer===s.buffer),legacy=[...(a?.buffers||[])].find(([,v])=>v===s.buffer);let n=edges.get(s),gains=[];for(let i=0;n&&i<5;i++,n=edges.get(n))if(n.gain)gains.push(n.gain.value);trace.push({asset:match?.[0]||('legacy:'+legacy?.[0]),at:performance.now(),duration:s.buffer?.duration,rate:s.playbackRate.value,gains});return start.apply(this,args)};return s}})()"""
LAUNCH="""id=>{const a=HonroApp,s=HONRO_CORE.SKILLS[id];a.trainingClass=s.cls;a.trainingSkill=id;if(id==='S07')a.trainingRanks[id]=8;a.launch(1,true,id);a.engine.active.angle=0;window.trace=[];window.signals=[];const e=a.engine,old=e.onEvent;e.onEvent=ev=>{if(ev.type==='sound')signals.push({...ev,at:performance.now()});old(ev)};return a.selected}"""
expected=json.loads((ROOT/'shared/assets/sfx/weapons-v3/manifest.json').read_text())['assets']
old_hashes=['b3e6c5d8466d7b21','15cab9304e57fa86','27a582c724b054af','2c3f18adcebde9eb','a3394e509c34c7d3']
with sync_playwright() as pw,serve_game() as url:
 b=launch(pw);p=b.new_page(viewport={'width':844,'height':390});p.add_init_script(INIT);errors=[];requests=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('request',lambda r:requests.append(r.url));p.goto(url+'/HONRO.html');p.wait_for_function('window.HonroApp',timeout=60000)
 check('title fetches no weapon samples',not any('honro_skill_audio-assets-'in r for r in requests))
 p.evaluate("async()=>{const a=HonroApp;a.profile.settings.music=false;a.profile.settings.sound=true;a.audio.configure(a.profile.settings);await HonroOptionalRuntime.load('training')}");p.keyboard.press('Shift');p.wait_for_function("HonroApp.audio.context?.state==='running'")
 cases=[]
 for id in ['A01','S00','S08','S09','S07']:
  check(id+' actual selection',p.evaluate(LAUNCH,id)==id);p.evaluate('async()=>{await HonroApp.audio.skills.prepareWanted()}')
  p.evaluate("id=>{const e=HonroApp.engine,t=e.b.units.find(v=>v.side===1);t.hp=t.maxHp=id==='S07'?1000000:1;if(['S00','S08','S07'].includes(id)){t.x=e.active.x+70;t.y=e.active.y}}",id)
  if id in ['A01','S00']:
   p.keyboard.down('Space');p.wait_for_timeout(350)
   if id=='S00':check('S00 held input produces no qi charge',not p.evaluate("trace.some(x=>x.asset.includes('charge'))"),p.evaluate('trace'))
   p.keyboard.up('Space')
  else:p.evaluate('id=>HonroApp.engine.fire(id,0,.6)',id)
  if id in ['A01','S09']:p.evaluate("()=>{const e=HonroApp.engine,q=e.b.projectiles.find(v=>v.owner===e.active.id),t=e.b.units.find(v=>v.side===1);if(!q)throw Error('No actual projectile');e.hurt(t,q.damage,e.active.id,true,q,q)}")
  if id=='S08':p.evaluate("()=>{const e=HonroApp.engine;e.b.side=1;e.b.phase='enemy';HONRO_CORE.tickWarrior(e,1/120)}")
  p.wait_for_timeout(780 if id=='S07'else 220);trace=p.evaluate('trace');names=[x['asset']for x in trace];signals=p.evaluate('signals');cases.append({'id':id,'trace':trace,'signals':signals})
  wanted={'A01':['bow_release','bow_hit'],'S00':['sword_swing','sword_hit'],'S08':['sword_parry','sword_hit'],'S09':['blade_launch','sword_hit'],'S07':['sword_swing','sword_hit']}[id]
  check(id+' approved weapon sources and no old down',all(x in names for x in wanted)and 'legacy:down'not in names,names)
  check(id+' no qi/procedural sword fallback',not any(x in ['qi_charge','qi_charge_loop','legacy:sword','legacy:hit','legacy:arrow']for x in names),names)
  if id=='S00':
   swing=[x for x in trace if x['asset']=='sword_swing'];hit=[x for x in trace if x['asset']=='sword_hit'];check('S00 swing once before contact, no contact re-fire',len(swing)==1 and len(hit)==1 and hit[0]['at']-swing[0]['at']>25,trace)
  if id=='S07':check('S07 seven real-time swing starts, no contact duplicates',names.count('sword_swing')==7,names)
 served=[]
 for a in expected:
  src=p.evaluate('id=>HONRO_SKILL_AUDIO.assets[id].src',a['id']);raw=p.request.get(src);check(a['id']+' served bytes exact approved parent input',raw.ok and raw.body()==(ROOT/'shared/assets/sfx/weapons-v3'/a['file']).read_bytes());check(a['id']+' buffer used by actual source',any(any(x['asset']==a['id']for x in c['trace'])for c in cases));served.append({'id':a['id'],'file':src.rsplit('/',1)[-1]})
 check('old five hashes never requested',not any(h in r for r in requests for h in old_hashes))
 check('no browser exceptions',not errors,errors)
 # A cold failure of the new source must stay silent; no path to a retained old file.
 p2=b.new_page();p2.add_init_script(INIT);r2=[];p2.on('request',lambda r:r2.append(r.url));p2.route('**/*honro_skill_audio-assets-bow_release-src*.mp3',lambda route:route.fulfill(status=503,body='temporary'))
 p2.goto(url+'/HONRO.html');p2.wait_for_function('window.HonroApp',timeout=60000);p2.evaluate("async()=>{await HonroOptionalRuntime.load('training')}");p2.keyboard.press('Shift');p2.evaluate(LAUNCH,'A01');p2.evaluate('async()=>{await HonroApp.audio.skills.prepareWanted()}');p2.evaluate("HonroApp.engine.fire('A01',0,.6)");p2.wait_for_timeout(100)
 check('failed new release has no synthetic/old-file fallback',not p2.evaluate("trace.some(x=>x.asset==='bow_release'||x.asset==='legacy:arrow')")and not any(h in r for r in r2 for h in old_hashes),p2.evaluate('trace'))
 report={'checks':checks,'cases':cases,'served':served,'requests':requests,'errors':errors,'stats':p.evaluate('HonroApp.audio.skills.stats()'),'limits':['Prepared App training/real Engine/real Chromium decode+source.start; no subjective quality, physical-device or public deployment claim.','Bow hit/block still v2 pending parent input.']};(OUT/'browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));b.close()
