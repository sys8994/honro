import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tests'))
from browser_support import browser_path
from pathlib import Path
import shutil, json, math
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
HTML=(ROOT/'HONRO.html').read_text(encoding='utf-8')
OUT=ROOT/'_local/game-reports/rc5-ui';OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def ck(cond,name,detail=None):
    assert cond,(name,detail);checks.append({'name':name,'detail':detail});print('PASS',name,detail or '')
def finish_dialogue(page):
    for _ in range(80):
        if not page.evaluate('!!HonroApp.dialogue'): return
        page.evaluate('HonroStory.finish(HonroApp)');page.wait_for_timeout(15)
    raise AssertionError('dialogue did not finish')
def prep_stage(page,stage):
    page.evaluate("""s=>{const a=HonroApp;a.profile.seen['map-story-v5-0']=true;for(let i=1;i<s;i++)a.profile.cleared[i]={};a.profile.recruited=['archer'];if(s>=3)a.profile.recruited.push('mage');if(s>=6)a.profile.recruited.push('knight');a.profile.party=[...a.profile.recruited];for(const c of a.profile.recruited)a.profile.heroes[c].xp=HONRO_CORE.xpAtLevel(Math.max(1,s));a.launch(s)}""",stage)
    page.wait_for_timeout(220);finish_dialogue(page);page.wait_for_timeout(250)
