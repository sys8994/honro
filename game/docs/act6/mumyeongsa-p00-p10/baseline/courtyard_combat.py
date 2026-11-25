"""Play the opening of the native courtyard and measure both active fronts."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base
from cold_resume import seeded_context
from exterior_combat import TRACE
from hall_passage import march, select
from legacy54_live import resume
from second_pass import touch

def touch_to_guard(page,context):
    card=page.locator('[data-action="select-hero"][data-id="p-knight"]:visible').first
    card.tap(timeout=6500)
    session=context.new_cdp_session(page)
    box=page.locator('#joystick').bounding_box()
    assert box
    x,y=box['x']+box['width']/2,box['y']+box['height']/2
    touch(page,session,x,y,'touchStart')
    try:
        touch(page,session,x+35,y,'touchMove')
        page.wait_for_function('HonroApp.engine.active.x>3185',timeout=3300)
    finally:
        touch(page,session,x+35,y,'touchEnd')

def fight(browser,args,mobile):
    c=seeded_context(browser,59,mobile=mobile)
    page=c.new_page()
    q={'status':'FAIL','interface':'touch' if mobile else 'keyboard','errors':[],'turns':[]}
    page.on('pageerror',lambda e:q['errors'].append(str(e)))
    try:
        resume(page,59,True,mobile=mobile)
        page.evaluate(TRACE)
        if mobile:
            touch_to_guard(page,c)
        else:
            select(page,'knight')
            march(page,3225,cls='knight',tolerance=24)
        page.wait_for_function('HonroApp.engine.b.honroState.localReturnGuardAftermath',timeout=4500)
        for i in range(args.rounds*4):
            base.dismiss_dialogue(page)
            page.wait_for_function('HonroApp.canInput() || HonroApp.done',timeout=45000)
            state=page.evaluate("""()=>{const {engine:e,done}=HonroApp,b=e.b;
                return {done,round:b.round,phase:b.phase,active:e.active?.id,fronts:b.honroState.localFinaleProgress?.fronts,
                  alive:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length};}""")
            q['turns'].append(state)
            if state['done'] or state['round']>args.rounds:
                break
            if mobile:
                page.locator('button[data-action="defend"]:visible').first.tap(timeout=6500)
            else:
                page.keyboard.press('f')
            page.wait_for_timeout(180)
        q['roundsReached']=q['turns'][-1]['round']
        q['ledger']=page.evaluate('HonroApp.engine.b.honroState.localFinaleEdgeWave')
        assert q['ledger'] and not q['errors']
        q['status']='OBSERVED'
    except (AssertionError,Error) as err:
        q['error']=str(err)[:2500]
    finally:
        q['trace']=page.evaluate('window.a6Exterior??null')
        if q['trace']:
            frames=q['trace'].pop('frames')
            q['frameP95HostMs']=sorted(frames)[int(.95*(len(frames)-1))] if frames else None
        if page.evaluate('!!HonroApp.engine'):
            q['last']=page.evaluate(base.SNAPSHOT)
        page.screenshot(path=args.out/f'court-{q["interface"]}.png')
        c.close()
    return q

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--build',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--rounds',type=int,default=5)
    p.add_argument('--touch',action='store_true')
    args=p.parse_args()
    base.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        with pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']) as browser:
            r=fight(browser,args,args.touch)
    (args.out/'court.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
    print(r['status'],r.get('error','')[:240])

if __name__=='__main__':
    main()
