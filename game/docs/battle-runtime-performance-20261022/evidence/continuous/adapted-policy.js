async ({targetRound,maxSeconds})=>{
const g=globalThis,C=HONRO_CORE,app=HonroApp,e=app.engine,b=e.b,st=app.stage,profile=app.profile,a=g.HonroAct2.memory(b),canonical=g.HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===11),resume=null;
const m=battleContinuous,actions=[],rounds=[],navEvents=[],births=[],known=new Set(b.units.map(u=>u.id));let frames=0,lastRound=0,stalledRounds=0,lastSignature='',stopReason=null,queuedMove=0,lastYield=performance.now();
const assert=(v,message)=>{if(!v)throw Error(message||'policy assertion');};
const trackBirths=()=>{for(const u of b.units)if(!known.has(u.id)){known.add(u.id);births.push({round:b.round,id:u.id,source:u.honroSpawnSource,x:u.x,y:u.y});}};
const DT=C.STEP,requestMove=x=>{queuedMove=x;return true;};
const tick=async()=>{const at=performance.now(),ms=at-lastYield;if(ms>8){m.policy.push({at:lastYield-m.started,ms,round:b.round});m.policyPending+=ms;}app.stick.x=queuedMove;queuedMove=0;
await new Promise(requestAnimationFrame);app.stick.x=0;frames=m.frames.length;lastYield=performance.now();
if(app.dialogue)document.querySelector('[data-action="dialogue-skip"]')?.click();
if(m.error)throw Error(m.error);if((performance.now()-m.started)/1000>maxSeconds)throw Error('continuous wall-clock budget reached');if(m.engineChanges||m.sceneChanges)throw Error('Unexpected engine/scene replacement during continuous run');};
const fire=e.fire;e.fire=function(id,angle,power,...rest){const u=this.active,ok=fire.call(this,id,angle,power,...rest);if(ok&&u?.side===0&&!u.summoned){app.selected=id;app.selectedByUnit[u.id]=id;app.power=power;app.scene.manual=false;}return ok;};
const hpFraction=u=>u.hp/u.maxHp,dist=(a,c)=>Math.hypot(a.x-c.x,a.y-c.y),heroBody=e.heroesAlive();
// Navigation is an input policy over the same authored walking/jump routes
// already independently executed. Actual positions are always read from Engine.
const nodes=[],edges=[],keyMap=new Map(),surfaceNodes=new Map();
function node(p){const key=(p.surfaceId||'unknown')+':'+Math.round(p.x*10)+':'+Math.round(p.y*10);let i=keyMap.get(key);if(i===undefined){i=nodes.length;nodes.push({...p});edges.push([]);keyMap.set(key,i);}if(p.surfaceId){if(!surfaceNodes.has(p.surfaceId))surfaceNodes.set(p.surfaceId,new Set());surfaceNodes.get(p.surfaceId).add(i);}return i;}
function edge(i,j,jump=null){if(i===j)return;const cost=dist(nodes[i],nodes[j])+(jump?120:0);if(!edges[i].some(x=>x.to===j&&!!x.jump===!!jump))edges[i].push({to:j,cost,jump});}
function joinPoints(p,z,jump=null){const i=node(p),j=node(z);edge(i,j,jump);if(!jump&&p.surfaceId===z.surfaceId)edge(j,i);}
for(const route of canonical.design.space.routes){for(let i=0;i<route.anchors.length-1;i++){let p=route.anchors[i],z=route.anchors[i+1];if(p.jumpTo){const t=b.terrain.find(t=>t.id===p.jumpTo.support),landing={x:p.jumpTo.x,y:C.topAt(t,p.jumpTo.x),surfaceId:p.jumpTo.support};joinPoints(p,landing,p.jumpTo);p=landing;}if(p.surfaceId===z.surfaceId){const t=b.terrain.find(t=>t.id===p.surfaceId),n=Math.max(1,Math.ceil(Math.abs(z.x-p.x)/100));let prev=p;for(let n1=1;n1<=n;n1++){const x=p.x+(z.x-p.x)*n1/n,next={x,y:C.topAt(t,x),surfaceId:p.surfaceId};joinPoints(prev,next);prev=next;}}else joinPoints(p,z);}}
// Continue along exposed authored terrain beyond a mission marker when a live
// enemy has moved there. These are candidate inputs, not a reachability claim;
// every chosen step still passes through the production walking solver.
for(const t of b.terrain.filter(t=>t.honroSpaceSurfaceId&&!t.honroCeiling)){
 const left=Math.max(25,t.x),right=Math.min(b.width-25,t.x+t.w);
 for(const x of [...Array.from({length:Math.floor((right-left)/90)+1},(_,i)=>left+i*90),right]){const y=C.topAt(t,x);if(!Number.isFinite(y)||y<0||y>b.height)continue;const pose={...heroBody[0],x,y};if(C.validTerrainContactPose(b.terrain,pose))node({x,y,surfaceId:t.id});}
}
// Goal sites may lie between two authored samples on the same real contour.
for(const site of Object.values(canonical.design.space.sites))node(site.standing);
for(const[id,set]of surfaceNodes){const ordered=[...set].sort((i,j)=>nodes[i].x-nodes[j].x);for(let j=1;j<ordered.length;j++){const i=ordered[j-1],k=ordered[j];if(nodes[k].x-nodes[i].x<420&&Math.abs(nodes[k].y-nodes[i].y)<=Math.abs(nodes[k].x-nodes[i].x)*1.35+.2){edge(i,k);edge(k,i);}}}
// Real contour seams: short near-level walks between two supports are also
// candidates when combat knockback lands a hero on an optional branch.
for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const p=nodes[i],z=nodes[j];if(p.surfaceId!==z.surfaceId&&Math.abs(p.x-z.x)<=100&&Math.abs(p.y-z.y)<=45){edge(i,j);edge(j,i);}}
function nearest(u){const surface=e.surface(u.x,u.y-5,u.y+5)?.t?.id;let best=-1,cost=Infinity;for(let i=0;i<nodes.length;i++){const p=nodes[i],score=dist(u,p)+(p.surfaceId===surface?0:350);if(score<cost){cost=score;best=i;}}return{index:best,distance:dist(u,nodes[best]),surface};}
function paths(from){const d=nodes.map(()=>Infinity),prev=nodes.map(()=>null),done=new Set();d[from]=0;for(let n=0;n<nodes.length;n++){let i=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&(i<0||d[j]<d[i]))i=j;if(i<0||!Number.isFinite(d[i]))break;done.add(i);for(const link of edges[i])if(d[i]+link.cost<d[link.to]){d[link.to]=d[i]+link.cost;prev[link.to]={from:i,...link};}}return{d,prev};}
function routeTo(u,point,{enemy=false}={}){const start=nearest(u),tree=paths(start.index),range={archer:550,mage:450,knight:90,occultist:340}[u.cls];let target=-1,score=Infinity;for(let i=0;i<nodes.length;i++){const p=nodes[i],delta=dist(p,point);let penalty=delta*8;if(enemy){const dy=Math.abs(p.y-point.y);if(delta>1400||dy>(u.cls==='knight'?350:700))continue;penalty=Math.abs(delta-range)*1.4+Math.max(0,dy-(u.cls==='knight'?120:380))*3;if(delta>1500)penalty+=delta*3;}const total=tree.d[i]+penalty;if(total<score){target=i;score=total;}}if(target<0||!Number.isFinite(score))return null;const links=[];for(let i=target;i!==start.index;){const step=tree.prev[i];if(!step)return null;links.push({from:nodes[step.from],point:nodes[i],jump:step.jump});i=step.from;}links.reverse();if(start.distance>13||Math.abs(u.y-nodes[start.index].y)>35)links.unshift({from:{x:u.x,y:u.y},point:nodes[start.index],jump:null});return{links,start,goal:nodes[target],cost:tree.d[target],target,point:{x:point.x,y:point.y,id:point.id}};}
const manualJumpDone=new Set(resume?.manualJumpDone||[]);const navigation=new Map();let manualPolicy={},manualPolicyHash='';const manualPolicyLog=resume?.manualPolicyLog||[];
async function advance(u,point,enemy=false){
 // Walk beyond the end of an overlapping one-way trunk before turning back.
 // A human can see this edge; proximity to the lower contour is not a drop.
 if(e.surface(u.x,u.y-5,u.y+5)?.t?.id==='rv-saddle-fallen-trunk'&&u.x>7900&&point.y>u.y+30){const start={x:u.x,y:u.y};for(let i=0;i<240&&app.canInput()&&u.moveLeft>12&&u.x<8135;i++){requestMove(1,DT);await tick();}for(let i=0;i<240&&app.canInput()&&!e.grounded(u);i++)await tick();actions.push({op:'move',round:b.round,hero:u.cls,from:start,to:{x:u.x,y:u.y},goal:{id:'manual-fallen-trunk-end',x:8135,y:6790}});navigation.delete(u.id);}
 // The descent's one-way trunk overlaps the refuge floor. Walk to its real
 // right-hand meeting before returning west; a vertical graph edge is not a drop.
 if(e.surface(u.x,u.y-5,u.y+5)?.t?.id==='rv-root-east-descent'&&point.y>u.y+30){const start={x:u.x,y:u.y};for(let i=0;i<300&&app.canInput()&&u.moveLeft>12&&u.x<11025;i++){requestMove(1,DT);await tick();}for(let i=0;i<240&&app.canInput()&&!e.grounded(u);i++)await tick();actions.push({op:'move',input:'descent-tip-return',round:b.round,hero:u.cls,from:start,to:{x:u.x,y:u.y},support:e.surface(u.x,u.y-5,u.y+5)?.t?.id});navigation.delete(u.id);}
 let nav=navigation.get(u.id);const changed=!nav||dist(nav.point,point)>180||nav.point.id!==point.id||nav.enemy!==enemy||nav.index>=nav.links.length&&(enemy||dist(u,nav.goal)>70);if(changed){const route=routeTo(u,point,{enemy});if(!route)return{blocked:'no graph route'};nav={...route,enemy,index:0,air:null};navigation.set(u.id,nav);if(nav.start.distance>400)navEvents.push({round:b.round,hero:u.cls,kind:'off-route',position:{x:u.x,y:u.y},nearest:nav.start});}
 let still=0,moved=0;const origin={x:u.x,y:u.y};for(let n=0;n<1300&&app.canInput()&&u.moveLeft>12;n++){
  if(nav.air){const target=nav.air;if(Math.abs(u.x-target.x)>3)requestMove(Math.sign(target.x-u.x)*.35,DT);await tick();if(e.grounded(u)){navEvents.push({round:b.round,hero:u.cls,kind:'jump-land',x:u.x,y:u.y,support:e.surface(u.x,u.y-5,u.y+5)?.t?.id,expected:target.support});nav.air=null;nav.index++;}continue;}
  const link=nav.links[nav.index];if(!link)break;
  const p=link.jump?link.from:link.point,reached=Math.abs(u.x-p.x)<13&&Math.abs(u.y-p.y)<35&&e.grounded(u);
  if(reached){if(link.jump){if(u.moveLeft<e.jumpCost(u)+Math.abs(link.jump.x-u.x)+70)break;if(e.jump(u)){nav.air=link.jump;actions.push({op:'jump',round:b.round,hero:u.cls,to:link.jump});continue;}break;}nav.index++;continue;}
  const before={x:u.x,y:u.y};if(Math.abs(u.x-p.x)>6)requestMove(Math.sign(p.x-u.x)*(Math.abs(u.x-p.x)<25?.3:1),DT);
  if(e.grounded(u)&&(still>12&&Math.abs(u.x-p.x)>25||Math.abs(u.x-p.x)<28&&u.y-p.y>35)){if(e.jump(u)){actions.push({op:'jump-recover',round:b.round,hero:u.cls,to:p});still=0;}}
  await tick();if(dist(before,u)<.01)still++;else still=0;if(still>120){navEvents.push({round:b.round,hero:u.cls,kind:'blocked',x:u.x,y:u.y,goal:p,support:e.surface(u.x,u.y-5,u.y+5)?.t?.id});navigation.delete(u.id);break;}
 }
 for(let n=0;n<300&&app.canInput()&&!e.grounded(u);n++)await tick();moved=dist(origin,u);if(moved>1)actions.push({op:'move',round:b.round,hero:u.cls,from:origin,to:{x:u.x,y:u.y},goal:{x:point.x,y:point.y,id:point.id}});return{moved,nav};}
