"""Phase2→3 on same genuine campaign session only. No state writes."""
import time
from pathlib import Path
from escort_start import SNAP, MAIN, ESCORTS

IDS=['a5-foe-13','a5-foe-14','a5-foe-15']
def build_probe():
    s=Path(__file__).with_name('approach-probe.js').read_text()
    for old,new in [
      ('required=d.required.approach','required=d.required.corridor'),
      ("['a5-foe-0','a5-foe-2','a5-foe-3','a5-foe-4']",str(IDS).replace(' ','')),
      ('!canShot||m?.step>0||!visible(u)','!canShot||m?.step!==2||!visible(u)'),
      ('allies=b.units.filter(t=>t!==u&&t.side!==1&&alive(t))','allies=b.units.filter(t=>t.side!==1&&alive(t))')]:
        assert s.count(old)==1,old
        s=s.replace(old,new)
    return s

def carry_corridor(page,out,res,dump):
    anchor=res['escortStart']
    prior=anchor['end']
    assert anchor['passed'] and anchor['firstNativeNPCMotion']['to']['x']-anchor['firstNativeNPCMotion']['from']['x']>=24
    def get():return page.evaluate(SNAP,{'duration':0})
    start=get()
    assert start['step']==2 and start['session']==prior['session'] and start['origin']=='campaign'
    assert [v['id'] for v in start['corridor']]==IDS
    proof={'initial':start,'events':[],'passed':False,'scope':'Only live escort movement through refuge; no drum, captain, exit or full clear.'}
    res['escortCorridor']=proof
    probe=build_probe();st=time.monotonic()
    def aim(kind,**kw):return page.evaluate(probe,dict(kind=kind,**kw))
    def note(kind,**kw):
        proof['events'].append(dict(kind=kind,**kw));dump()
    def pulse(key,ms):
        page.keyboard.down(key)
        try:page.wait_for_timeout(ms)
        finally:page.keyboard.up(key)
    def view(z):return {k:z[k] for k in ('step','round','phase','active','escorts','corridor','projectiles','shot','refuge','evacuated')}
    def ground(v):return v and not v['dead'] and not v['airborne'] and v['grounded'] and v['support']==MAIN
    def near(z):
        f=z['refuge']
        return all(abs(v['x']-f['x'])<=185 and abs(v['y']-f['y'])<=115 for v in z['escorts'])
    def safe(z):return {v['id'] for v in z['escorts']}==ESCORTS and all(v['hp']>0 and not v['dead'] for v in z['escorts'])
    def screen(name):page.screenshot(path=str(out/(name+'.png')))
    screen('08-corridor-native-start')
    previous=None; progress=time.monotonic(); last=None; last_escort_frame=None
    for i in range(840):
        z=get()
        assert z['session']==start['session'] and z['stage']==42 and not z['custom']
        sig=(z['step'],z['phase'],z['round'],z['shot'],tuple((v['id'],round(v['x']),v['hp']) for v in z['escorts']+z['corridor']))
        if sig!=previous:
            progress=time.monotonic();previous=sig
            if last is None or (sig[0],sig[2],sig[4])!=(last[0],last[2],last[4]):
                note('live objective/escort/required-target transition',state=view(z))
            last=sig
        if z['step']==3:
            # Stock Act5 evacuate() moves the NPCs out of battle BEFORE advance().
            # The exact engine records named evacuees; require that native ledger,
            # same campaign session and prior observed movement (including final
            # live pre-transition frame), never expect evacuated NPCs in the roster.
            evac=z['evacuated'] or []
            proof.update(end=z,evacuated=evac,lastLiveEscort=last_escort_frame,
                         observedFinalNear=bool(last_escort_frame and near(last_escort_frame)))
            proof['passed']=(len(evac)==3 and {v['id'] for v in evac}==ESCORTS and
                             all(v['hp']>0 for v in evac) and not z['escorts'] and
                             last_escort_frame is not None and safe(last_escort_frame) and
                             all(v['dead'] and v['hp']<=0 for v in z['corridor']))
            if proof['passed']:screen('09-all-three-naturally-at-refuge');dump();return
            break
        if z['step']==2 and safe(z):last_escort_frame=z
        if z['phase']=='lost' or not safe(z) or time.monotonic()-st>135 or time.monotonic()-progress>32 or z['round']>start['round']+6:
            break
        if z['step']!=2 or z['side']!=0 or z['projectiles']:page.wait_for_timeout(145);continue
        if z['dialogue']:
            page.keyboard.press('Space');page.wait_for_timeout(185);continue
        if not z['ready']:page.wait_for_timeout(140);continue
        u=z['active']
        if not ground(u):
            if u and u['grounded'] and not u['dead'] and not u['airborne']:
                page.keyboard.press('KeyF');page.wait_for_timeout(130)
                note('ordinary F on wrong height, no forced support teleport',state=view(z))
            else:page.wait_for_timeout(150)
            continue
        if u['retreat']:
            page.keyboard.press('KeyF');page.wait_for_timeout(140)
            note('ordinary stock retreat conclusion',state=view(z));continue
        hunt=[v for v in z['corridor'] if not v['dead']]
        lead=min(z['escorts'],key=lambda v:v['x'])
        # Actual stock short hostile forwarding gate, report proximity not attribution.
        blocks=[v['id'] for v in hunt if any(0<v['x']-p['x']<115 and abs(v['y']-p['y'])<80 for p in z['escorts'])]
        plan=aim('plan')
        if not plan.get('ok') and u['x']<min(3620,lead['x']+46)-18 and u['move']>=42:
            destination=min(3620,lead['x']+46,u['x']+380)
            page.keyboard.down('KeyD')
            try:
                page.wait_for_function("""({dest,id})=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active;return u.id!==id||
                    b.honroState.act5.step!==2||!a.canInput()||a.dialogue||u.x>=dest||
                    u.moveLeft<24||!e.grounded(u)||e.contactSurface(u.x,u.y-4,u.y+4)?.t.id!=='MAIN_ESCORT_C_FULL';}""",
                    arg={'dest':destination,'id':u['id']},polling='raf',timeout=2700)
            except Exception:pass
            finally:page.keyboard.up('KeyD')
            note('ordinary MAIN lead D',fromX=u['x'],requested=destination,possibleMeleeBlockers=blocks,state=view(get()));continue
        if plan.get('ok'):
            assert plan['target'] in IDS
            page.keyboard.press('Digit'+str(plan['slot']+1))
            for _ in range(13):
                q=aim('state');d=plan['angle']-q['viewAngle']
                if q['active']!=u['id'] or not q['readiness'] or abs(d)<=.9:break
                pulse('ArrowUp' if d>0 else 'ArrowDown',max(14,min(305,round(abs(d)/62*950))))
            q=aim('state')
            c=aim('confirm',angle=q['viewAngle'],power=plan['power'],target=plan['target'])
            if c.get('ok') and q['active']==u['id'] and q['selected']==plan['skill'] and .15<c['duration']<10:
                old=get()
                page.keyboard.down('Space')
                try:
                    charged=page.evaluate("""({p,id,shot})=>new Promise(resolve=>{
                      const t=performance.now();function f(){const a=HonroApp,e=a.engine,b=e.b;
                        if(e.active.id!==id||b.shot!==shot||b.phase!=='aim'||b.honroState.act5.step!==2||a.dialogue)return resolve(null);
                        const n=a.charging?a.chargePower():null;
                        if(n!==null&&n>=p)return resolve(n);
                        if(performance.now()-t>3100)return resolve(null);requestAnimationFrame(f);
                      }requestAnimationFrame(f);
                    })""",{'p':max(.36,plan['power']-.024/c['duration']),'id':u['id'],'shot':old['shot']})
                    if charged is None or abs(charged-plan['power'])>.027:
                        page.keyboard.press('Escape')
                finally:page.keyboard.up('Space')
                hit=page.evaluate("""({shot,id,target,skill})=>new Promise(resolve=>{
                   const t=performance.now(),e=HonroApp.engine;
                   const seen=[];const v=e.unit(target), hp=v.hp, own=v.damageBy?.[id]??0;
                   function f(){
                      const b=e.b,w=e.unit(target);
                      const p=b.projectiles.filter(p=>p.shot===shot+1&&p.owner===id&&p.skill===skill);
                      if(p.length&&!seen.length)seen.push(...p.map(q=>q.id));
                      const delta=hp-w.hp,owner=(w.damageBy?.[id]??0)-own;
                      if(delta>0||performance.now()-t>3800||b.honroState.act5.step>2)
                        return resolve({shot:b.shot,seen,delta,owner,target,ownedHit:b.shot===shot+1&&seen.length>0&&delta>0&&owner>0});
                      requestAnimationFrame(f);
                   }requestAnimationFrame(f);
                })""",{'shot':old['shot'],'id':u['id'],'target':plan['target'],'skill':plan['skill']})
                note('stock required corridor shot',plan=plan,charge=charged,hit=hit,state=view(get()));continue
        if not hunt:
            # No action needed while the nearby active hero can lead.
            page.wait_for_timeout(260)
            if lead['x']<min(v['x'] for v in get()['escorts'])-4:continue
        # Only conclude a current legal friendly turn; never issue enemy controls.
        ready=get()
        if ready['side']==0 and ready['ready'] and ready['step']==2 and not ready['dialogue']:
            page.keyboard.press('KeyF');page.wait_for_timeout(180)
            note('no safe candidate; ordinary F',possibleMeleeBlockers=blocks,plan=plan,state=view(ready))
    proof['end']=get();dump();screen('09-corridor-native-gap')
    raise AssertionError('Full refuge transition not observed inside bounded ordinary play')
