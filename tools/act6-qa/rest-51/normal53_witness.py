"""Native 53 verifier with the same live browser App after real 52."""
import json
STORE='honro-first-act-profile-1'
def stage53(page,state,mobile,original,tap,out,case,packet_path):
    before=page.evaluate("""()=>{const app=HonroApp,b=app.engine.b;
      if(app.stageId!==52||b.phase!=='won'||!app.done)throw Error('52 predecessor not won');
      return Object.fromEntries(b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAlly).map(u=>[u.cls,structuredClone(u)]));}""")
    assert set(before)=={'mage','archer','knight','occultist'}
    next53='[data-act6-qa-next="53"]'
    assert page.locator(next53).count()==1
    assert page.evaluate("HonroApp.launch(53,false,null,{})===false")
    page.locator(next53).evaluate("e=>e.click()")
    assert page.evaluate("HonroApp.stageId") == 52 and packet_path not in state['packets']
    tap(page,next53,mobile)
    page.wait_for_function("HonroApp.engine?.b?.honroStage===53 && !!HonroApp.scene",timeout=25000)
    assert state['packets'][-1]==packet_path
    own=page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active;
      if(!(e instanceof HONRO_CORE.Engine)||a.profile!==a.normalProfile||b.mode!=='campaign'||b.honroAuthoredId!=='stage-53'||e.stage.id!==53||
      b.honroCustom!==false||b.units.filter(v=>v.side===0&&!v.summoned).length!==1||u.cls!=='mage'||b.phase!=='aim'||
      !e.grounded(u)||u.x!==425||b.honroGrowth?.limit.total!==0||b.honroGrowth.limit.combat!==0)throw Error('Incorrect normal 53 mount');
      return structuredClone(u);}""")
    for field in ('id','cls','hp','maxHp','focus','maxFocus','shield','level','loadout','tune','ranks','h','r','equipmentState','equipmentIds','gearBonuses','attack','armor','maxMove','walkSpeed','regen'):
        assert own.get(field)==before['mage'].get(field),field
    assert page.evaluate("k=>localStorage.getItem(k)",STORE)==original
    action='[data-act6-qa-lookout]'
    skill='[data-action="combat-skill"][data-skill="M09"]'
    assert page.locator(skill).count()==0
    assert page.evaluate("HonroApp.engine.fire('M09',94,.42)===false")
    page.screenshot(path=out/f'{case}-native-53.png')
    tap(page,action,mobile)
    page.clock.run_for(96)
    assert page.evaluate("HonroApp.engine.active.x===2640 && HonroApp.engine.grounded(HonroApp.engine.active)")
    assert page.locator(skill).count()==1
    tap(page,skill,mobile)
    # Exact angle and charge are input values on the native App mechanism.
    # No battle position / HP / flags / time-to-win are assigned.
    released=page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,sk=HONRO_CORE.SKILLS.M09;
      if(a.selected!=='M09'||!a.beginCharge())throw Error('Native App would not charge contextual M09');
      u.angle=94;let l=0,r=9;for(let i=0;i<40;i++){let t=(l+r)/2;if(e.chargePower(u,sk,t)<.42)l=t;else r=t;}
      a.chargeAt=performance.now()-((l+r)/2)*1000;
      const before=b.shot; a.releaseCharge();
      if(b.shot!==before+1||!b.projectiles.some(p=>p.owner===u.id&&p.skill==='M09'))throw Error('Contextual M09 not launched');
      return b.shot;}""")
    stake=page.evaluate("""n=>{const e=HonroApp.engine,b=e.b,u=e.active;
      for(let x=0;x<4800&&(b.phase!=='aim'||u.acted||!b.stakes.some(k=>k.shot===n));x++)e.tick(1/120);
      const s=b.stakes.find(k=>k.shot===n&&k.owner===u.id&&k.skill==='M09');
      if(!s||s.x<2450||s.x>2600||b.phase!=='aim')throw Error('Native stake not on approved support');
      return structuredClone(s);}""",released)
    page.screenshot(path=out/f'{case}-native-53-stake.png')
    pose=page.evaluate("""()=>{const e=HonroApp.engine,b=e.b,u=e.active;let count=0;
      for(;count<350&&!['won','lost'].includes(b.phase)&&u.x<2725;count++){e.move(1,1/120);e.tick(1/120);}
      if(b.phase!=='won'||!e.grounded(u))throw Error('Native 53 exit not completed');
      return {id:u.id,hp:u.hp,focus:u.focus,shield:u.shield,round:b.round,x:u.x,y:u.y,count,loadout:u.loadout};}""")
    page.clock.run_for(96)
    assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
    receipt=json.loads(page.locator(action).get_attribute('data-act6-normal53-receipt'))
    assert receipt['stage']==53 and receipt['flags']=={'act6.innerStakeAReady':True} and receipt['settlement'] is False
    assert receipt['external']=={k:v for k,v in before.items() if k!='mage'}
    assert receipt['mage']['id']==pose['id']==before['mage']['id'] and pose['loadout']==before['mage']['loadout']
    assert page.evaluate("k=>localStorage.getItem(k)",STORE)==original
    state['campaign53Terminal']={'entry':own,'stake':stake,'pose':pose,'receipt':receipt,
         'parkedNativeRowsIdentical':True,'storageBytesIdentical':True}
    page.screenshot(path=out/f'{case}-native-53-terminal.png')
