"""Bounded Stage42 approach-fight pilot. Use only via fresh local Player callback."""
import json
import re
import time
from pathlib import Path
HERE=Path(__file__).parent
PROBE=(HERE/'probe.js').read_text()
def drive(page,evidence,*,max_rounds=8,max_actions=36):
    assert re.fullmatch(r'http://(?:127\.0\.0\.1|localhost):[0-9]+/HONRO\.html',page.url),'exact disposable localhost Player only'
    assert 1<=max_rounds<=8 and 1<=max_actions<=36
    out=Path(evidence);out.mkdir(parents=True,exist_ok=True)
    def get(kind='state',**kw):return page.evaluate(PROBE,{'kind':kind,**kw})
    def hold(key,n):
        assert key in ('ArrowUp','ArrowDown','KeyA','KeyD') and 12<=n<=400
        page.keyboard.down(key)
        try:page.wait_for_timeout(n)
        finally:page.keyboard.up(key)
    def gone(s):return all(t['dead'] or t['hp']<=0 for t in s['targets'])
    def cancel_charge():
        # Stock Escape cancels input *before* Space release. Verify no attack.
        before=get()
        if before['charging']:
            page.keyboard.press('Escape')
            page.wait_for_timeout(55)
            assert not get()['charging'],'Stock pause did not cancel charge'
        page.keyboard.up('Space')
        assert get()['shot']==before['shot'],'Unexpected shot while aborting charge'
        if page.locator('#modal.open').count():page.keyboard.press('Escape')
    initial=get()
    assert initial['step']==0 and not gone(initial) and initial['store']==0 and not initial['lastError']
    start=time.monotonic();start_round=initial['round'];no_progress=0;shots=0;hits=0;steps=[]
    movement={};switches=set();reason='action budget exhausted';failure=None
    try:
        for _ in range(max_actions):
            s=get()
            if time.monotonic()-start>180:reason='180s budget';break
            if s['store'] or s['lastError']:raise RuntimeError('storage or stock Player failure')
            if s['step']>0:
                reason='stock objective advanced' if gone(s) else 'objective advanced without four observed removals'
                break
            if s['phase'] in ('won','lost'):reason='stock battle stopped before proof';break
            if s['round']-start_round>=max_rounds:reason='round cap';break
            if no_progress>=8:reason='no live HP progress in 8 actions';break
            if s['dialogue']:
                page.keyboard.press('Space');page.wait_for_timeout(150)
                steps.append({'type':'normal dialogue advance'});continue
            if not s['readiness']:
                try:page.wait_for_function('()=>{const q=window.HonroQaObserveStage42();return q.canInput||q.dialogue||["won","lost"].includes(q.phase)||q.step>0;}',timeout=14000)
                except Exception:reason='stock turn not ready within 14s';break
                s=get()
                if not s['readiness']:continue
            plan=get('plan')
            if not plan.get('ok'):
                k=(s['round'],s['active'])
                live=[t for t in s['targets'] if not t['dead']]
                front=[t for t in live if abs(t['y']-s['y'])<=8 and t['x']>s['x']+85]
                if s['pick'] and front and not movement.get(k) and s['move']>=190 and abs(s['y']-2075.68)<=8 and s['x']<1750:
                    # Natural re-position on original lower support, bounded before the nearest required foe.
                    dx=max(28,min(155,min(t['x'] for t in front)-s['x']-65))
                    hold('KeyD',max(32,min(380,round(dx/480*1000))))
                    movement[k]=True;post=get()
                    steps.append({'type':'held-D replanning','from':s['x'],'to':post['x'],'y':post['y'],'reason':plan.get('reason')})
                    if post['x']<=s['x'] or abs(post['y']-2075.68)>8:reason='no safe stock lower reposition';break
                elif k not in switches:
                    switches.add(k)
                    page.keyboard.press('Tab');page.wait_for_timeout(100)
                    steps.append({'type':'stock teammate selection','reason':plan.get('reason')})
                else:
                    page.keyboard.press('KeyF');page.wait_for_timeout(220)
                    steps.append({'type':'stock defend while no safe shot','reason':plan.get('reason')})
                no_progress+=1
                continue
            if s['selected']!=plan['skill']:
                page.keyboard.press('Digit'+str(plan['slot']+1))
                page.wait_for_timeout(70)
            if get()['selected']!=plan['skill']:reason='could not select exact stock skill';break
            for i in range(12):
                a=get()
                if not a['readiness'] or a['active']!=plan['actor']:break
                error=plan['angle']-a['viewAngle']
                if abs(error)<=1.25:break
                hold('ArrowUp' if error>0 else 'ArrowDown',max(14,min(320,round(abs(error)/62*930))))
            a=get()
            if not a['readiness'] or a['active']!=plan['actor'] or a['selected']!=plan['skill']:reason='actor/skill shifted during real aim';break
            check=get('confirm',angle=a['viewAngle'],power=plan['power'],target=plan['target'])
            if not check.get('ok'):
                reason='actual aim could not attain a robust direct hit'
                steps.append({'type':'aim rejected','reason':check.get('reason'),'aim':a['viewAngle'],'goal':plan['angle']})
                break
            pgoal=plan['power'];space_down=False
            try:
                page.keyboard.down('Space');space_down=True
                nominal=max(0,round(check['duration']*pgoal*1000)-105)
                if nominal:page.wait_for_timeout(nominal)
                over_at=time.monotonic()+1.4
                while time.monotonic()<over_at:
                    ch=get()
                    if not ch['charging'] or ch['stateToken']!=a['stateToken']:break
                    if ch['actualCharge']>=pgoal-.028:break
                    page.wait_for_timeout(8)
                ch=get()
                if not ch['charging'] or ch['stateToken']!=a['stateToken'] or abs(ch['actualCharge']-pgoal)>.033:
                    cancel_charge();space_down=False
                    reason='real charge/timing drift, safely cancelled'
                    steps.append({'type':'charge cancelled','requested':pgoal,'measured':ch['actualCharge']})
                    break
                # Predicted robustness was checked before starting the timer. Avoid
                # long browser-side searches while Space charge continues.
                page.keyboard.up('Space');space_down=False
            finally:
                if space_down:cancel_charge()
            page.wait_for_timeout(280)
            after=get()
            before_target=next(t for t in a['targets'] if t['id']==plan['target'])
            release=after['shot']>a['shot'] or after['phase'] not in ('aim',)
            if not release:reason='no observable actual shot release';break
            shots+=1
            until=time.monotonic()+7
            while time.monotonic()<until and not after['dialogue'] and after['phase'] not in ('won','lost') and after['step']==0:
                target_now=next(t for t in after['targets'] if t['id']==plan['target'])
                if target_now['hp']<before_target['hp'] or (after['readiness'] and after['active']!=a['active']):break
                page.wait_for_timeout(110);after=get()
            tnow=next(t for t in after['targets'] if t['id']==plan['target'])
            damage=max(0,before_target['hp']-tnow['hp'])
            hits+=int(damage>0);no_progress=0 if damage>0 else no_progress+1
            steps.append({'type':'true Space press/release','actor':a['active'],'target':plan['target'],'planned_power':pgoal,'observed_pre_release_power':ch['actualCharge'],
                          'observed_aim':ch['viewAngle'],'stock_predicted_impact':plan['impact'],'actual_target_hp_before':before_target['hp'],
                          'actual_target_hp_after':tnow['hp'],'observed_damage':damage,'round':after['round'],'phase':after['phase']})
    except Exception as ex:
        failure=type(ex).__name__;reason='pilot stopped fail-closed'
    final=get()
    ok=final['step']>=1 and gone(final) and shots>0 and hits>0 and final['store']==0 and not failure
    data={'pass':ok,'reason':reason,'failure_type':failure,'initial':initial,'final':final,'actual_shots':shots,'shots_with_observed_required_hp_loss':hits,
          'inputs':steps,'scope':'first 4 required approach targets only; not full stage, balance, rescue, ladder or visual finalization'}
    (out/'approach-deterministic.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
    page.screenshot(path=str(out/'approach-deterministic.png'))
    return data