with sync_playwright() as p:
    chromium=browser_path()
    browser=p.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':900})
    page.set_content(HTML,wait_until='load');page.wait_for_timeout(250)
    page.get_by_role('button',name='길을 열다',exact=True).click();page.wait_for_timeout(220)
    # Narration and dialogue are distinct, line-by-line, and next button is high contrast.
    ck(page.locator('.narration-overlay').count()==1,'intro starts in narration UI')
    narration=page.locator('#story-line').inner_text();ck('북쪽 산길' in narration,'intro narration establishes only current anomaly',narration)
    page.screenshot(path=str(OUT/'intro-narration.png'))
    page.locator('[data-action="dialogue-next"]').click();page.wait_for_timeout(120)
    ck(page.locator('.story-scene.dialogue-scene').count()==1 and page.locator('.narration-overlay').count()==0,'dialogue uses separate portrait UI')
    ck(page.locator('#story-speaker').inner_text().strip()=='주막주인','one speaker is shown at a time')
    ck('연목 나루라 했지?' in page.locator('#story-line').inner_text(),'dialogue is one utterance, not a transcript dump')
    style=page.locator('.story-actions .primary').evaluate("e=>({bg:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color,opacity:getComputedStyle(e).opacity})")
    ck(style['opacity']=='1' and style['bg']!='rgba(0, 0, 0, 0)','next button is visibly styled',style)
    page.screenshot(path=str(OUT/'intro-dialogue.png'))

    # Stage 2 preserves original high-cliff scale.
    finish_dialogue(page);prep_stage(page,2)
    size=page.evaluate("()=>({w:HonroApp.engine.b.width,h:HonroApp.engine.b.height,a:HonroApp.engine.b.units.find(u=>u.cls==='archer'&&u.side===0).y,b:HonroApp.engine.b.units.find(u=>u.id==='objective').y})")
    ck(size['h']==6000 and size['b']-size['a']>4000,'stage 2 is a true high-cliff overwatch map',size)
    page.evaluate("()=>{const a=HonroApp;a.turnNotice=null;const n=document.querySelector('#turn-banner');if(n)n.hidden=true}")
    page.screenshot(path=str(OUT/'stage2-sniper.png'))

    # In-game speaker camera tween. Start from Seolo high cliff, then focus Damheo below.
    before=page.evaluate("()=>({x:HonroApp.scene.x,y:HonroApp.scene.y,s:HonroApp.scene.scale})")
    page.evaluate("()=>HonroStory.start(HonroApp,[['담허','카메라 확인을 위한 한 줄이다.']],{title:'대화 카메라'})")
    immediate=page.evaluate("()=>({x:HonroApp.scene.x,y:HonroApp.scene.y,s:HonroApp.scene.scale,t:!!HonroApp.scene.storyTween})")
    page.wait_for_timeout(250)
    mid=page.evaluate("()=>({x:HonroApp.scene.x,y:HonroApp.scene.y,s:HonroApp.scene.scale})")
    page.wait_for_timeout(360)
    final=page.evaluate("""()=>{const a=HonroApp,u=a.engine.b.units.find(u=>u.name==='담허'),cv=document.querySelector('#battlecanvas').getBoundingClientRect(),sc=a.scene.scale;return{x:a.scene.x,y:a.scene.y,s:sc,screenX:cv.width/2+(u.x-a.scene.x)*sc,screenY:cv.height/2+(u.y-u.h*.48-a.scene.y)*sc,w:cv.width,h:cv.height}}""")
    moved=math.hypot(mid['x']-before['x'],mid['y']-before['y'])>50 and math.hypot(final['x']-mid['x'],final['y']-mid['y'])>50
    ck(immediate['t'] and moved,'dialogue camera transitions continuously over time',{'before':before,'mid':mid,'final':final})
    ck(abs(final['screenX']/final['w']-.5)<.03 and .57<final['screenY']/final['h']<.68,'speaker lands horizontally centered and slightly below vertical center',{'xRatio':final['screenX']/final['w'],'yRatio':final['screenY']/final['h']})
    page.screenshot(path=str(OUT/'dialogue-camera-damheo.png'))
    finish_dialogue(page)

    # No mystery top-right action buttons in battle.
    buttons=page.locator('.battle-screen button').evaluate_all("els=>els.map(e=>{const r=e.getBoundingClientRect();return {text:e.innerText,aria:e.getAttribute('aria-label'),x:r.x,y:r.y,w:r.width,h:r.height}}).filter(x=>x.x>innerWidth*.62&&x.y<180)")
    ck(len(buttons)==0,'no unexplained upper-right battle buttons',buttons)

    # ESC pause buttons vertically stacked on desktop.
    page.keyboard.press('Escape');page.wait_for_timeout(120)
    pbuttons=page.locator('.pause-menu>button')
    boxes=[pbuttons.nth(i).bounding_box() for i in range(pbuttons.count())]
    ck(len(boxes)>=5 and all(abs(b['x']-boxes[0]['x'])<2 and abs(b['width']-boxes[0]['width'])<2 for b in boxes) and all(boxes[i+1]['y']>boxes[i]['y'] for i in range(len(boxes)-1)),'desktop ESC menu is one vertical stack',boxes)
    page.screenshot(path=str(OUT/'pause-desktop.png'))
    page.get_by_role('button',name='돌아가기',exact=True).click();page.wait_for_timeout(80)

    # Turn banners are suppressed for absent sides.
    skipped=page.evaluate("""()=>{const a=HonroApp,b=a.engine.b;for(const u of b.units)if(u.side===1)u.dead=true;b.phase='enemy';b.side=1;HonroStory.turn(a,true);const enemy=document.querySelector('#turn-banner')?.hidden!==false;for(const u of b.units)u.honroAlly=false;b.honroState.allyQueue={ids:[],index:0};b.phase='ally';b.side=0;HonroStory.turn(a,true);const ally=document.querySelector('#turn-banner')?.hidden!==false;return{enemy,ally,enemyLabel:HonroStory.turnLabel({...b,phase:'enemy',side:1}),allyLabel:HonroStory.turnLabel(b)}}""")
    ck(skipped['enemy'] and skipped['ally'] and skipped['enemyLabel']=='' and skipped['allyLabel']=='','absent enemy/ally phases show no turn announcement',skipped)

    # Named ally uses detailed party rig; generic allies remain actual human models, not object placeholders.
    detail=page.evaluate("""()=>{const b=HonroApp.engine.b;return{damheo:b.units.find(u=>u.name==='담허')?.id,allies:b.units.filter(u=>u.honroAlly||u.honroCivilian).map(u=>({name:u.name,type:u.honroType,cls:u.cls}))}}""")
    ck(detail['damheo']=='npc-damheo' and all(x['type']!='campaign-object' for x in detail['allies']),'allied cast uses human character models',detail)

    # Mobile contextual interaction button above bottom HUD, actual click executes ledger.
    mob=browser.new_page(viewport={'width':412,'height':915},is_mobile=True,has_touch=True)
    mob.set_content(HTML,wait_until='load');mob.wait_for_timeout(220);prep_stage(mob,3)
    result=mob.evaluate("""()=>{const a=HonroApp,b=a.engine.b,u=a.engine.active,m=b.honroMarkers.find(m=>m.action==='ledger');u.x=m.x;u.y=HonroWorld.top(b,m.x);u.acted=false;u.moveLeft=u.maxMove;b.phase='aim';b.side=0;HonroInteractions.refresh(a);const host=document.querySelector('#context-interact'),btn=host?.querySelector('button'),hud=document.querySelector('.honro-compact-hud'),br=host?.getBoundingClientRect(),hr=hud?.getBoundingClientRect();return{visible:!!btn&&!host.hidden,above:!!br&&!!hr&&br.bottom<hr.top+4,label:btn?.innerText,disabled:btn?.disabled,br:br&&{top:br.top,bottom:br.bottom,height:br.height},hr:hr&&{top:hr.top,bottom:hr.bottom,height:hr.height},vh:innerHeight}}""")
    print('MOBILE GEOM',result);ck(result['visible'] and result['above'] and not result['disabled'],'mobile contextual interaction is visible above HUD',result)
    mob.locator('#context-interact button').tap();mob.wait_for_timeout(80)
    ck(mob.evaluate('HonroApp.engine.b.honroState.ledger===true'),'mobile interaction button executes same story action as E')
    mob.screenshot(path=str(OUT/'mobile-interaction.png'))
    browser.close()
(OUT/'audit.json').write_text(json.dumps({'passed':len(checks),'checks':checks},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'passed':len(checks),'report':str(OUT/'audit.json')},ensure_ascii=False))
