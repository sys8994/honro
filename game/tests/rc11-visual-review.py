import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tests'))
from browser_support import browser_path
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
from PIL import Image, ImageOps, ImageDraw
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'_local/game-reports/rc11-map-review';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=browser_path(),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':900})
    page.set_content((ROOT/'HONRO.html').read_text(encoding='utf-8'),wait_until='load',timeout=120000)
    page.evaluate("()=>{HonroApp.profile.seen['map-story-v5-0']=true;HonroApp.profile.recruited=['archer','mage','knight','occultist'];HonroApp.profile.party=[...HonroApp.profile.recruited];}")
    for sid in range(1,11):
        page.evaluate("""sid=>{const a=HonroApp;a.close();a.profile.honroBattle=null;for(let i=1;i<sid;i++)a.profile.cleared[i]={};a.launch(sid);if(a.dialogue)HonroStory.finish(a);a.turnNotice=null;const tb=document.getElementById('turn-banner');if(tb)tb.hidden=true;const b=a.engine.b,A=b.honroMapAnchors||{},q=A.ritual||A.courtyard||A.basin||A.mudflat||A.resident2||A.ridge||A.exit||{x:b.width*.5,y:b.height*.55};a.scene.storyTween=null;a.scene.goalFocus=null;a.scene.cinematic=null;a.scene.manual=true;a.scene.x=q.x;a.scene.y=q.y-120;a.scene.scale=b.height>b.width?.31:(b.width/b.height>2.5?.40:.54);a.scene.render(a.engine,0,a.selected,.6,false,.02);}""",sid)
        page.locator('#battlecanvas').screenshot(path=str(OUT/f'stage-{sid:02d}.png'))
    browser.close()
# 5x2 contact sheet, purely for visual review.
thumbs=[]
for sid in range(1,11):
    im=Image.open(OUT/f'stage-{sid:02d}.png').convert('RGB')
    # centre crop preserving the rendered game frame
    im=ImageOps.fit(im,(480,280),method=Image.Resampling.LANCZOS)
    frame=Image.new('RGB',(480,310),'#0b151a');frame.paste(im,(0,30));d=ImageDraw.Draw(frame);d.text((12,9),f'STAGE {sid:02d}',fill='#d8c28f')
    thumbs.append(frame)
sheet=Image.new('RGB',(480*5,310*2),'#071116')
for i,im in enumerate(thumbs):sheet.paste(im,((i%5)*480,(i//5)*310))
sheet.save('/mnt/data/HONRO_RC11_VISUAL_REVIEW.jpg',quality=90)
