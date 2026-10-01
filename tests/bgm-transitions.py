"""Real MP3 and keyboard regression for encounter boundaries, ESC and result screens.

Victory/defeat states are constructed to exercise navigation; this is not a combat clear.
Each page uses an isolated browser context and never touches the user's save.
"""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

checks = []
errors = []


def check(name, ok, detail=None):
    assert ok, (name, detail)
    checks.append({'name': name, 'detail': detail})
    print('PASS', name, detail or '', flush=True)


def skip_story(page):
    for _ in range(12):
        skip = page.locator('[data-action="dialogue-skip"]')
        if not skip.count():
            return
        skip.click()
        page.wait_for_timeout(50)
    raise AssertionError('Story did not finish')


def song(page, name, track):
    page.wait_for_function('''track => {
        const m=HonroApp.audio.music;
        return m.status().track===track && m.current?.currentTime>.08 && !m.current.paused && !m.outgoing;
    }''', arg=track)
    actual = page.evaluate('''() => {const m=HonroApp.audio.music;return {
        ...m.status(),source:decodeURIComponent(m.current.currentSrc.split('/').pop()),
        label:document.getElementById('bgm-now-playing').textContent};}''')
    check(name, actual['playing'] == 1 and actual['source'].startswith(f'{track:02} ')
          and not actual['errors'], actual)


def esc_resume(page, keyboard, prefix, track):
    skip_story(page)
    page.evaluate('window.keptMusic=HonroApp.audio.music.current;window.keptIndex=HonroApp.audio.music.battleIndex')
    for turn in range(3):
        keyboard.press('Escape')
        page.wait_for_function("document.querySelector('.pause-dialog') && !HonroApp.audio.music.paused")
        before = page.evaluate('keptMusic.currentTime')
        page.wait_for_timeout(120)
        check(prefix+f' ESC menu {turn+1} keeps the same song playing', page.evaluate('''before => {
            const m=HonroApp.audio.music;return m.current===keptMusic&&m.battleIndex===keptIndex
                &&m.status().playing===1&&keptMusic.currentTime>before+.05;
        }''', before))
        if turn == 0:
            page.click('[data-action="settings"]')
            page.locator('[data-setting="music"]').uncheck()
            page.locator('[data-setting="music"]').check()
            check(prefix+' battle settings retain the playing song', page.evaluate(
                'HonroApp.audio.music.current===keptMusic&&HonroApp.audio.music.status().playing===1'))
        keyboard.press('Escape')
        song(page, prefix+f' ESC resume {turn+1}', track)
        check(prefix+f' ESC resume {turn+1} retains stream', page.evaluate('HonroApp.audio.music.current===keptMusic'))


def result_screen(page, keyboard, prefix, track, phase):
    skip_story(page)
    page.evaluate('''phase => {const a=HonroApp;window.resultMusic=a.audio.music.current;
        a.engine.b.phase=phase;a.outcome();}''', phase)
    song(page, prefix+' outro stays on battle theme', track)
    skip_story(page)
    page.wait_for_selector('.result')
    song(page, prefix+' result stays on battle theme', track)
    keyboard.press('Escape')
    song(page, prefix+' ESC closing result stays on battle theme', track)
    check(prefix+' result and ESC never replace the stream', page.evaluate('HonroApp.audio.music.current===resultMusic'))


def retry(page, keyboard, prefix, track):
    skip_story(page)
    keyboard.press('Escape')
    page.evaluate('''() => {const m=HonroApp.audio.music;window.musicSelections=[];
        window.selectMusic=m.select;m.select=function(...args){musicSelections.push(args[0]);return selectMusic.apply(this,args);};}''')
    page.click('[data-action="retry"]')
    song(page, prefix+' retry starts next battle song', track)
    check(prefix+' retry never selects main even during mounting', page.evaluate('!musicSelections.includes("main")'))
    page.evaluate('() => {HonroApp.audio.music.select=selectMusic;}')
    skip_story(page)


