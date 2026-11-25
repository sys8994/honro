"""Walk from the approved E floor into D, then rehearse the real exterior reunion."""
import argparse
import json
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright

import browser as base
from cold_resume import saved_context, seeded_context, storage_hash
from hall_passage import live_d
from legacy54_live import hold, resume
from mobile_seams import POINTER_EVENTS, move
from relay_live_chain import boundary_of, cold_new, reversal56

OBSERVE="""() => {
 const e=HonroApp.engine,b=e.b,u=e.active;
 const t=e.contactSurface(u.x,u.y-4,u.y+5)?.t??null;
 const gravity=HONRO_CORE.environmentAt(b.physics,u.x,u.y-u.h*.5,true).gravity;
 return {x:u.x,y:u.y,mode:b.phase,support:t?.id,grounded:e.grounded(u),gravity,terrain:b.terrain.length,
  art:b.honroLandmarks?.find(v=>v.id==='art-mumyeongsa-hall-sill')?.asset.visual};
}"""
TAMPER="""
const fs=require('node:fs'),crypto=require('node:crypto');
const [kind,stage]=process.argv.slice(1);
const source=JSON.parse(fs.readFileSync(0,'utf8'));
const key=Object.keys(source).find(k=>k.includes('act6-boundary'));
const payload=JSON.parse(source[key]), envelope=payload.honroAct6ChapterBoundary,body=envelope.body;
const sha=o=>crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
if(body.to!==Number(stage))throw Error('Wrong native checkpoint');
if(kind==='removed'){
 delete body.terminal.boundary.interiorD;delete body.custody.interiorD;
}else if(kind==='normal'){
 body.terminal.boundary.interiorD.contact.normal.x=1;body.custody.interiorD.contact.normal.x=1;
}else if(kind==='junction'){
 body.terminal.boundary.interiorD.contact.junctionY+=1;body.custody.interiorD.contact.junctionY+=1;
}
body.terminalSHA=sha(body.terminal);body.custodySHA=sha(body.custody);envelope.sha=sha(body);
source[key]=JSON.stringify(payload);console.log(JSON.stringify(source));
"""


def reject(browser,records,stage,kind):
    invalid=json.loads(subprocess.check_output(['node','-e',TAMPER,kind,str(stage)],
                                              input=json.dumps(records),text=True))
    context=saved_context(browser,invalid)
    try:
        page=context.new_page()
        page.goto(base.BASE+'HONRO.html',wait_until='domcontentloaded')
        page.wait_for_function("window.HonroApp && !document.querySelector('[data-startup-title]')",timeout=13000)
        base.action(page,'rest').click(timeout=6500)
        page.wait_for_function("HonroApp.screen==='rest' && !HonroApp.dialogue",timeout=10000)
        button=page.locator(f'[data-act6-boundary-resume="{stage}"]')
        if button.is_visible():
            button.click(timeout=6000)
            page.wait_for_function("document.querySelector('#notice')?.textContent.includes('기록을 열지 못했습니다')",timeout=6000)
        assert page.evaluate('!HonroApp.engine') and invalid==base.saved_bytes(page)
        return True
    finally:
        context.close()


