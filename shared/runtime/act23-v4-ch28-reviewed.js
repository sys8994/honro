(function(G){'use strict';
const F=G.HonroAct3V4ReviewedCore,V=G.HonroAct23V4,City=G.HonroAct23V4City,C=G.HONRO_CORE,W=G.HonroAct3V4ReviewedWaterworks;let R;const q=b=>R.memory(b),root=V.mem,mark=V.marker,unit=(b,id)=>b.units.find(u=>u.id===id),ids=(s,n)=>Array.from({length:n},(_,i)=>'A3.S28.'+s+'.0'+(i+1)),stopped=b=>root(b).done['fire-screen']&&root(b).done['water-release'];
const actualFour=b=>stopped(b)&&['archer','mage','knight','occultist'].every(c=>{const u=V.heroes(b).find(u=>u.cls===c);return W.ground(b,u)&&V.near(u,mark(b,'party-reunion'),440);});
const packet=b=>City.evacuationSafe(b)&&!!root(b).cargo?.['v4:28:petition-record']&&!!root(b).slots['28.orders-bundle'];
const warning=b=>!stopped(b)&&(b.teamEnds?.[1]||0)-root(b).fireStartEnd>=9&&(b.teamEnds?.[1]||0)-root(b).fireStartEnd<12;
function observe(app,dt){const b=app.engine.b,m=q(b);if(actualFour(b)&&!m.proof.reunion)m.proof.reunion={actors:V.heroes(b).map(u=>({id:u.id,cls:u.cls,x:u.x,y:u.y})),devices:['fire-screen','water-release']};
 if(stopped(b)&&!m.proof.fireControl)m.proof.fireControl={fireDoor:b.terrain.find(t=>t.id==='fire-door')?.broken===true,waterGate:b.terrain.find(t=>t.id==='water-gate')?.broken===true};
 if(warning(b))m.flameWarning=true;const flag={x:7230,y:2480};if(W.visible(app,flag,1100)&&V.alive(unit(b,'v4.gwakjin'))&&Math.hypot(unit(b,'v4.gwakjin').x-flag.x,(unit(b,'v4.gwakjin').y-flag.y)*.75)<650)m.proof.banner={source:'visible-old-military-banner',x:flag.x,y:flag.y};
 if(packet(b)&&F.closed(m.events.packet)){
  const ids=['v4.court-soldier-2','v4.court-soldier-1','v4.gwakjin','v4.fire-resident-1','v4.fire-resident-2'];m.departStart??=Object.fromEntries(ids.map(id=>[id,{x:unit(b,id).x,y:unit(b,id).y}]));
  for(const id of ids){const u=unit(b,id),start=m.departStart[id],goal={x:start.x+75,y:start.y};City.walk(app,u,goal,dt);}
  if(ids.every(id=>V.alive(unit(b,id))&&unit(b,id).x-m.departStart[id].x>=40))m.proof.departure={actors:ids,source:'actual-native-naru-escort-start',positions:ids.map(id=>({id,x:unit(b,id).x,y:unit(b,id).y}))};
 }
}
R=F.register({stage:28,
 before(app){return !F.closed(q(app.engine.b).events.packet);},
 prepare(b){unit(b,'v4.gwakjin').name='곽진';for(const id of ['v4.court-soldier-1','v4.court-soldier-2'])unit(b,id).name='수비병';for(const id of ['v4.fire-resident-1','v4.fire-resident-2'])unit(b,id).name='주민';},
 author(map){delete map.initialState.honroV4Steps.find(s=>s.id==='petition-record').requiredClass;},observe,
 stepSatisfied(b,s){if(s.id==='party-reunion')return actualFour(b)||!!q(b).proof.reunion;return null;},
 failureGuide(app,r){const b=app.engine.b;return r.id==='A3.S28.GUIDE.FAIL_FIRE'&&b.phase==='lost'&&b.winnerReason==='v4.28.fire'&&!!b.honroSplit?.starts?.[28];},
 failureRows(app){return app.engine?.b?.winnerReason==='v4.28.fire'&&app.engine?.b?.honroSplit?.starts?.[28]?['A3.S28.GUIDE.FAIL_FIRE','EDGE.FAILURE_GUARD.S28']:['EDGE.FAILURE_GUARD.S28'];},
 speaker(app,r){const b=app.engine.b,u=unit(b,'v4.gwakjin');return r.speaker==='곽진'&&V.alive(u)&&V.heroes(b).some(h=>V.near(h,u,650));},
 facts(app,r){const b=app.engine.b,m=q(b);if(r.id==='A3.S28.REUNION.02')return !!app.profile.honroAct23V4History?.stages?.[25]?.reviewedNarrative?.proof.goods;if(r.id==='A3.S28.REUNION.03')return !!app.profile.honroAct23V4History?.stages?.[26]?.reviewedNarrative?.proof.casting&&!City.evacuationSafe(b);if(r.id==='A3.S28.DOCUMENTS.05')return !!m.proof.banner;if(r.id==='A3.S28.ESCORT_DANGER.01'){const a=City.memory(b).actors['v4.gwakjin'];return a?.distance>0&&!City.evacuationSafe(b)&&b.units.some(u=>V.alive(u)&&u.side===1&&V.near(u,unit(b,'v4.fire-resident-1'),330));}return true;},
 events:[{key:'arrival',ids:['EDGE.ARRIVALS_28_0'],when:app=>V.heroes(app.engine.b).length===4},
 {key:'ground',ids:ids('INTRO_GROUND',2),when:app=>!stopped(app.engine.b)},
 {key:'underground',ids:ids('INTRO_UNDERGROUND',2),when:app=>!stopped(app.engine.b)},
 {key:'fire',ids:ids('FIRE_CONTROL',2),when:app=>stopped(app.engine.b)&&q(app.engine.b).proof.fireControl?.fireDoor&&q(app.engine.b).proof.fireControl?.waterGate},
 {key:'reunion',ids:ids('REUNION',3),when:app=>!!q(app.engine.b).proof.reunion},
 {key:'danger',ids:ids('ESCORT_DANGER',1),when:app=>{const b=app.engine.b;return !!City.memory(b).proof.pickup&&!City.evacuationSafe(b)&&b.units.some(u=>V.alive(u)&&u.side===1&&V.near(u,unit(b,'v4.fire-resident-1'),330));}},
 {key:'warning',ids:['A3.S28.FIRE_WARNING.01','A3.S28.GUIDE.01'],when:app=>warning(app.engine.b)&&q(app.engine.b).flameWarning},
 {key:'packet',ids:['A3.S28.DOC.APPROVAL','A3.S28.DOC.EXECUTION','A3.S28.DOC.CONCEALMENT','A3.S28.DOC.ANCESTOR',...ids('DOCUMENTS',7)],when:app=>packet(app.engine.b)&&!!q(app.engine.b).proof.reunion&&V.heroes(app.engine.b).some(u=>V.near(u,unit(app.engine.b,'v4.gwakjin'),420))},
 {key:'present',ids:ids('PRESENT',3),when:app=>!!q(app.engine.b).proof.departure},
 {key:'exit',ids:ids('EXIT',2),when:app=>!!q(app.engine.b).proof.departure&&F.closed(q(app.engine.b).events.present)}],
 finished(app,key){if(key==='packet')q(app.engine.b).proof.packet={source:'28.orders-bundle',responsibility:['closure-approval','massacre-execution','post-event-concealment','ancestor-title-withdrawn']};},
 journals:[{id:'EDGE.RUNTIME.JOURNAL.EVIDENCE28.APPROVAL',when:app=>!!q(app.engine.b).proof.packet},{id:'EDGE.RUNTIME.JOURNAL.EVIDENCE28.COVERUP',when:app=>!!q(app.engine.b).proof.packet},{id:'A3.S28.JOURNAL.01',when:app=>!!q(app.engine.b).proof.packet&&!!q(app.engine.b).proof.departure}],
 complete:b=>!!q(b).proof.reunion&&!!q(b).proof.packet&&!!q(b).proof.departure&&F.closed(q(b).events.exit),
 failure:b=>!V.alive(unit(b,'v4.gwakjin'))?'v4.28.guard-lost':!q(b).proof.reunion&&['archer','mage','knight','occultist'].some(c=>!V.heroes(b).some(u=>u.cls===c))?'v4.28.required-reunion-party':null,
 objective:b=>'A3.S28.OBJ.0'+(q(b).proof.packet?4:q(b).proof.reunion?3:stopped(b)?2:1),
 camera(app,key){const b=app.engine.b;return{id:'v4.28.'+key,intent:'situation',targets:key==='ground'?[{marker:'fire-screen'}]:key==='underground'?[{marker:'water-release'}]:['packet','present','exit'].includes(key)?[{actor:V.heroes(b).find(u=>V.near(u,unit(b,'v4.gwakjin'),650))?.id||'v4.gwakjin'},{actor:'v4.gwakjin'}]:[{marker:'party-reunion'}],padding:140,maxScale:.65};},
 draw(scene,c,b){const reader=V.heroes(b).find(u=>V.near(u,unit(b,'v4.gwakjin'),420));if(reader&&packet(b)){c.save();c.translate(reader.x+22,reader.y-55);for(let i=0;i<4;i++){c.fillStyle=i%2?'#bfb28d':'#d0c09a';c.fillRect(-14+i*3,-16+i*3,28,25);}c.restore();}c.save();c.translate(7230,2590);c.strokeStyle='#82785e';c.lineWidth=5;c.beginPath();c.moveTo(0,0);c.lineTo(0,-180);c.stroke();c.fillStyle='#6f6550';c.fillRect(0,-175,70,60);c.strokeStyle='#b5ad8c';c.lineWidth=3;c.beginPath();c.moveTo(25,-147);c.lineTo(36,-159);c.lineTo(47,-147);c.lineTo(36,-135);c.closePath();c.stroke();c.restore();if(warning(b)){const p=mark(b,'party-reunion');c.save();c.fillStyle='#d3814266';for(let i=0;i<7;i++){c.beginPath();c.moveTo(p.x-140+i*40,p.y);c.quadraticCurveTo(p.x-160+i*40,p.y-80,p.x-125+i*40,p.y-115);c.quadraticCurveTo(p.x-92+i*40,p.y-65,p.x-105+i*40,p.y);c.fill();}c.restore();}}
});G.HonroAct23V4Chapter28Reviewed=R;
})(globalThis);
