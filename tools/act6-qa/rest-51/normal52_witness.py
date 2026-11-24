"""Normal Stage52 QA continuation, to be called after verified R4 Stage51."""
import json,hashlib
from pathlib import Path
HERE=Path(__file__).parent
STORE='honro-first-act-profile-1'
def stage52(page,state,mobile,original,tap,out,case,packet_path):
    next52='[data-act6-qa-next="52"]'
    live=state['campaign51Terminal']['final']['units']
    assert page.locator(next52).count()==1
    frozen=page.evaluate("()=>HonroApp.launch(52,false,null,{})")
    assert frozen is False
    page.locator(next52).evaluate("el=>el.click()")
    assert page.evaluate("HonroApp.stageId") == 51 and packet_path not in state['packets']
    tap(page,next52,mobile)
    page.wait_for_function("HonroApp.engine?.b?.honroStage===52 && !!HonroApp.scene",timeout=25000)
    assert state['packets'][-1]==packet_path
    assert page.evaluate("k=>localStorage.getItem(k)",STORE)==original
    page.screenshot(path=out/f'{case}-native-52.png')
    input_bytes=(HERE/'INPUT-52.json').read_bytes()
    assert hashlib.sha256(input_bytes).hexdigest()=='68d78c5cd9e35992f8cce2cad7e619aa5ead2a03a71e9498c638acdad00fc28c'
    script=(HERE/'browser-normal52.js').read_text()
    page.evaluate('([t,c])=>{globalThis.__act6Normal52Test=('+script+')(t,c);}',[json.loads(input_bytes),live])
    row=page.evaluate('()=>__act6Normal52Test.next()')
    objective='[data-act6-qa-lookout]'
    while not row['done']:
        req=row['value']
        before=page.locator(objective).text_content()
        before_enabled=page.locator(objective).is_enabled()
        if before_enabled:tap(page,objective,mobile)
        passed=before_enabled and (page.locator(objective).is_disabled() or page.locator(objective).text_content()!=before)
        row=page.evaluate('ok=>__act6Normal52Test.next(ok)',passed)
    page.evaluate('delete globalThis.__act6Normal52Test')
    state['campaign52Terminal']=row['value']
    page.clock.run_for(96)
    assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
    assert page.evaluate("k=>localStorage.getItem(k)",STORE)==original
    page.screenshot(path=out/f'{case}-native-52-terminal.png')
