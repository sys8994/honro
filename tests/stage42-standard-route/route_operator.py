"""Read-only QA route runner: ordinary real keyboard only; never claims unverified pass."""
import json,time
from pathlib import Path

OBS='HonroQaObserveStage42()'
LOWER=2075.68
UPPER=1339.31
FRONTS=[('before_lower_neck',1280),('inside_lower_neck',1463),('after_lower_neck',1580)]
class RouteStop(Exception): pass
def require(ok,msg):
    if not ok:raise RouteStop(msg)
def low(s):
    return type(s.get('y')) in (float,int) and abs(s['y']-LOWER)<1 and s['grounded']
def playable(s):
    return s['phase']=='aim' and s['side']==0 and s['canInput'] and not s['dialogue']

def advance_same_actor(page,out,phase_wait=105,max_rounds=6):
    """Start a fresh normal player aim, or continue real combat; retreat on any blocked phase.
    Long-hold sampling is redacted to allowed state fields by OBS. True platform E work only
    when original exact links are eligible. This is not objective/combat completion."""
    out=Path(out);out.mkdir(parents=True,exist_ok=True)
    get=lambda:page.evaluate(OBS)
    initial=get(); actor=initial['active']; front=0; events=[]; trace=[]
    result={'entry':initial,'scope':'same stock hero lower neck, lower E→upper E→lower only',
            'checkpoints':events,'trace':trace,'pass':False}
    deadline=time.monotonic()+300
    def observe():
        s=get()
        require(s['unchangedTerrain'] and s['storeSize']==0 and s['storageWriteAttempts']==0 and not s['errors'],'Game/storage/terrain integrity gate')
        require(s['phase'] not in {'lost','won'},'Battle already ended before route')
        require(s['round']-initial['round']<=max_rounds and time.monotonic()<deadline,'Route bounded total rounds/time')
        return s
    def snap(name,s):
        page.screenshot(path=str(out/f'{name}.png'))
        events.append({'name':name,'state':s})
    def held_until(target=None):
        seed=observe(); now=seed
        require(playable(seed) and seed['active']==actor and low(seed),'Route feet not on original lower floor')
        page.keyboard.down('KeyD')
        try:
            for i in range(160):
                page.wait_for_timeout(48)
                now=observe()
                if not playable(now):break
                require(now['active']==actor and low(now),'Route left named hero or lower physical floor while holding D')
                if i%3==0:trace.append({'input':'held D','state':now})
                if (target is not None and now['x']>=target) or (target is None and 'a5-cross-0' in now['eligible']) or now['move']<14:break
        finally:page.keyboard.up('KeyD')
        return now
    def get_next_real_turn():
        started=time.monotonic()
        defended=set(); cycled=set()
        while time.monotonic()-started<phase_wait:
            s=observe(); key=(s['round'],s['active'],s['side'],s['phase'])
            if s['dialogue']:
                page.keyboard.press('Space')
            elif playable(s):
                if s['active']==actor and s['move']>=300 and low(s):return s
                if s['active']!=actor and key not in cycled:
                    cycled.add(key);page.keyboard.press('Tab')
                elif key not in defended:
                    defended.add(key);page.keyboard.press('KeyF')
                    trace.append({'input':'pressed stock F to finish own available action','state':s})
            page.wait_for_timeout(220)
        raise RouteStop('Ordinary enemy/animation phase did not yield back to selected hero within bound')
    def ladder(wait_y, next_marker, move, name):
        begin=observe()
        require(playable(begin) and begin['active']==actor and begin['move']>=150,'Unexpected action/ladder budget')
        page.keyboard.press('KeyE')
        for _ in range(45):
            page.wait_for_timeout(65)
            s=observe()
            if s['active']==actor and abs(s['y']-wait_y)<1 and s['grounded']:
                require(s['move']==move and s['round']==begin['round'] and s['step']==begin['step'] and (next_marker is None or next_marker in s['eligible']),'Unexpected stock E cost, destination eligibility, or mission change')
                snap(name,s); return s
        raise RouteStop('Stock E not observed at its exact grounded destination')
    try:
        require(initial['x']<FRONTS[0][1] and initial['active'] and low(initial),'Checkpoint must start before west neck on original physical floor')
        snap('01-authentic-lower-start',initial)
        for loop in range(27):
            s=observe()
            if not(playable(s) and s['active']==actor and s['move']>=14 and low(s)):s=get_next_real_turn()
            if front<len(FRONTS):
                name,target=FRONTS[front]
                s=held_until(target)
                if s['x']>=target and low(s) and s['active']==actor:
                    # Large frame jumps must not fabricate an in-neck checkpoint.
                    require(s['x']<=target+65,'Passed measurement band before record')
                    snap(name,s);front+=1
                else:get_next_real_turn()
            else:
                if 'a5-cross-0' not in s['eligible']:s=held_until()
                if 'a5-cross-0' in s['eligible'] and s['move']>=300 and playable(s) and low(s):
                    snap('05-original-lower-ladder-eligible',s)
                    u=ladder(UPPER,'a5-cross-1', s['move']-150,'06-upper-after-real-E')
                    ladder(LOWER,'a5-cross-0',u['move']-150,'07-lower-after-real-E')
                    result['pass']=True;break
                get_next_real_turn()
        if not result['pass']:raise RouteStop('Budget exhausted before natural end')
    except Exception as exc:
        result['failure']=f'{type(exc).__name__}: {exc}'
        page.screenshot(path=str(out/'partial-route.png'))
    finally:
        (out/'route-proof.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    return result