def play(browser,args,mobile):
    ctx=seeded_context(browser,56,mobile=mobile)
    page=ctx.new_page()
    report={'status':'FAIL','viewport':page.viewport_size,'pageErrors':[]}
    page.on('pageerror',lambda exc:report['pageErrors'].append(str(exc)))
    saved_profile=None

    def walk_d(p,out,q):
        q['beforeExtension']=p.evaluate(OBSERVE)
        old_record=base.saved_bytes(p)
        assert q['beforeExtension']['support']=='E-joined-ordinary-floor'
        p.evaluate(POINTER_EVENTS)

        def input_until(condition):
            if mobile:
                move(ctx,p,1,condition,timeout=11000)
            else:
                hold(p,'ArrowRight',condition,None,11000)

        input_until("!!HonroApp.engine.b.honroState.localHallD56")
        q['atOldExit']=p.evaluate(OBSERVE)
        assert q['atOldExit']['mode']=='aim' and q['atOldExit']['terrain']==q['beforeExtension']['terrain']+1
        assert not p.locator('[data-act6-qa-next="57"]').is_visible()
        assert p.evaluate('HonroApp.canInput()&&!HonroApp.done')
        sealed=base.saved_bytes(p)
        assert sealed==old_record and boundary_of(sealed)['to']==56
        q['oldExitCheckpoint']={'clickable':False,'canMove':True,'destination':56,'unchanged':True,'digest':storage_hash(sealed)}
        input_until("HonroApp.engine.active.x>=6670")
        q['onSharedStone']=p.evaluate(OBSERVE)
        assert q['onSharedStone']['support']=='m56-d-hall-sill' and q['onSharedStone']['grounded']
        assert q['onSharedStone']['gravity']=={'x':0,'y':320}
        p.screenshot(path=out/'d-interior-step.png')
        input_until("HonroApp.engine.b.phase==='won'")
        q['exitFoot']=p.evaluate(OBSERVE)
        assert q['exitFoot']['support']=='m56-d-hall-sill' and q['exitFoot']['grounded']
        q['touch']=p.evaluate('seamTouches')
        if mobile:
            assert len(q['touch'])>=4 and all(x['trusted'] and x['type']=='touch' for x in q['touch'])
        p.screenshot(path=out/'d-interior-departure.png')

    try:
        resume(page,56,True,mobile=mobile)
        saved_profile=base.saved_bytes(page)['honro-first-act-profile-1']
        if args.combat_account:
            from exterior_combat import TRACE
            page.evaluate(TRACE)
        reversal56(page,args.out,report,finish=True,exit_route=walk_d,check_pressure=args.check_pressure,combat=args.combat_account)
        if args.combat_account:
            report['combat56']=page.evaluate('window.a6Exterior')
            report['combat56'].pop('frames')
        new57=base.saved_bytes(page)
        report['checkpoint57']=body57=boundary_of(new57)
        receipt=body57['terminal']['boundary']['interiorD']
        assert body57['custody']['interiorD']==receipt
        assert receipt['contact']['x']==report['exitFoot']['x'] and receipt['contact']['y']==report['exitFoot']['y']
        if args.check_pressure:
            assert any(x['key']=='inside-at-live-pressure' for x in body57['terminal']['boundary']['reflow'])
        assert report['checkpoint57']['from']==56 and body57['terminal']['sodanThread']['casts'][-1]['stage']==56
        report['cold57']=cold_new(browser,new57,57)
        assert report['cold57']['savedBytesBefore']==report['cold57']['savedBytesAfter']
        report['wrong57']={mode:reject(browser,new57,57,mode) for mode in ['normal','junction','removed']}
        assert new57['honro-first-act-profile-1']==saved_profile
        if not mobile or args.touch_exterior:
            report['exterior']=exterior=live_d(browser,args.out,sodan=not mobile,session=(ctx,page),touch_d=mobile)
            assert exterior['status']=='PASS',exterior.get('error')
            assert exterior['sameObjects'] and exterior['checkpoint58']['custody']['interiorD']==receipt
            live=base.saved_bytes(page)
            report['wrong58']={'junction':reject(browser,live,58,'junction')}
            assert page.evaluate('HonroApp.engine.b.honroState.localHallDOrigin')==receipt
            assert report['onSharedStone']['art']==page.evaluate("""HonroApp.engine.b.honroLandmarks
              .find(v=>v.id==='art-mumyeongsa-hall-sill').asset.visual""")
            assert live['honro-first-act-profile-1']==saved_profile
        assert not report['pageErrors'],report['pageErrors']
        report['status']='PASS'
    except Exception as error:
        report['error']=str(error)
        if page.evaluate('!!HonroApp.engine'):
            report['last']=page.evaluate(OBSERVE)
        page.screenshot(path=args.out/'d-interior-failure.png',timeout=5000)
    finally:
        if args.combat_account and 'combat56' not in report:
            report['combat56']=page.evaluate('window.a6Exterior??null')
            if report['combat56']:
                report['combat56'].pop('frames')
        ctx.close()
    return report


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build',required=True,type=Path)
    parser.add_argument('--out',required=True,type=Path)
    parser.add_argument('--touch',action='store_true')
    parser.add_argument('--touch-exterior',action='store_true')
    parser.add_argument('--check-pressure',action='store_true')
    parser.add_argument('--combat-account',action='store_true')
    args=parser.parse_args()
    if args.touch_exterior and not args.touch:
        parser.error('--touch-exterior requires --touch')
    base.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as playwright:
        with playwright.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage']) as browser:
            result=play(browser,args,args.touch)
    (args.out/'d-interior.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(result['status'],result.get('error',''),flush=True)
    raise SystemExit(result['status']!='PASS')
