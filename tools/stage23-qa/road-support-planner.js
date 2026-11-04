// Evaluated as a function, never installed on the production App or Engine.
// Production aim/impact estimates on detached state, with no live writes.
// Some predictors internally fire/step isolated clones. Normalize their random
// inputs before Engine construction; these fixed streams are not mean damage.
async ({targetId = null, contextOnly = false, firstSearch = false, hopTargetId = null} = {}) => {
  // Port of road-follow-native targeting and hop proposals. Inputs still occur
  // outside this function through the UI. Production-visible is not viewport-only.
/** Test-controller targeting policy only. Read-only current observations, no future outcome search. */
function escortRelevant(V,b,hero,foe){
 const root=V.mem(b),goal=V.current(b),npc=b.units.find(u=>u.id==='act3-carrier');
 if(!root.carrierStarted||goal?.kind!=='escort'||!npc)return true;
 // A nearby body may obstruct the selected hero even when the porter is free.
 // This is a conservative proximity rule, not proof of every collision/line of fire.
 const bodyNear=Math.abs(foe.y-hero.y)<160&&Math.hypot(foe.x-hero.x,foe.y-hero.y)<hero.r+foe.r+100;
 if(root.carrierGoals?.['dock-exit'])return bodyNear||V.near(foe,V.marker(b,'dock-exit'),500);
 const close=b.honroReviewed23PacingCandidate?.id==='escort-close-130'&&b.honroReviewed23PacingCandidate.version===1;
 if(bodyNear||V.near(foe,npc,close?130:300))return true;
 if(close)return false;
 const points=b.honroMarkers.filter(p=>p.id.startsWith('route:'+goal.id+':')).sort((a,z)=>Number(a.id.split(':').at(-1))-Number(z.id.split(':').at(-1)));
 const index=root.escortWaypoints?.[goal.id+':act3-carrier']||0,p=points[index]||V.marker(b,goal.id);
 return !!p&&V.near(foe,p,300);
}

function segmentBox(a,z,r){
 let lo=0,hi=1;
 for(const axis of ['x','y']){
  const d=z[axis]-a[axis],min=axis==='x'?r.left:r.top,max=axis==='x'?r.right:r.bottom;
  if(Math.abs(d)<1e-9){if(a[axis]<min||a[axis]>max)return false;continue;}
  let x=(min-a[axis])/d,y=(max-a[axis])/d;if(x>y)[x,y]=[y,x];lo=Math.max(lo,x);hi=Math.min(hi,y);if(lo>hi)return false;
 }
 return hi>=0&&lo<=1;
}
function friendlyMuzzleObstruction(C,e,u,target){
 if(!u||!target||u.cls==='knight'||target.dead||target.hp<=0||u.moveLeft<20||!e.grounded(u))return null;
 const dx=target.x-u.x,dy=target.y-u.y;
 // Limit this extra action to the already-selected, nearby road threat.
 if(!dx||Math.abs(dx)>190||Math.abs(dy)>=220)return null;
 const end={x:target.x,y:target.y-target.h*.5};
 const angle=Math.atan2(u.y-u.h*.63-end.y,dx)*180/Math.PI;
 const skills=u.loadout.map(id=>C.SKILLS[id]).filter(s=>s&&s.damage>0&&!s.passive&&!s.martial&&e.skillAllowed(s,u)&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus);
 for(const skill of skills){
  const origin=e.projectileOrigin(u,skill,angle),radius=u.cls==='archer'?3:6;
  for(const ally of e.b.units){
   if(ally.id===u.id||ally.dead||ally.hp<=0||ally.eaterCapturedBy||ally.side===1)continue;
   const box={left:ally.x-ally.r-radius,right:ally.x+ally.r+radius,top:ally.y-ally.h-radius,bottom:ally.y+radius};
   const inside=origin.x>=box.left&&origin.x<=box.right&&origin.y>=box.top&&origin.y<=box.bottom;
   if(!inside&&!segmentBox(origin,end,box))continue;
   return {kind:inside?'muzzle-overlap':'straight-friendly-obstruction',ally:ally.id,skill:skill.id,target:target.id,direction:Math.sign(dx),distance:20,angle,origin,end,box,
    scope:'Trigger only. A straight-line obstruction is not a proof that every curved shot is blocked. Re-plan after ordinary movement.'};
  }
 }
 return null;
}

/** Read-only test-controller proposal; execution remains ordinary App jump/move. */
function hopApproach(C,e,u,target){
 if(!u||!target||target.dead||target.hp<=0||!e.grounded(u)||u.airborne||u.jumping)return null;
 const dx=target.x-u.x,dy=target.y-u.y;if(Math.abs(dx)>190||Math.abs(dy)>160)return null;
 const upper=dy<=-80,obstruction=upper?null:friendlyMuzzleObstruction(C,e,u,target);
 if(!upper&&!obstruction)return null;
 const direction=Math.sign(dx)||1,clearance=u.r+target.r+40,travel=Math.min(280,Math.abs(dx)+clearance),cost=e.jumpCost(u);
 if(u.moveLeft<cost+travel+50)return null;
 return {kind:upper?'near-upper-platform':'near-friendly-obstruction',target:target.id,direction,targetX:u.x+direction*travel,requestedHorizontalTravel:travel,jumpCost:cost,obstruction,
  scope:'One ordinary jump, bounded horizontal input, wait for actual landing and re-aim. Not a predicted successful route or shot.'};
}

  const C = HONRO_CORE, V = HonroAct23V4, original = HonroApp.engine.b;
  const before = JSON.stringify(original), b = JSON.parse(before);
  // Same predeclared independent estimation streams as independent-planning.mjs.
  // Actual wind and currently observed positions/HP remain; actual future rolls do not.
  const estimateRandom = {rng:0x13579bdf, damageSeed:0x2468ace0, damageIndex:0};
  b.rng = estimateRandom.rng;
  b.damageSequence = {version:1, seed:estimateRandom.damageSeed, index:estimateRandom.damageIndex};
  const e = new C.Engine(b, () => {}, true), u = e.active;
  const n = e.unit('act3-carrier'), goal = V.current(b);
  const contour = [[0,4250],[1050,4250],[1600,4530],[1940,4700],[2600,4700],[3400,5100],[3980,5100],[4360,4940],[5050,4480],[5375,4350],[5950,4350],[6550,4620],[7250,4620],[8120,4400],[8620,4170],[9800,4170]];
  const roadY = x => {x = Math.max(0, Math.min(9800, x)); for(let i=1;i<contour.length;i++){const a=contour[i-1],z=contour[i];if(x<=z[0])return a[1]+(z[1]-a[1])*(x-a[0])/(z[0]-a[0]);}};
  const distance = (a,z) => Math.hypot(a.x-z.x,a.y-z.y);
  const started = !!b.honroState?.act23v4?.carrierStarted;
  const visible = e.alive(1).filter(t => !t.honroObjectiveTarget && (HonroAct3.visible?.(b,t) ?? true));
  const relevant = visible.filter(t => escortRelevant(V,b,u,t));
  const foes = relevant.filter(t => !started || t.x >= n.x-550);
  const priority = t => distance(t,n)<600 || t.x>=n.x-250 && t.x<n.x+900 && Math.abs(t.y-roadY(t.x))<270;
  foes.sort((a,z) => Number(priority(z))-Number(priority(a)) || distance(a,u)-distance(z,u));
  const threat = foes.find(t => priority(t) && distance(t,u)<2500);
  const targets = targetId ? foes.filter(t=>t.id===targetId) : foes.filter(t=>distance(t,u)<1400&&(priority(t)||distance(t,u)<(firstSearch?500:550))).slice(0,3);
  const result = {estimateRandom, actor:u.id, selectionScope:'production-visible, objective-relevant, rear550; not viewport-only', goal:goal?{id:goal.id,kind:goal.kind}:null,
    started, blocked:HonroAct23V4Chapter23Facts.blocked(b), roadY:roadY(u.x),
    canDrop:e.canDrop(u), canJump:e.grounded(u)&&u.moveLeft>=e.jumpCost(u),
    hop:hopApproach(C,e,u,hopTargetId?foes.find(t=>t.id===hopTargetId):threat),
    skippedObjective:visible.filter(t=>!escortRelevant(V,b,u,t)).map(t=>t.id),
    nearBodies:visible.filter(t=>distance(t,u)<u.r+t.r+100&&Math.abs(t.y-u.y)<160).map(t=>t.id),
    visibleFoes:foes.map(t=>({id:t.id,x:t.x,y:t.y,hp:t.hp,priority:priority(t)})),
    skippedRear:visible.filter(t=>started&&t.x<n.x-550).map(t=>t.id),
    threat:threat?{id:threat.id,x:threat.x,y:threat.y}:null, plan:null};
  if(!contextOnly){
    outer:for(const target of targets){
    const spirit=target.honroSpirit&&!target.manifested;
    const skills=u.loadout.map(id=>C.SKILLS[id]).filter(s=>s&&s.damage>0&&!s.passive&&e.skillAllowed(s,u)&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus).sort((a,z)=>(spirit?Number(z.id==='O08')-Number(a.id==='O08'):0)||z.damage-a.damage);
    for(const skill of skills){
      let best=null;
      if(skill.martial&&skill.branch==='sword'){
        let angle=Math.atan2(u.y-u.h*.58-(target.y-target.h*.5),target.x-u.x)*180/Math.PI;if(angle<-90)angle+=360;
        for(const power of [1,.7,.2,0]){
          if(e.manaCost(skill,u,power)>u.focus)continue;
          const hits=visible.filter(t=>C.meleeContains(e,u,t,C.meleeRange(u,skill,power),-angle*Math.PI/180,C.meleeSpan(u,skill,power)));
          if(!hits.some(t=>t.id===target.id))continue;
          const net=hits.reduce((sum,t)=>sum+Math.min(t.hp,e.effective(skill,u).damage),0);
          if(!best||net>best.net)best={angle,power,net,risk:null,method:'production melee geometry over production-visible collateral',predictedTargets:hits.map(t=>t.id)};
        }
      }else{
        const consider=aim=>{const angle=((aim.angle+85)%360+360)%360-85;if(angle>265)return;const v=C.shotViable(e,u,skill,target,angle,aim.power);
          if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,skill.radius+target.r+55)&&(!best||v.net>best.net))best={...aim,angle,net:v.net,risk:v.risk,miss:v.miss,method:'production impact estimate with independent random inputs'};};
        for(const aim of e.shotSeeds(u,skill,target))consider(aim);
        if(!best&&skill===skills[0]){const direct=Math.atan2(u.y-u.h*.6-(target.y-target.h*.5),target.x-u.x)*180/Math.PI;for(const angle of [direct,...(target.x>=u.x?[25,45,65,80]:[100,115,135,155])])for(const power of [1,.6])consider({angle,power});}
      }
      if(best){result.plan={actor:u.id,target:target.id,targetHp:target.hp,skill:skill.id,...best,angle:((best.angle+85)%360+360)%360-85,chargeDuration:e.chargeDuration(u,skill)};break outer;}
    }
    }
  }
  const after=JSON.stringify(original);
  if(after!==before)throw Error('Detached planning mutated the live battle');
  const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(x=>x.toString(16).padStart(2,'0')).join('');
  result.liveBeforeSha256=await hash(before);result.liveAfterSha256=await hash(after);
  return result;
}
