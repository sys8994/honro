"""Matched actual master/candidate pixels in the existing declared arena.
Production App/Engine/Scene, exact baseline core module, no image repainting.
"""
import ast, hashlib, json, subprocess
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch, serve_game
OUT=ROOT/'game/docs/cheonroe-distinct-bolts/evidence'
OUT.mkdir(parents=True,exist_ok=True)
BASE='2464b5b370114abacd9d0fa4e8dbd96274b7c621'
def literals(path):
    return {n.targets[0].id:n.value.value for n in ast.parse(path.read_text()).body
            if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and isinstance(n.value,ast.Constant)}
arena=literals(ROOT/'tests/cheonroe-target-lightning-browser.py')
rich=literals(ROOT/'tests/cheonroe-rich-effects-browser.py')
manifest=json.loads(subprocess.check_output(['git','show',BASE+':web/manifest.json'],text=True))
core_path=next(p for p in manifest['common'] if '/ordered-common-2.' in p)
baseline_core=subprocess.check_output(['git','show',BASE+':'+core_path],text=True)
rows=[];images=[];errors=[]
def shot(page,name):
    file=OUT/(name+'.jpg');page.screenshot(path=str(file),type='jpeg',quality=85)
    data=file.read_bytes();assert len(data)<1_000_000
    images.append({'file':file.name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
with sync_playwright() as pw,serve_game() as base:
    browser=launch(pw)
    for variant in ['master-before','candidate-after']:
        context=browser.new_context(device_scale_factor=1,has_touch=True)
        if variant=='master-before':
            context.route('**/web/runtime/ordered-common-2.*.js',lambda route:route.fulfill(body=baseline_core,content_type='text/javascript'))
        page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp && window.HONRO_CORE')
        page.evaluate("HonroOptionalRuntime.load('training')")
        page.add_script_tag(content=(ROOT/'tests/cheonroe-fixture.mjs').read_text().replace('export function','function'))
        for width,height,count,spacing,zoom in [(390,844,1,38,.75),(390,844,3,100,.75),(390,844,10,38,.75),(1280,900,10,38,1),(360,800,10,38,.75)]:
            page.set_viewport_size({'width':width,'height':height})
            opts={'count':count,'spacing':spacing,'zoom':zoom,'cameraX':1000,'cameraY':760,'variant':variant,
                  'label':f'{variant} | {count} targets | controlled arena (not campaign)'}
            page.evaluate(arena['SETUP'],opts);page.evaluate(rich['CONFIG'],opts)
            heads=page.evaluate('fixture.b.units.slice(1).map(u=>HonroMonsterVisual.headPoint(u))')
            page.evaluate('fixture.impact();fixture.strike();renderFrame(.08)')
            snap=page.evaluate(arena['SNAP'])
            assert len(snap['bolts'])==count==len(snap['hits'])==snap['liveRays']
            assert len({h['id'] for h in snap['hits']})==count
            for ray,head in zip(snap['bolts'],heads):
                assert abs(ray['x2']-head['x'])<1e-6 and abs(ray['y2']-head['y'])<1e-6
                assert ray['size']==3.5
            if variant=='candidate-after':
                assert len({r['lightningSeed'] for r in snap['bolts']})==count
            name=f'{variant}-{width}x{height}-{count}'
            shot(page,name+'-early')
            initial=page.evaluate('HonroApp.scene.arcFx.fxs.filter(f=>f.kind==="lightningBolt").map(f=>({seed:f.lightningSeed,x:f.x,y:f.y,x2:f.x2,y2:f.y2,life:f.life}))')
            # Check exact frozen geometry while the same deliberate phase remains active.
            if variant=='candidate-after':
                before=page.evaluate('HonroApp.scene.arcFx.fxs.filter(f=>f.kind==="lightningBolt").map(f=>HONRO_CORE.cheonroeLightningPaths(f.x,f.y,f.x2,f.y2,0,f.lightningSeed))')
                page.evaluate('renderFrame(.015)')
                after=page.evaluate('HonroApp.scene.arcFx.fxs.filter(f=>f.kind==="lightningBolt").map(f=>HONRO_CORE.cheonroeLightningPaths(f.x,f.y,f.x2,f.y2,Math.min(2,Math.floor(f.age/f.life*7)),f.lightningSeed))')
                assert before==after
                page.evaluate('renderFrame(.065)')
            else:page.evaluate('renderFrame(.08)')
            if (width,count) in [(390,3),(1280,10)]:shot(page,name+'-phase1')
            page.evaluate('renderFrame(.10)')
            shot(page,name+'-middle')
            final=page.evaluate('HonroApp.scene.arcFx.fxs.filter(f=>f.kind==="lightningBolt").map(f=>({seed:f.lightningSeed,x:f.x,y:f.y,x2:f.x2,y2:f.y2,life:f.life}))')
            assert initial==final,'seed and endpoints fixed over effect life'
            if width==390 and count==10:
                page.evaluate('renderFrame(.44)');shot(page,name+'-late')
            page.evaluate('renderFrame(1.05)');assert page.evaluate('HonroApp.scene.arcFx.fxs.filter(f=>f.kind==="lightningBolt").length')==0
            rows.append({'variant':variant,'viewport':[width,height],'count':count,'spacing':spacing,'headSnapshot':heads,'earlyAge':.08,'middleAge':.26,**snap})
        context.close()
    version=browser.version;browser.close()
for after in [r for r in rows if r['variant']=='candidate-after']:
    before=next(r for r in rows if r['variant']=='master-before' and r['viewport']==after['viewport'] and r['count']==after['count'])
    for key in ['camera','scale','headSnapshot','hits','targets']:assert before[key]==after[key],key
    strip=lambda rays:[{k:v for k,v in ray.items() if k!='lightningSeed'} for ray in rays]
    assert strip(before['bolts'])==strip(after['bolts']),'same endpoints, width, color and damage event timing'
assert not errors,errors
(OUT/'browser-results.json').write_text(json.dumps({'status':'passed','baseCommit':BASE,
    'candidateRuntimeCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),
    'baselineCore':{'path':core_path,'sha256':hashlib.sha256(baseline_core.encode()).hexdigest()},
    'browser':version,'DPR':1,'scope':'Existing controlled arena, normal 38world spacing for10; 100world for3. Actual local Chromium; not campaign or physical-device play. Baseline loads exact master core; candidate no override.',
    'rows':rows,'pageErrors':errors,'screenshots':images},ensure_ascii=False,indent=2)+'\n')
print(f'PASS matched master/candidate: {len(images)} actual JPGs <1MB, 5 scenes × early/middle + phase1/late; endpoints/hits/camera/width matched, frozen seeds, expiry, pageerrors0')
