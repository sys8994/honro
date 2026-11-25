"""Exercise C, D, and R touch movement using read-only Act 6 boundary replays."""
import argparse
import json
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright

import browser as base
from cold_resume import saved_context, seeded_context, storage_hash
from hall_passage import actor, state
from legacy54_live import EAVE_POSE, resume, watch_eave
from return_gate import ROOM
from second_pass import touch

REPLAY="""
const fs=require('node:fs'),crypto=require('node:crypto');
const {profile}=JSON.parse(fs.readFileSync(process.argv[1]))[process.argv[4]];
const proof=JSON.parse(fs.readFileSync(process.argv[2])),body=proof[process.argv[3]];
const sha=o=>crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
if(proof.status!=='PASS'||body?.to!==Number(process.argv[4])||body?.from!==body.to-1||
    body.profileSHA!==sha(profile)||body.terminalSHA!==sha(body.terminal)||body.custodySHA!==sha(body.custody)){
 throw Error('Checkpoint is missing its verified source, actors or custody');
}
console.log(JSON.stringify({'honro-first-act-profile-1':JSON.stringify(profile),
 [body.slot]:JSON.stringify({...profile,honroAct6ChapterBoundary:{body,sha:sha(body)}})}));
"""
POINTER_EVENTS="""() => {
 window.seamTouches=[];
 for(const name of ['pointerdown','pointerup'])document.addEventListener(name,e=>{
  const target=e.target.closest('#joystick,[data-action="select-hero"]');
  if(target)seamTouches.push({name,trusted:e.isTrusted,type:e.pointerType,control:target.id||target.dataset.action});
 },true);
}"""


def build_context(browser, stage, source, key, viewport, device_scale):
    if source:
        fixture=base.ROOT/'shared/act6-debug-stages/fixtures.json'
        records=json.loads(subprocess.check_output(['node','-e',REPLAY,str(fixture),str(source),key,str(stage)],text=True))
        return saved_context(browser,records,mobile=True,viewport=viewport,device_scale=device_scale), 'captured live boundary'
    return seeded_context(browser,stage,mobile=True,viewport=viewport,device_scale=device_scale), 'previous compatible checkpoint'


def move(context,page,direction,condition,argument=None,timeout=6200,displacement=33):
    session=context.new_cdp_session(page)
    pad=page.locator('#joystick').bounding_box()
    x=pad['x']+pad['width']/2
    y=pad['y']+pad['height']/2
    touch(page,session,x,y,'touchStart')
    try:
        touch(page,session,x+direction*displacement,y,'touchMove')
        page.wait_for_function(condition,arg=argument,timeout=timeout)
    finally:
        touch(page,session,x+direction*displacement,y,'touchEnd')
        session.detach()


def touch_c(context,page,out):
    ceiling=page.evaluate(EAVE_POSE)
    assert ceiling['support']=='c-eave-soffit' and ceiling['grounded']
    assert ceiling['gravity']=={'x':0,'y':-320} and ceiling['normal']=={'x':0,'y':1}
    page.screenshot(path=out/'c-ceiling-mobile.png')
    watch_eave(page)
    move(context,page,1,"!HonroApp.engine.b.physics.regions.some(r=>r.id==='mumyeongsa-torn-eave')")
    page.wait_for_function("!document.querySelector('[data-act6-torn-eave=receive]')",timeout=5500)
    exit_pose=page.evaluate(EAVE_POSE)
    assert (exit_pose['x'],exit_pose['y'],exit_pose['support'])==(928,1136,'A-upper-veranda'),exit_pose
    assert exit_pose['grounded'] and exit_pose['gravity']=={'x':0,'y':320}
    page.screenshot(path=out/'c-veranda-mobile.png')
    return {'ceiling':ceiling,'landed':exit_pose,'flight':page.evaluate('eaveFlight')}


def touch_b(context,page,out):
    from native_b import POSE
    before=page.evaluate(POSE)['actors'][0]
    assert before['id']=='p-mage' and before['support']=='b-inner-jamb' and before['grounded'],before
    y=before['y']-40
    move(context,page,1,'y=>HonroApp.engine.active.y<=y',y)
    stepped=page.evaluate(POSE)['actors'][0]
    assert stepped['grounded'] and stepped['support']=='b-inner-jamb' and abs(stepped['x']-before['x'])<1e-6,stepped
    page.locator('#jump').tap(timeout=4500)
    page.wait_for_function('HonroApp.engine.active.vx<0',timeout=4200)
    jump=page.evaluate(POSE)['actors'][0]
    page.wait_for_function('HonroApp.engine.grounded(HonroApp.engine.active)',timeout=5500)
    landed=page.evaluate(POSE)['actors'][0]
    assert landed['support']=='b-inner-jamb' and landed['grounded'],landed
    page.screenshot(path=out/'b-wall-mobile.png')
    return {'before':before,'stepped':stepped,'jump':jump,'landed':landed}


