"""Play the normal Act 6 chain in one warm tab, with independent cold boundary reads."""
import argparse
import json
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright

import browser as base
import cliff_bell_chain
import courtyard_combat
import daedosa_return
import hall_passage
import native_b
from cold_resume import storage_hash
from exterior_audit import open_stage
from exterior_combat import complete_overlook
from legacy54_live import walk_eave
from relay_live_chain import boundary_of, cold_new, finish_bell, reversal56
from return_gate import proceed


def write(out, name, data):
    (out/f'{name}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')


def enter_ending(page, out):
    base.dismiss_dialogue(page)
    cut_file=base.ROOT/'shared/act6-ending-replan/cues.mjs'
    duration=json.loads(subprocess.check_output([
        'node','--input-type=module','-e',
        "const {cuts}=await import(process.argv[1]);console.log(JSON.stringify(cuts.reduce((sec,cut)=>sec+cut.duration,0)));",
        cut_file.as_uri(),
    ],text=True))
    quiet=json.loads(next((base.ROOT/'web/data').glob('act6-qa-chapter-60.*.json')).read_text())['quiet']
    driver=(base.ROOT/'tools/act6-ending-v2/drive60.js').read_text()
    page.clock.install()
    page.clock.pause_at(page.evaluate('Date.now()+1000'))
    page.evaluate('(payload)=>globalThis.testDriver=('+driver+')(payload)',[quiet,None])
    step=page.evaluate('testDriver.next()')
    while not step['done']:
        button='[data-act6-qa-lookout]' if step['value']['kind']=='guide' else '[data-act6-qa-walk]'
        page.locator(button).click(force=True)
        step=page.evaluate('testDriver.next(true)')
    assert step['value']['shot']==0 and len(step['value']['escort'])==2,step
    page.clock.run_for(400)
    main=page.locator('.he-root[data-ending-mode="completion"]')
    main.wait_for(timeout=15000)
    assert main.get_attribute('data-ending-phase')=='dialogue'
    page.screenshot(path=out/'continuous-60-dialogue.png')
    page.clock.run_for(700)
    button=main.locator('[data-ending-action="continue"]')
    assert '소단' in main.inner_text()
    button.click()
    assert '휘겸' in main.inner_text()
    button.click()
    page.clock.run_for(1000)
    names=main.locator('.he-memorial').inner_text().split()
    assert names==['곽진','박문돌','이만복'],names
    page.screenshot(path=out/'continuous-60-memorial.png')
    finale=page.evaluate("JSON.parse(localStorage.getItem('honro-campaign-act6-finale-v1:'+HonroApp.profile.equipment.runId))")
    assert all(finale['honroFlags'][key] is True for key in ('act6.endingCompleted','game_completed','ending_act6_seen'))
    page.clock.fast_forward(4000+int(1000*duration))
    assert page.evaluate("HonroApp.screen==='title'&&!HonroApp.endingGallery")
    return {'walk':step['value'],'memorial':names,'receipt':finale['honroEndingReceipt'],'returnedToTitle':True}


def play(browser,args):
    context,page=open_stage(browser,51,False,init_script=native_b.FRAME_DRIVER.replace('HZ','60'))
    session=(context,page)
    original=base.saved_bytes(page)['honro-first-act-profile-1']
    q={'status':'FAIL','boundaries':[],'errors':[]}
    page.on('pageerror',lambda err:q['errors'].append(str(err)))

    def transitioned(stage):
        assert page.evaluate('HonroApp.engine.b.honroStage')==stage
        records=base.saved_bytes(page)
        seal=boundary_of(records)
        assert (seal['from'],seal['to'])==(stage-1,stage),seal
        assert records['honro-first-act-profile-1']==original
        q['boundaries'].append({'from':stage-1,'to':stage,'storageHash':storage_hash(records)})
        write(args.out,'continuous',q)
        print(f'Warm stage {stage}, signed boundary and original save checked',flush=True)
        base.dismiss_dialogue(page)
        return records

    def approved(name,report):
        write(args.out,name,report)
        assert report['status']=='PASS',report.get('error')

    try:
        overlook={}
        complete_overlook(browser,page,overlook,args)
        write(args.out,'overlook',overlook)
        transitioned(52)
        approved('cliff',cliff_bell_chain.finish(browser,args,session))
        transitioned(53)
        approved('native-b',native_b.run(browser,args.out,60,spirit=True,spirit53=True,session=session,on_54=transitioned))
        transitioned(55)
        relay={}
        finish_bell(page,args.out,relay,args.bell_case)
        six=transitioned(56)
        relay['new56']=cold_new(browser,six,56)
        relay['ceilingReceive']=walk_eave(page,args.out,True,'-continuous')
        reversal56(page,args.out,relay,finish=True)
        seven=transitioned(57)
        relay['new57']=cold_new(browser,seven,57)
        write(args.out,'relay',relay)
        approved('hall',hall_passage.live_d(browser,args.out,sodan=True,session=session))
        transitioned(58)
        approved('daedosa',daedosa_return.play(browser,args.out,22,session=session))
        transitioned(59)
        courtyard={}
        proceed(page,args.out,courtyard,'continuous')
        hall_passage.select(page,'knight')
        hall_passage.march(page,3225,cls='knight',tolerance=24)
        page.wait_for_function('HonroApp.engine.b.honroState.localReturnGuardAftermath',timeout=4500)
        try:
            courtyard_combat.finish59(browser,page,args,courtyard)
        finally:
            write(args.out,'courtyard',courtyard)
        transitioned(60)
        q['ending']=enter_ending(page,args.out)
        assert base.saved_bytes(page)['honro-first-act-profile-1']==original
        assert not q['errors'],q['errors']
        q['status']='PASS'
    except Exception as error:
        q['error']=str(error)
        if page.evaluate('!!HonroApp.engine'):
            q['last']=page.evaluate(base.SNAPSHOT)
        page.screenshot(path=args.out/'continuous-failure.png',timeout=4000)
    finally:
        write(args.out,'continuous',q)
        context.close()
    return q


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build',required=True,type=Path)
    parser.add_argument('--out',required=True,type=Path)
    parser.add_argument('--bell-case',choices=['repair','intact'],default='intact')
    parser.add_argument('--engage-bell',action='store_true')
    parser.add_argument('--rounds',type=int,default=18)
    args=parser.parse_args()
    base.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as playwright:
        with playwright.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage']) as browser:
            result=play(browser,args)
    print(result['status'],result.get('error',''),flush=True)
    raise SystemExit(result['status']!='PASS')
