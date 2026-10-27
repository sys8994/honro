(function(G){'use strict';
// Only the explicitly reviewed chapter11 manuscript. Normal builds carry no
// reviewed catalogue payload and neither this gate nor the Phase A gate opens.
const V=G.HonroAct23V4,C=G.HONRO_CORE,clone=x=>JSON.parse(JSON.stringify(x));
const data=()=>G.HONRO_ACT23_V4_REVIEWED;
const enabled=()=>V.preview()&&G.HONRO_ACT23_V4_PHASE_B_CH11===true&&data()?.stage===11&&data().revision===1&&data().status==='gemini_pass1_parent_review_gemini_pass3_complete';
const active=b=>enabled()&&V.active(b)&&b.honroStage===11&&b.honroReviewedNarrativeRevision===1;
const row=id=>data()?.rows.find(r=>r.id===id);
const cls={'설오':'archer','담허':'mage','휘겸':'knight','소단':'occultist'};
const actor=(b,who)=>V.heroes(b).find(u=>u.cls===cls[who]);
const memory=b=>V.mem(b).reviewed11??={revision:1,events:{},positions:{},ambient:{count:8,elapsed:0,distance:0}};
const scenes=b=>G.HonroAct23V4Act2Scenes.memory(b);
const closed=q=>['done','skipped'].includes(q?.status);
// Phase A has no bier/collision, release from a beast, or two-new-spirit event.
// Keep reviewed rows addressable for integration, but never fabricate evidence.
const requiredScenes=Object.freeze({
 'EDGE.ARRIVALS_11_0':'missing-bier-and-tracks',
 'A2.S11.MID.01':'missing-bier-possession-scene',
 'A2.S11.MID.02':'missing-bier-sightline',
 'A2.S11.MID.03':'missing-beast-spirit-release',
 'A2.S11.MID.04':'missing-north-response-event',
 'A2.S11.MID.05':'missing-two-spirit-admission',
 'A2.S11.WARN.01':'missing-bier-shot-obstruction',
 'A2.S11.POPUP.01':'missing-bier-shot-obstruction'
});
const blocked=Object.freeze({});
function rowsReviewed(lines){return enabled()&&Array.isArray(lines)&&lines.length>0&&lines.every(l=>{const r=row(l?.[2]?.rowId);return r&&l[0]===r.speaker&&l[1]===r.text&&l[2].reviewedStage===11&&l[2].reviewedRevision===1;});}
function restAllowed(profile,who){const c=cls[who];if(!c||!profile.recruited?.includes(c))return false;const b=profile.honroBattle;return b?.honroStage===11?!!actor(b,who):true;}
function gathered(b){const p=V.marker(b,'11.exit');return ['archer','mage','knight','occultist'].every(c=>V.heroes(b).some(u=>u.cls===c&&V.near(u,p,180)&&C.validTerrainContactPose(b.terrain,u)));}
function lineAllowed(app,who,meta){const id=meta?.rowId;if(!enabled()||!row(id)||meta.reviewedStage!==11||blocked[id])return false;
 if(app.screen==='rest')return row(id).channel==='optional'&&(app.profile.honroJourney?.restStageId===11||app.debugRestStage===11||G.HonroJourneyContent.next(app.profile)?.stageId===11)&&restAllowed(app.profile,who);
 const b=app.engine?.b;if(!active(b)||cls[who]&&!actor(b,who))return false;const q=memory(b),s=scenes(b);
 if(id==='EDGE.FAILURE_GUARD.S11')return b.phase==='lost'&&!!actor(b,'휘겸');
 if(['won','lost'].includes(b.phase))return false;
 if(requiredScenes[id])return G.HonroAct23V4Chapter11?.facts(b,id)===true;
 if(id==='A2.S11.INTRO.01')return !!s.proof['11.thread'];
 if(['A2.S11.INTRO.02','A2.S11.INTRO.03'].includes(id))return !!q.approach&&(q.approach.ambient||q.approach.ids.some(id=>V.alive(b.units.find(u=>u.id===id))))&&!V.mem(b).done['11.exit'];
 if(id==='A2.S11.INTRO.04')return q.events.approach?.status==='done'&&!V.mem(b).done['11.exit'];
 if(id==='A2.S11.COMPLETE.01')return gathered(b);
 if(id==='A2.S11.COMPLETE.02')return !!s.bell?.struck;
 if(['A2.S11.COMPLETE.03','A2.S11.COMPLETE.04'].includes(id))return !!s.bell?.struck&&q.ambient.distance>=80&&q.ambient.count>=6&&V.near(actor(b,who),V.marker(b,'11.north'),650);
 if(id==='A2.S11.COMPLETE.05')return !!s.proof['11.north']&&closed(q.events.reaction);
 return false;
}
function lines(ids,event){return ids.map(id=>{const r=row(id);return[r.speaker,r.text,{rowId:id,reviewedStage:11,reviewedRevision:1,reviewedEvent:event,storyId:'v4.reviewed.11.'+event,storyTitle:G.HONRO_CONTENT.stages[10].name,...(r.channel==='guide'?{kind:'guide'}:r.channel==='arrival'?{kind:'narration'}:{})}];});}
function accepts(app,ls){return rowsReviewed(ls)&&ls.every(l=>!blocked[l[2].rowId])&&ls.some(l=>lineAllowed(app,l[0],l[2]));}
function begin(app,key,ids,proof={}){const b=app.engine.b,q=memory(b);if(q.events[key])return false;const valid=lines(ids,key).filter(l=>lineAllowed(app,l[0],l[2]));q.events[key]={status:valid.length?'open':'skipped',ids:valid.map(l=>l[2].rowId),proof:clone(proof)};
 for(const l of valid){const target=key==='approach'?(proof.ambient?{x:1000,y:6280}:{actor:proof.ids[0]}):['arrival','low-beast','high-sightline','blocked-shot','cover-guide'].includes(key)?{x:1500,y:6330}:['bell','reaction','gather','depart'].includes(key)?{marker:'11.north'}:null;if(target)l[2].camera={id:l[2].rowId,intent:'situation',targets:[target],padding:110,maxScale:.8};}
 for(const l of valid){const physical=b.honroV4Chapter11,targets=key==='north-warning'?[physical.entries[0]]:key==='north-pair'?proof.ids.map(actor=>({actor})):key==='spirit-release'?[...proof.ids.map(actor=>({actor})),{actor:proof.attached}]:key==='high-sightline'?[physical.high,physical.bier]:null;if(targets)l[2].camera={id:l[2].rowId,intent:'situation',targets:clone(targets),padding:110,maxScale:.8};}
 V.slot(app,'11.reviewed.'+key,{rowIds:ids,proof});if(!valid.length){V.ackSlot(b,'11.reviewed.'+key,{skipped:true});return false;}
 if(!G.HonroStory?.start(app,valid,{title:app.stage.name,reviewedEvent:key,reviewedStage:11})){delete q.events[key];return false;}return true;
}
function finished(app,d){if(d?.reviewedStage!==11||!active(app.engine?.b))return false;const b=app.engine.b,q=memory(b),event=q.events[d.reviewedEvent];if(event){event.status='done';V.ackSlot(b,'11.reviewed.'+d.reviewedEvent,{rowIds:event.ids});G.HonroStory.save(app);}
 if(d.reviewedEvent==='failure'){app.outcome(true);return true;}return false;
}
function observeApproach(b){const q=memory(b);if(q.approach)return;const incoming=G.HonroAct23V4Chapter11?.memory(b).incoming;if(incoming?.distance>=40){q.approach={ids:[],ambient:true,count:incoming.count,distance:incoming.distance,round:b.round};return;}const found=[];for(const u of b.units){if(!V.alive(u)||u.side!==1||!['ghost','shade','echo','resonance'].includes(u.honroType||u.cls))continue;const d=Math.min(...V.heroes(b).map(h=>Math.hypot(h.x-u.x,(h.y-u.y)*.75))),old=q.positions[u.id];q.positions[u.id]={x:u.x,y:u.y,d};if(old&&d<850&&d<old.d-2&&Math.hypot(u.x-old.x,u.y-old.y)>2&&u.x>Math.min(...V.heroes(b).map(h=>h.x)))found.push(u.id);}
 if(found.length)q.approach={ids:found,round:b.round};
}
function tick(app,dt){const b=app.engine.b;if(!active(b)||!V.safe(app))return;const q=memory(b),s=scenes(b);observeApproach(b);
 for(const [key,event]of Object.entries(q.events))if(event.status==='open'&&!app.dialogue&&!event.ids.some(id=>lineAllowed(app,row(id).speaker,{rowId:id,reviewedStage:11,reviewedRevision:1}))){event.status='skipped';V.ackSlot(b,'11.reviewed.'+key,{skipped:true});if(b.honroStory?.reviewedEvent===key)b.honroStory=null;}
 if((b.honroState.storyQueue||[]).length)return;
 if(!q.events.arrival){begin(app,'arrival',['EDGE.ARRIVALS_11_0']);return;}
 if(!q.events.thread&&s.proof['11.thread']){begin(app,'thread',['A2.S11.INTRO.01'],s.proof['11.thread']);return;}
 if(q.approach&&!q.events.approach&&!V.mem(b).done['11.exit']){begin(app,'approach',['A2.S11.INTRO.02','A2.S11.INTRO.03'],q.approach);return;}
 if(closed(q.events.approach)&&!q.events.advance){begin(app,'advance',['A2.S11.INTRO.04']);return;}
 const physical=G.HonroAct23V4Chapter11,m=physical?.memory(b);
 if(closed(q.events.advance)&&!q.events['low-beast']&&physical?.facts(b,'A2.S11.MID.01')){begin(app,'low-beast',['A2.S11.MID.01']);return;}
 if(closed(q.events['low-beast'])&&!q.events['high-sightline']&&physical?.facts(b,'A2.S11.MID.02')){begin(app,'high-sightline',['A2.S11.MID.02']);return;}
 if(closed(q.events['high-sightline'])&&!q.events['cover-guide']&&physical?.facts(b,'A2.S11.POPUP.01')){begin(app,'cover-guide',['A2.S11.POPUP.01']);return;}
 if(!q.events['blocked-shot']&&physical?.facts(b,'A2.S11.WARN.01')){begin(app,'blocked-shot',['A2.S11.WARN.01']);return;}
 if(!q.events['spirit-release']&&physical?.facts(b,'A2.S11.MID.03')){begin(app,'spirit-release',['A2.S11.MID.03'],m.release);return;}
 if(!q.events['north-warning']&&physical?.facts(b,'A2.S11.MID.04')){begin(app,'north-warning',['A2.S11.MID.04']);return;}
 if(!q.events['north-pair']&&physical?.facts(b,'A2.S11.MID.05')){begin(app,'north-pair',['A2.S11.MID.05'],m.north);return;}
 if(V.mem(b).done['11.exit']&&!q.events.gather){begin(app,'gather',['A2.S11.COMPLETE.01'],{allFour:gathered(b)});return;}
 if(s.bell?.struck){if(!q.events.bell){begin(app,'bell',['A2.S11.COMPLETE.02'],s.bell);return;}
  q.ambient.elapsed=Math.min(1.1,q.ambient.elapsed+Math.max(0,Math.min(dt,.05)));q.ambient.distance=q.ambient.elapsed*220;
  if(q.ambient.distance>=80&&!q.events.reaction){begin(app,'reaction',['A2.S11.COMPLETE.03','A2.S11.COMPLETE.04'],q.ambient);return;}
  if(q.ambient.distance>=80&&!q.journal){const r=row('A2.S11.JOURNAL.01');app.profile.record??=[];if(!app.profile.record.some(x=>x.rowId===r.id))app.profile.record.push({place:app.stage.name,text:r.text,rowId:r.id,reviewedRevision:1,sourceRun:b.session});q.journal={rowId:r.id,bell:true};app.dirty=true;}
  if(s.proof['11.north']&&closed(q.events.reaction)&&!q.events.depart){begin(app,'depart',['A2.S11.COMPLETE.05']);return;}}
}
function complete(b){return !active(b)||closed(memory(b).events.depart)&&!!memory(b).journal;}
function present(b,result){if(!active(b))return result;const r=row('A2.S11.OBJECTIVE.01');return{...result,summary:r.text,currentInstruction:r.text,completionText:r.text,targets:result.targets.map(x=>({...x,label:r.text})),allTargets:result.allTargets.map(x=>({...x,label:r.text})),checklist:[{id:r.id,text:r.text,done:result.complete,current:!result.complete}],visibleChecklist:[{id:r.id,text:r.text,done:result.complete,current:!result.complete}],failureText:''};}
function content(b,st){if(!active(b))return st;return{...st,goal:row('A2.S11.OBJECTIVE.01').text,guide:'',story:[],outro:[],failure:[],narration:[],storySummary:memory(b).journal?row('A2.S11.JOURNAL.01').text:'',honroV4Unreviewed:false,honroReviewedNarrativeRevision:1};}
function draw(scene,c,b){if(!active(b)||!scenes(b).bell?.struck)return;const a=memory(b).ambient,spec=b.honroV4Ambient;c.save();c.lineWidth=2;for(let i=0;i<a.count;i++){const start=spec.from.x+(i%4)*44,progress=Math.min(1,a.elapsed/1.1),x=start+a.distance,y=spec.from.y-95-Math.floor(i/4)*55-70*progress;c.globalAlpha=.22+.045*i;c.strokeStyle='#bacdc4';c.beginPath();c.ellipse(x,y,13,27,-.3,0,Math.PI*2);c.stroke();}c.restore();}
function failure(app){if(!active(app.engine?.b)||app.dialogue||app.engine.b.phase!=='lost')return false;return begin(app,'failure',['EDGE.FAILURE_GUARD.S11'],{actualFailure:true});}
function optional(profile,id,c){if(!enabled()||Number(id)!==11)return null;const before=G.HONRO_CONTENT.stages[10].requires.every(id=>profile.cleared?.[id]);if(!before||!profile.recruited?.includes(c))return[];const ids=(data()?.rows||[]).filter(r=>r.id.startsWith('EDGE.OPTIONAL_11_'+c.toUpperCase()+'_')).map(r=>r.id);return lines(ids,'optional.'+c).filter(l=>restAllowed(profile,l[0]));}
function migrate(profile){if(!enabled()||profile.honroReviewed11PresentationRevision===1)return;const s=profile.honroJourney?.story;if(s?.stageId===11)profile.honroJourney.story=null;profile.honroReviewed11PresentationRevision=1;}
function journal(profile,id){if(!enabled()||Number(id)!==11)return null;const r=row('A2.S11.JOURNAL.01');return profile.record?.find(x=>x.rowId===r.id&&x.reviewedRevision===1&&x.sourceRun&&x.text===r.text)||null;}
const oldAuthor=V.author;V.author=function(...args){const p=oldAuthor(...args);if(!enabled())return p;return{...p,stages:p.stages.map(s=>s.metadata?.stageId===11&&s.initialState?.honroAct23V4Revision===1?{...s,initialState:{...s.initialState,honroReviewedNarrativeRevision:1}}:s)};};
const oldPrepare=V.prepare;V.prepare=function(b,p){const out=oldPrepare(b,p);if(active(b)){memory(b);b.honroNarrativeContent=content(b,b.honroNarrativeContent);}return out;};
const oldMigrate=V.migratePresentation;V.migratePresentation=function(p){oldMigrate(p);migrate(p);};
const oldOutcome=V.recordOutcome;V.recordOutcome=function(app,won){oldOutcome(app,won);if(won&&active(app.engine?.b)){const h=app.profile.honroAct23V4History?.stages?.[11];if(h)h.reviewedNarrative={revision:1,status:data().status,rows:Object.values(memory(app.engine.b).events).filter(e=>e.status==='done').flatMap(e=>e.ids),withheld:Object.keys(blocked)};}};
const oldResolve=G.HonroNarrativeCatalogue.resolve;G.HonroNarrativeCatalogue.resolve=(b,st)=>content(b,oldResolve(b,st));
const oldSummary=G.HonroNarrativeCatalogue.summary;G.HonroNarrativeCatalogue.summary=(b,st)=>active(b)?(memory(b).journal?row('A2.S11.JOURNAL.01').text:''):oldSummary(b,st);
const oldPlugin=V.plugins.get(11);V.register(11,{...oldPlugin,tick(app,dt){if(active(app.engine.b)&&V.mem(app.engine.b).done['11.exit']&&!memory(app.engine.b).events.gather){tick(app,0);if(app.dialogue)return;}oldPlugin.tick(app,dt);tick(app,dt);},complete(b){return oldPlugin.complete(b)&&complete(b);},draw(scene,c,b,e){if(active(b)){G.HonroAct23V4Chapter11?.draw(scene,c,b);draw(scene,c,b);}else oldPlugin.draw(scene,c,b,e);}});
for(const key of ['interlude','required','optional']){const old=G.HonroJourneyContent[key];G.HonroJourneyContent[key]=function(...args){const id=key==='interlude'?args[0]:args[1];if(enabled()&&Number(id)===11)return key==='optional'?optional(...args):[];return old.apply(this,args);};}
G.HonroAct23V4Reviewed={enabled,active,row,rowsReviewed,lineAllowed,accepts,finished,present,content,failure,optional,blocked,requiredScenes,memory,complete,gathered,journal,talkId:(id,c)=>enabled()&&Number(id)===11?'rest-talk-v1-11-'+c+'-reviewed1':null};
// Resolve Act3-only providers after their own modules have loaded.
const chapterProvider=id=>({21:G.HonroAct23V4Chapter21Reviewed,22:G.HonroAct23V4Chapter22Reviewed})[id]||G.HonroAct3V4ReviewedCore?.providers.get(id);
G.HonroAct23V4Reviewed.provider=chapterProvider;
for(const key of ['rowsReviewed','accepts','finished','failure']){const old=G.HonroAct23V4Reviewed[key];G.HonroAct23V4Reviewed[key]=(...args)=>[21,22,23,24,25,26,27,28,29,30].some(id=>chapterProvider(id)?.[key](...args))||old(...args);}
for(const key of ['lineAllowed','present','journal','talkId']){const old=G.HonroAct23V4Reviewed[key];G.HonroAct23V4Reviewed[key]=(...args)=>{const id=key==='lineAllowed'?args[2]?.reviewedStage:key==='present'?args[0]?.honroStage:key==='talkId'?args[0]:args[1];return chapterProvider(Number(id))?.[key](...args)??old(...args);};}
})(globalThis);
