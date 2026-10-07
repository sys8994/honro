"""Capture and compare the authored Stage 3–6 places in Game and Stage View."""
import base64
import io
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

from browser_support import ROOT, launch

STAGES = (3, 4) if '--stage34' in sys.argv else range(3, 7)
OUT = ROOT / ('_local/reports/stage34-water-forest' if '--stage34' in sys.argv else '_local/reports/map-place')
OUT.mkdir(parents=True, exist_ok=True)
FOCUSES = {
    3: [('crossing', 2250, 2150), ('warehouse', 5500, 1650)],
    4: [('gate', 1030, 2250), ('burned-homes', 2200, 2750)],
    5: [('cliff', 1800, 2200), ('waterfall', 3050, 2750)],
    6: [('bridge-west', 2010, 2150), ('bridge-mid', 3150, 2500)],
}

def png(page, selector):
    data = page.locator(selector).evaluate('c=>c.toDataURL().split(",")[1]')
    return base64.b64decode(data)

errors = []
checks = []
with sync_playwright() as playwright:
    browser = launch(playwright)
    game = browser.new_page(viewport={'width': 1600, 'height': 900})
    game.on('pageerror', lambda error: errors.append(str(error)))
    game.goto((ROOT / 'HONRO.html').as_uri())
    game.wait_for_function('window.HonroApp && window.HONRO_PROJECT')
    game.evaluate('HonroApp.frame=()=>{}')
    editor = browser.new_page(viewport={'width': 1440, 'height': 900})
    editor.on('pageerror', lambda error: errors.append(str(error)))
    editor.goto((ROOT / 'HONRO_WORKSHOP.html').as_uri())
    editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
    editor.add_style_tag(content='#stageView .canvas-wrap{position:fixed;left:0;top:0;width:960px;height:540px;z-index:99}#stageToolbar,.canvas-help,.hud-overlay{display:none!important}')
    game.add_style_tag(content='.battle-view{position:fixed!important;left:0!important;top:0!important;width:960px!important;height:540px!important}#battlecanvas{width:960px!important;height:540px!important}')
    editor.evaluate('HonroWorkshopAPI.setOverlay(false)')
    for sid in STAGES:
        stage = game.evaluate('sid=>HONRO_PROJECT.stages[sid-1]', sid)
        camera = {'x': stage['width']/2, 'y': stage['height']/2,
                  'zoom': min(920/stage['width'], 490/stage['height'])}
        editor.evaluate('sid=>HonroWorkshopAPI.selectStage("stage-"+sid)', sid)
        editor.evaluate('camera=>HonroWorkshopAPI.setCamera(camera)', camera)
        actual = editor.evaluate('HonroWorkshopAPI.getEditorState().stageView')
        game.evaluate('''([sid,camera])=>{const a=HonroApp,st=HONRO_PROJECT.stages[sid-1];
          a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(st)};
          for(let i=1;i<=10;i++)a.profile.cleared[i]={};
          // Compare the same authored instant. Finishing an intro now moves
          // its cast; the editor preview has not played that choreography.
          a.launchMap(HONRO_PROJECT,'stage-'+sid,{story:false,profile:a.profile});a.turnNotice=null;
          Object.assign(a.scene,{time:0,walkTime:0,manual:true,storyTween:null,goalFocus:null,
            cinematic:null,x:camera.x,y:camera.y,scale:camera.zoom});
          a.scene.render(a.engine,0,'',.6,false,0);
        }''', [sid, actual])
        if sid == 3 and '--stage34' in sys.argv:
            layer_alpha = game.evaluate('''()=>{const s=HonroApp.scene,
              cv=document.createElement('canvas'),c=cv.getContext('2d'),draw=s.landmark,rows={};
              s.landmark=(ctx,l)=>{rows[l.id]=ctx.globalAlpha};
              try{
                s._landmarkLayer(c,[{id:'distant',layer:'back'}],'back');
                s._landmarkLayer(c,[{id:'rock',layer:'prop',asset:{category:'rock'}},
                  {id:'ordinary',layer:'prop'}],'prop');
              }finally{s.landmark=draw}
              return rows;}''')
            assert layer_alpha['distant'] < .4 and layer_alpha['rock'] == 1 and layer_alpha['ordinary'] < 1, layer_alpha
            checks.append({'layerOpacity': layer_alpha})
        owner = Image.open(io.BytesIO(png(game, '#battlecanvas'))).convert('RGBA')
        workshop = Image.open(io.BytesIO(png(editor, '#stageCanvas'))).convert('RGBA')
        difference = ImageChops.difference(owner, workshop).convert('RGB')
        pixels = difference.get_flattened_data() if hasattr(difference, 'get_flattened_data') else difference.getdata()
        changed = sum(max(pixel)>3 for pixel in pixels)
        ratio = changed / (owner.width * owner.height)
        assert ratio < .0001, (sid, ratio)
        owner.save(OUT / f'stage-{sid}-overview.png')
        checks.append({'stage': sid, 'gameStageViewDifferentPixels': changed,
                       'ratio': ratio, 'groundTopNodes': stage['detailStats']['groundTop']})
        print('PASS Stage', sid, 'Game / Stage View', changed, 'different pixels', flush=True)
    # Capture art at the actual full Game viewport after the pixel comparison.
    game.reload()
    game.wait_for_function('window.HonroApp && window.HONRO_PROJECT')
    game.evaluate('HonroApp.frame=()=>{}')
    for sid in STAGES:
        game.evaluate('''sid=>{const a=HonroApp,st=HONRO_PROJECT.stages[sid-1];
          a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(st)};
          for(let i=1;i<=10;i++)a.profile.cleared[i]={};
          a.launch(sid);if(a.dialogue)HonroStory.finish(a);a.turnNotice=null;
          Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,cinematic:null,
            x:st.width/2,y:st.height/2,scale:Math.min(1520/st.width,810/st.height),time:0,walkTime:0});
          a.scene.render(a.engine,0,'',.6,false,0);
        }''', sid)
        (OUT / f'stage-{sid}-overview.png').write_bytes(png(game, '#battlecanvas'))
        for name, x, y in FOCUSES[sid]:
            scale = .48 if sid in (5, 6) else .66
            game.evaluate('''([x,y,scale])=>{const a=HonroApp;
              Object.assign(a.scene,{manual:true,x,y,scale,time:0,walkTime:0});
              a.scene.render(a.engine,0,'',.6,false,0)}''', [x,y,scale])
            (OUT / f'stage-{sid}-{name}.png').write_bytes(png(game, '#battlecanvas'))
        if sid == 3 and '--stage34' in sys.argv:
            zoom_keys = []
            for label, scale in [('wide', .22), ('normal', .66)]:
                key = game.evaluate('''scale=>{const a=HonroApp,s=a.scene;
                  Object.assign(s,{manual:true,x:2250,y:2150,scale,time:0});
                  s.render(a.engine,0,'',.6,false,0);
                  return s._backgroundCache.key;}''', scale)
                zoom_keys.append(key)
                (OUT / f'stage-3-crossing-zoom-{label}.png').write_bytes(png(game, '#battlecanvas'))
            assert zoom_keys[0] != zoom_keys[1], 'forest background cache did not follow zoom'
            checks.append({'stage': 3, 'zoomBackgroundRebuilt': True})
            for phase_time, label in [(0, 'still'), (1.2, 'flow')]:
                game.evaluate('''t=>{const a=HonroApp;Object.assign(a.scene,
                  {manual:true,x:2250,y:2150,scale:.66,time:t});
                  a.scene.render(a.engine,0,'',.6,false,0)}''', phase_time)
                (OUT / f'stage-3-crossing-{label}.png').write_bytes(png(game, '#battlecanvas'))
            frames = []
            for index in range(12):
                game.evaluate('''t=>{const a=HonroApp;Object.assign(a.scene,
                  {manual:true,x:2250,y:2150,scale:.66,time:t});
                  a.scene.render(a.engine,0,'',.6,false,0)}''', index * .12)
                frame = Image.open(io.BytesIO(png(game, '#battlecanvas'))).convert('RGB')
                frames.append(frame.crop((530, 545, 1330, 635)).quantize(colors=128))
            frames[0].save(OUT / 'stage-3-water-motion.gif', save_all=True,
                           append_images=frames[1:], duration=120, loop=0, optimize=True)
            phase = game.evaluate('''()=>{const a=HonroApp,src=a.engine.b;
              Object.assign(a.scene,{manual:true,x:2250,y:2150,scale:.66,time:0});
              const draw=t=>{const cv=document.createElement('canvas');cv.width=1120;cv.height=90;
                const q=cv.getContext('2d');q.translate(-1890,-2425);a.scene.time=t;
                a.scene.liveWater(q,src);return cv.toDataURL().split(',')[1]};
              return [draw(0),draw(1.2)];}''')
            overlays = [Image.open(io.BytesIO(base64.b64decode(item))).convert('RGBA') for item in phase]
            background = Image.new('RGBA', overlays[0].size, '#102a2d')
            images = [Image.alpha_composite(background, item).convert('RGB') for item in overlays]
            difference = ImageChops.difference(*images)
            pixels = difference.get_flattened_data() if hasattr(difference, 'get_flattened_data') else difference.getdata()
            changed = sum(max(pixel)>4 for pixel in pixels)
            assert changed > 300, f'water motion frozen: {changed} pixels'
            for index, img in enumerate(images):
                img.save(OUT / f'stage-3-water-phase-{index}.png')
            checks.append({'stage': 3, 'waterMotionPixels': changed})
            print('PASS Stage 3 visible vector water motion', changed, 'pixels', flush=True)
            ripples = game.evaluate('''()=>{const a=HonroApp,s=a.scene,b=a.engine.b,
              unit=b.units.find(u=>u.id==='p-archer'),x=unit.x,y=unit.y;
              const cv=document.createElement('canvas');cv.width=1100;cv.height=90;
              const q=cv.getContext('2d');q.translate(-1900,-2425);
              s.time=2;s.liveWater(q,b);unit.x=2400;unit.y=2447;
              s.time=2.1;s.liveWater(q,b);const count=s._waterRipples.length;
              unit.x=x;unit.y=y;s._waterRipples=[];return count;}''')
            assert ripples > 0, 'landing did not create a local ripple'
            checks.append({'stage': 3, 'landingRipples': ripples})
        if '--stage34' in sys.argv:
            measured = game.evaluate('''()=>{const a=HonroApp,s=a.scene;
              s.render(a.engine,0,'',.6,false,0);const before=s.renderCacheStats(),times=[];
              for(let i=0;i<24;i++){const start=performance.now();
                s.render(a.engine,0,'',.6,false,1/30);times.push(performance.now()-start)}
              times.sort((a,b)=>a-b);const after=s.renderCacheStats();
              return {p95Ms:times[Math.floor(times.length*.95)],worldRebuilds:after.worldBuilds-before.worldBuilds,
                backgroundRebuilds:after.bgBuilds-before.bgBuilds}}''')
            assert measured['worldRebuilds'] == 0 and measured['backgroundRebuilds'] == 0, measured
            checks.append({'stage': sid, 'movingScenePerformance': measured})
            print('PASS Stage', sid, 'moving scene cache', measured, flush=True)
    editor.reload()
    editor.wait_for_function('window.HonroWorkshopAPI')
    for sid in STAGES:
        editor.evaluate('sid=>HonroWorkshopAPI.selectStage("stage-"+sid)', sid)
        editor.click('[data-tab="play"]')
        editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
        play = editor.frames[1]
        play.on('pageerror', lambda error: errors.append(str(error)))
        actual = play.evaluate('''()=>{const a=HonroApp;return {stage:a.engine.b.honroStage,
          placeRevision:HONRO_PROJECT.stages[a.engine.b.honroStage-1].metadata.placeRevision,
          terrain:a.engine.b.terrain.length,landmarks:a.engine.b.honroLandmarks.length}}''')
        assert actual['stage'] == sid and actual['placeRevision'] == 1, actual
        checks.append({'stage': sid, 'playtest': actual})
        print('PASS Stage', sid, 'Workshop Playtest', actual, flush=True)
        editor.click('#stopPlay')
    browser.close()

