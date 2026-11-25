"""Follow actual 53/54 rooms and keep a roster/attack trace through their exits."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base
from daedosa_return import CANDIDATE
from exterior_combat import TRACE
from legacy54_live import hold, play54, resume
from native_b import aim, finish_wall, m09_hall
from relay_live_chain import boundary_of, cold_new, ready
from second_pass import FOOT, sample_walk
from visual_edges import scene_context


HEAL = """() => {
 const e=HonroApp.engine,u=e.active,skill=HONRO_CORE.SKILLS.M10;
 if(u.hp>=u.maxHp*.72||!u.loadout.includes('M10')||!e.canAfford(skill,u,.50)||e.b.stakes?.some(s=>s.skill==='M10'&&Math.abs(s.x-u.x)<100))return null;
 for(const power of [.27,.36,.45,.56,.65])for(let i=0;i<14;i++){
  const angle=u.facing>0?86-i*2:94+i*2;
  const hit=(angle,power)=>{const z=e.predict(u,skill,angle,power,undefined,true);
   return z.terrain&&Math.abs(z.x-u.x)<100&&Math.abs(z.y-u.y)<44;};
  if([-.8,0,.8].every(d=>[0,.025].every(p=>hit(angle+d,power+p))))return {id:'M10',angle,power};
 }
 return null;
}"""


def fire_or_cover(page):
    ready(page, 36000)
    spec=page.evaluate(HEAL) or page.evaluate(CANDIDATE)
    if not spec:
        page.keyboard.press('f')
        return {'defend':True}
    page.locator(f'[data-action="combat-skill"][data-skill="{spec["id"]}"]').first.click(timeout=5200)
    aim(page,spec)
    return {'heal' if spec['id']=='M10' else 'attack':spec}


def fight_along(page, regions, report):
    report['regions']=[]
    for x,wave,upper in regions:
        area={'site':x,'wave':wave,'actions':[]}
        report['regions'].append(area)
        ready(page, 36000)
        for _ in range(4):
            before=page.evaluate(FOOT)
            if abs(before['x']-x)<45:
                break
            step=sample_walk(page,1 if x>before['x'] else -1,x,6300)
            if step['reached']:
                break
            area['actions'].append(fire_or_cover(page))
            ready(page, 36000)
        area['foot']=page.evaluate(FOOT)
        assert abs(area['foot']['x']-x)<120,area
        if upper and area['foot']['support']!=upper:
            page.keyboard.press('Control')
            page.wait_for_function("id=>{const e=HonroApp.engine,u=e.active;return e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id===id;}",arg=upper,timeout=5400)
            area['upperFoot']=page.evaluate(FOOT)
        # Engage the actual troop here. Advance once the wave has physically
        # entered and at least one opponent at this front has acted.
        for _ in range(5):
            ready(page, 42000)
            if page.evaluate("id=>a6Exterior.joins.some(u=>u.source===id)&&a6Exterior.enemyTurns.some(u=>u.id.includes(id))",wave):
                break
            area['actions'].append(fire_or_cover(page))
        print(area['site'],page.evaluate('a6Exterior.joins.length'),len(area['actions']),flush=True)


def trace(page):
    row=page.evaluate('window.a6Exterior')
    frames=row.pop('frames')
    row['hostP95']=sorted(frames)[int(.95*(len(frames)-1))] if frames else None
    return row


def run(browser,args):
    stage=args.stage
    proof=(args.b_proof,'checkpoint54') if stage==54 else None
    with scene_context(browser,stage,proof) as context:
        page=context.new_page()
        resume(page,stage,True)
        q={'stage':stage,'status':'FAIL','errors':[]}
        page.on('pageerror',lambda error:q['errors'].append(str(error)))
        try:
            page.evaluate(TRACE)
            if stage==53:
                fight_along(page,[(860,'gate-timber',None),(1375,'archive-balcony',None),(2140,'lost-sanctuary',None)],q)
                ready(page, 36000)
                end=sample_walk(page,1,2690,6200)
                assert end['reached'],end['end']
                q['nativeGateAtExit']=page.evaluate("""()=>{const e=HonroApp.engine,r=e.gateResolution();
                 return {ok:r.ok,reason:r.reason,stakes:e.b.stakes?.map(p=>[p.id,p.skill,p.x,p.y,p.expires])??[]};}""")
                assert q['nativeGateAtExit']['ok'],q['nativeGateAtExit']
                page.locator('[data-act6-qa-lookout]').click(timeout=3000)
                page.wait_for_function('HonroApp.engine.active.y<600',timeout=3500)
                q['m09']=m09_hall(page)
                sample_walk(page,1,2940,6500)
                page.wait_for_function('HonroApp.engine.active.x===3240&&HonroApp.canInput()',timeout=5000)
                hold(page,'ArrowRight','HonroApp.engine?.b.honroStage===54',None,11000)
            else:
                finish_wall(page,q,spirit=True)
                fight_along(page,[(760,'pillar-base','gallery-outer-balcony'),(1110,'observatory-beam','gallery-observation-beam'),(1396,'return-corner',None)],q)
                ready(page, 36000)
                end=sample_walk(page,-1,550,8000)
                assert end['reached'] and page.locator('[data-act6-qa-lookout]').is_enabled(),end['end']
                play54(page,args.out,q)
            saved=base.saved_bytes(page)
            q['boundary']=boundary_of(saved)
            q['cold']=cold_new(browser,saved,stage+1)
            assert not q['errors'],q['errors']
            q['status']='PASS_ROUTE'
        except (AssertionError,Error) as error:
            q['error']=str(error)
            q['last']=page.evaluate(base.SNAPSHOT)
            page.screenshot(path=args.out/f'{stage}-encounter-failure.png')
        finally:
            q['trace']=trace(page)
        return q


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--stage',type=int,choices=(53,54),required=True)
    parser.add_argument('--b-proof',type=Path)
    args=parser.parse_args()
    assert args.stage!=54 or args.b_proof
    base.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        with pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage']) as browser:
            result=run(browser,args)
    (args.out/f'encounters-{args.stage}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(result['status'],result.get('error',''),flush=True)
