"""Play the native 54→55→56 chain and exercise its newly written boundary records."""
import argparse
import json
import subprocess
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base
from cold_resume import saved_context, storage_hash
from legacy54_live import hold, resume, run, walk_eave
from second_pass import FOOT, sample_walk

BELL = "[data-act6-qa-lookout]"
GATE = "draft-pressure-0"

def active(page):
    return page.evaluate("HonroApp.engine.active?.id")

def ready(page,timeout=18000):
    page.wait_for_function("""() => HonroApp.engine?.b?.phase==='aim'
      && HonroApp.engine.active?.side===0 && HonroApp.canInput()""",timeout=timeout)

def select(page,actor):
    for _ in range(3):
        if active(page)==actor:
            return
        page.keyboard.press('Tab')
        page.wait_for_timeout(100)
    raise AssertionError(_selection_state(page,actor))

def _selection_state(page,actor):
    return page.evaluate("""id=>{const a=HonroApp,e=a.engine,u=e.unit(id);
      return {id,active:e.active?.id,canInput:a.canInput(),acted:u.acted,notice:a.notice?.textContent};}""",actor)

def pose(page,actor):
    return page.evaluate("""id=>{const e=HonroApp.engine,u=e.unit(id);
      return {id,x:u.x,y:u.y,grounded:e.grounded(u),hp:u.hp,acted:u.acted,move:u.moveLeft,
        support:e.contactSurface(u.x,u.y-4,u.y+5)?.t.id??null,facing:u.facing,angle:u.angle};}""",actor)

def move(page,actor,target,ready_range=35):
    select(page,actor)
    for _ in range(4):
        p=pose(page,actor)
        distance=target-p["x"]
        if abs(distance)<=ready_range and p["grounded"]:
            return p
        direction=1 if distance>0 else -1
        if p["x"]<1330<target and p["grounded"]:
            if p["x"]<1230:
                sample_walk(page,1,1230,3500)
            page.keyboard.press('Control')
        sample_walk(page,direction,target,3600)
        page.wait_for_timeout(350)
    return pose(page,actor)

def stage55_trace(page):
    page.evaluate("""() => {
      const e=HonroApp.engine, events=[];
      window.bellTrace=events;
      const fire=e.fire, impact=e.impact,hurt=e.hurt;
      e.fire=function(id,angle,power,...rest){
        const u=e.active, shot=fire.call(this,id,angle,power,...rest);
        if(shot)events.push({type:'fire',id,owner:u.id,angle,power,shot:e.b.shot,round:e.b.round});
        return shot;
      };
      e.impact=function(p,h){
        const before=h.unit?.hp;
        const result=impact.call(this,p,h);
        if(h.unit)events.push({type:'impact',id:p.skill,owner:p.owner,target:h.unit.id,
          x:h.x,y:h.y,before,after:h.unit.hp,round:e.b.round});
        return result;
      };
      e.hurt=function(target,amount,owner,direct,p,...rest){
        const before=target.hp,result=hurt.call(this,target,amount,owner,direct,p,...rest);
        if(target.id==='draft-pressure-0'&&target.hp<before)events.push({type:'damage',id:p?.skill??null,owner,
          target:target.id,before,after:target.hp,round:e.b.round});
        return result;
      };
    }""")

def can_choose(page,actor):
    return page.evaluate("id=>{const u=HonroApp.engine.unit(id);return !!u&&!u.dead&&!u.acted;}",actor)

