(function(G){'use strict';
// Chapter22 provider + narrowly scoped observations. No common source writes.
const V=G.HonroAct23V4,C=G.HONRO_CORE,City=G.HonroAct23V4City,base=V.plugins.get(22),copy=x=>JSON.parse(JSON.stringify(x));
const data=()=>G.HONRO_ACT23_V4_REVIEWED_CH22;
const enabled=()=>V.preview()&&G.HONRO_ACT23_V4_PHASE_B_CH22===true&&data()?.stage===22&&data().revision===1&&data().status==='gemini_pass1_parent_review_gemini_pass3_complete';
const active=b=>enabled()&&V.active(b)&&b.honroStage===22&&b.honroReviewedNarrativeRevision===1;
const memory=b=>V.mem(b).reviewed22??={version:1,events:{},proof:{},positions:{},ambient:{distance:0,count:3}};
const cls={'설오':'archer','담허':'mage','휘겸':'knight','소단':'occultist'},actor=(b,who)=>V.heroes(b).find(u=>u.cls===cls[who]),unit=(b,id)=>b.units.find(u=>u.id===id),closed=q=>['done','skipped','cancelled'].includes(q?.status);
function row(id){if(id==='EDGE.FAILURE_GUARD.S22'){const r=G.HONRO_ACT23_V4_REVIEWED_CH21?.rows?.find(r=>r.id==='EDGE.FAILURE_GUARD.S21');return r?{...r,id}:undefined;}return data()?.rows.find(r=>r.id===id);}
function traces(p){const h=p.honroAct23V4History?.stages?.[19];return !!h?.run&&h.slots?.includes('19.transport-traces')&&['mumyeong-transfer','royal-seal','jeomungol-mark'].every(id=>h.transportTraces?.ids?.includes(id));}
function gateRescued(p){const h=p.honroAct23V4History?.stages?.[21];return !!h?.run&&h.reviewedNarrative?.revision===1&&h.reviewedNarrative.rescued===true;}
function restAllowed(p,who,id){const c=cls[who];if(!c||!p.recruited?.includes(c)||!p.party?.includes(c)||p.honroBattle||p.cleared?.[22]||G.HonroJourneyContent.next(p)?.stageId!==22)return false;if(id==='EDGE.OPTIONAL_22_KNIGHT_0')return traces(p);if(id==='EDGE.OPTIONAL_22_OCCULTIST_0')return gateRescued(p);return true;}
function rowsReviewed(ls){return enabled()&&Array.isArray(ls)&&ls.length>0&&ls.every(l=>{const r=row(l?.[2]?.rowId);return r&&r.speaker===l[0]&&r.text===l[1]&&l[2].reviewedStage===22&&l[2].reviewedRevision===1&&['audience','delivery','once','group','order','progress','deadline','owner','party_shared','presentation'].every(k=>JSON.stringify(l[2][k])===JSON.stringify(r[k]));});}
function bundle(b){const s=V.mem(b).slots['22.records-compare'];return V.mem(b).done['v4.record-bundle']&&s?.context.contents?.length===3&&['official-report','population-register','canal-plan'].every(id=>s.context.contents.includes(id))&&Object.values(V.mem(b).cargo||{}).some(q=>q.id==='v4:22:v4.record-bundle'&&q.revision===1)&&City.cacheSafe(b);}
function sightBlocked(app){const b=app.engine.b,u=actor(b,'설오');if(!u)return false;return b.units.some(v=>V.alive(v)&&v.side===1&&v.y<u.y-150&&Math.hypot(v.x-u.x,v.y-u.y)<1800&&!!app.engine.projectileCollision({x:u.x,y:u.y-u.h*.63},{x:v.x,y:v.y-v.h*.6},1,u.id,[],false)?.terrain);}
function upperAim(app){const b=app.engine.b,q=memory(b).proof.upperAim;if(!q)return false;const u=unit(b,q.actor),target=unit(b,q.target);return V.alive(u)&&V.alive(target)&&u.y<target.y-100&&app.engine.predict(u,C.SKILLS[q.skill],q.angle,q.power).unit===target.id;}
function lineAllowed(app,who,meta){const r=row(meta?.rowId);if(!enabled()||!r||meta.reviewedStage!==22||meta.reviewedRevision!==1||r.speaker!==who)return false;
 if(app.screen==='rest')return r.channel==='optional'&&restAllowed(app.profile,who,r.id);
 const b=app.engine?.b;if(!active(b)||cls[who]&&!actor(b,who))return false;if(r.channel==='failure')return b.phase==='lost'&&!!actor(b,'휘겸');if(['won','lost'].includes(b.phase))return false;
 const q=memory(b),id=r.id;
 if(r.channel==='arrival')return gateRescued(app.profile);
 if(id==='A3.S22.INTRO.01')return !!b.terrain.find(t=>t.id==='archive-door'&&!t.broken);
 if(id==='A3.S22.INTRO.02')return sightBlocked(app);
 if(id==='A3.S22.INTRO.03')return !!q.proof.shelfMovement&&V.alive(unit(b,q.proof.shelfMovement.actor));
 if(id==='A3.S22.SEAL.01')return !!V.mem(b).done['archive-seal']&&!!b.terrain.find(t=>t.id==='archive-door'&&t.broken);
 if(id==='A3.S22.UPPER_DANGER.01')return upperAim(app);
 if(id==='A3.S22.COMPARE.04')return bundle(b)&&traces(app.profile);
 if(id.startsWith('A3.S22.COMPARE.')||id.startsWith('A3.S22.MAP.')||r.channel==='document')return bundle(b);
 if(id==='A3.S22.EXIT.01')return closed(q.events.records)&&q.ambient.distance>=60&&V.heroes(b).some(u=>V.near(u,V.marker(b,'archive-exit'),220));
 if(id==='A3.S22.EXIT.02')return closed(q.events.records)&&V.heroes(b).some(u=>V.near(u,V.marker(b,'archive-exit'),220));
 return false;
}
function lines(ids,event){return ids.map(id=>{const r=row(id);return[r.speaker,r.text,{...copy(r),rowId:id,reviewedStage:22,reviewedRevision:1,reviewedEvent:event,storyId:'v4.reviewed.22.'+event,storyTitle:G.HONRO_CONTENT.stages[21].name,...(r.channel==='document'?{kind:'document'}:r.channel==='arrival'?{kind:'narration'}:{})}];});}
function accepts(app,ls){return rowsReviewed(ls)&&ls.some(l=>lineAllowed(app,l[0],l[2]));}
function begin(app,key,ids){const b=app.engine.b,q=memory(b);if(q.events[key])return false;const ls=lines(ids,key).filter(l=>lineAllowed(app,l[0],l[2]));q.events[key]={status:ls.length?'open':'skipped',ids:ls.map(l=>l[2].rowId)};V.slot(app,'22.reviewed.'+key,{rowIds:ids});if(!ls.length){V.ackSlot(b,'22.reviewed.'+key,{skipped:true});return false;}
 for(const l of ls)l[2].camera={id:l[2].rowId,intent:'situation',targets:key==='records'?[{marker:'v4.record-bundle'}]:key==='exit'?[{marker:'archive-exit'}]:[{marker:'archive-seal'},{actor:'v22-a4'}],padding:100,maxScale:.7};
 if(!G.HonroStory.start(app,ls,{title:app.stage.name,reviewedStage:22,reviewedEvent:key})){delete q.events[key];return false;}return true;}
function finished(app,d){if(d?.reviewedStage!==22||!active(app.engine?.b))return false;const b=app.engine.b,event=memory(b).events[d.reviewedEvent];if(event){event.status='done';V.ackSlot(b,'22.reviewed.'+d.reviewedEvent,{rowIds:event.ids});if(d.reviewedEvent==='records'){memory(b).proof.compared={source:'v4.record-bundle',contents:copy(V.mem(b).slots['22.records-compare'].context.contents),map:true};V.ackSlot(b,'22.records-compare',{reviewed:true,rowIds:event.ids});}G.HonroStory.save(app);}if(d.reviewedEvent==='failure'){app.outcome(true);return true;}return false;}
function tick(app,dt){const b=app.engine.b;if(!active(b)||!V.safe(app))return;const q=memory(b);
 if(!q.events.arrival){begin(app,'arrival',['EDGE.ARRIVALS_22_0']);return;}
 // Reuse a real existing guard beside the authored shelf bay. Short swept
 // movement is budgeted and observed, with no spawn/XP/terrain replacement.
 if(!q.events.intro&&!q.proof.shelfMovement){const u=unit(b,'v22-a4'),old=q.positions[u.id]??={x:u.x,y:u.y},probe={...u,fixed:false,vx:0,vy:0};if(V.alive(u)&&C.validTerrainContactPose(b.terrain,u)){app.engine.walk(probe,1,Math.min(.025,Math.max(0,dt)),true);app.engine.integrateBody(probe,Math.min(.025,Math.max(0,dt)),true);if(C.validTerrainContactPose(b.terrain,probe)){Object.assign(u,{x:probe.x,y:probe.y,moveLeft:probe.moveLeft,facing:probe.facing,moving:.12});if(Math.hypot(u.x-old.x,u.y-old.y)>=16)q.proof.shelfMovement={actor:u.id,from:old,to:{x:u.x,y:u.y},shelf:'v22-art-seal-record-bay'};}}if(!q.proof.shelfMovement&&V.alive(u))return;}
 if(!q.events.intro){begin(app,'intro',[1,2,3].map(i=>'A3.S22.INTRO.0'+i));return;}
 if(V.mem(b).done['archive-seal']&&!q.events.seal){begin(app,'seal',['A3.S22.SEAL.01']);return;}
 if(!q.events.upper&&upperAim(app)){begin(app,'upper',['A3.S22.UPPER_DANGER.01']);return;}
 if(bundle(b)&&!q.events.records){begin(app,'records',['A3.S22.DOC.REPORT','A3.S22.DOC.REGISTER',...[1,2,3,4,5,6].map(i=>'A3.S22.COMPARE.0'+i),'A3.S22.DOC.MAP',...[1,2,3].map(i=>'A3.S22.MAP.0'+i)]);return;}
 if(closed(q.events.records)&&q.proof.compared&&!q.journal){const r=row('A3.S22.JOURNAL.01');app.profile.record??=[];if(!app.profile.record.some(x=>x.rowId===r.id&&x.sourceRun===b.session))app.profile.record.push({place:app.stage.name,text:r.text,rowId:r.id,reviewedRevision:1,sourceRun:b.session});q.journal={rowId:r.id};app.dirty=true;}
 if(closed(q.events.records)&&V.heroes(b).some(u=>V.near(u,V.marker(b,'archive-exit'),220))){q.ambient.distance=Math.min(120,q.ambient.distance+Math.max(0,Math.min(dt,.05))*140);if(q.ambient.distance>=60&&!q.events.exit)begin(app,'exit',['A3.S22.EXIT.01','A3.S22.EXIT.02']);}
}
function complete(b){return !active(b)||closed(memory(b).events.exit)&&!!memory(b).proof.compared&&!!memory(b).journal;}
function present(b,r){if(!active(b))return r;const q=memory(b),i=closed(q.events.records)?3:V.mem(b).done['archive-seal']?2:1,id='A3.S22.OBJ.0'+i,text=row(id).text;return{...r,summary:text,currentInstruction:text,completionText:row('A3.S22.OBJ.03').text,targets:r.targets.map(x=>({...x,label:text})),allTargets:r.allTargets.map(x=>({...x,label:text})),checklist:[1,2,3].map(j=>({id:'A3.S22.OBJ.0'+j,text:row('A3.S22.OBJ.0'+j).text,done:j<i,current:j===i})),visibleChecklist:[{id,text,current:true,done:r.complete}],failureText:''};}
function content(b,s){return active(b)?{...s,goal:present(b,{targets:[],allTargets:[]}).summary,guide:'',story:[],outro:[],failure:[],narration:[],honroV4Unreviewed:false,honroReviewedNarrativeRevision:1}:s;}
function optional(p,id,c){if(!enabled()||Number(id)!==22)return null;return lines(data().rows.filter(r=>r.id.startsWith('EDGE.OPTIONAL_22_'+c.toUpperCase()+'_')).map(r=>r.id),'optional.'+c).filter(l=>restAllowed(p,l[0],l[2].rowId));}
function journal(p,id){if(!enabled()||Number(id)!==22)return null;const r=row('A3.S22.JOURNAL.01');return p.record?.find(x=>x.rowId===r.id&&x.reviewedRevision===1&&x.sourceRun&&x.text===r.text)||null;}
function failure(app){return active(app.engine?.b)&&!app.dialogue&&app.engine.b.phase==='lost'&&row('EDGE.FAILURE_GUARD.S22')?begin(app,'failure',['EDGE.FAILURE_GUARD.S22']):false;}
function attach(app,e){base.attach?.(app,e);if(!active(e.b)||e.honroReviewed22Shot)return;e.honroReviewed22Shot=true;const fire=e.fire.bind(e);e.fire=function(skill,angle,power,...args){const u=e.active,targets=V.heroes(e.b),prediction=u?.side===1&&u.cls==='archer'?e.predict(u,C.SKILLS[skill],angle,power):null,target=prediction&&targets.find(h=>h.id===prediction.unit&&u.y<h.y-100),out=fire(skill,angle,power,...args);if(out&&target)memory(e.b).proof.upperAim={actor:u.id,target:target.id,skill,angle,power};return out;};}
V.register(22,{...base,author(map,p){base.author(map,p);if(enabled())map.initialState.honroReviewedNarrativeRevision=1;},attach,tick(app,dt){if(!active(app.engine.b)){base.tick(app,dt);return;}base.tick(app,dt);tick(app,dt);},complete(b){return base.complete(b)&&complete(b);},draw(scene,c,b,e){base.draw?.(scene,c,b,e);if(!active(b)||!memory(b).proof.compared)return;const p=V.marker(b,'archive-exit'),q=memory(b).ambient;c.save();c.strokeStyle='#b0cbbf';c.lineWidth=2;for(let i=0;i<q.count;i++){c.globalAlpha=.28+i*.06;c.beginPath();c.ellipse(p.x+130+i*35+q.distance,p.y-70-i*23,11,24,-.2,0,Math.PI*2);c.stroke();}c.restore();}});
const prepare=V.prepare;V.prepare=function(b,p){const out=prepare(b,p);if(active(b))b.honroNarrativeContent=content(b,b.honroNarrativeContent);return out;};
const resolve=G.HonroNarrativeCatalogue.resolve;G.HonroNarrativeCatalogue.resolve=(b,s)=>content(b,resolve(b,s));
const summary=G.HonroNarrativeCatalogue.summary;G.HonroNarrativeCatalogue.summary=(b,s)=>active(b)?(memory(b).journal?row('A3.S22.JOURNAL.01').text:''):summary(b,s);
const migrate=V.migratePresentation;V.migratePresentation=function(p){migrate(p);if(enabled()&&p.honroReviewed22PresentationRevision!==1){if(p.honroJourney?.story?.stageId===22)p.honroJourney.story=null;p.honroReviewed22PresentationRevision=1;}};
const outcome=V.recordOutcome;V.recordOutcome=function(app,won){outcome(app,won);if(won&&active(app.engine?.b))app.profile.honroAct23V4History.stages[22].reviewedNarrative={revision:1,compared:copy(memory(app.engine.b).proof.compared||null),rows:Object.values(memory(app.engine.b).events).filter(q=>q.status==='done').flatMap(q=>q.ids)};};
for(const key of ['interlude','required','optional']){const old=G.HonroJourneyContent[key];G.HonroJourneyContent[key]=function(...args){const id=key==='interlude'?args[0]:args[1];return enabled()&&Number(id)===22?(key==='optional'?optional(...args):[]):old.apply(this,args);};}
const placeAt=G.HonroJourneyContent.at,placeNext=G.HonroJourneyContent.next,alias=p=>enabled()&&p?.stageId===22?{...p,restDescription:row('EDGE.ARRIVALS_22_0').text}:p;
G.HonroJourneyContent.at=(...args)=>alias(placeAt(...args));G.HonroJourneyContent.next=(...args)=>alias(placeNext(...args));
G.HonroAct23V4Chapter22Reviewed={enabled,active,memory,row,rowsReviewed,lineAllowed,accepts,finished,present,content,failure,optional,journal,complete,traces,gateRescued,lines,talkId:(id,c)=>enabled()&&Number(id)===22?'rest-talk-v1-22-'+c+'-reviewed1':null};
})(globalThis);
