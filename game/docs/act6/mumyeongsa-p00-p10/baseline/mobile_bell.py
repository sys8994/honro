"""Verify Sodan's anchored body and a real touch rebind in the normal bell yard."""
import argparse
import json
from pathlib import Path
import subprocess

from playwright.sync_api import Error, sync_playwright

import browser as base
from cold_resume import NODE, saved_context, seeded_context, storage_hash
from legacy54_live import resume
from relay_live_chain import BELL, pose, stage55_trace
from second_pass import touch

def walk_touch(page,session,target):
    box=page.locator('#joystick').bounding_box()
    assert box
    x,y=box['x']+box['width']/2,box['y']+box['height']/2
    touch(page,session,x,y,'touchStart')
    try:
        touch(page,session,x+36,y,'touchMove')
        page.wait_for_function('x=>HonroApp.engine.active.x>=x',arg=target,timeout=11000)
    finally:
        touch(page,session,x+36,y,'touchEnd')

def equipped_warden(browser,build):
    mask="""
    profile.heroes.occultist.ranks.O13=1;
    for(const original of [body.terminal.external.occultist,body.custody.external.occultist]){
      original.loadout=[...original.loadout.slice(0,3),'O13'];original.ranks.O13=1;
    }
    body.profileSHA=sha(profile);body.terminalSHA=sha(body.terminal);body.custodySHA=sha(body.custody);
    """
    source=NODE.replace('console.log(JSON.stringify({',mask+'console.log(JSON.stringify({')
    path=build/'shared/act6-debug-stages/fixtures.json'
    records=json.loads(subprocess.check_output(['node','-e',source,str(path),'55','warden'],text=True))
    return saved_context(browser,records,mobile=True)

def check(browser,args):
    out=args.out
    ctx=equipped_warden(browser,args.build) if args.warden else seeded_context(browser,55,mobile=True)
    page=ctx.new_page()
    q={'status':'FAIL','errors':[]}
    page.on('pageerror',lambda e:q['errors'].append(str(e)))
    try:
        resume(page,55,True,mobile=True)
        original=storage_hash(base.saved_bytes(page))
        stage55_trace(page)
        q['anchorBefore']=pose(page,'p-occultist')
        page.locator('[data-action="select-hero"][data-id="p-occultist"]:visible').first.tap(force=True,timeout=6500)
        assert page.evaluate("HonroApp.engine.active.id==='p-knight'")
        seated=page.locator('[data-act6-sodan-body]')
        assert seated.is_visible() and seated.is_disabled() is (not args.warden)
        q['seatedControl']=seated.inner_text()
        if not args.warden:
            assert '좌정' in q['seatedControl'] and '이동 봉인' in q['seatedControl']
        session=ctx.new_cdp_session(page)
        walk_touch(page,session,1248)
        page.locator('#jump').tap(timeout=4200)
        walk_touch(page,session,1520)
        page.wait_for_function('HonroApp.engine.grounded(HonroApp.engine.active)',timeout=6500)
        walk_touch(page,session,2650)
        q['guardAtBell']=pose(page,'p-knight')
        page.locator(f'{BELL}[data-act6-mark="reach-bell"]').tap(timeout=6500)
        if args.seat_only:
            walk_touch(page,session,2798)
            q['anchorAfter']=pose(page,'p-occultist')
            assert q['anchorAfter']==q['anchorBefore']
            q['storageUnchanged']=original==storage_hash(base.saved_bytes(page))
            assert q['storageUnchanged'] and not q['errors']
            q['status']='PASS'
            return q
        if args.warden:
            focus=page.evaluate("HonroApp.engine.unit('p-occultist').focus")
            page.locator('[data-act6-sodan-body]').tap(timeout=6500)
            page.wait_for_function("HonroApp.engine.b.units.some(u=>u.summonKind==='warden'&&u.summonOwner==='p-occultist'&&!u.dead)",timeout=14000)
            q['support']=page.evaluate("""() => {const e=HonroApp.engine,u=e.unit('p-occultist');
              return {focus:u.focus,actingGuard:e.active?.id,warden:e.b.units.filter(v=>v.summonKind==='warden').map(v=>({id:v.id,x:v.x,y:v.y,owner:v.summonOwner})),shots:e.b.shot};}""")
            assert q['support']['focus']<focus and q['support']['warden'],q['support']
            q['focusBefore']=focus
            q['anchorAfter']=pose(page,'p-occultist')
            assert all(q['anchorBefore'][k]==q['anchorAfter'][k] for k in ('id','x','y','support'))
            q['storageUnchanged']=original==storage_hash(base.saved_bytes(page))
            assert q['storageUnchanged'] and not q['errors']
            q['status']='PASS'
            return q
        walk_touch(page,session,2798)
        for _ in range(10):
            page.wait_for_function('HonroApp.canInput()||HonroApp.done',timeout=52000)
            if page.locator(BELL).get_attribute('data-act6-binding')=='frayed':
                break
            page.locator('button[data-action="defend"]:visible').first.tap(timeout=6500)
            page.wait_for_timeout(170)
        page.locator(f'{BELL}[data-act6-binding="frayed"]').tap(timeout=6500)
        page.wait_for_function('document.querySelector("[data-act6-qa-lookout]")?.dataset.act6Binding==="secured"',timeout=6500)
        q['anchorAfter']=pose(page,'p-occultist')
        q['trace']=page.evaluate('bellTrace')
        assert any(e.get('owner')=='draft-pressure-0' and e.get('target')=='p-occultist' and
                   e.get('id')=='HLN01' and e.get('after',0)<e.get('before',0) for e in q['trace'])
        assert all(q['anchorBefore'][k]==q['anchorAfter'][k] for k in ('id','x','y','support'))
        q['storageUnchanged']=original==storage_hash(base.saved_bytes(page))
        assert q['storageUnchanged'] and not q['errors']
        q['status']='PASS'
    except (Error,AssertionError) as err:
        q['error']=str(err)[:2400]
        if page.evaluate('!!HonroApp.engine'):
            q['last']=page.evaluate(base.SNAPSHOT)
            q['trace']=page.evaluate('window.bellTrace??[]')
    finally:
        page.screenshot(path=out/'mobile-bell.png')
        ctx.close()
    return q

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--build',required=True,type=Path)
    p.add_argument('--out',required=True,type=Path)
    p.add_argument('--warden',action='store_true')
    p.add_argument('--seat-only',action='store_true')
    args=p.parse_args()
    base.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        with pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']) as b:
            q=check(b,args)
    (args.out/'mobile-bell.json').write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n')
    print(q['status'],q.get('error',''),flush=True)

if __name__=='__main__':
    main()
