"""Real browser MP3/label checks. Debug launches and synthetic ended are not full plays/listening."""
import json
from urllib.parse import urlsplit, unquote
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch, serve_game

CATALOG = json.loads((ROOT/'shared/data/bgm.json').read_text())
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
            page.on('request', lambda r: requests.append(unquote(urlsplit(r.url).path).split('/')[-1]) if '.mp3' in r.url else None)
            page.goto(base+'/HONRO.html'); page.wait_for_function('document.documentElement.dataset.honroReady')
            assert page.evaluate('HONRO_BGM_TRACKS.length') == 7, 'Build the seven-track source first'
            page.wait_for_timeout(400)
            assert set(requests) <= {'main.mp3'}, requests
            initial = list(requests)
            page.get_by_role('button', name='설정', exact=True).click()
            def playing(index):
                item = CATALOG[index]
                page.wait_for_function('''arg=>{const m=HonroApp.audio.music,l=document.getElementById('bgm-now-playing');
                  return m.track===arg.index && m.current?.currentTime>.08 && !m.current.paused && !m.outgoing
                    && !l.hidden && l.textContent==='배경음 - '+arg.title;}''', arg={'index':index,'title':item['title']})
                assert page.evaluate('HonroApp.audio.music.status().playing') == 1
                assert unquote(urlsplit(page.evaluate('HonroApp.audio.music.current.currentSrc')).path).endswith('/'+item['file'])
            playing(0); page.locator('#modal button.close').click()
            page.evaluate('HonroApp.debugMode=true')
            mappings = []
            for stage, index in [(1,1),(9,3),(10,3),(11,4),(20,5),(21,1),(30,2)]:
                page.evaluate('(s)=>HonroApp.launch(s)', stage); playing(index)
                assert page.evaluate('HonroApp.audio.music.current.currentTime') < 2
                mappings.append({'stage':stage,'file':CATALOG[index]['file']})
            for stage, sequence in [(1,[1,2,3,1]),(11,[4,5,6,4])]:
                page.evaluate('HonroApp.showTitle()'); playing(0)
                page.evaluate('(s)=>HonroApp.launch(s)', stage); playing(sequence[0])
                for index in sequence[1:]:
                    page.evaluate("HonroApp.audio.music.current.dispatchEvent(new Event('ended'))")
                    playing(index); assert not page.evaluate('HonroApp.audio.music.current.loop')
            # Retry uses the actual pause menu action and advances within act 2.
            page.evaluate('if(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.turnNotice=null;HonroApp.pause();window.kept=HonroApp.audio.music.current')
            before = page.evaluate('kept.currentTime'); page.wait_for_timeout(200)
            assert page.evaluate('kept.currentTime') > before
            page.locator('[data-action="retry"]').click(); playing(5)
            page.evaluate('if(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.turnNotice=null;HonroApp.settings();window.kept=HonroApp.audio.music.current')
            page.locator('#setting-music').uncheck(); page.wait_for_function('HonroApp.audio.music.current.paused&&document.getElementById("bgm-now-playing").hidden')
            page.locator('#setting-music').check(); playing(5); assert page.evaluate('HonroApp.audio.music.current===kept')
            page.evaluate('HonroApp.profile.settings.musicVolume=0;HonroApp.audio.configure(HonroApp.profile.settings)')
            page.wait_for_function('HonroApp.audio.music.current.paused&&document.getElementById("bgm-now-playing").hidden')
            page.evaluate('HonroApp.profile.settings.musicVolume=.4;HonroApp.audio.configure(HonroApp.profile.settings)'); playing(5)
            page.locator('#modal button.close').click()
            page.evaluate('HonroApp.showRest()'); playing(0)
            page.evaluate('window.kept=HonroApp.audio.music.current;HonroApp.showTitle()'); playing(0)
            assert page.evaluate('HonroApp.audio.music.current===kept')
            page.screenshot(path=str(OUT/f'title-{width}.png'))
            assert not errors and not page.evaluate('HonroApp.audio.music.errors')
            rows.append({'width':width,'initialMp3Requests':initial,'mappings':mappings,'cycles':[[1,2,3,1],[4,5,6,4]],'retryMuteVolumeRestTitle':True,'errors':errors})
            context.close()
        context=browser.new_context(); page=context.new_page()
        page.route('**/battle-6.mp3',lambda route:route.abort())
        page.goto(base+'/HONRO.html'); page.wait_for_function('document.documentElement.dataset.honroReady')
        page.get_by_role('button',name='설정',exact=True).click()
        page.evaluate('HonroApp.close();HonroApp.debugMode=true;HonroApp.launch(11)')
        for track in [4,5]:
            page.wait_for_function('n=>HonroApp.audio.music.track===n&&HonroApp.audio.music.current.currentTime>.08',arg=track)
            page.evaluate("HonroApp.audio.music.current.dispatchEvent(new Event('ended'))")
        page.wait_for_function('HonroApp.audio.music.errors.length>0&&HonroApp.audio.music.track===4&&HonroApp.audio.music.current.currentTime>.08')
        rows.append({'failedBattle6ReturnsToBattle4':True});context.close()
        editor=browser.new_page();editor.goto(base+'/HONRO_WORKSHOP.html');editor.wait_for_function('window.HonroWorkshopAPI')
        editor.click('[data-tab="play"]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
        play=editor.frames[1];play.evaluate('if(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.turnNotice=null')
        play.locator('#battlecanvas').click(position={'x':300,'y':200})
        play.wait_for_function('HonroApp.audio.music.track===1&&HonroApp.audio.music.current.currentTime>.08')
        play.wait_for_function('document.getElementById("bgm-now-playing").textContent==="배경음 - 장막 너머의 음"')
        editor.evaluate('window.oldAudio=HonroWorkshopAPI.getPlayApp().audio');editor.click('#stopPlay')
        assert editor.evaluate('oldAudio.music.current===null&&oldAudio.music.outgoing===null')
        rows.append({'workshopPlaybackLabelAndDispose':True});browser.close()
    (OUT/'browser.json').write_text(json.dumps({'note':'Debug stage entry, real short MP3 playback; ended accelerated; no full listening/combat clear.','checks':rows},ensure_ascii=False,indent=2))
    print(json.dumps(rows,ensure_ascii=False))

if __name__=='__main__':
    run()
