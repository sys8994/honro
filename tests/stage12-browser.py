"""Actual rebuilt game and Workshop playtest acceptance for the authored map redesign."""
import base64,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
out=ROOT/'_local/reports/stage12-redesign';out.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,detail or '',flush=True)
with sync_playwright() as p:
    browser=launch(p)
    game=browser.new_page(viewport={'width':1600,'height':1000});game.on('pageerror',lambda e:errors.append(str(e)))
    game.goto((ROOT/'HONRO.html').as_uri());game.wait_for_function('window.HonroApp')
    game.evaluate('HonroApp.frame=()=>{}')
    for sid in [1,2]:
        data=game.evaluate('''sid=>{const a=HonroApp;for(let i=1;i<=10;i++)a.profile.cleared[i]={};a.launch(sid);if(a.dialogue)HonroStory.finish(a);a.turnNotice=null;const b=a.engine.b;
          Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,cinematic:null,x:b.width/2,y:b.height/2,scale:Math.min(1520/b.width,900/b.height),time:0,walkTime:0});a.scene.render(a.engine,0,'',.6,false,0);
          return {stage:b.honroStage,revision:b.honroMapDesignRevision,water:b.waters.length,terrain:b.terrain.length,treeCollision:b.terrain.some(t=>/pine.*collision/.test(t.id))}}''',sid)
        check(f'Stage {sid} actual campaign loads authored geometry and conductive water',data['revision']==1 and data['water']==(1 if sid==1 else 2) and not data['treeCollision'],data)
        image=game.locator('#battlecanvas').evaluate('c=>c.toDataURL().split(",")[1]')
        (out/f'stage-{sid}-overview.png').write_bytes(base64.b64decode(image))
    editor=browser.new_page(viewport={'width':1365,'height':768});editor.on('pageerror',lambda e:errors.append(str(e)))
    editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI')
    for sid in [1,2]:
        editor.evaluate('sid=>HonroWorkshopAPI.selectStage("stage-"+sid)',sid)
        before=editor.evaluate('HonroWorkshopAPI.exportProject()')
        editor.click('[data-tab="play"]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
        play=editor.frames[1]
        for _ in range(20):
            skip=play.locator('[data-action="dialogue-skip"]')
            if skip.count():skip.click()
            play.wait_for_timeout(150)
            if play.evaluate('!!HonroApp.canInput()'):
                # Initial proximity events now pause immediately after the entry banner.
                play.wait_for_timeout(300)
                if play.evaluate('!!HonroApp.canInput()'):break
        play.wait_for_function('!!HonroApp.canInput()')
        x=play.evaluate('HonroApp.engine.active.x')
        play.locator('#battlecanvas').click(position={'x':400,'y':180})
        editor.keyboard.down('d');play.wait_for_timeout(380);editor.keyboard.up('d')
        moved=play.evaluate('HonroApp.engine.active.x')
        check(f'Stage {sid} Playtest accepts real movement input',moved>x+20,{'before':x,'after':moved})
        editor.keyboard.press('Control');play.wait_for_timeout(120)
        check(f'Stage {sid} Playtest accepts real jump input',play.evaluate('HonroApp.engine.active.jumping||HonroApp.engine.active.vy<0'))
        editor.screenshot(path=str(out/f'playtest-stage-{sid}.png'))
        editor.click('#stopPlay')
        check(f'Stage {sid} Stop preserves the authored project',editor.evaluate('HonroWorkshopAPI.exportProject()')==before)
    browser.close()
check('No browser errors',not errors,errors)
(out/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
