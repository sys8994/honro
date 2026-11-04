// Evaluated as a function, never installed on the production App or Engine.
// Production aim/impact estimates on detached state, with no live writes.
// Some predictors internally fire/step isolated clones. Normalize their random
// inputs before Engine construction; these fixed streams are not mean damage.
async ({targetId = null, contextOnly = false} = {}) => {
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
  const foes = visible.filter(t => !started || t.x >= n.x-550);
  const priority = t => distance(t,n)<600 || t.x>=n.x-250 && t.x<n.x+900 && Math.abs(t.y-roadY(t.x))<270;
  foes.sort((a,z) => Number(priority(z))-Number(priority(a)) || distance(a,u)-distance(z,u));
  const threat = foes.find(t => priority(t) && distance(t,u)<2500);
  const targets = targetId ? foes.filter(t=>t.id===targetId) : foes.filter(t=>distance(t,u)<1400&&(priority(t)||distance(t,u)<550)).slice(0,3);
  const result = {estimateRandom, actor:u.id, goal:goal?{id:goal.id,kind:goal.kind}:null,
    started, blocked:HonroAct23V4Chapter23Facts.blocked(b), roadY:roadY(u.x),
    canDrop:e.canDrop(u), canJump:e.grounded(u)&&u.moveLeft>=e.jumpCost(u),
    nearBodies:visible.filter(t=>distance(t,u)<u.r+t.r+100&&Math.abs(t.y-u.y)<160).map(t=>t.id),
    visibleFoes:foes.map(t=>({id:t.id,x:t.x,y:t.y,hp:t.hp,priority:priority(t)})),
    skippedRear:visible.filter(t=>started&&t.x<n.x-550).map(t=>t.id),
    threat:threat?{id:threat.id,x:threat.x,y:threat.y}:null, plan:null};
  if(!contextOnly){
    const skills=u.loadout.map(id=>C.SKILLS[id]).filter(s=>s&&s.damage>0&&!s.passive&&e.skillAllowed(s,u)&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus).sort((a,z)=>z.damage-a.damage);
    outer:for(const target of targets)for(const skill of skills){
      let best=null;
      if(skill.martial&&skill.branch==='sword'){
        let angle=Math.atan2(u.y-u.h*.58-(target.y-target.h*.5),target.x-u.x)*180/Math.PI;if(angle<-90)angle+=360;
        for(const power of [1,.7,.2,0]){
          if(e.manaCost(skill,u,power)>u.focus)continue;
          const hits=foes.filter(t=>C.meleeContains(e,u,t,C.meleeRange(u,skill,power),-angle*Math.PI/180,C.meleeSpan(u,skill,power)));
          if(!hits.some(t=>t.id===target.id))continue;
          const net=hits.reduce((sum,t)=>sum+Math.min(t.hp,e.effective(skill,u).damage),0);
          if(!best||net>best.net)best={angle,power,net,risk:null,method:'production melee geometry',predictedTargets:hits.map(t=>t.id)};
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
  const after=JSON.stringify(original);
  if(after!==before)throw Error('Detached planning mutated the live battle');
  const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(x=>x.toString(16).padStart(2,'0')).join('');
  result.liveBeforeSha256=await hash(before);result.liveAfterSha256=await hash(after);
  return result;
}
