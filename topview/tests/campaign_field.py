"""Exercise Act I inside the shipped title. Unlock-only profiles isolate individual chapters.

Input and cold resume use the public controls. --missions additionally executes
documented controlled cases in a separate fresh battle for each chapter.
"""
import argparse
import json
import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright
from native_entry import enter_chapter

cli=argparse.ArgumentParser()
cli.add_argument('--base', required=True)
cli.add_argument('--out', required=True,type=Path)
cli.add_argument('--chapters', nargs='+', type=int, default=list(range(2,11)))
cli.add_argument('--mobile', action='store_true')
cli.add_argument('--missions', action='store_true')
cli.add_argument('--art', action='store_true')
args=cli.parse_args()
args.out.mkdir(parents=True, exist_ok=True)
mode='touch' if args.mobile else 'desktop'
if args.missions:mode+='-missions'
if args.art:mode+='-art'
report={}
places={2:'procession',3:'ferry',4:'gate',5:'cleat',6:'midDeck',7:'resident2',8:'bier',9:'well',10:'ritual'}
def record():
    (args.out/(mode+'.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2))
def ready(p):
    end=time.monotonic()+28
    while time.monotonic()<end:
        skip=p.locator('[data-action="dialogue-skip"]:visible')
        if skip.count():skip.first.click(force=True,timeout=2800)
        elif p.evaluate("!!HonroApp.engine && HonroApp.canInput() && !HonroStory.turnPaused(HonroApp)"):return
        p.wait_for_timeout(100)
    raise AssertionError(p.locator('body').inner_text()[-420:])
def snapshot(p):
    return p.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,s=HonroObjectives.state(b,a.stage),u=e.active;
      return {chapter:b.honroStage,revision:b.tvTerrainRevision,round:b.round,stage:a.stage.name,active:u?.id,phase:b.phase,
        roster:b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget&&!u.dead).length,actors:b.units.filter(u=>!u.side&&!u.summoned).map(u=>u.id),objective:s.summary,
        x:u?.x,y:u?.y,move:u?.moveLeft,shots:b.shot||0,cast:b.units.length};}""")
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
    for id in args.chapters:
        context=browser.new_context(viewport={'width':844 if args.mobile else 1180,'height':480 if args.mobile else 700},has_touch=args.mobile,is_mobile=args.mobile,device_scale_factor=1)
        p=context.new_page();p.set_default_timeout(18000);row={'access':'isolated prerequisite clears','errors':[]};report[id]=row
        p.on('pageerror',lambda error:row['errors'].append(str(error)))
        try:
            p.goto(args.base,wait_until='domcontentloaded')
            p.wait_for_function('!!window.HonroApp?.profile')
            p.evaluate("""async id=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(id);
                for(let i=1;i<id;i++)a.profile.cleared[i]={visits:1};
                a.launch(id);}""",id)
            ready(p);row['entry']=snapshot(p)
            if args.art:
                p.evaluate("""site=>{const a=HonroApp,t=HonroTopview.space,goal=t.point(site);a.scene.centerAt(goal.x,goal.y);}""",places[id])
                p.wait_for_function("!document.getElementById('turn-banner')||document.getElementById('turn-banner').hidden")
                p.wait_for_function("!document.getElementById('equipment-acquired')||document.getElementById('equipment-acquired').hidden")
                p.wait_for_timeout(120)
                p.screenshot(path=str(args.out/f'{id:02}-{mode}.jpg'),type='jpeg',quality=83)
            elif args.missions:
                row['case']=p.evaluate((Path(__file__).with_name('campaign_missions.js')).read_text(),id)
                failures=[v for v in row['case']['checks'] if not v['pass']]
                if failures:raise AssertionError(failures)
                # Finish the real outro, then use the normal result, rest and
                # ending UI. The combat boundary above is the isolated control.
                until=time.monotonic()+26
                while not p.locator('[data-action=result-continue]:visible, #act-ending:visible').count() and time.monotonic()<until:
                    skip=p.locator('[data-action=dialogue-skip]:visible')
                    if skip.count():skip.first.click(force=True)
                    else:p.wait_for_timeout(100)
                result_button=p.locator('[data-action=result-continue]:visible')
                if result_button.count():result_button.first.click()
                if id==10:
                    cut=p.locator('#act-ending');cut.wait_for(timeout=16000);stills=[]
                    while cut.count():
                        p.wait_for_function("!document.getElementById('act-ending')||document.getElementById('act-ending').dataset.endingBeat!==undefined")
                        if not cut.count():break
                        mark=[cut.get_attribute('data-ending-still'),cut.get_attribute('data-ending-beat')]
                        if mark[0] not in stills:
                            stills.append(mark[0])
                            p.screenshot(path=str(args.out/f'10-ending-{len(stills)}.jpg'),type='jpeg',quality=78)
                        p.keyboard.press('Space')
                        p.wait_for_function("([s,v])=>{const q=document.getElementById('act-ending');return !q||q.dataset.endingStill!==s||q.dataset.endingBeat!==v}",arg=mark,timeout=16000)
                    row['ending']=p.evaluate("()=>({seen:!!HonroApp.profile.seen['act-ending-v1:10'],screen:HonroApp.screen,cleared:!!HonroApp.profile.cleared[10]})")
                    row['ending']['stills']=stills
                    assert row['ending']['seen'] and len(stills)==3 and row['ending']['screen']=='title',row['ending']
                else:
                    p.wait_for_function("id=>HonroApp.engine?.b.honroStage===id+1||HonroApp.screen==='rest'",arg=id)
                    row['interlude']=p.evaluate('HonroApp.screen')
                    if row['interlude']=='rest':
                        until=time.monotonic()+25
                        while time.monotonic()<until:
                            skip=p.locator('[data-action=dialogue-skip]:visible')
                            enter=p.locator('[data-action=journey-enter]:visible')
                            if skip.count():skip.first.click(force=True)
                            elif enter.count():
                                p.wait_for_function("performance.now()>=(HonroApp.journeyInputAfter||0)")
                                enter.first.click();break
                            else:p.wait_for_timeout(100)
                    p.wait_for_function("id=>HonroApp.engine?.b.honroStage===id+1&&HonroApp.engine.b.honroTopview===1",arg=id)
                    row['nextChapter']=p.evaluate('HonroApp.stage.id')
            else:
                before=row['entry'];u=before['active']
                if args.mobile:
                    js=p.locator('#joystick').bounding_box();x=js['x']+js['width']/2;y=js['y']+js['height']/2
                    cdp=context.new_cdp_session(p)
                    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
                    cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+24,'y':y+4}]})
                    p.wait_for_timeout(350)
                    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
                else:
                    p.keyboard.down('d');p.wait_for_timeout(240);p.keyboard.up('d')
                moved=snapshot(p)
                assert moved['active']==u and before['move']-moved['move']>2,('no motion',moved)
                row['walked']=round(before['move']-moved['move'],2)
                fire=p.locator('#fire').bounding_box()
                x,y=fire['x']+fire['width']/2,fire['y']+fire['height']/2
                if args.mobile:
                    cdp=context.new_cdp_session(p)
                    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});p.wait_for_timeout(660)
                    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
                else:
                    p.mouse.move(x,y);p.mouse.down();p.wait_for_timeout(660);p.mouse.up()
                p.wait_for_function("HonroApp.engine.b.shot>0")
                row['released']=snapshot(p)['shots']
                ready(p)
                saved=snapshot(p)
                p.wait_for_function('id=>HonroApp.profile.honroBattle?.honroStage===id',arg=id)
                p.reload(wait_until='domcontentloaded');enter_chapter(p,args.mobile);ready(p)
                restored=snapshot(p);row['resume']=restored
                assert restored['chapter']==id and restored['actors']==saved['actors'] and restored['shots']==saved['shots'],(saved,restored)
            assert not row['errors'],row['errors']
            row['ok']=True
        except Exception as exc:
            row['ok']=False;row['failure']=str(exc)[:1100]
            p.screenshot(path=str(args.out/f'{id:02}-{mode}-failure.jpg'),type='jpeg',quality=78)
        finally:
            record();print(id,row['ok'],row.get('failure','')[:240],flush=True)
            context.close()
    browser.close()
if not all(row['ok'] for row in report.values()):raise SystemExit(1)
