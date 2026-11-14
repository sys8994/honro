(function(G){'use strict';
if(!G.HONRO_ACT5_RELEASE)return;
const stages=G.HONRO_ACT5_CONTENT,H=G.HONRO_CONTENT,J=G.HonroJourneyContent,balance=G.HONRO_BALANCE;
const levels=balance.futureActs.find(a=>a.act===5).stageExitLevels;
H.stages.push(...stages);
H.acts.push({id:5,name:'저승이 닿은 산',first:41,last:50});
H.nextAct={id:6,available:false,requires:[50]};
for(const [i,s] of stages.entries()){
 const previous=balance.stages.at(-1);
 balance.stages.push({...previous,id:s.id,act:5,entryLevel:previous.exitLevel,exitLevel:levels[Math.min(i,levels.length-1)],
   initialEnemies:s.enemies,maxAlive:s.enemies,activeEnemies:s.active,targetRounds:s.rounds});
 const exterior=s.id<46||s.id===50;
 J.places.push({stageId:s.id,region:'저승이 닿은 산',place:s.place,event:s.name,
   layer:exterior?'mountain':'city',variant:exterior?'forest':'river',restName:s.name,restDescription:''});
}
const required=J.required,optional=J.optional,transition=J.transitionAfter;
J.required=(p,id)=>id>=41||id==null&&p.cleared[50]?[]:required(p,id);
J.optional=(p,id,...args)=>id>=41||id==null&&p.cleared[50]?[]:optional(p,id,...args);
J.transitionAfter=id=>id>=40&&id<50?'direct':transition(id);
Object.defineProperty(J,'ending',{configurable:true,value:{stageId:50,region:'저승이 닿은 산',place:'무명사 산문',event:'무명사에 닿다',layer:'mountain',variant:'forest',
 restName:'무명사 산문',restDescription:'',endingTitle:'산이 끊긴 곳',nextText:'다음 여정은 준비 중입니다.'}});
})(globalThis);
