import {createStage55EmptyBell,STAGE55 as D} from './stage55-owner.mjs';
export const sourceSHA='cb9009674cc3848aff0e5d93877f55a2403ad60a46c6ef29c93f6eb3ccec6e62';
export const stage55=Object.freeze({id:55,act:6,actStage:5,previous:54,authoredId:'stage-55',entry:['knight','archer','occultist'],parked:['mage'],
 exit:['knight','archer','occultist'],parkedOnExit:['mage'],requiresFlags:{'act6.invertedGalleryCrossed':true},terminalFlags:{'act6.outerAnchorBellReady':true,'act6.outerThreeAnchorsReady':true},
 events:['interact','nativeRelease','nativeImpact','tick'],objective:D.objective,name:'빈 종터의 방어선',runtimeReleaseEnabled:false});
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const ground=(C,geometry,support,x)=>C.topAt(geometry.find(t=>t.id===support),x);
export function stage55Adapter(G){
 const C=G.HONRO_CORE,mounted=new WeakMap(),once=new WeakSet();
 async function prepare({descriptor,packet,compiled,previous}){
   const prev=previous?.boundary, mage=previous?.crew?.mage;
   if(descriptor.id!==55||descriptor.playSHA!==D.shape.playSHA||descriptor.worldSHA!==D.shape.worldSHA||packet.map.units.length||
      previous?.stage!==54||previous.flags?.['act6.invertedGalleryCrossed']!==true||!Array.isArray(prev?.chart)||
      !same(prev.chart.map(q=>q.id),['N>L','L>C','C>L'])||!prev.chart.every(q=>q.grounded&&q.actor===mage?.id)||
      !Number.isInteger(prev.relay?.shot)||prev.relay.y!==2930||!mage||mage.cls!=='mage')return null;
   if(!same(packet.slots.map(q=>[q[0],q[1]]),stage55.entry.map(r=>[r,D.entry[r][0]]))||packet.foes?.length!==4||packet.foes.some((y,i)=>y.id!=='draft-pressure-'+i))return null;
   const players=stage55.entry.map(cls=>{
    const old=previous.crew[cls],[x,support]=D.entry[cls],y=ground(C,compiled.terrain,support,x);
    return C.makeUnit(cls,0,x,y,{...structuredClone(old),x,y,spawnX:x,spawnY:y,moveLeft:old.maxMove,vx:0,vy:0,airborne:false,jumping:false,acted:false});
   });
   const foes=packet.foes.map(({origin,...spec})=>C.makeUnit(spec.cls,1,spec.x,spec.y,{...structuredClone(spec),spawnX:spec.x,spawnY:spec.y,vx:0,vy:0,airborne:false,jumping:false,awake:true,acted:false}));
   if([...players,...foes].some(u=>!C.validTerrainContactPose(compiled.terrain,u)))return null;
   const permit=Object.freeze({}),incoming=Object.freeze({stage:54,won:true,settlement:false,flags:previous.flags,mage,chart:prev.chart,relay:prev.relay,
    external:Object.fromEntries(stage55.entry.map(k=>[k,previous.crew[k]]))});
   const owner=await createStage55EmptyBell({C,packet:{terrain:compiled.terrain,world:compiled.worldTerrain},
    verifyMounted:(app,e,t)=>t===permit&&mounted.get(e)?.app===app,
    verifyIncoming:(app,e,t,n)=>t===permit&&n===55&&mounted.get(e)?.app===app?incoming:null,
    verifyImpact:(app,e,...args)=>{const a=mounted.get(e);return a?.app===app&&a.hit?.length===args.length&&a.hit.every((v,i)=>v===args[i]);}});
   return Object.freeze({permit,owner,units:[...players,...foes],story:stage55,parked:{mage}});
 }
 function attach({app,engine:e,prepared}){
   if(once.has(prepared)||e.b.units.length!==prepared.units.length||!e.b.units.every((v,i)=>v===prepared.units[i]))return null;
   once.add(prepared);
   const live={app,hit:null};mounted.set(e,live);
   const {owner,permit}=prepared;
   if(!owner.mount(app,e,permit)){mounted.delete(e);return null;}
   const fire=e.fire.bind(e),impact=e.impact.bind(e);
   e.fire=(...args)=>{
    const fired=fire(...args);
    if(fired)for(const p of e.b.projectiles)owner.observeRelease(app,e,p);
    return fired;
   };
   e.impact=(p,h)=>{
    const beforeHp=h?.unit?.hp,ret=impact(p,h);
    if(h?.unit){
     const afterHp=h.unit.hp;live.hit=[p,h,beforeHp,afterHp];
     try{owner.observeImpact(app,e,{projectile:p,hit:h,beforeHp,afterHp});}finally{live.hit=null;}
    }
    return ret;
   };
   function interact(id){
    const s=owner.project(app,e),target=s?.targets?.[0]?.id;
    if(!target||id&&id!==target)return {ok:false,reason:'현재 종터의 목표가 달라졌습니다.'};
    return owner.interact(app,e,target);
   }
   return Object.freeze({interact,tick:()=>owner.project(app,e),
    project:()=>owner.project(app,e),parkedAtExit:()=>prepared.parked,
    terminal:()=>{
     const r=owner.terminal(app,e);return r&&{...r,actors:[...r.actors,r.parkedMage]};
    }});
 }
 return Object.freeze({prepare,attach,sourceSHA});
}
