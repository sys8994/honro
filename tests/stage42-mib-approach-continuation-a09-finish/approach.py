"""One normal official stock Stage42 approach hit; no fight completion claim."""
from pathlib import Path
import time
from stock_skill_trials import note as skill_trial
PROBE=Path(__file__).with_name('approach-probe.js').read_text()
REQUIRED=['a5-foe-0','a5-foe-2','a5-foe-3','a5-foe-4']
GROUP=['a5-foe-0','a5-foe-1','a5-foe-2','a5-foe-3','a5-foe-4']
def play_first_approach(page,out,res,dump):
    proof=dict(scope='Official isolated C geometry; staged level25 and predecessor prerequisite only; live keyboard A01 pending.',
               passed=False,required=REQUIRED,search=[],controls=[],shots=[])
    res['approach']=proof;dump()
    def get(kind='state',**kw):
        return page.evaluate(PROBE,dict(kind=kind,**kw))
    def photo(name):page.screenshot(path=str(out/(name+'.png')))
    def pulse(k,ms):
        assert k in ('ArrowUp','ArrowDown') and 10<=ms<=420
        page.keyboard.down(k)
        try:page.wait_for_timeout(ms)
        finally:page.keyboard.up(k)
    def guard(s):
        assert s['readiness'] and not s['lastError'] and s['active']=='p-archer' and s['round']==1 and s['side']==0 and s['step']==0,s
        assert [t['id'] for t in s['targets']]==REQUIRED and s['authoredApproach']==GROUP and all(not t['dead'] for t in s['targets']),s
    initial=get();guard(initial);proof['before']=initial;dump()
    # R5 movement already happened naturally. Bring a required actor on screen only if needed.
    plan=None
    for x in (None,510,680,770):
        if x is not None:
            prev=get();guard(prev)
            if x>prev['x']+2:
                page.keyboard.down('KeyD')
                try:page.wait_for_function('v=>HonroApp.engine.active.x>=v',arg=x,polling='raf',timeout=7500)
                finally:page.keyboard.up('KeyD')
                curr=get();guard(curr);proof['controls'].append(dict(key='D',before=prev['x'],after=curr['x']));dump()
                assert curr['x']>=x and curr['x']<=x+35 and curr['move']<prev['move'] and curr['shot']==prev['shot']
        plan=get('plan'); proof['search'].append(dict(location=get(),prediction=plan));dump()
        if plan.get('ok'):break
    assert plan and plan.get('ok'),'No stable reachable visible required target for one natural Archer shot'
    assert plan['actor']=='p-archer' and plan['skill']=='A01' and plan['target'] in REQUIRED,plan
    prev=get();guard(prev)
    if prev['selected']!=plan['skill']:
        page.keyboard.press('Digit'+str(plan['slot']+1));proof['controls'].append(dict(key='Digit'+str(plan['slot']+1)));dump()
    for _ in range(15):
        a=get();guard(a);assert a['selected']=='A01'
        delta=plan['angle']-a['viewAngle']
        if abs(delta)<=.95:break
        pulse('ArrowUp' if delta>0 else 'ArrowDown',max(14,min(320,round(abs(delta)/62*950))))
    before=get();guard(before)
    exact=get('confirm',angle=before['viewAngle'],power=plan['power'],target=plan['target'])
    proof['aim']=dict(state=before,plan=plan,confirmed=exact);dump()
    assert exact.get('ok'),'Actual keyboard aim has no robust direct required hit'
    photo('03-before-ordinary-approach-shot')
    # Measure charge through the real HUD getter; estimate normal Chromium key release latency
    # from the previous pinned native controls and leave broad predictor ±.029 headroom.
    pgoal=plan['power']; duration=exact['duration']; assert .15<duration<10 and .4<pgoal<1,(pgoal,duration)
    page.keyboard.down('Space')
    try:
        threshold=max(.36,pgoal-(.0275/duration))
        charged=page.evaluate("""({threshold,actor})=>new Promise(resolve=>{
          const start=performance.now();
          function poll(){
            const a=HonroApp,e=a.engine,b=e.b;
            if(e.active?.id!==actor||b.phase!=='aim'||b.side!==0||a.dialogue)return resolve({ok:false,reason:'Live charging context drift'});
            const measured=a.charging?a.chargePower():null;
            if(measured!==null&&measured>=threshold)return resolve({ok:true,threshold,measured,elapsedMs:performance.now()-start});
            if(performance.now()-start>3500)return resolve({ok:false,reason:'HUD charge not attained',measured});
            requestAnimationFrame(poll);
          } requestAnimationFrame(poll);
        })""",dict(threshold=threshold,actor=before['active']))
        proof['charge']=charged;dump()
        if not charged['ok'] or abs(charged['measured']-pgoal)>.041:
            page.keyboard.press('Escape')
            raise AssertionError('Normal charge drift, cancelled')
    finally:
        page.keyboard.up('Space')
    proof['controls'].append(dict(key='Space',action='keyboard press/real HUD charge/keyboard release'));dump()
    row=dict(actor=before['active'],target=plan['target'],selected='A01',shotBefore=before['shot'],frames=[],actualDamage=0)
    proof['shots'].append(row);dump()
    until=time.monotonic()+8;flight=False
    orig=next(t for t in before['targets'] if t['id']==plan['target'])
    while time.monotonic()<until:
        now=get()
        row['frames'].append(dict(phase=now['phase'],shot=now['shot'],projectiles=now['projectiles'],
                                  requiredHP={t['id']:t['hp'] for t in now['targets']}))
        if any(p.get('owner')=='p-archer' and p.get('skill')=='A01' for p in now['projectiles']) and not flight:
            photo('04-ordinary-approach-arrow-flight');flight=True
        tgt=next(t for t in now['targets'] if t['id']==plan['target'])
        if orig['hp']>tgt['hp']:break
        if now['shot']>before['shot'] and now['phase']=='aim' and not now['projectiles']:break
        page.wait_for_timeout(25)
    photo('05-ordinary-approach-first-result')
    row['actualDamage']=orig['hp']-tgt['hp'];row['targetHPBefore']=orig['hp'];row['targetHPAfter']=tgt['hp']
    row['after']=now;row['realArrowFlightPicture']=flight;dump()
    assert now['shot']==before['shot']+1 and row['actualDamage']>0,'One real stock A01 failed to damage predicted required actor'
    assert any(any(p.get('owner')=='p-archer' and p.get('skill')=='A01' for p in f['projectiles']) for f in row['frames']),'No real Archer A01 projectile observed'
    assert now['step']==0,'First-hit smoke does not adjudicate a passed fight gate'
    proof['scope']='Official Stage42 prepared level25 entry; only actual first Archer A01 damage on an existing mandatory approach actor. Not all four, rescue/escort/clear, difficulty, or natural campaign progression.'
    proof['passed']=True;dump()