def aim_at_gate(page,actor,strong=False):
    select(page,actor)
    u=pose(page,actor)
    want_left=u["x"]>2112
    if want_left!=(u["facing"]<0):
        sample_walk(page,-1 if want_left else 1,u["x"]+(-18 if want_left else 18),600)
        u=pose(page,actor)
    if not u["grounded"]:
        return None
    spec=page.evaluate("""strong => {
      const e=HonroApp.engine,u=e.active,target=e.unit('draft-pressure-0');
      const from=u.facing<0?91:-84, to=u.facing<0?264:89;
      if(u.cls==='knight'){
        const x=target.x-u.x,y=target.y-target.h*.55-(u.y-u.h*.5);
        let angle=-Math.atan2(y,x)*180/Math.PI;if(angle< -85)angle+=360;
        const id='S03',skill=HONRO_CORE.SKILLS[id],power=.95;
        return angle>=from&&angle<=to&&Math.hypot(x,y)<=skill.radius*1.22+target.r&&
          !e.collision({x:u.x,y:u.y-u.h*.5},{x:target.x,y:target.y-target.h*.55},1,u.id,[],false)&&e.canAfford(skill,u,power)?{id,angle,power}:null;
      }
      for(const id of (u.cls==='occultist'?['O04','O01']:strong?['A02','A14','A01']:['A01','A02'])){
        if(!u.loadout.includes(id))continue;
        const skill=HONRO_CORE.SKILLS[id];
        for(const power of (strong?[.95,.90,.84,.76,.68,.58,.48,.40]:[.75,.85,.64,.54,.92,.44,.34]))for(let angle=from;angle<=to;angle+=1){
          if(!e.canAfford(skill,u,power))continue;
          const even=[-.6,0,.6].every(d=>[0,.026].every(q=>
            e.predict(u,skill,angle+d,power+q,target,false).unit===target.id));
          if(even)return {id,angle,power};
        }
      }
      return null;
    }""",strong)
    if not spec:
        return None
    page.locator(f'[data-action="combat-skill"][data-skill="{spec["id"]}"]').click(timeout=3000)
    for _ in range(3):
        u=pose(page,actor)
        if abs(spec["angle"]-u["angle"])<=.7:
            break
        increasing=spec["angle"]>u["angle"]
        use_up=increasing==(u["facing"]>0)
        hold(page,'ArrowUp' if use_up else 'ArrowDown',
             '([angle,up])=>up?HonroApp.engine.active.angle>=angle-.55:HonroApp.engine.active.angle<=angle+.55',
             [spec["angle"],increasing],3800)
    hold(page,'Space','power=>HonroApp.charging&&HonroApp.power>=power',spec["power"])
    return spec

def fray_or_turn(page):
    page.wait_for_function("""() => {
      const a=HonroApp,e=a.engine,c=document.querySelector('[data-act6-qa-lookout]');
      return a.dialogue||['won','lost'].includes(e.b.phase)||c?.dataset.act6Binding==='frayed'||
        e.b.phase==='aim'&&e.active?.side===0&&e.canAct();
    }""",timeout=19000)

