export const owner56=Object.freeze({
 id:56,authoredId:'qa-act6-06',storyOwner:'act6-story-garmjin-06',sourceSHA:'80fec443ef0d8bae2184450fd2fc327bee113cf16c2c161ab6b5f2e20c47822b',assetSHA:'778c0bab54b56bf53af02344b79f1875d048f46baba442563a71e829be56d041',playSHA:'c17aa19e1f126fc442da441d532fa559e683ca5cf8cfde99e5f26956e9638662',worldSHA:'cbdb034494d220c5bd6dc6d51388b558e461219a0e3fa96afe9fa3bee8d0b51e',runtimeReleaseEnabled:false
});
const keyed=new WeakSet(),kList=['firstStake','secondStake','firstActivationComplete','boundaryNarrowed','firstGarmjinFailed','temporaryPassageOpen','eastReturnObserved'];
const E='E-joined-ordinary-floor',B='B-central-lower-floor',B2='B-02-center-lower-short-climb',flowId='act6-06-local-failure-reflow';
const j=JSON.stringify,same=(a,b)=>j(a)===j(b),strip={left:3080,right:3280,y:3840};
const reject=reason=>({accepted:false,reason});
const transient=new Set(['x','y','spawnX','spawnY','airborne','jumping','acted','vx','vy','moveLeft','fallApexY']);
const sameActor=(a,p)=>[...new Set([...Object.keys(a),...Object.keys(p)])].every(k=>transient.has(k)||same(a[k],p[k]));
// Engine-only port. Retain factory & owner capability in App's private launch path.
export function createStage56Owner({authorize,previousOutcome,projectScene=()=>{},isDetachedFixture=()=>false}){
 if(typeof authorize!=='function'||typeof previousOutcome!=='function')throw TypeError('private stage56 App capability required');
 return function mountStage56({G,engine:e,packet,scope,previous,observe=()=>{},onResult=()=>{},exitGate=null,reflowActor=null}={}){
 if(scope?.enabled!==true)return reject('off');
 if(scope.integerStageKey!==56||scope.storyOwner!==owner56.storyOwner||!authorize({engine:e,packet,scope})||packet?.playSHA!==owner56.playSHA||packet?.worldSHA!==owner56.worldSHA)return reject('owner mismatch');
 const b=e?.b,auth=b?.honroAuthoredId,core=G?.HONRO_CORE,fixture=isDetachedFixture({engine:e,packet,scope})===true;
 if(!b||!core||!(e instanceof core.Engine)||keyed.has(e))return reject('native owner or duplicate');
 if(!fixture&&!(b.honroCanonical===true&&b.honroMapOrigin==='campaign'&&b.honroCustom===false&&b.mode==='campaign'&&b.honroStage===56&&b.stage===56&&packet.authoredId==='stage-56'&&auth===packet.authoredId&&scope.embedded===false&&scope.debug===false&&scope.training===false&&scope.custom===false))return reject('not a canonical App mount');
 if(fixture&&auth!==owner56.authoredId)return reject('proof fixture identity mismatch');
 const u=b.units.filter(x=>x.side===0&&!x.summoned),p=previous?.parkedActor;
 if(u.length!==1||u[0].cls!=='mage'||!p||p.cls!=='mage'||typeof p.id!=='string'||!p.id||p.equipmentState?.version!==1||!sameActor(u[0],p))return reject('parked full actor mismatch');
 const resolvedGap=b.units.find(x=>x.id==='draft-pressure-0'&&x.side===1&&x.x===1936&&x.role==='leaper'&&x.h===88&&x.r===32&&x.loadout?.includes('HBM01'));
 const m=u[0], [art]=b.honroLandmarks??[], reach=b.honroObjectives?.find(x=>x.id==='draft-arrival-06');
 if(!packet.terrain||!same(packet.terrain,b.terrain)||!packet.world||!same(packet.world,b.honroWorldTerrain)||
 b.honroLandmarks.length!==1||art?.assetId!=='ch06-v5-local-native-art'||!['L0','L1'].includes(art?.depthLayer)||art?.asset?.visual?.length!==725||art.collisionIds.length!==0||
 reach?.type!=='reach'||reach.x!==6400||reach.y!==3368||reach.radius!==84||(b.honroGrowth&&!(scope.quotedZero===true&&!fixture&&b.honroGrowth.limit?.total===0&&b.honroGrowth.limit?.combat===0))||b.phase!=='aim'||b.round!==1||b.shot!==0||b.teamEnds?.some(n=>n!==0)||b.physics?.regions?.some(x=>x.id===flowId))return reject('compiled scene mismatch');
 const eligibleRemote=flag=>previousOutcome(previous,flag,e,packet)===true;
 if(!eligibleRemote('act6.outerThreeAnchorsReady'))return reject('missing actual 55 capability owner');
 if(!fixture&&!(reflowActor?.side===1&&reflowActor.id==='draft-pressure-3'&&!reflowActor.dead&&reflowActor.hp>0&&!b.units.includes(reflowActor)))return reject('missing authored reserved pressure actor');
 keyed.add(e);
 const flags=Object.fromEntries(kList.map(k=>[k,false])),order=[],events=[],action=()=>b.phase==='aim'&&e.active===m&&e.canAct()&&m.hp>0&&!m.dead&&!b.projectiles?.length;
 const support=()=>e.contactSurface(m.x,m.y-3,m.y+4)?.t.id,live=()=>e.grounded(m),near=(x,id,r=180)=>live()&&support()===id&&Math.abs(m.x-x)<=r;
 let seeded=null,ward=null,reflow=null,done=false,oldExit=false,scopeFrame='quiet',seconds=0,gapAttackAt=null,terminal=null;
 const oldFire=e.fire.bind(e);e.fire=(...args)=>{const who=e.active,result=oldFire(...args);if(result&&resolvedGap&&who===resolvedGap&&args[0]==='HBM01')gapAttackAt=seconds;return result;};
 const emit=(k)=>{if(!flags[k]){flags[k]=true;order.push(k);observe(k);}};
 const say=(x)=>e.message(x);
 const probe={x:5200,y:3940,drag:1,wind:0,gravityScale:0};
 const measure=()=>e.forceSample(probe).x;
const fieldsBefore=()=>structuredClone(b.physics?.regions??[]);
 const setFlow=(vx)=>{
  const others=(b.physics?.regions??[]).filter(r=>r.id!==flowId);
  e.setEnvironment({regions:[...others,{id:flowId,x:4910,y:3800,w:510,h:380,gravity:{x:0,y:320},flow:{x:vx,y:0},dragScale:1,projectileOnly:true}]});
  return measure();
 };
 function act(key){
  if(done||!action())return false;
  if(key==='stakeA'&&!flags.firstStake&&near(1872,'A-upper-veranda')){emit('firstStake');return true;}
  if(key==='stakeB'&&!flags.secondStake&&flags.firstStake&&near(3600,B2)){emit('secondStake');return true;}
  if(key==='activate'&&!flags.firstActivationComplete&&flags.secondStake&&near(5200,E)&&eligibleRemote('act6.outerThreeAnchorsReady')){
   const previousRegions=fieldsBefore(),before=measure(),forward=setFlow(145);if(!(forward>before+30)){e.setEnvironment({regions:previousRegions});return false;}
   seeded={point:{x:m.x,y:m.y},turn:b.round,forward,before};
   scopeFrame='forward';projectScene({id:56,phase:'forward',focus:{x:m.x,y:m.y},sample:forward});emit('firstActivationComplete');
   say('소단: 바깥 세 곳이 이어졌어요. 흐름이 저쪽으로 돌아갔는지 돌턱에서 확인해 주세요.');
   events.push({key:'first-activation',pose:seeded.point,forward,before});return true;
  }
  if(key==='readNarrowing'&&seeded&&!flags.firstGarmjinFailed&&flags.firstActivationComplete&&near(5050,E,150)&&Math.abs(m.x-seeded.point.x)>=95){
   const previousRegions=fieldsBefore(),still=setFlow(0),reverse=setFlow(-145);
   if(!(Math.abs(still-seeded.before)<1&&reverse<still-30&&seeded.forward>still+30)){e.setEnvironment({regions:previousRegions});return false;}
   if(reflowActor){
    if(b.units.some(x=>x.id===reflowActor.id)||!e.grounded(reflowActor)||!core.validTerrainContactPose(b.terrain,reflowActor)){e.setEnvironment({regions:previousRegions});return false;}
    b.units.push(reflowActor); // one previously compiled authored pressure row, no HP setter
    e.refreshActivation();
   }
   scopeFrame='reverse';projectScene({id:56,phase:'reverse',focus:{x:m.x,y:m.y},sample:[seeded.forward,still,reverse]});
   events.push({key:'native-reversal',pose:{x:m.x,y:m.y},support:support(),front:seeded.forward,stopped:still,reversed:reverse,method:'stock Engine forceSample on the live region, not a countdown'});
   emit('boundaryNarrowed');emit('firstGarmjinFailed');
   say('소단: 너무 좁아졌어요. 혼로가 역류해요. 낮은 턱에서 비킨 뒤 임시 길을 여세요.');
   return true;
  }
  if(key==='warnShelf'&&(!ward||reflow==='inside-at-live-pressure')&&flags.firstGarmjinFailed&&near(3264,B,48)&&m.x>=strip.left&&m.x<=strip.right){
   const a=b.units.find(x=>x.id==='draft-pressure-3'&&x.side===1&&!x.dead&&x.hp>0);
   if(!a||!e.contactSurface(a.x,a.y-4,a.y+16))return false;
   ward={id:a.id,pose:{x:m.x,y:m.y},visitedStrip:m.x>=strip.left&&m.x<=strip.right,turn:b.round,firstShot:b.shot};
   reflow='warned';projectScene({id:56,phase:'warned',focus:{x:m.x,y:m.y},strip:{...strip}});events.push({key:'shelf-warn',pose:ward.pose});
   say('담허: 이 돌틈으로 역류하는군. 낮은 턱 끝까지 비켜야겠네.');return true;
  }
  if(key==='open'&&!flags.temporaryPassageOpen&&flags.firstGarmjinFailed&&reflow==='evaded'&&near(3176,B,180)){emit('temporaryPassageOpen');return true;}
  if(key==='returnEast'&&!flags.eastReturnObserved&&flags.temporaryPassageOpen&&near(5200,E)){emit('eastReturnObserved');return true;}
  return false;
 }
 const nativeTick=e.tick.bind(e);
 e.tick=(dt)=>{
  seconds+=dt;
  if(ward&&reflow==='warned'&&b.side===1&&b.active===ward.id&&b.phase==='enemy'&&b.round>=ward.turn){
   if(live()&&support()===B&&m.x<strip.left-10&&Math.abs(m.x-ward.pose.x)>120){
    reflow='evaded';events.push({key:'native-evade',pose:{x:m.x,y:m.y},support:support(),opponent:b.active,phase:b.phase,round:b.round,actorSetter:false});
   }else{
    reflow='inside-at-live-pressure';events.push({key:reflow,pose:{x:m.x,y:m.y},round:b.round});
   }
  }
  return nativeTick(dt);
 };
 function observePosition(){
  if(done)return true;
  if(m.dead||m.hp<=0){done=true;terminal=Object.freeze({id:56,stage:56,won:false,settlement:false,reason:'darmheo-unable-to-continue'});onResult(terminal);return true;}
  const reach=G.HonroAuthored.objectiveState(b);
  if(!oldExit&&reach.complete&&kList.every(k=>flags[k])&&live()&&support()===E&&reflow==='evaded')oldExit=true;
  if(!oldExit)return false;
  const interior=exitGate?.(m);
  if(exitGate&&!interior)return false;
  done=true;terminal=Object.freeze({id:56,stage:56,won:true,settlement:false,actors:Object.freeze([structuredClone(m)]),
   flags:Object.freeze({'act6.firstGarmjinFailed':true,'act6.temporaryPassageEscaped':true}),...(interior?{interiorD:structuredClone(interior)}:{})});
  observe('exitReached');onResult(terminal);return true;
 };
 return Object.freeze({accepted:true,act,observePosition,terminal:()=>terminal,drawOwner:actor=>resolvedGap===actor?Object.freeze({id:'act6-06-gap-shard-r2-local',secondsAfterAttack:gapAttackAt===null?null:seconds-gapAttackAt}):null,read:()=>({flags:{...flags},order:[...order],events:structuredClone(events),reflow,scopeFrame,done}),project:()=>({id:56,authoredId:auth,flag:flags.firstGarmjinFailed?'act6.firstGarmjinFailed':null,ready:terminal?.won===true&&flags.eastReturnObserved})});
}

}
