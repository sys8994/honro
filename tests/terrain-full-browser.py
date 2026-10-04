"""Capture every campaign stage along its playable route for visual terrain review."""
import json
import sys
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

label = sys.argv[1] if len(sys.argv) > 1 else 'current'
stage_ids = [int(value) for value in sys.argv[2:]] if len(sys.argv) > 2 else list(range(1, 21))
out = ROOT / '_local/reports/terrain-full' / label
out.mkdir(parents=True, exist_ok=True)
errors, rows, lower_seams, backdrop_seams = [], [], [], []
lower_tier_samples = {13: 4, 14: 6, 15: 4, 19: 4}

with sync_playwright() as p:
    browser = launch(p)
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto((ROOT / 'HONRO.html').as_uri())
    page.wait_for_function('window.HonroApp && window.HONRO_PROJECT')
    page.evaluate("""() => { HonroApp.frame=()=>{};HonroApp.profile=HONRO_TOOLS.fresh();
      HonroApp.profile.recruited=['archer','mage','knight','occultist'];
      for(let id=1;id<=20;id++)HonroApp.profile.cleared[id]={rounds:20}; }""")
    for sid in stage_ids:
        page.evaluate("""id => {const a=HonroApp;a.launch(id);
          while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;a.banterCurrent=null;
          a.modal.classList.remove('open');a.scene.storyTween=null;a.scene.goalFocus=null;
          a.scene.cinematic=null;a.scene.manual=true;
          HonroStory.tick(a,performance.now()+5000);
          document.getElementById('turn-banner')?.remove();}""", sid)
        samples = page.evaluate("""() => {const b=HonroApp.engine.b,st=HONRO_PROJECT.stages[b.honroStage-1],
          route=(st.routes||[]).filter(p=>p.x>=0&&p.x<=b.width);
          const n=b.honroStage===2?11:7;
          return Array.from({length:n},(_,j)=>{const index=Math.round(j*(route.length-1)/(n-1)),
            x=120+(b.width-240)*j/(n-1),
            floor=b.terrain.filter(t=>!t.honroCeiling&&!t.oneWay&&t.x<=x&&x<=t.x+t.w)
              .map(t=>HONRO_CORE.topAt(t,x,b.height)).sort((a,z)=>a-z)[0]||b.height*.65,
            p=route.length?route[index]:{x,y:floor};
            return {x:p.x,y:p.y,routeIndex:route.length?index:-1};});}""")
        extra = page.evaluate("""() => {const b=HonroApp.engine.b;
          return [.22,.5,.78].map((f,j)=>{const x=b.width*f,ys=b.terrain.filter(t=>
            !t.broken&&!t.honroCeiling&&!t.honroElementCollision&&t.w>80&&t.x<=x&&x<=t.x+t.w)
            .map(t=>HONRO_CORE.topAt(t,x,0)).filter(Number.isFinite).sort((a,z)=>a-z);
            return ys.length>1&&ys.at(-1)-ys[0]>280?{x,y:ys[0],routeIndex:-2-j}:null;
          }).filter(Boolean);}""")
        samples.extend(extra)
        for j, pos in enumerate(samples):
            state = page.evaluate("""v=>{const a=HonroApp,s=a.scene,b=a.engine.b;
              Object.assign(s,{manual:true,storyTween:null,goalFocus:null,cinematic:null,
                x:v.x,y:v.y-140,scale:.53,time:0});s.render(a.engine,0);a.updateHUD(true);
              return {x:s.x,y:s.y,scale:s.scale,width:b.width,height:b.height};}""", pos)
            path = out / f'stage-{sid:02d}-{j:02d}.png'
            page.locator('#battlecanvas').screenshot(path=str(path))
            rows.append({'stage':sid,'sample':j,'route':pos,'camera':state,'image':path.name})
            if sid in [16, 17, 18] and j == 0:
                im=Image.open(path).convert('RGB')
                edge_x=round(im.width/2-state['x']*state['scale'])
                contrast=sum(max(abs(a-b) for a,b in zip(im.getpixel((edge_x-12,y)),im.getpixel((edge_x+12,y)))) for y in range(180,361))/181
                backdrop_seams.append({'stage':sid,'meanContrast':round(contrast,2)})
                assert contrast<3, f'Stage {sid}: cave background ends at play boundary ({contrast:.1f})'
            if lower_tier_samples.get(sid) == j:
                # Compare the open cave on both sides of world x=0. A former
                # upper-bench support painted a full-height vertical rock wall.
                im=Image.open(path).convert('RGB')
                edge_x=round(im.width/2-state['x']*state['scale'])
                differences=[max(abs(a-b) for a,b in zip(im.getpixel((edge_x-12,y)),im.getpixel((edge_x+12,y)))) for y in range(180,441)]
                contrast=sum(differences)/len(differences)
                lower_seams.append({'stage':sid,'sample':j,'meanContrast':round(contrast,2),'maxContrast':max(differences)})
                assert contrast<12 and max(differences)<30, f'Stage {sid}: lower cave edge is a vertical wall ({contrast:.1f})'
        panels=[]
        for j in range(len(samples)):
            img=Image.open(out / f'stage-{sid:02d}-{j:02d}.png').convert('RGB')
            img.thumbnail((576,360))
            panel=Image.new('RGB',(596,390),'#ddd')
            panel.paste(img,((596-img.width)//2,20))
            ImageDraw.Draw(panel).text((9,4),f'{sid:02d} / {j:02d} / x={samples[j]["x"]:.0f} y={samples[j]["y"]:.0f}',fill='#111')
            panels.append(panel)
        sheet=Image.new('RGB',(596*4,390*((len(panels)+3)//4)),'#ddd')
        for j,img in enumerate(panels):sheet.paste(img,((j%4)*596,(j//4)*390))
        sheet.save(out / f'stage-{sid:02d}-contact.jpg',quality=90)
    browser.close()

(out / 'audit.json').write_text(json.dumps({'views':rows,'lowerSeams':lower_seams,'backdropSeams':backdrop_seams,'errors':errors},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert not errors, errors
print(json.dumps({'screenshots':len(rows),'stages':len(stage_ids),'lowerSeamChecks':len(lower_seams),'backdropSeamChecks':len(backdrop_seams),'errors':errors,'output':str(out)},ensure_ascii=False))
