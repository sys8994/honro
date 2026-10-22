(function(G){'use strict';
// Authored blocking, not random movement or inferred gestures from punctuation.
// Story text, triggers, combat and recruitment still belong to their owners.
const cast={
 1:{actor:'npc-woodcutter',scene:'event-1-witness',dx:-56,caption:'수레 뒤에 몸을 숨겼던 나무꾼이 설오의 목소리에 수레 곁으로 몸을 내민다.'},
 3:{actor:'npc-hwigyeom',entry:true,dx:-64,caption:'나루에 남은 검객이 물가에서 한 걸음 나와 일행의 앞길을 막는다.'},
 4:{actor:'npc-chunrye',speaker:'춘례',dx:42,caption:'춘례가 피란문 안에서 걸어 나와 붕대를 쥔 손을 보인다.'}
};
// Existing civilian/escort bodies already represent these people in the scene.
const speakers={13:{'석공':'resident-1'},14:{'주민':'resident-2','중층 주민':'resident-2','길찬':'resident-1'},16:{'승려':'resident-1','노승':'objective'},19:{'동생을 잃은 형':'mourner-brother','언니를 잃은 동생':'mourner-sister'},20:{'주민':'objective','길찬':'convoy-gilchan','석공':'convoy-mason'}};
function speaker(app,who){
 const b=app.engine?.b;if(!b||b.honroCustom)return null;
 // This generic caption belongs to the rescue marker's authored civilian,
 // whose world name is different. Never substitute a class or another NPC.
 if(b.honroStage===11&&who==='주민'){
  const id=b.honroMarkers?.find(m=>m.id==='resident')?.target,u=b.units.find(u=>u.id===id&&u.honroCivilian);
  return u&&!u.dead&&u.hp>0?u:null;
 }
 if(b.honroStaging?.cinematic!==2)return null;
 const fresh14=b.honroStage===14&&b.honroNarrativeRevision===1,id=fresh14&&who==='중층 주민'?(b.honroMarkers?.find(m=>m.id==='family-mid')?.target||'resident-3'):fresh14&&who==='주민'?'objective':speakers[b.honroStage]?.[who],u=b.units.find(u=>u.id===id)||b.honroConvoyActors?.find(u=>u.id===id);return u&&!u.dead&&u.hp>0?u:null;
}
const face=(actor,at,pose='point',camera=false)=>({type:'look',actor,at,pose,camera,scale:camera? .8:undefined,duration:650});
const shot=at=>({type:'look',at,duration:650,scale:.8});
const pose=(actor,kind,at)=>face(actor,at||{actor:'archer'},kind);
const step=(actor,dx)=>({type:'move',actor,to:{origin:actor,dx},duration:850,focus:false});
const toward=(actor,at,distance=48)=>({type:'move',actor,towards:at,distance,duration:950,focus:false});
const rule=(stage,when,who,text,actions)=>({stage,when,who,text,actions});
