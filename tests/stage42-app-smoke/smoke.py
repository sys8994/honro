"""App-only Act5 stage42 smoke; isolated Chromium, no deployment/combat tuning."""
import argparse, hashlib, json, os
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser()
p.add_argument('--url',required=True);p.add_argument('--candidate',required=True,type=Path)
p.add_argument('--out',required=True,type=Path)
args=p.parse_args()
base=args.url.rstrip('/')
assert urlparse(base).hostname in ('127.0.0.1','localhost','::1'), 'loopback only'
args.out.mkdir(parents=True,exist_ok=True)
candidate=json.loads(args.candidate.read_text())
r={'pass':False,'candidate_sha256':hashlib.sha256(args.candidate.read_bytes()).hexdigest(),'sha':os.getenv('GITHUB_SHA'),'errors':[]}
STATE="""()=>{const a=HonroApp,e=a.engine,u=e.active; return {stage:e.b.honroStage,id:u.id,x:u.x,y:u.y,hp:u.hp,grounded:e.grounded(u),support:e.contactSurface(u.x,u.y-4,u.y+4)?.t.id,canInput:a.canInput()}}"""
SETUP="""async()=>{const a=HonroApp,C=HONRO_CORE,p=HonroProfileStore.fresh();
a.stopBattle();a.close();a.profile=a.normalProfile=p;
p.party=p.recruited=[...C.CLASS_IDS];
for(let n=1;n<42;n++)p.cleared[n]={visits:1,rounds:16};
for(const cls of p.party){const h=p.heroes[cls];h.xp=HonroProgression.budget(42).start;C.autoTrain(h,cls);C.sanitizeLoadout(p,cls);}
Object.assign(p.settings,{sound:false,music:false,speed:1,playerSpeed:1});
await HonroCampaignLoader.ensureStage(42);a.launch(42);}"""
READY='HonroApp.engine?.b?.honroStage===42 && HonroApp.canInput()'
def dismiss(page):
    for _ in range(60):
        if page.evaluate(READY): return
        for s in ('[data-action="dialogue-skip"]:visible','[data-action="dialogue-next"]:visible','[data-action="journey-enter"]:visible'):
            l=page.locator(s).first
            if l.count() and l.is_enabled():
                l.click();break
        page.wait_for_timeout(180)
    page.wait_for_function(READY,timeout=20000)
def shot(page,name): page.screenshot(path=str(args.out/(name+'.png')))
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True)
    ctx=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1)
    page=ctx.new_page();page.on('pageerror',lambda e:r['errors'].append(str(e)))
    try:
        page.goto(base+'/HONRO.html',wait_until='domcontentloaded')
        page.wait_for_function('window.HonroApp && window.HonroCampaignLoader',timeout=90000)
        page.evaluate(SETUP);dismiss(page)
        r['entry']=page.evaluate(STATE);assert r['entry']['grounded'] and r['entry'].get('support'),r['entry']
        shot(page,'entry-1440')
        page.keyboard.down('d')
        try:page.wait_for_function('x=>HonroApp.engine.active.x>x+2',arg=r['entry']['x'],timeout=4000)
        finally: page.keyboard.up('d')
        page.wait_for_function('HonroApp.engine.grounded(HonroApp.engine.active)',timeout=10000)
        r['walk']=page.evaluate(STATE);assert r['walk']['id']==r['entry']['id'] and r['walk']['grounded'] and r['walk'].get('support'),r['walk']
        shot(page,'walk-grounded')
        r['storage_ok']=page.evaluate('HonroApp.profileStore.save(HonroApp.profile)')
        assert r['storage_ok']
        page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=90000)
        page.locator('[data-action="continue"]:visible').first.click();dismiss(page)
        r['resumed']=page.evaluate(STATE)
        assert r['resumed']['id']==r['walk']['id'] and abs(r['resumed']['x']-r['walk']['x'])<=4 and abs(r['resumed']['y']-r['walk']['y'])<=4,r['resumed']
        shot(page,'resumed')
        page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(900);shot(page,'responsive-portrait')
        editor=ctx.new_page();editor.on('pageerror',lambda e:r['errors'].append(str(e)))
        editor.goto(base+'/HONRO_WORKSHOP.html',wait_until='domcontentloaded')
        editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene',timeout=90000)
        editor.evaluate("HonroWorkshopAPI.selectStage('stage-42')")
        before=editor.evaluate('HonroWorkshopAPI.exportProject()')
        # ensure baseline-vs-candidate wiring cannot give a false positive
        check="""([doc,expected])=>{const p=typeof doc==='string'?JSON.parse(doc):doc;
         const x=p.library?.find(x=>x.id==='act5:near:42');
         const same=(a,b)=>a===b||(a&&b&&typeof a==='object'&&typeof b==='object'&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>same(a[k],b[k])));
         return !!x&&same(x.edgeWall,expected);}"""
        assert editor.evaluate(check,[before,candidate]),'Workshop exported project does not expose exact candidate in expected slot; inspect schema, do not relax'
        (args.out/'workshop-export.json').write_text(before if isinstance(before,str) else json.dumps(before,ensure_ascii=False))
        editor.reload(wait_until='domcontentloaded');editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene',timeout=90000)
        editor.evaluate("(v)=>HonroWorkshopAPI.importProject(typeof v==='string'?JSON.parse(v):v)",before)
        editor.evaluate("HonroWorkshopAPI.selectStage('stage-42')")
        after=editor.evaluate('HonroWorkshopAPI.exportProject()')
        assert editor.evaluate(check,[after,candidate]),'Candidate missing after reload/import'
        shot(editor,'workshop-reopened')
        editor.evaluate("HonroWorkshopAPI.startPlaytest('start')")
        editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine?.b?.honroStage===42',timeout=90000)
        shot(editor,'workshop-playtest')
        assert not r['errors'],r['errors']
        r['pass']=True
    except Exception:
        import traceback
        r['exception']=traceback.format_exc()
        if not page.is_closed():shot(page,'failed-game-state')
        raise
    finally:
        (args.out/'result.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
        browser.close()