def touch_d(context,page,out):
    first=state(page)
    original=actor(page)
    page.screenshot(path=out/'d-receiving-mobile.png')
    assert len([u for u in first['actors'] if u['side']==0 and u['contact']=='local-lower-08-body'])==4,first
    goal=original['x']-52
    move(context,page,-1,'x=>HonroApp.engine.active.x<=x',goal)
    landed=actor(page)
    assert landed['grounded'] and landed['contact']==original['contact'],landed
    page.screenshot(path=out/'d-step-mobile.png')
    return {'enter':first,'before':original,'after':landed}


def touch_r(context,page,out):
    first=page.evaluate(ROOM)
    assert first['quiet'] and first['pending'] and len(first['actors'])==4 and first['landmark'],first
    page.screenshot(path=out/'r-receiving-mobile.png')
    crossed=[]
    for role in ('occultist','archer','knight','mage'):
        u=next(q for q in first['actors'] if q['cls']==role)
        button=page.locator(f'[data-action="select-hero"][data-id="{u["id"]}"]').first
        if page.evaluate('HonroApp.engine.active.id')!=u['id']:
            button.tap(timeout=6000)
        page.wait_for_function('id=>HonroApp.engine.active.id===id',arg=u['id'],timeout=4500)
        if role=='mage':
            move(context,page,-1,'HonroApp.engine.b.honroReturnGatePending===false')
        else:
            move(context,page,-1,'HonroApp.engine.active.x<=2890')
        crossed.append({'from':u,'to':actor(page)})
    after=page.evaluate(ROOM)
    assert not after['pending'] and not after['quiet'] and all(u['grounded'] for u in after['actors']),after
    page.screenshot(path=out/'r-courtyard-mobile.png')
    return {'enter':first,'crossed':crossed,'after':after}


def check(browser,out,stage,source,key,task,viewport=None,device_scale=1):
    ctx,provenance=build_context(browser,stage,source,key,viewport,device_scale)
    page=ctx.new_page()
    result={'stage':stage,'source':provenance,'viewport':page.viewport_size,'deviceScale':device_scale,'status':'FAIL','pageErrors':[]}
    page.on('pageerror',lambda exc:result['pageErrors'].append(str(exc)))
    try:
        resume(page,stage,True,mobile=True)
        before=storage_hash(base.saved_bytes(page))
        page.wait_for_function('HonroApp.canInput()',timeout=8000)
        page.evaluate(POINTER_EVENTS)
        result['movement']=task(ctx,page,out)
        result['events']=page.evaluate('seamTouches')
        assert len(result['events'])>=2 and all(p['trusted'] and p['type']=='touch' for p in result['events'])
        result['saveHash']=before
        assert storage_hash(base.saved_bytes(page))==before
        assert not result['pageErrors'],result['pageErrors']
        result['status']='PASS'
    except Exception as error:
        result['error']=str(error)
        page.screenshot(path=out/f'mobile-seam-failure-{stage}.png',timeout=4400)
    finally:
        ctx.close()
    return result


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build',required=True,type=Path)
    parser.add_argument('--out',required=True,type=Path)
    parser.add_argument('--c-proof',required=True,type=Path)
    parser.add_argument('--d-proof',type=Path)
    parser.add_argument('--r-proof',type=Path)
    parser.add_argument('--b-proof',type=Path)
    parser.add_argument('--size',type=int,nargs=2,metavar=('WIDTH','HEIGHT'),default=(390,844))
    parser.add_argument('--device-scale',type=float,default=1)
    args=parser.parse_args()
    base.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    tasks=[(56,args.c_proof,'checkpoint56',touch_c),(58,args.d_proof,'checkpoint58',touch_d)]
    if args.b_proof:
        tasks.insert(0,(54,args.b_proof,'checkpoint54',touch_b))
    if args.r_proof:
        tasks.append((59,args.r_proof,'checkpoint59',touch_r))
    with sync_playwright() as playwright:
        with playwright.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage']) as browser:
            viewport=dict(zip(('width','height'),args.size))
            results=[check(browser,args.out,*task,viewport=viewport,device_scale=args.device_scale) for task in tasks]
    (args.out/'mobile-seams.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
    for item in results:
        print(item['stage'],item['status'],item.get('error',''))
    raise SystemExit(any(q['status']!='PASS' for q in results))
