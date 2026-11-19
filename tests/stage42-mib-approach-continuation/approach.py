"""One normal official stock Stage42 approach hit; no fight completion claim."""
from pathlib import Path
import time
PROBE=Path(__file__).with_name('approach-probe.js').read_text()
REQUIRED=['a5-foe-0','a5-foe-2','a5-foe-3','a5-foe-4']
GROUP=['a5-foe-0','a5-foe-1','a5-foe-2','a5-foe-3','a5-foe-4']
def play_first_approach(page,out,res,dump):
    proof=dict(scope='Official isolated C geometry; staged level25 and predecessor prerequisite only; live keyboard A01 pending.',
               passed=False,required=REQUIRED,search=[],controls=[],shots=[])
    res['approach']=proof;dump()
    def get(kind='state',**kw):
        return page.evaluate(PROBE,dict(kind=kind,**kw))
    def photo(name):page.screenshot(path=str(out/(name+'.png')))
    def pulse(k,ms):
        assert k in ('ArrowUp','ArrowDown') and 10<=ms<=420
        page.keyboard.down(k)
        try:page.wait_for_timeout(ms)
        finally:page.keyboard.up(k)
    def guard(s):
        assert s['readiness'] and not s['lastError'] and s['active']=='p-archer' and s['round']==1 and s['side']==0 and s['step']==0,s
        assert [t['id'] for t in s['targets']]==REQUIRED and s['authoredApproach']==GROUP and all(not t['dead'] for t in s['targets']),s
    initial=get();guard(initial);proof['before']=initial;dump()
    # R5 movement already happened naturally. Bring a required actor on screen only if needed.
    plan=None
    for x in (None,510,680,770):
        if x is not None:
            prev=get();guard(prev)
            if x>prev['x']+2:
                page.keyboard.down('KeyD')
                try:page.wait_for_function('v=>HonroApp.engine.active.x>=v',arg=x,polling='raf',timeout=7500)
                finally:page.keyboard.up('KeyD')
                curr=get();guard(curr);proof['controls'].append(dict(key='D',before=prev['x'],after=curr['x']));dump()
                assert curr['x']>=x and curr['x']<=x+35 and curr['move']<prev['move'] and curr['shot']==prev['shot']
        plan=get('plan'); proof['search'].append(dict(location=get(),prediction=plan));dump()
        if plan.get('ok'):break
    assert plan and plan.get('ok'),'No stable reachable visible required target for one natural Archer shot'
    assert plan['actor']=='p-archer' and plan['skill']=='A01' and plan['target'] in REQUIRED,plan
    prev=get();guard(prev)
    if prev['selected']!=plan['skill']:
        page.keyboard.press('Digit'+str(plan['slot']+1));proof['controls'].append(dict(key='Digit'+str(plan['slot']+1)));dump()
    for _ in range(15):
        a=get();guard(a);assert a['selected']=='A01'
        delta=plan['angle']-a['viewAngle']
        if abs(delta)<=.95:break
        pulse('ArrowUp' if delta>0 else 'ArrowDown',max(14,min(320,round(abs(delta)/62*950))))
    before=get();guard(before)
    exact=get('confirm',angle=before['viewAngle'],power=plan['power'],target=plan['target'])
    proof['aim']=dict(state=before,plan=plan,confirmed=exact);dump()
    assert exact.get('ok'),'Actual keyboard aim has no robust direct required hit'
    photo('03-before-ordinary-approach-shot')
    # Measure charge through the real HUD getter; estimate normal Chromium key release latency
    # from the previous pinned native controls and leave broad predictor ±.029 headroom.
    pgoal=plan['power']; duration=exact['duration']; assert .15<duration<10 and .4<pgoal<1,(pgoal,duration)
    page.keyboard.down('Space')
    try:
        threshold=max(.36,pgoal-(.0275/duration))
        charged=page.evaluate("""({threshold,actor})=>new Promise(resolve=>{
          const start=performance.now();
          function poll(){
            const a=HonroApp,e=a.engine,b=e.b;
            if(e.active?.id!==actor||b.phase!=='aim'||b.side!==0||a.dialogue)return resolve({ok:false,reason:'Live charging context drift'});
            const measured=a.charging?a.chargePower():null;
            if(measured!==null&&measured>=threshold)return resolve({ok:true,threshold,measured,elapsedMs:performance.now()-start});
            if(performance.now()-start>3500)return resolve({ok:false,reason:'HUD charge not attained',measured});
            requestAnimationFrame(poll);
          } requestAnimationFrame(poll);
        })""",dict(threshold=threshold,actor=before['active']))
        proof['charge']=charged;dump()
        if not charged['ok'] or abs(charged['measured']-pgoal)>.041:
            page.keyboard.press('Escape')
            raise AssertionError('Normal charge drift, cancelled')
    finally:
        page.keyboard.up('Space')
    proof['controls'].append(dict(key='Space',action='keyboard press/real HUD charge/keyboard release'));dump()
    row=dict(actor=before['active'],target=plan['target'],selected='A01',shotBefore=before['shot'],frames=[],actualDamage=0)
    proof['shots'].append(row);dump()
    until=time.monotonic()+8;flight=False
    orig=next(t for t in before['targets'] if t['id']==plan['target'])
    while time.monotonic()<until:
        now=get()
        row['frames'].append(dict(phase=now['phase'],shot=now['shot'],projectiles=now['projectiles'],
                                  requiredHP={t['id']:t['hp'] for t in now['targets']}))
        if any(p.get('owner')=='p-archer' and p.get('skill')=='A01' for p in now['projectiles']) and not flight:
            photo('04-ordinary-approach-arrow-flight');flight=True
        tgt=next(t for t in now['targets'] if t['id']==plan['target'])
        if orig['hp']>tgt['hp']:break
        if now['shot']>before['shot'] and now['phase']=='aim' and not now['projectiles']:break
        page.wait_for_timeout(25)
    photo('05-ordinary-approach-first-result')
    row['actualDamage']=orig['hp']-tgt['hp'];row['targetHPBefore']=orig['hp'];row['targetHPAfter']=tgt['hp']
    row['after']=now;row['realArrowFlightPicture']=flight;dump()
    assert now['shot']==before['shot']+1 and row['actualDamage']>0,'One real stock A01 failed to damage predicted required actor'
    assert any(any(p.get('owner')=='p-archer' and p.get('skill')=='A01' for p in f['projectiles']) for f in row['frames']),'No real Archer A01 projectile observed'
    assert now['step']==0,'First-hit smoke does not adjudicate a passed fight gate'
    proof['scope']='Official Stage42 prepared level25 entry; only actual first Archer A01 damage on an existing mandatory approach actor. Not all four, rescue/escort/clear, difficulty, or natural campaign progression.'
    proof['passed']=True;dump()

