(function(G){'use strict';
const F=G.HonroAct3V4ReviewedCore,V=G.HonroAct23V4,W=G.HonroAct3V4ReviewedWaterworks,City=G.HonroAct23V4City,C=G.HONRO_CORE;let R;const q=b=>R.memory(b),root=V.mem,mark=V.marker,unit=(b,id)=>b.units.find(u=>u.id===id),hero=(b,c)=>V.heroes(b).find(u=>u.cls===c),resident=b=>unit(b,b.honroV4CitySpec.resident),ids=(s,n)=>Array.from({length:n},(_,i)=>'A3.S26.'+s+'.0'+(i+1));
const near=(b,p,r=500)=>V.heroes(b).some(u=>W.ground(b,u)&&V.near(u,p,r)),safePath=b=>!b.units.some(u=>V.alive(u)&&u.side===1&&V.near(u,resident(b),400)),separated=b=>!!City.memory(b).proof.separation&&V.alive(resident(b))&&!resident(b).honroHypnotized;
function testimony(b){return !!q(b).proof.testimony&&!!City.memory(b).proof.testimony&&V.alive(resident(b))&&safePath(b);}
function tableSafe(b){const t=b.terrain.find(t=>t.id==='v4.26.table');if(!t||t.broken)return false;const u=resident(b),p={...u,x:4660,y:2150,h:70};return C.validTerrainContactPose(b.terrain,p)&&!b.units.some(v=>v!==u&&V.alive(v)&&Math.abs(v.x-p.x)<(v.r||20)+u.r&&Math.abs(v.y-p.y)<110);}
function danger(b){return q(b).roofShake>0&&!separated(b)&&V.alive(resident(b));}
function observe(app,dt){const b=app.engine.b,m=q(b),r=resident(b);m.roofShake=Math.max(0,(m.roofShake||0)-Math.max(0,Math.min(dt,.05)));
 if(near(b,r,750)&&V.alive(r)&&r.honroHypnotized&&!m.called){m.called=true;r.honroScenePose={kind:'point',time:.4};app.engine.emit?.('sound',{name:'hurt'});}
 if(near(b,mark(b,'casting-tally'),500))m.proof.casting={items:['door-handle','household-metal','smelting-tools'],militaryTag:true};
 const a=City.memory(b).proof.testimony,k=hero(b,'knight'),letter=b.honroReviewed26Letter;if(a&&k&&W.ground(b,k)&&V.near(k,letter,280)&&safePath(b)&&!m.proof.testimony){m.proof.testimony={...F.copy(a),letter:{id:letter.id,emblem:letter.emblem},items:['door-handles','farm-tools']};}
 const smoke=b.honroV4Smoke;if(smoke&&W.visible(app,smoke,1000))m.proof.smoke={source:'existing-office-smoke',...F.copy(smoke)};
}
const exit=b=>testimony(b)&&V.heroes(b).length===2&&V.heroes(b).every(u=>W.ground(b,u)&&V.near(u,mark(b,'workshop-exit'),200));
R=F.register({stage:26,
 author(map){map.initialState.honroReviewed26Letter={id:'v4.26.ancestor-letter',x:5050,y:2150,emblem:'family-three-petals'};map.terrains.push({id:'v4.26.table',type:'solid',name:'v4.26.table',points:[{x:4550,y:2052},{x:4700,y:2052},{x:4700,y:2068},{x:4550,y:2068}],baseMaterial:'wood',oneWay:true,breakable:true,layer:'terrain',properties:{hp:700,maxHp:700,honroWalkEdges:[0]}});},
 prepare(b){resident(b).name='주민';unit(b,b.honroV4CitySpec.spirit).name='';},
 attach(app,e){const damage=e.damageTerrain.bind(e);e.damageTerrain=function(t,amount,...args){const before=t?.hp,result=damage(t,amount,...args);if(t?.id==='artisan-refuge-house:collision:0'&&amount>0&&before!==t.hp)q(e.b).roofShake=2;return result;};},observe,
 speaker(app,r){return r.speaker==='주민'&&V.alive(resident(app.engine.b))&&near(app.engine.b,resident(app.engine.b),700);},
 facts(app,r){const b=app.engine.b;if(r.id==='A3.S26.INTRO.01')return q(b).called&&!root(b).done['hidden-latch'];if(['A3.S26.INTRO.02','A3.S26.INTRO.03'].includes(r.id))return V.alive(resident(b))&&resident(b).honroHypnotized&&near(b,resident(b),750);if(r.id==='A3.S26.DANGER.02')return danger(b)&&tableSafe(b);if(r.id.startsWith('A3.S26.DANGER.'))return danger(b);if(r.id==='A3.S26.RESCUE.02'||r.id==='A3.S26.RESCUE.03')return safePath(b)&&root(b).done['hidden-latch'];if(r.id==='A3.S26.TESTIMONY.04')return !!q(b).proof.casting;return true;},
 events:[{key:'arrival',ids:['EDGE.ARRIVALS_26_0'],when:app=>V.heroes(app.engine.b).length===2},
 {key:'intro',ids:ids('INTRO',3),when:app=>q(app.engine.b).called&&near(app.engine.b,resident(app.engine.b),750)},
 {key:'danger',ids:ids('DANGER',2),when:app=>danger(app.engine.b)},
 {key:'guide',ids:['A3.S26.GUIDE.01'],when:app=>app.scene?.inspectUnitId===resident(app.engine.b).id&&V.alive(resident(app.engine.b))&&resident(app.engine.b).honroHypnotized},
 {key:'rescue',ids:ids('RESCUE',3),when:app=>separated(app.engine.b)},
 {key:'testimony',ids:ids('TESTIMONY',5),when:app=>testimony(app.engine.b)},
 {key:'fire',ids:ids('FIRE',2),when:app=>!!q(app.engine.b).proof.smoke},
 {key:'exit',ids:ids('EXIT',2),when:app=>exit(app.engine.b)}],
 documents:{'A3.S26.TESTIMONY.02':'A3.S26.DOC.TESTIMONY'},
 journals:[{id:'EDGE.RUNTIME.JOURNAL.EVIDENCE26.CASTING',when:app=>!!q(app.engine.b).proof.casting},{id:'EDGE.RUNTIME.JOURNAL.EVIDENCE26.TESTIMONY',when:app=>testimony(app.engine.b)&&F.closed(q(app.engine.b).events.testimony)},{id:'A3.S26.JOURNAL.01',when:app=>testimony(app.engine.b)&&!!q(app.engine.b).proof.smoke&&F.closed(q(app.engine.b).events.testimony)}],
 complete:b=>testimony(b)&&F.closed(q(b).events.testimony)&&exit(b)&&F.closed(q(b).events.exit),objective:b=>'A3.S26.OBJ.0'+(testimony(b)?3:root(b).done['hidden-latch']?2:1),
 camera(app,key){const b=app.engine.b;return{id:'v4.26.'+key,intent:'situation',targets:[key==='fire'?b.honroV4Smoke:key==='testimony'?b.honroReviewed26Letter:{actor:resident(b).id}],padding:140,maxScale:.8};},
 draw(scene,c,b){const m=q(b),p=b.honroReviewed26Letter,k=hero(b,'knight');c.save();if(m.proof.testimony&&k)c.translate(k.x+22,k.y-50);else c.translate(p.x,p.y-20);c.fillStyle='#c9bd97';c.fillRect(-18,-20,36,24);c.strokeStyle='#66654a';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.ellipse(Math.cos(i*2.094)*4,Math.sin(i*2.094)*4-10,3,5,i*2.094,0,Math.PI*2);c.stroke();}c.restore();
 const t=b.terrain.find(t=>t.id==='v4.26.table');if(t&&!t.broken){c.save();c.fillStyle='#675e48';c.fillRect(4550,2052,150,16);c.fillRect(4557,2068,10,82);c.fillRect(4683,2068,10,82);c.restore();}
 if(m.roofShake>0){c.save();c.translate(Math.sin(m.roofShake*35)*7,0);c.strokeStyle='#b3a689';c.lineWidth=6;c.beginPath();c.moveTo(4630,1910);c.lineTo(4830,1930);c.lineTo(4910,1905);c.stroke();c.restore();}
 const z=mark(b,'casting-tally');if(z){c.save();c.translate(z.x,z.y);c.fillStyle='#727562';c.fillRect(-55,-32,110,20);c.strokeStyle='#b8ad85';c.lineWidth=4;c.beginPath();c.moveTo(-30,-45);c.lineTo(30,-45);c.lineTo(30,-15);c.moveTo(-20,-70);c.lineTo(40,-12);c.stroke();c.restore();}}
});G.HonroAct23V4Chapter26Reviewed=R;
})(globalThis);
