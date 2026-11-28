"""Replay earned Act I saves using the production walk, prediction, attack and turn code.

The simulation accelerates battle ticks. It shares the public title, chapter, result
and ending controllers, and does not write HP, difficulty, clear flags or quest state.
"""
import argparse
import hashlib
import json
import os
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

from native_entry import enter_chapter


def camp_and_depart(page):
    page.wait_for_function("performance.now()>=(HonroApp.journeyInputAfter||0)")
    while page.locator('[data-action=dialogue-skip]:visible').count():
        page.locator('[data-action=dialogue-skip]:visible').first.click()
    camp = page.locator('[data-action=camp]:visible')
    if camp.count():
        camp.first.click()
        classes = page.evaluate('HonroApp.profile.recruited')
        for cls in classes:
            page.evaluate("cls=>HonroApp.showCamp(cls)", cls)
            # Some camp layouts hide the auto-allocation button. Both layouts
            # dispatch the same native allocation rule and save to this profile.
            auto = page.locator('[data-action=autotrain]:visible')
            if auto.count():
                auto.first.click()
            else:
                page.evaluate("""()=>{const a=HonroApp,c=HONRO_CORE;
                  c.autoTrain(a.profile.heroes[a.cls],a.cls);
                  c.sanitizeLoadout(a.profile,a.cls);a.saveCampAllocation();}""")
        page.evaluate('HonroApp.showRest()')
    page.locator('[data-action=journey-enter]:visible').first.click()
    page.wait_for_function('!!HonroApp.engine?.b.honroTopview')


def finish_ending(page):
    cut = page.locator('#act-ending')
    seen = []
    while cut.count():
        page.wait_for_function("!document.getElementById('act-ending')||document.getElementById('act-ending').dataset.endingBeat!==undefined")
        if not cut.count():
            break
        mark = [cut.get_attribute('data-ending-still'), cut.get_attribute('data-ending-beat')]
        if mark[0] not in seen:
            seen.append(mark[0])
        page.keyboard.press('Space')
        page.wait_for_function("""([id,beat])=>{const n=document.getElementById('act-ending');
            return !n||n.dataset.endingStill!==id||n.dataset.endingBeat!==beat;}""", arg=mark)
    state = page.evaluate("""()=>({screen:HonroApp.screen,seen:!!HonroApp.profile.seen['act-ending-v1:10'],
                   cleared:Object.keys(HonroApp.profile.cleared).map(Number)})""")
    assert state['screen']=='title' and state['seen'] and len(seen)==3 and 10 in state['cleared'], (seen,state)
    return {**state,'stills':seen}


def run(args):
    source = args.checkpoint.read_bytes()
    initial = json.loads(source)
    chapter = initial.get('honroBattle', {}).get('honroStage', 0)
    if not 2<=chapter<=10 or not initial['honroBattle'].get('honroTopview') or str(chapter-1) not in initial.get('cleared', {}):
        raise ValueError('Supply a saved campaign battle earned from a preceding chapter.')
    args.out.mkdir(exist_ok=True,parents=True)
    tactics = Path(__file__).with_name('campaign_tactics.js').read_text().strip().removesuffix(';')
    report={'sourceSha256':hashlib.sha256(source).hexdigest(),'startChapter':chapter,
            'mode':'accelerated native simulation','chapters':{},'errors':[]}
    target=args.out/'result.json'
    def persist():
        target.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':1150,'height':680})
        page.on('pageerror',lambda err:report['errors'].append(str(err)))
        try:
            page.goto(args.base,wait_until='domcontentloaded')
            page.wait_for_function('!!window.HonroApp')
            page.evaluate('s=>localStorage.setItem(HonroTopview.profileKey,s)',source.decode())
            page.reload(wait_until='domcontentloaded')
            enter_chapter(page)
            page.evaluate('choice=>window.clearBierApproach=choice',args.clear_courtyard)
            previous=None
            last_progress=time.monotonic()
            while True:
                page.wait_for_function('document.getElementById("act-ending")||HonroApp.screen==="rest"||HonroApp.screen==="battle"&&HonroApp.engine?.b.honroTopview')
                if page.locator('#act-ending:visible').count():
                    report['ending']=finish_ending(page)
                    report['complete']=True
                    break
                if page.evaluate("HonroApp.screen==='rest'"):
                    camp_and_depart(page)
                row=page.evaluate(tactics)
                stage=str(row['st'])
                if stage not in report['chapters']:
                    report['chapters'][stage]={'rounds':[]}
                    saved=page.evaluate('localStorage.getItem(HonroTopview.profileKey)')
                    (args.out/('chapter-'+stage+'.json')).write_text(saved)
                record=report['chapters'][stage]
                progress=(stage,row['round'],row['phase'],row['active'],row['actions'],row['notice'],(row.get('escort') or {}).get('range'))
                if previous!=progress:
                    last_progress=time.monotonic()
                    previous=progress
                if not record['rounds'] or record['rounds'][-1]['round']!=row['round']:
                    record['rounds'].append(row)
                    persist()
                    print(stage,row['round'],row['phase'],flush=True)
                if row['phase'] in ('won','lost'):
                    record['outcome']=row
                    persist()
                if row['done'] and row['phase']=='lost':
                    raise AssertionError(row['reason'])
                if time.monotonic()-last_progress>55 or row['round']>args.max_rounds:
                    report['lastState']=row
                    raise RuntimeError('Simulation stopped at chapter '+stage+', round '+str(row['round']))
                if row['done']:
                    button=page.locator('[data-action=result-continue]:visible')
                    if button.count():
                        button.first.click()
                        page.wait_for_function("id=>!!document.getElementById('act-ending')||HonroApp.screen==='rest'||HonroApp.engine?.b.honroStage>id",arg=row['st'])
                page.wait_for_timeout(16)
        except Exception as exc:
            report['failure']=str(exc)
            report['complete']=False
        finally:
            page.screenshot(path=str(args.out/'last-screen.jpg'),type='jpeg',quality=82)
            browser.close()
            persist()
    return report.get('complete',False) and not report['errors']


if __name__=='__main__':
    cli=argparse.ArgumentParser(description=__doc__)
    cli.add_argument('--base',required=True)
    cli.add_argument('--checkpoint',required=True,type=Path)
    cli.add_argument('--out',required=True,type=Path)
    cli.add_argument('--clear-courtyard', action='store_true', help='At the bier, clear its announced road before striking the boss.')
    cli.add_argument('--max-rounds',default=70,type=int)
    raise SystemExit(0 if run(cli.parse_args()) else 1)
