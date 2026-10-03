"""Screenshot every campaign boundary using the real Game and Workshop renderers."""
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps, ImageDraw
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT = ROOT / '_local/reports/terrain-skirt' / (sys.argv[1] if len(sys.argv) > 1 else 'current')
OUT.mkdir(parents=True, exist_ok=True)
rows = []
errors = []

with sync_playwright() as p:
    browser = launch(p)
    game = browser.new_page(viewport={'width': 1440, 'height': 900})
    game.on('pageerror', lambda e: errors.append(str(e)))
    game.goto((ROOT / 'HONRO.html').as_uri())
    game.wait_for_function('window.HonroApp && window.HonroBounds')
    game.evaluate("""() => { HonroApp.frame=()=>{}; HonroApp.profile=HONRO_TOOLS.fresh();
      HonroApp.profile.recruited=['archer','mage','knight','occultist'];
      for(let id=1;id<21;id++)HonroApp.profile.cleared[id]={rounds:20}; }""")
    for sid in range(1, 21):
        for edge in ('left', 'right', 'top', 'bottom'):
            row = game.evaluate("""([sid,edge]) => { const a=HonroApp;
              a.launch(sid); while(a.dialogue) HonroStory.finish(a);
              a.turnNotice=null; a.banterCurrent=null;
              const b=a.engine.b,s=a.scene;
              const z=HonroBounds.zoomLimits(1440).min;
              Object.assign(s,{manual:true,storyTween:null,goalFocus:null,cinematic:null,
                x:edge==='left'?0:edge==='right'?b.width:b.width*.5,
                y:edge==='top'?0:edge==='bottom'?b.height:b.height*.46,
                scale:z,time:0});
              s.render(a.engine,0);
              const q=s._terrainSkirt;
              const candidateSpans=(edge==='left'||edge==='right')?b.terrain.filter(t=>!t.broken&&!t.oneWay&&!t.honroElementCollision).flatMap(t=>{
                const x=edge==='left'?.5:b.width-.5,pts=HONRO_CORE.poly(t),hits=[];
                for(let i=0;i<pts.length;i++){const a=pts[i],z=pts[(i+1)%pts.length];
                  if((a.x<=x&&z.x>x)||(z.x<=x&&a.x>x))hits.push(a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x));}
                hits.sort((a,z)=>a-z);const result=[];
                for(let i=0;i+1<hits.length;i+=2)result.push({terrain:t.id,top:Math.round(hits[i]),bottom:Math.round(hits[i+1]),mat:t.mat});
                return result;}).sort((a,z)=>a.top-z.top):[];
              return {stage:sid,edge,width:b.width,height:b.height,zoom:z,
                visualBounds:s.overscanStats?.bounds,
                skirtEdges:q?.edges?.map(v=>({side:v.side,terrain:v.t.id,top:v.top}))||[],
                candidateSpans,
                cave:!!b.honroCaveEnvelope}; }""", [sid, edge])
            game.locator('#battlecanvas').screenshot(path=str(OUT / f'stage-{sid:02d}-{edge}.png'))
            rows.append(row)
    # Workshop uses the same renderer; capture the reported Stage 2 failure in both views.
    editor = browser.new_page(viewport={'width': 1440, 'height': 900})
    editor.on('pageerror', lambda e: errors.append(str(e)))
    editor.goto((ROOT / 'HONRO_WORKSHOP.html').as_uri())
    editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
    editor.evaluate('HonroWorkshopAPI.selectStage("stage-2")')
    editor.evaluate('HonroWorkshopAPI.setCamera({x:4300,y:1500,zoom:1})')
    editor.locator('#stageCanvas').screenshot(path=str(OUT / 'workshop-stage-02-right.png'))
    browser.close()

assert not errors, errors
for edge in ('left', 'right', 'top', 'bottom'):
    ims = []
    for sid in range(1, 21):
        im = Image.open(OUT / f'stage-{sid:02d}-{edge}.png').convert('RGB')
        im.thumbnail((520, 325))
        panel = Image.new('RGB', (540, 350), '#eeeeee')
        panel.paste(im, ((540-im.width)//2, 18))
        ImageDraw.Draw(panel).text((8, 4), f'Stage {sid:02d} / {edge}', fill='#111111')
        ims.append(panel)
    sheet = Image.new('RGB', (540*4, 350*5), '#eeeeee')
    for i, im in enumerate(ims):
        sheet.paste(im, ((i%4)*540, (i//4)*350))
    sheet.save(OUT / f'contact-{edge}.jpg', quality=88)

(OUT / 'report.json').write_text(json.dumps({'views':rows,'errors':errors},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'screenshots':len(rows)+1,'errors':errors,'output':str(OUT)},ensure_ascii=False))
