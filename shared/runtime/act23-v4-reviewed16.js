(function(G){'use strict';
const P=G.HonroAct23V4ReviewedChapters;if(!P||G.HonroAct23V4Reviewed16)return;
const V=P.V,C=P.C,S=G.HonroAct23V4Act2Scenes,B=S.base,api=P.apiFor(16),clone=x=>JSON.parse(JSON.stringify(x));
const unit=(b,id)=>b.units.find(u=>u.id===id),mem=b=>api.memory(b),physical=b=>S.memory(b),base=b=>B.memory(b),id=s=>'A2.S16.'+s;
const witness=Array.from({length:8},(_,i)=>id('WITNESS.0'+(i+1))),coreWitness=[1,2,4,6,8].map(i=>id('WITNESS.0'+i)),spoken=(b,key)=>mem(b).events[key]?.status==='done';
const foes=(b,p,r=460)=>b.units.filter(u=>V.alive(u)&&u.side===1&&!u.honroObjectiveTarget&&V.near(u,p,r));
const nearby=(b,p,r)=>V.heroes(b).some(u=>V.near(u,p,r));
function separated(b){const u=unit(b,'resident-1');return !!base(b).proof['16.disciple']&&V.alive(u)&&u.honroResolved&&!V.alive(unit(b,'resident-spirit-1'));}
function recovered(b){const s=b.honroV4Recovery,a=physical(b);return separated(b)&&!!a.proof['16.safe']&&['16.disciple-safe','16.elder-safe'].every(k=>a.walks[k]?.arrived&&a.walks[k].distance>80)&&V.alive(unit(b,'objective'))&&V.near(unit(b,'resident-1'),s.disciple,70)&&V.near(unit(b,'objective'),s.elder,70)&&['resident-1','objective'].every(k=>C.validTerrainContactPose(b.terrain,unit(b,k)))&&!foes(b,s.elder).length;}
function heard(b){const e=mem(b).events.witness;return recovered(b)&&e?.status==='done'&&coreWitness.every(k=>e.ids.includes(k));}
function author(map){const elder=map.units.find(u=>u.id==='objective'),disciple=map.units.find(u=>u.id==='resident-1');if(elder&&disciple){elder.x=disciple.x+50;elder.y=disciple.y-50*4/49;elder.stageOverrides={...elder.stageOverrides,honroScenePose:{kind:'kneel',time:0}};}const p=map.initialState.honroV4Recovery.elder;map.initialState.honroV4Reviewed16={transport:{x:p.x+230,y:p.y-15},bellSource:{x:p.x+530,y:p.y-30},souls:[{x:p.x+510,y:p.y-65},{x:p.x+550,y:p.y-60}],revision:1};}
function prepare(b){mem(b);b.honroState.flags??={};b.honroState.flags.witness16_heard=heard(b);if(!heard(b)){delete V.mem(b).sceneDone['16.testimony.required'];const s=V.mem(b).slots['16.testimony.required'];if(s?.status==='done')s.status='pending';}}
function observed15(profile,key){const h=profile.honroAct23V4History?.stages?.[15],f=h?.reviewedPhysical;return !!h?.run&&f?.revision===1&&f.sourceRun===h.run&&f[key]===true;}
function optional(profile,r){if(r.id==='EDGE.OPTIONAL_16_ARCHER_0')return observed15(profile,'brokenPulleysObserved');if(r.id==='EDGE.OPTIONAL_16_OCCULTIST_0')return observed15(profile,'upwardHandsObserved');const b=profile.honroBattle;if(!b||!api.active(b))return false;const q=mem(b),pre=!recovered(b)&&!q.events.witness;
 if(r.id==='EDGE.OPTIONAL_16_MAGE_0')return pre&&!!q.transportObserved;
 if(r.id==='EDGE.OPTIONAL_16_MAGE_1')return pre;
 if(r.id==='EDGE.OPTIONAL_16_MAGE_2')return pre&&!separated(b)&&!!q.attachedObserved;
 if(r.id==='EDGE.OPTIONAL_16_KNIGHT_0')return pre&&!!q.elderDiscipleObserved;
 if(r.id==='EDGE.OPTIONAL_16_OCCULTIST_0')return observed15(profile,'upwardHandsObserved');
 return false;
}
function blocked(app){const b=app.engine.b,p=mem(b).blocked,u=api.actor(b,'설오'),t=p&&unit(b,p.target);if(!p||!V.alive(u)||!V.alive(t)||!V.near(u,p.from,90))return false;const h=app.engine.projectileCollision({x:u.x,y:u.y-u.h*.63},{x:t.x,y:t.y-t.h*.5},1,u.id,[],false);return h?.terrain?.id===p.terrain&&!h.terrain.broken;}
function allow(app,r){const b=app.engine.b,q=mem(b),a=physical(b),u=unit(b,'resident-1'),e=unit(b,'objective');if(r.id.startsWith('EDGE.OPTIONAL_'))return optional({...app.profile,honroBattle:b},r);
 if(r.id===id('FAIL.01'))return b.phase==='lost'||!V.alive(u)||!V.alive(e);
 if(!V.alive(u)||!V.alive(e))return false;
 if(r.id==='EDGE.ARRIVALS_16_0')return !separated(b);
 if(r.id===id('BRANCH.01'))return b.honroEntryVariant?.choice==='A'&&!!q.elderDiscipleObserved;
 if(r.id===id('BRANCH.02'))return b.honroEntryVariant?.choice==='B'&&!!q.elderDiscipleObserved;
 if(r.id===id('INTRO.01'))return !!q.elderDiscipleObserved&&!separated(b);
 if(r.id===id('INTRO.02'))return !!q.attachedObserved&&!separated(b);
 if(r.id===id('INTRO.03'))return !!q.approach&&!separated(b);
 if(r.id===id('MID.01'))return blocked(app);
 if(r.id===id('MID.02'))return !separated(b)&&V.near(api.actor(b,'담허'),u,320)&&!!q.attachedObserved;
 if(r.id===id('MID.03'))return !separated(b)&&V.near(api.actor(b,'소단'),u,260)&&spoken(b,'release-request');
 if(r.id===id('MID.04'))return recovered(b);
 if(r.id===id('MID.05'))return recovered(b)&&!!q.knock;
 if(witness.includes(r.id))return recovered(b)&&!!q.knock;
 if(r.id===id('MID.06'))return heard(b)&&!!q.trappedObserved;
 if(r.id===id('MID.07'))return heard(b)&&!!q.trappedObserved;
 if(r.id.startsWith(id('COMPLETE.')))return heard(b)&&spoken(b,'souls')&&!!q.exitObserved;
 if(r.id===id('JOURNAL.01'))return heard(b);
 if(r.id===id('POPUP.01'))return !!q.discipleAim&&!separated(b);
 return r.id.startsWith(id('OBJECTIVE.'));
}
function observe(app){const e=app.engine,b=e.b,q=mem(b),u=unit(b,'resident-1'),elder=unit(b,'objective'),s=b.honroV4Reviewed16;
 if(V.alive(u)&&V.alive(elder)&&nearby(b,u,650)&&nearby(b,elder,650)&&V.near(elder,u,90))q.elderDiscipleObserved??={elder:elder.id,disciple:u.id,positions:[{x:elder.x,y:elder.y},{x:u.x,y:u.y}]};
 if(!separated(b)&&V.alive(unit(b,'resident-spirit-1'))&&V.near(api.actor(b,'소단'),u,650))q.attachedObserved??={spirit:'resident-spirit-1',target:u.id};
 if(nearby(b,s.transport,550))q.transportObserved??=clone(s.transport);
 q.positions??={};for(const t of foes(b,elder,1000)){const old=q.positions[t.id],d=Math.hypot(t.x-elder.x,t.y-elder.y);if(old&&d<old.d-1)q.approach??={actor:t.id,from:old,to:{x:t.x,y:t.y},distance:old.d-d};q.positions[t.id]={x:t.x,y:t.y,d};}
 const archer=api.actor(b,'설오');if(V.alive(archer)&&!q.blocked)for(const t of foes(b,elder,1000)){const hit=e.projectileCollision({x:archer.x,y:archer.y-archer.h*.63},{x:t.x,y:t.y-t.h*.5},1,archer.id,[],false);if(hit?.terrain&&/lantern|lamp|stone.?light/i.test(hit.terrain.id)){q.blocked={actor:archer.id,target:t.id,terrain:hit.terrain.id,from:{x:archer.x,y:archer.y}};break;}}
 if(recovered(b)&&!q.knock){e.emit('sound',{name:'ricochet',source:'16.bell.knock',...s.bellSource});e.fx('ring',s.bellSource.x,s.bellSource.y-70,'#b8bda9',45);q.knock={source:clone(s.bellSource),emitted:true};}
 // Visible residual souls at the bellward opening are independent of sound.
 if(heard(b)&&V.near(api.actor(b,'담허'),s.bellSource,650))q.trappedObserved??={observer:api.actor(b,'담허').id,source:clone(s.bellSource),souls:clone(s.souls),observed:true};
 if(heard(b)&&spoken(b,'souls')&&nearby(b,V.marker(b,'16.work-exit'),450))q.exitObserved??={point:clone(V.marker(b,'16.work-exit'))};
}
function scene(app,key,ids,proof,targets){const out=api.begin(app,key,ids,proof||{});if(out&&targets){for(const l of app.dialogue.lines)l[2].camera={id:l[2].rowId,intent:'situation',targets:clone(targets),padding:120,maxScale:.75};G.HonroStory.draw(app);}return out;}
function drive(app){const b=app.engine.b,q=mem(b);observe(app);if(!V.safe(app))return;
 const begin=(k,rows,p,t)=>scene(app,k,rows,p,t),start=(k,rows,condition,p,t)=>{if(!q.events[k]&&condition){begin(k,rows,p,t);return true;}return false;};
 if(start('arrival',['EDGE.ARRIVALS_16_0'],true,{},[{actor:'objective'},{actor:'resident-1'}]))return;
 if(start('branch',[id(b.honroEntryVariant?.choice==='B'?'BRANCH.02':'BRANCH.01')],!!b.honroEntryVariant&&!!q.elderDiscipleObserved,b.honroEntryVariant))return;
 if(start('elder',[id('INTRO.01')],!!q.elderDiscipleObserved))return;
 if(start('attached',[id('INTRO.02')],!!q.attachedObserved,q.attachedObserved))return;
 if(start('approach',[id('INTRO.03')],!!q.approach,q.approach))return;
 if(start('blocked',[id('MID.01')],blocked(app),q.blocked))return;
 if(start('release-request',[id('MID.02')],allow(app,api.row(id('MID.02')))))return;
 if(start('separate',[id('MID.03')],allow(app,api.row(id('MID.03')))))return;
 if(start('recovery',[id('MID.04')],recovered(b),physical(b).proof['16.safe']))return;
 if(start('sound',[id('MID.05')],recovered(b)&&spoken(b,'recovery')&&!!q.knock,q.knock,[b.honroV4Reviewed16.bellSource]))return;
 if(start('witness',witness,recovered(b)&&spoken(b,'sound'),physical(b).proof['16.safe'],[{actor:'objective'},{actor:'resident-1'}]))return;
 if(heard(b)){b.honroState.flags.witness16_heard=true;V.ackSlot(b,'16.testimony.required',{reviewedRevision:1,rowIds:clone(q.events.witness.ids),safe:clone(physical(b).proof['16.safe'])});if(!q.journal)api.journal(app,id('JOURNAL.01'));}
 if(start('souls',[id('MID.06'),id('MID.07')],heard(b)&&!!q.trappedObserved,q.trappedObserved,b.honroV4Reviewed16.souls))return;
 if(start('depart',[id('COMPLETE.01'),id('COMPLETE.02')],!!q.exitObserved&&heard(b)&&spoken(b,'souls'),q.exitObserved))return;
 start('protect',[id('POPUP.01')],!!q.discipleAim&&!separated(b),q.discipleAim);
}
function before(app){const b=app.engine.b;if(!V.safe(app))return false;observe(app);if(!spoken(b,'attached'))return false;if(separated(b)&&!spoken(b,'separate'))return false;if(V.current(b)?.id==='16.work-exit'&&!spoken(b,'depart'))return false;return true;}
function eligibility(app,m,s){if(s.id==='16.testimony')return{ok:false,reason:s.id};if(s.id==='16.elder'&&!spoken(app.engine.b,'attached')||s.id==='16.disciple'&&!spoken(app.engine.b,'separate'))return{ok:false,reason:s.id};return undefined;}
function use(app,m,s){if(s.id==='16.testimony')return false;return undefined;}
function attach(app,e){if(e.honroReviewed16Bound)return;e.honroReviewed16Bound=true;const predict=e.predict;e.predict=function(u,skill,...args){const out=predict.call(e,u,skill,...args),b=e.b,target=unit(b,'resident-1');if(api.active(b)&&u?.side===0&&!separated(b)&&V.alive(target)&&(args[2]?.id===target.id||Math.hypot(out.x-target.x,out.y-(target.y-target.h*.5))<target.r+35))mem(b).discipleAim={actor:u.id,target:target.id,skill:skill.id,endpoint:{x:out.x,y:out.y}};return out;};}
function draw(scene,c,b){const s=b.honroV4Reviewed16,q=mem(b);c.save();const elder=unit(b,'objective'),disciple=unit(b,'resident-1');if(!separated(b)&&V.alive(elder)&&V.alive(disciple)&&V.near(elder,disciple,90)){c.strokeStyle='#b8aa8b';c.lineWidth=5;c.beginPath();c.moveTo(elder.x-10,elder.y-52);c.lineTo(disciple.x+15,disciple.y-48);c.stroke();}c.strokeStyle='#a69d7b';c.lineWidth=5;c.beginPath();c.moveTo(s.transport.x-45,s.transport.y);c.lineTo(s.transport.x-40,s.transport.y-145);c.lineTo(s.transport.x+40,s.transport.y-145);c.lineTo(s.transport.x+45,s.transport.y);c.moveTo(s.transport.x,s.transport.y-145);c.lineTo(s.transport.x,s.transport.y-55);c.stroke();c.beginPath();c.arc(s.transport.x,s.transport.y-116,23,0,Math.PI*2);c.stroke();c.strokeStyle='#b3c2bc';c.globalAlpha=heard(b)?.6:.25;for(const p of s.souls){c.beginPath();c.ellipse(p.x,p.y-25,13,28,-.2,0,Math.PI*2);c.moveTo(p.x-10,p.y-26);c.lineTo(p.x-22,p.y-46);c.stroke();}if(q.knock){c.beginPath();c.arc(s.bellSource.x,s.bellSource.y-70,45,0,Math.PI*2);c.stroke();}c.restore();}
// Record rows only when Story actually presents the current witness line.
// Manuscript prefiltering and mere event admission cannot create this receipt.
const lineAllowed=G.HonroAct23V4Reviewed.lineAllowed;G.HonroAct23V4Reviewed.lineAllowed=function(app,who,meta){const ok=lineAllowed.apply(this,arguments),d=app.dialogue,b=app.engine?.b;if(ok&&api.active(b)&&meta?.reviewedStage===16&&d?.reviewedEvent==='witness'&&d.lines[d.index]?.[2]?.rowId===meta.rowId){const q=mem(b);q.witnessPresented??=[];if(!q.witnessPresented.includes(meta.rowId))q.witnessPresented.push(meta.rowId);}return ok;};
// A skipped UI scene never serves as the mandatory historical testimony.
const finished=G.HonroAct23V4Reviewed.finished;G.HonroAct23V4Reviewed.finished=function(app,d){if(api.active(app.engine?.b)&&d?.reviewedStage===16&&d.reviewedEvent==='witness'){const b=app.engine.b,q=mem(b);if(d.index<d.lines.length||!recovered(b)||!coreWitness.every(k=>q.witnessPresented?.includes(k))){delete q.events.witness;G.HonroStory.save(app);return false;}q.events.witness.ids=witness.filter(k=>q.witnessPresented.includes(k));}return finished.apply(this,arguments);};
const outcome=V.recordOutcome;V.recordOutcome=function(app,won){outcome(app,won);const b=app.engine?.b,h=app.profile.honroAct23V4History?.stages?.[16];if(won&&api.active(b)&&h)h.reviewedPhysical={revision:1,sourceRun:b.session,witness16_heard:heard(b),witnessRows:heard(b)?clone(mem(b).events.witness.ids):[],elderDiscipleObserved:!!mem(b).elderDiscipleObserved};};
const complete=b=>heard(b)&&spoken(b,'souls')&&spoken(b,'depart')&&!!mem(b).journal;
P.register(16,{mapRevision:516,actors:{'노승':'objective','제자':'resident-1'},author,prepare,allow,drive,before,eligibility,use,attach,draw,optional,objective:b=>heard(b)?id('OBJECTIVE.03'):recovered(b)?id('OBJECTIVE.02'):id('OBJECTIVE.01'),failure:b=>b.phase==='lost'||B.failure(b)?id('FAIL.01'):null,complete});
G.HonroAct23V4Reviewed16={memory:mem,allow,recovered,separated,heard,witness,coreWitness,optional,complete};
})(globalThis);
