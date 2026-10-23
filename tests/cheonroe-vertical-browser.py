"""Live App.frame / actual Engine and Scene in declared practice fixtures; no frozen art loop."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/approved-weapons-v3-20261024';OUT.mkdir(parents=True,exist_ok=True)
rows=[];errors=[]
SETUP="""o=>{const a=HonroApp,C=HONRO_CORE;a.stopBattle();a.close();a.profile.settings.music=false;a.profile.settings.sound=false;a.audio.configure(a.profile.settings);const f=cheonroeArena(C,{count:o.count,rank:8});a.profile=f.profile;a.profile.settings.sound=false;a.profile.settings.music=false;a.training=true;a.trainingClass='mage';a.trainingSkill='M05';a.stage=HONRO_CONTENT.stages[0];a.mount(f.b);a.engine.checkEnd=()=>false;a.selected='M05';a.scene.manual=true;a.scene.x=1000;a.scene.y=o.height>o.width?650:930;a.scene.scale=o.zoom;window.captureEvents=[];const old=a.engine.onEvent;a.engine.onEvent=e=>{if(e.name==='lightningBolt')captureEvents.push(e);old(e)};const p=f.p,b=a.engine.b;window.rngBefore=b.rng;window.frameBefore=a.prev;a.engine.impact(p,{x:1000,y:1000,t:0,n:{x:0,y:-1},terrain:f.floor});return{rng:b.rng,targets:b.units.filter(u=>u.side===1).length}}"""
with sync_playwright() as pw,serve_game() as url:
 browser=launch(pw);p=browser.new_page(viewport={'width':390,'height':844},has_touch=True);p.on('pageerror',lambda e:errors.append(str(e)));p.goto(url+'/HONRO.html');p.wait_for_function('window.HonroApp',timeout=60000);p.evaluate("async()=>{await HonroOptionalRuntime.load('training')}");p.add_script_tag(content=(ROOT/'tests/cheonroe-fixture.mjs').read_text().replace('export function','function'))
 for width,height,zoom in [(390,844,.65),(844,390,.75)]:
  for count in [1,3,10]:
   p.set_viewport_size({'width':width,'height':height});initial=p.evaluate(SETUP,{'width':width,'height':height,'zoom':zoom,'count':count});p.wait_for_function("captureEvents.length>0&&HonroApp.scene.arcFx.fxs.some(f=>f.kind==='lightningBolt')",timeout=10000)
   snap=p.evaluate("""()=>{const a=HonroApp,b=a.engine.b,fx=a.scene.arcFx.fxs.filter(f=>f.kind==='lightningBolt');return{targets:b.units.filter(u=>u.side===1).map(u=>({id:u.id,hp:u.hp,dead:u.dead})),bolts:captureEvents,ages:fx.map(f=>f.age),life:fx.map(f=>f.life),camera:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale},prev:a.prev,live:a.prev>frameBefore,heads:captureEvents.every(ray=>b.units.some(u=>{const h=HonroMonsterVisual.headPoint(u)||{x:u.x,y:u.y-u.h};return u.side===1&&Math.hypot(ray.x2-h.x,ray.y2-h.y)<.01}))}}""")
   assert len(snap['bolts'])==count and len(snap['ages'])==count and snap['heads']and snap['live'],snap
   assert len({x['lightningSeed']for x in snap['bolts']})==count
   name=f'live-{width}x{height}-{count}.jpg';p.screenshot(path=str(OUT/name),type='jpeg',quality=88);snap.update({'viewport':[width,height],'count':count,'file':name,'initial':initial});rows.append(snap)
   p.wait_for_timeout(100);after=p.evaluate("()=>({prev:HonroApp.prev,ages:HonroApp.scene.arcFx.fxs.filter(f=>f.kind==='lightningBolt').map(f=>f.age)})");assert after['prev']>snap['prev'];assert after['ages']and after['ages'][0]>snap['ages'][0]
   p.wait_for_timeout(950);assert p.evaluate("HonroApp.scene.arcFx.fxs.filter(f=>f.kind==='lightningBolt').length")==0
 assert not errors,errors
 (OUT/'vertical-browser.json').write_text(json.dumps({'rows':rows,'errors':errors,'limits':['Production App.frame never stopped or replaced. Prepared1/3/10-target practice arena, not campaign completion or subjective art approval.','Camera/zoom are declared gameplay fixture values; live measured camera is recorded.']},ensure_ascii=False,indent=2));browser.close();print('PASS live1/3/10 bolts,390/844 viewport, true heads, distinct seeds, App clock and FX age advance, expiry; six JPGs',flush=True)
