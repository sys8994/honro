"""Real browser MP3/label checks. Debug launches and synthetic ended are not full plays/listening."""
import json, hashlib, subprocess
from urllib.parse import urlsplit, unquote
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch, serve_game

CATALOG = json.loads((ROOT/'shared/data/bgm.json').read_text(encoding='utf-8'))
INDEX = {t['id']:i for i,t in enumerate(CATALOG)}
OUT = ROOT/'_local/reports/bgm-acts'
OUT.mkdir(parents=True, exist_ok=True)

def run():
    rows = []
    with serve_game() as base, sync_playwright() as p:
        browser = launch(p)
        for width, height in [(1280, 800), (390, 844)]:
            context = browser.new_context(viewport={'width': width, 'height': height}, is_mobile=width<700, has_touch=width<700)
            page = context.new_page(); errors = []; requests = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('request', lambda r: requests.append(unquote(urlsplit(r.url).path).split('/')[-1]) if '/assets/bgm/' in r.url else None)
            page.goto(base+'/HONRO.html'); page.wait_for_function('document.documentElement.dataset.honroReady')
            assert page.evaluate('HONRO_BGM_TRACKS.length') == 27, 'Build the current soundtrack first'
            page.wait_for_timeout(400)
            assert set(requests) <= {CATALOG[0]['file']}, requests
            initial = list(requests)
            page.get_by_role('button', name='설정', exact=True).click()
            def playing(code):
                index = INDEX[code]
                item = CATALOG[index]
                page.wait_for_function('''arg=>{const m=HonroApp.audio.music,l=document.getElementById('bgm-now-playing');
                  return m.track===arg.index && m.current?.currentTime>.08 && !m.current.paused && !m.outgoing
                    && !l.hidden && l.textContent==='배경음 - '+arg.title;}''', arg={'index':index,'title':item['title']})
                assert page.evaluate('HonroApp.audio.music.status().playing') == 1
                assert unquote(urlsplit(page.evaluate('HonroApp.audio.music.current.currentSrc')).path).endswith('/'+item['file'])
            playing('01'); page.locator('#modal .menu-close').click()
            page.evaluate('HonroApp.debugMode=true')
            mappings = []
            for stage, code in [(1,'11'),(9,'13'),(10,'13'),(11,'11'),(19,'24'),(20,'23'),(21,'31'),(30,'33'),(36,'43'),(46,'53')]:
                page.evaluate('(s)=>HonroApp.launch(s)', stage)
                page.wait_for_function('s=>HonroApp.engine?.b.honroStage===s',arg=stage)
                playing(code)
                assert page.evaluate('HonroApp.audio.music.current.currentTime') < 2
                mappings.append({'stage':stage,'file':CATALOG[INDEX[code]]['file'],**page.evaluate('''()=>({status:HonroApp.audio.music.status(),label:document.getElementById('bgm-now-playing').textContent,readyState:HonroApp.audio.music.current.readyState,duration:HonroApp.audio.music.current.duration})''')})
                if stage == 10:
                    page.evaluate("""()=>{const e=HonroApp.engine,t=HonroQuestTargets.records(e.b).find(t=>t.id==='sodan-binding');
                      e.damageTerrain(t,t.maxHp+1,0,e.b.active);if(!t.broken)throw Error('Binding intact');}""")
                    playing('14'); assert page.evaluate('HonroApp.audio.music.current.loop')
                if stage in [9,11]: page.screenshot(path=str(OUT/f'stage-{stage}-{width}.png'))
            cycles = [(3,['12','11','12']), (16,['22','23','21','22'])]
            for stage, sequence in cycles:
                page.evaluate('HonroApp.showTitle()'); playing('01')
                page.evaluate('(s)=>HonroApp.launch(s)', stage); playing(sequence[0])
                for code in sequence[1:]:
                    page.evaluate("HonroApp.audio.music.current.dispatchEvent(new Event('ended'))")
                    playing(code); assert not page.evaluate('HonroApp.audio.music.current.loop')
            # Retry uses the actual pause menu action and restarts the chapter opening.
            page.evaluate('if(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.turnNotice=null;HonroApp.pause();window.kept=HonroApp.audio.music.current')
            before = page.evaluate('kept.currentTime'); page.wait_for_timeout(200)
            assert page.evaluate('kept.currentTime') > before
            page.locator('[data-action="retry-menu"]').click()
            page.locator('[data-action="retry-confirm"][data-id="battle"]').click()
            page.locator('[data-action="menu-confirm"]').click(); playing('22')
            page.evaluate('if(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.turnNotice=null;HonroApp.settings();window.kept=HonroApp.audio.music.current')
            page.locator('[data-action="settings-page"][data-id="sound"]').click()
            page.locator('#setting-music').uncheck(); page.wait_for_function('HonroApp.audio.music.current.paused&&document.getElementById("bgm-now-playing").hidden')
            page.locator('#setting-music').check(); playing('22'); assert page.evaluate('HonroApp.audio.music.current===kept')
            page.evaluate('HonroApp.profile.settings.musicVolume=0;HonroApp.audio.configure(HonroApp.profile.settings)')
            page.wait_for_function('HonroApp.audio.music.current.paused&&document.getElementById("bgm-now-playing").hidden')
            page.evaluate('HonroApp.profile.settings.musicVolume=.4;HonroApp.audio.configure(HonroApp.profile.settings)'); playing('22')
            page.locator('#modal .menu-close').click()
            page.evaluate('HonroApp.showRest()'); playing('01')
            page.evaluate('window.kept=HonroApp.audio.music.current;HonroApp.showTitle()'); playing('01')
            assert page.evaluate('HonroApp.audio.music.current===kept')
            page.screenshot(path=str(OUT/f'title-{width}.png'))
            assert not errors and not page.evaluate('HonroApp.audio.music.errors')
            rows.append({'width':width,'initialMp3Requests':initial,'mappings':mappings,'cycles':cycles,'retryMuteVolumeRestTitle':True,'errors':errors})
            context.close()
        context=browser.new_context(); page=context.new_page()
        page.route('**/assets/bgm/23_*',lambda route:route.abort())
        page.goto(base+'/HONRO.html'); page.wait_for_function('document.documentElement.dataset.honroReady')
        page.get_by_role('button',name='설정',exact=True).click()
        page.evaluate('HonroApp.close();HonroApp.debugMode=true;HonroApp.launch(16)')
        page.wait_for_function('n=>HonroApp.audio.music.track===n&&HonroApp.audio.music.current.currentTime>.08',arg=INDEX['22'])
        page.evaluate("HonroApp.audio.music.current.dispatchEvent(new Event('ended'))")
        page.wait_for_function('n=>HonroApp.audio.music.errors.length>0&&HonroApp.audio.music.track===n&&HonroApp.audio.music.current.currentTime>.08',arg=INDEX['21'])
        rows.append({'failed23WrapsTo21':True});context.close()
        editor=browser.new_page();editor.goto(base+'/HONRO_WORKSHOP.html');editor.wait_for_function('window.HonroWorkshopAPI')
        editor.click('[data-tab="play"]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
        play=editor.frames[1];play.evaluate('if(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.turnNotice=null')
        play.locator('#battlecanvas').click(position={'x':300,'y':200})
        play.wait_for_function('HonroApp.audio.music.track===1&&HonroApp.audio.music.current.currentTime>.08')
        play.wait_for_function('document.getElementById("bgm-now-playing").textContent==="배경음 - 고갯마루"')
        editor.evaluate('window.oldAudio=HonroWorkshopAPI.getPlayApp().audio');editor.click('#stopPlay')
        assert editor.evaluate('oldAudio.music.current===null&&oldAudio.music.outgoing===null')
        rows.append({'workshopPlaybackLabelAndDispose':True});browser.close()
    (OUT/'browser.json').write_text(json.dumps({'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'note':'Debug stage entry, real short MP3 playback; ended accelerated; no full listening/combat clear.','checks':rows},ensure_ascii=False,indent=2))
    print(json.dumps(rows,ensure_ascii=False))

if __name__=='__main__':
    run()
