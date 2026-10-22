"""Built UI: current rescue objective and round20 old resident dialogue save.
Compatibility profiles are explicit state fixtures, not normal-play turn proof.
"""
import argparse,json,hashlib,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch
from story_browser_server import story_base_url
parser=argparse.ArgumentParser();parser.add_argument('--out',default='_local/reports/stage11-quest-simplification/browser');args=parser.parse_args()
out=Path(args.out);out.mkdir(parents=True,exist_ok=True);base=story_base_url();rows=[];errors=[];http=[]
saved=json.loads(Path('_local/reports/stage11-quest-simplification/compat-dialogue-0.json').read_text())
# Fresh-entry UI fixture derived from the save-contract input; no fullplay output required.
normal=json.loads(Path('_local/reports/stage11-quest-simplification/compat-dialogue-0.json').read_text());normal['honroBattle']=None
normal['cleared']={str(i):{'visits':1,'rounds':1} for i in range(1,11)} # Entry/unlock fixture, not earlier combat evidence.
physical='''()=>JSON.stringify(HonroApp.engine.b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,dead:u.dead})))'''
with sync_playwright() as pw:
    browser=launch(pw)
    def page_for(profile=None):
        ctx=browser.new_context(viewport={'width':390,'height':844},has_touch=True)
        p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:http.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
        p.goto(base+'/HONRO.html');p.wait_for_function('!!globalThis.HonroApp',timeout=120000)
        if profile:
            p.evaluate('v=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',profile)
            p.reload();p.wait_for_function('!!globalThis.HonroApp',timeout=120000)
        p.evaluate('HonroApp.frame=()=>{}')
        return ctx,p
    def shot(p,name):
        p.screenshot(path=str(out/(name+'.jpg')),type='jpeg',quality=85)
        assert (out/(name+'.jpg')).stat().st_size<1_000_000
    ctx,p=page_for()
    p.evaluate('''async profile=>{await HonroCampaignLoader.ensureStage(11);const a=HonroApp;a.profile={...HONRO_TOOLS.fresh(),...profile,record:profile.record||[]};a.normalProfile=a.profile;a.launch(11);while(a.dialogue)HonroStory.finish(a);a.close();a.updateHUD(true);}''',normal)
    p.wait_for_function('HonroApp.engine?.b.honroStage11QuestRevision===1');p.wait_for_function('HonroAuthoredFarArt.ready(11)',timeout=90000)
    p.wait_for_timeout(1200);p.evaluate('''()=>{const a=HonroApp;HonroStory.tick(a,performance.now());a.scene.render(a.engine,0,a.selected,.6,false,0);}''')
    goal=p.locator('#objective-text').inner_text();assert '매듭 해체' not in goal and '4라운드' not in goal and '흔적 조사' not in goal
    assert p.evaluate('HonroAct2.current(HonroApp.engine.b).id')=='resident'
    shot(p,'fresh-rescue-objective-390x844');rows.append({'case':'fresh entry mobile current objective','text':goal,'steps':p.evaluate('HonroAct2.steps(HonroApp.engine.b)')});ctx.close()
    ctx,p=page_for(saved)
    p.locator('[data-action="continue"]').click();p.wait_for_function('HonroApp.engine?.b.honroStage===11&&HonroApp.dialogue?.index===0&&HonroApp.engine.b.honroStage11QuestRevision===1',timeout=90000)
    assert p.evaluate('HonroApp.engine.b.round')==20
    assert p.evaluate('HonroApp.dialogue.lines.map(l=>l.slice(0,2))')==[l[:2] for l in saved['honroBattle']['honroStory']['lines']]
    assert '흔적 조사' not in p.locator('#objective-text').inner_text();before=p.evaluate(physical);p.evaluate('HonroAct2.tick(HonroApp,0)');assert p.evaluate(physical)==before
    assert p.evaluate('HonroApp.engine.b.phase')=='aim';assert p.evaluate('HonroApp.dialogue.index')==0
    p.wait_for_function('HonroAuthoredFarArt.ready(11)',timeout=90000);p.evaluate('HonroApp.scene.render(HonroApp.engine,0,HonroApp.selected,.6,false,0)')
    shot(p,'round20-resident-dialogue-1of2-390x844')
    button=p.locator('[data-action="dialogue-next"]');box=button.bounding_box();assert box and box['height']>=40 and box['y']+box['height']<=844;p.touchscreen.tap(box['x']+box['width']/2,box['y']+box['height']/2);p.wait_for_function('HonroApp.dialogue?.index===1')
    p.wait_for_timeout(180);button=p.locator('[data-action="dialogue-skip"]');box=button.bounding_box();assert box and box['height']>=40 and box['y']+box['height']<=844;p.touchscreen.tap(box['x']+box['width']/2,box['y']+box['height']/2);p.wait_for_function('!HonroApp.dialogue')
    p.evaluate('HonroAct2.tick(HonroApp,0)');assert p.evaluate('HonroApp.engine.b.phase')=='won';assert p.evaluate('HonroApp.engine.b.round')==20
    assert p.evaluate('HonroAct2.memory(HonroApp.engine.b).checkpoints.filter(c=>c.id==="trace").length')==1
    p.evaluate('HonroApp.outcome()')
    for _ in range(30):
        p.wait_for_timeout(180)
        if p.evaluate('!!HonroApp.dialogue'):p.keyboard.press('Enter')
        elif p.evaluate('!!HonroApp.profile.cleared[11]'):break
        else:p.evaluate('HonroApp.outcome()')
    assert p.evaluate('!!HonroApp.profile.cleared[11]')
    paid=p.evaluate('JSON.stringify(HonroApp.engine.b.heroes)');p.evaluate('HonroProgression.complete(HonroApp.engine.b)');assert p.evaluate('JSON.stringify(HonroApp.engine.b.heroes)')==paid
    p.wait_for_timeout(250);shot(p,'round20-natural-result-390x844');rows.append({'case':'round20 old resident dialogue1/2 Continue','cursorAndTextPreserved':True,'visibleNextSkipRealTouch':True,'noAdvanceWhileDialogue':True,'completionRound':20,'traceOnce':True,'rewardOnce':True,'limits':'Prepared old quest/progress fixture; not the unseen actual user save.'});ctx.close();browser.close()
assert not errors and not http,(errors,http)
(out/'summary.json').write_text(json.dumps({'executionSHA':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'rows':rows,'errors':errors,'httpFailures':http,'scope':__doc__},ensure_ascii=False,indent=2)+'\n')
print('PASS real mobile rescue objective and round20 resident dialogue Continue/natural completion/reward once')
