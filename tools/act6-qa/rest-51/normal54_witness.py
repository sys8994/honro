"""True 53→54 browser owner, both native controls and readback."""
import hashlib,json,os
from pathlib import Path
HERE=Path(__file__).parent
STORE='honro-first-act-profile-1'
def stage54(page,state,mobile,original,tap,out,case,packet_path):
    prior=state['campaign53Terminal']['receipt']
    next54='[data-act6-qa-next="54"]'
    assert page.locator(next54).count()==1
    assert page.evaluate("HonroApp.launch(54,false,null,{})===false")
    page.locator(next54).evaluate("e=>e.click()")
    assert page.evaluate("HonroApp.stageId")==53 and packet_path not in state['packets']
    tap(page,next54,mobile)
    page.wait_for_function("HonroApp.engine?.b?.honroStage===54 && !!HonroApp.scene",timeout=25000)
    assert state['packets'][-1]==packet_path
    before=page.evaluate("structuredClone(HonroApp.engine.active)")
    for name in ('id','hp','focus','shield','maxHp','maxFocus','tune','ranks','loadout','equipmentState','h','r','level'):
        assert before.get(name)==prior['mage'].get(name),name
    assert page.evaluate("k=>localStorage.getItem(k)",STORE)==original
    raw=(HERE/'INPUT-54.json').read_bytes()
    assert hashlib.sha256(raw).hexdigest()=='758807946db640328dc01b7390d07397b5fa20c6f95ebe784faf9b6e387cad10'
    source=(HERE/'browser-normal54.js').read_text()
    page.evaluate("([t,p])=>{globalThis.__normal54=("+source+")(t,p);}",[json.loads(raw),prior['mage']])
    action='[data-act6-qa-lookout]'
    skill='[data-action="combat-skill"][data-skill="M09"]'
    assert page.locator(skill).count()==0
    page.screenshot(path=out/f'{case}-native-54.png')
    seen={}
    def art(frame,index):
        if not os.environ.get('HONRO_ACT6_TERRAIN_PROOF'): return
        for _ in range(28):
            data=page.evaluate("""()=>{const a=HonroApp,s=a.scene,e=a.engine;
              s._releaseDomainTiles?.();s._releaseScreenCaches?.();
              s.render(e,0,a.selected,a.power,a.charging,0,true);
              return s.act6TerrainArtStats??null;
            }""")
            if data and data['frame']==frame: break
            page.wait_for_timeout(14)
        assert data and data['frame']==frame and data['drawCalls']>0,(frame,data)
        seen[f'{index}-{frame}']=data
        page.screenshot(path=out/f'{case}-art-54-chart-{index}-{frame}.png')
    art('N',0)
    row=page.evaluate("()=>__normal54.next()")
    count=0
    while not row['done']:
        command=row['value']
        if command['kind']=='chart':
            tap(page,action,mobile)
            count+=1
            art(('L','C','L')[count-1],count)
        else:
            assert command['kind']=='relay' and page.locator(skill).count()==1
            for _ in range(40):
                if page.evaluate("HonroApp.canInput()"): break
                page.clock.run_for(25)
            assert page.evaluate("HonroApp.canInput()"), page.evaluate("()=>({phase:HonroApp.engine.b.phase,turn:HonroApp.turnNotice,now:performance.now()})")
            tap(page,skill,mobile)
            assert page.locator('#fire').is_enabled()
            page.evaluate("""([angle,power])=>{const a=HonroApp,e=a.engine,u=e.active,sk=HONRO_CORE.SKILLS.M09;
              if(a.selected!=='M09'||!a.beginCharge())throw Error('Native App would not charge 54 relay');
              u.angle=angle;let l=0,r=9;for(let i=0;i<40;i++){let t=(l+r)/2;if(e.chargePower(u,sk,t)<power)l=t;else r=t;}
              a.chargeAt=performance.now()-((l+r)/2)*1000; a.releaseCharge();}""",[command['angle'],command['power']])
        row=page.evaluate("()=>__normal54.next()")
    page.evaluate("delete globalThis.__normal54")
    page.clock.run_for(96)
    assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
    receipt=json.loads(page.locator(action).get_attribute('data-act6-normal54-receipt'))
    assert receipt['flags']=={'act6.invertedGalleryCrossed':True} and receipt['settlement'] is False
    assert [x['id'] for x in receipt['chart']]==['N>L','L>C','C>L'] and all(x['grounded'] for x in receipt['chart'])
    assert receipt['external']==prior['external'] and receipt['mage']['id']==prior['mage']['id']
    assert receipt['mage']['loadout']==prior['mage']['loadout'] and receipt['relay']['y']==2930 and receipt['relay']['shot']>0
    assert page.evaluate("k=>localStorage.getItem(k)",STORE)==original
    state['campaign54Terminal']={'initialActor':before,'live':row['value'],'receipt':receipt,'parkedBodiesUnchanged':True}
    state['campaign54Terminal']['artChart']=seen
    page.screenshot(path=out/f'{case}-native-54-terminal.png')