def finish_bell(page,out,report,route='repair'):
    stage55_trace(page)
    report["battle55Actions"]=[]
    actions=report["battle55Actions"]
    ready(page)
    seated=page.evaluate("HonroApp.engine.unit('p-occultist').fixed===true")
    if seated:
        report['seatedEntry']=pose(page,'p-occultist')
        for _ in range(4):
            page.keyboard.press('Tab')
            assert active(page)!='p-occultist','Seated Sodan entered the active party'
        page.locator('[data-action="select-hero"][data-id="p-occultist"]').first.click(force=True,timeout=3500)
        assert active(page)!='p-occultist'
        page.keyboard.press('Control')
        page.wait_for_timeout(1100)
        ready(page)
    knight=move(page,'p-knight',2660)
    actions.append({"approach":knight})
    assert knight["grounded"] and abs(knight["x"]-2688)<=84,knight
    page.locator(BELL).click(timeout=3500)
    if route=='intact':
        move(page,'p-archer',1810,100)
        spec=aim_at_gate(page,'p-archer',True)
        actions.append({'intactOpening':spec})
        assert spec,'No actual opening shot'
    else:
        page.keyboard.press("f")
    for _ in range(30):
        base.dismiss_dialogue(page)
        if page.evaluate("HonroApp.engine.b.phase==='won'"):
            break
        if page.evaluate("HonroApp.engine.b.phase==='lost'"):
            assert route=='collapse',"Bell mission lost"
            break
        if route=='collapse':
            page.wait_for_function("HonroApp.engine.b.phase==='lost'||HonroApp.canInput()",timeout=25000)
            if page.evaluate("HonroApp.engine.b.phase==='lost'"):
                break
        else:
            ready(page)
        binding=page.locator(BELL).get_attribute("data-act6-binding")
        foe=pose(page,GATE)
        actor=active(page)
        if route=='collapse':
            page.keyboard.press('f')
            continue
        if route=='intact':
            assert binding=='stable','Intact run received a damaging bell strike'
            if foe['hp']>0:
                assert not any('intactKnight' in item for item in actions),'Opening sequence left the hoop alive'
                move(page,'p-knight',2190,20)
                spec=aim_at_gate(page,'p-knight',True)
                actions.append({'intactKnight':spec,'pose':pose(page,'p-knight')})
                assert spec,'No grounded sword contact before first enemy turn'
                continue
        if binding=="frayed" and (seated or can_choose(page,"p-occultist")):
            sodan=pose(page,"p-occultist") if seated else move(page,"p-occultist",2660,95)
            assert sodan["grounded"] and abs(sodan["x"]-2688)<=360,sodan
            page.locator(BELL).click(timeout=3500)
            actions.append({"rebind":sodan})
            fray_or_turn(page)
        elif binding in ('secured','stable') and foe["hp"]<=0 and can_choose(page,"p-knight"):
            knight=move(page,"p-knight",2660)
            page.locator(BELL).click(timeout=3500)
            actions.append({"align":knight})
            page.wait_for_function("HonroApp.engine.b.phase==='won'",timeout=6000)
        elif not seated and binding=="secured" and foe["hp"]>0 and can_choose(page,"p-occultist"):
            move(page,"p-occultist",2510,55)
            spec=aim_at_gate(page,"p-occultist")
            actions.append({"sodanShot":spec,"priorGate":foe})
            if spec is None:
                page.keyboard.press("f")
        elif binding=="secured" and foe["hp"]>0 and can_choose(page,"p-archer"):
            move(page,"p-archer",1810,110)
            spec=aim_at_gate(page,"p-archer")
            actions.append({"archerShot":spec,"priorGate":foe})
            if spec is None:
                page.keyboard.press("f")
        else:
            actions.append({"defend":actor,"binding":binding})
            page.keyboard.press("f")
    report["stage55Outcome"]=page.evaluate(base.SNAPSHOT)
    if seated:
        report['seatedExit']=pose(page,'p-occultist')
        keys=('id','x','y','support')
        assert all(report['seatedEntry'][k]==report['seatedExit'][k] for k in keys)
    report["bellTrace"]=page.evaluate("window.bellTrace")
    page.screenshot(path=out/"relay-stage55-outcome.png")
    if route=='collapse':
        assert report['stage55Outcome']['phase']=='lost'
        assert page.locator(BELL).get_attribute('data-act6-binding')=='failed'
        return
    assert report["stage55Outcome"]["phase"]=="won","Bell mission incomplete"
    assert any(row.get("target")==GATE and row.get("after")==0 for row in report["bellTrace"])
    page.locator('[data-act6-qa-next="56"]').click(timeout=5500)
    page.wait_for_function("HonroApp.engine?.b?.honroStage===56",timeout=12000)
    report["live56"]=page.evaluate(base.SNAPSHOT)
    page.screenshot(path=out/"relay-live56.png")

def boundary_of(records):
    slot=next(k for k in records if 'act6-boundary' in k)
    return json.loads(records[slot])["honroAct6ChapterBoundary"]["body"]

