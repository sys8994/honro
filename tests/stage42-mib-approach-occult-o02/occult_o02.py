"""One genuine stock O02 cast after actual required #2 defeat. No state writes."""
import time

PROBE=r"""({mode, angle, power})=>{
 const a=HonroApp,e=a.engine,b=e.b,u=e.active,s=HONRO_CORE.SKILLS.O02;
 const id='p-occultist', tid='a5-foe-3', es=['a5-gwak','a5-soldier-one','a5-soldier-two'];
 const alive=v=>v&&!v.dead&&v.hp>0;
 const t=b.units.find(v=>v.id===tid), two=b.units.find(v=>v.id==='a5-foe-2');
 const friends=b.units.filter(v=>v.side!==1&&alive(v)), escorts=es.map(id=>friends.find(v=>v.id===id&&v.side===2));
 const actor=v=>({id:v.id,hp:v.hp,x:v.x,y:v.y,vy:v.vy,own:v.damageBy?.[id]??0});
 if(location.hostname!=='127.0.0.1'&&location.hostname!=='localhost')throw Error('Only disposable localhost');
 if(b.honroStage!==42||b.honroCustom||b.honroMapOrigin!=='campaign')throw Error('Wrong campaign fixture');
 if(u?.id!==id||b.side!==0||b.phase!=='aim'||![7,8].includes(b.round)||b.honroState.act5.step!==0||
    !a.canInput()||a.dialogue||u.acted||u.retreat||!e.grounded(u)||b.projectiles.length||
    !two||!two.dead||two.hp>0||!escorts.every(alive)||!alive(t)||t.side!==1||t.honroAct5Reserve||
    u.loadout[2]!=='O02'||s.phase!=='all'||s.mode!=='phaseWraith'||!e.skillAllowed(s,u)||e.cooldownLeft(u,s.id))
   return {ok:false,reason:'stock state/escorts/target/cooldown/skill not eligible'};
 if((t.x-u.x)*u.facing<=u.r+t.r)return {ok:false,reason:'no forward body separation'};
 const cv=a.scene.canvas.getBoundingClientRect(),z=a.scene.scale;
 if(!Number.isFinite(z)||z<=0||Math.abs(t.x-a.scene.x)*z>=cv.width/2-22||
    Math.abs(t.y-t.h*.5-a.scene.y)*z>=cv.height/2-22)return {ok:false,reason:'target outside native camera'};
 const fingerprint=()=>JSON.stringify([b.units,b.projectiles,b.terrain,b.honroState,b.active,b.shot,b.phase,b.wind]);
 const start=fingerprint(), blast=e.effective(s,u).radius, duration=e.chargeDuration(u,s);
 const check=(ang,p)=>{
   if(ang< -45||ang>82||p<.40||p>.92||!e.canAfford(s,u,p))return null;
   const q=e.predict(u,s,u.facing>=0?ang:180-ang,p,undefined,true,false);
   if(!Number.isFinite(q.x)||!Number.isFinite(q.y)||!q.points.length)return null;
   const world=u.facing>=0?ang:180-ang;
   const points=[e.projectileOrigin(u,s,world),...q.points,{x:q.x,y:q.y}], end=points.at(-1);
   // Stock live sweep is projectile radius + 2 (8 here). Add safety margin
   // for sampled curvature, actor drift and release quantization; test last leg too.
   const contact=(v,r)=>points.some((x,i)=>i>0&&e.damageSweep(v,points[i-1],x,r));
   if(!contact(t,8))return null;
   // Use both the real stock receiving sets and a broader point-to-body guard.
   // Self is ignored only for swept damage, never the terminal blast.
   const zone=[...e.blastUnitTargets(end.x,end.y,blast+38,id,false)];
   if(zone.some(k=>k.unit.side!==1)||friends.some(v=>
      (v.id!==id&&contact(v,36))||e.damageSweep(v,end,{x:end.x+.001,y:end.y},blast+38)))return null;
   return {endpoint:end,pointCount:points.length,targetBody:actor(t),blast};
 };
 const robust=(ang,p,d,pad)=>{
   const center=check(ang,p);if(!center)return null;
   for(const aa of [-d,0,d])for(const pp of [-pad,0,pad])
     if((aa||pp)&&!check(ang+aa,p+pp))return null;
   return center;
 };
 try{
   const record=(ang,p,hit)=>({ok:true,actor:id,target:tid,round:b.round,shot:b.shot,
     angle:ang,power:p,duration,forecast:hit,escorts:escorts.map(actor),preFriends:friends.map(actor),
     nativeDrawAngle:a.displayAngle(u),source:actor(u),skill:s.id});
   if(mode==='confirm'){
     if(a.selected!==s.id||b.shot==null)return {ok:false,reason:'stock selected O02 or stock shot counter not observed'};
     const h=robust(angle,power,1,.036);return h?record(angle,power,h):{ok:false,reason:'sweep/grounded ally safety envelope no longer stable'};
   }
   if(mode!=='plan')throw Error('unsupported O02 probe');
   const base=Math.atan2((u.y-u.h*.62)-(t.y-t.h*.5),Math.abs(t.x-u.x))*180/Math.PI;
   const seen=new Set();
   for(const da of [0,4,8,12,-4,-8,16,20,-12,24,-16])
    for(const p of [.46,.50,.54,.58,.62,.66,.71,.76,.81,.86,.90,.42]){
     const ang=Math.round(base+da);
     if(seen.has(ang+'/'+p))continue;seen.add(ang+'/'+p);
     const h=robust(ang,p,1.5,.04);if(h)return record(ang,p,h);
    }
   return {ok:false,reason:'no bounded robust native O02 sweep with strict friendly and escort safety',tried:seen.size,source:actor(u),target:actor(t)};
 }finally{if(fingerprint()!==start)throw Error('Native read-only prediction changed live state');}
}"""

