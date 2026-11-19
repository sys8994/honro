"""Real HUD A09/S03 experiments. No battle, camera or UI state assignments."""
import math,time
READ="""()=>{
 const a=HonroApp,e=a.engine,b=e.b,u=e.active,s=a.scene,q=s.plannedTurn,cv=s.canvas,r=cv.getBoundingClientRect();
 const actor=(v)=>({id:v.id,x:v.x,y:v.y,h:v.h,r:v.r,hp:v.hp,dead:!!v.dead,side:v.side,awake:!!v.awake,
   support:e.contactSurface(v.x,v.y-4,v.y+4)?.t.id??null,facing:v.facing,move:v.moveLeft,retreat:!!v.retreat,loadout:v.loadout,grounded:e.grounded(v),
   damageBy:{'p-archer':v.damageBy?.['p-archer']??0,'p-knight':v.damageBy?.['p-knight']??0}});
 return {active:actor(u),ready:!!a.canInput(),phase:b.phase,round:b.round,shot:b.shot,side:b.side,
  angle:a.displayAngle(u),selected:a.selected,step:b.honroState.act5.step,
  last:b.lastShots?.[u.id]?{skill:b.lastShots[u.id].skill,power:b.lastShots[u.id].power}:null,
  planned:q?{actor:q.actor,angle:q.angle,power:q.power,length:q.path.length,anchor:q.anchor??null,
    order:q.order??null,predictedTarget:q.preview?.unit??null,turnIndex:q.preview?.turnIndex??null}:null,
  camera:{x:s.x,y:s.y,z:s.scale,rect:[r.left,r.top,r.width,r.height]},
  projectiles:b.projectiles.filter(p=>p.owner===u.id).map(p=>({id:p.id,skill:p.skill,shot:p.shot,turned:!!p.turned})),
  melee:u.meleeAction?{skill:u.meleeAction.skill,shot:u.meleeAction.shot,range:u.meleeAction.range}:null,
  relevant:b.units.filter(v=>['p-knight','a5-foe-2','a5-foe-4','a5-foe-7','a5-foe-8','a5-gwak','a5-soldier-one','a5-soldier-two'].includes(v.id)).map(actor)};
}"""
def note(page,out,proof,dump):
    state=page.evaluate(READ);u=state['active'];aid=u['id']
    if state['round']<5 or aid!='p-archer' or state['step']!=0 or state['side']!=0:return False
    track='A09'
    arm=proof.setdefault('skillTrials',{})
    primary=arm.setdefault(track,{'attempts':[],'positioning':[],'eligibility':[],'complete':False})
    defensive=bool(primary['complete'])
    # Primary #8 path remains unchanged. Only a positively credited #8 death
    # opens a separate checked mandatory #2 shot budget from the next legal archer turn.
    # No #7 diversion until the original native #2 credit+death proof
    # and all-three-escort checkpoint genuinely exists in this same battle.
    protect=bool(defensive and proof.get('foe2DeadWhileEscortsAlive'))
    if protect and not next((v for v in state['relevant'] if v['id']=='a5-foe-2' and v['dead'] and v['hp']<=0),None):return False
    tid='a5-foe-7' if protect else 'a5-foe-2' if defensive else 'a5-foe-8'
    key='A09Threat7' if protect else 'A09Mandatory2'
    rec=arm.setdefault(key,{'attempts':[],'positioning':[],'eligibility':[],'complete':False}) if defensive else primary
    if rec['complete'] or rec.get('releasedCount',0)>=2 or (protect and len(rec['attempts'])>=2):return False
    def read():return page.evaluate(READ)
    def pulse(k,ms):
        page.keyboard.down(k)
        try:page.wait_for_timeout(ms)
        finally:page.keyboard.up(k)

    target=next((r for r in state['relevant'] if r['id']==tid and not r['dead']),None)
    knight=next((r for r in state['relevant'] if r['id']=='p-knight' and not r['dead']),None)
    main='MAIN_ESCORT_C_FULL'
    # Earlier preparation stays near the actual screened section, never a preset teleported pose.
    # Reserve motion ends at the Knight's neighborhood or on lost support, whichever is earlier.
    if target and knight and u['grounded'] and u['support']==main and knight['support']==main and target['x']>u['x'] and u['move']>=220:
        dest=min(1580,knight['x']+120,u['x']+min(320,u['move']-165))
        if dest-u['x']>=45:
            page.keyboard.down('KeyD')
            try:page.wait_for_function("""x=>{const a=HonroApp,e=a.engine,u=e.active;
              return u?.id!=='p-archer'||u.x>=x||u.moveLeft<140||!a.canInput()||!e.grounded(u)||
                e.contactSurface(u.x,u.y-4,u.y+4)?.t.id!=='MAIN_ESCORT_C_FULL';}""",
              arg=dest,polling='raf',timeout=1600)
            except Exception:pass
            finally:page.keyboard.up('KeyD')
            post=read();rec['positioning'].append({'round':state['round'],'key':'D','limit':dest,'knight':knight,
                'from':u,'to':post['active']});dump()
            state=post;u=post['active']
    reason=None
    if not target or (not defensive and not target['awake']):reason='Registered live target unavailable, or optional #8 not awake'
    elif not state['ready'] or u['id']!=aid or not u['grounded'] or u['support']!=main:reason='Native controller lacks legal MAIN support'
    elif abs(target['x']-u['x'])<=u['r']+target['r']:reason='Target overlap/no safe horizontal facing, not a global range rejection'
    elif len(rec['attempts'])>=11:reason='Bounded native planning attempts exhausted'
    else:
        if (target['x']-u['x'])*u['facing']<0:
            pulse('KeyD' if target['x']>u['x'] else 'KeyA',27)
            state=read();u=state['active']
            if u['id']!=aid or not state['ready'] or not u['grounded'] or u['support']!=main or (target['x']-u['x'])*u['facing']<=0:
                reason='Native control did not settle facing exact threat'
    rec['eligibility'].append({'round':state['round'],'source':u,'target':target,'status':reason or 'ready for native energy/path planning'})
    if reason:dump();return False
    targets=[target]
    row=dict(before=state,skill=track,targets=[target['id']]);rec['attempts'].append(row);dump()
    def aim(goal):
        for _ in range(13):
            q=read();d=goal-q['angle']
            if not q['ready'] or q['active']['id']!=aid or q['selected']!=track:return False
            if abs(d)<=1.25:return True
            pulse('ArrowUp' if d>0 else 'ArrowDown',max(14,min(310,round(abs(d)/62*950))))
        return abs(read()['angle']-goal)<=1.35
    def choose():
        slot=read()['active']['loadout'].index(track)
        assert slot==({'A09':3,'S03':2}[track])
        page.keyboard.press('Digit'+str(slot+1))
        return read()['selected']==track
    def charge(power):
        eligibility=page.evaluate("""({id,power})=>{const a=HonroApp,e=a.engine,u=e.active,s=HONRO_CORE.SKILLS[id];
          return {duration:e.chargeDuration(u,s),allowed:e.skillAllowed(s,u),focus:u.focus,maxFocus:u.maxFocus,
           canAfford:e.canAfford(s,u,power),cooldown:e.cooldownLeft(u,id),cost:e.manaCost(s,u,power),
           round:e.b.round,actor:u.id};}""",{'id':track,'power':power})
        rate=eligibility['duration'];row['chargeEligibility']=eligibility;dump()
        if not (eligibility['allowed'] and eligibility['canAfford'] and not eligibility['cooldown'] and rate>.15):
            return {'ok':False,'reason':'live exact-power legality/focus/cooldown','eligibility':eligibility}
        page.keyboard.down('Space')
        try:
            ready=page.evaluate("""p=>new Promise(ok=>{const start=performance.now();function tick(){
              const a=HonroApp,q=a.charging?a.chargePower():null;
              if(q!==null&&q>=p)return ok({ok:true,measured:q});
              if(performance.now()-start>3200)return ok({ok:false,measured:q});
              requestAnimationFrame(tick);}requestAnimationFrame(tick);})""",max(.4,power-.0275/rate))
            if not ready['ok'] and read()['phase']=='aim':page.keyboard.press('Escape')
        finally:page.keyboard.up('Space')
        return ready
    def photo(n):page.screenshot(path=str(out/n))
    def pixel(pt):
        return page.evaluate("""p=>{const s=HonroApp.scene,cv=s.canvas,r=cv.getBoundingClientRect(),v=s.world(0,0);
          const x=r.left+(p.x-v.x)*s.scale,y=r.top+(p.y-v.y)*s.scale;
          return {x,y,visible:x>=r.left+10&&x<=r.right-10&&y>=r.top+10&&y<=r.bottom-10&&document.elementFromPoint(x,y)===cv};}""",pt)
    if not choose():
        row['reason']='The stock HUD did not select the already-equipped slot';dump();return False
    if track=='A09':
        row['nativePlans']=[]
        rc=read()['camera']['rect']
        def safe_zone():
            return page.evaluate("""()=>{const s=HonroApp.scene,c=s.canvas,r=c.getBoundingClientRect(),b=HonroApp.engine.b;
               const pts=[];for(const y of [.25,.35,.46,.52,.59,.66])for(const x of [.32,.4,.5,.6,.68,.75,.23]){
                 const a={x:r.left+r.width*x,y:r.top+r.height*y};
                 if(document.elementFromPoint(a.x,a.y)!==c)continue;
                 const p=s.world(a.x-r.left,a.y-r.top);
                 const dst=b.units.filter(u=>!u.dead).map(u=>Math.hypot(u.x-p.x,u.y-u.h*.5-p.y));
                 if(Math.min(...dst)>135)pts.push(a);
               }return pts[0]??null;}""")
        focus=safe_zone()
        if not focus:row['reason']='No verified blank canvas gesture coordinate';dump();return False
        zoom=read()['camera']['z']
        wheel=max(0,min(580,round(math.log(zoom/.50)/.0014)))
        if wheel>0:
            page.mouse.move(focus['x'],focus['y']);page.mouse.wheel(0,wheel);page.wait_for_timeout(140)
        view=read();focus=safe_zone()
        if focus:
            live=next(t for t in view['relevant'] if t['id']==targets[0]['id'])
            wantX=(view['active']['x']+live['x'])/2
            wantY=(view['active']['y']+live['y']-live['h'])/2-18
            dx=max(-125,min(125,(view['camera']['x']-wantX)*view['camera']['z']))
            dy=max(-55,min(180,(view['camera']['y']-wantY)*view['camera']['z']))
            v=rc[1]+rc[3]-12;dy=min(dy,v-focus['y'])
            if math.hypot(dx,dy)>11:
                page.mouse.move(focus['x'],focus['y'])
                page.mouse.down()
                try:page.mouse.move(focus['x']+dx,focus['y']+dy,steps=9)
                finally:page.mouse.up()
        row['stockWheelAndDrag']=dict(before=state['camera'],after=read()['camera'],wheel=wheel,
                                     drag=[dx,dy] if focus else None)
        def screen_targets():
            live=read()
            return [{'id':t['id'],'body':pixel({'x':t['x'],'y':t['y']-t['h']*.52})}
                    for t in live['relevant'] if t['id'] in [v['id'] for v in targets] and not t['dead']]
        row['screenTargets']=screen_targets();dump()
        def preflight():
            return page.evaluate("""ids=>{
               const a=HonroApp,e=a.engine,b=e.b,u=e.active,s=a.scene,cv=s.canvas,r=cv.getBoundingClientRect(),
                  o=s.world(0,0),stock=HONRO_CORE.SKILLS.A09;
               const seen=p=>{const x=r.left+(p.x-o.x)*s.scale,y=r.top+(p.y-o.y)*s.scale;
                  return x>r.left+10&&x<r.right-10&&y>r.top+10&&y<r.bottom-10&&document.elementFromPoint(x,y)===cv;};
               const raw=()=>JSON.stringify([b.units,b.terrain,b.honroState,b.projectiles,b.phase,b.active,b.shot]);
               const before=raw(),rows=[];
               try{for(const angle of [66,73,79,84,59,87])for(const power of [.67,.73,.81,.88,.94,.61]){
                  if(!e.skillAllowed(stock,u)||!e.canAfford(stock,u,power)||e.cooldownLeft(u,stock.id)){
                    rows.push({angle,power,samples:0,targets:[],notEligible:'native affordability, cooldown, or selection'});continue;
                  }
                  const shot=e.predict(u,stock,u.facing>=0?angle:180-angle,power),
                     ps=shot.turnSamples??[],targets=ids.flatMap(id=>{const t=e.unit(id);if(!t||t.dead)return[];
                        const body={x:t.x,y:t.y-t.h*.52},min=Math.min(...ps.map(p=>Math.hypot(body.x-p.x,body.y-p.y))),
                         visible=ps.filter(p=>seen(p)&&Math.hypot(body.x-p.x,body.y-p.y)>=105&&Math.hypot(body.x-p.x,body.y-p.y)<=466).length;
                        return [{id,min:Number.isFinite(min)?min:null,visible,targetSeen:seen(body)}];});
                  rows.push({angle,power,samples:ps.length,first:ps[0]??null,last:ps.at(-1)??null,
                    earliestTime:shot.time??null,impactUnit:shot.unit??null,impactTerrain:shot.terrain??null,targets});
               }}finally{if(raw()!==before)throw Error('Preflight stock A09 preview modified live battle');}
               return rows;}""",[v['id'] for v in targets])
        def ranked(rows):
            return sorted((r for r in rows if r['samples'] and any(q['visible'] and q['targetSeen'] for q in r['targets'])),
               key=lambda r:min(i*680+(n['min'] or 999) for i,n in enumerate(r['targets']) if n['visible'] and n['targetSeen']))
        row['preflightBefore']=preflight();choices=ranked(row['preflightBefore']);dump()
        if not choices:
            row['reason']='No immediate-safe body-visible preflight path; do not charge same blocked viewpoint';dump();return False
        chosen=choices[min(len(choices)-1,(len(rec['attempts'])-1)%3)]
        goal=chosen['angle'];row['chosenPreflight']=chosen;dump()
        if not aim(goal):row['reason']='A09 keyboard angle not attained';dump();return False
        start=read();row['charge']=charge(chosen['power']);current=read()
        row['firstRelease']=current;dump()
        if protect and not row['charge']['ok']:
            row['reason']='Native #7 shot energy not confirmed; no launch';dump();return False
        if current['shot']!=start['shot']:raise AssertionError('A09 charged unexpectedly launched without planning')
        if not current['planned']:
            row['reason']='Native first release produced no planned turn despite read-only preflight';dump();return False
        rec['actualPlanGenerated']=True
        planned=page.evaluate("""targets=>{
          const a=HonroApp,e=a.engine,b=e.b,u=e.active,s=a.scene,q=s.plannedTurn,C=HONRO_CORE;
          const stamp=()=>JSON.stringify([b.units,b.terrain,b.honroState,b.projectiles,b.phase,b.active,b.shot]);
          const before=stamp(),cv=s.canvas,r=cv.getBoundingClientRect(),v=s.world(0,0);
          const visible=p=>{const x=r.left+(p.x-v.x)*s.scale,y=r.top+(p.y-v.y)*s.scale;
           return x>r.left+12&&x<r.right-12&&y>r.top+12&&y<r.bottom-12&&document.elementFromPoint(x,y)===cv;};
          const eligible=[];let tried=0,out=null;
          try{
           for(const id of targets){
             const t=e.unit(id);if(!t||t.dead)continue;
             const aim={x:t.x,y:t.y-t.h*.52};
             const candidates=q.path.flatMap((p,i)=>{
               if(i===0||!visible(p))return [];
               const d=Math.hypot(aim.x-p.x,aim.y-p.y);
               if(d<105||d>466)return []; // Native A09 does not require a downward turn.
               const p0=q.path[i-1],incoming=Math.atan2(p.y-p0.y,p.x-p0.x);
               return [{p,d,incoming,rank:Math.abs(d-320)}];
             }).sort((x,y)=>x.rank-y.rank);
             eligible.push({target:id,count:candidates.length});
             for(const c of candidates.slice(0,8)){
               for(const extra of [-.04,-.14,0,.06]){
                 if(++tried>44)break;
                 const heading=Math.atan2(aim.y-c.p.y,aim.x-c.p.x)+extra;
                 const delta=Math.atan2(Math.sin(heading-c.incoming),Math.cos(heading-c.incoming));
                 if(Math.abs(delta)>Math.PI*116/180)continue;
                 const order={age:c.p.age,delta:0,heading};
                 const v=C.plannedArrowPrediction(e,u,q.angle,q.power,order);
                 if(v.unit!==id||!Number.isInteger(v.turnIndex))continue;
                 const dir=[85,60,44].map(d=>({x:c.p.x+Math.cos(heading)*d,y:c.p.y+Math.sin(heading)*d}))
                    .find(p=>visible(p)&&Math.hypot(p.x-c.p.x,p.y-c.p.y)*s.scale>10);
                 if(dir){out={target:id,anchor:c.p,dir,expectedHeading:heading,tried,delta,expected:v.unit};break;}
               }if(out)break;
             }if(out)break;
           }
           return {candidate:out,eligible,tried};
          } finally {if(stamp()!==before)throw Error('Stock detached arrow predictor changed live state');}
        }""",[t['id'] for t in targets])
        row['nativePlans'].append(planned);p=planned['candidate'];dump()
        def abort(reason):
            q=read()
            if q['planned']:
                page.keyboard.press('Escape')
                after=read();assert not after['planned'] and after['shot']==start['shot'],'Escape did not legally cancel original plan'
            row['reason']=reason;dump();return False
        if not p:return abort('No visible turn node / bounded heading with exact native target preview')
        a=pixel(p['anchor'])
        if not a['visible']:return abort('Native turn anchor went off visible canvas')
        page.mouse.click(a['x'],a['y'])
        chosen=read()
        if not chosen['planned'] or not chosen['planned']['anchor'] or abs(chosen['planned']['anchor']['age']-p['anchor']['age'])>1e-7:
            return abort('Wrong native trajectory sample')
        d=pixel(p['dir'])
        if not d['visible']:return abort('Native direction click went off visible canvas')
        page.mouse.click(d['x'],d['y'])
        chosen=read();row['actualPlan']=chosen['planned'];dump()
        q=chosen['planned']
        if not q or q['predictedTarget']!=p['target'] or not q['order'] or not isinstance(q['turnIndex'],int):
            return abort('Actual accepted click preview did not hit intended target')
        target=p['target'];rec['actualClickedPlan']=True
        ordinal=rec.get('releasedCount',0)+1
        photo('06-a09-native-plan-'+tid.removeprefix('a5-foe-')+'-before-commit-'+str(ordinal)+'.png')
        before=read()
        live=page.evaluate('power=>{const a=HonroApp,e=a.engine,u=e.active,s=HONRO_CORE.SKILLS.A09;return {focus:u.focus,required:e.manaCost(s,u,power),allows:e.skillAllowed(s,u),affords:e.canAfford(s,u,power),cooldown:e.cooldownLeft(u,s.id)};}',q['power'])
        row['commitEligibility']=live;dump()
        if not live['allows'] or not live['affords'] or live['cooldown']:return abort('Actual measured charge cannot be paid with current stock focus/cooldown')
        page.keyboard.press('Space')
    else:
        target=targets[0]['id'];dest=targets[0]['x']-148
        if dest>u['x']+30:
            page.keyboard.down('KeyD')
            try:page.wait_for_function("""x=>{const a=HonroApp,u=a.engine.active;return u.id!=='p-knight'||u.x>=x||u.moveLeft<95||!a.canInput();}""",arg=dest,polling='raf',timeout=3600)
            except Exception:pass
            finally:page.keyboard.up('KeyD')
        pos=read();row['afterMove']=pos
        guard=page.evaluate("""id=>{const a=HonroApp,e=a.engine,u=e.active,t=e.unit(id),s=HONRO_CORE.SKILLS.S03;
         const p={x:u.x,y:u.y-u.h*.5},q={x:t.x,y:t.y-t.h*.5},dx=q.x-p.x,dy=q.y-p.y,h=e.collision(p,q,1,u.id,[],false);
         const support=e.contactSurface(u.x,u.y-4,u.y+4)?.t.id??null;
         return {dx,dy,d:Math.hypot(dx,dy),goal:Math.atan2(-dy,dx)*180/Math.PI,cover:h?.terrain?.id??null,
           clear:!h,radius:s.radius,mode:s.mode,support,ready:a.canInput(),facing:u.facing,id:u.id,
           ok:u.id==='p-knight'&&u.facing>0&&s.mode==='meleeWide'&&e.grounded(u)&&support==='MAIN_ESCORT_C_FULL'&&
              dx>=32&&dx<=185&&Math.hypot(dx,dy)<=Math.min(192,s.radius*1.13+t.r)&&!h};}""",target)
        row['meleeSafety']=guard;dump()
        if not guard['ok'] or not aim(max(-18,min(34,guard['goal']))):
            row['reason']='Not in confirmed close-range unobstructed S03 sector';dump();return False
        before=read();photo('07-s03-native-grounded-before-cast.png')
        row['charge']=charge(.70)
    # Skill-only result: actual registered projectile with turn, or actual
    # stationary meleeAction + own stock damageBy increase and HP loss.
    prior=next(r for r in before['relevant'] if r['id']==target)
    row['frames']=[];stop=time.monotonic()+9;seen=False;used=False
    while time.monotonic()<stop:
        q=read();r=next(v for v in q['relevant'] if v['id']==target)
        used=used or q['shot']==before['shot']+1
        proof_event=(any(p['skill']=='A09' and p['turned'] and p['shot']==before['shot']+1 for p in q['projectiles'])
                     if track=='A09' else (q['melee'] or {}).get('skill')=='S03')
        if len(row['frames'])<160:
            row['frames'].append(dict(shot=q['shot'],phase=q['phase'],hp=r['hp'],damageBy=r['damageBy'][aid],
                       projectiles=q['projectiles'],melee=q['melee']))
        if proof_event and not seen:photo('08-'+track.lower()+'-native-action-'+target.removeprefix('a5-foe-')+'-'+str(rec.get('releasedCount',0)+1)+'.png');seen=True
        if used and q['phase'] not in ('flight','cast') and not q['projectiles'] and not q['melee']:break
        page.wait_for_timeout(16)
    measured=next(v for v in q['relevant'] if v['id']==target)
    damage=prior['hp']-measured['hp']; own=measured['damageBy'][aid]-prior['damageBy'][aid]
    row.update(target=target,actualDamage=damage,actorDamageLedgerDelta=own,registeredNativeSkill=bool(seen),spentAction=used,
      after=q,passed=bool(used and seen and damage>0 and own>0))
    if track=='A09':
        if used:
            rec['releasedCount']=rec.get('releasedCount',0)+1;rec['actualA09Released']=True
        escorts=[v for v in q['relevant'] if v['id'] in ('a5-gwak','a5-soldier-one','a5-soldier-two')]
        row['escortsAtResult']=escorts
        row['foeDefeated']=measured['dead'] and measured['hp']==0
        rec['allEscortAlive']=len(escorts)==3 and all(v['hp']>0 and not v['dead'] for v in escorts)
        if row['passed']:
            rec.setdefault('ownHits',[]).append(dict(round=before['round'],shot=before['shot']+1,target=target,
             hpBefore=prior['hp'],hpAfter=measured['hp'],newDamageBy=own))
        rec['complete']=bool(row['passed'] and target==tid and row['foeDefeated'] and rec['allEscortAlive'])
        if used and not rec['complete'] and rec.get('releasedCount')==2:rec['stop']='Two honest native A09 attacks expended; no third'
    else:rec['complete']=row['passed']
    if used:photo('09-'+track.lower()+'-native-result-'+target.removeprefix('a5-foe-')+'-'+str(rec.get('releasedCount',1))+'.png')
    dump();return used
