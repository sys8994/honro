"""Read-only9ed routing audit. Runtime changes are confined to disposable practice fixtures/instrumentation.
This records existing overlaps, not a listening-quality acceptance test.
"""
import sys,json,hashlib,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
from playwright.sync_api import sync_playwright
OUT=ROOT/'_local/reports/weapon-sfx-routing-20261023';OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def check(name,condition,data=None):
 assert condition,(name,data)
 checks.append(name);print('PASS',name,flush=True)
INIT="""(()=>{window.trace=[];const edges=new WeakMap(),C=AudioContext.prototype;for(const proto of[AudioNode.prototype]){const original=proto.connect;proto.connect=function(to,...args){edges.set(this,to);return original.call(this,to,...args)}}const make=C.createBufferSource;C.createBufferSource=function(){const s=make.call(this),start=s.start,stop=s.stop;s.start=function(...args){const a=window.HonroApp?.audio,match=[...(a?.skills?.entries||[])].find(([,v])=>v.buffer===s.buffer),legacy=[...(a?.buffers||[])].find(([,v])=>v===s.buffer);let n=edges.get(s),gains=[];for(let i=0;n&&i<5;i++,n=edges.get(n))if(n.gain)gains.push(n.gain.value);trace.push({type:'start',asset:match?.[0]||('legacy:'+legacy?.[0]),at:performance.now(),when:args[0],duration:s.buffer?.duration,rate:s.playbackRate.value,loop:s.loop,gains});return start.apply(this,args)};s.stop=function(...args){trace.push({type:'stop',at:performance.now(),when:args[0]});return stop.apply(this,args)};return s}})()"""
with sync_playwright() as pw,serve_game() as url:
 browser=launch(pw);p=browser.new_page(viewport={'width':844,'height':390});p.add_init_script(INIT);errors=[];requests=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('request',lambda r:requests.append(r.url));p.goto(url+'/HONRO.html');p.wait_for_function('window.HonroApp',timeout=60000)
 p.evaluate("async()=>{const a=HonroApp;a.profile.settings.music=false;a.profile.settings.sound=true;a.audio.configure(a.profile.settings);await HonroOptionalRuntime.load('training');window.signals=[];window.legacyCalls=[];const old=a.audio.play.bind(a.audio);a.audio.play=function(name){legacyCalls.push({name,at:performance.now()});return old(name)}}")
 p.keyboard.press('Shift');p.wait_for_function("HonroApp.audio.context?.state==='running'")
 cases=[]
 for cls,id in [('archer','A01'),('knight','S00')]:
  for kind in ['release','hit','nonlethal','terrain']:
   p.evaluate("o=>{const a=HonroApp;a.trainingClass=o.cls;a.trainingSkill=o.id;a.launch(1,true,o.id);const e=a.engine,original=e.onEvent;e.onEvent=ev=>{if(ev.type==='sound')signals.push({...ev,at:performance.now()});original(ev)};if(['hit','nonlethal'].includes(o.kind)&&o.cls==='knight'){const t=e.b.units.find(v=>v.side===1);t.x=e.active.x+70;t.y=e.active.y; t.hp=t.maxHp;}if(['hit','nonlethal'].includes(o.kind)){const t=e.b.units.find(v=>v.side===1);t.hp=t.maxHp=o.kind==='hit'?1:1000000;}a.engine.active.angle=0;window.trace=[];window.signals=[];window.legacyCalls=[]}",{'cls':cls,'id':id,'kind':kind})
   p.evaluate("async()=>{await HonroApp.audio.skills.prepareWanted()}")
   initial=p.evaluate("()=>({selected:HonroApp.selected,loadout:HonroApp.engine.active.loadout,volume:HonroApp.audio.volume,masterGain:HonroApp.audio.master.gain.value,cls:HonroApp.engine.active.cls})")
   p.keyboard.down('Space');p.wait_for_timeout(1250);held=p.evaluate('HonroApp.audio.skills.charge?.gain.gain.value');p.keyboard.up('Space')
   if cls=='archer' and kind!='release':
    p.evaluate("kind=>{const e=HonroApp.engine,q=e.b.projectiles.find(v=>v.owner===e.active.id);if(!q)throw Error('No real arrow');if(['hit','nonlethal'].includes(kind)){const t=e.b.units.find(v=>v.side===1);e.impact(q,{x:t.x,y:t.y-t.h*.5,t:0,n:{x:-1,y:0},unit:t})}else{const t=e.b.terrain.find(v=>!v.broken);e.impact(q,{x:t.x,y:t.y,t:0,n:{x:0,y:-1},terrain:t})}}",kind)
   p.wait_for_timeout(350)
   case=p.evaluate("()=>({trace,signals,legacyCalls,targets:HonroApp.engine.b.units.filter(v=>v.side===1).map(v=>({hp:v.hp,dead:v.dead})),stats:HonroApp.audio.skills.stats()})");case.update({'cls':cls,'id':id,'kind':kind,'initial':initial,'heldGroupGain':held});cases.append(case)
   starts=[x for x in case['trace']if x['type']=='start'];assets=[x['asset']for x in starts];expected=['bow_charge','bow_charge_loop','bow_release']if cls=='archer'else['qi_charge','qi_charge_loop','sword_swing']
   check(f'{id}/{kind}: actual basic selection and expected charge/release',initial['selected']==id and initial['loadout']==[id]and all(x in assets for x in expected),assets)
   check(f'{id}/{kind}: no unclassified/generic attack fallback',all(x in ['legacy:down',*expected,('bow_hit'if cls=='archer'else'sword_hit'),'arrow_block']for x in assets)and all(x['name']=='down'for x in case['legacyCalls']),case['legacyCalls'])
   for x in starts:
    if x['asset'] in ['bow_charge','bow_charge_loop','qi_charge','qi_charge_loop']:gain=1 if not x['loop']else 0
    else:gain=.8 if x['asset']=='bow_release'else .45 if x['asset']=='arrow_block'else 1 if x['asset']=='legacy:down'else .75
    gain_ok=(len(x['gains'])==1 and abs(x['gains'][0]-initial['masterGain'])<1e-5)if x['asset']=='legacy:down'else abs(x['gains'][0]-gain)<1e-5
    check(f'{id}/{kind}: {x["asset"]} gain/rate',gain_ok and .9799<=x['rate']<=1.0201,(x['gains'],x['rate']))
   if kind in ['hit','nonlethal']:
    check(f'{id}/{kind}: actual hit and lethal-only shared down',('bow_hit'if cls=='archer'else'sword_hit')in assets and ('legacy:down'in assets)==(kind=='hit')and case['targets'][0]['dead']==(kind=='hit'),assets)
    if cls=='knight':
     a=next(x for x in starts if x['asset']=='sword_hit');z=next(x for x in starts if x['asset']=='sword_swing');check(f'{id}/{kind}: swing and hit same emission window',abs(a['at']-z['at'])<20,[a['at'],z['at']])
   if kind=='terrain':check(f'{id}: ordinary terrain route',('arrow_block'in assets)if cls=='archer'else not any(x['skillAudio']['phase']in ['block','terrain-break']for x in case['signals']if x.get('skillAudio')),assets)
 buffers=p.evaluate("async()=>{const a=HonroApp.audio,ids=['bow_release','sword_swing','bow_hit','sword_hit','bow_charge','qi_charge'],out={};for(const id of ids){const b=a.skills.entries.get(id)?.buffer;if(!b)continue;const pcm=b.getChannelData(0),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(pcm.buffer,pcm.byteOffset,pcm.byteLength)))).map(v=>v.toString(16).padStart(2,'0')).join('');out[id]={samples:b.length,rate:b.sampleRate,duration:b.duration,pcmSha256:hash,src:HONRO_SKILL_AUDIO.assets[id].src}}return{buffers:out,sameRelease:a.skills.entries.get('bow_release').buffer===a.skills.entries.get('sword_swing').buffer,sameHit:a.skills.entries.get('bow_hit').buffer===a.skills.entries.get('sword_hit').buffer,defaultLoadouts:HONRO_CORE.defaults().loadouts}}")
 check('distinct launch/hit AudioBuffers and PCM',not buffers['sameRelease']and not buffers['sameHit']and all(buffers['buffers'][a]['pcmSha256']!=buffers['buffers'][z]['pcmSha256']for a,z in [('bow_release','sword_swing'),('bow_hit','sword_hit')]))
 files={}
 for name,record in buffers['buffers'].items():
  raw=(ROOT/'shared/assets/sfx/skills-v2'/f'{name}.mp3').read_bytes();response=p.request.get(record['src']);check(name+': served bytes match v2 file',response.ok and response.body()==raw);files[name]={'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'urlFile':record['src'].rsplit('/',1)[-1]}
 check('no browser exceptions',not errors,errors)
 result={'sha':'9ed5e01d892e75b003b4009d41cb56e538784f9e','testHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'checks':checks,'files':files,'cases':cases,'buffers':buffers,'requests':[r for r in requests if 'honro_skill_audio' in r],'errors':errors,'limits':['Local immutable production9ed build, actual App training launch/basic loadout and keyboard charge.','Hit/terrain collisions prepared in live Engine; no subjective listening, no physical device, no public audio capture.']}
 (OUT/'routing.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({'cases':[{'cls':x['cls'],'kind':x['kind'],'initial':x['initial'],'heldGroupGain':x['heldGroupGain'],'starts':[s for s in x['trace'] if s['type']=='start'],'signals':x['signals'],'legacyCalls':x['legacyCalls']} for x in cases],'buffers':buffers,'errors':errors},ensure_ascii=False,indent=2));browser.close()
