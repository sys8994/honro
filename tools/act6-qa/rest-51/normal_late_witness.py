"""Same live normal App, signed physical inputs only. No rendering/restore authority."""
import hashlib,json,os
from normal_far_witness import observe_normal_far
from normal60_ending_stock import observe as observe_stock_ending
from pathlib import Path
HERE=Path(__file__).parent
STORE='honro-first-act-profile-1'
PINS={58:'94e642324c73191fb3c6f07a0668cb07806c8addb7dd3b7297df825780ef29f9',59:'d255e803c068de3638080a5f0d65ca1e3a6d53cba7ecf4f0f68612323817499e'}
CARRY=('id','cls','hp','maxHp','focus','maxFocus','shield','level','loadout','tune','ranks','h','r','equipmentState','equipmentIds','gearBonuses','attack','armor','maxMove','walkSpeed','regen')
Q='[data-act6-qa-lookout]'
def snapshot(page):
    return page.evaluate("""()=>{const app=HonroApp,e=app.engine;return JSON.parse(JSON.stringify({
      stage:app.stageId,mode:e.b.mode,origin:e.b.honroMapOrigin,auth:e.b.honroAuthoredId,phase:e.b.phase,done:!!app.done,
      active:e.active?.id,round:e.b.round,shot:e.b.shot,zero:[e.b.honroGrowth?.limit?.total,e.b.honroGrowth?.limit?.combat],
      rows:Object.fromEntries(e.b.units.filter(u=>u.side===0&&!u.summoned).map(u=>[u.cls,{...u,grounded:e.grounded(u)}]))}));}""")
def unchanged(entry,previous):
    assert set(entry)==set(previous)=={'archer','knight','mage','occultist'}
    for cls,actor in entry.items():
        assert actor['grounded']
        for f in CARRY: assert actor.get(f)==previous[cls].get(f),(cls,f,actor.get(f),previous[cls].get(f))
def tap_ready(page,tap,selector,mobile):
    for _ in range(30):
        if page.evaluate("HonroApp.canInput()"): break
        page.clock.run_for(25)
    assert page.evaluate("HonroApp.canInput()"),snapshot(page)
    tap(page,selector,mobile)
def stage_late(page,state,mobile,original,tap,out,case,packet_path,stage,negative=False):
    prev=snapshot(page)
    assert prev['stage']==stage-1 and prev['phase']=='won' and prev['done']
    selector=f'[data-act6-qa-next="{stage}"]'
    assert page.locator(selector).count()==1
    assert page.evaluate("n=>HonroApp.launch(n,false,null,{})===false",stage)
    page.locator(selector).evaluate('el=>el.click()')
    assert page.evaluate("HonroApp.stageId")==stage-1 and packet_path not in state['packets']
    tap(page,selector,mobile)
    page.wait_for_function("n=>HonroApp.engine?.b?.honroStage===n && !!HonroApp.scene",arg=stage,timeout=25000)
    entry=snapshot(page)
    assert (entry['mode'],entry['origin'],entry['auth'],entry['phase'],entry['zero'])==('campaign','campaign',f'stage-{stage}','aim',[0,0]),entry
    assert state['packets'][-1]==packet_path
    unchanged(entry['rows'],prev['rows'])
    assert page.evaluate("k=>localStorage.getItem(k)",STORE)==original
    if os.environ.get('HONRO_ACT6_QA_NORMAL_LATE_FAR')=='1': state.setdefault('normalFar',{})[stage]=observe_normal_far(page,stage,mobile,out,case)
    page.screenshot(path=out/f'{case}-normal-{stage}-entry.png')
    raw=(HERE/f'INPUT-{stage}-NORMAL.json').read_bytes();assert hashlib.sha256(raw).hexdigest()==PINS[stage]
    source=(HERE/f'browser-normal{stage}.js').read_text()
    page.evaluate("x=>globalThis.__normalLate=("+source+")(x)",json.loads(raw) if stage==58 else [json.loads(raw),negative])
    probe=page.evaluate("()=>__normalLate.next()")
    actions=[]
    while not probe['done']:
        cmd=probe['value'];old=snapshot(page);assert old['active']==cmd['actor'],cmd
        if cmd['kind']=='context':
            curr=page.locator(Q).get_attribute('data-act6-mission')
            good=curr==cmd['id'] and page.locator(Q).is_enabled()
            if good:
                pre=page.locator(Q).get_attribute('data-act6-late-state')
                tap_ready(page,tap,Q,mobile)
                good=pre!=page.locator(Q).get_attribute('data-act6-late-state')
        else:
            assert cmd['kind']=='return' and stage==58
            tap_ready(page,tap,'[data-act6-qa-return]',mobile)
            p=snapshot(page);good=(old['active'],old['phase'],old['round'], old['rows'])!=(p['active'],p['phase'],p['round'],p['rows'])
        actions.append({'request':cmd,'accepted':good})
        probe=page.evaluate("x=>__normalLate.next(x)",bool(good))
    page.evaluate("delete globalThis.__normalLate")
    final=snapshot(page); result=probe['value']
    assert page.evaluate("k=>localStorage.getItem(k)",STORE)==original
    if negative:
        assert stage==59 and result['states']['activated'] and not result['states']['cleared'] and final['phase']!='won'
        assert not page.locator(Q).get_attribute('data-act6-late-receipt')
    else:
        # Native frame loop dispatches real App.outcome, not a fixture/candidate object.
        page.clock.run_for(350)
        assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
        receipt=json.loads(page.locator(Q).get_attribute('data-act6-late-receipt'))
        assert receipt['stage']==stage and receipt['won'] and receipt['settlement'] is False
        if stage==58:
            assert receipt['flags']=={'act6.daedosaStopped':True,'act6.innerRevisionReady':True,'act6.fourCorporealReturned':True}
            assert (result['boss'],result['node'],result['ground'])==(0,0,True)
            assert sorted({x['request']['id'] for x in actions if x['accepted'] and x['request']['id']})==['column','ledger','stake','threshold']
            assert receipt['guard']['ref']=='local-07-gwakjin-return-keeper'
        else:
            assert receipt['flags']=={'act6.garmjinCompleted':True,'act6.finalThreatResolved':True}
            p=json.loads(page.locator(Q).get_attribute('data-act6-late-boundary'))
            t=p['finalThreat'];assert p['closed'] and t['grounded'] and t['retreat']['actor']==entry['rows']['knight']['id']
            assert t['retreat']['shot']>0 and t['retreat']['ticks']>0 and t['distance']>=240 and not t['dead']
            assert p['guardAftermath']['anchor']=='local-return-anchor-07'
            result['boundary']=p
        unchanged(final['rows'],{v['cls']:v for v in receipt['actors']})
        result['receipt']=receipt
    state[f'campaign{stage}Terminal']={'entry':entry,'actual':result,'actions':actions,'final':final,'negative':negative}
    page.screenshot(path=out/f'{case}-normal-{stage}-terminal.png')

