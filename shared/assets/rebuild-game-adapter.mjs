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
  if(named&&(u.honroAlly||u.honroCivilian||u.honroFinalBoss||u.id==='boss'))return named;
  return null;
}
// Presentation bounds only. Summons/NPC renderers take precedence over class
// aliases, and collision dimensions remain owned by the engine.
export function partyPresentationHeight(u){
  if(!u||u.summoned)return u?.h||0;
  const a=globalThis.HONRO_PARTY?.[resolveRebuildCharacter(u)];
  return a?u.h*(a.canvas.presentationHeight||a.canvas.visualHeight)/a.canvas.visualHeight:u.h;
}
globalThis.HonroPartyPresentationHeight=partyPresentationHeight;
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
  update(engine,time,walkDt=Math.max(0,time-this.time),selected=''){
    const simulationDt=Math.max(0,time-this.time);this.time=time;
    for(const u of engine.b.units){
      if(resolveRebuildCharacter(u)!==this.asset.character_id)continue;
      const s=this.state(u);
      if(engine.b.active===u.id&&selected)s.selectedSkill=selected;
      s.bodyFlight=(engine.b.projectiles||[]).some(q=>q.owner===u.id&&q.body&&!q.dead);
      s.comboHits=[3,3,4,4,5,5,6,7][Math.max(0,Math.min(7,(u.ranks?.S07||1)-1))];
      s.meleeElapsed=u.meleeAction?.elapsed;s.meleeIndex=u.meleeAction?.index;s.meleeSkill=u.meleeAction?.skill;s.meleeDelay=u.meleeAction?.skill==='S02'?.20:.075;
      const distance=Math.max(0,(u.walkPhase||0)-(s.lastWalk??(u.walkPhase||0)))/.038;
      s.lastWalk=u.walkPhase||0;s.walkCycle??=0;
      const effort=Math.min(1,distance/Math.max(.001,(u.walkSpeed||330)*simulationDt));
      if(!u.jumping&&!u.airborne&&Math.abs(u.vy||0)<3)s.walkCycle=(s.walkCycle+Math.min(.1,Math.max(0,walkDt))*effort*WALK_CADENCE[this.asset.character_id]/120)%1;
      if((u.anim||0)>s.lastAnim+.05&&!(u.meleeAction?.skill==='S07'&&u.meleeAction.index>1)){s.releaseAt=time-(u.meleeAction?.skill==='S05'&&u.meleeAction.index>1?s.meleeDelay:0);s.releaseSkill=engine.b.cast?.owner===u.id?engine.b.cast.skill:s.selectedSkill;s.releaseFrom=s.mode==='charge'&&s.lastTargets?structuredClone(s.lastTargets):null;s.worldEffect=(engine.b.projectiles||[]).some(q=>q.owner===u.id&&!q.dead&&((this.asset.character_id==='sodan'&&q.skill==='O01')||(this.asset.character_id==='damheo'&&q.skill==='M01')));}
      if((u.hurt||0)>s.lastHurt+.05)s.hitAt=time;
      s.lastAnim=u.anim||0;s.lastHurt=u.hurt||0;
    }
  }
  aimTargets(target,u,strength=1){
    const p=structuredClone(target),load=this.loaded;
    const elevation=(u.facing||1)<0?180-(u.angle??136):(u.angle??44),r=-elevation*Math.PI/180,d=[Math.cos(r),Math.sin(r)];
    if(this.asset.anatomyRevision>=12){
      // Turn the whole drawing shoulder/elbow plane with the shot direction.
      // At horizontal draw the elbow stays behind the wrist, not over the ear.
      const turn=r*strength,ca=Math.cos(turn),sa=Math.sin(turn),pivot=p.rearHand;
      for(const key of ['rearShoulder','rearElbow']){const v=p[key].map((x,i)=>x-pivot[i]);p[key]=[pivot[0]+ca*v[0]-sa*v[1],pivot[1]+sa*v[0]+ca*v[1]];}
      p.rearArmPlane=-1;
      const chain=this.api.solvePose(this.asset,p),elbow=chain.guide.joints.rear_forearm,wrist=chain.guide.joints.rear_hand;
      p.rearHandAngle=Math.atan2(wrist[1]-elbow[1],wrist[0]-elbow[0])*180/Math.PI-90;
      const socket=this.asset.rig.handSockets.front.map((v,i)=>v-this.by.front_hand.pivot[i]);
      const rearMatrices=this.api.rigMatrices(this.asset,this.api.solvePose(this.asset,p).poses),nock=this.api.point(rearMatrices.rear_hand,this.asset.rig.handSockets.rear);
      let handAngle=p.frontHandAngle;
      for(let iteration=0;iteration<4;iteration++){
        const a=handAngle*Math.PI/180,offset=[Math.cos(a)*socket[0]-Math.sin(a)*socket[1],Math.sin(a)*socket[0]+Math.cos(a)*socket[1]];
        const base=nock.map((v,i)=>v-offset[i]-p.frontShoulder[i]),dot=base[0]*d[0]+base[1]*d[1],reach=this.armLengths.front*.985;
        const available=-dot+Math.sqrt(Math.max(0,dot*dot+reach*reach-base[0]*base[0]-base[1]*base[1])),span=Math.max(1,available);
        const goal=nock.map((v,i)=>v+d[i]*span-offset[i]);p.frontHand=poseLerp(target.frontHand,goal,strength);
        const solved=this.api.solvePose(this.asset,p),e=solved.guide.joints.front_forearm,w=solved.guide.joints.front_hand;
        handAngle=Math.atan2(w[1]-e[1],w[0]-e[0])*180/Math.PI-90+6;
      }
      p.frontHandAngle=handAngle;p.weapon=target.weapon+(-elevation-target.weapon)*strength;return p;
    }
    const nock=[load.rearHand[0]+p.pelvis[0]-load.pelvis[0],load.rearHand[1]+p.pelvis[1]-load.pelvis[1]],shoulder=p.frontShoulder;
    const v=[nock[0]-shoulder[0],nock[1]-shoulder[1]],dot=v[0]*d[0]+v[1]*d[1],reach=this.armLengths.front-.08;
    const available=-dot+Math.sqrt(Math.max(0,dot*dot+reach*reach-v[0]*v[0]-v[1]*v[1]));
    const span=Math.min(Math.hypot(load.frontHand[0]-load.rearHand[0],load.frontHand[1]-load.rearHand[1]),Math.max(1,available));
    const hand=[nock[0]+d[0]*span,nock[1]+d[1]*span];p.frontHand=poseLerp(p.frontHand,hand,strength);
    const neutral=Math.atan2(load.frontHand[1]-load.rearHand[1],load.frontHand[0]-load.rearHand[0])*180/Math.PI;
    p.weapon+=(-elevation-neutral)*strength;p.frontHandAngle=this.asset.motionRevision>=11?p.weapon:(-elevation-neutral)*strength*.55;
    return p;
  }
  chargingPose(u,charge,s){
    const held=this.time-(s.chargeAt??this.time),raise=poseClamp(held/.32),draw=poseClamp((charge-.234)/.766);s.raise=raise;s.draw=draw;
    if(this.asset.character_id==='seol_o'){
      const p=this.aimTargets(this.loaded,u),m=this.api.rigMatrices(this.asset,this.api.solvePose(this.asset,p).poses);
      const rest=this.api.point(m.weapon,this.asset.constraints.bowstring.restNock);
      const restWrist=this.asset.anatomyRevision>=12?rest.map((v,i)=>v-(this.api.point(m.rear_hand,this.asset.rig.handSockets.rear)[i]-p.rearHand[i])):rest;
      p.rearHand=poseLerp(restWrist,this.loaded.rearHand,draw);
      // Opening the chest brings the rear shoulder under the shallow draw. Its
      // displacement is only the reach needed; the bow arm is already steady.
      const delta=[p.rearHand[0]-p.rearShoulder[0],p.rearHand[1]-p.rearShoulder[1]],distance=Math.hypot(...delta),shift=Math.max(0,distance-this.armLengths.rear+.1);
      if(shift>0)p.rearShoulder=p.rearShoulder.map((v,i)=>v+delta[i]/distance*shift);
      p.rearArmPlane=-1;p.draw=1;p.arrow=1;
      if(this.asset.anatomyRevision>=12){const eAngle=(u.facing||1)<0?180-(u.angle??136):(u.angle??44),r=-eAngle*Math.PI/180,forearm=Math.hypot(...this.by.rear_hand.pivot.map((v,i)=>v-this.by.rear_forearm.pivot[i]));p.rearElbow=p.rearHand.map((v,i)=>v-[Math.cos(r),Math.sin(r)][i]*forearm*.97);p.rearElbowProjection=1;const q=this.api.solvePose(this.asset,p),e=q.guide.joints.rear_forearm,w=q.guide.joints.rear_hand;p.rearHandAngle=Math.atan2(w[1]-e[1],w[0]-e[0])*180/Math.PI-90;p.rearArmLayer=1;}
      const target=raise<1?this.api.blendPoseTargets(s.chargeFrom||this.ready,p,raise):p;
      target.draw=raise;target.arrow=raise>.65?1:0;if(this.asset.anatomyRevision>=12)target.rearArmLayer=1;target.spirit=target.qi=0;target.spiritAlpha=target.qiAlpha=0;
      const reachable=this.api.solvePose(this.asset,target);
      for(const side of ['rear','front'])target[side+'Hand']=reachable.guide.joints[side+'_hand'];
      return this.api.solvePose(this.asset,target);
    }
    if(this.asset.character_id==='hwigyeom'){
      if(this.asset.motionRevision>=11)return this.api.sampleAnimation(this.asset,'attack',this.asset.animation.animations.attack.keyframes[2].t*raise,true);
      const p=structuredClone(this.loaded);p.pelvis[1]+=charge*18;p.frontShoulder[1]+=charge*10;p.rearShoulder[1]+=charge*10;p.frontHand[1]+=charge*6;p.rearHand[1]+=charge*6;p.spirit=p.qi=p.spiritAlpha=p.qiAlpha=0;
      return this.api.solvePose(this.asset,this.api.blendPoseTargets(this.ready,p,raise));
    }
    const anim=this.asset.animation.animations.attack,prepare=anim.keyframes[1].t,load=anim.keyframes[2].t;
    return this.api.sampleAnimation(this.asset,'attack',raise<1?prepare*raise:prepare+(load-prepare)*draw,true);
  }
  scenePose(p){
    if(p.kind==='move')return this.api.sampleAnimation(this.asset,'move',(p.time*1.05)%1,true);
    const ease=Math.min(1,p.time/.45),idle=this.api.sampleAnimation(this.asset,'idle',0,true).targets;
    let target=structuredClone(idle);
    if(p.kind==='hold-bell'||p.kind==='guard')target=this.api.sampleAnimation(this.asset,'attack',p.kind==='hold-bell'?.22:.12,true).targets;
    else if(p.kind==='recoil')target=this.api.sampleAnimation(this.asset,'hit',.3,true).targets;
    else if(p.kind==='inspect'||p.kind==='kneel'||p.kind==='bow'){
      // Lower the whole connected body, keeping both feet on their contacts.
      // Moving shoulders alone stretches the torso instead of making a bow.
      const drop=p.kind==='kneel'?92:p.kind==='bow'?14:8,lean=p.kind==='bow'?32:16;
      const chest=[...target.thorax],hip=[...target.pelvis];
      target.pelvis[1]+=drop;target.thorax[0]+=lean;target.thorax[1]+=drop+(p.kind==='bow'?14:6);
      const angle=Math.atan2(target.thorax[1]-target.pelvis[1],target.thorax[0]-target.pelvis[0])-Math.atan2(chest[1]-hip[1],chest[0]-hip[0]),c=Math.cos(angle),s=Math.sin(angle);
      for(const side of ['rear','front']){
        target[side+'Hip'][1]+=drop;
        for(const part of ['Shoulder','Elbow','Hand']){const key=side+part,x=target[key][0]-chest[0],y=target[key][1]-chest[1];target[key]=[target.thorax[0]+x*c-y*s,target.thorax[1]+x*s+y*c];}
      }
      target.head=p.kind==='bow'?24:12;
    }else if(p.kind==='point'){
      // Extend the free hand, retaining the weapon in the other hand.
      const hand=this.asset.character_id==='seol_o'?'rearHand':'frontHand',shoulder=hand==='rearHand'?'rearShoulder':'frontShoulder';
      target[hand]=[target[shoulder][0]+48,target[shoulder][1]+12];
    }
    target.spirit=target.qi=target.spiritAlpha=target.qiAlpha=target.draw=target.arrow=0;
    const sample=this.api.solvePose(this.asset,this.api.blendPoseTargets(idle,target,ease));
    if(['inspect','kneel','bow'].includes(p.kind)){
      // A long robe folds above the planted feet instead of entering the floor.
      const drop=sample.targets.pelvis[1]-idle.pelvis[1],ground=Math.max(...['rear','front'].map(side=>idle[side+'Foot'][1]));
      for(const side of ['rear','front']){const id=side+'_cloth',part=this.by[id],m=sample.poses[id]?.matrix;if(!part||!m)continue;const scale=Math.max(.3,1-drop/(ground-part.pivot[1])),a=m[2],b=m[3];m[2]*=scale;m[3]*=scale;m[4]+=(a-m[2])*part.pivot[1];m[5]+=(b-m[3])*part.pivot[1];}
    }
    return sample;
  }
  pose(u,charge=0){
    const s=this.state(u),previousMode=s.mode,age=this.time-s.releaseAt,hitAge=this.time-s.hitAt,anim=this.asset.animation.animations.attack;
    const release=anim.events[0].t,duration=anim.duration_ms/1000,airborne=!!(u.jumping||u.airborne||Math.abs(u.vy||0)>3);
    if(charge>0&&s.chargeAt===null){s.chargeAt=this.time;s.chargeFrom=s.lastTargets?structuredClone(s.lastTargets):this.ready;}if(charge<=0)s.chargeAt=null;
    let sample;
    if(u.portraitOnly){sample=this.api.sampleAnimation(this.asset,'idle',0,true);s.mode='idle';}
    else if(u.honroScenePose){sample=this.scenePose(u.honroScenePose);s.mode='scene';}
    else if(hitAge>=0&&hitAge<.5&&s.hitAt>s.releaseAt){sample=this.api.sampleAnimation(this.asset,'hit',hitAge);s.mode='hit';}
    else if(s.bodyFlight&&this.asset.character_id==='hwigyeom'){
      const p=structuredClone(this.api.sampleAnimation(this.asset,'jump_fall',.43,true).targets);
      p.frontHand=[p.frontShoulder[0]+100,p.frontShoulder[1]+25];p.weapon=this.asset.anatomyRevision>=12?-12:-72;p.frontHandAngle=this.asset.anatomyRevision>=12?-78:-72;
      sample=this.api.solvePose(this.asset,p);s.mode='rush';
    }
    else if(age>=0&&(age<(1-release)*duration||s.meleeSkill==='S07'&&s.meleeIndex>=1)){
      const sweep=this.asset.character_id==='hwigyeom'&&this.asset.motionRevision>=11&&(!s.releaseSkill||['S00','S03','S05','S07','S02'].includes(s.releaseSkill));
      const cutAt=s.meleeDelay||.075;
      const phase=sweep?(age<cutAt?anim.keyframes[2].t+(release-anim.keyframes[2].t)*poseClamp(age/cutAt):release+(1-release)*poseClamp((age-cutAt)/((1-release)*duration-cutAt))):release+age/duration;sample=this.api.sampleAnimation(this.asset,'attack',phase,true);s.mode='release';
      let p=sample.targets;
      if(s.meleeSkill==='S07'&&s.meleeIndex>=1&&s.meleeElapsed>=cutAt){
        // The engine's existing 100 ms combo beats alternate compact diagonal
        // cuts. Never restart at the overhead load on a damage-frame anim pulse.
        const beat=(s.meleeElapsed-cutAt)/.10,wave=(1-Math.cos(Math.PI*Math.min(s.comboHits-1,beat)))/2;
        p=structuredClone(this.api.completePose(this.asset,anim.keyframes[3]));
        p.weapon=this.asset.anatomyRevision>=12?15-65*wave:-55-70*wave;p.frontHandAngle=this.asset.anatomyRevision>=12?p.frontHandAngle:p.weapon;
        p.frontHand=this.asset.anatomyRevision>=12?[410-16*wave,170+45*wave]:[420-20*wave,173+50*wave];p.frontArmPlane=.8;
        p.thorax[0]-=4*wave;p.rearHand[0]+=6*wave;
      }
      if(this.asset.character_id==='seol_o')p=this.aimTargets(p,u,poseClamp((1-phase)/.2));
      if(s.releaseFrom&&age<(sweep?.025:.1)){const mixed=this.api.blendPoseTargets(s.releaseFrom,p,poseClamp(age/(sweep?.025:.1)));mixed.spiritAlpha=p.spiritAlpha;mixed.qiAlpha=p.qiAlpha;p=mixed;}
      p.draw=0;p.arrow=0;if(s.worldEffect){p.spiritAlpha=0;p.qiAlpha=0;}sample=this.api.solvePose(this.asset,p);sample.t=s.meleeSkill==='S07'&&s.meleeIndex>=1?.5:phase;
    }
    else if(charge>0){sample=this.chargingPose(u,charge,s);s.mode='charge';}
    else if(this.asset.character_id==='hwigyeom'&&u.martialGuard?.counter){sample=this.chargingPose(u,.25,{...s,chargeAt:this.time-.32});s.mode='guard';}
    else if(airborne){
      if(!s.wasAirborne)s.riseSpeed=Math.max(1,-(u.vy||0));
      const phase=(u.vy||0)<0?.25+.25*(1-poseClamp(-(u.vy||0)/s.riseSpeed)):.5+.3*poseClamp((u.vy||0)/750);
      sample=this.api.sampleAnimation(this.asset,'jump_fall',phase,true);s.mode='jump';
    }
    else if((u.moving||0)>.01){
      sample=this.api.sampleAnimation(this.asset,'move',s.walkCycle||0,true);s.mode='move';
    }else{
      sample=this.api.sampleAnimation(this.asset,'idle',this.time);s.mode='idle';
      if(['move','charge','rush','release'].includes(previousMode)&&s.lastTargets){s.settleFrom=structuredClone(s.lastTargets);s.settleAt=this.time;}
      if(s.settleFrom&&this.time-s.settleAt<.12)sample=this.api.solvePose(this.asset,this.api.blendPoseTargets(s.settleFrom,sample.targets,poseClamp((this.time-s.settleAt)/.12)));
    }
    if(['move','jump','rush'].includes(s.mode)){
      if(previousMode!==s.mode&&s.lastTargets){s.locomotionFrom=structuredClone(s.lastTargets);s.locomotionAt=this.time;}
      const blendAge=this.time-(s.locomotionAt??-Infinity);
      if(s.locomotionFrom&&blendAge<.1){const t=sample.t,controls=sample.controls;sample=this.api.solvePose(this.asset,this.api.blendPoseTargets(s.locomotionFrom,sample.targets,poseClamp(blendAge/.1)));sample.t=t;sample.controls=controls;}
    }
    if(this.asset.character_id!=='hwigyeom'&&this.asset.anatomyRevision>=12&&['charge','release'].includes(s.mode))sample.controls.rearArmLayer=1;
    if(airborne&&['charge','release','guard'].includes(s.mode)){
      // Keep the action's arm chain, but never display planted stance legs in
      // midair. Translation is local artwork only; the engine owns actor motion.
      const flight=this.api.sampleAnimation(this.asset,'jump_fall',(u.vy||0)<0?.38:.65,true).targets;
      const p=structuredClone(sample.targets),delta=flight.pelvis.map((v,i)=>v-p.pelvis[i]);
      for(const k of ['pelvis','thorax','rearShoulder','frontShoulder','rearElbow','frontElbow','rearHand','frontHand'])p[k]=p[k].map((v,i)=>v+delta[i]);
      for(const side of ['rear','front'])for(const part of ['Hip','Knee','Foot'])p[side+part]=structuredClone(flight[side+part]);
      p.contacts=[];const controls=sample.controls,t=sample.t;sample=this.api.solvePose(this.asset,p);sample.controls=controls;sample.t=t;
    }
    if(this.asset.character_id==='sodan'){
      const talisman=/^O(06|07|08|09|10)$/.test(s.mode==='release'?s.releaseSkill:s.selectedSkill);
      sample.controls.talismanOpacity=talisman&&(s.mode==='charge'||s.mode==='release'&&age<.035)?1:0;
      sample.controls.paperBend=Math.sin(this.time*10)*1.5+(s.mode==='release'?4:0);
      if(talisman)sample.poses.spirit.opacity=0;
    }
    s.wasAirborne=airborne;s.lastTargets=structuredClone(sample.targets);sample.poses.root.x=0;sample.poses.root.y=0;
    return {sample,state:s};
  }
  draw(ctx,u,charge=0){const {sample,state}=this.pose(u,charge),result=this.renderer.draw(ctx,{height:102,facing:(u.facing||1)*(state.meleeSkill==='S05'&&state.meleeIndex>=2?-1:1),sample});state.draws++;return result;}
}
export class HonroArcherVisual extends HonroPoseVisual{}
export class HonroPartyVisual{
  constructor(assets,api,archer){this.visuals={seol_o:archer,...Object.fromEntries(Object.entries(assets).filter(([id])=>id!=='seol_o').map(([id,a])=>[id,new HonroPoseVisual(a,api)]))};}
  update(engine,time,walkDt,selected){for(const [id,v]of Object.entries(this.visuals))if(id!=='seol_o')v.update(engine,time,walkDt,selected);}
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
