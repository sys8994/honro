// Observe the game; never write a unit, projectile, timer or save field.
const poseClamp=x=>Math.max(0,Math.min(1,x));
const poseLerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
// Two steps per cycle, measured in real presentation time, independent of fast-forward.
// See game/docs/BUG_LOG.md HBUG-017 for the cadence reference and map-scale tradeoff.
export const WALK_CADENCE={seol_o:132,damheo:120,hwigyeom:128,sodan:122};
export function resolveRebuildCharacter(u){
  if(!u)return null;
  if(u.side===0)return {archer:'seol_o',mage:'damheo',knight:'hwigyeom',occultist:'sodan'}[u.cls]||null;
  const named={'설오':'seol_o','담허':'damheo','휘겸':'hwigyeom','소단':'sodan'}[u.name]||null;
  if(named&&(u.honroAlly||u.honroCivilian||u.id==='boss'))return named;
  return null;
}
export class HonroPoseVisual{
  constructor(asset,api){
    this.asset=asset;this.api=api;this.renderer=api.createCanvasRenderer(asset);this.states=new WeakMap();this.time=0;
    this.by=Object.fromEntries(asset.rig.parts.map(p=>[p.id,p]));
    this.ready=api.completePose(asset,asset.animation.animations.attack.keyframes[0]);
    this.loaded=api.completePose(asset,asset.animation.animations.attack.keyframes[2]);
    this.armLengths={};for(const side of ['rear','front']){const [a,b,c]=['_upper_arm','_forearm','_hand'].map(k=>this.by[side+k].pivot);this.armLengths[side]=Math.hypot(b[0]-a[0],b[1]-a[1])+Math.hypot(c[0]-b[0],c[1]-b[1]);}
  }
  state(u){
    if(!this.states.has(u))this.states.set(u,{releaseAt:-Infinity,hitAt:-Infinity,lastAnim:0,lastHurt:0,chargeAt:null,mode:'idle',draws:0,raise:0,draw:0,lastTargets:null,releaseFrom:null,settleAt:-Infinity,settleFrom:null,riseSpeed:0,wasAirborne:false});
    return this.states.get(u);
  }
  update(engine,time,walkDt=Math.max(0,time-this.time)){
    const simulationDt=Math.max(0,time-this.time);this.time=time;
    for(const u of engine.b.units){
      if(resolveRebuildCharacter(u)!==this.asset.character_id)continue;
      const s=this.state(u);
      const distance=Math.max(0,(u.walkPhase||0)-(s.lastWalk??(u.walkPhase||0)))/.038;
      s.lastWalk=u.walkPhase||0;s.walkCycle??=0;
      const effort=Math.min(1,distance/Math.max(.001,(u.walkSpeed||330)*simulationDt));
      if(!u.jumping&&!u.airborne&&Math.abs(u.vy||0)<3)s.walkCycle=(s.walkCycle+Math.min(.1,Math.max(0,walkDt))*effort*WALK_CADENCE[this.asset.character_id]/120)%1;
      if((u.anim||0)>s.lastAnim+.05){s.releaseAt=time;s.releaseFrom=s.mode==='charge'&&s.lastTargets?structuredClone(s.lastTargets):null;s.worldEffect=(engine.b.projectiles||[]).some(q=>q.owner===u.id&&!q.dead&&((this.asset.character_id==='sodan'&&q.skill==='O01')||(this.asset.character_id==='damheo'&&q.skill==='M01')));}
      if((u.hurt||0)>s.lastHurt+.05)s.hitAt=time;
      s.lastAnim=u.anim||0;s.lastHurt=u.hurt||0;
    }
  }
  aimTargets(target,u,strength=1){
    const p=structuredClone(target),load=this.loaded;
    const elevation=(u.facing||1)<0?180-(u.angle??136):(u.angle??44),r=-elevation*Math.PI/180,d=[Math.cos(r),Math.sin(r)];
    const nock=[load.rearHand[0]+p.pelvis[0]-load.pelvis[0],load.rearHand[1]+p.pelvis[1]-load.pelvis[1]],shoulder=p.frontShoulder;
    const v=[nock[0]-shoulder[0],nock[1]-shoulder[1]],dot=v[0]*d[0]+v[1]*d[1],reach=this.armLengths.front-.08;
    const available=-dot+Math.sqrt(Math.max(0,dot*dot+reach*reach-v[0]*v[0]-v[1]*v[1]));
    const span=Math.min(Math.hypot(load.frontHand[0]-load.rearHand[0],load.frontHand[1]-load.rearHand[1]),Math.max(1,available));
    const hand=[nock[0]+d[0]*span,nock[1]+d[1]*span];p.frontHand=poseLerp(p.frontHand,hand,strength);
    const neutral=Math.atan2(load.frontHand[1]-load.rearHand[1],load.frontHand[0]-load.rearHand[0])*180/Math.PI;
    p.weapon+=(-elevation-neutral)*strength;p.frontHandAngle=(-elevation-neutral)*strength*.55;
    return p;
  }
  chargingPose(u,charge,s){
    const held=this.time-(s.chargeAt??this.time),raise=poseClamp(held/.32),draw=poseClamp((charge-.234)/.766);s.raise=raise;s.draw=draw;
    if(this.asset.character_id==='seol_o'){
      const p=this.aimTargets(this.loaded,u),m=this.api.rigMatrices(this.asset,this.api.solvePose(this.asset,p).poses);
      const rest=this.api.point(m.weapon,this.asset.constraints.bowstring.restNock);
      p.rearHand=poseLerp(rest,this.loaded.rearHand,draw);
      // Opening the chest brings the rear shoulder under the shallow draw. Its
      // displacement is only the reach needed; the bow arm is already steady.
      const delta=[p.rearHand[0]-p.rearShoulder[0],p.rearHand[1]-p.rearShoulder[1]],distance=Math.hypot(...delta),shift=Math.max(0,distance-this.armLengths.rear+.1);
      if(shift>0)p.rearShoulder=p.rearShoulder.map((v,i)=>v+delta[i]/distance*shift);
      p.rearArmPlane=-1;p.draw=1;p.arrow=1;
      const target=raise<1?this.api.blendPoseTargets(this.ready,p,raise):p;
      target.draw=raise;target.arrow=raise>.65?1:0;target.spirit=target.qi=0;target.spiritAlpha=target.qiAlpha=0;
      return this.api.solvePose(this.asset,target);
    }
    const anim=this.asset.animation.animations.attack,prepare=anim.keyframes[1].t,load=anim.keyframes[2].t;
    return this.api.sampleAnimation(this.asset,'attack',raise<1?prepare*raise:prepare+(load-prepare)*draw,true);
  }
  pose(u,charge=0){
    const s=this.state(u),previousMode=s.mode,age=this.time-s.releaseAt,hitAge=this.time-s.hitAt,anim=this.asset.animation.animations.attack;
    const release=anim.events[0].t,duration=anim.duration_ms/1000,airborne=!!(u.jumping||u.airborne||Math.abs(u.vy||0)>3);
    if(charge>0&&s.chargeAt===null)s.chargeAt=this.time;if(charge<=0)s.chargeAt=null;
    let sample;
    if(u.portraitOnly){sample=this.api.sampleAnimation(this.asset,'idle',0,true);s.mode='idle';}
    else if(hitAge>=0&&hitAge<.5&&s.hitAt>s.releaseAt){sample=this.api.sampleAnimation(this.asset,'hit',hitAge);s.mode='hit';}
    else if(age>=0&&age<(1-release)*duration){
      const phase=release+age/duration;sample=this.api.sampleAnimation(this.asset,'attack',phase,true);s.mode='release';
      let p=sample.targets;
      if(this.asset.character_id==='seol_o')p=this.aimTargets(p,u,poseClamp((1-phase)/.2));
      if(s.releaseFrom&&age<.1){const mixed=this.api.blendPoseTargets(s.releaseFrom,p,poseClamp(age/.1));mixed.spiritAlpha=p.spiritAlpha;mixed.qiAlpha=p.qiAlpha;p=mixed;}
      p.draw=0;p.arrow=0;if(s.worldEffect){p.spiritAlpha=0;p.qiAlpha=0;}sample=this.api.solvePose(this.asset,p);sample.t=phase;
    }
    else if(charge>0){sample=this.chargingPose(u,charge,s);s.mode='charge';}
    else if(airborne){
      if(!s.wasAirborne)s.riseSpeed=Math.max(1,-(u.vy||0));
      const phase=(u.vy||0)<0?.25+.25*(1-poseClamp(-(u.vy||0)/s.riseSpeed)):.5+.3*poseClamp((u.vy||0)/750);
      sample=this.api.sampleAnimation(this.asset,'jump_fall',phase,true);s.mode='jump';
    }
    else if((u.moving||0)>.01){
      sample=this.api.sampleAnimation(this.asset,'move',s.walkCycle||0,true);s.mode='move';
    }else{
      sample=this.api.sampleAnimation(this.asset,'idle',this.time);s.mode='idle';
      if(previousMode==='move'&&s.lastTargets){s.settleFrom=structuredClone(s.lastTargets);s.settleAt=this.time;}
      if(s.settleFrom&&this.time-s.settleAt<.12)sample=this.api.solvePose(this.asset,this.api.blendPoseTargets(s.settleFrom,sample.targets,poseClamp((this.time-s.settleAt)/.12)));
    }
    s.wasAirborne=airborne;s.lastTargets=structuredClone(sample.targets);sample.poses.root.x=0;sample.poses.root.y=0;
    return {sample,state:s};
  }
  draw(ctx,u,charge=0){const {sample,state}=this.pose(u,charge),result=this.renderer.draw(ctx,{height:102,facing:u.facing||1,sample});state.draws++;return result;}
}
export class HonroArcherVisual extends HonroPoseVisual{}
export class HonroPartyVisual{
  constructor(assets,api,archer){this.visuals={seol_o:archer,...Object.fromEntries(Object.entries(assets).filter(([id])=>id!=='seol_o').map(([id,a])=>[id,new HonroPoseVisual(a,api)]))};}
  update(engine,time,walkDt){for(const [id,v]of Object.entries(this.visuals))if(id!=='seol_o')v.update(engine,time,walkDt);}
  draw(ctx,u,charge=0){const visual=this.visuals[resolveRebuildCharacter(u)];if(!visual)return false;visual.draw(ctx,u,charge);return true;}
  projectile(ctx,q,engine){
    if(q.body)return false;
    const id=resolveRebuildCharacter(engine.b.units.find(u=>u.id===q.owner));
    const part=id==='sodan'&&q.skill==='O01'?'spirit':null;
    if(!part)return false;
    const asset=this.visuals[id].asset;
    this.flightPaths??={};this.flightPaths[part]??=asset.paths.filter(p=>p.part===part).map(p=>({path:new Path2D(p.d),color:asset.palette[p.fill]}));
    ctx.save();ctx.translate(q.x,q.y);ctx.rotate(Math.atan2(q.vy,q.vx)+(part==='spirit'?Math.PI/2:0));
    ctx.scale(.4,.4);ctx.translate(...(part==='spirit'?[-394,-205]:[-439,-193]));
    for(const p of this.flightPaths[part]){ctx.fillStyle=p.color;ctx.fill(p.path);}
    ctx.restore();return true;
  }
}
