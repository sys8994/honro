"""Actual exit crossing, saved-exit recovery and visible resource bars in both HTMLs.
Exit fixtures begin near the goal; this does not claim a full manual combat run.
"""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/progress-hud';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,detail or '',flush=True)
def load(page):
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((ROOT/'HONRO.html').as_uri());page.wait_for_function('window.HonroApp')
def skip(page):
    page.locator('[data-action="dialogue-skip"]').click()
def reach_outcome(page,walk=False):
    owner=page if hasattr(page,'keyboard') else page.page
    try:
        for _ in range(48):
            # A frame can open the outro between two browser queries. Read the
            # dialogue once so this harness never skips the outcome it awaits.
            dialogue=page.evaluate('({present:!!HonroApp.dialogue,after:HonroApp.dialogue?.after})')
            if dialogue.get('after')=='outcome':return
            if dialogue['present']:
                owner.keyboard.up('d');skip(page)
            elif walk:
                page.locator('#battlecanvas').focus();owner.keyboard.down('d')
            page.wait_for_timeout(180)
        raise AssertionError(page.evaluate('({phase:HonroApp.engine.b.phase,dialogue:HonroApp.dialogue,x:HonroApp.engine.active.x,done:HonroApp.done,error:HonroApp.lastError})'))
    finally:owner.keyboard.up('d')
def near_exit(page,at_goal=False):
    return page.evaluate('''atGoal=>{const a=HonroApp;a.launch(1);HonroStory.finish(a);a.turnNotice=null;const b=a.engine.b,u=a.engine.active,exit=b.honroMarkers.find(m=>m.type==='exit'),x=exit.x-(atGoal?0:200);
      b.round=3;Object.assign(u,{x,y:HonroWorld.top(b,x),vx:0,vy:0,airborne:false,jumping:false});a.scene.x=x;a.scene.y=u.y-180;a.scene.manual=true;
      const result={width:b.width,contentWidth:a.stage.w,x:u.x,exit:exit.x,complete:HonroObjectives.state(b,a.stage).complete};
      if(atGoal){a.frame=()=>{};b.honroState.flags.savedExit=true;b.honroStory=null;a.profile.honroBattle=structuredClone(b);a.persist();}
      return result;}''',at_goal)
MEASURE='''()=>['hp','mp','move'].map(id=>{const f=document.getElementById(id+'-fill'),m=f.parentElement,n=document.getElementById(id+'-name'),r=m.getBoundingClientRect(),s=n.getBoundingClientRect(),v=document.getElementById(id+'-label'),t=v.getBoundingClientRect();return{id,name:n.textContent,visible:getComputedStyle(n).display!=='none'&&s.width>0&&s.height>0,x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom,labelLeft:s.left,labelTop:s.top,labelBottom:s.bottom,labelRight:s.right,labelWidth:s.width,labelScroll:n.scrollWidth,labelFont:parseFloat(getComputedStyle(n).fontSize),value:v.textContent,valueLeft:t.left,valueTop:t.top,valueBottom:t.bottom,valueRight:t.right,valueFont:parseFloat(getComputedStyle(v).fontSize),valueWidth:v.clientWidth,valueScroll:v.scrollWidth,fill:f.getBoundingClientRect().width};})'''
def check_layout(page,name,width,height):
    rows=page.evaluate(MEASURE)
    valid=all(r['visible'] and r['w']>=40 and r['h']>=16 and r['x']>=0 and r['right']<=width+.5 and r['y']>=0 and r['bottom']<=height+.5 and r['x']<=r['labelLeft']<r['labelRight']<r['valueLeft']<r['valueRight']<=r['right'] and r['y']<=min(r['labelTop'],r['valueTop']) and max(r['labelBottom'],r['valueBottom'])<=r['bottom'] and r['labelFont']<r['valueFont'] and r['labelScroll']<=r['labelWidth']+1 and r['valueScroll']<=r['valueWidth']+1 for r in rows)
    overlap=any(min(a['right'],b['right'])-max(a['x'],b['x'])>1 and min(a['bottom'],b['bottom'])-max(a['y'],b['y'])>1 for i,a in enumerate(rows) for b in rows[i+1:])
    check(name,valid and not overlap and [r['name'] for r in rows]==['체력','기력','이동도'],rows)
    return rows

