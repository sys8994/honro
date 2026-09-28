import json
from urllib.parse import unquote, urlsplit
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,detail or '',flush=True)

def check_label(page,name,track):
    page.wait_for_function(r'''()=>{const a=HonroApp,m=a.audio.music,l=document.getElementById('bgm-now-playing');
        return !l.hidden&&m.current?.currentTime>.05&&l.textContent==='BGM · '+decodeURIComponent(new URL(m.current.currentSrc).pathname.split('/').pop()).replace(/\.mp3$/i,'');}''')
    source=page.evaluate('HonroApp.audio.music.current.currentSrc')
    filename=unquote(urlsplit(source).path.rsplit('/',1)[-1])
    check(name,filename.startswith(f'{track:02} '),page.locator('#bgm-now-playing').inner_text())

with sync_playwright() as p:
    browser=launch(p)
    for mobile in [False,True]:
        page=browser.new_page(viewport={'width':844 if mobile else 1365,'height':390 if mobile else 768},is_mobile=mobile,has_touch=mobile)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto((ROOT/'HONRO.html').as_uri());page.wait_for_function('window.HonroApp')
        prefix='mobile' if mobile else 'desktop'
        check(prefix+' autoplay initially locked',page.evaluate('HonroApp.audio.music.current===null'))
        check(prefix+' no track label before playback',page.locator('#bgm-now-playing').is_hidden())
        page.locator('[data-action="settings"]').first.click()
        page.wait_for_function('HonroApp.audio.music.current?.currentTime>.15')
        status=page.evaluate('HonroApp.audio.music.status()');check(prefix+' actual MP3 playback after trusted input',status['track']==1 and not status['errors'],status)
        check_label(page,prefix+' main label matches actual MP3',1)
        page.evaluate('window.firstMusic=HonroApp.audio.music.current;HonroApp.showCamp()');page.wait_for_timeout(600)
        check(prefix+' noncombat UI retains Main Theme',page.evaluate('HonroApp.audio.music.current===firstMusic&&firstMusic.currentTime>.3'))
        page.evaluate('HonroApp.showTitle()')
        page.click('[data-action="map"]')
        for _ in range(10):
            skip=page.locator('[data-action="dialogue-skip"]')
            if not skip.count():break
            skip.click();page.wait_for_timeout(100)
        page.click('[data-action="launch"]')
        page.wait_for_function('HonroApp.audio.music.status().track===2&&HonroApp.audio.music.current.currentTime>.1')
        page.wait_for_timeout(500)
        check(prefix+' normal stage entry dialogue already plays battle music',page.evaluate('!!HonroApp.dialogue&&HonroApp.audio.music.outgoing===null&&HonroApp.audio.music.status().playing===1'))
        check_label(page,prefix+' entry dialogue label matches actual battle MP3',2)
        placement=page.locator('#bgm-now-playing').evaluate('''e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {fontSize:s.fontSize,pointerEvents:s.pointerEvents,right:innerWidth-r.right,bottom:innerHeight-r.bottom}}''')
        check(prefix+' tiny noninteractive label at bottom right',placement['fontSize']=='9px' and placement['pointerEvents']=='none' and 0<=placement['right']<=12 and 0<=placement['bottom']<=8,placement)
        page.screenshot(path=str(ROOT/f'_local/reports/bgm-{prefix}-entry.png'))
        page.evaluate('''()=>{const a=HonroApp;for(let i=1;i<=10;i++)a.profile.cleared[i]={};if(a.dialogue)HonroStory.finish(a);a.turnNotice=null;}''')
        for track in [3,4,2]:
            page.evaluate("HonroApp.audio.music.current.dispatchEvent(new Event('ended'))")
            page.wait_for_function('track=>HonroApp.audio.music.status().track===track&&HonroApp.audio.music.current.currentTime>.05',arg=track)
            check_label(page,prefix+f' playlist label follows track {track:02}',track)
        check(prefix+' actual battle streams cycle 02/03/04',True)
        page.evaluate("HonroApp.audio.music.current.dispatchEvent(new Event('ended'));window.trackBefore=HonroApp.audio.music.current;HonroApp.launch(2)")
        page.wait_for_timeout(500)
        check(prefix+' new stage advances from the last battle song',page.evaluate('HonroApp.audio.music.current!==trackBefore&&HonroApp.audio.music.status().track===4'))
        page.evaluate("HonroApp.engine.b.units.find(u=>u.side===1).boss=true;HonroApp.engine.b.units.find(u=>u.side===1).awake=true")
        page.wait_for_function('HonroApp.audio.music.status().track===5&&HonroApp.audio.music.current.currentTime>.1')
        page.wait_for_timeout(500);check(prefix+' boss transition ends with one stream',page.evaluate('HonroApp.audio.music.status().playing')==1)
        check_label(page,prefix+' boss label matches actual MP3',5)
        page.evaluate('if(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.pause();window.pausedMusic=HonroApp.audio.music.current')
        page.wait_for_timeout(100);before=page.evaluate('pausedMusic.currentTime');page.wait_for_timeout(250)
        check(prefix+' pause holds music time',abs(page.evaluate('pausedMusic.currentTime')-before)<.03)
        check(prefix+' pause hides track label',page.locator('#bgm-now-playing').is_hidden())
        page.evaluate('HonroApp.close()');page.wait_for_timeout(350)
        check(prefix+' resume retains stream and time',page.evaluate('HonroApp.audio.music.current===pausedMusic&&pausedMusic.currentTime')>before)
        check_label(page,prefix+' resume restores track label',5)
        page.evaluate('HonroApp.showMap()');page.wait_for_function('HonroApp.audio.music.status().track===1');page.wait_for_timeout(500)
        check(prefix+' battle exit returns to Main Theme',page.evaluate('HonroApp.audio.music.status().playing')==1)
        check_label(page,prefix+' map label returns to actual Main Theme',1)
        page.evaluate('HonroApp.profile.settings.music=false;HonroApp.audio.configure(HonroApp.profile.settings)')
        check(prefix+' BGM mute',page.evaluate('HonroApp.audio.music.status().playing')==0)
        page.wait_for_function('document.getElementById("bgm-now-playing").hidden')
        check(prefix+' BGM mute hides track label',page.locator('#bgm-now-playing').is_hidden())
        page.evaluate("HonroApp.audio.play('arrow')");check(prefix+' existing SFX channel remains active',page.evaluate('HonroApp.audio.playCount>0&&HonroApp.audio.context.state==="running"'))
        page.evaluate('HonroApp.profile.settings.music=true;HonroApp.profile.settings.sound=false;HonroApp.audio.configure(HonroApp.profile.settings)')
        check_label(page,prefix+' SFX mute retains BGM label',1)
        page.evaluate('HonroApp.profile.settings.musicVolume=0;HonroApp.audio.configure(HonroApp.profile.settings)')
        page.wait_for_function('document.getElementById("bgm-now-playing").hidden')
        check(prefix+' zero music volume hides track label',page.locator('#bgm-now-playing').is_hidden())
        page.evaluate('HonroApp.profile.settings.musicVolume=.65;HonroApp.audio.configure(HonroApp.profile.settings)')
        if not mobile:
            for stage in range(1,11):
                page.evaluate('(stage)=>HonroApp.launch(stage)',stage)
                # Canonical stages 3/6/8/10 start with an awake midboss or final boss.
                track=[2,3,5,4,2,5,3,5,4,5][stage-1]
                page.wait_for_function('track=>HonroApp.audio.music.status().track===track&&HonroApp.audio.music.current.currentTime>.05',arg=track)
                check_label(page,f'stage {stage:02} entry uses expected actual MP3',track)
        check(prefix+' no media errors',not page.evaluate('HonroApp.audio.music.errors'),page.evaluate('HonroApp.audio.music.errors'))
        page.close()
    editor=browser.new_page(viewport={'width':1365,'height':768});editor.on('pageerror',lambda e:errors.append(str(e)))
    editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI')
    check('Edit mode creates no audio engine',editor.evaluate('typeof HonroApp==="undefined"'))
    editor.click('[data-tab="play"]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
    play=editor.frames[1]
    play.evaluate('if(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.turnNotice=null')
    play.locator('#battlecanvas').click(position={'x':300,'y':200})
    play.wait_for_function('HonroApp.audio.music.current?.currentTime>.1')
    status=play.evaluate('HonroApp.audio.music.status()')
    check('Playtest streams BGM through actual game audio',status['track']==2 and not status['errors'],status)
    check_label(play,'Playtest label matches actual battle MP3',2)
    editor.evaluate('window.oldPlayAudio=HonroWorkshopAPI.getPlayApp().audio')
    editor.click('#stopPlay')
    check('Stop disposes playtest BGM/SFX',editor.evaluate('oldPlayAudio.music.current===null&&oldPlayAudio.context.state==="closed"'))
    browser.close()
check('No uncaught audio browser errors',not errors,errors)
(ROOT/'_local/reports/audio-browser.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