def continue_approach(page,out,res,dump):
    """A fresh real normal campaign through first hit; then legal turns only."""
    play_first_approach(page,out,res,dump)
    proof=dict(scope='Campaign natural tactical escort survival trial (no HP/rules/geometry changes); never full campaign.',
               stockActions='Confirmed stock A01/M01 only; Knight/Occultist use normal grounded movement and F; no unverified support skill.',
               historicalR3={'run':44572685697,'soldierOneRound1to5ThenLoss':[977,829,586,434,203,0],
                 'loss':'soldier1 dead in enemy turn5; all own heroes survived'},escortEvents=[],frontline=[],
               referenceR4={'run':44574782402,'firstR6Escorts':[744,681,756],'defeated':'a5-foe-0','remaining':['a5-foe-2','a5-foe-3','a5-foe-4']},
               maxActions=105,maxRounds=23,maxSeconds=660,actions=[],defeats=[],passed=False,approachCleared=False)
    res['continuation']=proof;dump()
    st=time.monotonic()
    def get(kind='state',**kw): return page.evaluate(PROBE,dict(kind=kind,**kw))
    def pulse(k,ms):
        page.keyboard.down(k)
        try:page.wait_for_timeout(ms)
        finally:page.keyboard.up(k)
    def note(**data):proof['actions'].append(data);dump()
    def photo(name):page.screenshot(path=str(out/(name+'.png')))
    initial=get()
    previous={t['id']:t['hp'] for t in initial['targets']}
    proof['initial']=initial
    last_shot=-1;without_progress=0;first_defeat_action=None
    for action in range(105):
        if time.monotonic()-st>=660:break
        now=get()
        if now['step']>0 or all(t['dead'] for t in now['targets']):break
        if now['round']-initial['round']>=23 or now['phase'] in ('won','lost') or now['lastError']:break
        if without_progress>=12:break
        # canInput alone can become true while the Archer is still settling recoil.
        # Observe eight consecutive stock bridge frames of exact probe readiness for
        # the same player actor/round/ground support. No engine or battle writes.
        stable=page.evaluate("""({probe,ms})=>new Promise(resolve=>{
          const read=Function('return ('+probe+')')(),start=performance.now(),timeline=[];
          let key=null,count=0,maxStable=0,samples=0,lastSig='',seenEnemy=false,lastProgressAt=0,progressSig='',progressCount=0;
          let npcBefore=null,priorProjectiles=[];
          const escortEvents=[];
          function tick(){
            const a=HonroApp,e=a.engine,b=e.b,u=e.active;
            const s=read({kind:'state'}),grounded=!!u&&e.grounded(u);
            const support=u?e.contactSurface(u.x,u.y-5,u.y+5)?.t.id??null:null;
            const baseReady=b.side===0&&u?.side===0&&grounded&&!!support&&!b.projectiles.length&&!a.dialogue;
            const settleKind=baseReady&&!!s.readiness&&!u.retreat?'settled':
              baseReady&&!!a.canInput()&&b.phase==='aim'&&u.retreat?'settled-retreat':null;
            const settle=!!settleKind;
            const mark={ms:Math.round(performance.now()-start),phase:b.phase,round:b.round,step:s.step,
              battleSide:b.side,actorSide:u?.side??null,actor:u?.id??null,acted:!!u?.acted,retreat:!!u?.retreat,
              canInput:!!a.canInput(),probeReady:!!s.readiness,grounded,support,platformDrop:u?.platformDrop??null,
              projectiles:b.projectiles.length,settleKind,
              x:u?.x??null,y:u?.y??null,vy:u?.vy??null,settle,dialogue:!!a.dialogue,
              shot:b.shot??b.shots??0,queueDepth:b.queue?.length??null,reviewLeft:b.reviewLeft??null,
              teamEnds:Array.isArray(b.teamEnds)?[...b.teamEnds]:null};
            const enemyNow=b.side===1||b.phase==='enemy'||u?.side===1&&b.phase==='review';
            seenEnemy=seenEnemy||enemyNow;
            const bin=(x,step)=>Number.isFinite(x)?Math.round(x/step):null;
            const movement=[bin(mark.x,12),bin(mark.y,12)];
            const missiles=(b.projectiles??[]).slice(0,6).map(p=>[p.id,bin(p.x,24),bin(p.y,24)]);
            const movementSig=JSON.stringify([mark.round,mark.battleSide,mark.phase,mark.actor,mark.shot,mark.queueDepth,
              mark.teamEnds,movement,missiles,s.roster.reduce((n,v)=>n+(v.hp||0),0)]);
            if(movementSig!==progressSig){progressSig=movementSig;lastProgressAt=mark.ms;progressCount++;}
            const npc=b.units.filter(v=>v.honroAct5Escort).map(v=>({id:v.id,hp:v.hp,x:v.x,y:v.y,dead:!!v.dead}));
            const ps=(b.projectiles??[]).slice(0,24).map(p=>({id:p.id,owner:p.owner,skill:p.skill,x:p.x,y:p.y}));
            if(npcBefore)for(const row of npc){
              const old=npcBefore.find(v=>v.id===row.id);
              if(old&&row.hp!==old.hp&&escortEvents.length<80)escortEvents.push({ms:mark.ms,phase:mark.phase,round:mark.round,
                 active:mark.actor,shot:mark.shot,id:row.id,hpBefore:old.hp,hpAfter:row.hp,dead:row.dead,x:row.x,y:row.y,
                 projectileCandidatesBefore:priorProjectiles,projectileCandidatesAfter:ps,
                 attribution:'same-frame context, not a damage-event source claim'});
            }
            npcBefore=npc;priorProjectiles=ps;mark.escort=npc.map(v=>[v.id,v.hp,v.dead]);
            mark.enemyNow=enemyNow;mark.seenEnemy=seenEnemy;mark.progressCount=progressCount;
            mark.noProgressMs=mark.ms-lastProgressAt;
            const k=settle?[settleKind,mark.round,mark.actor,mark.support,mark.x,mark.y].join('|'):null;
            count=k===null?0:k===key?count+1:1;key=k;maxStable=Math.max(maxStable,count);samples++;
            const sig=[mark.phase,mark.battleSide,mark.round,mark.actor,mark.acted,mark.retreat,
               mark.canInput,mark.probeReady,mark.grounded,mark.support,mark.projectiles].join('|');
            if(timeline.length<72&&(sig!==lastSig||samples%60===0)){timeline.push(mark);lastSig=sig;}
            const done=reason=>resolve({reason,samples,maxStable,timeline,last:mark,seenEnemy,progressCount,lastProgressAt,escortEvents});
            if(s.step>0||s.phase==='won'||s.phase==='lost')return done('terminal');
            if(s.dialogue&&!enemyNow&&b.side===0&&u?.side===0)return done('dialogue');
            if(count>=8)return done(settleKind);
            if(mark.ms>=ms)return done(seenEnemy?'enemy-wait-hard-cap-or-wall-budget':'controller-wall-budget');
            if(seenEnemy&&mark.noProgressMs>=19000)return done('enemy-wait-without-observable-progress');
            if(!seenEnemy&&mark.ms>=16000)return done('controller-nonenemy-timeout');
            requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        })""",dict(probe=PROBE,ms=max(100,min(85000,round((660-(time.monotonic()-st))*1000)))))
        proof['escortEvents'].extend(stable['escortEvents'])
        note(action=action,kind='read-only-controller-frame-stability',**stable)
        now=get()
        if stable['reason']=='terminal' or now['step']>0 or now['phase'] in ('won','lost'):break
        if now['dialogue'] and now['side']==0 and stable['reason']=='dialogue':
            page.keyboard.press('Space');note(action=action,kind='ordinary dialogue advance');continue
        if stable['reason']=='settled-retreat':
            old=page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active;
               return {id:u.id,round:b.round,side:b.side,phase:b.phase,canInput:a.canInput(),retreat:!!u.retreat,
                 grounded:e.grounded(u),x:u.x,y:u.y,move:u.moveLeft,acted:!!u.acted,platformDrop:u.platformDrop??null};}""")
            if not (old['canInput'] and old['retreat'] and old['grounded'] and old['side']==0 and old['phase']=='aim'
                    and old['id']==stable['last']['actor'] and old['round']==stable['last']['round']):
                note(action=action,kind='retreat controller changed before any input',state=old);break
            page.keyboard.press('KeyF')
            try:
                page.wait_for_function("""old=>{const e=HonroApp.engine,b=e.b,u=e.active;
                   return u?.id!==old.id||b.round!==old.round||b.side!==0||b.phase!=='aim'||!u.retreat;}""",arg=old,timeout=2600)
            except Exception:
                note(action=action,kind='ordinary F retreat timeout',before=old,after=get());break
            after=get();note(action=action,kind='ordinary F ended verified retreat',before=old,after=after)
            continue
        if stable['reason']!='settled' or not now['readiness'] or now['side']!=0 or now['active']!=stable['last']['actor']:
            note(action=action,kind='controller failed safe readiness',state=now);break
        round_key=str(now['round'])
        if round_key not in proof.setdefault('roundStart',{}):
            proof['roundStart'][round_key]=dict(escorts=[r for r in now['roster'] if r['side']==2],required=now['targets'])
            dump()
        if now['round']==6 and 'capturedR6' not in proof:
            photo('08-start-of-actual-round-six');proof['capturedR6']=True;dump()
        # Change tactic, not stage: put earlier unused turns into a guarded frontline.
        # Stop if natural collision or move budget blocks the walk. Do not claim a lure succeeded.
        escort=[v for v in now['roster'] if v['side']==2]
        endangered=any(v['hp']<v['maxHp']*.78 for v in escort)
        desired={'p-knight':1420 if endangered else 1160,'p-occultist':1170 if endangered else 970}.get(now['active'])
        if desired and desired>=now['x']+46 and now['move']>=145:
            previous_actor=now
            page.keyboard.down('KeyD')
            try:page.wait_for_function("""({x,id})=>{const a=HonroApp,u=a.engine.active;
               return u.id!==id||u.x>=x||u.moveLeft<=105||!a.canInput();}""",
               arg={'x':desired,'id':now['active']},polling='raf',timeout=2800)
            except Exception:pass
            finally:page.keyboard.up('KeyD')
            now=get()
            support=page.evaluate("""()=>{const e=HonroApp.engine,u=e.active;
               return e.contactSurface(u.x,u.y-4,u.y+4)?.t.id??null;}""")
            item=dict(actor=previous_actor['active'],round=previous_actor['round'],
               before=previous_actor['x'],after=now['x'],spent=previous_actor['move']-now['move'],
               key='D',requested=desired,support=support,escorts=escort)
            proof['frontline'].append(item);note(action=action,kind='ordinary early frontline D',**item)
            if now['active']!=previous_actor['active'] or not now['readiness'] or support!='MAIN_ESCORT_C_FULL':
                note(action=action,kind='frontline move ended before safe control',state=now);continue
        if skill_trial(page,out,proof,dump):
            # A native skill performed a turn action. Record its distinct proof;
            # the ordinary loop then uses only the next legitimate controller.
            note(action=action,kind='native skill action accounted separately',state=get())
            without_progress=0
            if any(proof.get('skillTrials',{}).get('A09',{}).get(k) for k in ('complete','stop')):break
            continue
        now=get()
        if not now['readiness']:continue
        plan=get('plan') if now['canShot'] else {'ok':False,'reason':'No validated direct damage skill for active actor; normal position only'}
        if not plan.get('ok') and now['canShot'] and now['move']>=180:
            lead_down=any(t['id']=='a5-foe-0' and t['dead'] for t in now['targets'])
            ahead=[t for t in now['targets'] if not t['dead'] and t['x']>now['x']+(240 if lead_down else 142)
                   and abs(t['y']-now['y'])<=(380 if lead_down else 290)]
            if ahead:
                # After the first gate defender falls, use the already-surveyed MAIN
                # slope rather than continue spending turns firing from the opening.
                # Anchor the sally behind the protective Knight and stop well short of the targets.
                knight=next(v for v in now['roster'] if v['id']=='p-knight')
                cap=min(1580,knight['x']+135) if lead_down and not knight['dead'] else now['x']+112
                stride=min(330,max(112,now['move']-108)) if lead_down else 112
                dest=min(now['x']+stride,min(t['x']-(245 if lead_down else 130) for t in ahead),
                         cap if lead_down else float('inf'))
                if dest<=now['x']+16:dest=None
            else:dest=None
            if dest is not None:
                page.keyboard.down('KeyD')
                try:page.wait_for_function('x=>HonroApp.engine.active.x>=x',arg=dest,polling='raf',timeout=2400)
                except Exception: pass
                finally:page.keyboard.up('KeyD')
                moved=get()
                note(action=action,kind='ordinary-D-planning',before=now,after=moved)
                support=page.evaluate("""()=>{const e=HonroApp.engine,u=e.active;return e.contactSurface(u.x,u.y-4,u.y+4)?.t.id??null;}""")
                if moved['active']!=now['active'] or not moved['readiness'] or support!='MAIN_ESCORT_C_FULL':
                    note(action=action,kind='ranged route no safe continuation',state=moved,support=support);continue
                origin=now['x'];now=moved
                if moved['x']>origin+10:
                    plan=get('plan')
        confirm=None
        if plan.get('ok'):
            if now['selected']!=plan['skill']:page.keyboard.press('Digit'+str(plan['slot']+1))
            for _ in range(13):
                now=get();delta=plan['angle']-now['viewAngle']
                if abs(delta)<=.95:break
                pulse('ArrowUp' if delta>0 else 'ArrowDown',max(14,min(320,round(abs(delta)/62*950))))
            now=get()
            if now['active']==plan['actor'] and now['selected']==plan['skill'] and now['readiness']:
                confirm=get('confirm',angle=now['viewAngle'],power=plan['power'],target=plan['target'])
        if not confirm or not confirm.get('ok'):
            old=now;page.keyboard.press('KeyF');page.wait_for_timeout(120)
            nxt=get();note(action=action,kind='ordinary-F-defend',reason=(confirm or plan).get('reason'),before=old,after=nxt)
            without_progress+=1;continue
        assert now['shot']>last_shot and plan['target'] in REQUIRED
        pgoal=plan['power'];duration=confirm['duration']; assert .15<duration<10
        row=dict(action=action,kind='ordinary key release',before=now,plan=plan,confirmed=confirm,samples=[])
        proof['actions'].append(row);dump()
        page.keyboard.down('Space');charged=None
        try:
            charged=page.evaluate("""({threshold,actor})=>new Promise(resolve=>{
              const start=performance.now();
              function poll(){
                const a=HonroApp,e=a.engine,b=e.b;
                if(e.active?.id!==actor||b.phase!=='aim'||b.side!==0||a.dialogue)return resolve({ok:false,reason:'Live charging context drift'});
                const measured=a.charging?a.chargePower():null;
                if(measured!==null&&measured>=threshold)return resolve({ok:true,threshold,measured,elapsedMs:performance.now()-start});
                if(performance.now()-start>3300)return resolve({ok:false,reason:'HUD charge not attained',measured});
                requestAnimationFrame(poll);
              }requestAnimationFrame(poll);
            })""",{'threshold':max(.36,pgoal-.0275/duration),'actor':now['active']})
            row['charge']=charged
            if not charged['ok'] or abs(charged['measured']-pgoal)>.041:
                page.keyboard.press('Escape');raise AssertionError('Ordinary charge drift; cancellation only')
        finally:page.keyboard.up('Space')
        last_shot=now['shot'];deadline=time.monotonic()+8
        flight=False; target=plan['target']; was=next(t for t in now['roster'] if t['id']==target)
        while time.monotonic()<deadline:
            q=get();tgt=next(t for t in q['roster'] if t['id']==target)
            ps=[p for p in q['projectiles'] if p.get('owner')==now['active'] and p.get('skill')==plan['skill']]
            row['samples'].append(dict(shot=q['shot'],phase=q['phase'],projectiles=ps,hp=tgt['hp'],dead=tgt['dead']))
            flight=flight or bool(ps)
            if tgt['hp']<was['hp'] or q['step']>0 or (q['shot']>now['shot'] and q['phase']=='aim' and not ps):break
            page.wait_for_timeout(28)
        progress=now['shot']+1==q['shot'] and flight and tgt['hp']<was['hp']
        row.update(after=q,flightObserved=flight,confirmedActualDamage=was['hp']-tgt['hp'] if progress else 0)
        without_progress=0 if progress else without_progress+1
        if progress and target in REQUIRED and not was['dead'] and tgt['dead']:
            proof['defeats'].append(dict(id=target,hpBefore=was['hp'],hpAfter=tgt['hp'],actor=now['active'],round=now['round'],shot=q['shot']))
            if first_defeat_action is None:
                first_defeat_action=action;photo('06-first-actual-required-defeat')
        previous={v['id']:v['hp'] for v in q['targets']};dump()
    end=get()
    if all(t['dead'] for t in end['targets']) and end['step']==0 and end['phase'] not in ('lost','won'):
        try:
            page.wait_for_function("""()=>{const b=HonroApp.engine.b;return b.honroState.act5.step===1||b.phase==='lost';}""",timeout=9000)
        except Exception:pass
        end=get()
    proof.update(end=end,elapsedSeconds=round(time.monotonic()-st,2))
    proof['allRequiredDead']=all(t['dead'] and t['hp']<=0 for t in end['targets'])
    proof['approachCleared']=end['step']==1 and proof['allRequiredDead']
    proof['firstPhase']=page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,d=b.honroMap.act5,s=HonroAct5.state(b);
      return {step:b.honroState.act5.step,kind:d.flow[b.honroState.act5.step]?.[0]??null,
              objective:d.flow[b.honroState.act5.step]?.[1]??null,currentInstruction:s.currentInstruction,actualTargets:s.targets.map(t=>t.id)};}""")
    escorts=[r for r in end['roster'] if r['side']==2]
    proof['escortsAlive']=len(escorts)==3 and all(not r['dead'] and r['hp']>0 for r in escorts)
    proof['firstSixEscorts']=[r for g in proof.get('roundStart',{}).items() if g[0]=='6' for r in g[1]['escorts']]
    survivors=proof['firstSixEscorts']
    proof['escapedHistoricalR5Failure']=(len(survivors)==3 and all(not r['dead'] and r['hp']>0 for r in survivors)) or (proof['approachCleared'] and proof['escortsAlive'])
    proof['minimumEscortHPThroughEnd']={r['id']:min([r['hp'],*[e['hpAfter'] for e in proof['escortEvents'] if e['id']==r['id']]])
                                       for r in escorts}
    proof['knightIntervention']=any(i['actor']=='p-knight' and i['support']=='MAIN_ESCORT_C_FULL' and i['after']-i['before']>=100 and i['spent']>0 for i in proof['frontline'])
    proof['actualSkillTracks']={k:proof.get('skillTrials',{}).get(k,{}).get('complete',False) for k in ('A09','S03')}
    a09=proof.get('skillTrials',{}).get('A09',{})
    proof['A09distinctMilestones']={k:a09.get(k,False) for k in ('actualPlanGenerated','actualClickedPlan','actualA09Released','complete')}
    proof['A09foe8Finish']={k:a09.get(k) for k in ('releasedCount','ownHits','allEscortAlive','stop')}
    proof['passed']=all(proof['A09distinctMilestones'].values()) and 1<=a09.get('releasedCount',0)<=2 and proof['knightIntervention']
    photo('07-bounded-approach-continuation-final');dump()
    assert proof['passed'],'Did not naturally defeat exact foe8 within at most two attributable native A09 attacks and all escorts alive; see actual milestones'