function fireAt(u,target){const spirit=target.honroSpirit&&!target.manifested;let skills=u.loadout.map(id=>C.SKILLS[id]).filter(s=>s.damage>0&&!s.passive&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus);skills.sort((a,z)=>(spirit?Number(z.id==='O08')-Number(a.id==='O08'):0)||z.damage-a.damage);
 for(const skill of skills.slice(0,3)){
  if(skill.martial&&skill.branch==='sword'){let angle=Math.atan2(u.y-u.h*.58-(target.y-target.h*.5),target.x-u.x)*180/Math.PI;if(angle< -90)angle+=360;for(const power of[1,.7,.2])if(C.meleeContains(e,u,target,C.meleeRange(u,skill,power),-angle*Math.PI/180,C.meleeSpan(u,skill,power))&&e.fire(skill.id,angle,power)){actions.push({op:'fire',round:b.round,hero:u.cls,skill:skill.id,target:target.id,hpBefore:target.hp});return true;}continue;}
  let best=null;for(const aim of e.shotSeeds(u,skill,target)){const v=C.shotViable(e,u,skill,target,aim.angle,aim.power);if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,skill.radius+target.r+55)&&(!best||v.net>best.net))best={...aim,net:v.net};}
  if(!best&&skill===skills[0]){const aim=e.bestShot(u,skill,target),v=C.shotViable(e,u,skill,target,aim.angle,aim.power);if((v.ok||target.hp<=2&&v.enemyDamage>0)&&v.risk<1&&v.miss<Math.max(85,skill.radius+target.r+55))best=aim;}
  if(best&&e.fire(skill.id,best.angle,best.power)){actions.push({op:'fire',round:b.round,hero:u.cls,skill:skill.id,target:target.id,hpBefore:target.hp,angle:best.angle,power:best.power});return true;}
 }return false;}
