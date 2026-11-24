from pathlib import Path
import json
from normal56_witness import admission,finish,same_body,CTRL
HERE=Path(__file__).parent

def stage57(page,state,mobile,original,tap,out,case,packet_path):
    prior=state['campaign56Terminal']['receipt']
    before=admission(page,state,mobile,original,tap,out,case,packet_path,57)
    assert sorted(u['cls'] for u in before['live'])==['archer','knight','occultist']
    for u in before['live']: assert same_body(u,prior['boundary']['fullOuter'][u['cls']]),u['id']
    src=(HERE/'browser-normal57.js').read_text()
    page.evaluate("(p)=>{globalThis.__normal57=("+src+")(p);}",prior)
    row=page.evaluate("()=>__normal57.next()")
    actions=[]
    while not row['done']:
        q=row['value'];alt=q['kind']=='alternative'
        selector='[data-act6-qa-alt]' if alt else CTRL
        el=page.locator(selector)
        assert el.is_visible() and el.is_enabled()
        old=page.locator(CTRL).get_attribute('data-act6-mission')
        if not alt: assert old==q['id'],q
        el.evaluate("e=>e.click()")
        assert page.locator(CTRL).get_attribute('data-act6-mission')==old
        tap(page,selector,mobile)
        actions.append(q)
        row=page.evaluate("()=>__normal57.next()")
    page.evaluate("delete globalThis.__normal57")
    receipt=finish(page,57,original,out,case)
    prog=row['value']
    assert receipt['flags']=={'act6.fallbackRelaySecured':True,'act6.fourCorporealJoined':True}
    assert receipt['boundary']['association']['seamReady']
    guard=receipt['boundary']['guard']
    assert guard['afterSide']==2 and guard['end']['x']-guard['spawn']['x']>250 and guard['end']['ground']
    assert prog['phase']=='won' and prog['retainedHostiles'] and len(prog['crew'])==4
    assert same_body(receipt['crew']['mage'],prior['boundary']['fullMage'])
    assert all(any(c[0]==u['id'] for c in prog['crew']) for u in receipt['crew'].values())
    assert page.locator('[data-act6-qa-next="58"]').count()==1 and page.evaluate("HonroApp.launch(58,false,null,{})===false")
    state['campaign57Terminal']={'initial':before,'live':prog,'receipt':receipt,'actions':actions}
