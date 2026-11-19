"""Same-session stock Act5 Phase1→2 and first natural escort steps; unexecuted scaffold."""
import time
REQUIRED=['a5-foe-0','a5-foe-2','a5-foe-3','a5-foe-4']
ESCORTS={'a5-gwak','a5-soldier-one','a5-soldier-two'}
MAIN='MAIN_ESCORT_C_FULL'
SNAP="""async ({duration=0}={})=>{
 const record=()=>{
  const a=HonroApp,e=a.engine,b=e.b,d=b.honroMap.act5,m=b.honroState.act5,u=e.active;
  const pawn=v=>v?{id:v.id,x:v.x,y:v.y,hp:v.hp,dead:!!v.dead,airborne:!!v.airborne,acted:!!v.acted,
    grounded:e.grounded(v),support:e.contactSurface(v.x,v.y-4,v.y+4)?.t.id??null,move:v.moveLeft,retreat:!!v.retreat}:null;
  return {t:performance.now(),session:b.session,stage:b.honroStage,origin:b.honroMapOrigin,custom:b.honroCustom,
    step:m.step,row:d.flow[m.step]??null,round:b.round,side:b.side,phase:b.phase,ready:!!a.canInput(),
    dialogue:!!a.dialogue,projectiles:b.projectiles.length,active:pawn(u),heroes:b.units.filter(v=>v.side===0&&!v.summoned).map(pawn),
    escorts:b.units.filter(v=>v.honroAct5Escort).map(pawn),evacuated:m.evacuated??null,
    required:d.required.approach.map(id=>pawn(e.unit(id))),corridor:d.required.corridor.map(id=>pawn(e.unit(id))),
    rescue:d.sites.rescue,refuge:d.sites.refuge,holds:b.honroState.flags,shot:b.shot};
 };
 if(!duration)return record();
 const start=performance.now(),out=[];for(;;){
   out.push(record());if(performance.now()-start>=duration||out.length>=180||out.at(-1).phase==='lost')return out;
   await new Promise(requestAnimationFrame);
 }
}"""
def carry_rescue_to_first_escort(page,out,res,dump):
    # Only call immediately after integrated approach in this SAME page/session.
    approach=res.get('continuation',{})
    assert approach.get('passed') and approach.get('firstPhase',{}).get('objective')=='rescue'
    def get(duration=0):return page.evaluate(SNAP,{'duration':duration})
    initial=get()
    assert initial['stage']==42 and initial['origin']=='campaign' and initial['custom'] is False
    assert initial['step']==1 and initial['row'][:2]==['reach','rescue'] and initial['phase']!='lost'
    assert [r['id'] for r in initial['required']]==REQUIRED and all(r['dead'] and r['hp']==0 for r in initial['required'])
    assert set(r['id'] for r in initial['escorts'])==ESCORTS and all(r['hp']>0 and not r['dead'] for r in initial['escorts'])
    assert (initial['rescue']['x'],initial['rescue']['y'])==(2951.66,665)
    assert (initial['refuge']['x'],initial['refuge']['y'])==(3649.9,612)
    proof={'scope':'Natural rescue reach via normal MAIN movement and first actual NPC walking only, no cleared escort/corridor/drum/exit claim.',
       'passed':False,'initial':initial,'actions':[],'phase2Frames':[]}
    res['escortStart']=proof;dump()
    page.screenshot(path=str(out/'05-rescue-part2-start.png'))
    start=time.monotonic();spent_f=0
    basis={r['id']:r for r in initial['escorts']}
    def note(kind,**kw):proof['actions'].append(dict(kind=kind,**kw));dump()
    def verify(z):
        assert z['session']==initial['session'] and z['stage']==42 and z['origin']=='campaign' and z['custom'] is False
        assert z['step']>=1 and all(r['dead'] and r['hp']==0 for r in z['required'])
        if z['phase']=='lost':return False
        assert z['step']<=2 and set(r['id'] for r in z['escorts'])==ESCORTS
        return all(r['hp']>0 and not r['dead'] for r in z['escorts'])
    def advance_trial(maxms=16000):
        deadline=time.monotonic()+maxms/1000
        while time.monotonic()<deadline and time.monotonic()-start<95:
            z=get()
            if not verify(z) or (z['side']==0 and (z['dialogue'] or z['ready'])):return z
            page.wait_for_timeout(90)
        return get()
    def grounded_main(v):return v and not v['dead'] and not v['airborne'] and v['grounded'] and v['support']==MAIN
    def select_natural(z):
        same=[v for v in z['heroes'] if grounded_main(v) and (not v['acted'] or v['retreat']) and v['move']>=28]
        if not same:return z
        target=max(same,key=lambda r:r['x'])
        for _ in range(4):
            v=z['active']
            if v and v['id']==target['id']:return z
            if not z['ready'] or z['side']!=0 or z['dialogue'] or (v and v['retreat']):
                return z
            page.keyboard.press('Tab');page.wait_for_timeout(70)
            nxt=get();note('ordinary-Tab-selection',fromId=v['id'] if v else None,toId=nxt['active']['id'] if nxt['active'] else None)
            z=nxt
        return z
    def seek(z,target):
        who=z['active']['id'];d=1 if target>z['active']['x'] else -1
        key='KeyD' if d>0 else 'KeyA'
        args={'step':z['step'],'who':who,'target':target,'d':d}
        page.keyboard.down(key)
        try:page.wait_for_function("""({step,who,target,d})=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active;
             return b.honroState.act5.step!==step||a.dialogue||b.phase==='lost'||b.side!==0||!u||u.id!==who||
             !a.canInput()||u.moveLeft<=17||(u.x-target)*d>=0;}""",arg=args,timeout=3900,polling='raf')
        except Exception:pass
        finally:page.keyboard.up(key)
        post=get();note('ordinary-ground-input',key=key,target=target,before=z,after=post)
        return post
    for _ in range(19):
        if time.monotonic()-start>=95:break
        z=advance_trial()
        if not verify(z):break
        if z['step']==2:
            assert z['row'][:4]==['escort','refuge','곽진과 생존병 둘의 대피 엄호','corridor']
            if 'firstStep2' not in proof:
                proof['firstStep2']=z;page.screenshot(path=str(out/'06-natural-rescue-escort-unlocked.png'));dump()
            frames=get(1100)
            # Require a genuine monotonic multi-frame sequence on the authored MAIN tread,
            # not merely differing before/after screenshots or an actor spawn mutation.
            proof['phase2Frames'].append(frames);dump()
            for npc_id in ESCORTS:
                rr=[next(v for v in f['escorts'] if v['id']==npc_id) for f in frames if f['step']==2 and
                    any(v['id']==npc_id for v in f['escorts'])]
                seq=[r for r in rr if r['support']==MAIN and r['grounded'] and not r['dead']]
                if len(seq)>=6 and seq[-1]['x']-seq[0]['x']>=24 and all(y['x']>=x['x']-.05 and y['x']-x['x']<=25 for x,y in zip(seq,seq[1:])) and seq[-1]['x']>basis[npc_id]['x']+24:
                    proof.update(passed=True,firstNativeNPCMotion={'id':npc_id,'from':seq[0],'to':seq[-1]})
                    break
            if proof['passed']:
                proof['end']=get()
                assert verify(proof['end'])
                page.screenshot(path=str(out/'07-first-native-escort-motion.png'));dump();return
            z=get()
        if z['dialogue'] and z['side']==0:
            for _ in range(12):
                q=get()
                if not q['dialogue'] or q['side']!=0:break
                page.keyboard.press('Space');page.wait_for_timeout(100)
            note('native-visible-story-advance',state=get());continue
        if z['side']!=0 or not z['ready']:
            note('bounded wait failed; no enemy controls',state=z);break
        z=select_natural(z);actor=z['active']
        if not z['ready'] or z['side']!=0:continue
        if not grounded_main(actor) or actor['move']<26:
            if spent_f>=2:note('no eligible grounded controller budget',state=z);break
            before=z;page.keyboard.press('KeyF');spent_f+=1;page.wait_for_timeout(260)
            note('ordinary-stock-defend/retreat-finish',before=before,after=get());continue
        seek(z,2950 if z['step']==1 else min(3140,max(v['x'] for v in z['escorts'])+24))
    proof['end']=get();proof['why']='No witnessed safe natural rescue+first grounded escort motion inside bound';dump()
    page.screenshot(path=str(out/'08-first-escort-gap.png'))
    raise AssertionError(proof['why'])
