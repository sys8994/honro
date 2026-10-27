(function(G){'use strict';
const F=G.HonroAct3V4ReviewedCore,V=G.HonroAct23V4,P=G.HonroAct23V4Stage30,I=P.ids,W=G.HonroAct3V4ReviewedWaterworks,C=G.HONRO_CORE;let R;const q=b=>R.memory(b),m=P.memory,unit=(b,id)=>b.units.find(u=>u.id===id),ids=(s,n)=>Array.from({length:n},(_,i)=>'A3.S30.'+s+'.0'+(i+1)),sailor=b=>unit(b,I.seaman),crew=(b,i)=>unit(b,I.crew[i]);
const nearNPC=(b,id,r=850)=>V.alive(unit(b,id))&&V.heroes(b).some(u=>Math.hypot(u.x-unit(b,id).x,(u.y-unit(b,id).y)*.75)<=r);
const safe=b=>P.rescueComplete(b),testimony=b=>safe(b)&&m(b).testimony===true&&nearNPC(b,I.seaman),comparison=b=>safe(b)&&m(b).comparison===true&&!!q(b).proof.testimony;
const gathered=b=>V.heroes(b).length>0&&V.heroes(b).every(u=>W.ground(b,u)&&V.near(u,V.marker(b,'old-road'),440));
// The authored east shore is the approach to the same old-road exit. Farewell
// may occur here after all facts/transport are complete; the high reach goal
// still gates mission completion. No ferry actor is moved for a dialogue.
const farewellAssembly=b=>comparison(b)&&V.heroes(b).length>0&&V.heroes(b).every(u=>W.ground(b,u)&&Math.hypot(u.x-crew(b,1).x,(u.y-crew(b,1).y)*.75)<=360);
const firstBoard=b=>m(b).boat.leg===0&&m(b).boat.status==='boarding'&&m(b).actors[I.residents[0]].status==='boarding'&&m(b).actors[I.residents[0]].distance>0;
const lastThreat=b=>m(b).secondBoardingStarted&&!safe(b)&&!P.boardingCorridorSafe(b);
function prior(p,n,key){return p.honroAct23V4History?.stages?.[n]?.reviewedNarrative?.proof?.[key];}
function observe(app){const b=app.engine.b,state=q(b),boat=m(b).boat;if(boat.status==='outbound'&&boat.leg===1&&boat.distance>0)state.proof.firstDeparture={leg:boat.leg,distance:boat.distance,manifest:F.copy(boat.manifest)};
 if(['west-rejoin','west','boarding'].includes(boat.status)&&boat.leg===1&&I.residents.slice(0,2).every(id=>m(b).actors[id].status==='safe'))state.proof.return={leg:1,distance:boat.distance};
 if(m(b).comparison&&state.proof.testimony)state.proof.comparison={source:I.comparison,existingMap:true,presentWaterway:true};
 if(farewellAssembly(b)&&!state.proof.farewellAssembly)state.proof.farewellAssembly={site:'existing-east-shore-old-road-approach',actors:V.heroes(b).map(u=>({id:u.id,cls:u.cls,x:u.x,y:u.y})),guard:{id:I.crew[1],x:crew(b,1).x,y:crew(b,1).y},leg:boat.leg,boatStatus:boat.status};
 if(safe(b))state.proof.rescue={source:'actual-two-trip-transport',rescued:F.copy(m(b).rescued),boatDistance:boat.distance,leg:boat.leg,disembarked:I.residents.every(id=>m(b).actors[id].disembarked),secondGroupRejoined:!!m(b).secondGroupRejoined};
}
R=F.register({stage:30,
 prepare(b,p){q(b).entryFresh??=!p._honroRouteRetry&&!!p.honroRouteHandoff?.sourceRun;crew(b,0).name='연실';crew(b,1).name='곽진';for(const id of I.residents)unit(b,id).name=id===I.injured?'부상자':'주민';for(const id of I.soldiers)unit(b,id).name='수비병';sailor(b).name='나루 사공';},observe,
 speaker(app,r){const b=app.engine.b,id={'연실':I.crew[0],'곽진':I.crew[1],'나루 사공':I.seaman}[r.speaker];return !!id&&nearNPC(b,id);},
 facts(app,r){const b=app.engine.b;if(r.id==='A3.S30.INTRO.03'||r.id==='A3.S30.ENDING.01')return nearNPC(b,I.crew[1]);if(r.id==='A3.S30.FIRST_BOARD.02')return m(b).actors[I.crew[1]].assisting===I.residents[0]&&Math.abs(crew(b,1).x-unit(b,I.residents[0]).x)<80;if(r.id==='A3.S30.DEPART.01')return b.units.some(u=>V.alive(u)&&u.side===1&&u.cls==='occultist'&&I.residents.slice(2).some(id=>V.near(u,unit(b,id),900)));if(r.id.startsWith('EDGE.ROUTES_30_'))return b.honroEntryVariant?.choice===(r.id.includes('_A_')?'A':'B')&&q(b).entryFresh;return true;},
 optional(p,r){if(r.id==='EDGE.OPTIONAL_30_MAGE_0')return prior(p,29,'trace')?.mage===true;if(r.id==='EDGE.OPTIONAL_30_KNIGHT_0')return !!prior(p,26,'testimony')&&!!prior(p,28,'packet');if(r.id==='EDGE.OPTIONAL_30_OCCULTIST_0')return F.witnessed(p,30,'pierPeople');return true;},
 restLineAllowed(p,r){return !!p.cleared?.[30]&&!!prior(p,30,'rescue')&&!!prior(p,30,'testimony')&&!!prior(p,30,'comparison')&&p.honroReviewed30Survivors?.includes(F.classes[r.speaker])&&!p.honroBattle;},
 eligibility(app,marker){if(marker.id===I.comparison&&!q(app.engine.b).proof.testimony)return{ok:false,reason:I.testimony};return null;},
 events:[{key:'arrival',ids:['EDGE.ARRIVALS_30_0'],when:app=>nearNPC(app.engine.b,I.crew[1],1000)},
 {key:'routeA',ids:['EDGE.ROUTES_30_VARIANTS_A_LINES_0'],when:app=>app.engine.b.honroEntryVariant?.choice==='A'&&q(app.engine.b).entryFresh},
 {key:'routeB',ids:['EDGE.ROUTES_30_VARIANTS_B_LINES_0'],when:app=>app.engine.b.honroEntryVariant?.choice==='B'&&q(app.engine.b).entryFresh},
 {key:'intro',ids:ids('INTRO',3),when:app=>nearNPC(app.engine.b,I.crew[0],850)&&nearNPC(app.engine.b,I.crew[1])},
 {key:'first',ids:[...ids('FIRST_BOARD',2),'A3.S30.GUIDE.01'],when:app=>firstBoard(app.engine.b)},
 {key:'depart',ids:ids('DEPART',1),when:app=>!!q(app.engine.b).proof.firstDeparture&&m(app.engine.b).boat.leg===1},
 {key:'return',ids:ids('RETURN',1),when:app=>!!q(app.engine.b).proof.return&&m(app.engine.b).boat.leg===1},
 {key:'danger',ids:ids('LAST_DANGER',2),when:app=>lastThreat(app.engine.b)},
 {key:'blocked',ids:['A3.S30.GUIDE.02'],when:app=>['boarding','west','west-rejoin'].includes(m(app.engine.b).boat.status)&&!P.boardingCorridorSafe(app.engine.b)},
 {key:'safe',ids:ids('SAFE',2),when:app=>safe(app.engine.b)},
 {key:'testimony',ids:ids('THIRTEEN',4),when:app=>testimony(app.engine.b)},
 {key:'comparison',ids:ids('ROUTE',2),when:app=>comparison(app.engine.b)},
 {key:'ending',ids:ids('ENDING',3),when:app=>comparison(app.engine.b)&&(farewellAssembly(app.engine.b)||gathered(app.engine.b))}],
 finished(app,key,event){const b=app.engine.b;if(key==='testimony'&&event.ids.includes('A3.S30.THIRTEEN.03')&&!event.retiredIds.includes('A3.S30.THIRTEEN.03'))q(b).proof.testimony={source:I.seaman,disembarked:m(b).actors[I.seaman].disembarked,pastDestination:'west-estuary',count:13,children:2,presentStatus:'unknown'};},
 journals:[{id:'A3.S30.JOURNAL.01',when:app=>{const b=app.engine.b;return !!q(b).proof.rescue&&!!q(b).proof.testimony&&!!q(b).proof.comparison&&gathered(b)&&F.closed(q(b).events.ending);}},{id:'EDGE.RUNTIME.JOURNAL.EVIDENCE30.ROUTE',when:app=>{const b=app.engine.b,h=app.profile.honroAct23V4History?.stages?.[19];return comparison(b)&&!!prior(app.profile,28,'packet')&&h?.transportTraces?.ids?.includes('mumyeong-transfer')&&h?.transportTraces?.ids?.includes('jeomungol-mark');}}],
 complete:b=>P.complete(b)&&!!q(b).proof.testimony&&!!q(b).proof.comparison&&gathered(b)&&F.closed(q(b).events.ending),
 objective:b=>'A3.S30.OBJ.0'+(q(b).proof.comparison?4:safe(b)?3:m(b).ready?2:1),progress:b=>m(b).ready&&!safe(b)?'안전 도달 '+m(b).rescued.length+'/'+I.residents.length:'',
 camera(app,key){const b=app.engine.b;return{id:'v4.30.'+key,intent:'situation',targets:key==='ending'?(farewellAssembly(b)?[{actor:I.crew[1]},...V.heroes(b).map(u=>({actor:u.id}))]:[{marker:'old-road'}]):['testimony','comparison','safe'].includes(key)?[{actor:I.seaman},{actor:I.crew[1]}]:[{actor:I.crew[1]},{x:m(b).boat.x,y:m(b).boat.y}],padding:140,maxScale:.65};},
 outcome(app){const b=app.engine.b;app.profile.honroReviewed30Survivors=V.heroes(b).map(u=>u.cls);},
 draw(scene,c,b){if(!m(b).comparison)return;const p=sailor(b);c.save();c.translate(p.x-65,p.y-110);c.fillStyle='#c8bd98';c.fillRect(-100,-55,200,105);c.strokeStyle='#647f7b';c.lineWidth=7;c.beginPath();c.moveTo(85,-30);c.bezierCurveTo(40,-15,30,10,-80,20);c.stroke();c.strokeStyle='#6a6246';c.lineWidth=3;c.setLineDash([7,5]);c.beginPath();c.moveTo(85,-15);c.lineTo(12,4);c.lineTo(-80,31);c.stroke();c.setLineDash([]);c.beginPath();c.moveTo(-55,10);c.lineTo(-80,20);c.lineTo(-58,29);c.stroke();c.restore();}
});
R.farewellAssembly=farewellAssembly;R.gathered=gathered;
const present=R.present;R.present=(b,result)=>{const out=present(b,result);if(!R.active(b)||!comparison(b)||F.closed(q(b).events.ending))return out;const guard=crew(b,1);return{...out,targets:[{id:'old-road',kind:'exit',x:guard.x,y:guard.y,label:R.row('A3.S30.OBJ.04').text}],farewellAssemblyPending:true};};
const fresh=p=>!!p?.cleared?.[30]&&!!prior(p,30,'rescue')&&!!prior(p,30,'testimony')&&!!prior(p,30,'comparison');
R.compatibilityPolicy=p=>!R.enabled()||!p?.cleared?.[30]?null:{transportProven:fresh(p),omittedIds:fresh(p)?[]:['COMPAT.30.REST','COMPAT.30.ENDING.01','COMPAT.30.ENDING.03'],historicalRecords:'preserve-verbatim',freshWitness:'never-infer-from-legacy-clear'};
R.endingContent=(app,id,base)=>{if(Number(id)!==30||!R.enabled())return null;const raw=G.HonroNarrativeCatalogue.data.actEndings[30],p=app?.profile;if(!p?.cleared?.[30])return{...raw,lines:[]};if(p.honroActEnding?.stage===30&&p.honroActEnding.reviewedRevision!==1)Object.assign(p.honroActEnding,{index:0,reviewedRevision:1});const wanted=[];if(fresh(p))wanted.push(0);if(prior(p,28,'packet'))wanted.push(1);if(prior(p,29,'trace')?.mage)wanted.push(2);if(fresh(p))wanted.push(3);return{...raw,lines:wanted.map(i=>R.row('EDGE.ACTENDINGS_30_LINES_'+i).text),reviewedRowIds:wanted.map(i=>'EDGE.ACTENDINGS_30_LINES_'+i)};};
for(const key of ['required','optional']){const old=G.HonroJourneyContent[key];G.HonroJourneyContent[key]=function(p,id,c,...args){if(R.enabled()&&id==null&&p?.cleared?.[30]){const prefix=key==='required'?'EDGE.RESTENDINGS_30_REQUIRED_':'EDGE.RESTENDINGS_30_OPTIONAL_'+String(c).toUpperCase()+'_';return R.lines(G.HONRO_ACT23_V4_REVIEWED_CH30.rows.filter(r=>r.id.startsWith(prefix)&&R.config.restLineAllowed(p,r)).map(r=>r.id),'rest-ending');}return old.call(this,p,id,c,...args);};}
const ending=G.HonroJourneyContent.ending;Object.defineProperty(G.HonroJourneyContent,'ending',{configurable:true,get(){return R.enabled()?{...ending,restDescription:fresh(G.HonroApp?.profile)?R.row('EDGE.ENDINGPLACE_RESTDESCRIPTION').text:'',endingTitle:R.row('EDGE.ENDINGPLACE_ENDINGTITLE').text,nextText:R.row('EDGE.ENDINGPLACE_NEXTTEXT').text}:ending;}});
const migrateEnding=V.migratePresentation;V.migratePresentation=function(p){migrateEnding(p);if(!R.enabled()||p.honroReviewed30EndingPresentation===1)return;if(p.cleared?.[30]&&p.honroJourney&&p.honroJourney.story?.stageId==null)p.honroJourney.story=null;if(p.honroActEnding?.stage===30)Object.assign(p.honroActEnding,{index:0,reviewedRevision:1});p.honroReviewed30EndingPresentation=1;};
G.HonroAct23V4Chapter30Reviewed=R;
})(globalThis);