with sync_playwright() as p:
    browser = launch(p)
    page = browser.new_page(viewport={'width': 1365, 'height': 768})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto((ROOT/'HONRO.html').as_uri())
    page.wait_for_function('window.HonroApp')
    page.click('[data-action="map"]')
    skip_story(page)
    page.click('[data-action="launch"]')
    song(page, 'game first battle', 2)
    esc_resume(page, page.keyboard, 'game', 2)
    # Leave an unfinished battle and continue the very same saved encounter.
    page.evaluate('window.savedSongTime=HonroApp.audio.music.current.currentTime')
    page.keyboard.press('Escape')
    page.click('.pause-menu [data-action="map"]')
    song(page, 'game map uses main theme', 1)
    page.evaluate('HonroApp.showTitle()')
    page.click('[data-action="continue"]')
    song(page, 'game saved encounter keeps its song', 2)
    check('game saved encounter keeps its position', page.evaluate('HonroApp.audio.music.current.currentTime>=savedSongTime'))
    result_screen(page, page.keyboard, 'game victory', 2, 'won')
    page.keyboard.press('Escape')
    page.click('.pause-menu [data-action="map"]')
    song(page, 'game actual battlefield exit uses main theme', 1)
    skip_story(page)
    page.evaluate('HonroApp.stageId=2;HonroApp.mapDock()')
    page.click('[data-action="launch"]')
    song(page, 'game stage 1 to 2 advances without waiting for song end', 3)
    check('game new stage starts its battle track at the beginning', page.evaluate('HonroApp.audio.music.current.currentTime<.9'))
    retry(page, page.keyboard, 'game', 4)
    result_screen(page, page.keyboard, 'game defeat', 4, 'lost')
    retry(page, page.keyboard, 'game wrap', 2)
    # Track 05 belongs to the act finale, not an arbitrary elite or boss flag.
    page.evaluate('''() => {const u=HonroApp.engine.b.units.find(u=>u.side===1);
        u.boss=true;u.awake=true;window.testBossId=u.id;}''')
    song(page, 'game earlier-stage boss keeps normal battle music', 2)
    page.evaluate('''() => {const a=HonroApp;a.engine.b.honroStage=10;a.stageId=10;a.updateAudio();}''')
    song(page, 'game boss appears', 5)
    page.evaluate('''() => {const a=HonroApp,u=a.engine.unit(testBossId);u.dead=true;u.hp=0;}''')
    esc_resume(page, page.keyboard, 'game boss', 5)
    page.keyboard.press('Escape')
    page.click('.pause-menu [data-action="map"]')
    song(page, 'game boss exit', 1)
    page.evaluate('HonroApp.showTitle()')
    page.click('[data-action="continue"]')
    song(page, 'game saved boss encounter preserves boss theme after boss death', 5)
    page.close()

    editor = browser.new_page(viewport={'width': 1365, 'height': 768})
    editor.on('pageerror', lambda e: errors.append(str(e)))
    editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri())
    editor.wait_for_function('window.HonroWorkshopAPI')
    editor.click('[data-tab="play"]')
    editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
    play = editor.frames[1]
    skip_story(play)
    play.locator('#battlecanvas').click(position={'x': 300, 'y': 200})
    song(play, 'Workshop first battle', 2)
    esc_resume(play, editor.keyboard, 'Workshop', 2)
    retry(play, editor.keyboard, 'Workshop', 3)
    result_screen(play, editor.keyboard, 'Workshop victory', 3, 'won')
    retry(play, editor.keyboard, 'Workshop after victory', 4)
    result_screen(play, editor.keyboard, 'Workshop defeat', 4, 'lost')
    retry(play, editor.keyboard, 'Workshop wrap', 2)
    editor.evaluate('window.oldPlayAudio=HonroWorkshopAPI.getPlayApp().audio')
    editor.click('#stopPlay')
    check('Workshop Stop releases both music streams', editor.evaluate(
        'oldPlayAudio.music.current===null&&oldPlayAudio.music.outgoing===null'))
    browser.close()

check('No uncaught transition browser errors', not errors, errors)
(ROOT/'_local/reports/bgm-transitions.json').write_text(json.dumps({
    'note': 'Victory/defeat were constructed to check navigation, not manual combat clears.',
    'checks': checks, 'errors': errors}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
