"""Same-round diagnostic: ordinary Mage movement clears a genuinely occupied S03 arc."""
PROBE="""()=>{
 const a=HonroApp,e=a.engine,b=e.b,k=e.unit('p-knight'),m=e.unit('p-mage'),t=e.unit('a5-foe-2'),s=HONRO_CORE.SKILLS.S03,
  main='MAIN_ESCORT_C_FULL';
 const support=v=>e.contactSurface(v.x,v.y-4,v.y+4)?.t.id??null;
 const z=v=>({id:v.id,x:v.x,y:v.y,h:v.h,r:v.r,hp:v.hp,dead:!!v.dead,acted:!!v.acted,move:v.moveLeft,
   grounded:e.grounded(v),owner:support(v),facing:v.facing});
 const out={round:b.round,side:b.side,step:b.honroState.act5.step,active:e.active?.id,ready:a.canInput(),knight:z(k),mage:z(m),target:z(t)};
 if(b.round<5)return {...out,reason:'rounds 1–4 preserve original deployment and proven #4 opportunity'};
 if(out.active!=='p-mage'||!out.ready||b.side!==0||out.step!==0||k.dead||k.acted||t.dead||m.dead||
    ![k,t,m].every(v=>e.grounded(v)&&support(v)===main))return {...out,reason:'required ready live same-MAIN fighters absent'};
 const approachSide=Math.sign(t.x-k.x),originalDX=t.x-k.x;
 if(!approachSide)return {...out,reason:'no separate Knight-to-target side'};
 // Predict the exact ordinary controller stop used by ground_s03.py, before
 // spending Mage movement. This creates JS values only; no actor writes.
 const stanceX=Math.abs(originalDX)>185?t.x-approachSide*148:k.x;
 const positive=(v,stop,permit)=>{let y=v.y;const dx=stop-v.x,n=Math.max(1,Math.ceil(Math.abs(dx)/10));
   for(let j=1;j<=n;j++){
    const x=v.x+dx*j/n,h=HonroMapEngine.surfaceY(b.terrain,x,y,main);
    if(!h||h.t.id!==main||Math.abs(h.y-y)>13||b.units.some(f=>f.side===1&&!f.dead&&!f.honroAct5Reserve&&f.id!==permit&&
      Math.abs(f.x-x)<f.r+v.r+12&&Math.abs(f.y-h.y)<Math.max(f.h,v.h)*.68))return null;
    y=h.y;
   }return {x:stop,y};};
 const stride=Math.abs(stanceX-k.x);
 if(stride>550||stride>k.moveLeft-145)return {...out,stride,reason:'ordinary Knight approach would be too far or exceed move budget'};
 const forecast=positive(k,stanceX,null);
 if(!forecast)return {...out,stride,reason:'Knight approach lacks continuous clear native MAIN support'};
 const p={x:forecast.x,y:forecast.y-k.h*.5},q={x:t.x,y:t.y-t.h*.5},dx=q.x-p.x,dy=q.y-p.y,
  d=Math.hypot(dx,dy),world=Math.atan2(dy,dx),goal=Math.atan2(-dy,Math.abs(dx))*180/Math.PI;
 out.projectedKnight={...forecast,stride,input:stride<1?'none':originalDX>0?'KeyD':'KeyA',noMutation:true};
 const delta=(i,j)=>Math.abs(Math.atan2(Math.sin(i-j),Math.cos(i-j)));
 const insideArc=v=>{
  for(const h of [.28,.5,.72]){
   const at={x:v.x,y:v.y-v.h*h},vx=at.x-p.x,vy=at.y-p.y,d=Math.hypot(vx,vy);
   if(d>260+v.r||e.collision(p,at,1,k.id,[],false))continue;
   if(d<40+v.r||delta(Math.atan2(vy,vx),world)<Math.PI*49/180+Math.asin(Math.min(1,(v.r+8)/Math.max(d,1))))return true;
  }return false;
 };
 const blockers=b.units.filter(v=>v.id!==k.id&&!v.dead&&v.side!==1&&insideArc(v)).map(v=>v.id);
 const blocked=e.collision(p,q,1,k.id,[],false);
 Object.assign(out,{distance:d,goal,blockers,solid:blockerId(blocked),dx});
 function blockerId(h){return h?.terrain?.id??h?.unit?.id??null;}
 if(s.mode!=='meleeWide'||s.radius!==180||blocked||goal< -24||goal>39||
    Math.abs(dx)<32||Math.abs(dx)>185||d>192||blockers.join()!=='p-mage')return {...out,reason:'not an otherwise-open Mage-only melee arc'};
 // The Mage exits along the opposite side of the Knight from the target.
 // Sample the actual authored tread and living hostile occupancy along the route.
 const sign=Math.sign(dx),dir=-sign,first=forecast.x+dir*Math.max(125,t.r+k.r+80),
    clearX=first+dir*30,found=[];
 const backOut=forecast.x+sign*(260+m.r+42);
 for(const stop of [clearX,first,clearX+dir*55,backOut,backOut+sign*45]){
  const span=Math.abs(stop-m.x);
  if(span<25||span>295||span>m.moveLeft-130||stop<0||stop>b.width )continue;
  const moveDir=Math.sign(stop-m.x);
  let y=m.y,good=true;
  const n=Math.ceil(span/10);
  for(let j=1;j<=n;j++){
   const x=m.x+(stop-m.x)*j/n,h=HonroMapEngine.surfaceY(b.terrain,x,y,main);
   if(!h||h.t.id!==main||Math.abs(h.y-y)>13){good=false;break;}
   if(b.units.some(v=>{
      if(v.side!==1||v.dead||v.honroAct5Reserve||Math.abs(v.x-x)>=v.r+m.r+12||
         Math.abs(v.y-h.y)>=Math.max(v.h,m.h)*.68)return false;
      // Some samples start already intersecting a hostile envelope. Permit
      // only egress moving strictly away from every such initial hostile;
      // never enter a fresh envelope or cross its center.
      const inOrigin=Math.abs(v.x-m.x)<v.r+m.r+12&&Math.abs(v.y-m.y)<Math.max(v.h,m.h)*.68;
      const leaving=(v.x-m.x)*moveDir<0&&Math.abs(v.x-x)>Math.abs(v.x-m.x);
      return !(inOrigin&&leaving);
   })){good=false;break;}
   y=h.y;
  }
  if(good&&!insideArc({...m,x:stop,y}))found.push({x:stop,y,dir:moveDir,span,noArc:true});
 }
 return {...out,candidate:found.sort((a,b)=>a.span-b.span)[0]??null,
    reason:found.length?'legal nearby real-tread screening clearance candidate':'no safe contiguous nearby escape from sweep'};
}"""
def clear_lane(page,proof,dump):
    pre=page.evaluate(PROBE)
    if pre['active']!='p-mage' or pre['round']<5:return
    events=proof.setdefault('mageArcClearance',[])
    if not pre.get('candidate'):
        if not any(x['round']==pre['round'] for x in events):events.append(dict(round=pre['round'],before=pre));dump()
        return
    if any(x['round']==pre['round'] for x in events):return
    row={'round':pre['round'],'before':pre,'success':False};events.append(row);dump()
    got=pre['candidate'];key='KeyD' if got['dir']>0 else 'KeyA'
    page.keyboard.down(key)
    try:page.wait_for_function("""({x,dir})=>{const a=HonroApp,e=a.engine,u=e.active;
      return u.id!=='p-mage'||!a.canInput()||!e.grounded(u)||u.moveLeft<120||
        e.contactSurface(u.x,u.y-4,u.y+4)?.t.id!=='MAIN_ESCORT_C_FULL'||(u.x-x)*dir>=0;}""",
      arg={'x':got['x'],'dir':got['dir']},polling='raf',timeout=1800)
    except Exception:pass
    finally:page.keyboard.up(key)
    post=page.evaluate(PROBE)
    row.update(key=key,after=post,success=post['round']==pre['round'] and post['active']=='p-mage' and post['ready'] and
        post['mage']['owner']=='MAIN_ESCORT_C_FULL' and post['mage']['grounded'] and
        abs(post['mage']['x']-pre['mage']['x'])>=25 and post.get('blockers')==[] and post.get('projectedKnight',{}).get('x')==pre['projectedKnight']['x'])
    dump()
