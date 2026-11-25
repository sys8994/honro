"""Verify the R receiving room and legacy compatibility with an isolated receipt."""
import argparse
import json
import subprocess
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base
from cold_resume import saved_context, seeded_context, storage_hash
from hall_passage import actor, select
from legacy54_live import resume
from second_pass import sample_walk

SEED = """
const fs=require('node:fs'), crypto=require('node:crypto');
const {profile,body}=JSON.parse(fs.readFileSync(process.argv[1],'utf8'))['59'];
const sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const cols={archer:3095,knight:3150,mage:3195,occultist:3050};
const at=x=>x<=3208?3416-80*(x-2928)/280:3336-128*(x-3208)/232;
const foot=x=>({x,y:at(x)});
const actors=Object.keys(cols).map(role=>{
  const u=body.custody.full[role],exit=foot(cols[role]);
  Object.assign(u,exit);
  Object.assign(body.terminal.actors.find(a=>a.id===u.id),exit);
  return {role,id:u.id,enter:foot(3261),step:foot(3259),exit};
});
if(process.argv[2]==='invalid')actors[0].step.y-=1;
const r={id:'mumyeongsa-return-gate',floor:'local-lower-08-body',sill:3260,gravity:{x:0,y:320},actors};
body.terminal.returnGate=r;
body.custody.returnGate=r;
body.terminalSHA=sha(body.terminal);body.custodySHA=sha(body.custody);
console.log(JSON.stringify({
 'honro-first-act-profile-1':JSON.stringify(profile),
 [body.slot]:JSON.stringify({...profile,honroAct6ChapterBoundary:{body,sha:sha(body)}})
}));
"""
ROOM = """() => {
 const e=HonroApp.engine,b=e.b,C=HONRO_CORE;
 return {stage:b.honroStage,quiet:e.noncombatWalk(),pending:b.honroReturnGatePending??false,
  round:b.round,active:e.active?.id,enemies:e.combatEnemies().map(u=>u.id),
  landmark:b.honroLandmarks?.find(v=>v.id==='art-mumyeongsa-return-gate')?.asset.visual??null,
  actors:b.units.filter(u=>u.side===0&&!u.summoned).map(u=>({
   id:u.id,cls:u.cls,x:u.x,y:u.y,hp:u.hp,focus:u.focus,shield:u.shield,loadout:u.loadout,equipment:u.equipmentState,
   grounded:e.grounded(u),valid:C.validTerrainContactPose(b.terrain,u),
   gravity:C.environmentAt(b.physics,u.x,u.y-u.h/2,true).gravity,
   support:e.contactSurface(u.x,u.y-4,u.y+5)?.t.id??null}))
 };
}"""

def synthetic(browser,invalid=False):
    pack=base.ROOT/'shared/act6-debug-stages/fixtures.json'
    records=json.loads(subprocess.check_output(['node','-e',SEED,str(pack),'invalid' if invalid else 'valid'],text=True))
    return saved_context(browser,records)

def proceed(page,out,result,name):
    q=page.evaluate(ROOM)
    assert q['stage']==59 and q['quiet'] and not q['enemies'] and q['pending'],q
    assert len(q['actors'])==4 and q['landmark'],q
    for u in q['actors']:
        assert u['valid'] and u['grounded'] and u['gravity']=={'x':0,'y':320} and u['support']=='m59-return-gate-stone',u
    result['receiving']=q
    page.wait_for_timeout(550)
    page.screenshot(path=out/f'r-{name}-receiving.png')
    result['walking']=[]
    for cls in ('occultist','archer','knight','mage'):
        select(page,cls)
        before=actor(page)
        if cls=='mage':
            page.keyboard.down('ArrowLeft')
            try:
                page.wait_for_function("HonroApp.engine.b.honroReturnGatePending===false",timeout=6000)
            finally:
                page.keyboard.up('ArrowLeft')
            reached=True
        else:
            move=sample_walk(page,-1,2890,6200)
            reached=move['reached']
        after=actor(page)
        result['walking'].append({'from':before,'to':after,'reached':reached})
        assert reached,result['walking'][-1]
    end=page.evaluate(ROOM)
    assert not end['quiet'] and not end['pending'] and len(end['actors'])==4 and all(u['valid'] for u in end['actors']),end
    assert [u['id'] for u in q['actors']]==[u['id'] for u in end['actors']],end
    result['courtyard']=end
    page.screenshot(path=out/f'r-{name}-courtyard.png')

def observe(browser,out,kind):
    ctx=seeded_context(browser,59) if kind=='legacy' else synthetic(browser,kind=='invalid')
    page=ctx.new_page()
    q={'case':kind,'status':'FAIL','errors':[]}
    page.on('pageerror',lambda err:q['errors'].append(str(err)))
    try:
        if kind=='invalid':
            page.goto(base.BASE+'HONRO.html',wait_until='domcontentloaded')
            page.wait_for_function("window.HonroApp && !document.querySelector('[data-startup-title]')")
            base.action(page,'rest').click()
            page.wait_for_function("HonroApp.screen==='rest'&&!HonroApp.dialogue")
            before=storage_hash(base.saved_bytes(page))
            page.locator('[data-act6-boundary-resume="59"]').click(timeout=6000)
            page.wait_for_function("document.querySelector('#notice')?.textContent.includes('기록을 열지 못했습니다')",timeout=7000)
            q['remainsAtRest']=page.evaluate("HonroApp.screen==='rest'&&!HonroApp.engine")
            assert q['remainsAtRest'] and before==storage_hash(base.saved_bytes(page)),q
        else:
            resume(page,59,True)
            before=storage_hash(base.saved_bytes(page))
            if kind=='legacy':
                q['old']=page.evaluate(ROOM)
                assert q['old']['stage']==59 and not q['old']['pending'] and not q['old']['quiet'],q['old']
            else:
                proceed(page,out,q,kind)
            assert before==storage_hash(base.saved_bytes(page)),'Stored bytes changed'
        q['status']='PASS'
    except (AssertionError,Error) as err:
        q['error']=str(err)[:2500]
        if page.evaluate('!!HonroApp.engine'):
            q['last']=page.evaluate(ROOM)
        page.screenshot(path=out/f'r-{kind}-failure.png')
    finally:
        ctx.close()
    if q['errors']:
        q['status']='FAIL'
    return q

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--build',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    opts=p.parse_args()
    base.ROOT=opts.build.resolve()
    opts.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
                                   args=['--no-sandbox','--disable-dev-shm-usage'])
        for kind in ('legacy','contract','invalid'):
            result=observe(browser,opts.out,kind)
            (opts.out/f'r-{kind}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
            print(kind,result['status'],result.get('error',''),flush=True)
        browser.close()

if __name__=='__main__':
    main()
