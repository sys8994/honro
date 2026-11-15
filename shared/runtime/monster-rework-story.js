(function(G){'use strict';

// These optional field lines respond to effects that really happened in the current battle.
const lines={
 geuseundae:{
  windup:[[4],['담허','가까이 가니 몸을 부풀리는군. 한 걸음 물러서게.']],
  recover:[[4],['설오','다시 작아졌습니다. 지금 지나가겠습니다.']]
 },
 muyeo:{link:[[5],['담허','저것이 손으로 짚으니 다른 놈이 따라드는군. 둘 사이를 끊게.']]},
 dokkaebibul:{merge:[[9],['설오','흩어졌던 불이 한데 붙었습니다. 한 번에 달려들지 마십시오.']]},
 eoduksini:{
  grow:[[12,13],['소단','맞고도 더 커졌어요. 멀쩡한 놈부터 잡아요.'],['설오','맞을수록 몸집이 커집니다.']],
  shrink:[[12,13],['휘겸','손을 떼니 줄어드는군. 거리를 두시오.'],['담허','손을 떼 두니 저 그림자가 줄어드는군.']]
 },
 sonmalmyeong:{spread:[[14,15,16,17],['소단','저 매듭이 옆 사람에게도 옮았어요. 서로 떨어져요.']]},
 dueoksini:{recover:[[22,28],['휘겸','저 팔이 멈췄소. 다시 쳐들기 전에 갑시다.'],['설오','저 팔이 멈췄습니다. 지금 쏘겠습니다.']]},
 gaekgwi:{attach:[[24,25,26,27],['소단','어깨에 붙었어요. 서로 가까이 가서 떼어 줘요.'],['담허','어깨에 붙은 것이 보이나. 서로 곁에서 살피세.']]},
 yagwanggwi:{steal:[[28],['휘겸','보급품을 낚아챘소. 시야에서 놓치지 마시오.'],['설오','보급품을 집어 갔습니다. 저쪽으로 달아납니다.']]},
 mulgwishin:{windup:[[32,33,34],['담허','물 밑에서 손이 뻗어 오네. 물가에서 물러서게.']]},
 geuseunsae:{seal:[[35,37,38],['소단','저 새가 방금 쓴 술법을 물고 늘어져요. 다른 걸 써 봐요.'],['담허','방금 쓴 기운이 끊겼네. 다른 수를 쓰세.']]},
 naruWarden:{windup:[[3],['담허','저 팔이 나루 바닥을 쓸겠네. 발붙일 자리를 남겨 두게.']]},
 bridgeWarden:{windup:[[6],['휘겸','위를 보시오. 잔해가 떨어질 자리요. 운반대 길은 비워 둡시다.']]},
 marksman:{windup:[[22,33,35],['설오','저 사수가 한곳을 오래 겨눕니다. 쏘기 전에 옮겨야겠습니다.']]},
 vanguard:{windup:[[21,23,30,37],['휘겸','방패가 돌아가는 쪽을 보시오. 저 길목에서 비킵시다.'],['설오','방패를 내밀고 이쪽으로 몸을 돌립니다. 길을 비우겠습니다.']]},
 device:{recover:[[13,15,17],['설오','멈췄습니다. 다시 움직이기 전에 지나가겠습니다.']]},
 pursuer:{windup:[[38],['담허','건너오는 자리를 보게. 내려앉기 전에 옆으로 비키세.']]}
};
const shown=new WeakMap();
const alive=u=>u&&!u.dead&&u.hp>0;
const active=(app,b)=>b?.honroMonsterReworkRevision===1&&!b.honroCustom&&app.screen==='battle'&&
 !app.training&&!app.done&&b.honroStage>=1&&b.honroStage<=40&&!['won','lost'].includes(b.phase);
function visible(app,u){
 const s=app.scene,canvas=s?.canvas;
 if(!canvas||!s.scale)return false;
 if(G.HonroAct2?.active?.(app.engine.b)&&!G.HonroAct2.visible(app.engine.b,u))return false;
 return Math.abs((u.x-s.x)*s.scale)<canvas.clientWidth/2&&
  Math.abs((u.y-u.h*.5-s.y)*s.scale)<canvas.clientHeight/2;
}
function observe(app,b,{id,kind,phase,targetId}){
 if(app.engine?.b!==b||!active(app,b)||app.dialogue||G.document?.hidden)return false;
 const row=lines[kind]?.[phase],key=kind+':'+phase;
 const actor=app.engine.unit(id),target=targetId&&app.engine.unit(targetId);
 if(!row?.[0].includes(b.honroStage)||!alive(actor)||actor.side!==1)return false;
 const source=phase==='attach'&&alive(target)?target:actor;
 if(!visible(app,source))return false;
 const state=b.honroState;
 const observations=state.monsterObservations??={seen:[],pending:null};
 if(observations.seen.includes(key)||observations.pending)return false;
 const line=row.slice(1).find(([who])=>app.speakerUnits(who).some(u=>alive(u)&&Math.hypot(u.x-source.x,u.y-source.y)<1200));
 if(!line)return false;
 observations.pending={key,round:b.round,id,line,phase};
 app.dirty=true;
 return true;
}
function tick(app,now,node){
 const b=app.engine?.b;
 if(!node||!active(app,b)||app.dialogue||app.modal?.classList.contains('open')||G.document?.hidden||
  G.HonroAct3Void?.blocked(b)||b.honroAct4PreviewState?.bark)return false;
 const state=b.honroState.monsterObservations;
 if(!state)return false;
 let current=shown.get(app);
 if(current?.battle!==b||current.until<=now||!app.canSpeak(current.line[0])){
  shown.delete(app);
  current=null;
 }
 const next=state.pending;
 if(!current&&next){
  state.pending=null;
  app.dirty=true;
  if(next.round>=b.round-1&&app.canSpeak(next.line[0])&&(next.phase!=='windup'||alive(app.engine.unit(next.id)))){
   state.seen.push(next.key);
   current={battle:b,...next,until:now+Math.max(3000,Math.min(5200,2200+next.line[1].length*60))};
   shown.set(app,current);
  }
 }
 if(!current)return false;
 if(node.dataset.monsterObservation!==current.key){
  const name=G.document.createElement('strong');
  name.textContent=current.line[0];
  node.replaceChildren(name,G.document.createTextNode(' '+current.line[1]));
  node.dataset.monsterObservation=current.key;
  node.setAttribute('role','status');
  node.setAttribute('aria-live','polite');
 }
 node.hidden=false;
 return true;
}
G.HonroMonsterReworkStory={observe,tick};
})(globalThis);
