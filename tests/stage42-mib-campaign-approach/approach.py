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
