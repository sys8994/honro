/** 16장 검사용 호위 우선 입력과 읽기 전용 계측. 게임 상태를 직접 설정하지 않는다. */
export function escortPacing({g,e,app,nav,attack,heal,record,tick,ready}){
 const C=g.HONRO_CORE,b=e.b,ids=['objective','resident-1'],rows=new Map();let last=new Map(),finished=false;
 const monks=()=>ids.map(id=>e.unit(id)).filter(u=>u&&!u.dead&&u.hp>0),alive=u=>u&&!u.dead&&u.hp>0,dist=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y),mission=()=>g.HonroAct2.current(b)?.id;
 const row=u=>{const key=b.round+':'+u.id;let r=rows.get(key);if(!r){r={round:b.round,id:u.id,from:{x:u.x,y:u.y},to:{x:u.x,y:u.y},startMove:u.moveLeft,endMove:u.moveLeft,walkCost:0,jumpCost:0,jumps:0,distance:0,seconds:{moving:0,budgetExhausted:0,bodyContact:0,arrived:0,other:0},contacts:new Set()};rows.set(key,r);}return r;};
 const tracked=u=>ids.includes(u?.id)&&e.unit(u.id)===u&&g.HonroAct2.memory(b).done.witness&&!finished;
 const walk=e.walk;e.walk=function(u,...args){const before=tracked(u)?u.moveLeft:null,value=walk.call(e,u,...args);if(before!==null)row(u).walkCost+=Math.max(0,before-u.moveLeft);return value;};
 const jump=e.jump;e.jump=function(u=e.active){const before=tracked(u)?u.moveLeft:null,value=jump.call(e,u);if(before!==null&&value){const r=row(u);r.jumpCost+=Math.max(0,before-u.moveLeft);r.jumps++;}return value;};
 function contact(u){return b.units.filter(v=>v!==u&&alive(v)&&!v.honroObjectiveTarget&&!v.eaterCapturedBy&&Math.abs(u.x-v.x)<=u.r+v.r+3&&u.y>=v.y-v.h-3&&u.y-u.h<=v.y+3);}
 function afterTick(dt){if(finished||!g.HonroAct2.memory(b).done.witness)return;for(const u of monks()){const r=row(u),p=last.get(u.id)||{x:u.x,y:u.y},distance=dist(p,u),touch=contact(u);r.to={x:u.x,y:u.y};r.endMove=u.moveLeft;r.distance+=distance;for(const v of touch)r.contacts.add(v.id);
  const arrived=Math.abs(u.x-5650)<=180&&Math.abs(u.y-4250)<20&&e.grounded(u)&&!touch.length;
  const category=distance>.001?'moving':arrived?'arrived':u.moveLeft<=5?'budgetExhausted':b.honroState.templeEscort?.actors[u.id]?.blocked||touch.length?'bodyContact':'other';r.seconds[category]+=dt;last.set(u.id,{x:u.x,y:u.y});}
  if(g.HonroAct2.memory(b).done['temple-escort'])finished=true;
 }
 function at(x,npc){const q=b.honroState.templeEscort?.actors[npc?.id],cloister=q?.cloister;
  const id=cloister&&x>=3020&&x<4240?'tm-cloister-stair':cloister&&x<4820&&x>=4240?'tm-cloister-landing':cloister&&x>=4820&&x<=5560?'tm-hall-side-gallery':x<=3460?'tm-shelter-veranda':x<3500?'tm-processional-bridge':x<4600?'tm-processional-upper':'tm-great-hall-plinth',t=b.terrain.find(t=>t.id===id);return{x,y:C.topAt(t,x)};
 }
 function dangers(){const ns=monks(),out=[];for(const v of e.alive(1).filter(v=>g.HonroAct2.visible(b,v))){let reason=null,priority=Infinity;
  for(const n of ns){if(v.x>=n.x-30&&v.x<=Math.min(n.x+800,5800)){const p=at(v.x,n);if(Number.isFinite(p.y)&&v.y>p.y-n.h&&v.y-v.h<p.y){reason='route-body';priority=Math.min(priority,dist(v,n));}}
   if(reason||dist(v,n)>1200)continue;
   for(const s of v.loadout.map(id=>C.SKILLS[id]).filter(s=>s?.damage>0&&e.cooldownLeft(v,s.id)<=0&&e.manaCost(s,v)<=v.focus)){
    let threatens=false;for(const aim of e.shotSeeds(v,s,n)){const hit=e.predict(v,s,aim.angle,aim.power,n,false),radius=e.effective(s,v).radius;if(hit.unit===n.id||radius>0&&Math.hypot(hit.x-n.x,hit.y-(n.y-n.h*.5))<radius+n.r){threatens=true;break;}}
    if(threatens){reason='npc-sightline';priority=Math.min(priority,dist(v,n));break;}
   }
  }if(reason)out.push({unit:v,reason,priority});}
  return out.sort((a,z)=>Number(z.reason==='route-body')-Number(a.reason==='route-body')||a.priority-z.priority);
 }
 function select(goal,m){if(e.active?.retreat)return;const available=e.heroesAlive().filter(u=>!u.acted);let chosen;
  if(goal?.id==='monk')chosen=available.find(u=>u.cls==='occultist');
  if(['hall','record'].includes(goal?.id))chosen=available.sort((u,v)=>{const score=h=>dist(h,m)-(e.surface(h.x,h.y-5,h.y+5)?.t.id==='tm-great-hall-plinth'?5000:0);return score(u)-score(v);})[0];
  if(chosen)e.select(chosen.id);
 }
 function step(goal,m){select(goal,m);const u=e.active;if(!u||!ready())return;
  const interact=()=>m?.action&&g.HonroInteractions.eligibility(app,m).ok&&g.HonroInteractions.use(app,m);
  const before={x:u.x,y:u.y,move:u.moveLeft,focus:u.focus,retreat:!!u.retreat};if(interact()){record({op:'E',hero:u.cls,target:m.id,decision:before});nav.clear(u.id);return;}
  const risks=dangers();let point=m;
  if(goal?.id==='monk'&&u.cls!=='occultist')point={...at(Math.min(3650,2950+({knight:350,mage:480,archer:700}[u.cls]||350))),id:'guard-rescue-'+u.cls};
  if(goal?.id==='temple-escort'){const lead=monks().sort((a,z)=>z.x-a.x)[0],offset={knight:300,mage:450,archer:600,occultist:400}[u.cls]||400;let x=Math.min(6050,lead.x+offset);if(x>5300)x=6050;point={...at(x,lead),id:'guard-evacuation-'+u.cls};}
  record({op:'decision',hero:u.cls,goalBefore:goal?.id,position:before,target:point?{id:point.id,x:point.x,y:point.y}:null,risks:risks.map(r=>({id:r.unit.id,reason:r.reason}))});
  if(point)nav.advance(u,point);if(!ready())return;if(interact()){record({op:'E',hero:u.cls,target:m.id,decision:before});nav.clear(u.id);return;}
  // Interactions/evidence take precedence over unrelated attacks in the opened room.
  const targets=dangers().filter(r=>dist(r.unit,u)<1700);for(const r of targets)if(attack(u,r.unit)){record({op:'escort-engagement',hero:u.cls,target:r.unit.id,reason:r.reason,moveBefore:before.move,moveAfter:u.moveLeft});return;}
  if(heal(u))return;
  if(goal?.id==='temple-escort'&&monks().some(n=>n.moveLeft>5)){
   const start=monks().map(n=>({id:n.id,x:n.x,y:n.y}));let count=0;for(;count<60&&ready()&&!['won','lost'].includes(b.phase);count++){tick();if(app.dialogue)break;}
   const progress=monks().some(n=>{const p=start.find(v=>v.id===n.id);return p&&dist(n,p)>.1;});record({op:'observe-evacuation',hero:u.cls,seconds:count*C.STEP,progress});if(progress||!ready())return;
  }
  record({op:'defend',hero:u.cls,decision:before,moveAfter:u.moveLeft,reason:targets.length?'no-safe-shot':'no-route-threat'});app.defend();
 }
 return{step,afterTick,snapshot:()=>({scope:'게임 상태 직접 변경 없음. NPC 예산/몸 접촉/이동은 실제 엔진 tick에서 읽음. 위험 사선은 현재 보이는 적의 정상 예측만 사용. 관찰 대기는 정상 aim phase에서 실제 NPC가 움직이는 동안만 기록.',npcs:ids.map(id=>{const u=e.unit(id);return{id,maxMove:u.maxMove,walkSpeed:u.walkSpeed};}),rounds:[...rows.values()].map(r=>({...r,contacts:[...r.contacts]}))})};
}
