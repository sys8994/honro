from pathlib import Path
import json
HERE=Path(__file__).parent
STORE='honro-first-act-profile-1'
FIELDS='id cls hp maxHp focus maxFocus shield level loadout ranks tune h r equipmentState attack armor regen walkSpeed maxMove'.split()

def stage55(page,state,mobile,original,tap,out,case,packet_path):
    prior=state['campaign54Terminal']['receipt']
    button='[data-act6-qa-next="55"]'
    ctrl='[data-act6-qa-lookout]'
    page.locator(button).wait_for(state='visible',timeout=20000)
    assert page.evaluate("HonroApp.launch(55,false,null,{})===false")
    page.locator(button).evaluate("e=>e.click()")
    assert page.evaluate("HonroApp.stageId")==54 and packet_path not in state['packets']
    tap(page,button,mobile)
    page.wait_for_function("HonroApp.engine?.b?.honroStage===55 && !!HonroApp.scene && !!document.querySelector('#battlecanvas')",timeout=30000)
    page.locator(ctrl).wait_for(state='visible',timeout=20000)
    assert state['packets'][-1]==packet_path
    before=page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b;return {
     live:b.units.filter(u=>u.side===0&&!u.summoned),mode:b.mode,authored:b.honroAuthoredId,rule:e.stage.id,norm:a.profile===a.normalProfile,
     grounded:b.units.filter(u=>u.side===0&&!u.summoned).every(u=>e.grounded(u)),active:e.active.cls};}""")
    assert before['mode']=='campaign' and before['authored']=='stage-55' and before['rule']==55 and before['norm'] and before['grounded'] and before['active']=='knight'
    assert sorted(q['cls'] for q in before['live'])==['archer','knight','occultist']
    for u in before['live']:
        assert all(u.get(f)==prior['external'][u['cls']].get(f) for f in FIELDS),u['id']
    assert page.evaluate("k=>localStorage.getItem(k)",STORE)==original
    src=(HERE/'browser-normal55.js').read_text()
    page.screenshot(path=out/f'{case}-native-55.png')
    page.evaluate("()=>{globalThis.__normal55=("+src+")();}")
    row=page.evaluate("()=>__normal55.next()")
    actions=[]
    while not row['done']:
        q=row['value'];assert q['kind']=='interact'
        el=page.locator(ctrl)
        assert el.is_visible() and el.is_enabled() and el.get_attribute('data-act6-mark')==q['id'],q
        phase_snap=lambda:(el.get_attribute('data-act6-mark'),el.get_attribute('data-act6-binding'),el.is_disabled())
        old=phase_snap()
        el.evaluate("e=>e.click()")
        assert phase_snap()==old,'synthetic action changed the actual objective'
        tap(page,ctrl,mobile)
        new=phase_snap()
        expected={'reach-bell':lambda:new[0]=='align-bell' and new[1]==old[1] and not new[2],
                  'rebind-bell':lambda:new[0]=='align-bell' and new[1]=='secured' and not new[2],
                  'align-bell':lambda:new[0]=='' and new[1]=='secured' and new[2]}
        accepted=expected[q['id']]()
        assert accepted,(q,old,new)
        actions.append([q['id'],q['unit'],q['round'],old,new])
        row=page.evaluate("(ok)=>__normal55.next(ok)",accepted)
    page.evaluate("delete globalThis.__normal55")
    page.clock.run_for(96)
    assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
    el=page.locator(ctrl)
    receipt=json.loads(el.get_attribute('data-act6-normal55-receipt'))
    prog=row['value']
    assert receipt['stage']==55 and receipt['won'] and not receipt['settlement']
    assert receipt['flags']=={'act6.outerThreeAnchorsReady':True,'act6.outerAnchorBellReady':True}
    assert receipt['parkedMage']==prior['mage']
    assert [x[0] for x in actions]==['reach-bell','rebind-bell','align-bell'],actions
    assert [x['id'] for x in receipt['events']]==['trustedInnerStakeAndReturnReceived','hwigyeomBellTerraceReached','bellLinkFrayedByNativeImpact','sodanGroundedBellLinkRebound','bellAlignedAfterGateDefeat'],receipt
    impact=receipt['events'][2]['detail'];assert impact['projectile']>0 and impact['target']=='p-knight'
    assert prog['phase']=='won' and prog['foes']>0 and prog['fires']>0 and prog['interacts']==3
    live=page.evaluate("HonroApp.engine.b.units.filter(u=>u.side===0&&!u.summoned)")
    for u in receipt['actors']:
        actor=next(a for a in live if a['id']==u['id'])
        assert all(u.get(f)==actor.get(f) for f in FIELDS),u['id']
    successor=page.evaluate('''()=>{const a=HonroApp,q=a.launch(56,false,null,{});
      const blocked=q===undefined||q===false;return {blocked,stage:a.stageId,complete:a.done,packetCount:performance.getEntriesByType('resource').filter(r=>r.name.includes('act6-qa-chapter-56')).length};}''')
    assert successor=={'blocked':True,'stage':55,'complete':True,'packetCount':0},successor
    assert page.evaluate("k=>localStorage.getItem(k)",STORE)==original
    state['campaign55Terminal']={'initial':before,'live':prog,'receipt':receipt,'actions':actions}
    page.screenshot(path=out/f'{case}-native-55-terminal.png')
