(function(G){'use strict';
// Reviewed observations retain Phase A's care, knockback recovery, movement,
// action opportunity and finite ambush owners.
const P=G.HonroAct23V4ReviewedChapters,V=P.V,C=P.C,A=G.HonroAct23V4Act3,api=P.apiFor(20),alive=V.alive;
const unit=(b,id)=>b.units.find(u=>u.id===id),base=b=>V.mem(b),clone=x=>JSON.parse(JSON.stringify(x));
const memory=b=>api.memory(b).physical??={roster:[],ambushStarts:{},arrivals:{}};
const grounded=(b,u)=>alive(u)&&!u.airborne&&!u.jumping&&C.validTerrainContactPose(b.terrain,u);
const threats=(b,p,r)=>b.units.filter(u=>alive(u)&&u.side===1&&!u.honroObjectiveTarget&&V.near(u,p,r));
function author(map){const init=map.initialState,outside=map.markers.find(p=>p.id==='20.outside');init.honroV4Reviewed20={roster:init.honroV4Convoy.slice(),required:['convoy-mason','convoy-gilchan'],outside:{x:outside.x,y:outside.y},seat:{x:outside.x-160,y:outside.y},permittedLosses:[]};}
function prepare(b){const m=memory(b);if(!m.roster.length)m.roster=b.honroV4Reviewed20.roster.slice();}
function counts(b){const m=memory(b),point=b.honroV4Reviewed20.outside,living=m.roster.filter(id=>alive(unit(b,id))),lost=m.roster.filter(id=>!alive(unit(b,id)));return{survived_count:living.filter(id=>grounded(b,unit(b,id))&&V.near(unit(b,id),point,650)).length,lost_count:lost.length};}
function outside(b){const m=memory(b),s=b.honroV4Reviewed20,living=m.roster.filter(id=>alive(unit(b,id))),lost=m.roster.filter(id=>!alive(unit(b,id)));return m.roster.length>0&&s.required.every(id=>alive(unit(b,id)))&&living.length>0&&living.every(id=>grounded(b,unit(b,id))&&V.near(unit(b,id),s.outside,650)&&(unit(b,id).honroV4Distance||0)>80)&&lost.every(id=>s.permittedLosses.includes(id))&&!threats(b,s.outside,700).length;}
function baggage(b){const q=A.convoyCare(b).baggage;return q.id==='20.family-baggage'&&q.status==='carried'&&q.owner==='convoy-gilchan'&&q.transfers===1&&q.proof?.from==='convoy-mason'&&q.proof?.to==='convoy-gilchan';}
function newsReady(b){const s=b.honroV4Reviewed20,reporter=unit(b,'20.town-refugee');return outside(b)&&grounded(b,reporter)&&V.near(reporter,s.outside,350)&&V.heroes(b).some(u=>V.near(u,reporter,450));}
function observe(app,dt){const b=app.engine.b,m=memory(b),r=base(b),amb=r.convoyAmbush;
 if(amb?.admitted&&amb.ids.length===b.honroV4ConvoyAmbush.count)for(const id of amb.ids){const u=unit(b,id);if(alive(u)){m.ambushStarts[id]??={x:u.x,y:u.y};const p=m.ambushStarts[id];if(Math.hypot(u.x-p.x,u.y-p.y)>12&&V.near(u,unit(b,'convoy-mason'),1200))m.ambushApproach={id,from:clone(p),to:{x:u.x,y:u.y}};}}
 const archer=api.actor(b,'설오'),rock=V.marker(b,'clear-pass');if(grounded(b,archer)&&rock&&archer.y<rock.y-80&&Math.abs(archer.x-rock.x)<1700&&amb?.ids.some(id=>{const t=unit(b,id);if(!alive(t))return false;return !app.engine.projectileCollision({x:archer.x,y:archer.y-archer.h*.6},{x:t.x,y:t.y-t.h*.5},1,archer.id,[],false)?.terrain;}))m.highSight={actor:archer.id,point:{x:archer.x,y:archer.y}};
 if(outside(b))for(const id of m.roster.filter(id=>alive(unit(b,id))))m.arrivals[id]={x:unit(b,id).x,y:unit(b,id).y,distance:unit(b,id).honroV4Distance};
 if(newsReady(b))m.reporter={id:'20.town-refugee',point:{x:unit(b,'20.town-refugee').x,y:unit(b,'20.town-refugee').y}};
 // Preserve the same carried item while the son leads his father to the
 // physically clear seat. A saved pose alone never creates the handoff proof.
 if(api.done(b,'time-6')&&outside(b)&&baggage(b)){const father=unit(b,'convoy-mason'),son=unit(b,'convoy-gilchan'),seat=b.honroV4Reviewed20.seat;
  // Keep the bearer beside the father during the final approach. Otherwise
  // the old escape goal can leave him just beyond the near-pair threshold
  // before the father reaches the seat, permanently withholding TIME.07.
  if(!m.seated&&grounded(b,son)&&Math.abs(son.x-father.x)>140){if(son.honroV4SeatRound!==b.round){son.honroV4SeatRound=b.round;son.moveLeft=son.maxMove;}son.fixed=false;const p={x:son.x,y:son.y};app.engine.walk(son,Math.sign(father.x-son.x),Math.max(0,Math.min(dt||0,.05)),true);const follow=m.seatFollower??={from:p,distance:0};follow.distance+=Math.hypot(son.x-p.x,son.y-p.y);}
  if(V.near(father,son,220)&&!b.units.some(u=>alive(u)&&u.id!==father.id&&u.id!==son.id&&Math.abs(u.x-seat.x)<u.r+30&&Math.abs(u.y-seat.y)<110)){m.seatAvailable={x:seat.x,y:seat.y};const walk=m.seatWalk??={from:{x:father.x,y:father.y},distance:0};
   if(!m.seated&&Math.abs(father.x-seat.x)>12){if(father.honroV4SeatRound!==b.round){father.honroV4SeatRound=b.round;father.moveLeft=father.maxMove;}father.fixed=false;const from={x:father.x,y:father.y};app.engine.walk(father,Math.sign(seat.x-father.x),Math.max(0,Math.min(dt||0,.05)),true);walk.distance+=Math.hypot(father.x-from.x,father.y-from.y);}
   if(walk.distance>=12&&V.near(father,seat,25)&&grounded(b,father)){m.seated={father:father.id,son:son.id,item:A.convoyCare(b).baggage.id,distance:walk.distance};father.honroScenePose={kind:'inspect',time:1};}}}
}
function witness19(profile){const h=profile.honroAct23V4History?.stages?.[19],w=h?.reviewed19;return h?.revision===1&&h.run&&w?.revision===1&&w.run===h.run?w:null;}
function marksWitness(profile){const w=witness19(profile);return !!w&&['mumyeong-transfer','royal-seal','jeomungol-mark'].every(id=>w.marks?.[id]?.confirmed);}
function farewellWitness(profile){const w=witness19(profile);return !!w&&[1,2,3].every(i=>w.departures?.[i]?.departed);}
function familyWitness(profile){const w=witness19(profile);return w?.familyWitness===true&&[1,2,3].every(i=>{const q=w.familyCalls?.[i];return q?.sourceRun===w.run&&q.encounter===i&&q.caller===['mourner-brother','mourner-sister','objective'][i-1]&&q.observer&&q.elapsed>=.7&&q.response?.elapsed>=.35&&q.response.spirit==='farewell-spirit-'+i&&q.aliveCaller&&q.groundedCaller&&q.visible;});}
function optional(profile,r){const b=profile.honroBattle;if(!api.active(b))return false;const id=r.id;
 if(id.includes('ARCHER'))return !base(b).ringRemoved&&!outside(b)&&marksWitness(profile)&&farewellWitness(profile);
 if(id.includes('MAGE'))return !outside(b)&&farewellWitness(profile);
 if(id.includes('KNIGHT'))return marksWitness(profile);
 if(id.includes('OCCULTIST'))return farewellWitness(profile)&&familyWitness(profile);
 return false;
}
function ambushClear(b){const r=base(b),q=r.convoyAmbush,s=V.steps(b).find(s=>s.id==='clear-pass');return !!q?.admitted&&q.ids.length===b.honroV4ConvoyAmbush.count&&[...q.ids,...(s?.defeatIds||[])].every(id=>{const u=unit(b,id);return !!u&&(!alive(u)||u.side!==1||u.honroSubdued);});}
function allow(app,row){const b=app.engine.b,m=memory(b),r=base(b),id=row.id,care=A.convoyCare(b);
 if(row.channel==='optional')return optional({...app.profile,honroBattle:b},row);
 if(id==='EDGE.ARRIVALS_20_0')return m.roster.every(id=>alive(unit(b,id)));
 if(id==='A2.S20.INTRO.01')return r.ringRemoved===true;
 if(id==='A2.S20.INTRO.02')return r.ringRemoved&&m.roster.every(id=>alive(unit(b,id)));
 if(id==='A2.S20.INTRO.03')return !!r.ringRemoved&&threats(b,V.marker(b,'escort'),1100).length>0&&V.heroes(b).some(u=>V.near(u,V.marker(b,'escort'),1100));
 if(id==='A2.S20.MID.01')return !!r.convoyStarted&&!threats(b,V.marker(b,'escort'),650).length;
 if(['A2.S20.MID.02','A2.S20.MID.03'].includes(id))return ['handoff','carried'].includes(care.baggage.status)&&grounded(b,unit(b,'convoy-mason'))&&grounded(b,unit(b,'convoy-gilchan'))&&V.near(unit(b,'convoy-mason'),unit(b,'convoy-gilchan'),185);
 if(id==='A2.S20.MID.04')return !!m.ambushApproach&&alive(unit(b,m.ambushApproach.id));
 if(id==='A2.S20.MID.05')return !!m.highSight&&grounded(b,api.actor(b,'설오'));
 if(['A2.S20.MID.06','A2.S20.POPUP.01'].includes(id))return !!care.injured.stopped&&care.injured.status==='waiting-support'&&alive(unit(b,care.injured.id));
 if(id==='A2.S20.MID.07')return ambushClear(b);
 if(id==='A2.S20.BRANCH.01')return outside(b)&&counts(b).lost_count===0;
 if(['A2.S20.BRANCH.02','A2.S20.POPUP.02'].includes(id))return outside(b)&&counts(b).lost_count>0;
 if(id.startsWith('A2.S20.TIME.')){const i=+id.split('.').at(-1);return outside(b)&&baggage(b)&&api.done(b,'outside-count')&&(i===1||api.done(b,'time-'+(i-1)))&&(i!==7||!!m.seated);}
 if(id.startsWith('A2.S20.NEWS.'))return newsReady(b)&&api.done(b,'time-8');
 if(id==='A2.S20.COMPLETE.01')return api.done(b,'news')&&outside(b)&&grounded(b,unit(b,care.injured.id))&&!!m.seatAvailable&&!!m.seated;
 if(id==='A2.S20.JOURNAL.01')return outside(b)&&api.done(b,'time-8');
 if(id==='A2.S20.JOURNAL.02')return outside(b)&&api.done(b,'news');
 return false;
}
function scene(app,key,rows,proof={}){if(rows.every(id=>allow(app,api.row(id))))return api.begin(app,key,rows,proof);return false;}
function drive(app){const b=app.engine.b,m=memory(b),q=api.memory(b),r=base(b),care=A.convoyCare(b),event=(key,rows,proof)=>!q.events[key]&&scene(app,key,rows,proof);
 if(event('arrival',['EDGE.ARRIVALS_20_0'],{roster:m.roster}))return;
 if(event('ring',['A2.S20.INTRO.01','A2.S20.INTRO.02'],{ring:r.ringRemoved,roster:m.roster}))return;
 if(event('entrance-warning',['A2.S20.INTRO.03']))return;
 if(event('start',['A2.S20.MID.01'],{roster:m.roster}))return;
 if(event('injured',['A2.S20.MID.06','A2.S20.POPUP.01'],care.injured))return;
 if(event('baggage',['A2.S20.MID.02','A2.S20.MID.03'],care.baggage))return;
 if(event('ambush',['A2.S20.MID.04'],m.ambushApproach))return;
 if(event('high-sight',['A2.S20.MID.05'],m.highSight))return;
 if(event('clear',['A2.S20.MID.07'],r.convoyAmbush))return;
 if(api.done(b,'clear')&&event('outside-count',[counts(b).lost_count?'A2.S20.BRANCH.02':'A2.S20.BRANCH.01',...(counts(b).lost_count?['A2.S20.POPUP.02']:[])],{...counts(b),arrivals:m.arrivals}))return;
 for(let i=1;i<=8;i++)if(event('time-'+i,['A2.S20.TIME.'+String(i).padStart(2,'0')],{arrivals:m.arrivals,baggage:care.baggage}))return;
 if(api.done(b,'time-8')&&!app.profile.record?.some(r=>r.rowId==='A2.S20.JOURNAL.01'))api.journal(app,'A2.S20.JOURNAL.01');
 if(event('news',[1,2,3,4,5,6].map(i=>'A2.S20.NEWS.0'+i),m.reporter))return;
 if(api.done(b,'news')&&!app.profile.record?.some(r=>r.rowId==='A2.S20.JOURNAL.02'))api.journal(app,'A2.S20.JOURNAL.02');
 event('rest',['A2.S20.COMPLETE.01'],m.seated);
}
function before(app,a,dt){if(!a.safe(app))return false;observe(app,dt);drive(app);if(app.dialogue)return false;const b=app.engine.b,care=A.convoyCare(b);
 // Keep the real waiting and handoff state visible until the corresponding
 // reviewed response is acknowledged; interrupted handoffs still recover in
 // the physical owner after that acknowledgement.
 // The seat sequence owns these two walks until the witnessed handoff;
 // do not let the older escape waypoint pull the bearer back each tick.
 if(api.done(b,'time-6')&&outside(b)&&baggage(b)&&!memory(b).seated)return false;
 if(care.injured.status==='waiting-support'&&!api.done(b,'injured'))return false;
 if(care.baggage.status==='handoff'&&!api.done(b,'baggage'))return false;
 return true;
}
function eligibility(app,p,s){const b=app.engine.b;
 if(s.id==='20.ring'&&!api.done(b,'arrival')||s.id==='escort'&&(!api.done(b,'ring')||threats(b,V.marker(b,'escort'),650).length)||s.id==='20.outside'&&(!outside(b)||!api.done(b,'clear')))return{ok:false,reason:s.id};return undefined;}
function complete(b){return outside(b)&&A.careReady(b)&&baggage(b)&&ambushClear(b)&&api.done(b,'time-8')&&api.done(b,'news')&&api.done(b,'rest')&&!!api.memory(b).journal;}
function history20(profile){const h=profile.honroAct23V4History?.stages?.[20],w=h?.reviewed20;return h?.revision===1&&h.run&&w?.revision===1&&w.run===h.run?w:null;}
function endingAllowed(profile,row){const w=history20(profile);if(!profile.cleared?.[20]||!w?.complete)return false;const i=+row.id.split('_').at(-1);if(i===0)return farewellWitness(profile)&&familyWitness(profile);if(i===1)return w.outside&&w.time;if(i===2)return w.outside&&w.time&&marksWitness(profile);if(i===3)return w.news&&w.safeHandoff;return false;}
function restEndingAllowed(profile,row){const w=history20(profile);if(!profile.cleared?.[20]||!w?.complete)return false;const classes={'설오':'archer','담허':'mage','휘겸':'knight','소단':'occultist'},cls=classes[row.speaker||row.speaker_channel?.split(' · ')[0]];if(!cls||!w.speakers.includes('p-'+cls))return false;if(row.id.includes('REQUIRED'))return w.safeHandoff;if(row.id.includes('KNIGHT'))return w.baggage;return true;}
function camera(app,key){const b=app.engine.b;let targets;
 if(['news','rest'].includes(key))targets=[{actor:'20.town-refugee'},b.honroV4Reviewed20.seat,{actor:'objective'}];
 else if(key.startsWith('time-')||key==='outside-count')targets=[{actor:'convoy-mason'},{actor:'convoy-gilchan'},b.honroV4Reviewed20.outside];
 else if(key==='injured')targets=[{actor:'objective'}];else if(key==='baggage')targets=[{actor:'convoy-mason'},{actor:'convoy-gilchan'}];
 else if(key==='ring')targets=[V.marker(b,'20.ring')];else if(key==='ambush')targets=[{actor:memory(b).ambushApproach.id},{actor:'convoy-mason'}];
 else if(key==='high-sight')targets=[{actor:'p-archer'},V.marker(b,'clear-pass')];else targets=[V.marker(b,'escort'),{actor:'objective'}];
 return{intent:'situation',targets,padding:110,maxScale:.8};}
const endingRows=[0,1,2,3].map(i=>'EDGE.ACTENDINGS_20_LINES_'+i),restRequired=['EDGE.RESTENDINGS_20_REQUIRED_0'],restOptional=Object.fromEntries(['archer','mage','knight','occultist'].map(cls=>[cls,['EDGE.RESTENDINGS_20_OPTIONAL_'+cls.toUpperCase()+'_0']]));
P.register(20,{mapRevision:520,camera,actors:{'길찬':'convoy-gilchan','석공':'convoy-mason','읍성 피란민':'20.town-refugee'},author,prepare,before,drive,allow,eligibility,optional,complete,objective:b=>!base(b).convoyStarted?'A2.S20.OBJECTIVE.01':!A.convoyCare(b).injured.stopped?'A2.S20.OBJECTIVE.02':!ambushClear(b)?'A2.S20.OBJECTIVE.03':'A2.S20.OBJECTIVE.04',failure:()=> 'A2.S20.FAIL.01',templateVars:(app,r)=>r.id==='A2.S20.POPUP.02'?counts(app.engine.b):null,endingRows,endingAllowed,restRequired,restOptional,restEndingAllowed});
const outcome=V.recordOutcome;V.recordOutcome=function(app,won){outcome(app,won);const b=app.engine?.b;if(won&&api.active(b)&&complete(b)){const h=app.profile.honroAct23V4History?.stages?.[20];if(h)h.reviewed20={revision:1,run:b.session,complete:true,roster:memory(b).roster.slice(),arrivals:clone(memory(b).arrivals),outside:outside(b),counts:counts(b),time:api.done(b,'time-8'),news:api.done(b,'news'),reporter:clone(memory(b).reporter),baggage:baggage(b),safeHandoff:api.done(b,'rest')&&!!memory(b).seated,speakers:b.units.filter(alive).map(u=>u.id)};}};
G.HonroAct23V4Reviewed20={memory,allow,optional,counts,outside,baggage,newsReady,ambushClear,complete,witness19,marksWitness,farewellWitness,history20,familyWitness,endingRows,restRequired,restOptional,endingAllowed,restEndingAllowed};
})(globalThis);