assert not errors, errors
(OUT / 'browser.json').write_text(json.dumps({'checks': checks, 'errors': errors},
                               ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
cards = []
for sid in STAGES:
    before = ROOT / f'_local/reports/map-gap/overview-stage-{sid}.png'
    images = [(f'현재 {sid}장', f'stage-{sid}-overview.png')]
    if before.exists():
        images.insert(0, (f'이전 {sid}장', f'../map-gap/overview-stage-{sid}.png'))
    images += [(name, f'stage-{sid}-{name}.png') for name, _, _ in FOCUSES[sid]]
    if sid == 3 and '--stage34' in sys.argv:
        images += [('나루 · 넓은 줌 0.22', 'stage-3-crossing-zoom-wide.png'),
                   ('나루 · 보통 줌 0.66', 'stage-3-crossing-zoom-normal.png'),
                   ('나루 물 흐름 · 실제 게임 화면', 'stage-3-water-motion.gif')]
    figures = ''.join(f'<figure><figcaption>{label}</figcaption><img src="{source}"></figure>'
                      for label, source in images)
    cards.append(f'<section><h2>{sid}장</h2><div>{figures}</div></section>')
(OUT / 'index.html').write_text('''<!doctype html><html lang="ko"><meta charset="utf-8">
<title>HONRO 3–6장 장소 검수</title><style>body{background:#111b1d;color:#e2dfd5;font:16px system-ui;margin:28px}
h1{font-size:25px}p{color:#bcc9c2}section{border-top:1px solid #53645c;padding:18px 0}
section>div{display:grid;grid-template-columns:1fr 1fr;gap:18px}figure{margin:0;min-width:0}
figcaption{padding:7px}img{display:block;width:100%;background:#081012}</style>
<h1>HONRO 3–6장 장소 검수</h1><p>실제 Game 캔버스. 이전 전체 장면과 현재 전체·주요 지점을 비교합니다.</p>'''
    + ''.join(cards) + '</html>', encoding='utf-8')
