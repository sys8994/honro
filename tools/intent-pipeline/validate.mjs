import {createBattle,yAt} from './runtime.mjs';
import {hash} from './state.mjs';
const plain=x=>JSON.parse(JSON.stringify(x));
/** Explicit fixtures. This is physical evidence, never a normal combat clear. */
export function validatePrototype(g,source,project,plan){
 const checks=[],details={};
 const check=(name,fn)=>{try{const evidence=fn();checks.push({name,status:'passed',evidence});return evidence;}catch(e){checks.push({name,status:'failed',reason:e.message});return null;}};
 check('canonical-schema',()=>{const errors=g.HonroMaps.validate(project).filter(x=>x.level==='err');if(errors.length)throw Error(errors.map(x=>x.text).join('; '));return'Canonical map, environment, bounds and asset references validated';});
 check('objective-contract',()=>{
  const base=source.stages.find(s=>s.metadata.stageId===18),st=project.stages.find(s=>s.metadata.stageId===18);
  if(hash(base.initialState.honroAct2Steps)!==hash(st.initialState.honroAct2Steps))throw Error('Objective order/class/duration changed');
  if(base.units.filter(u=>u.team==='enemy').length!==st.units.filter(u=>u.team==='enemy').length)throw Error('Enemy count changed');
  if(st.initialState.honroActiveLimit!==3)throw Error('Active enemy cap changed');
  if(st.markers.filter(m=>m.id.startsWith('spirit-lamp')).length!==1)throw Error('Local spirit lamp count changed');
  const oldRoster=base.units.map(u=>[u.id,u.kind,u.stageOverrides]),newRoster=st.units.map(u=>[u.id,u.kind,u.stageOverrides]);
  if(hash(oldRoster)!==hash(newRoster))throw Error('Enemy/party identity or cohort changed');
  if(hash(source.stages.filter(s=>s.metadata.stageId!==18))!==hash(project.stages.filter(s=>s.metadata.stageId!==18)))throw Error('Other stages changed');
  const {b}=createBattle(g,project);if(b.terrain.some(t=>t.id.includes('bell')))throw Error('Bell acquired collision');
  return'Existing 8-step story contract, roster, nonlethal keeper, 1 spirit lamp and other 19 stages preserved';
 });
 check('spawn-support',()=>{const {b,e}=createBattle(g,project);for(const u of b.units.filter(u=>u.side===0)){const hit=e.surface(u.x,u.y-40,u.y+40);if(!hit)throw Error('Missing player support: '+u.id);}return'Four player spawns have real collision support';});
 details.traversal=check('movement-physics',()=>{
  const rows=[];
  for(const hero of ['archer','mage','knight','occultist']){
   const {b,e}=createBattle(g,project),u=b.units.find(u=>u.cls===hero&&u.side===0);b.units=[u];b.active=u.id;e.checkEnd=()=>false;
   const samples=[];let ticks=0,entryJumped=false;
   for(const p of plan.mainRoute.filter(p=>p[0]>u.x&&p[0]<b.width-200&&!(plan.entryJump&&p[0]>plan.entryJump.x&&p[0]<plan.entryJump.x+500))){
    let age=0,stuck=0;
    while(Math.abs(u.x-p[0])>28&&age++<1200){const old=u.x;u.moveLeft=1800;if(plan.entryJump&&!entryJumped&&u.x>plan.entryJump.x&&e.grounded(u))entryJumped=e.jump(u);e.move(Math.sign(p[0]-u.x),1/60);e.tick(1/60);ticks++;
     if(Math.abs(u.x-old)<.08){if(++stuck>8&&e.grounded(u)){e.jump(u);stuck=0;}}else stuck=0;
     if(u.dead||u.y>b.height)throw Error(hero+' fell on '+plan.id);
    }
    if(!e.grounded(u))for(let i=0;i<120&&!e.grounded(u);i++){e.tick(1/60);ticks++;}
    const sample={goal:p,x:Math.round(u.x),y:Math.round(u.y),ticks:age};samples.push(sample);
    if(age>=1200||Math.abs(u.y-p[1])>180)throw Error(hero+' could not reach '+JSON.stringify(sample));
   }
   rows.push({hero,ticks,samples});
  }
  return{method:'Isolated movement/jump fixture, real Engine, unlimited replenished movement, no enemies/turn economy. Not normal combat play.',rows};
 });
 check('upper-chain-shot',()=>{
  for(const power of [.18,.3,.45,.6,.8,1]){
   const {b,e}=createBattle(g,project),u=e.active,site=plan.sites['upper-chain'];b.units=[u];u.x=site.x;u.y=yAt(plan.mainRoute,site.x);u.vx=u.vy=0;e.checkEnd=()=>false;
   const target=b.terrain.find(t=>t.id==='upper-chain'),before=target.hp;
   if(!e.fire('A01',90,power))continue;
   for(let i=0;i<1200&&b.projectiles.length;i++)for(const p of [...b.projectiles])e.stepProjectile(p,1/120);
   if(target.broken||target.hp<before)return{method:'Positioned archer shot fixture, actual fire/stepProjectile collision and terrain damage',power,hpBefore:before,hpAfter:target.hp};
  }
  throw Error('Archer cannot damage upper chain from its authored standing site');
 });
 check('save-compatibility',()=>{const {b}=createBattle(g,project),q=plain(b);if(hash(plain(g.HonroAct2.state(b)))!==hash(plain(g.HonroAct2.state(q))))throw Error('Objective state changed after JSON roundtrip');return'Candidate battle objective state survives JSON roundtrip; active campaign and old saves untouched';});
 check('bell-clearance',()=>{
  const bottom=plan.bell.bottomY,left=plan.bell.x-350*plan.bell.scale,right=plan.bell.x+350*plan.bell.scale,top=bottom-921*plan.bell.scale;
  for(let x=left;x<=right;x+=35){if(yAt(plan.mainRoute,x)<bottom+20)throw Error('Route intrudes on bell base/clearance');if(yAt(plan.roof,x)>top-100)throw Error('Roof intrudes on bell crown');}
  return'Bell body is clear of main-route solids and ceiling';
 });
 if(plan.entryJump)check('lower-route-choice',()=>{
  const rows=[];
  for(const hero of ['archer','mage','knight','occultist'])for(const choice of ['upper','lower']){
   const {b,e}=createBattle(g,project),u=b.units.find(u=>u.side===0&&u.cls===hero);b.units=[u];b.active=u.id;e.checkEnd=()=>false;
   const samples=[];
   for(const direction of [1,-1]){let jumped=false,mid=null,age=0;const finish=direction===1?9900:400;
    while((direction===1?u.x<finish:u.x>finish)&&age++<6000){u.moveLeft=1800;
     if(choice==='upper'&&!jumped&&(direction===1?u.x>plan.entryJump.x:u.x<9390)&&e.grounded(u))jumped=e.jump(u);
     e.move(direction,1/60);e.tick(1/60);if(!mid&&Math.abs(u.x-5000)<15)mid={x:u.x,y:u.y};
    }
    if(age>=6000||!mid)throw Error(hero+' cannot traverse '+choice+' route in direction '+direction);
    const expected=yAt(choice==='upper'?plan.mainRoute:plan.floor,mid.x);
    if(Math.abs(mid.y-expected)>160)throw Error(hero+' chose wrong '+choice+' route in direction '+direction);
    samples.push({direction,mid,ticks:age,jumped});
   }
   rows.push({hero,choice,samples});
  }
  return{method:'Real Engine walk/jump, both routes outbound and return, four heroes; isolated infinite-movement fixture. A timed existing jump chooses the bridge, walking chooses below. Not AI or full combat validation.',rows};
 });
 for(const [name,reason] of [['normal-playthrough','No full unmodified combat clear has been run for this unapproved prototype'],['browser-game-workshop','Browser access is not authorized/available in this task route; offline Canvas is not a browser test'],['performance','Browser performance has not been measured for this candidate']])checks.push({name,status:'blocked',reason});
 return{schemaVersion:1,planId:plan.id,planHash:hash(plan),projectHash:hash(project),checks,details,artisticApproval:false,scope:'Safe prototype checks; technical success never approves the creative design'};
}
