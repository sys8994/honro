"""Focused actual checkpoint traversal; terminal fixtures are tested separately."""
from pathlib import Path
import argparse, json, hashlib, subprocess
from playwright.sync_api import sync_playwright
from browser_support import launch
from story_browser_server import story_base_url

parser=argparse.ArgumentParser();parser.add_argument('--out',default='game/docs/stage10-world-outro-ending-replay/evidence/focus1-map');args=parser.parse_args()
OUT=Path(args.out);OUT.mkdir(parents=True,exist_ok=True)
KEY='honro-first-act-profile-1'
CHECKPOINT=Path('game/docs/stage-review/act-endings/evidence/normal-21-escape-save.json')
errors=[];rows=[]
COMBAT="""()=>{const b=HonroApp.engine.b;return JSON.stringify(Object.fromEntries(['units','round','side','time','projectiles','items','teamEnds'].map(k=>[k,b[k]])))}"""
def shot(page,name):
    page.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=88)
def ready(page):
    page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
def install(page,profile):
    page.evaluate('(p)=>localStorage.setItem("'+KEY+'",JSON.stringify(p))',profile)
    page.reload();ready(page);page.evaluate('HonroApp.continue()')

with sync_playwright() as p:
    browser=launch(p)
    page=browser.new_page(viewport={'width':390,'height':844},has_touch=True)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(story_base_url()+'/HONRO.html');ready(page)
    for width,height in [(390,844),(844,390)]:
        page.set_viewport_size({'width':width,'height':height})
        install(page,json.loads(CHECKPOINT.read_text())['profile'])
        page.wait_for_function('HonroApp.screen==="battle"&&!!HonroApp.engine')
        page.evaluate('for(let i=0;HonroApp.dialogue&&i<40;i++)HonroStory.finish(HonroApp)')
        for _ in range(3):
            if page.evaluate('HonroApp.engine.active.cls')=='knight':break
            page.keyboard.press('Tab')
        assert page.evaluate('HonroApp.engine.active.cls')=='knight'
        start=page.evaluate('JSON.parse(JSON.stringify(HonroApp.engine.b))')
        page.keyboard.down('d')
        try:page.wait_for_function('HonroApp.engine.b.honroState.sodanWithdrawal.phase!=="escape"',timeout=20000)
        finally:page.keyboard.up('d')
        page.wait_for_function('!!HonroApp.dialogue',timeout=15000)
        page.wait_for_timeout(1000)
        assert page.locator('#sodan-safe-backdrop').count()==0
        assert page.locator('#battlecanvas').is_visible()
        assert page.evaluate('HonroApp.engine.b.phase==="won"&&HonroApp.engine.b.honroState.sodanWithdrawal.worldOutro===1')
        assert '이제 손을 놔도 돼요?' in page.locator('#story-line').inner_text()
        assert page.evaluate('HonroApp.dialogue.lines.length')==16
        before=page.evaluate(COMBAT);page.wait_for_timeout(900);assert before==page.evaluate(COMBAT),'combat/time/enemies freeze during dialogue'
        result=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,r=a.scene.storyFrameReport,party=b.units.filter(u=>u.hp>0&&!u.dead&&(u.side===0&&!u.summoned||u.id==='boss'));return{phase:b.phase,round:b.round,party:party.map(u=>({id:u.id,x:u.x,y:u.y,ground:HonroWorld.top(b,u.x,u.y,b.honroMapAnchors.exit.support)})),enemies:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp})),frame:r,lines:a.dialogue.lines.map(l=>l.slice(0,2))}}''')
        assert len(result['party'])==4
        for actor in result['party']:assert abs(actor['y']-actor['ground'])<1
        assert all(abs(enemy['x']-actor['x'])>400 for enemy in result['enemies'] for actor in result['party'])
        frame=result['frame'];assert frame['id']=='10:safe-exit'
        # Every actual world actor must fit above the dialogue, inside the camera's safe rectangle.
        cv=page.locator('#battlecanvas').bounding_box();cam=frame['camera'];rect=frame['rect']
        for actor in result['party']:
            x=(actor['x']-cam['x'])*cam['scale']+cv['width']/2
            y=(actor['y']-cam['y'])*cam['scale']+cv['height']/2
            assert rect['x']-1<=x<=rect['x']+rect['w']+1,(x,rect)
            assert rect['y']-1<=y<=rect['y']+rect['h']+1,(y,rect)
        shot(page,f'map-outro-first-{width}x{height}')
        # A real saved dialogue resumes on the actual map at the same cursor.
        page.locator('[data-action="dialogue-next"]').click();page.wait_for_timeout(650)
        saved=page.evaluate('JSON.stringify(HonroApp.profile.honroBattle)')
        page.reload();ready(page);page.evaluate('HonroApp.continue()')
        page.wait_for_function('!!HonroApp.dialogue');assert page.evaluate('HonroApp.dialogue.index')==1
        assert page.locator('#sodan-safe-backdrop').count()==0
        page.evaluate('while(HonroApp.dialogue.index<HonroApp.dialogue.lines.length-1)HonroStory.next(HonroApp)')
        page.wait_for_timeout(700);shot(page,f'map-outro-last-{width}x{height}')
        assert before==page.evaluate(COMBAT),'advancing/reloading dialogue never ticks combat'
        if width==390:page.locator('[data-action="dialogue-next"]').click()
        else:page.locator('[data-action="dialogue-skip"]').click()
        page.wait_for_selector('#act-ending')
        assert page.evaluate('HonroApp.profile.cleared[10].visits')==1
        settled=page.evaluate('JSON.stringify(HonroApp.profile)')
        page.evaluate('HonroApp.outcome();HonroApp.outcome()');assert settled==page.evaluate('JSON.stringify(HonroApp.profile)')
        rows.append({'viewport':[width,height],'input':'actual checkpoint + keyboard d to supported exit','startRound':start['round'],'dialogueResume':True,'freeze':True,'completion':'next' if width==390 else 'skip',**result})
    assert not errors,errors
    browser.close()
source={f:hashlib.sha256(Path(f).read_bytes()).hexdigest() for f in ['shared/runtime/main.js','shared/runtime/sodan-withdrawal.js','shared/runtime/story-framing.js','game/src/act-endings.css']}
(OUT/'summary.json').write_text(json.dumps({'executionSHA':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'sourceHashes':source,'rows':rows,'errors':errors,'limits':['Existing genuine normal-play checkpoint; earlier six-turn combat is not rerun.','Chromium touch/keyboard emulation; physical phones and Safari not tested.']},ensure_ascii=False,indent=2)+'\n')
print('PASS actual map / grounded party / frozen combat / 16 lines / next / skip / reload / outcome guard at 390x844 and 844x390')
