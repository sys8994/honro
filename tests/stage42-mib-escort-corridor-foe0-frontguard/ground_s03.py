"""Official naturally grounded expanded S03 test, no A09 or new skills."""
import math,time
READ="""()=>{
 const a=HonroApp,e=a.engine,b=e.b,u=e.active,s=a.scene,q=s.plannedTurn,cv=s.canvas,r=cv.getBoundingClientRect();
 const actor=(v)=>({id:v.id,x:v.x,y:v.y,h:v.h,r:v.r,hp:v.hp,dead:!!v.dead,side:v.side,awake:!!v.awake,
   facing:v.facing,move:v.moveLeft,retreat:!!v.retreat,loadout:v.loadout,grounded:e.grounded(v),
   support:e.contactSurface(v.x,v.y-4,v.y+4)?.t.id??null,damageBy:{'p-knight':v.damageBy?.['p-knight']??0}});
 return {active:actor(u),ready:!!a.canInput(),phase:b.phase,round:b.round,shot:b.shot,side:b.side,
  angle:a.displayAngle(u),selected:a.selected,step:b.honroState.act5.step,
  last:b.lastShots?.[u.id]?{skill:b.lastShots[u.id].skill,power:b.lastShots[u.id].power}:null,
  planned:q?{actor:q.actor,angle:q.angle,power:q.power,length:q.path.length,anchor:q.anchor??null,
    order:q.order??null,predictedTarget:q.preview?.unit??null,turnIndex:q.preview?.turnIndex??null}:null,
  camera:{x:s.x,y:s.y,z:s.scale,rect:[r.left,r.top,r.width,r.height]},
  projectiles:b.projectiles.filter(p=>p.owner===u.id).map(p=>({id:p.id,skill:p.skill,shot:p.shot,turned:!!p.turned})),
  melee:u.meleeAction?{skill:u.meleeAction.skill,shot:u.meleeAction.shot,range:u.meleeAction.range}:null,
  relevant:b.units.filter(v=>['a5-foe-2','a5-foe-4','a5-foe-8','a5-gwak','a5-soldier-one','a5-soldier-two'].includes(v.id)).map(actor)};
}"""
def note(page,out,proof,dump):
    def read():return page.evaluate(READ)
    state=read();u=state['active']
    if state['round']<4 or u['id']!='p-knight' or state['step']!=0 or state['side']!=0 or not state['ready']:return False
    rec=proof.setdefault('skillTrials',{}).setdefault('S03',{'attempts':[],'baselineFoe4':False,'newGroundDamage':False})
    if len(rec['attempts'])>=16:return False
    main='MAIN_ESCORT_C_FULL'
    only=['a5-foe-4'] if not rec['baselineFoe4'] else ['a5-foe-2','a5-foe-3','a5-foe-4']
    def standing(v):return v['grounded'] and v['support']==main
    current=[r for i in only for r in state['relevant'] if r['id']==i and not r['dead'] and r['hp']>0]
    targets=[r for r in current if standing(r) and 39<abs(r['x']-u['x'])<780 and abs(r['y']-u['y'])<270 and u['move']>130]
    if not standing(u) or not targets:
        if current:
            rec.setdefault('eligibility',[]).append(dict(round=state['round'],actor=u,targets=current,
                reason='Requires nearby genuinely grounded target on same actual MAIN; no attack across upper shelf'));dump()
        return False
    # Finish viable weak mandatory bodies before splitting damage. If foe3
    # is physically above MAIN, this same-tread melee never applies.
    target=min(targets,key=lambda v:(v['hp']>250,v['hp'],abs(v['x']-u['x']),v['id']))
    tid=target['id'];sign=1 if target['x']>u['x'] else -1
    row=dict(before=state,target=tid,replayedEstablished=tid=='a5-foe-4');rec['attempts'].append(row);dump()
    def pulse(key,ms):
        page.keyboard.down(key)
        try:page.wait_for_timeout(ms)
        finally:page.keyboard.up(key)
    dest=target['x']-sign*148;key='KeyD' if sign>0 else 'KeyA'
    if (dest-u['x'])*sign>22:
        page.keyboard.down(key)
        try:page.wait_for_function("""({x,d})=>{const a=HonroApp,u=a.engine.active;return u.id!=='p-knight'||(u.x-x)*d>=0||u.moveLeft<95||!a.canInput();}""",
                                   arg={'x':dest,'d':sign},polling='raf',timeout=3600)
        except Exception:pass
        finally:page.keyboard.up(key)
    elif u['facing']*sign<0:
        pulse(key,24)
    z=read();row['moved']=z;dump()
    if z['active']['id']!='p-knight' or not z['ready']:row['reason']='Moved into unsettled turn state';dump();return False
    guard_js="""id=>{
      const a=HonroApp,e=a.engine,u=e.active,b=e.b,t=e.unit(id),s=HONRO_CORE.SKILLS.S03;
      const p={x:u.x,y:u.y-u.h*.5},q={x:t.x,y:t.y-t.h*.5},dx=q.x-p.x,dy=q.y-p.y,h=e.collision(p,q,1,u.id,[],false);
      const support=v=>e.contactSurface(v.x,v.y-4,v.y+4)?.t.id??null;
      const goal=Math.atan2(-dy,Math.abs(dx))*180/Math.PI,world=Math.atan2(dy,dx),
        aDiff=(x,y)=>Math.abs(Math.atan2(Math.sin(x-y),Math.cos(x-y)));
      // Conservative larger-than-stock S03 sector, then true stock terrain occlusion.
      const arcAllies=b.units.filter(v=>!v.dead&&v.side!==1&&v.id!==u.id).flatMap(v=>{
        for(const k of [.28,.5,.72]){
          const n={x:v.x,y:v.y-v.h*k},x=n.x-p.x,y=n.y-p.y,d=Math.hypot(x,y);
          if(d>260+v.r||e.collision(p,n,1,u.id,[],false))continue;
          if(d<40+v.r||aDiff(Math.atan2(y,x),world)<Math.PI*49/180+Math.asin(Math.min(1,(v.r+8)/Math.max(d,1))))return [v.id];
        }return [];
      });
      const supportA=support(u),supportB=support(t),bothGrounded=e.grounded(u)&&e.grounded(t),
        clear=h==null,n=Math.hypot(dx,dy),safeArc=goal>=-24&&goal<=39&&arcAllies.length===0,
        ok=a.canInput()&&u.id==='p-knight'&&u.facing*dx>0&&s.mode==='meleeWide'&&s.radius===180&&bothGrounded&&
           supportA==='MAIN_ESCORT_C_FULL'&&supportB===supportA&&n<=Math.min(192,s.radius*1.13+t.r)&&
           Math.abs(dx)>=32&&Math.abs(dx)<=185&&safeArc&&clear&&!t.dead;
      return {ok,dx,dy,n,goal,radius:s.radius,mode:s.mode,bothGrounded,supportA,supportB,cover:h?.terrain?.id??null,
        clear,safeArc,arcAllies};}"""
    initial=page.evaluate(guard_js,tid);row['geometryBeforeAim']=initial
    if not initial['ok']:
        row['reason']='Conservative friendly/range/grounded MAIN/melee obstruction check rejected';dump();return False
    slot=z['active']['loadout'].index('S03');assert slot==2
    page.keyboard.press('Digit3')
    for _ in range(13):
        z=read();delta=initial['goal']-z['angle']
        if z['active']['id']!='p-knight' or not z['ready'] or z['selected']!='S03':break
        if abs(delta)<=1.25:break
        pulse('ArrowUp' if delta>0 else 'ArrowDown',max(14,min(300,round(abs(delta)/62*950))))
    z=read();last=page.evaluate(guard_js,tid);row['geometryAfterAim']=last;dump()
    if not (last['ok'] and z['selected']=='S03' and abs(last['goal']-z['angle'])<=1.5):
        row['reason']='Actual ordinary aim or refreshed conservative guard rejected';dump();return False
    rate=page.evaluate("""()=>{const a=HonroApp,e=a.engine,u=e.active,s=HONRO_CORE.SKILLS.S03;
         return e.skillAllowed(s,u)&&e.canAfford(s,u,1)&&!e.cooldownLeft(u,'S03')?e.chargeDuration(u,s):null;}""")
    if not rate or rate<=.15:
        row['reason']='Stock focus/cooldown qualification unavailable';dump();return False
    name=tid.removeprefix('a5-foe-')+'-r'+str(z['round'])
    page.screenshot(path=str(out/('07-s03-ground-'+name+'-before.png')))
    before=read();hit_start=next(v for v in before['relevant'] if v['id']==tid)
    page.keyboard.down('Space')
    try:
        charge=page.evaluate("""p=>new Promise(ok=>{const start=performance.now();
         function tick(){const a=HonroApp,q=a.charging?a.chargePower():null;
            if(q!==null&&q>=p)return ok({ok:true,measured:q});
            if(performance.now()-start>3200)return ok({ok:false,measured:q});
            requestAnimationFrame(tick);}requestAnimationFrame(tick);})""",max(.4,.70-.0275/rate))
        row['charge']=charge
        if not charge['ok']:page.keyboard.press('Escape')
    finally:page.keyboard.up('Space')
    until=time.monotonic()+6;seen=False;used=False;row['frames']=[]
    while time.monotonic()<until:
        q=read();v=next(t for t in q['relevant'] if t['id']==tid)
        used=used or q['shot']==before['shot']+1
        native=(q['melee'] or {}).get('skill')=='S03' and (q['melee'] or {}).get('shot')==before['shot']+1
        row['frames'].append(dict(phase=q['phase'],shot=q['shot'],action=q['melee'],hp=v['hp'],own=v['damageBy']['p-knight']))
        if native and not seen:
            seen=True;page.screenshot(path=str(out/('08-s03-ground-'+name+'-actual.png')))
        if used and q['phase'] not in ('flight','cast') and not q['melee']:break
        page.wait_for_timeout(15)
    damage=hit_start['hp']-v['hp'];own=v['damageBy']['p-knight']-hit_start['damageBy']['p-knight']
    row.update(after=q,spentAction=used,registeredNativeS03=seen,actualDamage=damage,directKnightDamageLedgerDelta=own,
               nativeHit=bool(used and seen and own>0 and damage>0),targetDefeated=bool(v['dead'] and v['hp']<=0))
    if row['nativeHit']:
        rec.setdefault('ownedHits',[]).append({'id':tid,'round':before['round'],'shot':before['shot']+1,
            'hpBefore':hit_start['hp'],'hpAfter':v['hp'],'amount':damage,'defeated':row['targetDefeated']})
        if tid=='a5-foe-4':rec['baselineFoe4']=True
        else:rec['newGroundDamage']=True
    page.screenshot(path=str(out/('09-s03-ground-'+name+'-result.png')));dump()
    return used
