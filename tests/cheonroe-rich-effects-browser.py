"""Actual Chromium production App/Scene; matched historical VFX replay and controlled gameplay scale.
No campaign completion, original targeting reconstruction, or physical-device claim.
"""
import ast,json,subprocess,time
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'game/docs/cheonroe-rich-effects-restoration/evidence'
OUT.mkdir(parents=True,exist_ok=True)
BASE='d33402627e0c632593a388ec19e0b5370cc68439'
# Reuse the existing declared production-engine fixture shell and joint transform audit.
existing=ast.parse((ROOT/'tests/cheonroe-target-lightning-browser.py').read_text())
values={}
for n in existing.body:
 if isinstance(n,ast.Assign) and isinstance(n.value,ast.Constant):
  for k in n.targets:
   if isinstance(k,ast.Name):values[k.id]=n.value.value
SETUP=values['SETUP'];SNAP=values['SNAP']
SOCKET=next(n.value for n in ast.walk(existing) if isinstance(n,ast.Constant) and isinstance(n.value,str) and 'for(const id of Object.keys(V.assets))' in n.value)
# Inject the marker/size only in historical replay; final restored build receives no route override.
CONFIG=r'''opts=>{
 const f=fixture,a=HonroApp;f.b.units.slice(1).forEach((u,i)=>{u.x=1000+(i-(opts.count-1)/2)*(opts.spacing||38);});
 a.scene.time=0;
 f.e.onEvent=ev=>{if(ev.name==='lightningBolt'){if(opts.variant==='original-rich')ev.size=5;if(opts.variant==='current-reduced')ev.text='cheonroe';}f.events.push(ev);a.scene.event(ev);};
 const tag=document.getElementById('rich-evidence-label')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'rich-evidence-label'}));
 tag.style.cssText='position:fixed;left:5px;top:5px;z-index:999999;background:#101820ed;color:white;padding:6px 8px;font:11px sans-serif;max-width:94%;pointer-events:none;border:1px solid #87bafc';
 tag.textContent=opts.label;
 renderFrame(0);
}'''
# Freeze Scene time for matched poses while preserving actual production draw calls, FX time and HUD.
STRIKE="fixture.impact();fixture.strike();renderFrame(.08)"
cores={v:(ROOT/f'_local/reports/cheonroe-rich-effects/{v}.js').read_text() for v in ['original-rich','current-reduced']}
rows=[];errors=[];perf=[];joint_checks=0
with sync_playwright() as pw,serve_game() as base:
 browser=launch(pw)
 for variant in ['original-rich','current-reduced','restored-rich']:
  context=browser.new_context(viewport={'width':1280,'height':900},device_scale_factor=1)
  if variant in cores:
   # Only replace the already-built core module, preserving normal loader and all app/assets.
   def route_core(route,request,variant=variant):
    response=route.fetch();body=response.text()
    if 'globalThis.HONRO_CORE=' in body:
     route.fulfill(response=response,body=cores[variant],content_type='text/javascript')
    else:route.fulfill(response=response)
   context.route('**/web/runtime/ordered-common-2.*.js',route_core)
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp && window.HONRO_CORE')
  page.evaluate("HonroOptionalRuntime.load('training')")
  page.add_script_tag(content=(ROOT/'tests/cheonroe-fixture.mjs').read_text().replace('export function','function'))
  if variant=='restored-rich':
   joint_checks=page.evaluate(SOCKET);assert joint_checks==112,joint_checks
  for width,height,zoom in [(360,800,.75),(390,844,.75),(1280,900,1.0)]:
   page.set_viewport_size({'width':width,'height':height})
   for count,spacing,kind in [(1,38,'matched'),(3,100,'matched'),(10,38,'gameplay-scale'),(10,8,'dense-diagnostic')]:
    name=f'{variant}-{width}x{height}-{count}-{kind}'
    opts={'count':count,'zoom':zoom,'cameraX':1000,'cameraY':760,'variant':variant,'spacing':spacing,
     'label':f'{variant} | {count} targets | '+('DENSE DIAGNOSTIC' if kind=='dense-diagnostic' else 'controlled gameplay scale')}
    page.evaluate(SETUP,opts);page.evaluate(CONFIG,opts)
    pre=page.evaluate('()=>fixture.b.units.slice(1).map(u=>({id:u.id,head:HonroMonsterVisual.headPoint(u)}))')
    page.evaluate(STRIKE);r=page.evaluate(SNAP)
    assert len(r['bolts'])==count and r['liveRays']==count and len(r['hits'])==count,r
    assert len({h['id'] for h in r['hits']})==count
    assert all(abs(ray['x2']-head['head']['x'])<1e-6 and abs(ray['y2']-head['head']['y'])<1e-6 for ray,head in zip(r['bolts'],pre))
    assert all(ray['size']==(5 if variant=='original-rich' else 3.5) for ray in r['bolts'])
    r.update({'variant':variant,'file':name+'.jpg','width':width,'height':height,'kind':kind,'spacing':spacing,'headSnapshot':pre})
    page.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=85)
    # Render-only focused timing: keep active FX at a fixed age; no parallel workloads.
    if variant in ['current-reduced','restored-rich'] and count==10 and kind=='gameplay-scale':
     times=page.evaluate('''()=>{const s=HonroApp.scene,values=[];for(let i=0;i<75;i++){const start=performance.now();renderFrame(0);const ms=performance.now()-start;if(i>=15)values.push(ms);}values.sort((a,b)=>a-b);return {samples:values.length,medianMs:values[30],p95Ms:values[57],maxMs:values.at(-1)};}''')
     perf.append({'variant':variant,'width':width,'height':height,**times})
    if variant=='restored-rich' and width==390 and count==3:
     for delta,frame in [(.18,'middle'),(.36,'late')]:
      page.evaluate('dt=>renderFrame(dt)',delta);page.screenshot(path=str(OUT/f'restored-rich-390x844-3-{frame}.jpg'),type='jpeg',quality=85)
    page.evaluate('renderFrame(1.05)');assert page.evaluate('HonroApp.scene.arcFx.fxs.filter(f=>f.kind==="lightningBolt").length')==0
    rows.append(r)
  if variant=='restored-rich':
   # Natural production fire -> flight -> landing -> .35s delay -> actual strike.
   page.set_viewport_size({'width':390,'height':844})
   opts={'count':10,'zoom':.75,'natural':True,'variant':variant,'cameraX':1000,'cameraY':760,'label':'restored-rich | 10 targets | natural fire / controlled arena'}
   page.evaluate(SETUP,opts);page.evaluate(CONFIG,opts)
   page.evaluate("()=>{for(let i=0;i<2400;i++){fixture.e.tick(1/120);renderFrame(1/120);if(fixture.p.mode==='skyWait'&&fixture.p.age>=.12)return;}throw Error('No natural landing');}")
   page.screenshot(path=str(OUT/'restored-rich-natural-390x844-wait.jpg'),type='jpeg',quality=85)
   page.evaluate("()=>{for(let i=0;i<2400;i++){fixture.e.tick(1/120);renderFrame(1/120);if(fixture.events.some(e=>e.name==='lightningBolt')){renderFrame(.075);return;}}throw Error('No natural strike');}")
   r=page.evaluate(SNAP);assert len(r['bolts'])==10 and len(r['hits'])==10 and r['headAgreement'];r.update({'variant':variant,'kind':'natural-flight','file':'restored-rich-natural-390x844-strike.jpg'})
   rows.append(r);page.screenshot(path=str(OUT/r['file']),type='jpeg',quality=85)
   # Preserve offscreen participation; higher zoom intentionally crops targets.
   page.evaluate(SETUP,{'count':10,'zoom':1.4});page.evaluate(STRIKE);r=page.evaluate(SNAP)
   assert len(r['bolts'])==10 and r['liveRays']==10 and r['offscreen']>0;r.update({'kind':'offscreen','variant':variant});rows.append(r)
   # No adaptive detail/target caps, even beyond the decorative budget.
   page.evaluate(SETUP,{'count':420,'zoom':.66});page.evaluate('fixture.b.units.slice(1).forEach((u,i)=>u.x=900+i*.4)');page.evaluate(STRIKE)
   assert page.evaluate('HonroApp.scene.arcFx.fxs.filter(f=>f.kind==="lightningBolt").length')==420
   page.evaluate('renderFrame(1.05)');assert page.evaluate('HonroApp.scene.arcFx.fxs.filter(f=>f.kind==="lightningBolt").length')==0
  context.close()
 version=browser.version;browser.close()
