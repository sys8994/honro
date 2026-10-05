"""Focused visual audit of every Act 2 pool, Act 1's Stage 2 pools, and the cave transition."""
import json
import sys
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

iteration = sys.argv[1] if len(sys.argv) > 1 else 'current'
out = ROOT / '_local/reports/act2-terrain' / iteration
out.mkdir(parents=True, exist_ok=True)
errors = []
rows = []

with sync_playwright() as p:
    browser = launch(p)
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto((ROOT / 'HONRO.html').as_uri())
    page.wait_for_function('window.HonroApp && window.HONRO_PROJECT')
    page.evaluate("HonroApp.frame=()=>{};HonroApp.profile=HONRO_TOOLS.fresh();HonroApp.profile.recruited=['archer','mage','knight','occultist'];for(let id=1;id<=20;id++)HonroApp.profile.cleared[id]={rounds:20};")

    def stage(sid):
        page.evaluate('''id=>{HonroApp.launch(id);while(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.turnNotice=null;HonroApp.banterCurrent=null;HonroApp.modal.classList.remove('open');HonroApp.scene.storyTween=null;HonroApp.scene.goalFocus=null;HonroApp.scene.cinematic=null;HonroApp.scene.manual=true;}''', sid)
        page.evaluate('HonroStory.tick(HonroApp,performance.now()+5000);document.getElementById("turn-banner")?.remove()')

    def shot(name, x, y, zoom):
        page.evaluate('''v=>{const a=HonroApp,s=a.scene;s.x=v.x;s.y=v.y;s.scale=v.zoom;s.render(a.engine,0);a.updateHUD(true);}''', {'x': x, 'y': y, 'zoom': zoom})
        page.screenshot(path=str(out / (name + '.png')))

    for sid in [2, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]:
        stage(sid)
        data = page.evaluate('''()=>{const b=HonroApp.engine.b;return{stage:b.honroStage,width:b.width,height:b.height,
          pools:b.honroSurfaceZones.filter(z=>z.kind==='water-pool').map(z=>({id:z.id,surface:z.surface,bottom:z.bottom,carved:!!z.honroCarvedBasin})),
          forms:b.honroCaveForms||[],target:b.honroCaveHangingTarget||null,space:b.honroMap.space}}''')
        rows.append(data)
        for j, pool in enumerate(data['pools']):
            x = sum(pt[0] for pt in pool['surface']) / 2
            y = pool['surface'][0][1] + 50
            shot(f'stage-{sid}-water-{j}', x, y, .72)
        # Frame actual authored rooms rather than obsolete switchback coordinates.
        if sid in (12, 13, 14):
            selected = {12: 'outer-mouth', 13: 'sunken-forecourt', 14: 'middle-market'}[sid]
            room = next(r for r in data['space']['rooms'] if r['id'] == selected)
            box = room['bounds']
            shot(f'stage-{sid}-{selected}', box['x'] + box['w'] / 2, box['y'] + box['h'] / 2, .5)
        if sid == 15:
            t = data['target']
            shot('stage-15-vault-target', t['x'], t['targetY'] + 500, .57)
            used = page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;HonroAct2.memory(b).done['clear-water']=true;
              for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0;}
              return HonroAct2.use(a,b.honroMarkers.find(m=>m.id==='sluice'));}''')
            assert used, 'Stage 15 sluice interaction failed'
            page.evaluate('HonroStory.tick(HonroApp,performance.now()+5000);document.getElementById("turn-banner")?.remove()')
            pool = page.evaluate('''()=>{const z=HonroApp.engine.b.honroSurfaceZones.find(z=>z.kind==='water-pool');return{surface:z.surface,bottom:z.bottom}}''')
            before = data['pools'][0]
            assert abs(pool['surface'][0][1] - before['surface'][0][1] - 120) < 1e-7
            assert pool['surface'][0][0] > before['surface'][0][0] and pool['surface'][1][0] < before['surface'][1][0]
            assert pool['bottom'][0] == pool['surface'][0] and pool['bottom'][-1] == pool['surface'][1]
            shot('stage-15-water-drained', sum(pt[0] for pt in pool['surface']) / 2, pool['surface'][0][1] + 30, .72)

    act2_pools = [(r['stage'], p) for r in rows if r['stage'] >= 11 for p in r['pools']]
    assert [sid for sid, _ in act2_pools] == [14, 15, 19], [sid for sid, _ in act2_pools]
    assert len(next(r for r in rows if r['stage'] == 2)['pools']) >= 2
    assert not errors, errors
    browser.close()

(out / 'audit.json').write_text(json.dumps({'stages': rows, 'errors': errors}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'act2Pools': len(act2_pools), 'act1Stage2Pools': len(next(r for r in rows if r['stage'] == 2)['pools']), 'screenshots': len(list(out.glob('*.png'))), 'errors': errors, 'output': str(out)}, ensure_ascii=False))
