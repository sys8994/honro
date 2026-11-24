from pathlib import Path
import json
HERE=Path(__file__).parent
STORE='honro-first-act-profile-1'
CTRL='[data-act6-qa-lookout]'
FIELDS='id cls hp maxHp focus maxFocus shield level loadout ranks tune h r equipmentState attack armor regen walkSpeed maxMove'.split()

def same_body(a,b):
    return all(a.get(f)==b.get(f) for f in FIELDS)

def wait_turn(page):
    for _ in range(28):
        if page.evaluate("HonroApp.canInput()"): return
        page.clock.run_for(25)
    raise AssertionError(page.evaluate("()=>({stage:HonroApp.stageId,phase:HonroApp.engine?.b.phase,side:HonroApp.engine?.b.side,notice:HonroApp.turnNotice,dialogue:!!HonroApp.dialogue,modal:HonroApp.modal.classList.contains('open')})"))

def admission(page,state,mobile,original,tap,out,case,packet_path,stage):
    button=f'[data-act6-qa-next="{stage}"]'
    page.locator(button).wait_for(state='visible',timeout=20000)
    assert page.evaluate(f"HonroApp.launch({stage},false,null,{{}})===false")
    page.locator(button).evaluate("e=>e.click()")
    assert page.evaluate("HonroApp.stageId")==stage-1 and packet_path not in state['packets']
    tap(page,button,mobile)
    page.wait_for_function(f"HonroApp.engine?.b?.honroStage==={stage} && !!HonroApp.scene && !!document.querySelector('#battlecanvas')",timeout=30000)
    page.locator(CTRL).wait_for(state='visible',timeout=20000)
    assert state['packets'][-1]==packet_path
    before=page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b;return {live:b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAlly),
     mode:b.mode,authored:b.honroAuthoredId,rule:e.stage.id,norm:a.profile===a.normalProfile,grounded:b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAlly).every(u=>e.grounded(u)),active:e.active.cls};}""")
    assert before['mode']=='campaign' and before['authored']==f'stage-{stage}' and before['rule']==stage and before['norm'] and before['grounded']
    assert page.evaluate("k=>localStorage.getItem(k)",STORE)==original
    wait_turn(page)
    page.screenshot(path=out/f'{case}-native-{stage}.png')
    return before

def finish(page,stage,original,out,case):
    page.clock.run_for(96)
    assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
    raw=page.locator(CTRL).get_attribute(f'data-act6-normal{stage}-receipt',timeout=12000)
    r=json.loads(raw)
    assert r['stage']==stage and r['won'] and r['settlement'] is False
    assert page.evaluate("k=>localStorage.getItem(k)",STORE)==original
    page.screenshot(path=out/f'{case}-native-{stage}-terminal.png')
    return r

def stage56(page,state,mobile,original,tap,out,case,packet_path,continue57=False):
    prior=state['campaign55Terminal']['receipt']
    before=admission(page,state,mobile,original,tap,out,case,packet_path,56)
    mage=before['live']
    assert len(mage)==1 and before['active']=='mage' and same_body(mage[0],prior['parkedMage'])
    src=(HERE/'browser-normal56.js').read_text()
    page.evaluate("()=>{globalThis.__normal56=("+src+")();}")
    row=page.evaluate("()=>__normal56.next()")
    actions=[]
    while not row['done']:
        q=row['value']; mark=q['id']; el=page.locator(CTRL)
        assert el.get_attribute('data-act6-mission')==mark and el.is_enabled(),q
        el.evaluate("e=>e.click()")
        assert el.get_attribute('data-act6-mission')==mark
        tap(page,CTRL,mobile)
        accepted=el.get_attribute('data-act6-mission')!=mark or el.is_disabled()
        assert accepted,q
        actions.append(q)
        row=page.evaluate("(ok)=>__normal56.next(ok)",accepted)
    page.evaluate("delete globalThis.__normal56")
    receipt=finish(page,56,original,out,case)
    prog=row['value']
    assert receipt['flags']=={'act6.firstGarmjinFailed':True,'act6.temporaryPassageEscaped':True}
    assert receipt['boundary']['fullOuter']=={u['cls']:u for u in prior['actors']}
    assert same_body(receipt['boundary']['fullMage'],page.evaluate('HonroApp.engine.active'))
    assert [q['id'] for q in actions]==['stakeA','stakeB','activate','readNarrowing','warnShelf','open','returnEast']
    assert receipt['boundary']['events']==['firstStake','secondStake','firstActivationComplete','boundaryNarrowed','firstGarmjinFailed','temporaryPassageOpen','eastReturnObserved','exitReached']
    reflow=receipt['boundary']['reflow'];assert [reflow[1][k] for k in ['front','stopped','reversed']]==[145,0,-145]
    assert reflow[-1]['key']=='native-evade' and reflow[-1]['actorSetter'] is False
    assert prog['phase']=='won' and len(prog['enemyActive56'])>0
    assert page.evaluate("HonroApp.launch(57,false,null,{})===false")
    assert page.locator('[data-act6-qa-next="57"]').count()==int(continue57)
    state['campaign56Terminal']={'initial':before,'live':prog,'receipt':receipt,'actions':actions}
