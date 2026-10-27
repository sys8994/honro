(function(G){'use strict';
const F=G.HonroAct3V4ReviewedCore,V=G.HonroAct23V4,C=G.HONRO_CORE,unit=(b,id)=>b.units.find(u=>u.id===id),ground=(b,u)=>V.alive(u)&&C.validTerrainContactPose(b.terrain,u);let R,militaryPath;
const mem=b=>R.memory(b),root=b=>V.mem(b),carrier=b=>unit(b,'act3-carrier'),spec=b=>b.honroReviewed23Spec;
const nearFoes=(b,p,r=340)=>b.units.filter(u=>u.side===1&&V.alive(u)&&!u.honroObjectiveTarget&&V.near(u,p,r));
function nextPoint(b){const key=V.current(b)?.id,points=b.honroMarkers.filter(p=>p.id.startsWith('route:'+key+':')).sort((a,z)=>Number(a.id.split(':').at(-1))-Number(z.id.split(':').at(-1))),i=root(b).escortWaypoints?.[key+':act3-carrier']||0;return points[i]||V.marker(b,key);}
function blocked(b){const u=carrier(b),p=nextPoint(b);return root(b).carrierStarted&&V.alive(u)&&!root(b).carrierGoals?.['dock-exit']&&(nearFoes(b,u,300).length>0||p&&nearFoes(b,p,300).length>0);}
function safe(b){const u=carrier(b),goal=V.marker(b,'dock-exit');return ground(b,u)&&!!root(b).carrierGoals?.['dock-exit']&&V.near(u,goal,110)&&!nearFoes(b,goal,500).length&&(mem(b).proof.walk?.distance||0)>=Math.abs(goal.x-spec(b).start.x)-200;}
function returnSafe(app){const b=app.engine.b,h=app.profile.honroAct23V4History?.stages?.[21];if(!safe(b)||h?.reviewedNarrative?.rescued!==true)return false;const points=[spec(b).start,...b.honroMarkers.filter(p=>/^route:dock-/.test(p.id))];return b.units.filter(u=>u.side===1&&V.alive(u)&&!u.honroObjectiveTarget).every(u=>!points.some(p=>V.near(u,p,340)));}
function priorEmblem(p){return p.honroAct23V4History?.stages?.[21]?.reviewedNarrative?.proof?.emblem?.emblem==='old-sealed-diamond';}
function goodsVisible(b){return !!mem(b).proof.goods;}
function observe(app,dt){const b=app.engine.b,q=mem(b),u=carrier(b),s=spec(b);q.wagon??={angle:0};if(!root(b).carrierStarted)q.wagon.angle+=Math.max(0,Math.min(dt,.05))*3;q.last??={x:u.x,y:u.y};const d=Math.abs(u.x-q.last.x);if(root(b).carrierStarted&&d>0&&d<=u.walkSpeed*Math.min(.05,Math.max(dt,0))*1.5+3){q.proof.walk??={distance:0,actor:u.id};q.proof.walk.distance+=d;}q.last={x:u.x,y:u.y};
 if(V.heroes(b).some(h=>ground(b,h)&&V.near(h,s.goods,420))&&!q.proof.goods)q.proof.goods={items:['body-wrap','bones','bowl','hinge','farm-tool'],tags:['village-three-bars','village-three-bars'],familyCrest:s.familyCrest,point:F.copy(s.goods),viewer:V.heroes(b).find(h=>V.near(h,s.goods,420)).id};
 q.spirits??={distance:0};if(root(b).carrierStarted&&q.spirits.distance<120)q.spirits.distance=Math.min(120,q.spirits.distance+Math.max(0,Math.min(dt,.05))*160);
 if(V.heroes(b).some(h=>ground(b,h)&&V.near(h,s.banner,650))){q.banner??={time:0};q.banner.time=Math.min(.5,q.banner.time+Math.max(0,Math.min(dt,.05)));if(q.banner.time>=.3&&priorEmblem(app.profile)&&!q.proof.banner)q.proof.banner={emblem:'old-sealed-diamond',actualClothOffset:Math.sin(q.banner.time*5)*16,point:F.copy(s.banner)};}
 if(safe(b))q.proof.safe={actor:u.id,point:{x:u.x,y:u.y},distance:q.proof.walk.distance};if(returnSafe(app))q.proof.gateRouteSafe=true;
}
const dialogue=(key,ids,when)=>({key,ids,when}),ids=(part,n)=>Array.from({length:n},(_,i)=>'A3.S23.'+part+'.0'+(i+1));
R=F.register({stage:23,
 author(map){const u=map.units.find(u=>u.id==='act3-carrier'),p=map.markers.find(p=>p.id==='dispatch-bundle'),goods={x:u.x-70,y:u.y};p.x=u.x;p.y=u.y;
  map.initialState.honroReviewed23Spec={start:{x:u.x,y:u.y},goods,banner:{x:5500,y:4350},familyCrest:'family-three-petals'};
  map.initialState.honroV4MaterialEvidence=[{id:'v4.23.body-wrap',x:goods.x-55,y:goods.y},{id:'v4.23.household-metal',x:goods.x+55,y:goods.y}];
  map.terrains.push({id:'v4.23.wagon-cover',type:'solid',points:[{x:u.x-190,y:u.y-94},{x:u.x-95,y:u.y-94},{x:u.x-95,y:u.y},{x:u.x-190,y:u.y}],baseMaterial:'wood',breakable:true,layer:'terrain',properties:{hp:420,maxHp:420}});
 },
 prepare(b,p){delete p.honroReviewed23RestObservation;carrier(b).name='짐꾼';mem(b).last??={x:carrier(b).x,y:carrier(b).y};},
 before(app){return !blocked(app.engine.b);},observe,
 eligibility(app,m){if(m.id==='dispatch-bundle'&&(nearFoes(app.engine.b,carrier(app.engine.b),420).length||nearFoes(app.engine.b,V.marker(app.engine.b,'route:dock-mid:0'),300).length))return{ok:false,reason:m.id};},
 speaker(app,r){return r.speaker==='짐꾼'&&V.alive(carrier(app.engine.b));},
 facts(app,r){const b=app.engine.b;if(r.id==='A3.S23.GOODS.04')return mem(b).spirits?.distance>=120;if(r.id==='A3.S23.CLEAR.02')return returnSafe(app);return true;},
 optional(p,r){if(['EDGE.OPTIONAL_23_ARCHER_0','EDGE.OPTIONAL_23_MAGE_0','EDGE.OPTIONAL_23_KNIGHT_0'].includes(r.id))return p.honroAct23V4History?.stages?.[22]?.reviewedNarrative?.compared?.map===true;if(r.id==='EDGE.OPTIONAL_23_OCCULTIST_0')return F.witnessed(p,23,'goods');return true;},
 events:[dialogue('arrival',['EDGE.ARRIVALS_23_0'],()=>true),dialogue('intro',ids('INTRO',3),app=>V.alive(carrier(app.engine.b))&&!root(app.engine.b).carrierStarted&&(mem(app.engine.b).wagon?.angle||0)>=.3),dialogue('escort',ids('ESCORT',3),app=>root(app.engine.b).carrierStarted===true),dialogue('blocked',ids('BLOCKED',2),app=>blocked(app.engine.b)),dialogue('guide',['A3.S23.GUIDE.01'],app=>blocked(app.engine.b)),dialogue('goods',ids('GOODS',4),app=>root(app.engine.b).carrierStarted&&goodsVisible(app.engine.b)&&mem(app.engine.b).spirits?.distance>=120),dialogue('flag',ids('FLAG',1),app=>!!mem(app.engine.b).proof.banner&&priorEmblem(app.profile)),dialogue('clear',ids('CLEAR',4),app=>safe(app.engine.b))],
 journals:[{id:'EDGE.RUNTIME.JOURNAL.EVIDENCE23.TAG',when:app=>goodsVisible(app.engine.b)},{id:'A3.S23.JOURNAL.01',when:app=>safe(app.engine.b)&&goodsVisible(app.engine.b)&&F.closed(mem(app.engine.b).events.clear)}],
 complete:b=>safe(b)&&F.closed(mem(b).events.clear)&&!!mem(b).journals['A3.S23.JOURNAL.01'],
 objective:b=>'A3.S23.OBJ.0'+(safe(b)?3:root(b).carrierStarted?2:1),
 camera(app,key){const b=app.engine.b,p=['goods','intro','arrival'].includes(key)?spec(b).goods:key==='flag'?spec(b).banner:{x:carrier(b).x,y:carrier(b).y};return{id:'v4.23.'+key,intent:'situation',targets:[p,{actor:'act3-carrier'}],padding:130,maxScale:.8};},
 draw(scene,c,b){const q=mem(b),s=spec(b),p=s.goods;c.save();c.translate(p.x,p.y);c.fillStyle='#aa9e80';c.strokeStyle='#d0c5a2';c.lineWidth=3;c.beginPath();c.moveTo(-92,-16);c.lineTo(-76,-49);c.lineTo(-18,-45);c.lineTo(-7,-16);c.closePath();c.fill();c.stroke();c.strokeStyle='#e0d3b4';c.lineWidth=7;c.beginPath();c.moveTo(-66,-26);c.lineTo(-30,-38);c.moveTo(-63,-42);c.lineTo(-35,-23);c.stroke();c.strokeStyle='#9f8d58';c.lineWidth=4;c.beginPath();c.ellipse(39,-21,24,9,0,0,Math.PI);c.lineTo(63,-25);c.stroke();c.strokeRect(74,-38,17,26);c.beginPath();c.moveTo(105,-12);c.lineTo(130,-62);c.moveTo(117,-53);c.lineTo(140,-51);c.stroke();for(const x of[-22,55,103]){c.fillStyle='#c4b99a';c.fillRect(x,-18,16,19);c.strokeStyle='#5c4a36';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+3,-14+i*5);c.lineTo(x+13,-14+i*5);c.stroke();}}
 // Family crest on the wagon is distinct from village parcel tags and the
 // old military diamond. Stage24 reuses this exact retained shape.
 c.strokeStyle='#bdb18a';c.lineWidth=3;for(let i=0;i<3;i++){c.beginPath();c.ellipse(-90+Math.cos(i*2.094)*7,-60+Math.sin(i*2.094)*7,7,11,i*2.094,0,Math.PI*2);c.stroke();}c.restore();
 if(q.spirits){c.save();c.strokeStyle='#a9c7bb';c.lineWidth=2;for(let i=0;i<3;i++){c.globalAlpha=.3+i*.05;c.beginPath();c.ellipse(p.x-230+q.spirits.distance+i*28,p.y-115-i*20,10,25,0,0,Math.PI*2);c.stroke();}c.restore();}
 c.save();c.translate(s.banner.x,s.banner.y);c.strokeStyle='#7e7158';c.lineWidth=5;c.beginPath();c.moveTo(0,0);c.lineTo(0,-145);c.stroke();const wave=Math.sin((q.banner?.time||0)*5)*16;c.fillStyle='#65533f';c.beginPath();c.moveTo(2,-141);c.lineTo(77+wave,-126);c.lineTo(64-wave,-67);c.lineTo(2,-86);c.closePath();c.fill();const emblem=G.HonroAct23V4Chapter21Art?.asset.parts.find(p=>p.id==='torso').paths.at(-1);if(emblem){const path=(militaryPath??=new Path2D(emblem.d));c.save();c.translate(35,-105);c.scale(1.8,1.8);c.translate(-3,78);c.fillStyle='#b1ab86';c.strokeStyle='#1a282a';c.lineWidth=1;c.fill(path);c.stroke(path);c.restore();}c.restore();
 const cover=b.terrain.find(t=>t.id==='v4.23.wagon-cover');if(cover&&!cover.broken){c.save();c.strokeStyle='#b9a67c';c.lineWidth=3;for(const x of[cover.x+18,cover.x+77]){c.beginPath();c.arc(x,cover.y+cover.h-16,22,0,Math.PI*2);c.stroke();c.save();c.translate(x,cover.y+cover.h-16);c.rotate(q.wagon?.angle||0);c.beginPath();c.moveTo(-20,0);c.lineTo(20,0);c.moveTo(0,-20);c.lineTo(0,20);c.stroke();c.restore();}c.restore();}
 }
});
G.HonroAct23V4Chapter23Reviewed=R;
G.HonroAct23V4Chapter23Facts={blocked,safe,returnSafe,goodsVisible,priorEmblem,spec};
})(globalThis);
