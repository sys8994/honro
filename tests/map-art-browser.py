"""Measure decorative path anchors and capture actual Game map art for visual review."""
import base64
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT = ROOT / '_local/reports/map-art'
OUT.mkdir(parents=True, exist_ok=True)
BASELINE = ROOT / 'tests/fixtures/map-art-baseline.json'
mode = sys.argv[1] if len(sys.argv) > 1 else 'current'

AUDIT = r'''()=>{
  const a=HonroApp, cv=document.createElement('canvas');cv.width=1600;cv.height=900;
  const c=cv.getContext('2d'), names=['moveTo','lineTo','quadraticCurveTo','bezierCurveTo','arc','ellipse','rect','fillRect','strokeRect'];
  const counts={};let tally=0;
  for(const name of names){const old=c[name].bind(c);c[name]=(...args)=>{tally+=name==='arc'||name==='ellipse'?4:name==='rect'||name==='fillRect'||name==='strokeRect'?4:1;return old(...args);};}
  const captures=[];
  for(let stage=1;stage<=10;stage++){
    a.launchMap(HONRO_PROJECT,'stage-'+stage,{story:false});a.dialogue=null;a.turnNotice=null;
    const b=a.engine.b, scene=a.scene;scene.time=0;scene.x=0;
    const key='background:'+stage;tally=0;scene.theme=b.honroBackdrop;scene.background(c,1600,900,b);counts[key]=tally;
    for(const l of b.honroLandmarks){const id=l.kind==='canonical-element'?l.asset.id:l.kind;
      if(counts['element:'+id]!==undefined)continue;
      c.clearRect(0,0,1600,900);tally=0;scene.landmark(c,{...l,x:800,y:720,size:l.size||1,scale:l.scale||1});counts['element:'+id]=tally;
      if(['oldGate','funeralGate','royalGate','waterShrine','greatTree','ritualDais','rootShrine','burnedHouses','mockup-granite-large'].includes(id))captures.push({id,data:cv.toDataURL().split(',')[1]});
    }
  }
  return {counts,captures};
}'''
FINGERPRINT = r'''()=>{const cv=document.createElement('canvas');cv.width=960;cv.height=540;
  const c=cv.getContext('2d'),s=Object.create(HonroScene.prototype);s.x=210;s.time=0;s.theme='shrine';
  s.background(c,960,540,{honroStage:10,honroBackdrop:'shrine'});
  s.landmark(c,{kind:'oldGate',x:210,y:500,size:1});
  s.landmark(c,{kind:'rootShrine',x:680,y:510,size:.72});
  return cv.toDataURL();}'''