def reversal56(page,out,report,finish=False):
    actions=[]
    report['gaereumjin56']=actions
    def walk(target,margin=25):
        for _ in range(5):
            ready(page)
            p=page.evaluate(FOOT)
            if abs(p['x']-target)<=margin:
                return p
            if p['move']<max(110,min(abs(p['x']-target)+75,1000)):
                page.keyboard.press('f')
                page.wait_for_function('round=>HonroApp.engine.b.round>round&&HonroApp.canInput()',arg=p['round'],timeout=22000)
            direction=1 if p['x']<target else -1
            q=sample_walk(page,direction,target,3800)
            actions.append({'walk':target,'end':q['end']})
            page.wait_for_function('HonroApp.canInput() && HonroApp.engine.grounded(HonroApp.engine.active)',timeout=9000)
            if abs(page.evaluate('HonroApp.engine.active.x')-p['x'])<35:
                page.keyboard.press('Control')
                sample_walk(page,direction,target,1200)
                page.wait_for_function('HonroApp.canInput() && HonroApp.engine.grounded(HonroApp.engine.active)',timeout=7000)
        return page.evaluate(FOOT)
    def use(key,target,support):
        point=walk(target)
        assert point['support']==support and abs(point['x']-target)<80,(key,point)
        page.locator(f'{BELL}[data-act6-mission="{key}"]').click(timeout=4500)
        actions.append({'used':key,'pose':point})
    use('stakeA',1872,'A-upper-veranda')
    walk(3300)
    if finish:
        stage55_trace(page)
        page.locator('[data-act6-sodan-spirit]').click(timeout=5000)
        page.wait_for_function("bellTrace.some(p=>p.type==='impact'&&p.owner==='p-occultist'&&p.id==='O06')",timeout=10000)
        ready(page)
        report['spirit56']=[p for p in page.evaluate('bellTrace') if p.get('owner')=='p-occultist']
    use('stakeB',3600,'B-02-center-lower-short-climb')
    walk(4250)
    use('activate',5190,'E-joined-ordinary-floor')
    def flow():
        return page.evaluate("""() => {
          const e=HonroApp.engine,r=e.b.physics.regions.find(t=>t.id==='act6-06-local-failure-reflow');
          return {region:r,force:e.forceSample({x:5200,y:3940,drag:1,wind:0,gravityScale:0}),
            foes:e.b.units.filter(u=>u.side===1).map(u=>u.id)};
        }""")
    report['flowForward56']=flow()
    assert report['flowForward56']['force']['x']==145
    use('readNarrowing',5030,'E-joined-ordinary-floor')
    page.locator(f'{BELL}[data-act6-mission="warnShelf"]').wait_for(timeout=5000)
    report['flowReverse56']=flow()
    assert report['flowReverse56']['force']['x']==-145 and 'draft-pressure-3' in report['flowReverse56']['foes']
    page.screenshot(path=out/'stage56-first-reversal.png')
    if not finish:
        return
    use('warnShelf',3264,'B-central-lower-floor')
    safe=walk(3045,13)
    assert safe['support']=='B-central-lower-floor' and safe['x']<3070,safe
    page.keyboard.press('f')
    ready(page,35000)
    use('open',3055,'B-central-lower-floor')
    use('returnEast',5200,'E-joined-ordinary-floor')
    walk(6050)
    hold(page,'ArrowRight',"()=>HonroApp.engine.b.phase==='won'",None,11000)
    page.locator('[data-act6-qa-next="57"]').click(timeout=5500)
    page.wait_for_function('HonroApp.engine?.b.honroStage===57',timeout=12000)
    report['live57']=page.evaluate(base.SNAPSHOT)
    page.screenshot(path=out/'sodan-live57.png')

def cold_new(browser,records,stage):
    context=saved_context(browser,records)
    try:
        page=context.new_page()
        resume(page,stage,True)
        before=storage_hash(records)
        after=storage_hash(base.saved_bytes(page))
        assert before==after
        return {"snapshot":page.evaluate(base.SNAPSHOT),"savedBytesBefore":before,"savedBytesAfter":after}
    finally:
        context.close()

