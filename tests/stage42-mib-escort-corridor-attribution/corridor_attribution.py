"""Read-only temporary engine damage receipt observer during true phase2. No HP, position or stage mutations."""
from corridor import carry_corridor

def carry_with_attribution(page,out,res,dump):
    assert res['escortStart']['passed'] and res['escortStart']['end']['step']==2
    """Observation only. Existing stock e.hurt is invoked once with same args/receiver."""
    page.evaluate("""()=>{
      const e=HonroApp.engine,b=e.b,orig=e.hurt,events=[],errors=[];
      const escortIds=new Set(b.units.filter(u=>u.honroAct5Escort).map(u=>u.id));
      if(escortIds.size!==3||typeof orig!=='function'||window.__honroCorridorDamage)throw Error('Invalid scoped observer');
      let token=0,depth=0;
      const stockGeometry=()=>{try{return HonroAct5.escortThreats(e.b).map(u=>u.id);}catch{return [];}};
      const fingerprint=()=>JSON.stringify([b.units,b.terrain,b.honroWorldTerrain,b.honroState,b.projectiles,b.phase,b.round,b.side,b.active,b.shot]);
      const originalState=fingerprint();
      function instrument(...args){
        const target=args[0],capture=escortIds.has(target?.id),id=capture?target.id:null,
          rank=++depth,serial=++token,pre=capture?{hp:target.hp,shield:target.shield??0,dead:!!target.dead}:null;
        try{return Reflect.apply(orig,this,args);}
        finally{
          depth--;
          if(capture&&events.length<1000)try{
            const ownerID=typeof args[2]==='string'&&args[2]?args[2]:null,owner=ownerID?e.unit(ownerID):null;
            const projectile=args[4],originPoint=args[5],damageSource=args[6]??'normal';
            const after={hp:target.hp,shield:target.shield??0,dead:!!target.dead};
            const hpLoss=Math.max(0,pre.hp-after.hp);
            const child=events.some(q=>q.seq>serial&&q.depth>rank&&q.target===id);
            let confidence='no attributable reduction';
            if(hpLoss>0&&!child&&damageSource==='normal'&&owner?.side===1&&!owner.enthrall&&
                projectile?.owner===ownerID&&projectile.id!=null)confidence='stock hostile projectile with matching owner and recipient HP loss';
            else if(hpLoss>0&&!child&&damageSource==='normal'&&owner?.side===1&&!owner.enthrall)
                confidence='stock hostile actor arg with recipient HP loss; projectile unconfirmed';
            else if(hpLoss>0)confidence=child?'nested overlapping loss; do not count twice':'recipient HP loss, hostile attacker unconfirmed';
            events.push({seq:serial,depth:rank,round:b.round,stageStep:b.honroState.act5.step,
               phase:b.phase,active:b.active,shot:b.shot,hpLoss,target:id,before:pre,after,damageSource,
               ownerArg:ownerID,ownerSide:owner?.side??null,ownerEnthrall:!!owner?.enthrall,confidence,
               amountArg:args[1],direct:args[3]===true,
               damagePath:args[3]===true?'direct-argument':projectile?'derived/projectile area or continuation':'nonprojectile',
               source:originPoint?{x:originPoint.x,y:originPoint.y}:null,
               projectile:projectile?{id:projectile.id,owner:projectile.owner,skill:projectile.skill,shot:projectile.shot,x:projectile.x,y:projectile.y}:null,
               geometryThreatIds:stockGeometry()});
          } catch(ex) { if(errors.length<20)errors.push(String(ex)); }
        }
      }
      e.hurt=instrument;
      if(fingerprint()!==originalState){e.hurt=orig;throw Error('Instrumentation mutated battle on install');}
      window.__honroCorridorDamage={finish(){
        const intact=HonroApp.engine===e&&e.hurt===instrument;const before=fingerprint();
        if(e.hurt===instrument)e.hurt=orig;
        return {intact,restored:e.hurt===orig,unchangedDuringDetach:before===fingerprint(),events,errors,
                engineSerialCalls:token,scope:'Only QA-local observation around native hurt; refs/args/return/error passed unchanged.'};
      }};
    }""")

    try:carry_corridor(page,out,res,dump)
    finally:
        receipt=page.evaluate("""()=>{const q=window.__honroCorridorDamage.finish();delete window.__honroCorridorDamage;return q;}""")
        res['corridorDamageReceipt']=receipt
        exact=[x for x in receipt['events'] if x['stageStep']==2 and x['confidence']=='stock hostile projectile with matching owner and recipient HP loss']
        positive=[x for x in receipt['events'] if x['stageStep']==2 and x['hpLoss']>0 and 'nested' not in x['confidence']]
        receipt.update(exactPhase2=exact,totalAuthoritative=sum(x['hpLoss'] for x in exact),positiveReceiptCount=len(positive))
        dump()
        assert receipt['intact'] and receipt['restored'] and receipt['unchangedDuringDetach'] and not receipt['errors']
