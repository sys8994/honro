(function(G){'use strict';
// Independent provider; the parent owns common-registry dispatch and bundling.
const V=G.HonroAct23V4,S=G.HonroAct23V4Chapter21,copy=x=>JSON.parse(JSON.stringify(x));
const data=()=>G.HONRO_ACT23_V4_REVIEWED_CH21;
const enabled=()=>V.preview()&&G.HONRO_ACT23_V4_PHASE_B_CH21===true&&data()?.stage===21&&data().revision===1&&data().status==='gemini_pass1_parent_review_gemini_pass3_complete';
const active=b=>enabled()&&V.active(b)&&b.honroStage===21&&b.honroReviewedNarrativeRevision===1&&b.honroV4Chapter21?.revision===1;
const row=id=>data()?.rows.find(r=>r.id===id),memory=S.memory,cls={'설오':'archer','담허':'mage','휘겸':'knight','소단':'occultist'};
const actor=(b,who)=>who==='곽진'?b.units.find(u=>u.id==='v4.gwakjin'&&V.alive(u)):V.heroes(b).find(u=>u.cls===cls[who]);
const closed=q=>['done','skipped','cancelled'].includes(q?.status);
function rowsReviewed(ls){return enabled()&&Array.isArray(ls)&&ls.length>0&&ls.every(l=>{const r=row(l?.[2]?.rowId);return r&&r.speaker===l[0]&&r.text===l[1]&&l[2].reviewedStage===21&&l[2].reviewedRevision===1&&['audience','delivery','once','group','order','progress','deadline','owner','party_shared','presentation'].every(k=>JSON.stringify(l[2][k])===JSON.stringify(r[k]));});}
function restAllowed(profile,who){const c=cls[who],q=profile.honroReviewed21RestObservation,b=profile.honroBattle;return !!c&&profile.recruited?.includes(c)&&profile.party?.includes(c)&&q?.stage===21&&q.revision===1&&q.visible===true&&q.actors?.[c]?.alive===true&&!profile.cleared?.[21]&&!b&&G.HonroJourneyContent.next(profile)?.stageId===21;}
// Called only by a real pre-entry field preview renderer. A place description,
// map unlock or chapter number alone supplies no observation evidence.
function observeRest(app,preview){const p=app.profile,b=preview?.battle;if(app.screen!=='rest'||!preview?.rendered||!S.active(b)||p.honroBattle||p.cleared?.[21]||!S.introReady(b)||V.mem(b).city?.started)return false;
 p.honroReviewed21RestObservation={stage:21,revision:1,visible:true,sourceRun:b.session,actors:Object.fromEntries(V.heroes(b).map(u=>[u.cls,{id:u.id,alive:true}]))};return true;}
function lineAllowed(app,who,meta){const r=row(meta?.rowId);if(!enabled()||!r||meta.reviewedStage!==21||meta.reviewedRevision!==1||who!==r.speaker)return false;
 if(app.screen==='rest')return r.channel==='optional'&&(app.profile.honroJourney?.restStageId===21||app.debugRestStage===21||G.HonroJourneyContent.next(app.profile)?.stageId===21)&&restAllowed(app.profile,who);
 const b=app.engine?.b;if(!active(b)||!['dialogue','arrival','guide','failure'].includes(r.channel))return false;if((cls[who]||who==='곽진')&&!actor(b,who))return false;
 if(r.channel==='failure')return b.phase==='lost'&&!!actor(b,'휘겸');if(['won','lost'].includes(b.phase))return false;
 return S.facts(b,r.id);
}
function lines(ids,event){return ids.map(id=>{const r=row(id);return[r.speaker,r.text,{...copy(r),rowId:id,reviewedStage:21,reviewedRevision:1,reviewedEvent:event,storyId:'v4.reviewed.21.'+event,storyTitle:G.HONRO_CONTENT.stages[20].name,...(r.channel==='arrival'?{kind:'narration'}:r.channel==='guide'?{kind:'guide'}:{})}];});}
function accepts(app,ls){return rowsReviewed(ls)&&ls.some(l=>lineAllowed(app,l[0],l[2]));}
function begin(app,key,ids){const b=app.engine.b,q=memory(b);if(q.events[key])return false;const ls=lines(ids,key).filter(l=>lineAllowed(app,l[0],l[2]));q.events[key]={status:ls.length?'open':'skipped',ids:ls.map(l=>l[2].rowId)};
 const targets=['clear','exit'].includes(key)?[q.wreck,{actor:'v4.gwakjin'}]:[{actor:b.honroV4CitySpec.resident},{actor:'v4.gwakjin'},key==='intro'?{actor:b.honroV4Chapter21.old}:{x:1740,y:2640}];
 for(const l of ls)l[2].camera={id:l[2].rowId,intent:'situation',targets:copy(targets),padding:125,maxScale:.75};
 V.slot(app,'21.reviewed.'+key,{rowIds:ids});if(!ls.length){V.ackSlot(b,'21.reviewed.'+key,{skipped:true});return false;}
 if(!G.HonroStory?.start(app,ls,{title:app.stage.name,reviewedStage:21,reviewedEvent:key})){delete q.events[key];return false;}return true;
}
function finished(app,d){if(d?.reviewedStage!==21||!active(app.engine?.b))return false;const b=app.engine.b,q=memory(b),event=q.events[d.reviewedEvent];if(event){event.status='done';V.ackSlot(b,'21.reviewed.'+d.reviewedEvent,{rowIds:event.ids});G.HonroStory.save(app);}
 if(d.reviewedEvent==='failure'){app.outcome(true);return true;}return false;}
function tick(app){const b=app.engine.b;if(!active(b)||!V.safe(app))return;const q=memory(b);
 for(const [key,event]of Object.entries(q.events))if(event.status==='open'&&!app.dialogue){event.status='cancelled';V.ackSlot(b,'21.reviewed.'+key,{cancelled:true});}
 if((b.honroState.storyQueue||[]).length)return;
 if(!q.events.arrival){begin(app,'arrival',['EDGE.ARRIVALS_21_0']);return;}
 if(!q.events.intro){begin(app,'intro',[1,2,3,4].map(i=>'A3.S21.INTRO.0'+i));return;}
 if(S.cartStopped(b)&&!q.events.cart){begin(app,'cart',['A3.S21.CART_STOP.01','A3.S21.CART_STOP.02']);return;}
 if(S.cartStopped(b)&&S.threatened(b)&&!q.events.danger){begin(app,'danger',['A3.S21.CIVILIAN_DANGER.01','A3.S21.CIVILIAN_DANGER.02']);return;}
 if(S.facts(b,'A3.S21.LAST_ESCORT.01')&&!q.events.last){begin(app,'last',['A3.S21.LAST_ESCORT.01']);return;}
 if(S.routeBlocked(b)&&!q.events.blocked){begin(app,'blocked',['A3.S21.GUIDE.01']);return;}
 if(S.rescued(b)&&q.proof.emblem){if(!q.events.clear){begin(app,'clear',[1,2,3,4,5,6].map(i=>'A3.S21.CLEAR.0'+i));return;}
  if(closed(q.events.clear)&&!q.events.exit){begin(app,'exit',['A3.S21.EXIT.01','A3.S21.EXIT.02']);return;}
  // This exact journal also asserts recognition and current soldier activity.
  // Do not manufacture those facts in a dead/missing-knight or guard run.
  if(closed(q.events.exit)&&!q.journal&&q.events.intro?.ids.includes('A3.S21.INTRO.02')&&q.events.intro?.ids.includes('A3.S21.INTRO.03')&&q.events.exit?.ids.includes('A3.S21.EXIT.01')&&b.honroV4ArmorDistinction.current.every(id=>V.alive(b.units.find(u=>u.id===id)))){
   const r=row('A3.S21.JOURNAL.01');app.profile.record??=[];if(!app.profile.record.some(x=>x.rowId===r.id&&x.sourceRun===b.session))app.profile.record.push({place:app.stage.name,text:r.text,rowId:r.id,reviewedRevision:1,sourceRun:b.session});q.journal={rowId:r.id,proof:copy(q.proof.emblem)};app.dirty=true;
  }
 }
}
function complete(b){return !active(b)||closed(memory(b).events.exit);}
function present(b,result){if(!active(b))return result;const id='A3.S21.OBJ.0'+(S.rescued(b)?3:S.cartStopped(b)?2:1),r=row(id);return{...result,summary:r.text,currentInstruction:r.text,completionText:row('A3.S21.OBJ.03').text,targets:result.targets.map(x=>({...x,label:r.text})),allTargets:result.allTargets.map(x=>({...x,label:r.text})),checklist:[1,2,3].map(i=>({id:'A3.S21.OBJ.0'+i,text:row('A3.S21.OBJ.0'+i).text,done:i<(S.rescued(b)?3:S.cartStopped(b)?2:1),current:id.endsWith('0'+i)})),visibleChecklist:[{id,text:r.text,current:true,done:result.complete}],failureText:''};}
function content(b,st){return active(b)?{...st,goal:present(b,{targets:[],allTargets:[]}).summary,guide:'',story:[],outro:[],failure:[],narration:[],honroV4Unreviewed:false,honroReviewedNarrativeRevision:1}:st;}
function optional(profile,id,c){if(!enabled()||Number(id)!==21)return null;return lines(data().rows.filter(r=>r.id.startsWith('EDGE.OPTIONAL_21_'+c.toUpperCase()+'_')).map(r=>r.id),'optional.'+c).filter(l=>restAllowed(profile,l[0]));}
function journal(profile,id){if(!enabled()||Number(id)!==21)return null;const r=row('A3.S21.JOURNAL.01');return profile.record?.find(x=>x.rowId===r.id&&x.reviewedRevision===1&&x.sourceRun&&x.text===r.text)||null;}
function failure(app){return active(app.engine?.b)&&!app.dialogue&&app.engine.b.phase==='lost'?begin(app,'failure',['EDGE.FAILURE_GUARD.S21']):false;}
function migrate(p){if(!enabled()||p.honroReviewed21PresentationRevision===1)return;if(p.honroJourney?.story?.stageId===21)p.honroJourney.story=null;p.honroReviewed21PresentationRevision=1;}
const prepare=V.prepare;V.prepare=function(b,p){const out=prepare(b,p);if(active(b))b.honroNarrativeContent=content(b,b.honroNarrativeContent);return out;};
const migratePresentation=V.migratePresentation;V.migratePresentation=function(p){migratePresentation(p);migrate(p);};
const resolve=G.HonroNarrativeCatalogue.resolve;G.HonroNarrativeCatalogue.resolve=(b,st)=>content(b,resolve(b,st));
const summary=G.HonroNarrativeCatalogue.summary;G.HonroNarrativeCatalogue.summary=(b,st)=>active(b)?(memory(b).journal?row('A3.S21.JOURNAL.01').text:''):summary(b,st);
const outcome=V.recordOutcome;V.recordOutcome=function(app,won){outcome(app,won);if(won&&active(app.engine?.b)){const q=memory(app.engine.b),h=app.profile.honroAct23V4History.stages[21];h.reviewedNarrative={revision:1,status:data().status,rows:Object.values(q.events).filter(e=>e.status==='done').flatMap(e=>e.ids),proof:copy(q.proof),rescued:S.rescued(app.engine.b)};}};
for(const key of ['interlude','required','optional']){const old=G.HonroJourneyContent[key];G.HonroJourneyContent[key]=function(...args){const id=key==='interlude'?args[0]:args[1];return enabled()&&Number(id)===21?(key==='optional'?optional(...args):[]):old.apply(this,args);};}
// Description aliases are presentation lookups and never consume arrival seen.
const placeAt=G.HonroJourneyContent.at,placeNext=G.HonroJourneyContent.next;
const placeAlias=p=>enabled()&&p?.stageId===21?{...p,restDescription:row('EDGE.ARRIVALS_21_0').text}:p;
G.HonroJourneyContent.at=(...args)=>placeAlias(placeAt(...args));G.HonroJourneyContent.next=(...args)=>placeAlias(placeNext(...args));
G.HonroAct23V4Chapter21Reviewed={enabled,active,row,rowsReviewed,lineAllowed,accepts,finished,present,content,failure,optional,journal,tick,memory,complete,observeRest,restAllowed,lines,talkId:(id,c)=>enabled()&&Number(id)===21?'rest-talk-v1-21-'+c+'-reviewed1':null,place:id=>enabled()&&Number(id)===21?{restDescription:row('EDGE.ARRIVALS_21_0').text}:null};
})(globalThis);