def continue_approach(page,out,res,dump):
    """A fresh real normal campaign through first hit; then legal turns only."""
    play_first_approach(page,out,res,dump)
    proof=dict(scope='Campaign natural combat inputs from passed opening, bounded required-target defeat attempt; never full campaign.',
               maxActions=44,maxRounds=12,maxSeconds=310,actions=[],defeats=[],passed=False,approachCleared=False)
    res['continuation']=proof;dump()
    st=time.monotonic()
    def get(kind='state',**kw): return page.evaluate(PROBE,dict(kind=kind,**kw))
    def pulse(k,ms):
        page.keyboard.down(k)
        try:page.wait_for_timeout(ms)
        finally:page.keyboard.up(k)
    def note(**data):proof['actions'].append(data);dump()
    def photo(name):page.screenshot(path=str(out/(name+'.png')))
    initial=get()
    previous={t['id']:t['hp'] for t in initial['targets']}
    proof['initial']=initial
    last_shot=-1;without_progress=0;first_defeat_action=None
    for action in range(44):
        if time.monotonic()-st>=310:break
        now=get()
        if now['step']>0 or all(t['dead'] for t in now['targets']):break
        if now['round']-initial['round']>=12 or now['phase'] in ('won','lost') or now['lastError']:break
        if first_defeat_action is not None and action-first_defeat_action>8:break
        if without_progress>=12:break
        try:
            page.wait_for_function("""()=>HonroApp.canInput()||!!HonroApp.dialogue||
               ['won','lost'].includes(HonroApp.engine.b.phase)||HonroApp.engine.b.honroState.act5.step>0""",timeout=13000)
        except Exception:
            note(action=action,kind='readiness timeout',state=get());break
        now=get()
        if now['step']>0 or now['phase'] in ('won','lost'):break
        if now['dialogue']:
            page.keyboard.press('Space');note(action=action,kind='ordinary dialogue advance');continue
        if not now['readiness']:
            note(action=action,kind='ready UI without grounded controllable actor',state=now);break
        plan=get('plan') if now['canShot'] else {'ok':False,'reason':'No stocked direct-attack skill for active actor'}
        if not plan.get('ok') and now['canShot'] and now['move']>=180:
            ahead=[t for t in now['targets'] if not t['dead'] and t['x']>now['x']+142 and abs(t['y']-now['y'])<=290]
            if ahead:
                dest=min(now['x']+112,min(t['x']-130 for t in ahead))
                page.keyboard.down('KeyD')
                try:page.wait_for_function('x=>HonroApp.engine.active.x>=x',arg=dest,polling='raf',timeout=2400)
                except Exception: pass
                finally:page.keyboard.up('KeyD')
                moved=get()
                note(action=action,kind='ordinary-D-planning',before=now,after=moved)
                if (moved['x']>now['x']+10 and moved['active']==now['active'] and moved['readiness']):
                    now=moved;plan=get('plan')
        confirm=None
        if plan.get('ok'):
            if now['selected']!=plan['skill']:page.keyboard.press('Digit'+str(plan['slot']+1))
            for _ in range(13):
                now=get();delta=plan['angle']-now['viewAngle']
                if abs(delta)<=.95:break
                pulse('ArrowUp' if delta>0 else 'ArrowDown',max(14,min(320,round(abs(delta)/62*950))))
            now=get()
            if now['active']==plan['actor'] and now['selected']==plan['skill'] and now['readiness']:
                confirm=get('confirm',angle=now['viewAngle'],power=plan['power'],target=plan['target'])
        if not confirm or not confirm.get('ok'):
            old=now;page.keyboard.press('KeyF');page.wait_for_timeout(120)
            nxt=get();note(action=action,kind='ordinary-F-defend',reason=(confirm or plan).get('reason'),before=old,after=nxt)
            without_progress+=1;continue
        assert now['shot']>last_shot and plan['target'] in REQUIRED
        pgoal=plan['power'];duration=confirm['duration']; assert .15<duration<10
        row=dict(action=action,kind='ordinary key release',before=now,plan=plan,confirmed=confirm,samples=[])
        proof['actions'].append(row);dump()
        page.keyboard.down('Space');charged=None
        try:
            charged=page.evaluate("""({threshold,actor})=>new Promise(resolve=>{
              const start=performance.now();
              function poll(){
                const a=HonroApp,e=a.engine,b=e.b;
                if(e.active?.id!==actor||b.phase!=='aim'||b.side!==0||a.dialogue)return resolve({ok:false,reason:'Live charging context drift'});
                const measured=a.charging?a.chargePower():null;
                if(measured!==null&&measured>=threshold)return resolve({ok:true,threshold,measured,elapsedMs:performance.now()-start});
                if(performance.now()-start>3300)return resolve({ok:false,reason:'HUD charge not attained',measured});
                requestAnimationFrame(poll);
              }requestAnimationFrame(poll);
            })""",{'threshold':max(.36,pgoal-.0275/duration),'actor':now['active']})
            row['charge']=charged
            if not charged['ok'] or abs(charged['measured']-pgoal)>.041:
                page.keyboard.press('Escape');raise AssertionError('Ordinary charge drift; cancellation only')
        finally:page.keyboard.up('Space')
        last_shot=now['shot'];deadline=time.monotonic()+8
        flight=False; target=plan['target']; was=next(t for t in now['targets'] if t['id']==target)
        while time.monotonic()<deadline:
            q=get();tgt=next(t for t in q['targets'] if t['id']==target)
            ps=[p for p in q['projectiles'] if p.get('owner')==now['active'] and p.get('skill')==plan['skill']]
            row['samples'].append(dict(shot=q['shot'],phase=q['phase'],projectiles=ps,hp=tgt['hp'],dead=tgt['dead']))
            flight=flight or bool(ps)
            if tgt['hp']<was['hp'] or q['step']>0 or (q['shot']>now['shot'] and q['phase']=='aim' and not ps):break
            page.wait_for_timeout(28)
        progress=now['shot']+1==q['shot'] and flight and tgt['hp']<was['hp']
        row.update(after=q,flightObserved=flight,confirmedActualDamage=was['hp']-tgt['hp'] if progress else 0)
        without_progress=0 if progress else without_progress+1
        if progress and not was['dead'] and tgt['dead']:
            proof['defeats'].append(dict(id=target,hpBefore=was['hp'],hpAfter=tgt['hp'],actor=now['active'],round=now['round'],shot=q['shot']))
            if first_defeat_action is None:
                first_defeat_action=action;photo('06-first-actual-required-defeat')
        previous={v['id']:v['hp'] for v in q['targets']};dump()
    end=get();proof.update(end=end,elapsedSeconds=round(time.monotonic()-st,2))
    proof['approachCleared']=end['step']>=1 and all(t['dead'] for t in end['targets'])
    proof['passed']=bool(proof['defeats'])
    photo('07-bounded-approach-continuation-final');dump()
    assert proof['passed'],'No observed required target defeat; retained all actual normal-input evidence'