WATCH=r"""({shot})=>{
 const a=HonroApp,e=a.engine,b=e.b,u=e.active,id='p-occultist',tid='a5-foe-3';
 return {shot:b.shot,round:b.round,step:b.honroState.act5.step,phase:b.phase,actor:u?.id,
  projectiles:b.projectiles.map(p=>({owner:p.owner,skill:p.skill,shot:p.shot,id:p.id,hit:[...(p.hit??[])]})),
  friends:b.units.filter(v=>v.side!==1).map(v=>({id:v.id,hp:v.hp,dead:v.dead})),
  target:b.units.filter(v=>v.id===tid).map(v=>({hp:v.hp,dead:v.dead,own:v.damageBy?.[id]??0}))[0],
  launch:b.lastShots?.[id]?.skill??null};
}"""

def note(page,out,proof,dump,state):
    if (state['active']!='p-occultist' or state['round'] not in (7,8) or
        state['step']!=0 or not proof.get('foe2DeadWhileEscortsAlive')):
        return False
    tr=proof.setdefault('skillTrials',{}).setdefault('O02',{'attempts':[],'releasedCount':0,'ownedHits':[]})
    if tr.get('chargeAttempts') or any(x['round']==state['round'] for x in tr['attempts']):
        return False
    read=lambda mode,**k:page.evaluate(PROBE,dict(mode=mode,**k))
    row={'round':state['round'],'plan':read('plan')};tr['attempts'].append(row);dump()
    p=row['plan']
    if not p['ok']:return False
    page.keyboard.press('Digit3')
    for _ in range(13):
        st=page.evaluate("()=>{const a=HonroApp,e=a.engine;return [e.active.id,a.selected,a.displayAngle(e.active),a.canInput()];}")
        d=p['angle']-st[2]
        if st[0]!='p-occultist' or st[1]!='O02' or not st[3]:return False
        if abs(d)<=.9:break
        key='ArrowUp' if d>0 else 'ArrowDown'
        page.keyboard.down(key)
        try:page.wait_for_timeout(max(14,min(300,round(abs(d)/62*950))))
        finally:page.keyboard.up(key)
    current=page.evaluate('()=>HonroApp.displayAngle(HonroApp.engine.active)')
    c=row['confirm']=read('confirm',angle=current,power=p['power']);dump()
    if not c['ok'] or abs(current-p['angle'])>1.5 or not .15<c['duration']<10:return False
    before=page.evaluate(WATCH,dict(shot=c['shot']))
    row['before']=before;dump()
    page.screenshot(path=str(out/'09-occult-O02-before-native-release.png'))
    c=read('confirm',angle=current,power=p['power'])
    if not c['ok'] or c['shot']!=before['shot'] or c['round']!=row['round']:return False
    tr['chargeAttempts']=1  # Reserve the sole ordinary charge attempt even if it cancels.
    page.keyboard.down('Space')
    try:
        q=page.evaluate(r"""({p,shot})=>new Promise(resolve=>{
          const stamp=performance.now();
          function frame(){
            const a=HonroApp,e=a.engine,b=e.b, q=a.charging?a.chargePower():null;
            if(e.active?.id!=='p-occultist'||b.shot!==shot||b.phase!=='aim'||a.selected!=='O02'||a.dialogue)
               return resolve({ok:false,q,reason:'native charge context drift'});
            if(q!==null&&q>=p)return resolve({ok:true,q});
            if(performance.now()-stamp>3000)return resolve({ok:false,q,reason:'native HUD charge deadline'});
            requestAnimationFrame(frame);
          }requestAnimationFrame(frame);
        })""",dict(p=max(.36,p['power']-.024/c['duration']),shot=c['shot']))
        row['charge']=q
        if not q['ok'] or abs(q['q']-p['power'])>.028:
            page.keyboard.press('Escape');dump();return True
        tr['releasedCount']=1
    finally:page.keyboard.up('Space')
    # Browser RAF reads only; qualifying HP/owner changes must be on one stock frame.
    frames=page.evaluate(r"""({fn,prior})=>new Promise(resolve=>{
       const read=eval(fn), out=[], start=performance.now();
       let old=prior,seen=false;
       function frame(){
         const v=read({shot:prior.shot}), exact=v.projectiles.filter(p=>
           p.owner==='p-occultist'&&p.skill==='O02'&&p.shot===prior.shot+1);
         seen||=exact.length>0;
         const delta=old.target.hp-v.target.hp, own=v.target.own-old.target.own;
         const changed=v.friends.filter(f=>{const t=old.friends.find(o=>o.id===f.id);return t&&f.hp<t.hp;});
         if(exact.length||delta||own||changed.length||v.phase!==old.phase)
           out.push({frame:out.length,shot:v.shot,launch:v.launch,exact,delta,own,changed,target:v.target,friends:v.friends});
         old=v;
         if(performance.now()-start>=4400||v.step>0||v.phase==='lost'||(seen&&!exact.length&&v.phase==='aim'))return resolve(out);
         requestAnimationFrame(frame);
       }requestAnimationFrame(frame);
    })""",dict(fn=WATCH,prior=before))
    row['frames']=frames
    byShot=next((f for f in frames if f['exact']),None)
    all_safe=all(not f['changed'] for f in frames)
    credited=next((f for f in frames if byShot and f['frame']>=byShot['frame'] and f['shot']==before['shot']+1 and
         f['launch']=='O02' and f['delta']>0 and f['own']>0 and all(
         any(v['id']==i and v['hp']>0 and not v['dead'] for v in f['friends'])
         for i in ('a5-gwak','a5-soldier-one','a5-soldier-two'))),None)
    row['allFriendsUndamagedObserved']=all_safe
    if credited and all_safe:
        tr['ownedHits'].append(credited)
        page.screenshot(path=str(out/'09-occult-O02-after-native-damage.png'))
    dump()
    return True
