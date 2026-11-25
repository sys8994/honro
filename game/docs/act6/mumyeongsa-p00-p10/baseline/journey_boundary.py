"""Check what the normal journal and rest reveal from the same chapter save."""
import argparse
import json
from pathlib import Path
import subprocess

from playwright.sync_api import Error, sync_playwright

import browser as base
from cold_resume import NODE, saved_context, storage_hash

VARIANTS = """
if(process.argv[3]==='retired')body.pin.fromPacket='f'.repeat(64);
if(process.argv[3]==='damaged')body.custody.witness.skill='M01';
"""

def case(browser,args,variant):
    fixtures=args.build/'shared/act6-debug-stages/fixtures.json'
    node=NODE.replace('console.log(JSON.stringify({',VARIANTS+'console.log(JSON.stringify({')
    seed=json.loads(subprocess.check_output(['node','-e',node,str(fixtures),'55',variant],text=True))
    context=saved_context(browser,seed)
    p=context.new_page()
    out={'variant':variant,'errors':[]}
    p.on('pageerror',lambda error:out['errors'].append(str(error)))
    try:
        p.goto(base.BASE+'HONRO.html',wait_until='domcontentloaded')
        p.wait_for_function("window.HonroApp && !document.querySelector('[data-startup-title]')",timeout=13000)
        base.action(p,'rest').click(timeout=6500)
        p.wait_for_function("HonroApp.screen==='rest'&&!HonroApp.dialogue",timeout=9500)
        before=storage_hash(base.saved_bytes(p))
        out['initialRest']=p.locator('.rest-actions').first.inner_text()
        out['restView']=p.evaluate('HonroAct6Journey.view(HonroApp)')
        base.action(p,'journey-book').click(timeout=6500)
        p.wait_for_function("HonroApp.screen==='journey'",timeout=8000)
        out['journal']=p.evaluate("""()=>({view:HonroAct6Journey.view(HonroApp), selection:HonroApp.journeySelection,
          act:HonroApp.journeyAct,
          pins:[...document.querySelectorAll('[data-action=journey-select]')].map(x=>Number(x.dataset.id)),
          detail:document.querySelector('.journey6-detail')?.textContent,
          continue:!![...document.querySelectorAll('[data-action=rest]')].find(x=>x.textContent.includes('쉼터에서 이어가기'))})""")
        p.screenshot(path=args.out/f'journey-{variant}.png')
        if out['journal']['continue']:
            p.locator('[data-action="rest"]').filter(has_text='쉼터에서 이어가기').first.click(timeout=2500)
        else:
            p.locator('.journey-exit').click(timeout=6500)
        p.wait_for_function("HonroApp.screen==='rest'&&!HonroApp.dialogue",timeout=9500)
        if variant=='historical':
            p.locator('[data-act6-boundary-resume="55"]').click(timeout=6500)
            p.wait_for_function('HonroApp.engine?.b.honroStage===55',timeout=12000)
            out['resumes']=p.evaluate('HonroApp.engine.b.honroStage')
        out['storageUnchanged']=before==storage_hash(base.saved_bytes(p))
        if args.expect_aligned:
            journal=out['journal']
            if variant=='historical':
                assert journal['view']['current']==55 and journal['continue'] and out['resumes']==55
                assert journal['pins']==[51,52,53,54,55],journal
            elif variant=='retired':
                assert journal['view']['current']==51 and journal['pins']==[51] and journal['continue'],journal
            else:
                assert journal['view']['current'] is None and journal['pins']==[51] and not journal['continue'],journal
                assert '6막 5장' not in out['initialRest']
            assert out['storageUnchanged'] and not out['errors']
        out['status']='OBSERVED'
    except (Error,AssertionError) as error:
        out['status']='FAIL'
        out['error']=str(error)[:2400]
    finally:
        context.close()
    return out

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build',required=True,type=Path)
    parser.add_argument('--out',required=True,type=Path)
    parser.add_argument('--expect-aligned',action='store_true')
    args=parser.parse_args()
    base.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
                                   args=['--no-sandbox','--disable-dev-shm-usage'])
        for v in ('historical','retired','damaged'):
            r=case(browser,args,v)
            (args.out/f'{v}.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
            print(v,r['status'],r.get('error','')[:230],flush=True)
        browser.close()

if __name__=='__main__':
    main()
