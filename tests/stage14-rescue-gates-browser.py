"""Built candidate UI/Continue. Prepared saved profiles are compatibility
fixtures, not normal-resource completion evidence. Native run is separate."""
import json,hashlib,subprocess,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch
from story_browser_server import story_base_url
out=Path('_local/reports/stage14-rescue-gates-20261022/browser');out.mkdir(parents=True,exist_ok=True)
root=out.parent;base=story_base_url();rows=[];errors=[];http=[]
saved=json.loads((root/'compat-retired-middle.json').read_text())
dialogue=json.loads((root/'compat-dialogue.json').read_text())
expected=['family-upper','family-mid','family-lower','bridge','hold-refuge','clear-village']
physical='''()=>JSON.stringify(({b})=>({units:b.units,heroes:b.heroes,terrain:b.terrain,round:b.round,items:b.items,growth:b.honroGrowth,story:b.honroStory,done:HonroAct2.memory(b).done}))(HonroApp.engine))'''
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
        p.wait_for_function('HonroAuthoredFarArt.ready(14)',timeout=90000)
        p.evaluate('HonroApp.scene.render(HonroApp.engine,0,HonroApp.selected,.6,false,0)')
        path=out/(name+'.jpg');p.screenshot(path=str(path),type='jpeg',quality=85);assert path.stat().st_size<1_000_000
        return {'path':str(path),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
    if '--fullplay-only' in sys.argv:
        measured=json.loads((root/'fullplay/checkpoint.json').read_text())
        result=json.loads((root/'fullplay/result.json').read_text())
        assert result['round']==21 and result['stopReason']=='requested round observation limit'
        ctx,p=page_for(measured['profile']);p.locator('[data-action="continue"]').click();p.wait_for_function('HonroApp.engine?.b.honroStage14RescueRevision===1',timeout=90000);p.evaluate('HonroApp.close();HonroApp.updateHUD(true)')
        assert p.evaluate('HonroApp.engine.b.round')==21
        assert p.evaluate('HonroAct2.current(HonroApp.engine.b).id')=='bridge'
        for key in ['units','heroes','items','terrain','honroGrowth']:
            assert p.evaluate('key=>HonroApp.engine.b[key]',key)==measured['profile']['honroBattle'][key],key
        rows.append({'case':'actual normal-input R21 stop snapshot','goal':p.locator('#objective-text').inner_text(),'actorsResourcesExact':True,'capture':shot(p,'measured-r21-bridge-390x844'),'runSource':result['gameSourceCommit']})
        ctx.close();browser.close();assert not errors,errors;assert not http,http
        (out/'fullplay-capture.json').write_text(json.dumps({'checkedCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'rows':rows,'errors':errors,'httpErrors':http,'limits':'Real built local UI loading the actual normal-input stop snapshot; no additional round played. Not Pages.'},ensure_ascii=False,indent=2))
        print('PASS actual measured R21 stop snapshot in mobile UI, no additional action');sys.exit(0)
    normal=json.loads(json.dumps(saved));normal['honroBattle']=None
    ctx,p=page_for();p.evaluate('''async profile=>{await HonroCampaignLoader.ensureStage(14);const a=HonroApp;a.profile={...HONRO_TOOLS.fresh(),...profile};a.normalProfile=a.profile;a.launch(14);while(a.dialogue)HonroStory.finish(a);a.close();HonroStory.tick(a,performance.now()+10000);a.updateHUD(true);}''',normal)
    assert p.evaluate('HonroAct2.current(HonroApp.engine.b).id')=='family-upper'
    assert p.evaluate('HonroAct2.steps(HonroApp.engine.b).map(s=>s.id)')==expected
    text=p.locator('#objective-text').inner_text();assert '상층 주민 구조' in text and '출입로 확보' not in text
    rows.append({'case':'fresh mobile entry','goal':text,'capture':shot(p,'fresh-family-upper-390x844')});ctx.close()
    ctx,p=page_for(saved);p.locator('[data-action="continue"]').click();p.wait_for_function('HonroApp.engine?.b.honroStage14RescueRevision===1',timeout=90000);p.evaluate('HonroApp.close();HonroApp.updateHUD(true)')
    b=p.evaluate('HonroApp.engine.b');assert b['round']==20
    for key in ['units','heroes','items','terrain','honroGrowth']:assert b[key]==saved['honroBattle'][key],key
    assert p.evaluate('HonroAct2.current(HonroApp.engine.b).id')=='family-mid'
    assert p.evaluate('HonroAct2.memory(HonroApp.engine.b).done')==saved['honroBattle']['honroState']['act2']['done']
    text=p.locator('#objective-text').inner_text();assert '중층 주민 구조' in text and '접근로 확보' not in text
    rows.append({'case':'retired clear-middle round20 Continue','goal':text,'actorsResourcesFactsExact':True,'capture':shot(p,'round20-middle-continue-390x844')});ctx.close()
    ctx,p=page_for(dialogue);p.locator('[data-action="continue"]').click();p.wait_for_function('HonroApp.engine?.b.honroStage14RescueRevision===1&&HonroApp.dialogue?.index===1',timeout=90000);p.evaluate('HonroApp.close()')
    assert p.evaluate('HonroApp.dialogue.lines')==dialogue['honroBattle']['honroStory']['lines']
    before=p.evaluate('JSON.stringify(HonroApp.engine.b)');p.evaluate('HonroAct2.tick(HonroApp,0)');assert p.evaluate('JSON.stringify(HonroApp.engine.b)')==before
    assert p.evaluate('HonroApp.engine.b.round')==20
    rows.append({'case':'saved resident dialogue page2 Continue','cursorAndRowsExact':True,'noMissionAdvance':True,'capture':shot(p,'round20-dialogue-page2-390x844')});ctx.close();browser.close()
assert not errors,errors
assert not http,http
(out/'result.json').write_text(json.dumps({'checkedCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'rows':rows,'errors':errors,'httpErrors':http,'limits':'Built local candidate, not Pages. Prepared compatibility inputs; no normal completion-turn claim.'},ensure_ascii=False,indent=2))
print('PASS mobile fresh rescue/retired middle Continue/saved dialogue cursor; three actual JPGs')
