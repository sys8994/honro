"""Walk the official cliff, stone bridge and lower bell sites in Stage 52."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base
from cold_resume import seeded_context, storage_hash
from courtyard_combat import shot
from hall_passage import march, select
from legacy54_live import resume
from relay_live_chain import boundary_of, cold_new, ready
from second_pass import sample_walk

MARK='[data-act6-qa-lookout]'

def pass_until(page,condition,limit=8):
    for _ in range(limit):
        base.dismiss_dialogue(page)
        ready(page,45000)
        if page.evaluate(condition):
            return
        page.keyboard.press('f')
        page.wait_for_timeout(180)
    raise AssertionError('No suitable next action before the turn limit')

def bridge_fight(page,q):
    for _ in range(12):
        ready(page,45000)
        d=page.evaluate("""()=>{const e=HonroApp.engine,u=e.unit('bridge-keeper');
          return {x:u.x,y:u.y,hp:u.hp,round:e.b.round};}""")
        if d['hp']<=0:
            return
        who='mage' if e_round(page)%2 else 'archer'
        march(page,max(2450,min(d['x']-240,3150)),cls=who,tolerance=55)
        spec=shot(page,{'skills':['M01','M07'] if who=='mage' else ['A02','A01','A14'],'actor':'bridge-keeper'})
        q['bridgeShots'].append({'before':d,'spec':spec})
        if spec is None:
            sample_walk(page,1, min(3350,d['x']-110),2200)
            if not shot(page,{'skills':['M01'] if who=='mage' else ['A02','A01'],'actor':'bridge-keeper'}):
                page.keyboard.press('f')
        page.wait_for_timeout(250)
    raise AssertionError('The stone bridge keeper was still alive')

def e_round(page):
    return page.evaluate('HonroApp.engine.b.round')

def finish(browser,args):
    ctx=seeded_context(browser,52)
    page=ctx.new_page()
    r={'status':'FAIL','bridgeShots':[],'descent':[],'errors':[],'warnings':[]}
    page.on('pageerror',lambda exc:r['errors'].append(str(exc)))
    page.on('console',lambda msg:r['warnings'].append(msg.text) if msg.type=='warning' else None)
    try:
        resume(page,52,True)
        original=base.saved_bytes(page)['honro-first-act-profile-1']
        page.evaluate(base.TRACE)
        r['cliffShots']=[]
        for _ in range(3):
            if page.evaluate("HonroApp.engine.unit('cliff-stone')?.dead"):
                break
            pass_until(page,"HonroApp.engine.active?.cls==='archer'")
            before=page.evaluate("HonroApp.engine.unit('cliff-stone').hp")
            spec=shot(page,{'skills':['A01'],'actor':'cliff-stone'})
            assert spec,'No direct shot at the original cliff stone'
            page.wait_for_function("hp=>HonroApp.engine.unit('cliff-stone')?.hp<hp",arg=before,timeout=16000)
            r['cliffShots'].append({'input':spec,'before':before,'after':page.evaluate("HonroApp.engine.unit('cliff-stone').hp")})
        assert page.evaluate("HonroApp.engine.unit('cliff-stone')?.dead")
        pass_until(page,"HonroApp.engine.active?.cls==='archer'")
        march(page,1200,cls='archer',tolerance=70)
        page.locator(MARK).filter(has_text='높은 암벽').click(timeout=6000)
        page.locator(MARK).filter(has_text='석교 방어선').wait_for(timeout=6500)
        bridge_fight(page,r)
        r['bridge']=march(page,3290,cls='knight',tolerance=50)
        assert r['bridge']['contact']=='broken-arch-west',r['bridge']
        page.locator(MARK).filter(has_text='석교 방어선').click(timeout=6000)
        page.locator(MARK).filter(has_text='빈 종터').wait_for(timeout=6500)
        shelves=(('landing-1',3660),('landing-2',3797),('landing-3',3648),('landing-4',3795),('landing-5',4190),('east-return-buttress',4399))
        for role in ('occultist','knight','archer','mage'):
            for surface,x in shelves:
                record=march(page,x,cls=role,tolerance=18)
                r['descent'].append({'role':role,'expected':surface,'pose':record})
                assert record['contact']==surface,record
        select(page,'occultist',advance=True)
        page.locator(MARK).filter(has_text='빈 종터').click(timeout=6500)
        page.locator(MARK).filter(has_text='담허').wait_for(timeout=6500)
        select(page,'mage',advance=True)
        page.locator(MARK).filter(has_text='담허').click(timeout=6500)
        page.wait_for_function("HonroApp.engine.b.phase==='won'",timeout=8000)
        page.screenshot(path=args.out/'native-52-bell.png')
        page.locator('[data-act6-qa-next="53"]').click(timeout=6500)
        page.wait_for_function('HonroApp.engine?.b?.honroStage===53',timeout=13000)
        saved=base.saved_bytes(page)
        assert original==saved['honro-first-act-profile-1']
        r['seal']=boundary_of(saved)
        r['new53']=cold_new(browser,saved,53)
        assert r['new53']['savedBytesBefore']==r['new53']['savedBytesAfter']
        r['status']='PASS'
    except (Error,AssertionError) as err:
        r['error']=str(err)[:1400]
        r['notice']=page.locator('#notice').text_content()
        if any('act6-boundary' in k for k in base.saved_bytes(page)):
            r['committedTo']=boundary_of(base.saved_bytes(page))['to']
        page.screenshot(path=args.out/'native-52-failure.png')
    finally:
        r['trace']=page.evaluate('window.act6BaselineEvents??[]')
        if page.evaluate('!!HonroApp.engine'):
            r['last']=page.evaluate(base.SNAPSHOT)
        ctx.close()
    return r

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--build',required=True,type=Path)
    p.add_argument('--out',required=True,type=Path)
    args=p.parse_args()
    base.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        with pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']) as b:
            r=finish(b,args)
    (args.out/'cliff-bell-chain.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
    print(r['status'],r.get('error',''),flush=True)

if __name__=='__main__':
    main()
