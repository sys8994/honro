"""Stage31 normal-input boarding controller. No live state writes.

Use the real overlap between the upper path and boarding ledge. Respect acted
flags by ending actions normally; do not reset them or suppress round increments.
"""
def board_party(p, record, screenshot):
    def state():
        return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,q=b.honroAct4PreviewState;
          return {stage:b.honroStage,round:b.round,phase:b.phase,active:b.active,
           dialogue:!!a.dialogue,can:a.canInput(),boat:q.boat,complete:!!q.complete,
           enemies:b.units.filter(u=>u.side===1&&!u.dead).length,
           heroes:b.units.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead,acted:u.acted,moveLeft:u.moveLeft,canDrop:e.canDrop(u),grounded:e.grounded(u)}))};}''')
    def quiet():
        for _ in range(100):
            p.wait_for_timeout(500);s=state()
            if s['dialogue']:p.keyboard.press('Enter');continue
            if s['can'] or s['phase']=='won':
                p.wait_for_timeout(350)
                if not state()['dialogue']:return
        raise TimeoutError('Input or dialogue gate did not settle')
    def actor():
        s=state();return next(h for h in s['heroes'] if h['id']==s['active'])
    def landed():
        for _ in range(80):
            if actor()['grounded']:return
            if state()['dialogue']:quiet()
            p.wait_for_timeout(100)
        raise TimeoutError('Landing did not settle')
    def observe(label):
        s=state();record(label,s)
        assert s['round']<=20,s
        assert all(h['hp']>0 and not h['dead'] for h in s['heroes']),s
        assert s['active']==hero,('Unexpected actor handoff',s)
    class MovementBudgetExhausted(Exception):pass
    def walk(x,jump=False):
        quiet();landed();u=actor();direction='ArrowRight' if x>u['x'] else 'ArrowLeft'
        p.keyboard.down(direction)
        if jump:p.keyboard.press('Control')
        last_x=u['x'];jumps=0
        try:
            for tick in range(160):
                p.wait_for_timeout(50);u=actor()
                if state()['dialogue'] or (u.get('moveLeft') or 0)<=1:break
                if direction=='ArrowRight' and u['x']>=x-4 or direction=='ArrowLeft' and u['x']<=x+4:break
                if tick and tick%10==0:
                    if abs(u['x']-last_x)<5 and u['grounded'] and jumps<4:
                        p.keyboard.press('Control');jumps+=1;record('boarding-jump-steep-step',state())
                    last_x=u['x']
        finally:p.keyboard.up(direction)
        landed();observe(('jump-' if jump else 'walk-')+str(x))
        u=actor();reached=(direction=='ArrowRight' and u['x']>=x-4) or (direction=='ArrowLeft' and u['x']<=x+4)
        if not reached:
            if (u.get('moveLeft') or 0)<=1:raise MovementBudgetExhausted()
            raise AssertionError(('Walk target not reached; do not drop from wrong ledge',x,u))
    def drop_to(y):
        for _ in range(5):
            quiet();landed()
            if actor()['y']>=y-5:return
            assert actor()['canDrop'],('Cannot drop from current support; replan horizontal path',actor())
            p.keyboard.press('Alt');p.wait_for_timeout(1700);landed();observe('drop-'+str(y))
        assert actor()['y']>=y-5,actor()
    s=state();assert s['stage']==31 and s['enemies']==0,s
    quiet()
    for _ in range(60):
        if state()['boat']['phase']=='docked':break
        quiet();p.wait_for_timeout(500)
    assert state()['boat']['phase']=='docked'
    def onboard(h):return h['grounded'] and 6397.5<h['x']<6697.5 and abs(h['y']-3366)<5
    for cycle in range(16):
        quiet();s=state();remaining=[h for h in s['heroes'] if not onboard(h)]
        if not remaining:break
        ready=[h for h in remaining if not h['acted']]
        if not ready:
            # Empty hostile side still uses normal turn accounting.
            p.keyboard.press('f');p.wait_for_timeout(1500);record('normal-end-action-for-acted-party',state());continue
        hero=ready[0]['id'];p.locator('[data-action="select-hero"][data-id="'+hero+'"]').click();p.wait_for_timeout(450)
        assert state()['active']==hero,state()
        try:
            location=actor()
            if location['y']>2800 and location['x']<5100:
                walk(4815);walk(4900,True)
                if actor()['x']<4885:walk(4920,True)
                walk(5080);walk(5500);walk(5955);drop_to(2700);walk(6480)
            else:
                if location['x']<5500:walk(5500)
                if actor()['x']<5945:walk(5955)
                drop_to(2700);walk(6480)
            drop_to(3366);assert onboard(actor()),actor();screenshot('boarded-'+hero)
        except MovementBudgetExhausted:
            record('boarding-normal-movement-budget-end',state());p.keyboard.press('f');p.wait_for_timeout(1500);continue
    final=state();assert all(onboard(h) for h in final['heroes']),final
    quiet();p.keyboard.press('e');p.wait_for_timeout(1200)
    for _ in range(40):
        if state()['phase']=='won':break
        if state()['dialogue']:p.keyboard.press('Enter')
        p.wait_for_timeout(700)
    final=state();record('objective-result',final);screenshot('objective')
    assert final['phase']=='won' and final['complete'] and final['boat']['phase']=='boarded',final
    return final