with sync_playwright() as p:
    browser = launch(p)
    page = browser.new_page(viewport={'width': 1600, 'height': 900}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto((ROOT / 'HONRO.html').as_uri())
    page.wait_for_function('window.HonroApp && window.HONRO_PROJECT')
    page.evaluate('HonroApp.frame=()=>{}')
    result = page.evaluate(AUDIT)
    game_fingerprint = page.evaluate(FINGERPRINT)
    for row in result.pop('captures'):
        (OUT / f'{mode}-{row["id"].replace(":", "-")}.png').write_bytes(base64.b64decode(row['data']))
    focuses = {1: (2050, 1510), 2: (1300, 1800), 3: (1800, 2050), 4: (2500, 2450),
               5: (3250, 2900), 6: (3150, 2500), 7: (1850, 4100), 8: (3900, 2250),
               9: (1800, 2485), 10: (2500, 2200)}
    extras = {'stage-1-gate': (1, 4000, 960), 'stage-4-gate': (4, 1060, 2300),
              'stage-7-shrine': (7, 1700, 1510), 'stage-10-entrance': (10, 550, 2890)}
    for name, (stage, x, y) in {**{f'stage-{n}': (n, *pt) for n, pt in focuses.items()}, **extras}.items():
        page.evaluate('''p=>{const [stage,x,y]=p;const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-'+stage,{story:false});a.dialogue=null;a.turnNotice=null;
          const b=a.engine.b;
          Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,cinematic:null,x,y,scale:.66,time:0,walkTime:0});
          a.scene.render(a.engine,0,'',.6,false,0);
        }''', [stage, x, y])
        data = page.locator('#battlecanvas').evaluate('c=>c.toDataURL().split(",")[1]')
        (OUT / f'{mode}-{name}.png').write_bytes(base64.b64decode(data))
    editor = browser.new_page(viewport={'width': 1365, 'height': 768})
    editor.on('pageerror', lambda e: errors.append(str(e)))
    editor.goto((ROOT / 'HONRO_WORKSHOP.html').as_uri())
    editor.wait_for_function('window.HonroWorkshopAPI')
    assert editor.evaluate(FINGERPRINT) == game_fingerprint, 'Game and Stage View scenery pixels differ'
    editor.evaluate('HonroWorkshopAPI.selectStage("stage-10")')
    editor.evaluate('HonroWorkshopAPI.setCamera({x:2500,y:2200,zoom:.66})')
    editor.screenshot(path=str(OUT / f'{mode}-workshop-stage-10.png'))
    editor.click('[data-tab="play"]')
    editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
    play = editor.frames[1]
    assert play.evaluate(FINGERPRINT) == game_fingerprint, 'Game and Playtest scenery pixels differ'
    for _ in range(20):
        skip = play.locator('[data-action="dialogue-skip"]')
        if skip.count():
            skip.click()
        play.wait_for_timeout(80)
        if play.evaluate('!!HonroApp.canInput()'):
            break
    play.evaluate('''()=>{const a=HonroApp;a.frame=()=>{};a.dialogue=null;a.turnNotice=null;
      Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,cinematic:null,x:2500,y:2200,scale:.66,time:0,walkTime:0});
      a.scene.render(a.engine,0,'',.6,false,0);}''')
    play.locator('#battlecanvas').screenshot(path=str(OUT / f'{mode}-playtest-canvas-10.png'))
    editor.screenshot(path=str(OUT / f'{mode}-workshop-playtest-10.png'))
    browser.close()

if errors:
    raise AssertionError(errors)
if mode == 'baseline':
    BASELINE.write_text(json.dumps(result['counts'], ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
else:
    baseline = json.loads(BASELINE.read_text(encoding='utf-8'))
    # HBUG-057 deliberately replaced Stage 4's sparse backdrop with a layered night forest.
    # Stage 5/6 now render their authored L2-L4 forest/cliff placements rather
    # than the old nearly empty screen-space backdrop. The separate depth
    # browser audit measures their real frame cost and culling.
    revised_background_budget = {'background:4': 12000, 'background:5': 2000, 'background:6': 1500,
                                 'background:8': 1000, 'background:10': 1000}
    excess = {k: {'before': v, 'after': result['counts'].get(k)} for k, v in baseline.items()
              if k not in result['counts'] or result['counts'][k] > max(v * 2, revised_background_budget.get(k, 0))}
    result['excess'] = excess
    if excess:
        raise AssertionError(excess)
(OUT / f'{mode}-metrics.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
if mode == 'current':
    names = [p.name.removeprefix('current-') for p in sorted(OUT.glob('current-*.png'))]
    cards = ''.join(f'<article><h2>{name.removesuffix(".png").replace("-", " ")}</h2>'
                    f'<div><figure><figcaption>수정 전</figcaption><img src="baseline-{name}"></figure>'
                    f'<figure><figcaption>현재</figcaption><img src="current-{name}"></figure></div></article>'
                    for name in names if (OUT / f'baseline-{name}').exists())
    (OUT / 'index.html').write_text('''<!doctype html><html lang="ko"><meta charset="utf-8">
<title>HONRO 맵 장식 전후 검토</title><style>body{background:#11191b;color:#dedbd0;font:15px system-ui;margin:32px}
h1{font-size:25px}p{color:#aebbb4}article{border-top:1px solid #4a5954;padding:22px 0}article>div{display:grid;grid-template-columns:1fr 1fr;gap:16px}
figure{margin:0;min-width:0}img{width:100%;background:#081012}figcaption{padding:8px}h2{font-size:18px}</style>
<h1>HONRO 맵 장식·원경 시각 검토</h1><p>같은 전장 시점과 개별 장식을 수정 전후로 비교합니다. 실제 그림은 Game에서 캡처했습니다.</p>'''
        + cards + '</html>', encoding='utf-8')
print(f'Map art {mode}: {len(result["counts"])} assets/layers; browser errors {len(errors)}', flush=True)