def stage60(page,state,mobile,original,tap,out,case,packet_path):
    prev=snapshot(page);assert prev['stage']==59 and prev['phase']=='won' and prev['done']
    assert page.evaluate("HonroApp.launch(60,false,null,{})===false")
    from_live59=page.locator(Q).get_attribute('data-act6-late-receipt')
    assert from_live59 and json.loads(from_live59)==state['campaign59Terminal']['actual']['receipt']
    live59_sha=hashlib.sha256(from_live59.encode()).hexdigest()
    gate='[data-act6-qa-next="60"]'
    page.locator(gate).evaluate('el=>el.click()')
    assert page.evaluate("HonroApp.stageId")==59 and packet_path not in state['packets']
    tap(page,gate,mobile)
    page.wait_for_function("HonroApp.engine?.b?.honroStage===60 && !!HonroApp.scene",timeout=25000)
    enter=snapshot(page);unchanged(enter['rows'],prev['rows'])
    assert (enter['mode'],enter['origin'],enter['auth'],enter['phase'],enter['zero'])==('campaign','campaign','stage-60','aim',[0,0])
    assert state['packets'][-1]==packet_path
    if os.environ.get('HONRO_ACT6_QA_NORMAL_FINAL_FAR')=='1': state.setdefault('normalFar',{})[60]=observe_normal_far(page,60,mobile,out,case)
    q=(HERE/'INPUT-60-NORMAL.json').read_bytes()
    assert hashlib.sha256(q).hexdigest()=='55ead7ed4f5ae66244d23272ef70437cc9c793f33975230a6b4a821b9f41c7be'
    js=(HERE/'browser-normal60.js').read_text()
    page.evaluate("x=>globalThis.__normal60=("+js+")(x)",[json.loads(q),prev['rows']])
    row=page.evaluate("()=>__normal60.next()")
    player=[]
    while not row['done']:
        r=row['value'];before=snapshot(page);assert before['active']==r['actor']
        if r['kind']=='guide':
            tap_ready(page,tap,Q,mobile)
            validated=page.locator(Q).get_attribute('data-act6-guide-confirmed')=='yes'
        else:
            assert r['kind']=='end-walk'
            tap_ready(page,tap,'[data-act6-qa-walk]',mobile)
            after=snapshot(page);validated=(before['active'],before['phase'],before['round'],before['rows'])!=(after['active'],after['phase'],after['round'],after['rows'])
        assert validated,r
        player.append(r)
        row=page.evaluate("x=>__normal60.next(x)",validated)
    page.evaluate("delete globalThis.__normal60")
    result=row['value'];assert result['shot']==0 and all(r['walked']>300 and r['grounded'] for r in result['escort'])
    page.clock.run_for(350)
    assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
    receipt=json.loads(page.locator(Q).get_attribute('data-act6-late-receipt'))
    assert receipt['flags']=={'act6.lastSoulsGuided':True,'act6.endingStarted':True} and receipt['endingWrite'] is False
    if os.environ.get('HONRO_ACT6_QA_NORMAL_ENDING_STOCK')=='1':
        state['campaign60Terminal']={'entry':enter,'receipt':receipt,'result':result,'trustedInputs':player}
        assert receipt['physical']['lineage']==live59_sha
        state['campaign60Terminal']['actual59SHA']=live59_sha
        observe_stock_ending(page,state,mobile,original,tap,out,case,prev)
        return
    nxt='[data-act6-qa-ending-next]';mem='[data-act6-qa-memorial]';snap=lambda:page.locator(nxt).get_attribute('data-act6-current-ending')
    assert snap()=='last-souls';tap(page,nxt,mobile)
    assert snap()=='bridge-record' and not page.locator(nxt).is_enabled()
    tap(page,mem,mobile);assert page.locator(nxt).is_enabled();tap(page,nxt,mobile)
    assert snap()=='daybreak';tap(page,nxt,mobile);assert snap()=='later-return' and not page.locator(nxt).is_visible()
    assert page.evaluate("k=>localStorage.getItem(k)",STORE)==original
    state['campaign60Terminal']={'entry':enter,'receipt':receipt,'result':result,'trustedInputs':player,'scene':'later-return','presentationScope':'cue/state only, no rendered final-cut store'}
    page.screenshot(path=out/f'{case}-normal-60-terminal.png')
