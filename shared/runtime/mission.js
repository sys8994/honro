(function(G){'use strict';
function tick(app,dt){
 const e=app.engine;if(!e||app.training)return;
 if(e.b.honroCustom){G.HonroAuthored.tick(app,dt);return;}
 const b=e.b,st=app.stage,hs=b.honroState,heroes=e.heroesAlive();if(!hs||!heroes.length||['won','lost'].includes(b.phase))return;
 const lead=heroes.reduce((a,c)=>a.x>c.x?a:c),height=Math.min(...heroes.map(h=>h.y)),boundary=b.phase==='transition'&&!b.projectiles.length&&!e.settleBusy();
 for(const m of b.honroMarkers||[]){
   const distance=m.type==='sector'?430:m.type==='relic'?155:180;
   if(heroes.some(u=>Math.hypot(u.x-m.x,(u.y-m.y)*(m.type==='sector'?.6:1))<distance))m.honroPending=true;
   if(!boundary||!m.honroPending)continue;
   if(m.type==='sector'&&!hs.flags['sector-'+m.sector]){hs.flags['sector-'+m.sector]=true;app.event(m.label);}
   if(m.type==='rest'&&!m.collected&&!e.alive(1).some(v=>Math.abs(v.x-m.x)<470&&!v.fixed)){
     m.collected=true;for(const u of G.HonroAllies.coalition(e)){u.hp=Math.min(u.maxHp,u.hp+Math.round(u.maxHp*.30));if(!u.honroCivilian)u.focus=Math.min(u.maxFocus,u.focus+Math.round(u.maxFocus*.40));e.fx('ring',u.x,u.y-u.h*.5,'#a9b892',40);}e.emit('sound',{name:'heal'});app.event('불씨를 지켰다. 동행이 숨을 고른다.');
   }
   if(m.type==='relic'&&!m.collected){m.collected=true;app.event('지워진 이름을 되찾았다.');}
 }
 // Stage 5: Damheo's position is the gate. Leaving the receiving array closes the actual projectile blocker.
 if(st.id===5){const ritual=hs.ritual,veil=b.terrain.find(t=>t.id==='waterfall-veil'),cleat=b.terrain.find(t=>t.id==='cliff-cleat'),marker=b.honroMarkers.find(m=>m.id==='receiver-5'),holder=ritual?.holderId?e.unit(ritual.holderId):null;const valid=!!ritual?.active&&!!holder&&!holder.dead&&holder.hp>0&&holder.cls==='mage'&&!!marker&&Math.abs(holder.x-marker.x)<=125&&Math.abs(holder.y-marker.y)<=80&&e.grounded(holder);if(cleat?.broken){if(ritual)ritual.active=false;hs.waterfallSight=true;if(veil&&!veil.broken){veil.broken=true;b.sceneVersion++;}if(marker)marker.collected=true;}else if(valid){hs.waterfallSight=true;if(veil&&!veil.broken){veil.broken=true;b.sceneVersion++;}}else{if(ritual?.active){ritual.active=false;app.event('담허가 받이진에서 벗어나 물틈이 다시 닫혔다.');}hs.waterfallSight=false;if(veil?.broken){veil.broken=false;b.sceneVersion++;}}}
 const obj=e.unit('objective');
 if(st.objective==='rescue'&&obj&&!obj.dead){
   if(!hs.rescued&&heroes.some(u=>Math.hypot(u.x-obj.x,u.y-obj.y)<205))hs.rescuePending=true;
   if(boundary&&hs.rescuePending&&!hs.rescued){hs.rescued=true;app.event('생존자가 동행의 이름을 기억했다.');}
   if(hs.rescued&&lead.x>obj.x+65&&b.phase!=='ally'){obj.x+=Math.min(dt*360,lead.x-obj.x-60);obj.y=G.HonroWorld.top(b,obj.x,obj.y);}
 }
 if(boundary&&b.side===0&&hs.lastRitualRound!==b.round){
   hs.lastRitualRound=b.round;hs.lastRound=b.round;
   if(st.objective==='ritual'){const k=heroes.find(u=>u.cls==='knight'),altar=b.honroMarkers.find(m=>m.type==='shrine');if(k&&altar&&!b.terrain.some(t=>t.honroSeal&&!t.broken)&&Math.hypot(k.x-altar.x,k.y-altar.y)<330){hs.hold++;app.event(hs.hold>=st.holdRounds?'왕문이 열렸다.':'왕문 의식 · '+hs.hold+'/'+st.holdRounds);}}
 }
 const progress=st.objective==='overwatch'?(obj?.x||0):st.objective==='escort'?Math.max(lead.x,obj?.x||0):lead.x;
 G.HonroEncounters.update(app,dt,{progress,height,broken:b.terrain.filter(t=>t.honroSeal&&t.broken).length,collected:b.honroMarkers.filter(m=>m.type==='relic'&&m.collected).length});
 if(st.objective==='overwatch'&&obj&&!obj.dead&&!e.alive(1).length&&!G.HonroEncounters.pending(b)&&!b.projectiles.length){obj.x=Math.min(b.honroEscortGoalX,obj.x+dt*180);obj.y=G.HonroWorld.top(b,obj.x,obj.y);}
 // Stage 10: Sodan is never killed. Once both receiving arrays are ready and her ward is
 // sufficiently weakened, a new breach arrives from outside her net. That is the narrative proof
 // that she is not the root cause; she changes faction and helps hold the yard.
 if(st.id===10){
   const sodan=e.unit('boss');
   if(sodan&&!sodan.dead&&!hs.sodanCoop&&(hs.receivers||0)>=2&&sodan.hp<=sodan.maxHp*.42&&boundary){
     hs.sodanCoop=true;hs.coopHold=0;hs.lastCoopRound=-1;
     sodan.side=2;sodan.honroAlly=true;sodan.honroCivilian=false;sodan.allyRole='medium';sodan.fixed=false;sodan.acted=true;sodan.shield=Math.max(sodan.shield||0,100);sodan.hp=Math.max(sodan.hp,Math.round(sodan.maxHp*.38));
     b.queue=(b.queue||[]).filter(id=>id!==sodan.id);
     app.sayLines([['설오','동쪽 줄이 갈라집니다. 우리가 건드린 곳이 아닙니다.'],['소단','알아요. 어제부터 저래요. 묶어도, 묶어도 계속 들어와요.'],['담허','소단. 저건 자네 망 안에서 빠져나온 게 아니야. 바깥에서 들어오고 있어.'],['소단','……그럼 내가 잡은 것보다 더 있다고요?'],['담허','두 받이진은 버티고 있네. 가운데만 자네가 잡아주게.'],['소단','……알겠어요. 동쪽에서 오는 건 제가 볼게요.']]);
     const ma=b.honroMapAnchors||{},east=ma.eastHall?.x??Math.min(b.width-1100,3600),edge=ma.outerEast?.x??b.width-500;G.HonroAllies.execute(app,{type:'multi',actions:[{type:'spawn',n:2,x:east,kind:'hound'},{type:'spawn',n:1,x:edge,kind:'stag'},{type:'sniperAmbush',n:1}]});
     app.event('소단이 주박을 거두고 일행과 함께 바깥에서 밀려드는 들림을 막기 시작한다.');
   }
   if(hs.sodanCoop&&boundary&&!e.alive(1).length&&!G.HonroEncounters.pending(b)&&hs.lastCoopRound!==b.round){hs.lastCoopRound=b.round;hs.coopHold=Math.min(2,(hs.coopHold||0)+1);if(hs.coopHold===1)app.event('받이진이 버틴다. 마지막 매듭을 풀 수 있는 틈이 생겼다.');}
 }
 app.checkMission(e);
}
G.HonroMission={tick};
})(globalThis);