def rejected(browser,records,bad):
    program="""
    const fs=require('node:fs'),crypto=require('node:crypto');
    const seed=JSON.parse(fs.readFileSync(0,'utf8'));
    const slot=Object.keys(seed).find(k=>k.includes('act6-boundary'));
    const q=JSON.parse(seed[slot]), stamp=q.honroAct6ChapterBoundary, b=stamp.body;
    const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
    if(process.argv[1]==='skill'){
      b.custody.witness.skill='M01'; b.custodySHA=hash(b.custody);
    } else if(process.argv[1]==='ceiling'){
      b.terminal.eave.exit.normal.y=-1; b.terminalSHA=hash(b.terminal);
    } else {
      b.terminal.relay.support.terrain='west-continuation'; b.terminalSHA=hash(b.terminal);
    }
    stamp.sha=hash(b);seed[slot]=JSON.stringify(q);console.log(JSON.stringify(seed));
    """
    invalid=json.loads(subprocess.check_output(['node','-e',program,bad],input=json.dumps(records),text=True))
    context=saved_context(browser,invalid)
    try:
        page=context.new_page()
        page.goto(base.BASE+"HONRO.html",wait_until="domcontentloaded")
        page.wait_for_function("window.HonroApp&&!document.querySelector('[data-startup-title]')")
        base.action(page,"rest").click(timeout=6000)
        page.locator('[data-act6-boundary-resume="55"]').click(timeout=6000)
        page.wait_for_function("document.querySelector('#notice')?.textContent.includes('기록을 열지 못했습니다')",timeout=6000)
        assert page.evaluate('!HonroApp.engine') and invalid==base.saved_bytes(page)
        return True
    finally:
        context.close()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build",required=True,type=Path)
    parser.add_argument("--out",required=True,type=Path)
    parser.add_argument("--bell-only",action="store_true")
    parser.add_argument("--bell-case",choices=['repair','intact','collapse'],default='repair')
    parser.add_argument("--reversal",action="store_true")
    parser.add_argument("--deep-thread",action="store_true")
    args=parser.parse_args()
    base.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
            args=['--no-sandbox','--disable-dev-shm-usage'])
        def chain(page,result,records):
            result["checkpoint55"]=boundary_of(records)
            result["newContext55"]=cold_new(browser,records,55)
            cases=('surface','skill','ceiling') if result['checkpoint55']['terminal'].get('eave') else ('surface','skill')
            result["negative55"]={key:rejected(browser,records,key) for key in cases}
            try:
                finish_bell(page,args.out,result)
            finally:
                if 'live56' not in result:
                    result['bellTrace']=page.evaluate("window.bellTrace??[]")
            next_records=base.saved_bytes(page)
            result["checkpoint56"]=boundary_of(next_records)
            result["newContext56"]=cold_new(browser,next_records,56)
            if result['checkpoint56']['terminal'].get('eave'):
                eave=result['checkpoint55']['terminal']['eave']
                assert result['checkpoint56']['terminal']['eave']==eave==result['checkpoint56']['custody']['eave']
                context=saved_context(browser,next_records)
                try:
                    restored=context.new_page()
                    resume(restored,56,True)
                    result['eave56Cold']=walk_eave(restored,args.out,True,'-cold')
                finally:
                    context.close()
                result['eave56Live']=walk_eave(page,args.out,True,'-live')
                assert result['eave56Live']['ceiling']==result['eave56Cold']['ceiling']
            if args.reversal:
                reversal56(page,args.out,result)
        if args.deep_thread:
            from cold_resume import seeded_context
            context=seeded_context(browser,56)
            page=context.new_page()
            report={}
            try:
                resume(page,56,True)
                reversal56(page,args.out,report,True)
                records=base.saved_bytes(page)
                stamp=boundary_of(records)
                assert stamp['terminal']['sodanThread']['casts'][0]['stage']==56
                source=stamp['custody']['external']['occultist']['focus']
                debited=page.evaluate("HonroApp.engine.unit('p-occultist').focus")
                assert source-debited==stamp['terminal']['sodanThread']['casts'][0]['cost']
                report['carriedSodan']={'before':source,'after':debited,'thread':stamp['terminal']['sodanThread']}
                report['newContext57']=cold_new(browser,records,57)
                report['status']='PASS'
            except (Error,AssertionError) as error:
                report['status']='FAIL'
                report['error']=str(error)
                report['last']=page.evaluate(base.SNAPSHOT)
                page.screenshot(path=args.out/'sodan-deep-failure.png')
            finally:
                context.close()
        elif args.bell_only:
            from cold_resume import seeded_context
            context=seeded_context(browser,55)
            page=context.new_page()
            report={}
            try:
                resume(page,55,True)
                finish_bell(page,args.out,report,args.bell_case)
                if args.bell_case!='collapse':
                    records=base.saved_bytes(page)
                    report['checkpoint56']=boundary_of(records)
                    report['newContext56']=cold_new(browser,records,56)
                    ids={r['id'] for r in report['checkpoint56']['terminal']['events']}
                    if args.bell_case=='intact':
                        assert 'intactBellAlignedAfterGateDefeat' in ids and 'bellLinkFrayedByNativeImpact' not in ids and 'sodanGroundedBellLinkRebound' not in ids
                    else:
                        assert {'bellLinkFrayedByNativeImpact','sodanGroundedBellLinkRebound','bellAlignedAfterGateDefeat'}<=ids
                report['status']='PASS'
            except (Error,AssertionError) as error:
                report['status']='FAIL'
                report['error']=str(error)
                report['last']=page.evaluate(base.SNAPSHOT)
                page.screenshot(path=args.out/'relay-stage55-failure.png')
            finally:
                report['bellTrace']=page.evaluate("window.bellTrace??[]")
                context.close()
        else:
            report=run(browser,args.out,chain)
        report["chromium"]=browser.version
        (args.out/'relay-live-chain.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
        browser.close()
        print(report["status"],report.get("error",""),flush=True)

if __name__=='__main__':
    main()
