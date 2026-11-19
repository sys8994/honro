"""Real HUD A09/S03 experiments. No battle, camera or UI state assignments."""
import math,time
READ="""()=>{
 const a=HonroApp,e=a.engine,b=e.b,u=e.active,s=a.scene,q=s.plannedTurn,cv=s.canvas,r=cv.getBoundingClientRect();
 const actor=(v)=>({id:v.id,x:v.x,y:v.y,h:v.h,r:v.r,hp:v.hp,dead:!!v.dead,side:v.side,awake:!!v.awake,
   facing:v.facing,move:v.moveLeft,retreat:!!v.retreat,loadout:v.loadout,grounded:e.grounded(v),
   damageBy:{'p-archer':v.damageBy?.['p-archer']??0,'p-knight':v.damageBy?.['p-knight']??0}});
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
    state=page.evaluate(READ);u=state['active'];aid=u['id']
    if state['round']<(5 if aid=='p-archer' else 4) or aid not in ('p-archer','p-knight') or state['step']!=0 or state['side']!=0:return False
    track='A09' if aid=='p-archer' else 'S03'
    rec=proof.setdefault('skillTrials',{}).setdefault(track,{'attempts':[],'complete':False})
    if rec['complete'] or len(rec['attempts'])>=5:return False
    targets=([r for want in ('a5-foe-8','a5-foe-2') for r in state['relevant'] if r['id']==want and
               not r['dead'] and r['awake'] and 220<(r['x']-u['x'])*u['facing']<1080 and 145<u['y']-r['y']<820]
             if track=='A09' else [r for r in state['relevant'] if r['id']=='a5-foe-4' and not r['dead'] and
               35<r['x']-u['x']<780 and abs(r['y']-u['y'])<300 and u['move']>130])
    if not targets:return False
    row=dict(before=state,skill=track,targets=[v['id'] for v in targets]);rec['attempts'].append(row);dump()
    def read():return page.evaluate(READ)
    def pulse(k,ms):
        page.keyboard.down(k)
        try:page.wait_for_timeout(ms)
        finally:page.keyboard.up(k)
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
        rate=page.evaluate("""id=>{const a=HonroApp,e=a.engine,u=e.active,s=HONRO_CORE.SKILLS[id];
          return e.skillAllowed(s,u)&&e.canAfford(s,u,1)&&!e.cooldownLeft(u,id)?e.chargeDuration(u,s):null;}""",track)
        if rate is None:return {'ok':False,'reason':'stock legality/focus'}
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
        # Three ordinary plans in different eligible turns; never send launch without a verified node + contact.
        goal=(75,82,68,78,71)[len(rec['attempts'])-1]
        if not aim(goal):row['reason']='A09 keyboard angle not attained';dump();return False
        start=read();row['charge']=charge(.65);current=read()
        if current['shot']!=start['shot']:raise AssertionError('A09 charged unexpectedly launched without planning')
        if not current['planned']:row['reason']='No stock planned-turn path';dump();return False
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
               if(d<105||d>466||p.y>=t.y-35)return [];
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
        target=p['target'];photo('06-a09-native-plan-before-commit.png')
        before=read();page.keyboard.press('Space')
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
        if proof_event and not seen:photo('08-'+track.lower()+'-native-action.png');seen=True
        if used and q['phase'] not in ('flight','cast') and not q['projectiles'] and not q['melee']:break
        page.wait_for_timeout(16)
    measured=next(v for v in q['relevant'] if v['id']==target)
    damage=prior['hp']-measured['hp']; own=measured['damageBy'][aid]-prior['damageBy'][aid]
    row.update(target=target,actualDamage=damage,actorDamageLedgerDelta=own,registeredNativeSkill=bool(seen),spentAction=used,
      after=q,passed=bool(used and seen and damage>0 and own>0))
    rec['complete']=row['passed']
    if used:photo('09-'+track.lower()+'-native-result.png')
    dump();return used
