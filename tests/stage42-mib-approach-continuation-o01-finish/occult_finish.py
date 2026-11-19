"""Real same-round O01 attempt following a naturally credited S03 on required foe2."""
import time
READ="""()=>{
 const a=HonroApp,e=a.engine,b=e.b,u=e.active,t=e.unit('a5-foe-2');
 const pawn=v=>v?{id:v.id,x:v.x,y:v.y,h:v.h,r:v.r,hp:v.hp,dead:!!v.dead,damageByOccultist:v.damageBy?.['p-occultist']??0,
    facing:v.facing,grounded:e.grounded(v),move:v.moveLeft,support:e.contactSurface(v.x,v.y-4,v.y+4)?.t.id??null}:null;
 return {phase:b.phase,side:b.side,round:b.round,step:b.honroState.act5.step,shot:b.shot,ready:!!a.canInput(),
     active:pawn(u),foe:pawn(t),selected:a.selected,aim:u?a.displayAngle(u):null,
     escorts:b.units.filter(v=>v.honroAct5Escort).map(pawn),
     projectiles:b.projectiles.filter(p=>p.owner==='p-occultist'&&p.skill==='O01').map(p=>({id:p.id,shot:p.shot,x:p.x,y:p.y}))};}"""
PLAN="""({aim=null,power=null})=>{
 const a=HonroApp,e=a.engine,b=e.b,u=e.active,t=e.unit('a5-foe-2'),s=HONRO_CORE.SKILLS.O01;
 if(u.id!=='p-occultist'||u.facing>=0||!(t.x<u.x-32)||!a.canInput()||!e.grounded(u)||!e.grounded(t)||t.dead||
    s.mode!=='spiritBolt'||!u.loadout.includes('O01')||!e.skillAllowed(s,u)||!e.canAfford(s,u,1)||e.cooldownLeft(u,'O01'))
    return {ok:false,reason:'Exact live basic spiritBolt unavailable, wrong side, or not grounded'};
 const allies=b.units.filter(v=>v.id!==u.id&&!v.dead&&v.side!==1);
 const snap=()=>JSON.stringify([b.units,b.terrain,b.projectiles,b.phase,b.active,b.shot,b.honroState]), before=snap();
 const eRadius=e.effective(s,u).radius, obstructions={actors:{},terrains:{},blastFriends:{},noTerminalOwner:0};
 const count=(dest,key)=>dest[key]=(dest[key]??0)+1;
 const check=(ang,p)=>{
   if(p<.33||p>.99||ang< -50||ang>77)return null;
   const q=e.predict(u,s,180-ang,p,undefined,false,false);
   if(q.unit!==t.id||![q.x,q.y].every(Number.isFinite)){if(q.unit)count(obstructions.actors,q.unit);else if(q.terrain)count(obstructions.terrains,q.terrain);else obstructions.noTerminalOwner++;return null;}
   const occludedFriends=allies.filter(v=>{
      const dx=q.x-v.x,dy=q.y-(v.y-v.h*.50),dist=Math.hypot(dx,dy),body=Math.hypot(v.r,v.h*.5);
      return dist<=eRadius+body+30;
   }).map(v=>v.id);
   if(occludedFriends.length){for(const v of occludedFriends)count(obstructions.blastFriends,v);return null;}
   return {x:q.x,y:q.y,id:q.unit,blastRadius:eRadius};
 };
 try{
   const robust=(q,r)=>check(q,r)&&[[q-.8,r],[q+.8,r],[q,r-.022],[q,r+.022]].every(([x,y])=>check(x,y));
   if(aim!==null&&power!==null)return {ok:!!robust(aim,power),angle:aim,power,hit:check(aim,power),chargeDuration:e.chargeDuration(u,s),obstructions};
   const desired=Math.atan2((u.y-u.h*.5)-(t.y-t.h*.5),u.x-t.x)*180/Math.PI,angles=[0,9,17,25,-8,-16,32,40,47,58].map(x=>Math.max(-46,Math.min(76,Math.round(desired+x))));
   let tried=0;for(const p of [.53,.61,.68,.45,.76,.85,.38])for(const q of angles){
     tried++;if(robust(q,p))return {ok:true,angle:q,power:p,hit:check(q,p),tried,chargeDuration:e.chargeDuration(u,s),obstructions};
   }
   return {ok:false,tried,desired,blastRadius:eRadius,obstructions,reason:'No robust native direct path that clears Knight and enlarged friendly blast envelope'};
 }finally{if(snap()!==before)throw Error('O01 stock predictor wrote battle state');}
}"""
def watch(page,out,proof,dump):
    if 'occultFinish' in proof:return False
    hit=next((r for r in proof.get('skillTrials',{}).get('S03',{}).get('attempts',[]) if r.get('target')=='a5-foe-2' and r.get('nativeHit')),None)
    if not hit:return False
    def read():return page.evaluate(READ)
    z=read();u=z['active'];t=z['foe']
    if z['step']!=0 or z['side']!=0 or not z['ready'] or u['id']!='p-occultist':return False
    record=dict(before=z,referenceR8={'run':44582652806,'remainingHP':167,'soldierOneHP':58,'targetX':772.82,'knightX':908.16},
        s03sameRound=hit['before']['round']==z['round'],passed=False,controls=[],plans=[])
    proof['occultFinish']=record;dump()
    def pulse(key,ms):
        page.keyboard.down(key)
        try:page.wait_for_timeout(ms)
        finally:page.keyboard.up(key)
    def move(dest):
        z=read()
        if not z['ready'] or z['active']['id']!='p-occultist' or z['active']['move']<=125: return
        before=z['active']['x'];page.keyboard.down('KeyA')
        try:page.wait_for_function("""x=>{const a=HonroApp,u=a.engine.active;
             return u.id!=='p-occultist'||u.x<=x||u.moveLeft<=100||!a.canInput();}""",
             arg=dest,polling='raf',timeout=1300)
        except Exception:pass
        finally:page.keyboard.up('KeyA')
        z=read();record['controls'].append(dict(kind='ordinary-A-reposition',before=before,after=z['active']['x']));dump()
    if not (record['s03sameRound'] and (t['hp']>0 and t['hp']<=220) and 185<u['x']-t['x']<750 and
            not t['dead'] and t['grounded'] and u['grounded'] and u['support']==t['support']=='MAIN_ESCORT_C_FULL' and
            len(z['escorts'])==3 and all(v['hp']>0 and not v['dead'] for v in z['escorts'])):
        record['reason']='No weak grounded same-round foe2 at legitimate controller; no attempt';dump();return True
    if u['facing']>=0:pulse('KeyA',38)
    z=read()
    if z['selected']!='O01':
        page.keyboard.press('Digit1')
    if read()['selected']!='O01':record['reason']='O01 not selected via native slot';dump();return True
    plan=None
    for n in range(3):
        z=read();u=z['active'];t=z['foe']
        if u['id']!='p-occultist' or not z['ready'] or u['support']!='MAIN_ESCORT_C_FULL':break
        plan=page.evaluate(PLAN,{})
        record['plans'].append(dict(actor=u,target=t,result=plan));dump()
        if plan['ok']:break
        dest=max(t['x']+220,u['x']-(70 if n==0 else 120))
        if dest>u['x']-31 or n==2:break
        move(dest)
    if not plan or not plan['ok']:
        record['reason']='No robust friendly-safe O01 route while Knight screening, no shot';dump();return True
    for _ in range(13):
        z=read();err=plan['angle']-z['aim']
        if not z['ready'] or z['active']['id']!='p-occultist' or z['selected']!='O01':break
        if abs(err)<=.85:break
        pulse('ArrowUp' if err>0 else 'ArrowDown',max(12,min(300,round(abs(err)/62*940))))
    before=read()
    confirm=page.evaluate(PLAN,{'aim':before['aim'],'power':plan['power']})
    record['confirm']=confirm;dump()
    if not confirm['ok']:record['reason']='Actual HUD angle failed safe robust verification';dump();return True
    page.screenshot(path=str(out/'07-urgent-occultist-O01-before.png'))
    page.keyboard.down('Space')
    try:
        charge=page.evaluate("""p=>new Promise(resolve=>{const s=performance.now();
         function tick(){const a=HonroApp,v=a.charging?a.chargePower():null;
           if(v!==null&&v>=p)return resolve({ok:true,measured:v});
           if(performance.now()-s>3200)return resolve({ok:false,measured:v});
           requestAnimationFrame(tick);}requestAnimationFrame(tick);})""",max(.36,plan['power']-.0275/confirm['chargeDuration']))
        record['charge']=charge
        if not charge['ok'] or abs(charge['measured']-plan['power'])>.034:page.keyboard.press('Escape')
    finally:page.keyboard.up('Space')
    deadline=time.monotonic()+8;flight=False;first_death=None;record['frames']=[]
    while time.monotonic()<deadline:
        q=read();r=q['foe'];g=any(p['shot']==before['shot']+1 for p in q['projectiles'])
        record['frames'].append(dict(shot=q['shot'],phase=q['phase'],side=q['side'],hp=r['hp'],own=r['damageByOccultist'],projectiles=q['projectiles']))
        if g and not flight:
            page.screenshot(path=str(out/'08-urgent-occultist-O01-flight.png'));flight=True
        if r['hp']==0 and r['dead'] and first_death is None:first_death=q
        if q['side']==1 or q['phase']=='lost' or (q['shot']>before['shot'] and q['phase'] in ('review','ally','transition','aim') and not q['projectiles']):break
        page.wait_for_timeout(22)
    settled=q
    q=first_death or settled;actual=q['foe']
    record.update(after=q,settled=settled,nativeOwnProjectile=flight,ownDamage=actual['damageByOccultist']-before['foe']['damageByOccultist'],
                  priorHP=before['foe']['hp'],actualHP=actual['hp'],targetDefeated=actual['dead'],
                  sameRound=q['round']==before['round'],beforeEnemy=q['side']==0,
                  allEscortAlive=len(q['escorts'])==3 and all(v['hp']>0 and not v['dead'] for v in q['escorts']))
    record['passed']=bool(flight and record['ownDamage']>0 and actual['hp']==0 and actual['dead'] and
         record['sameRound'] and record['beforeEnemy'] and record['allEscortAlive'] and q['shot']==before['shot']+1)
    page.screenshot(path=str(out/'09-urgent-occultist-O01-result.png'));dump()
    return True