assert not errors,errors
# Confirm all three versions have identical target snapshots, camera, event endpoints and damage.
for current in [r for r in rows if r.get('variant')=='restored-rich' and r.get('width')]:
 for variant in ['original-rich','current-reduced']:
  reference=next(r for r in rows if r['variant']==variant and r.get('width')==current['width'] and r.get('height')==current['height'] and r.get('kind')==current['kind'] and len(r['bolts'])==len(current['bolts']))
  assert reference['headSnapshot']==current['headSnapshot']
  assert reference['camera']==current['camera'] and reference['scale']==current['scale']
  assert reference['hits']==current['hits']
for f in OUT.glob('*.jpg'):assert f.stat().st_size<1_000_000,f
report={'status':'passed','browser':version,'base':BASE,'scope':'Actual Chromium production App/Engine/Scene. Controlled arena, deterministic stepping. Historical visual module replay only: original-rich uses original shape/glow at size5 with current target snapshot, current-reduced uses base art/skillVisuals at size3.5, restored-rich loads unmodified built candidate. No image compositing.','headJointTransformChecks':joint_checks,'rows':rows,'renderTiming':perf,'pageErrors':errors}
(OUT/'browser-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(f'PASS {len(list(OUT.glob("*.jpg")))} real JPG frames, 36 matched scenes, 112 joint transforms, natural flight, offscreen, 420 rays/expiry; no page errors; browser {version}')