with sync_playwright() as p:
    browser=launch(p)
    game=browser.new_page(viewport={'width':1920,'height':1080});load(game)
    start=near_exit(game);check('The approach fixture starts inside the actual map and before completion',not start['complete'] and 0<start['x']<start['exit']<start['width'],start)
    reach_outcome(game,walk=True)
    end=game.evaluate('({x:HonroApp.engine.active.x,width:HonroApp.engine.b.width,lines:HonroApp.dialogue.lines.length})')
    check('Actual keyboard walking into the exit starts the victory dialogue',end['x']<end['width'] and end['x']>start['x'] and end['lines']>=4,end)
    skip(game);check('Skipping victory applies the clear and opens Stage 2',game.evaluate('!!HonroApp.profile.cleared[1]&&HonroApp.isOpen(HONRO_CONTENT.stages[1])&&HonroApp.done'))
    game.click('[data-action="result-map"]');game.evaluate('HonroApp.stageId=2;HonroApp.mapDock()');game.click('[data-action="launch"]')
    check('Stage 2 starts from the resulting journey screen',game.evaluate('HonroApp.engine.b.honroStage===2&&!!HonroApp.dialogue'))
    game.close()

    saved=browser.new_page(viewport={'width':1440,'height':900});load(saved);near_exit(saved,True)
    saved.reload();saved.wait_for_function('window.HonroApp');saved.click('[data-action="continue"]')
    reach_outcome(saved)
    check('An existing save already at the exit clears after Continue',saved.evaluate('HonroApp.engine.b.phase==="won"&&HonroApp.engine.b.honroState.flags.savedExit&&HonroApp.engine.active.x<HonroApp.engine.b.width'))
    skip(saved);check('Saved-exit recovery keeps progression and the clear',saved.evaluate('!!HonroApp.profile.cleared[1]&&HonroApp.profile.heroes.archer.xp>0'))
    saved.close()

    hud=browser.new_page(viewport={'width':1920,'height':1080});load(hud)
    hud.evaluate('HonroApp.frame=()=>{};HonroApp.launch(1);HonroStory.finish(HonroApp);HonroApp.turnNotice=null;HonroApp.updateHUD(true)')
    for w,h in [(1920,1080),(1440,900),(844,390),(390,844),(320,740)]:
        hud.set_viewport_size({'width':w,'height':h});hud.evaluate('HonroApp.updateHUD(true)')
        check_layout(hud,f'All three resource bars and labels are readable at {w}x{h}',w,h)
        hud.locator('#battle-bottom').screenshot(path=str(OUT/f'hud-{w}x{h}.png'))
    hud.set_viewport_size({'width':1920,'height':1080})
    before=hud.evaluate(MEASURE)
    changed=hud.evaluate('''()=>{const a=HonroApp,u=a.engine.active,move=u.moveLeft;a.engine.move(1,.15);u.hp-=17;u.focus-=11;a.updateHUD(true);return{moveBefore:move,moveAfter:u.moveLeft};}''')
    hud.wait_for_timeout(250) # Let the resource fill's existing CSS transition finish.
    after=hud.evaluate(MEASURE)
    check('Health, focus and movement amounts update their actual visible bars',changed['moveAfter']<changed['moveBefore'] and all(a['fill']<b['fill'] and a['value']!=b['value'] for a,b in zip(after,before)),changed)
    hud.evaluate('''()=>{const a=HonroApp;for(let i=1;i<=2;i++)a.profile.cleared[i]={};a.launch(3);HonroStory.finish(a);a.turnNotice=null;const u=a.engine.b.units.find(u=>u.side===0&&u.cls==='mage');u.ranks.MP05=1;u.jucheonReady=true;a.selectHero(u.id);a.updateHUD(true);}''')
    check('The passive indicator can be shown alongside the resources',hud.locator('#combat-passives').is_visible())
    check_layout(hud,'Visible Jucheon does not shift or hide the three resource bars',1920,1080)
    hud.locator('#battle-bottom').screenshot(path=str(OUT/'hud-with-passive.png'));hud.close()

    editor=browser.new_page(viewport={'width':1440,'height':900});editor.on('pageerror',lambda e:errors.append(str(e)))
    editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI')
    editor.evaluate('HonroWorkshopAPI.selectStage("stage-1")');project=editor.evaluate('HonroWorkshopAPI.exportProject()')
    editor.click('[data-tab="play"]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');play=editor.frames[1]
    if play.locator('[data-action="dialogue-skip"]').count():skip(play)
    play.evaluate('HonroApp.turnNotice=null;HonroApp.updateHUD(true)')
    viewport=play.evaluate('({w:innerWidth,h:innerHeight})');check_layout(play,'Workshop Playtest shows the same labels and movement bar',viewport['w'],viewport['h'])
    play.evaluate('''()=>{const a=HonroApp,b=a.engine.b,u=a.engine.active,exit=b.honroMarkers.find(m=>m.type==='exit'),x=exit.x-200;b.round=3;Object.assign(u,{x,y:HonroWorld.top(b,x),vx:0,vy:0,airborne:false,jumping:false});}''')
    reach_outcome(play,walk=True)
    check('Workshop Playtest crosses the actual exit through keyboard movement',play.evaluate('HonroApp.engine.active.x<HonroApp.engine.b.width'))
    skip(play);check('Workshop Playtest reaches the result screen',play.locator('.result-title').inner_text()=='길이 열렸다')
    editor.click('#stopPlay');check('The exit playtest preserves the authored map',editor.evaluate('HonroWorkshopAPI.exportProject()')==project)
    browser.close()
check('No browser exceptions',not errors,errors)
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
