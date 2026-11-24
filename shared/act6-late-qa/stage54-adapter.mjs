import {createStage54ChartOwner} from 'stage54-owner.mjs';
import {ids,chartPins} from 'chart-packet.mjs';
export const sourceSHA='603c83d32b92e381c34449c401da2df6b4db52a594e36083e8d2a1cdb83bd947';
export const stage54=Object.freeze({id:54,act:6,actStage:4,previous:53,authoredId:ids.N,entry:['mage'],parked:['archer','knight','occultist'],exit:['mage'],parkedOnExit:['archer','knight','occultist'],requiresFlags:{'act6.innerStakeAReady':true},terminalFlags:{'act6.invertedGalleryCrossed':true},events:['gravityChart','contextualSkill','tick','interact'],objective:'act6-gallery-charts',name:'거꾸로 선 처마',runtimeReleaseEnabled:false});
const trip=['N>L','L>C','C>L'];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const nativeCast=(a,e,{skill,angle,power,actor,owner})=>{
 const b=e?.b,original=actor?.loadout;
 if(e!==a.engine||e.active!==actor||b.honroStage!==54||owner!==ids.N||skill!=='M09'||!Array.isArray(original)||!e.canAct())return false;
 // Exact App-owned one-attempt ability. Existing Engine.fire, launch charge,
 // collision and focus are authoritative; there is no slot/rank/global setter.
 const desc=Object.getOwnPropertyDescriptor(original,'includes'),before=original.slice(),includes=original.includes;
 try{
  Object.defineProperty(original,'includes',{configurable:true,value:k=>k==='M09'||includes.call(original,k)});
  return e.fire(skill,angle,power)===true;
 }finally{
  if(desc)Object.defineProperty(original,'includes',desc);else delete original.includes;
  if(!same(original,before))throw Error('Stage54 contextual cast changed party kit');
 }
};
export function stage54Adapter(G){
 const C=G.HONRO_CORE,mounted=new WeakMap(),once=new WeakSet();
 async function prepare({descriptor,packet,compiled,previous}){
  if(descriptor.id!==54||descriptor.authoredId!==ids.N||descriptor.playSHA!==chartPins.N[0]||descriptor.worldSHA!==chartPins.N[1]||
   previous.stage!==53||previous.won!==true||previous.flags['act6.innerStakeAReady']!==true||packet.map.units.length!==0||packet.spawn?.x!==250||packet.spawn?.support!=='foothill'||
   !same(compiled.terrain,packet.charts?.N?.terrain)||!same(compiled.worldTerrain,packet.charts?.N?.world))return null;
  const old=previous.crew.mage,x=packet.spawn.x,foot=compiled.terrain.find(t=>t.id===packet.spawn.support);
  if(!old||!foot)return null;
  const y=C.topAt(foot,x);
  const u=C.makeUnit('mage',0,x,y,{...structuredClone(old),id:old.id,x,y,spawnX:x,spawnY:y,moveLeft:old.maxMove,vx:0,vy:0,airborne:false,jumping:false,acted:false});
  if(!C.validTerrainContactPose(compiled.terrain,u))return null;
  const ticket=Object.freeze({});
  const owner=await createStage54ChartOwner({C,domain:G.HonroTerrainDomain,charts:packet.charts,
   verifyMounted:(app,e,t)=>t===ticket&&mounted.get(e)?.app===app,
   verifyIncoming:(app,e,t)=>t===ticket&&mounted.get(e)?.app===app?{stage:53,won:true,flags:previous.flags,mage:old,external:Object.fromEntries(stage54.parked.map(k=>[k,previous.crew[k]]))}:null,
   fireMissionSkill:nativeCast});
  return Object.freeze({ticket,owner,units:[u],story:stage54});
 }
 function attach({app,engine:e,prepared}){
  if(once.has(prepared)||e.b.units[0]!==prepared.units[0]||e.b.units.length!==1)return null;
  once.add(prepared);mounted.set(e,{app});
  const {owner,ticket}=prepared;
  if(!owner.mount(app,e,ticket)){mounted.delete(e);return null;}
  const inspect=()=>owner.inspect(app,e);
  const boundary=()=>{const i=inspect(),u=e.active;
    return !!i&&i.frame==='L'&&i.chart.length===3&&!i.pending&&!i.m09&&!!u&&u.x>=2334&&u.x<=2340;};
  function chart(id){return owner.chart(app,e,id);}
  function interact(){
   const i=inspect(),next=trip[i?.chart.length];return next?chart(next):{ok:false,reason:'세 진목을 건넜습니다. 돌턱에서 진목을 조준하십시오.'};
  }
  function context(command,angle,power){
   if(command==='available')return boundary();
   if(command!=='M09'||!boundary())return {ok:false,reason:'돌턱 진목을 놓을 수 없는 자리입니다.'};
   return owner.relay(app,e,{angle,power});
  }
  return Object.freeze({gravityChart:chart,contextualSkill:context,interact,tick:()=>owner.observe(app,e),
    project:()=>{
      const p=owner.project(app,e),i=inspect(),next=trip[i?.chart.length];
      return {...p,appActions:{chart:next&&!i.pending?next:null,cast:boundary()?'M09':null}};
    },
    terminal:()=>owner.terminal(app,e)});
 }
 return Object.freeze({prepare,attach,sourceSHA});
}