function healStake(u){if(u.cls!=='mage'||!u.loadout.includes('M10')||e.manaCost(C.SKILLS.M10,u)>u.focus)return false;const hurt=e.heroesAlive().filter(v=>hpFraction(v)<.78&&dist(v,u)<3000);if(!hurt.length)return false;const target=hurt.find(v=>v.cls===manualPolicy.healTarget)||hurt.sort((a,z)=>hpFraction(a)-hpFraction(z))[0];if((b.stakes||[]).some(s=>s.skill==='M10'&&s.expires>b.round+1&&dist(s,target)<180))return false;let best=null;const aims=[...e.shotSeeds(u,C.SKILLS.M10,target),...Array.from({length:36},(_,i)=>-85+i*10).flatMap(angle=>[.2,.4,.6,.8,1].map(power=>({angle,power})))];for(const {angle,power}of aims){const hit=e.predict(u,C.SKILLS.M10,angle,power);const d=dist(hit,target);if(hit.terrain&&Math.abs(hit.y-target.y)<70&&d<90&&(!best||d<best.d))best={angle,power,d,x:hit.x,y:hit.y};}if(best&&e.fire('M10',best.angle,best.power)){actions.push({op:'heal-stake',round:b.round,hero:u.cls,target:target.id,...best});return true;}return false;}
const actionLimit=200,started=performance.now();
for(let n=0;n<actionLimit&&!['won','lost'].includes(b.phase);n++){
 while(!app.canInput()&&!['won','lost'].includes(b.phase)&&frames<60000)await tick();if(frames>=60000){stopReason='native frame budget; not a game loss';break;}if(['won','lost'].includes(b.phase))break;
 if(lastRound!==b.round){lastRound=b.round;const row={round:b.round,goal:g.HonroAct2.current(b)?.id,heroes:e.heroesAlive().map(u=>({id:u.id,hp:u.hp,x:u.x,y:u.y})),foes:e.alive(1).map(u=>({id:u.id,hp:u.hp,x:u.x,y:u.y}))};rounds.push(row);console.log('CONTINUOUS ROUND',b.round,row.goal);if(b.round>=targetRound){stopReason='target round reached';break;}const sig=JSON.stringify({goal:row.goal,foes:row.foes.map(u=>[u.id,Math.round(u.hp)]),heroes:row.heroes.map(u=>[u.id,Math.round(u.x/30),Math.round(u.y/30)])});stalledRounds=sig===lastSignature?stalledRounds+1:0;lastSignature=sig;if(stalledRounds>=3){stopReason='controller stalled for 3 unchanged rounds';break;}}
 trackBirths();
 const current=g.HonroAct2.current(b),m=b.honroMarkers.find(x=>x.id===current?.id),spirit=current?.kind==='rescue'?e.unit(m.spiritId):null,weak=spirit&&(spirit.dead||spirit.hp<=spirit.maxHp*.4&&e.heroesAlive().some(v=>v.cls==='occultist'));
 if(current?.requiredClass||weak){const cls=current.requiredClass||(weak?'occultist':null),u=e.heroesAlive().find(u=>u.cls===cls&&!u.acted);if(u)e.select(u.id);}
 const wounded=e.heroesAlive().find(v=>hpFraction(v)<.35),healer=e.heroesAlive().find(v=>v.cls==='mage'&&!v.acted);if(wounded&&healer)e.select(healer.id);
 if(manualPolicy.select){const selected=e.heroesAlive().find(v=>v.cls===manualPolicy.select&&!v.acted);if(selected)e.select(selected.id);}
 const u=e.active;if(!u||u.side!==0||u.dead){stopReason='no usable active hero';break;}
 if(m?.action&&g.HonroInteractions.eligibility(app,m).ok){const spiritBefore=spirit?{hp:spirit.hp,maxHp:spirit.maxHp,dead:spirit.dead}:null;if(g.HonroInteractions.use(app,m)){actions.push({op:'E',round:b.round,hero:u.cls,target:m.id,spiritBefore});navigation.delete(u.id);continue;}}
 const jumpPlan=manualPolicy.jump?.[u.cls],jumpKey=jumpPlan&&(u.id+':'+jumpPlan.id);if(jumpPlan&&!manualJumpDone.has(jumpKey)&&e.grounded(u)&&u.moveLeft>e.jumpCost(u)+Math.abs(jumpPlan.x-u.x)+70){if(e.jump(u)){manualJumpDone.add(jumpKey);const start={x:u.x,y:u.y};for(let i=0;i<240&&app.canInput();i++){if(Math.abs(u.x-jumpPlan.x)>3)requestMove(Math.sign(jumpPlan.x-u.x)*.35,DT);await tick();if(i>4&&e.grounded(u))break;}actions.push({op:'jump',input:'manual-waypoint',round:b.round,hero:u.cls,from:start,to:{x:u.x,y:u.y},expectedSupport:jumpPlan.support,landedSupport:e.surface(u.x,u.y-5,u.y+5)?.t?.id});navigation.delete(u.id);}}
 const manualAim=manualPolicy.fire?.[u.cls];if(manualAim&&(!manualAim.target||!e.unit(manualAim.target)?.dead)){assert(u.loadout.includes(manualAim.skill),'Manual aim uses an equipped skill');assert(Number.isFinite(manualAim.angle)&&manualAim.angle>=-90&&manualAim.angle<=270&&manualAim.power>=.13&&manualAim.power<=1,'Manual aim is within UI input limits');const hpBefore=e.unit(manualAim.target)?.hp;if(e.fire(manualAim.skill,manualAim.angle,manualAim.power)){actions.push({op:'fire',input:'manual-aim',round:b.round,hero:u.cls,...manualAim,hpBefore});continue;}}
 if(healStake(u))continue;
 let foes=e.alive(1).filter(v=>g.HonroAct2.visible(b,v)||v.id===spirit?.id).filter(v=>!(weak&&v.id===spirit?.id));
 const guards=m&&current?.kind==='interact'?g.HonroAct2.interactionThreats(b,m):[],guardIds=new Set(guards.map(v=>v.id));
 const priority=v=>guardIds.has(v.id)?20000:current?.kind==='clear'&&current.cohorts!=='all'?Number(v.honroCohort===current.cohorts)*10000:current?.kind==='hold'?Number(dist(v,m)<current.contestRadius+150)*10000:spirit?Number(v.id===spirit.id)*10000:0;
 foes.sort((a,z)=>priority(z)-priority(a)||dist(a,u)-dist(z,u));
 const local=foes.filter(v=>dist(v,u)<1500),objectiveRush=!!m&&(current.requiredClass===u.cls&&dist(u,m)>330||current.kind==='rescue'&&(dist(u,m)>1000||u.cls==='occultist')||m.action&&g.HonroAct2.eligibility(app,m).ok||current.id==='knot-east'&&dist(u,m)>420||!!manualPolicy.goals?.[u.cls]);let fired=false;
 if(!objectiveRush)for(const target of local.slice(0,4))if(fireAt(u,target)){fired=true;break;}
 if(fired)continue;
 const heal=(b.stakes||[]).filter(s=>s.skill==='M10'&&s.expires>b.round&&dist(s,u)<1600&&s.usedRounds?.[u.id]!==b.round).sort((a,z)=>dist(a,u)-dist(z,u))[0];
 let goal,enemy=false;
 if(current?.id==='knot-east'&&u.cls==='occultist'&&hpFraction(u)<.4)goal={id:'normal-retreat-west',x:Math.max(4600,u.x-650),y:C.topAt(b.terrain.find(t=>t.id==='rv-west-main-root'),Math.max(4600,u.x-650))};
 else if(wounded&&u.cls==='mage')goal=wounded;
 else if(objectiveRush)goal=m;
 else if(hpFraction(u)<.70&&heal)goal=heal;
 else if(current?.kind==='hold'&&(u.cls==='occultist'||!e.heroesAlive().some(h=>dist(h,m)<current.radius*.8)))goal=m;
 else if(current?.kind==='clear'){const eligible=foes.filter(v=>current.cohorts==='all'||v.honroCohort===current.cohorts);goal=eligible[0]||g.HonroObjectives.state(b,st).targets[0]||m;enemy=!!eligible[0];}
 else if(local.length){goal=local[0];enemy=true;}
 else goal=m||g.HonroObjectives.state(b,st).targets[0];
 if(manualPolicy.goals?.[u.cls]){goal=manualPolicy.goals[u.cls];enemy=false;}
 if(goal)await advance(u,goal,enemy);if(!app.canInput())continue;
 if(m?.action&&g.HonroInteractions.eligibility(app,m).ok){const spiritBefore=spirit?{hp:spirit.hp,maxHp:spirit.maxHp,dead:spirit.dead}:null;if(g.HonroInteractions.use(app,m)){actions.push({op:'E',round:b.round,hero:u.cls,target:m.id,spiritBefore});navigation.delete(u.id);continue;}}
 if(healStake(u))continue;
 foes=foes.filter(v=>!v.dead&&dist(v,u)<1600);for(const target of foes.slice(0,4))if(fireAt(u,target)){fired=true;break;}
 if(!fired){e.wait();actions.push({op:'wait',round:b.round,hero:u.cls});}
}
app.stick.x=0;return {round:b.round,phase:b.phase,stopReason:stopReason||'policy action limit or terminal battle',actions,rounds,navEvents,births,frames,goal:g.HonroAct2.current(b)?.id};
}