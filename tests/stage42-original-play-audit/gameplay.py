"""Original Stage 42 app keyboard smoke, separate from paint/zoom diagnostics."""
import os
from pathlib import Path

READY = 'HonroApp.engine?.b?.honroStage===42 && HonroApp.canInput()'
# Separate access fixture. No actor pose, stats, physics, cooldown, or gameplay mutation.
# Prior-clear markers make only the shipped loader/launch reachable in a clean browser.
LAUNCH = """async()=>{
 const a=HonroApp,p=HonroProfileStore.fresh(), heroes=JSON.stringify(p.heroes);
 a.stopBattle();a.close();a.profile=a.normalProfile=p;
 for(let n=1;n<42;n++)p.cleared[n]={visits:1,rounds:16};
 if(JSON.stringify(p.heroes)!==heroes)throw Error('default heroes changed during entry setup');
 await HonroCampaignLoader.ensureStage(42);a.launch(42);
 return {fixture:'fresh default roster and levels, prior-clear markers only',stage:42};
}"""
STATE = """()=>{const a=HonroApp,e=a.engine,u=e.active,s=e.contactSurface(u.x,u.y-4,u.y+4);return{
 stage:e.b.honroStage,id:u.id,x:u.x,y:u.y,hp:u.hp,grounded:e.grounded(u),
 support:s?.t?.id??null,canInput:a.canInput(),round:e.b.round??null,
 camera:a.scene?{x:a.scene.x,y:a.scene.y,zoom:a.scene.scale}:null}};
"""
FAR = """()=>{
 const e=HonroApp.engine,b=e?.b,F=globalThis.HonroAuthoredFarArt;
 return b?.honroStage===42&&!!F?.ready(42,b.honroPreviewFar,b)&&!(F.stats?.()?.errors??[]).length;
}"""
def dismiss(page):
    for _ in range(60):
        if page.evaluate(READY):
            return
        for s in ('[data-action="dialogue-skip"]:visible','[data-action="dialogue-next"]:visible','[data-action="journey-enter"]:visible'):
            l=page.locator(s).first
            if l.count() and l.is_enabled():
                l.click()
                break
        page.wait_for_timeout(180)
    page.wait_for_function(READY,timeout=20000)

def play(browser,base,out,result):
    context=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1)
    page=context.new_page()
    result['page_errors']=[]
    page.on('pageerror',lambda e:result['page_errors'].append(str(e)))
    def snap(name):
        page.screenshot(path=str(out/(name+'.png')))
    try:
        page.goto(base+'/HONRO.html',wait_until='domcontentloaded')
        page.wait_for_function('window.HonroApp && window.HonroCampaignLoader',timeout=90000)
        result['fixture']=page.evaluate(LAUNCH)
        dismiss(page)
        page.wait_for_function(FAR,timeout=45000)
        result['official_far_ready']=True
        entry=page.evaluate(STATE)
        result['entry']=entry
        assert entry['stage']==42 and entry['grounded'] and entry['support']=='a5-supply-road',entry
        snap('play-01-original-entry')
        page.keyboard.down('d')
        try:
            page.wait_for_function('x=>HonroApp.engine.active.x>x+12',arg=entry['x'],timeout=7000)
        finally:
            page.keyboard.up('d')
        page.wait_for_function('HonroApp.engine.grounded(HonroApp.engine.active)',timeout=10000)
        walked=page.evaluate(STATE)
        result['after_holding_d']=walked
        result['world_dx']=walked['x']-entry['x']
        assert walked['stage']==42 and walked['id']==entry['id'] and walked['grounded'],walked
        assert walked['support']==entry['support'] and 12<result['world_dx']<300,walked
        snap('play-02-after-keyboard-walk')
        page.set_viewport_size({'width':390,'height':844})
        page.wait_for_function(FAR,timeout=15000)
        snap('play-03-same-live-battle-portrait')
        assert not result['page_errors'],result['page_errors']
        result['scope']='real generated Game launch and keyboard entry movement; no full route, ladder or battle completion'
        result['pass']=True
    except Exception:
        if not page.is_closed():
            try:snap('play-FAILED')
            except Exception:pass
        raise
    finally:
        context.close()
