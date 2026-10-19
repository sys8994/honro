import {yieldIfNeeded} from "./load-data.fb768c8f80789aa0.js";
// shared/runtime/audio.js
(()=>{
'use strict';
(function(G){'use strict';
G.HonroAudio=G.HONRO_CORE.AudioEngine;
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/story.js
(()=>{
'use strict';
(function(G){'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=x=>JSON.parse(JSON.stringify(x));
function host(app){let node=$('dialogue-root');if(!node){node=document.createElement('div');node.id='dialogue-root';app.root.appendChild(node);}return node;}
function actorFor(app,who){const bound=G.HonroStoryDirection?.speaker(app,who);if(bound)return bound;const actor=app.speakerUnits?.(who).find(u=>!u.dead&&u.hp>0);if(actor)return actor;return app.engine?.b.units.find(u=>u.name===who&&!u.dead&&u.hp>0)||null;}
function allowed(app,who,meta){return speakerPresentation(who,meta).kind!=='character'||G.HonroStoryStaging?.canSpeak(app,who,meta)||app.screen!=='battle'||!!actorFor(app,who)||app.canSpeak(who);}
function history(app){if(app.training)return[];if(app.engine?.b.honroCustom)return app.engine.b.honroState.narrative??=[];return app.profile.honroNarrative??=[];}
function groups(lines){const result=[];for(const line of lines){const last=result.at(-1),a=last?.[0][2]||{},b=line[2]||{};if(last&&['storyId','waitActor','waitRound','afterAction'].every(key=>a[key]===b[key]))last.push(line);else result.push([line]);}return result;}
function remember(app,lines,title){for(const part of groups(lines)){const meta=part[0]?.[2]||{},id=meta.storyId||`${app.stage?.id||0}:${title}:${part[0]?.[1]}`,entry={id,title:meta.storyTitle||title||'길 위의 대화',lines:clone(part)};const log=history(app),old=log.findIndex(x=>x.id===id);if(old>=0)log[old]=entry;else log.push(entry);if(log.length>120)log.splice(0,log.length-120);}}
// Retain the legacy API for old callers, without an optional reading surface.
function journalHTML(){return '';}
function journal(app){app.close();}
function controls(node,app){const actions=node.querySelector('.story-actions,.narration-actions');if(actions){actions.insertAdjacentHTML('afterbegin',`<button class="ghost" data-action="dialogue-prev" ${previousIndex(app)<0?'disabled aria-disabled="true"':''}>이전</button>`);const skip=actions.querySelector('[data-action="dialogue-skip"]'),next=actions.querySelector('[data-action="dialogue-next"]');if(!node.querySelector('.story-document')){if(skip)skip.textContent='대화 넘기기';if(next)next.textContent='다음';}}messageSound(app);}
// Back only reads this open bundle. It never reopens a completed event.
function previousIndex(app){const d=app.dialogue;if(!d||d.staging&&!d.staging.complete||d.index>=d.lines.length)return -1;for(let i=d.index-1;i>=0;i--)if(allowed(app,d.lines[i][0],d.lines[i][2]))return i;return -1;}
function previous(app){const index=previousIndex(app);if(index<0||app.storyHistoryOpen)return;G.HonroStoryStaging?.lineEnd(app);app.dialogue.index=index;draw(app);}
// The marker is presentation-only and deliberately excluded from saved dialogue.
function messageSound(app){const d=app.dialogue;if(!d)return;const key=d.staging&&!d.staging.complete?`motion:${d.staging.cursor}`:`line:${d.index}`;if(app.storySoundDialogue===d&&app.storySoundKey===key)return;app.storySoundDialogue=d;app.storySoundKey=key;app.audio?.play('dialogue');}
function waitForActor(app){const b=app.engine.b;return app.actorBoundary?{afterAction:b.honroState.actorTurnSerial||0}:{afterAction:(b.honroState.actorTurnSerial||0)+1,waitActor:b.active,waitRound:b.round};}
function ready(app,meta){const b=app.engine.b,u=b.units.find(u=>u.id===meta.waitActor);return (b.honroState.actorTurnSerial||0)>=(meta.afterAction||0)&&(!meta.waitActor||b.round>meta.waitRound||!u||u.acted||u.dead||app.actorBoundary===u.id);}
// Retire only the old mechanical recovery notice, including queued saves.
const keepStoryLine=line=>line[2]?.eventSource!=='campfire-kept';
function queue(app,lines){const b=app.engine?.b;if(!b)return;const hs=b.honroState;hs.storyQueue??=[];const wait=waitForActor(app);hs.storyQueue.push(...lines.filter(l=>keepStoryLine(l)&&allowed(app,l[0],l[2])).map(([who,text,meta={}])=>[who,text,{...meta,delivery:'dialogue',waitForClear:false,...wait}]));app.dirty=true;if(app.actorBoundary&&!app.dialogue&&!app.modal?.classList.contains('open')&&!app.done&&!['won','lost'].includes(b.phase))drain(app);}
// Only explicitly authored narrative events use the manual reader. Tactical warnings stay live.
function event(app,text,options={}){if(options.source==='campfire-kept')return;const hs=app.engine?.b.honroState;if(!hs)return;const source=options.source||'world-event',pending=[...(hs.storyQueue||[]),...(app.dialogue?.lines||[])];if(pending.some(l=>l[1]===text&&l[2]?.eventSource===source))return;hs.narrativeEventSerial=(hs.narrativeEventSerial||0)+1;queue(app,[['서술',text,{kind:'narration',presentation:'inline',eventSource:source,storyId:`event:${app.stage?.id}:${source}:${hs.narrativeEventSerial}`,storyTitle:app.stage?.name||'길 위의 사건'}]]);}
function start(app,lines,options={}){const original=lines;lines=lines.filter(keepStoryLine);const pruned=lines.length!==original.length;if(pruned&&options.index!==undefined)options={...options,index:original.slice(0,options.index).filter(keepStoryLine).length};const resumedEnd=pruned&&options.index!==undefined&&options.index>=lines.length;({lines,options}=G.HonroStoryStaging?.opening(app,lines,options)||{lines,options});if(options.after&&options.after!=='rest'&&options.index===undefined&&!app.engine?.b.honroCustom)lines=G.HonroStoryContent.scene(`${options.after}-${app.stage?.id}`,options.title||app.stage?.name,lines);if(options.after==='outcome'&&options.index===undefined){G.HonroEncounters.finishNarrative(app);const hs=app.engine?.b.honroState;if(hs){restoreQueuedSpeech(hs);const pending=[...(hs.storyQueue||[]),...(hs.deferredStory||[]).flatMap(x=>x.lines)];lines=[...(G.HonroStoryContent.beforeOutcome?.(app,pending)||pending),...lines];hs.storyQueue=[];hs.deferredStory=[];hs.storyBanter=[];hs.banterLine=null;}}lines=G.HonroEvidenceQuests?.present(app,lines)||lines;lines=lines.filter(l=>keepStoryLine(l)&&allowed(app,l[0],l[2]));({lines,options}=G.HonroStoryStaging?.directed(app,lines,options)||{lines,options});if(!lines.length){if(pruned&&options.index!==undefined){app.dialogue={...options,lines:[],index:0};finish(app,true);}else if(options.after==='outcome')app.outcome(true);return false;}app.cancelInput();app.acc=0;app.turnNotice=null;app.storyHistoryOpen=false;app.evidenceReader=null;const banter=$('banter');if(banter)banter.hidden=true;const banner=$('turn-banner');if(banner)banner.hidden=true;if(!app.dialogue&&app.scene&&!app.storyCamera)app.storyCamera={x:app.scene.x,y:app.scene.y,scale:app.scene.scale,manual:app.scene.manual};app.dialogue={...options,lines:clone(lines),index:Math.min(options.index||0,resumedEnd?lines.length:options.staging?.position==='after'&&!options.staging.waitForDialogue?lines.length:lines.length-1)};if(app.dialogue.staging){app.dialogue.staging.camera??=clone(app.storyCamera||null);app.storyCamera=clone(app.dialogue.staging.camera);app.stagingLastTime=null;if(options.index!==undefined)G.HonroStoryStaging?.restore(app);}remember(app,lines,options.title);save(app);draw(app);return true;}
function save(app){G.HonroStoryStaging?.snapshot(app);if(app.screen==='rest'){G.HonroRestJourney?.saveStory(app);return;}if(app.engine&&!app.training){app.engine.b.honroStory=app.dialogue?clone(app.dialogue):null;app.profile.honroBattle=clone(app.engine.b);app.persist();app.dirty=true;}}
function drawBust(cv,actor,cls,who){return G.HonroPortraits.draw(cv,G.HonroPortraits.storyActor(who,actor),cls);}
// Narration belongs to the current scene, never to an invented portrait or fullscreen painting.
const nonCharacters=Object.freeze({'서술':'narration','길 위의 기록':'narration','기록':'document','안내':'guide'});
function speakerPresentation(who,meta={}){const kind=['narration','document','guide'].includes(meta.kind)?meta.kind:nonCharacters[who]||'character';return {kind,label:kind==='narration'?'길 위의 기록':who};}
function narration(node,d,meta,line,app){focusLine(app,null,meta);node.innerHTML=`<div class="story-overlay narration-inline"><section class="story-scene text-only-scene narration-scene" data-speaker-kind="narration" role="dialog" aria-modal="true" aria-labelledby="story-speaker" aria-describedby="story-line"><div class="story-copy"><div class="story-location">${esc(meta.storyTitle||d.title||app?.stage?.name||'길 위')}<span>${d.index+1} / ${d.lines.length}</span></div><h2 id="story-speaker">길 위의 기록</h2><p id="story-line">${esc(line)}</p><div class="story-actions"><span>Space / Enter</span><button class="ghost" data-action="dialogue-skip">대화 넘기기</button><button class="primary" data-action="dialogue-next">다음</button></div></div></section></div>`;}

function focusLine(app,actor,meta){
 const scene=app.scene;if(!scene)return;if(G.HonroStoryStaging?.focusLine(app,actor,meta))return;
 const target=meta.focus?G.HonroObjectives.focus(app,meta.focus):null;
 scene.goalFocus=target||null;scene.cinematic=target?null:actor?.id||null;
 if(target)scene.storyFocusPoint?.(target.x,target.y,500);
 else if(actor)scene.storyFocus?.(actor.id,500);
 else scene.storyTween=null;
}
function draw(app){const node=host(app),d=app.dialogue;document.body.classList.toggle('story-lock',!!d);if(app.scene)app.scene.storyFrozen=!!d;if(!d){app.audio?.stop?.('dialogue');app.storyHistoryOpen=false;node.innerHTML='';if(app.scene){app.scene.goalFocus=null;app.scene.cinematic=null;app.scene.focusUntil=app.scene.speakerUntil=0;app.scene.storyRelease?.(app.storyCamera,450);}app.storyCamera=null;return;}if(G.HonroStoryStaging?.draw(app,node)){controls(node,app);return;}G.HonroStoryStaging?.lineStart(app);while(d.index<d.lines.length&&!allowed(app,d.lines[d.index][0],d.lines[d.index][2]))d.index++;if(d.index>=d.lines.length){finish(app,true);return;}let [who,line,meta={}] = (G.HonroEvidenceQuests?.present(app,[d.lines[d.index]])||[d.lines[d.index]])[0];G.HonroNarrativeRevision?.reveal(app.engine?.b,d.lines[d.index]);const presentation=speakerPresentation(who,meta);meta={...meta,kind:presentation.kind};if(meta.kind==='guide'||who==='안내'){focusLine(app,null,meta);node.innerHTML=`<div class="story-overlay guide-overlay"><section class="story-guide" role="dialog" aria-modal="true" aria-labelledby="guide-title" aria-describedby="story-line"><div class="guide-kicker">길잡이 · 조작 안내</div><h2 id="guide-title">${esc(meta.guideTitle||'이번 여정의 목표')}</h2><p id="story-line">${esc(G.HonroActionPrompts?.text(line)??line)}</p><div class="story-actions"><button class="ghost" data-action="dialogue-skip">안내 닫기</button><button class="primary" data-action="dialogue-next">확인 ›</button></div></section></div>`;controls(node,app);node.querySelector('[data-action="dialogue-next"]').focus({preventScroll:true});save(app);return;}if(meta.kind==='narration'||who==='서술'){if(app.scene){app.scene.goalFocus=null;app.scene.cinematic=null;app.scene.storyTween=null;}narration(node,d,meta,line,app);controls(node,app);node.querySelector('[data-action="dialogue-next"]').focus({preventScroll:true});save(app);return;}const actor=actorFor(app,who);focusLine(app,actor,meta);const portrait=G.HONRO_STORY_PORTRAITS?.[who],cls=actor?.cls||portrait?.class,hasPortrait=!!(portrait?.src||actor?.cls||portrait?.actor&&portrait?.class||({'설오':'archer','담허':'mage','휘겸':'knight','소단':'occultist'}[who]===portrait?.class&&portrait?.class)),imageZoom=Math.max(1,Math.min(3,Number(portrait?.imageZoom)||1));const color=G.HONRO_CONTENT.hero[cls]?.color||'#c9b37f';node.innerHTML=`<div class="story-overlay ${d.staging?.cues?'cinematic-story':''}"><section class="story-scene dialogue-scene ${hasPortrait?'':'text-only-scene'}" data-speaker-kind="character" data-portrait-status="${hasPortrait?'available':'missing'}" style="--speaker:${color}" role="dialog" aria-modal="true" aria-labelledby="story-speaker" aria-describedby="story-line">${hasPortrait?`<div class="story-portrait" aria-label="${esc(who)}">${portrait?.src?`<img src="${esc(portrait.src)}" alt="${esc(who)}" style="--portrait-zoom:${imageZoom}">`:'<canvas id="story-portrait-canvas" width="400" height="440"></canvas>'}</div>`:''}<div class="story-copy"><div class="story-location">${esc(meta.storyTitle||d.title||app.stage?.name||'길 위')}<span>${d.index+1} / ${d.lines.length}</span></div><h2 id="story-speaker"><i></i>${esc(who)}</h2><p id="story-line">${esc(line)}</p><div class="story-actions"><span>Space / Enter</span><button class="ghost" data-action="dialogue-skip">대화 넘기기</button><button class="primary" data-action="dialogue-next">${d.index+1===d.lines.length?'계속 걷기':'다음'} <b>›</b></button></div></div></section></div>`;if(hasPortrait&&cls&&!portrait?.src)drawBust($('story-portrait-canvas'),actor,cls,who);controls(node,app);node.querySelector('[data-action="dialogue-next"]').focus({preventScroll:true});save(app);}
function finish(app,natural=false){const d=app.dialogue,camera=clone(app.storyCamera||null);if(!d)return;if(G.HonroStoryStaging?.finish(app,natural))return;G.HonroNarrativeRevision?.finishStory(app,d);app.dialogue=null;save(app);draw(app);app.acc=0;if(d.journeyInterludeId){app.profile.seen[d.journeyInterludeId]=true;app.persist();}if(d.id){app.profile.seen[d.id]=true;app.profile.honroMapStory=null;app.persist();}if(G.HonroRestJourney?.finishStory(app,d))return;if(d.after==='outcome')app.outcome(true);else {app.storyCamera=camera;if(!drain(app)){app.storyCamera=null;if(d.after==='entry')turn(app,true);}}}
function next(app){if(!app.dialogue||app.storyHistoryOpen)return;if(G.HonroStoryStaging?.skipMotion(app))return;G.HonroStoryStaging?.lineEnd(app);app.dialogue.index++;draw(app);}function key(app,e){if(['Space','Enter','Escape','Tab'].includes(e.code))e.preventDefault();if(e.code==='Tab'){const buttons=[...host(app).querySelectorAll('button:not(:disabled),.document-scroll')],index=buttons.indexOf(document.activeElement);buttons[(index+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}else if(['Space','Enter'].includes(e.code)&&!e.repeat){if(document.activeElement?.disabled)return;if(document.activeElement?.dataset.action==='dialogue-prev')previous(app);else if(document.activeElement?.dataset.action==='dialogue-skip')finish(app);else next(app);}}
function restoreQueuedSpeech(hs){hs.storyQueue=[...(hs.banterLine?[hs.banterLine.line]:[]),...(hs.storyBanter||[]).flat(),...(hs.storyQueue||[])].filter(keepStoryLine);hs.deferredStory=(hs.deferredStory||[]).map(q=>({...q,lines:q.lines.filter(keepStoryLine)})).filter(q=>q.lines.length);hs.storyBanter=[];hs.banterLine=null;}
function drain(app){if(app.dialogue)return false;const hs=app.engine?.b.honroState;if(!hs)return false;restoreQueuedSpeech(hs);for(const line of hs.storyQueue){line[2]??={};if(line[2].afterAction===undefined)Object.assign(line[2],waitForActor(app));}const waiting=groups(hs.storyQueue),index=waiting.findIndex(lines=>ready(app,lines[0][2]));if(index<0)return false;const [selected]=waiting.splice(index,1);hs.storyQueue=waiting.flat();const lines=selected[0]?.[2]?.storyId?.includes('entry-follow-')?G.HonroStoryContent.resolveDeferred(app,{lines:selected}):selected;if(!lines.length)return drain(app);return start(app,lines,{title:lines[0][2]?.storyTitle||app.stage.name+' · 길 위의 사건'});}
function turnSide(b){return ['ally','summon'].includes(b.phase)?'ally':b.side===0?'player':'enemy';}function turnLabel(b){const side=turnSide(b);return side!=='player'&&!hasPhaseUnit(b,side)?'':{player:'아군 턴',enemy:'적군 턴',ally:'동맹군 턴'}[side];}function hasPhaseUnit(b,side){if(side==='enemy')return b.units.some(u=>u.side===1&&u.summonKind!=='eater'&&!u.eaterCapturedBy&&!u.dead&&u.hp>0);if(side==='ally'){const ids=b.honroState?.allyQueue?.ids||[];return ids.some(id=>{const u=b.units.find(v=>v.id===id);return u&&!u.dead&&u.hp>0;});}return true;}function turnPaused(app,now=performance.now()){return !!app.turnNotice&&now<app.turnNotice.pauseUntil;}
// Summons are an action interlude inside the player team turn, not a new team turn.
// Keep the last real team notice; the engine already announces the summon queue.
function turn(app,force=false){const b=app.engine?.b;if(!b||app.training||app.dialogue||app.done||b.phase==='summon')return;const side=turnSide(b),key=`${b.round}:${side}`;if(!force&&app.lastTurnNotice===key)return;app.lastTurnNotice=key;if(!hasPhaseUnit(b,side)){app.turnNotice=null;const old=$('turn-banner');if(old)old.hidden=true;return;}const now=performance.now();app.turnNotice={until:now+1050,pauseUntil:now+(side==='player'?250:0),side};app.acc=0;app.cancelInput();app.audio?.play('turn');const actor=b.phase==='ally'?b.honroState?.allyQueue?.ids[b.honroState.allyQueue.index]:b.phase==='summon'?b.summonTurn?.queue[b.summonTurn.index]:b.active;if(actor&&side!=='player')app.scene?.focusUnit(actor,1200);let node=$('turn-banner');if(!node){node=document.createElement('div');node.id='turn-banner';node.setAttribute('role','status');app.root.appendChild(node);}node.hidden=false;node.dataset.side=side;node.innerHTML=`<small>${b.round}번째 턴</small><strong>${turnLabel(b)}</strong><i></i>`;}
function tick(app,now){G.HonroStoryStaging?.tick(app,now);const b=app.engine?.b,hs=b?.honroState;if(hs&&!app.dialogue&&!app.done&&!['won','lost'].includes(b.phase)&&!app.modal?.classList.contains('open')){const due=(hs.deferredStory||[]).filter(x=>b.round>=x.round);if(due.length){hs.deferredStory=hs.deferredStory.filter(x=>!due.includes(x));const lines=due.flatMap(x=>G.HonroStoryContent.resolveDeferred(app,x));if(lines.length)queue(app,lines);else drain(app);}else drain(app);}if(app.dialogue){const d=app.dialogue;if(!allowed(app,d.lines[d.index]?.[0],d.lines[d.index]?.[2]))draw(app);}if(app.turnNotice&&now>=app.turnNotice.until){app.turnNotice=null;const node=$('turn-banner');if(node)node.hidden=true;}}
G.HonroStory={event,speakerPresentation,save,journal,journalHTML,allowed,start,queue,draw,next,previous,finish,drain,turn,tick,key,turnSide,turnLabel,turnPaused};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/interactions.js
(()=>{
'use strict';
(function(G){'use strict';
const $=id=>document.getElementById(id),RANGE=260;
const waterfallText=(b,value)=>G.HonroStage5Waterfall?.textFor(b,value)??value;
function eligibility(app,m){const result=rawEligibility(app,m);return {...result,reason:waterfallText(app.engine?.b,result.reason)};}
function rawEligibility(app,m){const e=app.engine,b=e?.b,u=e?.active;if(u?.retreat)return{ok:false,reason:'이탈보 · 이동/점프만 가능'};if(m?.action==='skillGate')return {ok:app.canInput()&&u.gateTurn!==`${b.round}:${b.teamEnds[0]}`,reason:'축지진목 사용'};if(!e||!u||!m||m.collected||u.side!==0||u.dead)return{ok:false,reason:'상호작용할 수 없음'};const point=G.HonroObjectives.interactionTarget(b,m);if(!point)return{ok:false,reason:'구조할 주민이 없음'};const d=Math.hypot(u.x-point.x,(u.y-point.y)*.75);if(d>RANGE)return{ok:false,reason:'더 가까이 이동'};if(Math.abs(u.y-point.y)>150)return{ok:false,reason:'같은 층으로 이동'};if(m.action==='ritual'&&b.honroState.ritual?.active)return{ok:false,reason:'의식 유지 중 · 이탈 시 해제'};if(m.action==='ritual'&&(Math.abs(u.x-m.x)>125||Math.abs(u.y-m.y)>80||!e.grounded(u)))return{ok:false,reason:'받이진 안에 서세요'};if(m.requiredClass&&u.cls!==m.requiredClass)return{ok:false,reason:`${G.HONRO_CONTENT.hero[m.requiredClass]?.name||'지정 인물'} 필요`};if(!app.canInput())return{ok:false,reason:'현재 행동이 끝난 뒤'};if(m.action==='act2')return G.HonroAct2.eligibility(app,m);if(m.action==='act3')return G.HonroAct3.eligibility(app,m);return{ok:true,reason:m.action==='ritual'?'의식 시작':'상호작용'};}
function candidates(app){if(!app.engine||app.done)return[];const e=app.engine,u=e.active;if(!u||u.side!==0||u.dead)return[];const gate=e.gateCandidate(),markers=[...(e.b.honroMarkers||[]),...(gate?[{...gate,id:'skillGate-'+gate.id,action:'skillGate',label:'축지진목'}]:[])];return markers.filter(m=>m.action&&!m.collected).flatMap(m=>{const point=G.HonroObjectives.interactionTarget(e.b,m);return point&&Math.hypot(u.x-point.x,(u.y-point.y)*.75)<=RANGE+70?[{marker:m,d:Math.hypot(u.x-point.x,u.y-point.y),...eligibility(app,m)}]:[];}).sort((a,b)=>Number(b.ok&&b.marker.action==='skillGate')-Number(a.ok&&a.marker.action==='skillGate')||a.d-b.d);}
function linesFor(app,m){return G.HonroStoryContent.interaction(app,m)||[];}
function use(app,m){const ok=eligibility(app,m);if(!ok.ok)return false;if(m?.action==='skillGate'){const used=app.engine.useGate();if(used){app.dirty=true;app.updateHUD(true);}refresh(app);return used;}const e=app.engine,b=e.b,hs=b.honroState,u=e.active;
 if(m.action==='act3'){const used=G.HonroAct3.use(app,m);refresh(app);return used;}
 if(m.action==='act2'){const used=G.HonroAct2.use(app,m);refresh(app);return used;}
 if(m.action==='authored'){if(m.authoredAction&&G.HonroAllies.execute(app,m.authoredAction)===false)return false;m.collected=true;hs.flags['interact:'+m.id]=true;G.HonroObjectiveContributions?.interact(b,m.id,u);if(m.lines?.length)app.sayLines(m.lines);else app.event(m.label,{kind:'narration',source:'interaction:'+m.id});if(!app.checkMission(e))e.finishAction();app.dirty=true;refresh(app);return true;}
 if(m.action==='ritual'){hs.ritual={active:true,holderId:u.id};hs.waterfallSight=true;const veil=b.terrain.find(t=>t.id==='waterfall-veil');if(G.HonroStage5Waterfall?.active(b))G.HonroStage5WaterGeometry.setOpen(b,true);else if(veil){veil.broken=true;b.sceneVersion++;}e.fx('ring',m.x,m.y-20,'#a5c9bd',95);const lines=hs.flags['ritual-explained']?[]:linesFor(app,m);hs.flags['ritual-explained']=true;if(lines.length)app.sayLines(lines);if(!lines.length)app.event(waterfallText(b,'담허가 받이진을 유지한다. 설오로 바꾸어 열린 물틈의 고리쇠를 노리자.'),{kind:'narration',source:'ritual-held'});if(!app.checkMission(e))e.finishAction();app.dirty=true;refresh(app);return true;}
 if(m.action==='rescue'){const target=e.unit(m.target);G.HonroObjectiveContributions?.approach(b,m.id,[u],target,220,!!target&&!e.alive(1).some(v=>Math.abs(v.y-target.y)<=150&&Math.hypot(v.x-target.x,(v.y-target.y)*.75)<=220));}
 m.collected=true;if(m.action==='ledger')hs.ledger=true;if(m.action==='receiver'){hs.receivers=(hs.receivers||0)+1;e.fx('ring',m.x,m.y-20,'#b8c999',65);}if(m.action==='rescue'){hs.rescuedCount=(hs.rescuedCount||0)+1;const target=e.unit(m.target);if(target){target.shield=Math.max(target.shield||0,60);target.fixed=true;target.honroResolved=true;e.fx('ring',target.x,target.y-target.h*.5,'#a7c3ad',60);}}
 G.HonroObjectiveContributions?.interact(b,m.id,u,{rescue:m.action==='rescue'});
 const lines=linesFor(app,m);if(lines.length)app.sayLines(lines);const staged=m.action==='receiver'&&G.HonroStoryStaging?.receiver(app,m);if(!lines.length&&!staged)app.event(m.action==='ledger'?'홍만의 장부를 찾았다.':m.action==='receiver'?'받이진을 세웠다.':'들린 사람에게서 원혼을 떼어냈다.',{kind:'narration',source:'interaction:'+m.id});if(!app.checkMission(e))e.finishAction();app.dirty=true;refresh(app);return true;
}
function refresh(app){const host=$('context-interact');if(!host)return;const near=candidates(app),one=near.find(x=>x.ok)||near[0],enabled=!!one?.ok,sig=one?`${one.marker.id}:${enabled}:${one.reason}:${near.length}`:'none';if(host.dataset.sig===sig)return;host.dataset.sig=sig;if(!one){host.hidden=true;host.innerHTML='';return;}host.hidden=false;const action=one.marker.action,holding=action==='ritual'&&app.engine.b.honroState.ritual?.active,label=waterfallText(app.engine.b,action==='skillGate'?'축지':action==='ledger'?'장부 확인':action==='receiver'?'받이진 설치':action==='ritual'?'담허의 의식':['authored','act2','act3'].includes(action)?'상호작용':'구조');host.innerHTML=`<button ${enabled?'':'disabled'} data-context-interact="${one.marker.id}" aria-label="${label} · ${one.marker.label}"><span>${label}</span><strong>${enabled?one.marker.label:one.reason}</strong></button>`;}
function mount(app){const battle=app.root.querySelector('.battle');if(!battle||$('context-interact'))return;const el=document.createElement('div');el.id='context-interact';el.className='context-interact';el.hidden=true;battle.appendChild(el);refresh(app);}
function nearest(app){return candidates(app).find(x=>x.ok)?.marker||null;}function key(app,e){if(e.code!=='KeyE'||e.repeat)return false;if(!app.dialogue&&!app.modal?.classList.contains('open')&&(app.engine?.manualDive()||app.engine?.turnArrow(app.scene?.turnTarget))){e.preventDefault();return true;}const m=nearest(app);if(!m)return false;e.preventDefault();return use(app,m);}
document.addEventListener('click',e=>{const btn=e.target.closest?.('[data-context-interact]');if(!btn)return;const app=G.HonroApp,m=app?candidates(app).find(x=>x.marker.id===btn.dataset.contextInteract)?.marker:null;if(app&&m)use(app,m);});
G.HonroInteractions={mount,refresh,nearest,use,key,candidates,eligibility};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/unit-info.js
(()=>{
'use strict';
(function(G){'use strict';
const player=u=>u?.side===0&&!u.summoned;
const eligible=u=>u&&!u.eaterCapturedBy&&(player(u)||!u.dead&&(u.side===1||u.side===2||u.summoned));
const available=a=>a.screen==='battle'&&a.engine&&a.scene&&!a.dialogue&&!a.done&&!a.modal.classList.contains('open');
const clamp=(v,min,max)=>Math.max(min,Math.min(Math.max(min,max),v));
const S=G.HonroScene.prototype;
function description(u,b){if(u.honroObjectiveTarget)return [G.HonroQuestTargets.blocker(b,u),'파괴 목표 · 이동하거나 공격하지 않습니다. 동행은 통과할 수 있으며 체력을 모두 깎으면 목표가 진행됩니다.'].filter(Boolean).join(' ');if(u.summonKind==='eater')return `${b?b.units.filter(v=>v.eaterCapturedBy===u.id&&!v.dead&&v.hp>0).length:u.eaterCaptureCount||0}명 포획 · 남은 ${Math.max(0,(u.summonExpires??b?.round??0)-(b?.round??0)+1)}적 턴. 자체 행동 없이 아군에게 잃은 HP를 포획 적 각각에게 전달하며, 죽거나 수명이 끝나면 생존자를 방출합니다.`;const identity=u.honroAct3Fiend&&G.HonroWorld.archetypes[u.honroVariant]?.intent;if(identity)return identity+(u.intent&&u.intent!==identity?' · '+u.intent:'');return u.intent||G.HonroWorld.archetypes[u.honroType]?.intent||(u.summoned?'소환자를 도와 동맹군 턴에 행동합니다.':u.allyRole==='civilian'?'전투에 휘말린 동행인. 안전하게 호위해야 합니다.':'함께 적을 상대하는 동행입니다.');}
// The body-only mask follows the current pose; health bars, shadows and selection arrows are excluded.
S.unitOutline=function(c,u){
 if(u.id!==this.hoverUnitId&&u.id!==this.inspectUnitId)return;
 const visualHeight=G.HonroPartyPresentationHeight?.(u)??u.h,size=visualHeight*3,ratio=Math.min(2,512/size),pad=8/this.scale;
 const width=Math.ceil((size+pad*2)*ratio),height=Math.ceil((visualHeight*2+pad*2)*ratio);
 this.outlineMask??=document.createElement('canvas');this.outlineEdge??=document.createElement('canvas');
 const mask=this.outlineMask,edge=this.outlineEdge;
 for(const cv of [mask,edge]){if(cv.width!==width)cv.width=width;if(cv.height!==height)cv.height=height;}
 const m=mask.getContext('2d'),o=edge.getContext('2d'),left=u.x-size/2-pad,top=u.y-visualHeight*1.5-pad;
 m.setTransform(1,0,0,1,0,0);m.clearRect(0,0,width,height);m.setTransform(ratio,0,0,ratio,-left*ratio,-top*ratio);
 this.unitBody(m,u);m.setTransform(1,0,0,1,0,0);
 m.globalCompositeOperation='source-in';m.fillStyle=u.side===1?'#eed1ae':'#c8e4cf';m.fillRect(0,0,width,height);m.globalCompositeOperation='source-over';
 o.clearRect(0,0,width,height);const r=2*ratio/this.scale;
 for(let i=0;i<8;i++)o.drawImage(mask,Math.cos(i*Math.PI/4)*r,Math.sin(i*Math.PI/4)*r);
 o.globalCompositeOperation='destination-out';o.drawImage(mask,0,0);o.globalCompositeOperation='source-over';
 c.save();c.globalAlpha=.88;c.drawImage(edge,left,top,width/ratio,height/ratio);c.restore();
};
function pick(a,p,touch=false){
 if(!available(a))return null;
 const scene=a.scene,w=scene.world(p.x,p.y),padding=(touch?12:4)/scene.scale;
 // Nearest visible body wins; fallen companions remain inspectable from their HUD portrait.
 return a.engine.b.units.filter(u=>!u.dead&&eligible(u)&&(!G.HonroAct2||G.HonroAct2.visible(a.engine.b,u))).map(u=>{
  const visualHeight=G.HonroPartyPresentationHeight?.(u)??u.h,half=Math.max(u.r,u.h*.24)+padding,cy=u.y-visualHeight*.5,hh=visualHeight*.55+padding;
  return {u,d:Math.pow((w.x-u.x)/half,2)+Math.pow((w.y-cy)/hh,2)};
 }).filter(x=>x.d<=1).sort((a,b)=>a.d-b.d)[0]?.u||null;
}
function close(a){if(!a.scene)return;a.scene.inspectUnitId=null;const el=document.getElementById('unit-info');if(el)el.hidden=true;}
function hover(a,p){if(!a.scene)return;a.scene.inspectPointer=p;const u=p&&pick(a,p);a.scene.hoverUnitId=u?.id||null;a.scene.canvas.style.cursor=u?'pointer':'';}
function bind(a){
 const el=document.createElement('aside');el.id='unit-info';el.className='unit-info';el.hidden=true;el.setAttribute('aria-label','대상 정보');
  el.innerHTML='<button class="unit-info-close" type="button" aria-label="대상 정보 닫기">'+G.HonroFA.icon('xmark','',14)+'</button><div class="unit-info-side"></div><h3></h3><div class="unit-info-health" role="meter" aria-label="체력"><i></i><span></span></div><div class="unit-info-progress" hidden><div class="unit-info-xp-label"></div><div class="unit-info-xp" role="progressbar" aria-label="경험치" aria-valuemin="0" aria-valuemax="100"><i></i></div><div class="unit-info-xp-detail"></div><div class="unit-info-xp-policy"></div></div><div class="unit-info-existence"></div><p class="unit-info-desc"></p><div class="unit-info-skills"></div><div class="unit-info-status"></div><p class="unit-info-reason status-reason" hidden></p>';
 a.scene.canvas.parentElement.append(el);el.querySelector('button').onclick=()=>close(a);
 // Activating the card's close button must not also start a Space-key shot.
 for(const type of ['keydown','keyup'])el.addEventListener(type,e=>{if(['Space','Enter'].includes(e.code))e.stopPropagation();});
 const cv=a.scene.canvas;
 cv.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||a.contacts.size){hover(a,null);return;}const r=cv.getBoundingClientRect();hover(a,{x:e.clientX-r.left,y:e.clientY-r.top});});
 cv.addEventListener('pointerleave',()=>hover(a,null));
 cv.addEventListener('pointercancel',()=>{hover(a,null);close(a);});
}
function show(a,u){
 if(!available(a)||!eligible(u)||G.HonroAct2&&!G.HonroAct2.visible(a.engine.b,u))return false;
 a.scene.inspectUnitId=u.id;tick(a);return true;
}
function tap(a,p,touch){
 const u=pick(a,p,touch);if(!u){close(a);return false;}
 if(player(u))a.selectHero(u.id);
 return show(a,u);
}
function tick(a){
 const scene=a.scene,el=document.getElementById('unit-info');if(!scene||!el)return;
 if(!available(a)){close(a);hover(a,null);return;}
 if(scene.inspectPointer)hover(a,scene.inspectPointer);
 const u=a.engine.unit(scene.inspectUnitId);if(!eligible(u)||G.HonroAct2&&!G.HonroAct2.visible(a.engine.b,u)){close(a);return;}
 const boundBody=G.HonroNarrativeRevision?.bodyBound(a.engine.b,u);el.hidden=false;el.dataset.unitId=u.id;el.dataset.side=boundBody?'ally':u.side===1?'enemy':'ally';
 const side=boundBody?'주박을 붙들고 있는 사람':player(u)?'동행'+(u.dead?' · 전투불능':u.acted?' · 행동 완료':''):u.side===1?(u.honroObjectiveTarget?'적군 · 파괴 목표':'적군'):u.summoned?'동맹군 · 소환귀':'동맹군';
 const C=G.HONRO_CORE,hero=player(u)&&a.engine.b.heroes?.[u.cls],level=hero?C.levelOf(hero):u.level||1;
 const skills=(u.loadout||[]).map(id=>G.HONRO_CORE.SKILLS[id]).filter(s=>s&&!s.passive).slice(0,2);
 const text=(selector,value)=>{const n=el.querySelector(selector);if(n.textContent!==value)n.textContent=value;};
 text('.unit-info-side',`${side}${boundBody?'':u.honroFinalBoss?' · 최종 우두머리':u.honroMidboss?' · 중간 우두머리':u.boss?' · 우두머리':u.elite?' · 정예':''}`);
 text('h3',boundBody?u.name:`${u.name} · ${player(u)?'경지 ':'Lv. '}${level}`);
 text('.unit-info-health span',`${Math.ceil(u.hp)} / ${Math.ceil(u.maxHp)}`);
 const health=el.querySelector('.unit-info-health');health.hidden=!!boundBody;health.setAttribute('aria-valuemin','0');health.setAttribute('aria-valuemax',u.maxHp);health.setAttribute('aria-valuenow',Math.ceil(u.hp));
  health.querySelector('i').style.width=clamp(u.hp/u.maxHp*100,0,100)+'%';
 const progress=el.querySelector('.unit-info-progress');progress.hidden=!hero;
 if(hero){
  const fraction=clamp(C.xpFraction(hero),0,1),percent=Math.round(fraction*100),maxed=level>=C.MAX_LEVEL,xp=el.querySelector('.unit-info-xp');
  text('.unit-info-xp-label',maxed?'경험치 · 최대 경지':`경험치 · ${percent}%`);
  text('.unit-info-xp-detail',maxed?`경지 ${level} · 성장 완료`:`${(hero.xp-C.xpAtLevel(level)).toLocaleString()} / ${C.xpToNext(level).toLocaleString()} XP`);
  const b=a.engine.b,contribution=b.honroGrowth?.ledger?.stages?.[b.honroStage]?.contribution;
  text('.unit-info-xp-policy',b.mode!=='campaign'||b.honroCustom?'훈련·사용자 전투는 경험치 없음':contribution?.version===4?(contribution.rewardBalance===1?'동행 공통 20% · 피해·유효 지원·목표 기여 80%':'피해·유효 지원·목표 기여에 따라 개별 성장'):'이 장은 기존 성장 방식 유지');
  xp.querySelector('i').style.width=fraction*100+'%';xp.setAttribute('aria-valuenow',String(percent));xp.setAttribute('aria-valuetext',maxed?`경지 ${level} · 최대 경지`:`경지 ${level} · 경험치 ${percent}%`);
 }
  const existence=el.querySelector('.unit-info-existence'),response=G.HONRO_CORE.effectiveDefenseForUnit(u),key=[u.id,response.form,response.qi,response.soul].join(':');
  if(existence.dataset.key!==key){existence.innerHTML=G.HONRO_CORE.existenceDefenseView(u);existence.dataset.key=key;}
 existence.hidden=!!boundBody;
 text('.unit-info-desc',boundBody?'소단의 몸을 공격하지 마세요. 사람과 떨어진 바깥 붉은 주박을 겨누세요.':description(u,a.engine.b));
 text('.unit-info-skills',!boundBody&&skills.length?'주요 기예 · '+skills.map(s=>s.name).join(' / '):'');
 const states=G.HonroCombatStatus.effects(a.engine.b,u);
 text('.unit-info-status',states.join(' · ')||(player(u)?'적용 중인 상태가 없습니다.':''));
 const actionReason=el.querySelector('.unit-info-reason');actionReason.hidden=!player(u);
 if(player(u))text('.unit-info-reason',G.HonroCombatStatus.reason(a.engine,u,u.id===a.engine.b.active?C.SKILLS[a.selected]:undefined));
 const r=scene.canvas.getBoundingClientRect(),hud=document.querySelector('.honro-compact-hud')?.getBoundingClientRect();
 const bottom=Math.min(r.bottom,hud?.top??innerHeight)-10,top=Math.max(76,r.top+8);
 el.style.maxHeight=Math.max(90,bottom-top)+'px';
 const rect=el.getBoundingClientRect(),x=r.left+r.width/2+(u.x-scene.x)*scene.scale,y=r.top+r.height/2+(u.y-(G.HonroPartyPresentationHeight?.(u)??u.h)-scene.y)*scene.scale;
 let left=x+Math.max(18,u.r*scene.scale)+12;if(left+rect.width>innerWidth-12)left=x-rect.width-Math.max(18,u.r*scene.scale)-12;
 el.style.left=(innerWidth<=600?(innerWidth-rect.width)/2:clamp(left,12,innerWidth-rect.width-12))+'px';
 el.style.top=(innerWidth<=600?Math.max(top,bottom-rect.height):clamp(y,top,bottom-rect.height))+'px';
}
document.addEventListener('pointerdown',e=>{const a=G.HonroApp;if(!a?.scene)return;if(!e.target.closest('#unit-info,#battlecanvas'))close(a);});
G.HonroUnitInfo={bind,pick,show,tap,hover,close,tick,description};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/training.js
(()=>{
'use strict';
(function(G){'use strict';
const C=G.HONRO_CORE,H=G.HONRO_CONTENT,S=C.SKILLS,heroes=['archer','mage','knight','occultist'];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stamp=(id,size=30)=>C.icon('skill:'+id,'',size);
const rank=(d,id)=>S[id].basic||S[id].ultimate?1:d.ranks[id]||1;
const branch=id=>C.TALENT_MAP[id]?.branch??-1;
const skills=(cls,b)=>Object.values(S).filter(s=>s.cls===cls&&!s.enemyOnly&&(C.TALENT_MAP[s.id]||s.basic||s.id===C.ultimateSkill(cls))&&branch(s.id)===b).sort((a,b)=>(C.TALENT_MAP[a.id]?.row??0)-(C.TALENT_MAP[b.id]?.row??0));
const button=(action,value,html,attrs='')=>`<button type="button" data-training-action="${action}" data-value="${value}" ${attrs}>${html}</button>`;
function toolbar(app){const s=S[app.trainingSkill];return `<nav class="training-tools" aria-label="허공터 수련 설정">${button('open','',`<img src="${G.HonroUI.portraits()[app.trainingClass]}" alt=""><span><small>${H.hero[app.trainingClass].name} · 허공터</small><strong>${s.name} <em>경지 ${rank({ranks:app.trainingRanks},s.id)}</em></strong></span>${stamp(s.id,24)}<span class="training-edit">기예 고르기</span>`,'class="training-current" aria-label="캐릭터와 기예, 경지 선택"')}<button class="icon" data-action="training-reset" aria-label="같은 설정으로 다시 수련">${G.HonroFA.icon('rotateRight','',18)}</button></nav>`;}
function open(app){const id=app.trainingSkill;app.trainingDraft={cls:app.trainingClass,id,branch:branch(id),ranks:{...app.trainingRanks},passives:{...app.trainingPassives},active:id};render(app);}
function render(app,focus){
 const d=app.trainingDraft,s=S[d.id],r=rank(d,s.id),br=C.BRANCHES[d.cls][d.branch],available=skills(d.cls,d.branch),passives=Object.keys(d.passives).filter(id=>d.passives[id]&&S[id].cls===d.cls),portraits=G.HonroUI.portraits();
 const scroll=app.modal.querySelector('.training-body')?.scrollTop||0;
 const html=`
 <header class="training-heading"><div><small>허공터 · 자유 수련</small><h2 id="training-title">누구의 기예를 펼칠까요</h2><p>동행과 기예를 고르고, 원하는 경지에서 익혀 보세요.</p></div>${button('close','',G.HonroFA.icon('xmark','',20),'class="icon" aria-label="수련 설정 닫기"')}</header>
 <div class="training-body"><nav class="training-heroes" aria-label="수련할 동행">${heroes.map(cls=>button('hero',cls,`<img src="${portraits[cls]}" alt="${H.hero[cls].name} 초상"><span><strong>${H.hero[cls].name}</strong><small>${H.hero[cls].job}</small></span>`,`aria-pressed="${cls===d.cls}"`)).join('')}</nav>
 <nav class="training-branches" aria-label="기예 계통">${[{name:'기본 · 비기',color:'#c5caba'},...C.BRANCHES[d.cls]].map((b,i)=>button('branch',i-1,esc(b.name),`aria-pressed="${d.branch===i-1}" style="--branch:${b.color}"`)).join('')}</nav>
 <div class="training-content"><section class="training-library" aria-label="${esc(br?.name||'기본 기예')}"><div class="training-section-head"><h3>${esc(br?.name||'기본 기예')}</h3><span>${esc(br?.tag||'동행의 첫걸음')} · ${available.length}개</span></div><div class="training-cards">${available.map(sk=>button('skill',sk.id,`<span class="training-card-top"><i>${stamp(sk.id,31)}</i><small>${sk.passive?'상시 기예':sk.capstone?'계통 비기':sk.basic?'기본 공격':sk.ultimate?'비기':'사용 기예'}</small><em>${sk.passive&&d.passives[sk.id]?'적용 중':`경지 ${rank(d,sk.id)}`}</em></span><strong>${esc(sk.name)}</strong><span class="training-card-desc">${esc(sk.desc)}</span>`,`class="training-card" aria-pressed="${d.id===sk.id}"`)).join('')}</div></section>
  <aside class="training-detail" aria-label="선택한 기예"><div class="training-detail-name"><i>${stamp(s.id,42)}</i><div><small>${esc(br?.name||'기본 기예')}</small><h3>${esc(s.name)}</h3></div></div><p class="skill-desc">${esc(s.desc)}</p><p class="skill-mechanics">${esc(C.skillPlayNotes(s.id))}</p>${s.passive?'':C.existenceAttackView(s)}
 <fieldset class="training-level"><legend>기예의 경지 <strong>${r}${s.basic||s.ultimate?'':' / 8'}</strong></legend>${s.basic||s.ultimate?'<p>이 기예는 하나의 경지로 펼칩니다.</p>':`<div class="training-ranks" role="group" aria-label="기예 레벨">${Array.from({length:8},(_,i)=>button('rank',i+1,i+1,`aria-label="경지 ${i+1}" aria-pressed="${r===i+1}"`)).join('')}</div>`}</fieldset>
 ${s.passive?button('passive',s.id,`${d.passives[s.id]?'✓ 적용 중 · 눌러 해제':'＋ 이 상시 기예 적용'}`,`class="training-passive" aria-pressed="${!!d.passives[s.id]}"`):''}
 ${!s.basic&&!s.ultimate&&C.skillGrowthRows(s.id,r).length?`<div class="effect-compare training-effects" aria-label="선택 경지의 효과"><div class="training-effect-title">경지 ${r}의 효과</div>${C.skillGrowthRows(s.id,r).map(v=>`<div><span>${esc(v.label).replace(/MP/g,'기력')}</span><b>${esc(v.value)}</b></div>`).join('')}</div>`:''}
 </aside></div></div>
 <footer class="training-footer"><div><strong>${H.hero[d.cls].name} · ${S[d.active].name} · 경지 ${rank(d,d.active)}</strong><span>상시 기예 ${passives.length}개${passives.length?' · '+passives.map(id=>`${S[id].name} ${rank(d,id)}`).join(' / '):' · 카드에서 추가할 수 있어요'}</span></div>${button('apply','',s.passive?'이 구성으로 수련':'이 기예로 수련','class="training-apply"')}</footer>`;
 app.open(html,'training-dialog');
 const dialog=app.modal.querySelector('.training-dialog');dialog.setAttribute('aria-labelledby','training-title');dialog.style.setProperty('--training-accent',br?.color||s.color);dialog.querySelector(':scope > .close')?.remove();
 if(focus){app.modal.querySelector('.training-body').scrollTop=scroll;app.modal.querySelector(`[data-training-action="${focus.action}"][data-value="${focus.value}"]`)?.focus({preventScroll:true});}
 else app.modal.querySelector('[data-training-action="hero"][aria-pressed="true"]')?.focus({preventScroll:true});
}
function act(app,action,value){
 if(action==='open'){open(app);return;}if(action==='close'){app.close();return;}
 const d=app.trainingDraft;if(!d)return;
 if(action==='apply'){
  app.trainingClass=d.cls;app.trainingSkill=d.active;app.trainingRanks={...d.ranks};app.trainingPassives={...d.passives};
  const b=app.engine.b,old=b.units.find(v=>v.side===0&&!v.summoned&&!v.enthrall&&v.id.startsWith('p-'))||b.units.find(v=>v.side===0&&!v.summoned&&!v.enthrall);
  if(!old)return;
  const index=b.units.indexOf(old);
  // Rebuild only the controlled hero. Projectiles, terrain, stakes, summons,
  // enemy health and the current music session all remain in this battle.
  for(const cls of heroes){const h=b.heroes[cls];h.ranks={[C.baseSkill(cls)]:1};for(const t of C.TALENTS.filter(t=>t.cls===cls))if(!t.passive||d.passives[t.id])h.ranks[t.id]=d.ranks[t.id]||1;}
  const u=C.makeUnit(d.cls,0,old.x,old.y,{id:old.id,name:H.hero[d.cls].name,loadout:[d.active],tune:old.tune});
  C.applyHero(u,b.heroes[d.cls],true);
  Object.assign(u,{x:old.x,y:old.y,spawnX:old.spawnX,spawnY:old.spawnY,vx:old.vx,vy:old.vy,angle:old.angle,lastPower:old.lastPower,facing:old.facing,acted:old.acted,moveLeft:old.moveLeft,focus:9999,maxFocus:9999,hp:Math.max(1,Math.round(u.maxHp*old.hp/Math.max(1,old.maxHp))),cooldowns:{}});
  u.ranks={...b.heroes[d.cls].ranks,[d.active]:rank(d,d.active)};
  b.units[index]=u;
  // An enemy may be active while this modal is open. Never replace that enemy,
  // and repair duplicate ordinary practice heroes left by an older session.
  b.units=b.units.filter(v=>v===u||v.side!==0||v.summoned||v.enthrall);
  if(b.side===0||!b.units.some(v=>v.id===b.active))b.active=u.id;
  b.sceneVersion++;
  app.selected=d.active;app.selectedByUnit[u.id]=d.active;app.charging=false;app.scene.previewKey='';
  app.close();document.querySelector('.training-tools').outerHTML=toolbar(app);app.updateHUD(true);return;
 }
 if(action==='hero'){d.cls=value;d.id=d.active=C.baseSkill(value);d.branch=branch(d.id);}
 if(action==='branch'){d.branch=+value;d.id=skills(d.cls,d.branch)[0].id;if(!S[d.id].passive)d.active=d.id;}
 if(action==='skill'){d.id=value;if(!S[value].passive)d.active=value;}
 if(action==='rank')d.ranks[d.id]=+value;
 if(action==='passive')d.passives[value]=!d.passives[value];
 render(app,{action,value});
}
document.addEventListener('click',ev=>{const el=ev.target.closest('[data-training-action]');if(el&&G.HonroApp?.training)act(G.HonroApp,el.dataset.trainingAction,el.dataset.value);});
document.addEventListener('keydown',ev=>{const dialog=document.querySelector('.training-dialog');if(!dialog)return;ev.stopImmediatePropagation();if(ev.key==='Escape'){ev.preventDefault();G.HonroApp.close();document.querySelector('.training-current')?.focus();}if(ev.key==='Tab'){const items=[...dialog.querySelectorAll('button:not([disabled])')],first=items[0],last=items.at(-1);if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}}});
G.HonroTraining={toolbar,open};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/skill-preview.js
(()=>{
'use strict';
(function(G){'use strict';
const C=G.HONRO_CORE;
// Every active has a scenario contract; common shots share the same small fixture.
const scenarios={};const define=(ids,kind,options={})=>ids.split(' ').forEach(id=>scenarios[id]={kind,...options});
define('A01 M01 S09 O01','single');define('A14','distance',{positions:[720,1500]});define('A99','execution',{positions:[1680],hp:100});
define('A02 S11','line',{positions:[720,850,985,1120,1250]});define('A06','recovery',{focus:120,maxFocus:400});define('A10','prepare');
define('A11 A15','apex',{positions:[820,1000,1190]});define('A09 A13','offset',{positions:[820,1030,1160],heights:[0,130,55]});define('A12','return');
define('A05','push',{positions:[790,875,1010],movable:true});define('A04','spread',{positions:[800,900,1050],heights:[0,85,160]});define('A07','break');define('A03','ground-chain',{positions:[760,920,1070]});define('A08','fragments');
define('M06 M13','delayed-burst',{positions:[820,930,1020]});define('M02','bounce-ice');define('M04','lightning',{positions:[760,1010,1270]});define('M05','sky');define('M03','arc');define('M11 M12','reflection');define('M14','ring',{positions:[660,80,440]});define('M15','bagua',{positions:[560,710,360],heights:[100,0,260]});
define('M07','trap',{positions:[980],movable:true,enemy:true});define('M08','lure',{positions:[1040],movable:true,enemy:true});define('M10','healing-stake');define('M09','gate');define('M99','prison',{positions:[980],movable:true,enemy:true});
define('S00 S03','melee',{positions:[455,510]});define('S05','turn',{positions:[465,260]});define('S07','combo',{positions:[455,520,585],hp:45});define('S08','counter',{positions:[555],enemy:true});define('S02','life');
define('S01 S06 S04 S13','rush');define('S15','ground-air',{positions:[700,925],heights:[0,80],movable:true});define('S10','pull',{positions:[830],movable:true});define('S14','burst-blade',{positions:[840,860,880],heights:[0,105,205]});define('S12','orbit');
define('O02 O04','phase-wall');define('O03','reverse-rain',{positions:[1000,1130,1260]});define('O05','reverse-path',{positions:[840,970]});define('O06','weakness',{positions:[800,970],enemy:true});define('O07','betrayal',{positions:[800,975],enemy:true});define('O08','manifest',{positions:[830,955]});define('O09','enthrall',{positions:[800,1060],enemy:true});define('O10','earthbound',{positions:[840],hp:45});define('O11 O12','summon');define('O13','warden');define('O14','eater',{positions:[830,970]});define('O15','echo');define('O16','converge',{positions:[760,870]});
function shortShot(e,u,s,target){
 const seeds=e.shotSeeds(u,s,target).filter(a=>a.angle<45||a.angle>135).sort((a,b)=>b.power-a.power);
 for(const a of seeds){const hit=e.predict(u,s,a.angle,a.power,undefined,false);if(hit.unit===target.id||hit.closest<target.r)return a;}
 return e.bestShot(u,s,target);
}
function setup(app,id,h,canvas){
 const s=C.SKILLS[id],scenario=scenarios[id]||{kind:'single'},profile=structuredClone(app.profile);profile.heroes[s.cls]=structuredClone(h);profile.heroes[s.cls].ranks={[C.baseSkill(s.cls)]:1,[id]:Math.max(1,h.ranks[id]||0)};profile.loadouts[s.cls]=[id];
 const b=C.createBattle(1,profile,'practice',{party:[s.cls],wind:0}),floor=1000;
 Object.assign(b,{width:2400,height:1400,practiceCombat:true,terrain:[{id:'preview-floor',x:0,y:floor,w:2400,h:400,mat:'rock',hp:99999,maxHp:99999,indestructible:true}],waters:[],drafts:[],fields:[],zones:[],stakes:[],projectiles:[],wind:0,honroStage:1,honroBackdrop:'forest',honroLandmarks:[],honroMarkers:[],honroSurfaceZones:[],routePoints:[],sceneVersion:b.sceneVersion+1});
 const hero=b.units.find(u=>u.side===0);b.units=[hero];Object.assign(hero,{x:360,y:floor,spawnX:360,spawnY:floor,h:130,r:23,hp:900,maxHp:1200,focus:scenario.focus??9999,maxFocus:scenario.maxFocus??9999,attack:1,acted:false,loadout:[id],ranks:{...profile.heroes[s.cls].ranks},vx:0,vy:0,airborne:false,jumping:false});
 const close=s.branch==='sword',ring=id==='M14',bounce=['M11','M12'].includes(id),positions=[...(scenario.positions||(close?[460,560]:[840,955,1070]))];
 if(id==='S05')positions[1]=260;
 if(id==='S10')positions.splice(0,positions.length,830);
 if(id==='O03')positions.splice(0,positions.length,1000,1130,1260);
 if(id==='O16')positions.splice(0,positions.length,760,870);
 if(id==='M10'||id==='M09'||id==='O13'||id==='O14'||id==='O15')positions.splice(0,positions.length,1050);
 for(const [i,x] of positions.entries()){const u=C.makeUnit('knight',1,x,floor-(scenario.heights?.[i]||0),{id:'preview-target-'+i,name:'표적',h:115,r:27,honroType:'beast',honroVariant:'hound',hp:scenario.hp||2400,maxHp:scenario.hp||2400,armor:0,attack:.5,awake:true,fixed:!scenario.movable,loadout:['LA01'],focus:9999,maxFocus:9999});b.units.push(u);}
 if(id==='M10'||id==='O13'){const ally=C.makeUnit('knight',0,780,floor,{id:'preview-ally',name:'동행',h:130,hp:300,maxHp:1200,focus:20,maxFocus:200,acted:true,loadout:['S00'],ranks:{S00:1}});b.units.push(ally);}
 if(id==='O16')for(const [i,x] of [250,540].entries())b.units.push(C.makeUnit('occultist',0,x,floor-130,{id:'preview-echo-'+i,name:'반향령',summoned:true,summonOwner:hero.id,summonKind:'echo',summonRank:8,summonExpires:8,acted:true,fixed:true,summonFloating:true,h:65,r:20,hp:180,maxHp:180,attack:0,loadout:[],ranks:{...hero.ranks}}));
 if(bounce)b.terrain.push({id:'preview-wall',x:1140,y:620,w:40,h:380,mat:'rock',hp:99999,maxHp:99999,indestructible:true});
 if(['O02','O04','O05'].includes(id))b.terrain.push({id:'preview-phase-wall',x:id==='O05'?1270:690,y:540,w:35,h:460,mat:'rock',hp:99999,maxHp:99999,indestructible:true});
 if(id==='M12')b.terrain.push({id:'preview-reflect-ceiling',x:650,y:570,w:530,h:35,mat:'rock',hp:99999,maxHp:99999,indestructible:true});
 if(id==='A07')b.terrain.push({id:'preview-breakable',x:760,y:840,w:55,h:160,mat:'wood',hp:65,maxHp:65});
 if(id==='O08')for(const target of b.units.filter(v=>v.side===1))Object.assign(target,{honroType:'ghost',honroVariant:'ghost',spiritHidden:true});
 if(id==='O06'||id==='O07')for(const target of b.units.filter(v=>v.side===1))target.attack=1;
 for(const target of b.units.filter(v=>scenario.heights?.[Number(v.id.split('-').at(-1))])){target.fixed=true;target.summonFloating=true;}
 b.active=hero.id;b.side=0;b.phase='aim';b.queue=[];
 const pr={id,b,canvas,hero,age:0,acc:0,fired:false,follow:false,cycle:0,events:[],h:structuredClone(h),scenario,enemyActions:0,finishedAt:null};
 pr.scene=new G.HonroScene(canvas);pr.scene.manual=true;pr.scene.skillPreview=true;pr.e=new C.Engine(b,event=>{
  pr.events.push(event);if(pr.events.length>300)pr.events.shift();pr.scene.event(event);
  if(event.name==='skillGeometry'&&pr.bounds){const points=C.geometryPaths(JSON.parse(event.text)).flat();for(const p of points){pr.bounds.left=Math.min(pr.bounds.left,p.x-20);pr.bounds.right=Math.max(pr.bounds.right,p.x+20);pr.bounds.top=Math.min(pr.bounds.top,p.y-20);pr.bounds.bottom=Math.max(pr.bounds.bottom,p.y+20);}}
 },true);pr.e.checkEnd=()=>false;
 const enemyAction=pr.e.enemyAction.bind(pr.e),fire=pr.e.fire.bind(pr.e);
 pr.e.fire=(...args)=>{const side=b.side,ok=fire(...args);if(ok&&side===1)pr.enemyActions++;return ok;};
 pr.e.enemyAction=()=>{
  if(!scenario.enemy||pr.enemyActions>=1){if(pr.enemyActions>=1&&pr.e.active)pr.e.finishAction();return;}
  const actor=pr.e.active,stake=b.stakes[0];
  if(id==='O07'&&actor?.id==='preview-target-0'){pr.e.finishAction();return;}
  if(actor&&stake&&['M07','M99'].includes(id)){
   const touched=id==='M07'?stake.lastTriggerRound===b.round:stake.active;
   if(!touched){pr.e.walk(actor,Math.sign(stake.x-actor.x),C.STEP,true);return;}
   if(id==='M99'&&!Object.keys(stake.crossed||{}).length){pr.e.walk(actor,1,C.STEP,true);return;}
  }
  enemyAction();
 };
 const target=b.units[1];let aim={angle:0,power:.55};
 if(close)aim={angle:0,power:.65};
 else if(ring)aim={angle:0,power:(300-180)/720};
 else if(id==='A10')aim={angle:0,power:.5};
 else if(id==='O03')aim={angle:-30,power:.42};
 else if(id==='O05')aim={angle:0,power:.75};
 else if(id==='O16')aim={angle:20,power:.4};
 else if(id==='A11')aim={angle:68,power:.65};
 else if(id==='A03')aim={angle:-12,power:.5};
 else if(id==='A15')aim={angle:62,power:.52};
 else if(id==='M11')aim={angle:30,power:.72};
 else if(id==='M12')aim={angle:-8,power:.62};
 else if(id==='S11'||id==='S12')aim={angle:8,power:.75};
 else if(s.branch==='stake'||['O13','O14','O15'].includes(id)){
  // Aim at the ground, not a body: the same prediction and actual landing create the stake.
  const goal=id==='M09'?780:id==='M10'||['O13','O14','O15'].includes(id)?760:840;
  let best=Infinity;for(const angle of [15,28,42])for(let power=.25;power<=.9;power+=.025){const hit=pr.e.predict(hero,s,angle,power,undefined,false),d=Math.abs(hit.x-goal)+Math.abs(hit.y-floor);if(d<best){best=d;aim={angle,power};}}
 }else aim=shortShot(pr.e,hero,s,target);
 pr.aim=aim;hero.angle=aim.angle;hero.lastPower=aim.power;
 // Fit live actors first; expand only for flight that actually happens (e.g. an apex split).
 pr.bounds={left:Math.min(hero.x-95,...positions.map(x=>x-55)),right:Math.max(hero.x+100,...positions.map(x=>x+65),bounce?1180:0),top:floor-240,bottom:floor+55};
 pr.flightRight=pr.bounds.right+180;
 if(scenario.heights)pr.bounds.top=floor-Math.max(...scenario.heights)-160;
 if(id==='A99')pr.flightRight=2050;
 if(close)pr.bounds.top=floor-235;if(ring){pr.bounds.left=hero.x-365;pr.bounds.right=hero.x+365;pr.bounds.top=floor-385;}
 return pr;
}
function ready(p,id){const u=p.hero,b=p.b;b.active=u.id;b.side=0;b.phase='aim';u.acted=false;u.retreat=false;u.focus=9999;u.loadout=[id];u.ranks[id]??=1;u.cooldowns={};}
function tick(app,p,dt){
 p.age+=dt;const e=p.e,b=p.b,s=C.SKILLS[p.id],u=p.hero;
 if(!p.fired&&p.age>=.65){p.fired=e.fire(p.id,p.aim.angle,p.aim.power);p.started=p.age;}
 if(p.fired){
  if(p.id==='A09'&&!p.follow&&b.projectiles.some(q=>q.age>.28)){p.follow=e.turnArrow({x:b.units[1].x,y:b.units[1].y-100});}
  if(p.id==='M02'&&!p.follow&&b.projectiles.some(q=>!q.secondary&&q.bounces>0&&Math.hypot(q.x-b.units[1].x,q.y-b.units[1].y+55)<q.blast*.8)){p.follow=e.detonateIceGourd();}
  if(p.id==='S04'&&!p.follow&&b.projectiles.some(q=>q.body&&q.x>b.units[1].x-65)){p.follow=C.manualDive(e);}
  if(p.id==='S13'&&u.meleeFollow==='ready'&&!p.follow){p.follow=true;e.fire('S00',0,.55);}

  if(p.id==='A10'&&p.age>1.8&&!p.follow){p.follow=true;ready(p,'A14');const aim=shortShot(e,u,C.SKILLS.A14,b.units[1]);e.fire('A14',aim.angle,aim.power);}
  if(p.id==='M09'&&b.stakes.length===2&&!p.follow){ready(p,p.id);p.follow=e.useGate();}

  if(p.id==='O10'&&!p.follow&&!b.projectiles.length&&b.units[1]?.earthbind){p.follow=true;ready(p,'O01');const aim=shortShot(e,u,C.SKILLS.O01,b.units[1]);e.fire('O01',aim.angle,aim.power);}
  if(p.id==='O14'&&!p.follow){const eater=b.units.find(v=>v.summonKind==='eater'&&!v.dead);if(eater&&b.units.some(v=>v.eaterCapturedBy===eater.id)){p.follow=true;ready(p,'O01');const aim=shortShot(e,u,C.SKILLS.O01,eater);e.fire('O01',aim.angle,aim.power);}}
  if(p.id==='O15'&&!p.follow&&!b.projectiles.length&&b.units.some(v=>v.summonKind==='echo')&&p.age>2.5){p.follow=true;ready(p,'O01');const aim=shortShot(e,u,C.SKILLS.O01,b.units[1]);e.fire('O01',aim.angle,aim.power);}
  p.acc+=dt;for(let n=0;n<16&&p.acc>=C.STEP;n++,p.acc-=C.STEP){
   e.planningBudget(2);e.tick(C.STEP);
  }
 }
 const rect=p.canvas.getBoundingClientRect(),bounds={...p.bounds};
 // Expansion follows high arcs/knockback without losing the caster at ordinary distances.
 const subjects=[...b.units.filter(v=>!v.dead&&!v.eaterCapturedBy),...b.projectiles,...b.stakes,...b.zones,...b.fields];
 for(const v of subjects){if(!Number.isFinite(v.x)||!Number.isFinite(v.y)||v.x< -150||v.x>b.width+150||v.y< -1800||v.y>b.height+100)continue;const reach=v.radius||v.blast||0;bounds.left=Math.min(bounds.left,v.x-Math.max(50,reach));bounds.right=Math.max(bounds.right,v.x+Math.max(65,reach));bounds.top=Math.min(bounds.top,v.y-(v.h||0)-Math.max(40,reach));bounds.bottom=Math.max(bounds.bottom,v.y+Math.max(25,reach));}
 p.bounds=bounds;
 const z=Math.min(1.25,(rect.width-32)/(bounds.right-bounds.left),(rect.height-28)/(bounds.bottom-bounds.top));
 p.scene.scale=Math.max(.06,z);p.scene.x=(bounds.left+bounds.right)/2;p.scene.y=(bounds.top+bounds.bottom)/2;
 p.scene.render(e,dt,p.id,p.aim.power,!p.fired);
 const noMotion=!b.projectiles.length&&!b.units.some(v=>v.meleeAction||v.aiMove||v.moveTarget!==undefined),needsFollow=['A10','M09','S13','O10','O14','O15'].includes(p.id),reaction=!p.scenario.enemy||p.enemyActions>0||p.id==='S08'&&u.martialGuard?.counter===false||['M07','M08'].includes(p.id)&&b.stakes.some(v=>v.lastTriggerRound===b.round);
 const summonDone=!s.mode.startsWith('summon')||b.units.some(v=>v.summoned&&v.summonActionRound===b.round)||p.id==='O14'&&p.follow||p.id==='O15'&&p.follow;
 if(p.fired&&p.age>2.4&&noMotion&&reaction&&summonDone&&(!needsFollow||p.follow))p.finishedAt??=p.age;
 if(p.finishedAt!==null&&p.age-p.finishedAt>1.3||p.age>22){const cycle=p.cycle+1;app.preview=setup(app,p.id,p.h,p.canvas);app.preview.cycle=cycle;}
}
G.HonroSkillPreview={setup,tick,scenarios};
})(globalThis);

})();
await yieldIfNeeded();
// shared/runtime/journey-art.js
(()=>{
'use strict';
(function (G) {
  'use strict';
  // Menu-only, retained vector paintings. These do not add world geometry,
  // request assets, inspect progression, or own any character interactions.
  // The broad pine crown language follows the approved environment SVGs;
  // existing artwork and the shared combat renderer are intentionally untouched.
  const variants = Object.freeze(['forest', 'river', 'cliff', 'temple', 'cave', 'dawn']);
  const layers = Object.freeze(['surface', 'underground']);
  const cache = new Map();
  const palettes = {
    forest: { sky: '#102329', horizon: '#65746a', ridge: '#29434a', mist: '#a5b1a0', land: '#172925', light: '#5a6251', pine: '#142b26', leaf: '#355143' },
    river: { sky: '#152b35', horizon: '#788984', ridge: '#304e58', mist: '#b4c5bc', land: '#1c2c2d', light: '#646d5c', pine: '#193332', leaf: '#3b5750' },
    cliff: { sky: '#101f2b', horizon: '#5b757b', ridge: '#263e4d', mist: '#a1b4b2', land: '#1c2930', light: '#69716b', pine: '#1c3231', leaf: '#47584b' },
    temple: { sky: '#121f29', horizon: '#576e70', ridge: '#2c424c', mist: '#a5b5aa', land: '#222b2d', light: '#737263', pine: '#182d29', leaf: '#435446' },
    cave: { sky: '#101f28', horizon: '#43666d', ridge: '#223d48', mist: '#83a4a5', land: '#19262b', light: '#5b6766', pine: '#1b3031', leaf: '#384d46' },
    dawn: { sky: '#3b4551', horizon: '#c0ac87', ridge: '#526267', mist: '#d4c9ac', land: '#293536', light: '#86856b', pine: '#233d34', leaf: '#5c6a50' }
  };
  const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
  const group = (name, content, extra = '') => `<g data-art-layer="${name}" ${extra}>${content}</g>`;
  const stops = (a, b) => `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>`;
  const gradient = (id, a, b, extra = '') => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1" ${extra}>${stops(a, b)}</linearGradient>`;

  // A transformed circle is geometrically an ellipse and also avoids the
  // native SVG decoder's unsupported gradient-on-ellipse paint path.
  const glow = (x, y, rx, ry, id, extra = '') => `<g transform="translate(${x} ${y}) scale(1 ${ry / rx})" ${extra}><circle r="${rx}" fill="url(#${id})"/></g>`;

  function pine(x, y, scale, p, flip = false) {
    // One rooted trunk, three expressive branches, four broad needle masses.
    return `<g transform="translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})">` +
      path('M-27 5L-3-63 12-151 2-241 30-327 15-406 30-455 43-455 35-404 51-326 24-237 34-153 18-62 48 5 11-3 1-25-12 5Z M19-242L-61-278-122-284-152-309-146-318-113-299-55-299 32-267Z M31-331L88-371 157-386 190-414 199-410 167-371 95-355 26-309Z M31-407L-31-423-72-452-64-459-25-438 34-430Z', '#172324') +
      path('M6-13L14-65 25-150 16-241 40-326 25-403 33-441 31-404 46-326 22-239 30-151 14-62 32-3Z', p.light) +
      `<g data-rest-motion="pine-crown" data-rest-phase="${x / 240}">` +
      path('M-161-320C-183-335-155-352-129-342-113-366-80-369-60-357-35-377-1-366 11-350 36-363 64-341 70-323 46-311 21-311-2-320-26-306-50-315-66-320-87-309-111-318-123-327-143-319-153-322-161-320Z M-91-463C-98-480-79-489-62-483-45-504-17-503 0-489 16-505 43-494 54-481 74-486 95-469 99-454 77-445 59-452 46-458 21-448 1-455-13-463-39-453-62-462-91-463Z M67-387C49-401 74-417 97-408 115-431 143-435 163-423 182-440 212-435 225-420 249-426 272-408 268-396 249-382 230-388 213-393 193-380 169-386 153-390 128-373 105-383 90-388 80-382 74-385 67-387Z M-53-277C-73-294-51-310-29-300-11-318 8-319 26-307 41-317 65-306 71-293 53-280 34-282 19-286-2-275-29-285-53-277Z', p.pine) +
      path('M-157-337Q-143-349-129-342C-112-364-81-367-60-357Q-29-374-7-357L-28-347-61-348-89-339-115-338-133-330Z M-79-479L-61-483C-43-502-18-500 0-489Q22-500 43-484L20-478-4-480-24-472-50-476-65-469Z M76-405L97-408Q126-438 156-424C179-437 204-432 216-420L186 -416 166 -404 141 -407 117 -397 94 -397Z', p.leaf) + '</g></g>';
  }
  function rock(x, y, scale, p) {
    return `<g transform="translate(${x} ${y}) scale(${scale})">` +
      path('M-94 2L-78-40-45-60-18-99 24-108 64-88 77-56 103-38 110 2 45 11-17 5-65 11Z', '#233239') +
      path('M-78-40L-45-60-18-99 24-108 9-72-22-39-39 4-94 2Z', p.light) +
      path('M24-108L64-88 77-56 56-39 9-72Z', '#46524e') +
      path('M9-72L56-39 45 11-17 5-39 4-22-39Z', '#384440') +
      path('M-82-31L-65-40-52-35-66-21-87-18Z M-35-55L-20-67-9-61-22-46Z M64-30L84-29 96-15 70-17Z', p.pine) + '</g>';
  }
  function shelter(kind, p) {
    if (kind === 'cave') return group('cave-refuge',
      path('M178 624L189 464 397 477 420 629Z', '#26363b') +
      path('M306 471L397 477 420 629 321 629Z', '#162932') +
      path('M144 466Q182 475 207 450L266 415 329 429 398 466 445 472 433 493 382 484 198 482 150 487Z', '#16262e') +
      path('M163 470L207 450 266 415 329 429 398 466 424 473 381 466 325 442 268 429 210 461Z', '#4b5757') +
      path('M206 488H218V626H206Z M309 486H323V630H309Z M392 491H404V630H392Z M207 486H406V495H207Z', '#746650') +
      path('M245 528H282V573H245Z', '#cfab66') + path('M260 528H264V574H260Z M246 548H282V553H246Z', '#594c38') +
      path('M339 521H378V626H339Z', '#101f25') + path('M163 622H429L448 639H153Z', '#57615d'));
    const temple = kind === 'temple';
    return group(temple ? 'temple-eave-shelter' : 'wayside-shelter',
      path('M175 634L205 488 455 491 480 636Z', '#19292b') +
      path('M189 640H477L499 656H167Z', '#505b51') +
      path('M208 487H221V638H208Z M428 490H441V640H428Z M213 498H439V510H213Z', '#71674d') +
      path('M211 515L236 547 241 542 221 513Z M427 515L402 546 397 541 418 513Z', '#8f7a53') +
      path('M236 557H383V625H236Z', '#243a35') +
      path('M239 620H399V631H239Z M248 631H259V642H248Z M381 631H392V642H381Z', '#665a43') +
      path(temple ? 'M126 487Q161 498 198 474L287 423 323 402 357 421 444 474Q478 491 512 480L499 506 447 502 193 508 140 504Z' : 'M154 490L206 466 308 438 451 481 497 498 480 514 428 502 311 477 215 498 159 511Z', '#14262e') +
      path(temple ? 'M151 490L198 474 287 423 323 402 357 421 444 474 486 489 440 484 352 439 323 420 294 439 203 489Z' : 'M168 492L206 466 308 438 451 481 483 497 433 489 309 458 213 485Z', temple ? '#4b5d64' : '#626651') +
      path(temple ? 'M195 476L286 426 323 405 359 424 439 472 350 438 322 418 296 437Z' : 'M205 467L308 438 451 481 422 479 308 449 224 477Z', temple ? '#849091' : '#8b8566') +
      path('M206 499L311 479 429 502 480 508', 'none', 'stroke="#ad9c70" stroke-opacity=".45" stroke-width="2"') +
      `<g data-rest-motion="lantern">` + path('M265 519H281V545H265Z', '#e2b767') +
      path('M261 516H285L282 520H264Z M264 544H282L279 550H267Z', '#3b3830') + '</g>');
  }
  function farLandscape(p, id, variant) {
    const dawn = variant === 'dawn';
    const sky = group('open-sky', path('M0 0H1600V900H0Z', `url(#${id}-sky)`) +
      glow(1144, dawn ? 284 : 186, 330, 275, `${id}-halo`) +
      `<circle cx="1144" cy="${dawn ? 284 : 186}" r="${dawn ? 46 : 30}" fill="${dawn ? '#e6cb97' : '#d4d4b8'}" opacity=".88"/>` +
      path('M829 212C956 197 1023 218 1133 211S1304 191 1400 214L1266 222 1191 220 1124 229 1007 226 941 219Z M152 308C270 285 341 319 458 299L527 309 419 327 361 323 269 334 223 325 125 332Z', p.mist, 'opacity=".16" data-rest-motion="cloud"'));
    const peaks = group('distant-ink-mountains',
      path('M-80 571L56 470 115 473 179 417 245 435 297 376 338 392 371 359 422 382 478 349 533 377 579 359 623 414 674 398 722 453 793 434 855 484 933 450 999 466 1072 413 1116 430 1174 370 1210 388 1260 342 1292 353 1327 315 1356 329 1394 287 1420 311 1450 299 1487 353 1547 375 1660 340V730H-80Z', p.ridge, 'opacity=".52"') +
      path('M-60 560L74 534 118 493 164 502 210 471 235 476 266 427 288 436 327 385 347 385 378 340 402 351 427 320 452 346 468 379 492 377 527 430 554 421 591 480 623 461 672 512 726 531 782 519 835 560 898 576 946 546 1001 558 1060 532 1110 547 1163 521 1229 547 1270 522 1326 551 1378 535 1445 564 1510 553 1640 576V756H-60Z', `url(#${id}-mountain)`) +
      path('M427 320L452 346 468 379 492 377 527 430 554 421 591 480 567 548 526 507 518 467 479 431 469 409 448 400 442 357Z M347 385L378 340 402 351 382 399 360 416 347 456 319 476 328 436Z M266 427L288 436 274 476 232 520 208 573 186 583 212 526Z', `url(#${id}-granite)`) +
      path('M427 320L414 388 433 453 456 499 482 589 519 639 486 574 470 494 447 452 436 390Z M327 385L310 448 288 468 270 540 245 574 250 540 273 459 302 426Z', '#162c34', 'opacity=".28"') +
      path('M1050 553L1126 485 1170 479 1206 444 1244 454 1292 414 1321 434 1358 420 1406 467 1445 456 1495 500 1550 488 1635 517V700H1030Z', p.ridge, 'opacity=".65"'));
    const mist = group('valley-mist',
      path('M-30 542C217 507 270 570 466 549S812 566 1017 547 1390 493 1630 551V720H-30Z', `url(#${id}-mist)`) +
      path('M119 588C338 564 446 590 602 569C727 550 796 565 875 576 710 580 679 604 515 600S291 592 119 606Z M817 618C1013 586 1149 620 1284 583 1365 562 1434 579 1492 585 1377 592 1355 614 1265 619L1137 632 963 628Z', p.mist, 'opacity=".12"'), 'data-rest-motion="mist"');
    return sky + peaks + mist;
  }
  function cavernBackdrop(p, id) {
    return group('subterranean-depth',
      path('M0 0H1600V900H0Z', `url(#${id}-sky)`) +
      path('M0 0H1600V591L1496 572 1435 594 1317 550 1269 503 1237 430 1181 395 1100 267 1010 299 961 244 870 257 803 183 710 201 626 142 531 173 470 140 364 203 301 172 187 237 139 399 93 443 40 535 0 552Z', '#21363f') +
      path('M0 0H1600V401L1517 348 1486 291 1401 263 1353 186 1223 174 1161 108 1036 153 973 125 861 179 755 106 644 93 527 124 415 91 273 145 202 118 100 213 56 383 0 422Z', '#182c35') +
      path('M117 577L170 463 206 439 217 362 254 325 284 421 319 449 345 567Z M1206 625L1244 567 1250 501 1286 469 1319 485 1339 570 1392 604 1415 652Z', '#304952') +
      path('M206 439L217 362 254 325 242 419 224 450 210 524 181 553Z M1286 469L1319 485 1339 570 1318 560 1303 506 1280 507Z', '#556c6b', 'opacity=".32"') +
      path('M-20 560C237 554 427 619 678 589S1240 542 1630 596V747H-20Z', `url(#${id}-mist)`, 'data-rest-motion="mist"')) + cavernEnclosure(p, id);
  }
  function cavernEnclosure(p, id) {
    return group('cavern-enclosure',
      path('M0 0H1600V204L1493 180 1374 209 1312 267 1249 280 1187 362 1135 403 1130 456 1077 504 1046 571 1009 581 946 593 901 566 861 493 787 442 739 351 657 325 595 260 499 244 407 188 351 208 289 278 253 385 232 460 270 558 301 600 282 677 168 703H0Z', '#14252d') +
      path('M0 0H1600V83L1451 94 1325 140 1235 143 1156 191 1091 275 1041 303 1029 373 968 423 943 471 899 451 861 394 792 363 744 286 669 259 607 205 515 194 443 148 341 156 286 207 243 246 220 353 188 388 163 497 199 578 172 653 104 680H0Z', '#20343d') +
      path('M0 0H951L809 43 664 27 589 80 443 105 341 156 286 207 243 246 220 353 188 388 163 497 128 486 139 372 179 302 187 236 264 163 352 124 389 76 477 43 0 87Z', '#3d5054') +
      path('M1559 105L1451 94 1325 140 1235 143 1156 191 1091 275 1041 303 1029 373 968 423 943 471 967 357 1005 314 1022 237 1109 164 1179 126 1289 105 1359 58 1468 62Z', '#39545a') +
      path('M395 126L430 199 460 214 477 257 502 246 518 194Z M686 259L719 331 739 351 742 294Z M1291 248L1274 320 1249 353 1249 280Z', '#1a2c35') +
      glow(1085, 586, 330, 110, `${id}-halo`, 'opacity=".42"'));
  }
  function placeLandscape(variant, p, id, underground = false) {
    if (variant === 'river') return group('river-reach',
      path('M552 570C704 555 790 573 957 552S1350 545 1610 571V750H362Z', `url(#${id}-water)`) +
      path('M633 594C765 582 860 599 1000 578M770 622C923 608 1022 625 1187 603M1005 659C1176 637 1310 656 1521 623M1202 580L1338 576M427 675L593 662', 'none', 'stroke="#b0beb0" stroke-width="2" opacity=".29" data-rest-motion="ripples"') +
      path('M963 618L991 601 1026 601 1047 581 1069 595 1089 608 1122 615 1084 627 1012 627Z M1207 624L1229 604 1250 595 1271 602 1290 616 1331 622 1349 634 1271 638Z', '#334944') +
      path('M1026 601L1047 581 1069 595 1056 596 1045 591 1034 605Z M1229 604L1250 595 1271 602 1257 605 1249 600Z', '#7e8c7a', 'opacity=".53"') +
      path('M1004 567L1111 547 1203 551 1280 579 1270 596 1209 576 1113 565 1015 585Z', '#334344') +
      path('M1041 572L1055 571 1054 600 1040 603Z M1234 579L1249 585 1248 613 1233 608Z', '#263c40') +
      path('M-20 679L42 615 87 618 138 588 198 599 251 575 286 604 348 623 409 649 480 656 454 710H-20Z', '#253d37') +
      (underground ? rock(224, 654, 1.03, p) : pine(226, 665, .76, p)) + rock(352, 683, .6, p) + shelter('river', p));
    if (variant === 'cliff') return group('granite-lee',
      path('M-40 159L88 118 155 144 210 206 236 291 292 328 315 393 359 416 395 499 453 555 450 674 248 714-40 706Z', '#203239') +
      path('M88 118L155 144 210 206 236 291 215 323 193 281 159 249 151 204 111 196 96 162Z M292 328L315 393 359 416 395 499 364 522 328 472 318 430 289 407 274 361Z M-40 159L88 118 62 201 21 246-13 355-40 388Z', '#5b6966') +
      path('M151 204L159 249 193 281 215 323 200 406 223 452 259 481 275 557 228 626 210 541 164 480 147 367 124 318Z', '#30464a') +
      path('M-40 641L41 607 129 620 179 590 269 618 304 659 438 662 460 698 111 718-40 704Z', '#2b393a') +
      pine(151, 638, .70, p, true) + rock(341, 684, .75, p) +
      path('M1115 584L1150 535 1168 518 1188 478 1202 442 1227 427 1243 442 1254 479 1280 509 1294 557 1324 583V671H1105Z', '#38505a', 'opacity=".62"') +
      path('M1243 442L1254 479 1280 509 1294 557 1271 537 1251 518 1242 489 1227 481Z', '#728078', 'opacity=".45"') +
      shelter('cliff', p));
    if (variant === 'temple') return group('temple-court',
      path('M-20 637H447L501 664 710 679 717 693H-20Z', '#394449') +
      path('M-20 639H447L472 651H-20Z', '#8a8872', 'opacity=".45"') +
      path('M25 441L152 454 165 631H18Z', '#32403d') +
      path('M-30 439L15 412 136 416 196 453 180 470 108 455 12 452-30 460Z', '#1e3139') +
      path('M-16 440L15 412 136 416 179 444 134 432 16 426Z', '#6a7674') +
      path('M2 453H14V640H2Z M124 455H140V640H124Z M11 522H125V530H11Z', '#786952') +
      (underground ? rock(484, 647, .87, p) : pine(474, 651, .74, p, true)) + shelter('temple', p) +
      path('M1149 666L1170 655 1176 588 1198 589 1204 655 1225 666Z M1163 586L1170 564 1203 564 1211 586Z M1151 562L1188 540 1224 562Z', '#536063') +
      path('M1180 574H1195V583H1180Z', '#e3bd73') +
      path('M1188 540L1224 562 1208 561 1186 551 1167 560 1151 562Z', '#879087'));
    if (variant === 'cave') return shelter('cave', p) + rock(438, 676, .77, p) + rock(1137, 665, .38, p);
    return group(variant === 'dawn' ? 'morning-pine-bank' : 'sheltered-pine-grove',
      path('M-40 671L25 637 95 629 148 583 204 597 252 576 329 609 365 637 431 635 492 673 438 722H-40Z', '#24382f') +
      pine(173, 685, 1.07, p) + pine(398, 658, .58, p, true) +
      rock(349, 691, .85, p) + shelter('forest', p) +
      path('M1164 671L1211 642 1256 644 1308 610 1354 629 1398 605 1442 641 1521 618 1630 646V750H1146Z', '#233934') +
      pine(1539, 698, .70, p, true) + rock(1225, 690, .44, p));
  }
  function campGround(p, id) {
    return group('continuous-travelling-ground',
      path('M-40 731C143 685 266 684 418 698S644 682 778 689 1016 692 1146 710 1421 678 1640 693V930H-40Z', `url(#${id}-ground)`) +
      path('M-40 753C135 707 255 711 414 731S653 710 797 714 1020 746 1168 740 1433 695 1640 710L1640 753C1421 730 1330 761 1187 779S1009 786 884 780 723 771 622 781 436 779 285 753 104 749-40 802Z', '#767865', 'opacity=".17"') +
      path('M-30 770C116 728 239 732 389 749S650 731 792 741 1015 775 1155 767 1434 720 1631 729', 'none', 'stroke="#b0a787" stroke-width="2" opacity=".15"') +
      group('fire-ground-light', glow(800, 758, 300, 103, `${id}-fire-ground`), 'data-rest-motion="fire-ground"') +
      path('M-30 847L60 826 117 835 167 821 228 839 289 830 352 851 428 854 469 870 565 864 634 886 737 882 817 909H-30Z M1082 906L1114 871 1197 854 1248 861 1304 835 1360 838 1415 813 1486 821 1533 801 1630 815V930Z', '#111f23') +
      path('M-18 851L-5 806 2 831 20 799 11 842 31 826 26 849Z M132 834L146 798 146 825 161 806 156 837Z M1472 823L1468 782 1480 802 1499 760 1493 807 1525 786 1512 814Z M1260 857L1273 830 1271 851 1290 831 1284 856Z', '#132626') +
      group('wind-stirred-grass-left',path('M107 830q-11-44-34-61 28 9 43 51 1-45 20-67-10 32-8 70 17-23 37-29-18 16-25 36z','#52604d','opacity=".56"'),'data-rest-motion="grass" data-rest-phase=".2"') +
      group('wind-stirred-grass-right',path('M1450 817q-9-34-29-52 26 11 40 44 4-42 28-62-17 30-17 65 18-17 40-17-23 9-31 26z','#5c6953','opacity=".45"'),'data-rest-motion="grass" data-rest-phase="1.9"') +
      rock(71, 860, .94, {...p, light:'#45504a'}) + rock(1502, 855, .76, {...p, light:'#414d48'}) +
      path('M377 793L403 790 414 800 405 807 376 805 367 800Z M1157 805L1182 799 1192 807 1185 815 1155 814Z M654 831L669 828 679 834 669 839 650 836Z', '#5d6254', 'opacity=".44"'));
  }
  function campProps(id) {
    return group('resting-circle',
      `<ellipse cx="565" cy="768" rx="101" ry="15" fill="#0b171b" opacity=".6"/><ellipse cx="1044" cy="772" rx="103" ry="15" fill="#0b171b" opacity=".6"/>` +
      path('M468 750L627 739 635 759 480 772Z', '#302d24') +
      path('M468 750L627 739 623 747 482 760Z', '#776a49') +
      path('M480 755L492 756 497 770 485 773Z M610 749L621 750 626 763 615 765Z', '#473e2c') +
      path('M957 751L1128 763 1126 780 955 768Z', '#352c25') +
      path('M957 751L1128 763 1123 770 961 760Z', '#817052') +
      path('M969 764L981 764 980 777 968 776Z M1102 773L1115 774 1112 786 1100 785Z', '#473d2e') +
      `<ellipse cx="800" cy="766" rx="95" ry="24" fill="#0c171a" opacity=".7"/><ellipse cx="800" cy="759" rx="83" ry="24" fill="#af6733" opacity=".22"/>` +
      path('M738 754L749 744 770 746 777 757 760 765 743 763Z M822 749L835 741 851 746 860 758 852 765 834 764Z M756 765L770 757 786 763 789 774 774 780 758 775Z M804 766L819 757 836 764 838 776 822 782 807 778Z', '#5c5a4b') +
      path('M739 754L749 744 770 746 764 752 750 752Z M823 749L835 741 851 746 848 751 835 748Z M757 765L770 757 786 763 778 766 768 765Z M805 766L819 757 836 764 828 768 815 765Z', '#a08a60') +
      path('M766 743L776 736 834 756 829 766Z M769 759L824 735 834 740 779 770Z', '#3c2d23') +
      path('M775 740L830 757M778 761L828 738', 'none', 'stroke="#bd7f44" stroke-width="3" opacity=".7"') +
      group('fire-air-light', glow(800, 737, 93, 111, `${id}-fire-halo`), 'data-rest-motion="fire-halo"') +
      group('campfire',
        path('M778 754C755 729 778 718 777 698 786 710 788 709 790 696 793 685 805 679 803 663 823 681 808 697 821 709 828 717 831 724 827 735 840 725 831 720 836 709 852 734 828 757 811 758Z', '#c47736', 'class="journey-flame-outer" data-rest-motion="flame-outer"') +
        path('M783 751C773 738 788 727 790 714 793 720 798 723 799 709 800 699 807 696 808 686 818 706 804 713 817 726 827 736 818 752 808 756Z', '#edb55f', 'class="journey-flame-inner" data-rest-motion="flame-inner"') +
        path('M795 752C786 740 803 733 802 722 817 735 815 747 805 756Z', '#f5d59a', 'data-rest-motion="flame-core"') +
        path('M801 713L804 708 805 714 803 718Z', '#d6a86a', 'opacity=".6" data-rest-motion="ember" data-rest-phase="0"') +
        path('M821 715L824 711 825 716 823 720Z', '#d6a86a', 'opacity=".6" data-rest-motion="ember" data-rest-phase=".37"') +
        path('M780 727L782 724 783 728 781 731Z', '#d6a86a', 'opacity=".6" data-rest-motion="ember" data-rest-phase=".71"'))) +
      group('wayfinding-signpost',
        `<ellipse cx="1384" cy="769" rx="77" ry="15" fill="#0c171b" opacity=".56"/>` +
        path('M1371 587L1389 585 1384 766 1372 778 1365 768Z', '#3b3226') +
        path('M1371 587L1377 587 1375 769 1371 774 1368 766Z', '#8d7750') +
        path('M1307 605L1437 596 1477 621 1441 650 1301 655 1306 633 1301 617Z', '#3d382b') +
        path('M1307 605L1437 596 1477 621 1456 619 1434 606 1308 614Z', '#94825c') +
        path('M1309 615L1435 607 1457 621 1433 640 1308 645Z', '#665a40') +
        path('M1314 623L1350 620M1314 631L1337 628M1390 616L1426 614M1406 635L1434 631', 'none', 'stroke="#a18c5d" stroke-width="2" opacity=".35"') +
        path('M1354 624L1411 621M1397 612L1412 621 1399 632', 'none', 'stroke="#d5c19a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".76"') +
        `<circle cx="1377" cy="616" r="2.5" fill="#292c26"/><circle cx="1376" cy="638" r="2.5" fill="#292c26"/>` +
        path('M1354 773L1362 749 1367 765 1387 745 1380 770 1399 761 1394 775Z', '#26352c'));
  }
  // Reuse the exact battlefield SVG and shared act-one palette pass.
  // Web loading retains external SVG text before the synchronous scene render.
  function campaignBackdrop(stage, id) {
    const mood=G.HonroEnvironment?.act1Mood(stage),finish=G.HonroEnvironment?.ACT1_FAR;
    const uri=mood&&G.HONRO_ACT1_FAR_DATA?.[mood.variant];
    if(!uri||!finish)return '';
    const source=G.HONRO_SVG_SOURCES?.[uri]||(/^data:image\/svg\+xml;base64,/.test(uri)&&G.atob?G.atob(uri.slice(uri.indexOf(',')+1)):'');
    if(!source)return '';
    // Inline the vector markup rather than nesting an SVG data-image: retained
    // SVG-in-SVG images are inconsistently decoded by screenshot renderers.
    // All artwork paths are unchanged; only document-local IDs are namespaced.
    const vector=source.replace(/<title\b[^>]*>[\s\S]*?<\/title>|<desc\b[^>]*>[\s\S]*?<\/desc>/g,'').replace(/<svg\b[^>]*>/,'<g>').replace(/<\/svg>/,'</g>').replace(/id="([^"]+)"/g,(_,key)=>`id="${id}-far-${key}"`).replace(/url\(#([^\)]+)\)/g,(_,key)=>`url(#${id}-far-${key})`);
    const brightness=finish.brightness[mood.variant];
    return `<defs><filter id="${id}-distance" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="${finish.saturation}"/><feComponentTransfer><feFuncR type="linear" slope="${brightness}"/><feFuncG type="linear" slope="${brightness}"/><feFuncB type="linear" slope="${brightness}"/></feComponentTransfer></filter></defs>`+
      group('campaign-distant-landscape',`<g filter="url(#${id}-distance)">${vector}</g><path d="M0 0H1600V900H0Z" fill="${finish.veil}" opacity="${finish.veilOpacity}"/><path d="M0 0H1600V900H0Z" fill="${mood.tint}" opacity="${mood.opacity}"/>`,`data-rest-backdrop="${mood.variant}"`);
  }
  function warehouseApproach(p){
    // The chapter-eight rest is outside a warehouse. A low side elevation and
    // warm doorway frame the distant gorge without closing the fire clearing.
    return group('warehouse-approach',
      path('M339 513L537 509 638 542V687L332 691Z','#293532')+
      path('M537 509L638 542V687L537 674Z','#19282b')+
      path('M304 514L342 484 524 463 666 535 645 550 530 513 332 534Z','#14272c')+
      path('M325 508L347 491 523 471 643 530 529 501 342 522Z','#6e7565')+
      path('M335 529H347V688H335Z M523 515H536V676H523Z M624 546H635V684H624Z','#71614a')+
      path('M381 547H465V682H381Z','#121f22')+
      path('M389 552H454V675H389Z','#9a7746','opacity=".42"')+
      path('M407 550H413V675H407Z M383 598H463V605H383Z','#453e30')+
      path('M551 567L608 581V631L551 618Z','#354842')+
      path('M558 573L600 583V591L558 581Z M558 591L600 601V609L558 599Z','#7a8068','opacity=".48"')+
      path('M325 688L536 674 650 687 643 700 327 704Z','#58604f')+
      rock(604,704,.28,p));
  }
  // Stage1 rest alone opts into the approved location paintings. These URLs
  // are inserted only when this rest is shown; no image request or app rerender
  // is needed to prepare the retained static SVG and existing fire transforms.
  function paintedRest1(){
    const a=G.HONRO_PAINTED_PILOTS,id='honro-rest1-painted',key=`rest1-painted:${a.revision}`;
    if(cache.has(key))return cache.get(key);
    const image=(name,x,y,w,h,extra='')=>`<image href="${a.images[name]}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
    const land='M-40 708C76 676 126 685 195 692C325 696 520 689 656 696S878 704 1020 706 1294 680 1450 685L1640 709V930H-40Z';
    const defs=`<defs>
      <clipPath id="${id}-land"><path d="${land}"/></clipPath>
      <filter id="${id}-far" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".52"/><feComponentTransfer><feFuncR type="linear" slope=".694" intercept=".055"/><feFuncG type="linear" slope=".694" intercept=".055"/><feFuncB type="linear" slope=".694" intercept=".055"/></feComponentTransfer></filter>
      <filter id="${id}-near" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".65"/><feComponentTransfer><feFuncR type="linear" slope=".82" intercept=".025"/><feFuncG type="linear" slope=".82" intercept=".025"/><feFuncB type="linear" slope=".82" intercept=".025"/></feComponentTransfer></filter>
      <pattern id="${id}-soil" width="670" height="670" patternUnits="userSpaceOnUse">${image('forestSoil',0,0,670,670)}</pattern>
      <pattern id="${id}-stone" width="384" height="256" patternUnits="userSpaceOnUse">${image('forestRock',0,0,384,256)}</pattern>
      <pattern id="${id}-bark" width="190" height="48" patternUnits="userSpaceOnUse"><svg width="190" height="48" viewBox="250 270 260 90" preserveAspectRatio="none">${image('ferryHall',0,0,1536,409)}</svg></pattern>
      <pattern id="${id}-bench-top" width="190" height="48" patternUnits="userSpaceOnUse"><svg width="190" height="48" viewBox="250 270 260 90" preserveAspectRatio="none">${image('ferryHall',0,0,1536,409)}</svg><rect width="190" height="48" fill="#baa482" opacity=".12"/></pattern>
      <linearGradient id="${id}-far-fade" x2="0" y2="1"><stop offset="0" stop-color="#293b44" stop-opacity="0"/><stop offset="1" stop-color="#293b44"/></linearGradient>
      <linearGradient id="${id}-earth" x2="0" y2="1"><stop stop-color="#5a564422"/><stop offset=".40" stop-color="#30392e55"/><stop offset="1" stop-color="#111d22"/></linearGradient>
      <radialGradient id="${id}-fire-ground"><stop stop-color="#c29659" stop-opacity=".3"/><stop offset=".5" stop-color="#b17d43" stop-opacity=".13"/><stop offset="1" stop-color="#ab703d" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-fire-halo"><stop stop-color="#edb65c" stop-opacity=".3"/><stop offset=".35" stop-color="#d29748" stop-opacity=".11"/><stop offset="1" stop-color="#d29748" stop-opacity="0"/></radialGradient>
    </defs>`;
    const far=group('stage1-mountain-dusk',`<rect x="-1600" y="-900" width="4800" height="2700" fill="#293b44"/>`+image('forestFar',-800,-155,3200,1067,`filter="url(#${id}-far)"`)+`<rect x="-800" y="-155" width="3200" height="1067" fill="#344655" opacity=".14"/><rect x="-800" y="410" width="3200" height="330" fill="url(#${id}-far-fade)"/>`,'data-rest-backdrop="stage1-painted"');
    // Root fans sit behind the exact courtyard silhouette and are naturally
    // buried by the foreground. No pine-crown motion hook is attached.
    const trees=group('two-grounded-static-pines',image('pineA',-105,18,490,688)+`<g transform="translate(3000 0) scale(-1 1)">${image('pineA',1260,112,450,632)}</g>`,`filter="url(#${id}-near)"`);
    const ground=group('earth-courtyard',`<path d="${land}" fill="#3d3f32"/><g clip-path="url(#${id}-land)"><rect x="-40" y="650" width="1680" height="280" fill="url(#${id}-soil)"/><path d="M370 707C536 703 652 724 805 720S1032 717 1160 734L1200 850C960 860 640 845 408 819Z" fill="#817052" opacity=".15"/><rect x="-40" y="650" width="1680" height="280" fill="url(#${id}-earth)"/></g>`);
    const inn=group('small-mountain-inn',image('rest1Inn',178,457,485,236,`filter="url(#${id}-near)"`));
    const stones=group('separate-low-stones',image('granite',42,654,154,73,`filter="url(#${id}-near)"`)+image('granite',1460,684,130,62,`filter="url(#${id}-near)"`));
    const fireLight=group('fire-ground-light',glow(800,758,300,103,`${id}-fire-ground`),'data-rest-motion="fire-ground"');
    // Retain the exact fire/motion markup and anchors. Only static bench,
    // hearth fills acquire the same painted timber/mineral finish.
    let props=campProps(id).replace(/<g data-art-layer="wayfinding-signpost"[^>]*>[\s\S]*$/,'');for(const color of ['#302d24','#352c25','#473e2c','#473d2e','#3c2d23','#3b3226','#3d382b','#665a40'])props=props.replaceAll(`fill="${color}"`,`fill="url(#${id}-bark)"`);
    for(const color of ['#776a49','#817052'])props=props.replaceAll(`fill="${color}"`,`fill="url(#${id}-bench-top)"`);
    props=props.replaceAll('fill="#5c5a4b"',`fill="url(#${id}-stone)"`).replace('fill="#0b171b" opacity=".6"','fill="#0b171b" opacity=".38"').replace('fill="#0c171a" opacity=".7"','fill="#0c171a" opacity=".42"');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-journey-art="stage1-painted" data-journey-layer="surface">${defs}${far}${trees}${ground}${inn}${stones}${fireLight}${props}</svg>`;
    cache.set(key,svg);return svg;
  }
  function paintedRest2(){
    const a=G.HONRO_PAINTED_PILOTS,id='honro-rest2-painted',key=`rest2-painted:${a.revision}`;
    if(cache.has(key))return cache.get(key);
    const image=(name,x,y,w,h,extra='')=>`<image href="${a.images[name]}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
    // A single sheltered ridge shoulder overlooks open valley. Its finite face
    // is separate from the broad, soil-covered gathering ledge in front.
    const mass='M-70 266L8 226Q62 223 88 267L116 295Q145 313 166 344L219 351L267 343L308 356L353 380L387 428L432 469L452 528L507 551L527 600L577 634L614 706L560 741L-70 764Z';
    const land='M-40 726C190 710 360 688 520 698C655 708 787 706 922 710S1135 697 1280 705Q1450 711 1640 730V930H-40Z';
    const rim='M-40 829C160 808 282 830 412 849L510 837 633 860 751 854 874 867 991 846 1118 852 1260 818 1390 810 1510 796 1640 812V930H-40Z';
    const defs=`<defs>
      <clipPath id="${id}-mass"><path d="${mass}"/></clipPath><clipPath id="${id}-land"><path d="${land}"/></clipPath><clipPath id="${id}-rim"><path d="${rim}"/></clipPath>
      <filter id="${id}-far" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".48"/><feComponentTransfer><feFuncR type="linear" slope=".67" intercept=".055"/><feFuncG type="linear" slope=".67" intercept=".055"/><feFuncB type="linear" slope=".67" intercept=".055"/></feComponentTransfer></filter>
      <filter id="${id}-near" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".63"/><feComponentTransfer><feFuncR type="linear" slope=".83" intercept=".025"/><feFuncG type="linear" slope=".83" intercept=".025"/><feFuncB type="linear" slope=".83" intercept=".025"/></feComponentTransfer></filter>
      <pattern id="${id}-soil" width="670" height="670" patternUnits="userSpaceOnUse">${image('forestSoil',0,0,670,670)}</pattern>
      <pattern id="${id}-stone" width="384" height="256" patternUnits="userSpaceOnUse">${image('forestRock',0,0,384,256)}</pattern>
      <linearGradient id="${id}-far-fade" x2="0" y2="1"><stop stop-color="#293b44" stop-opacity="0"/><stop offset="1" stop-color="#293b44"/></linearGradient>
      <linearGradient id="${id}-earth" x2="0" y2="1"><stop stop-color="#6b66542b"/><stop offset=".45" stop-color="#38413655"/><stop offset="1" stop-color="#111d22"/></linearGradient>
      <linearGradient id="${id}-rim-shade" x2="0" y2="1"><stop stop-color="#28383277"/><stop offset="1" stop-color="#111d22"/></linearGradient>
      <radialGradient id="${id}-fire-ground"><stop stop-color="#c29659" stop-opacity=".3"/><stop offset=".5" stop-color="#b17d43" stop-opacity=".13"/><stop offset="1" stop-color="#ab703d" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-fire-halo"><stop stop-color="#edb65c" stop-opacity=".3"/><stop offset=".35" stop-color="#d29748" stop-opacity=".11"/><stop offset="1" stop-color="#d29748" stop-opacity="0"/></radialGradient>
    </defs>`;
    const far=group('stage2-valley-overlook',`<rect x="-1600" y="-900" width="4800" height="2700" fill="#293b44"/>`+image('valleyFar',-800,-155,3200,1067,`filter="url(#${id}-far)"`)+`<rect x="-800" y="-155" width="3200" height="1067" fill="#344b55" opacity=".12"/><rect x="-800" y="410" width="3200" height="350" fill="url(#${id}-far-fade)"/>`,'data-rest-backdrop="stage2-painted"');
    // The root fan is buried by the rocky shoulder; the pine has no motion hook.
    const pine=group('one-static-ridge-pine',image('pineA',-23,-70,321,450,`filter="url(#${id}-near)"`));
    const shoulder=group('finite-windbreak-rock',`<g clip-path="url(#${id}-mass)">${image('forestRock',-100,180,900,600,`filter="url(#${id}-near)"`)}<path d="M267 343L353 380 387 428 432 469 452 528 507 551 527 600 577 634 614 706 515 720 410 650 375 550 350 470 305 400Z" fill="#152e35" opacity=".28"/></g>`);
    const stone=group('one-small-ledge-stone',image('granite',1180,645,210,100,`filter="url(#${id}-near)"`));
    const ground=group('continuous-ridge-gathering-ledge',`<path d="${land}" fill="#44463a"/><g clip-path="url(#${id}-land)"><rect x="-40" y="680" width="1680" height="250" fill="url(#${id}-soil)"/><path d="M440 714C594 721 696 730 809 725S1018 716 1140 733L1190 842C995 858 671 843 438 819Z" fill="#91836a" opacity=".14"/><rect x="-40" y="680" width="1680" height="250" fill="url(#${id}-earth)"/><g clip-path="url(#${id}-rim)">${image('forestRock',-80,480,1800,1200)}<rect x="-40" y="790" width="1680" height="140" fill="url(#${id}-rim-shade)"/></g></g>`);
    // Keep the exact retained flame/ember paths and fire hit target contract.
    // The exposed ledge has no inn, signpost or invented buildings/benches.
    let props=campProps(id).replace(/^<g data-art-layer="resting-circle"[^>]*>[\s\S]*?(?=<ellipse cx="800")/,'<g data-art-layer="resting-circle">').replace(/<g data-art-layer="wayfinding-signpost"[^>]*>[\s\S]*$/,'');
    props=props.replaceAll('fill="#5c5a4b"',`fill="url(#${id}-stone)"`).replace('fill="#0c171a" opacity=".7"','fill="#0c171a" opacity=".42"');
    const light=group('fire-ground-light',glow(800,758,300,103,`${id}-fire-ground`),'data-rest-motion="fire-ground"');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-journey-art="stage2-painted" data-journey-layer="surface">${defs}${far}${pine}${shoulder}${stone}${ground}${light}${props}</svg>`;
    cache.set(key,svg);return svg;
  }
  function paintedRest3(){
    const a=G.HONRO_PAINTED_PILOTS,id='honro-rest3-painted',key=`rest3-painted:${a.revision}`;
    if(cache.has(key))return cache.get(key);
    const image=(name,x,y,w,h,extra='')=>`<image href="${a.images[name]}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
    // The resting place is on the descent, above the landing. The bank falls
    // to the right; the short pier meets that bank rather than the fire circle.
    const bank='M-40 643C80 615 175 617 235 610C336 598 447 612 552 653Q642 696 742 700Q859 705 926 736C1007 748 1063 756 1147 771Q1280 792 1410 820L1640 845V930H-40Z';
    const rim='M-40 825Q158 809 298 835L406 841 516 856 623 849 734 873 866 865 997 887 1139 883 1261 910 1443 905 1640 930V950H-40Z';
    const water='M-40 624C220 605 398 630 600 630S1010 625 1270 615 1500 615 1640 632V871H-40Z';
    const defs=`<defs>
      <clipPath id="${id}-bank"><path d="${bank}"/></clipPath><clipPath id="${id}-rim"><path d="${rim}"/></clipPath><clipPath id="${id}-water"><path d="${water}"/></clipPath>
      <filter id="${id}-far" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".46"/><feComponentTransfer><feFuncR type="linear" slope=".65" intercept=".055"/><feFuncG type="linear" slope=".65" intercept=".055"/><feFuncB type="linear" slope=".65" intercept=".055"/></feComponentTransfer></filter>
      <filter id="${id}-near" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".62"/><feComponentTransfer><feFuncR type="linear" slope=".8" intercept=".025"/><feFuncG type="linear" slope=".8" intercept=".025"/><feFuncB type="linear" slope=".8" intercept=".025"/></feComponentTransfer></filter>
      <pattern id="${id}-soil" width="670" height="670" patternUnits="userSpaceOnUse">${image('forestSoil',0,0,670,670)}</pattern>
      <pattern id="${id}-stone" width="384" height="256" patternUnits="userSpaceOnUse">${image('forestRock',0,0,384,256)}</pattern>
      <pattern id="${id}-plank" width="240" height="29.6" patternUnits="userSpaceOnUse"><svg width="240" height="29.6" viewBox="280 128 300 37">${image('rest3Worktable',0,0,768,340)}</svg></pattern>
      <linearGradient id="${id}-far-fade" x2="0" y2="1"><stop stop-color="#293d45" stop-opacity="0"/><stop offset="1" stop-color="#293d45"/></linearGradient>
      <linearGradient id="${id}-water-tone" gradientUnits="userSpaceOnUse" x1="0" y1="610" x2="0" y2="870"><stop stop-color="#536c6e" stop-opacity="0"/><stop offset=".28" stop-color="#536c6e" stop-opacity=".25"/><stop offset=".6" stop-color="#405b60" stop-opacity=".8"/><stop offset="1" stop-color="#203b45"/></linearGradient>
      <linearGradient id="${id}-earth" x2="0" y2="1"><stop stop-color="#6a655138"/><stop offset=".45" stop-color="#303c345b"/><stop offset="1" stop-color="#111d22"/></linearGradient>
      <linearGradient id="${id}-rim-shade" x2="0" y2="1"><stop stop-color="#2a383777"/><stop offset="1" stop-color="#111d22"/></linearGradient>
      <radialGradient id="${id}-fire-ground"><stop stop-color="#c29659" stop-opacity=".3"/><stop offset=".5" stop-color="#b17d43" stop-opacity=".13"/><stop offset="1" stop-color="#ab703d" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-fire-halo"><stop stop-color="#edb65c" stop-opacity=".3"/><stop offset=".35" stop-color="#d29748" stop-opacity=".11"/><stop offset="1" stop-color="#d29748" stop-opacity="0"/></radialGradient>
    </defs>`;
    const far=group('stage3-valley-descent',`<rect x="-1600" y="-900" width="4800" height="2700" fill="#293d45"/>`+image('valleyFar',-800,-155,3200,1067,`filter="url(#${id}-far)"`)+`<rect x="-800" y="-155" width="3200" height="1067" fill="#344b55" opacity=".14"/><rect x="-800" y="410" width="3200" height="340" fill="url(#${id}-far-fade)"/>`,'data-rest-backdrop="stage3-painted"');
    const pine=group('one-static-bank-pine',image('pineA',-65,75,405,568,`filter="url(#${id}-near)"`));
    const river=group('low-water-below-road',`<path d="${water}" fill="url(#${id}-water-tone)"/><g clip-path="url(#${id}-water)"><path d="M820 636Q989 614 1123 626T1411 625L1640 639" fill="none" stroke="#718782" stroke-width="2" opacity=".11"/><path d="M919 653Q1003 644 1083 649M1298 647Q1408 641 1547 656M1045 692Q1167 685 1256 691M1398 701L1560 710M1196 753Q1321 744 1469 759M1475 790L1610 805" fill="none" stroke="#b0beb0" stroke-width="2" data-rest-motion="ripples"/><path d="M1097 737L1130 749 1137 760 1106 749Z M1211 714L1244 727 1253 740 1220 727Z" fill="#182e35" opacity=".22"/></g>`);
    // A few original broad planks, with complete structural posts in water.
    // This is neither the combat landing nor a distorted building sprite.
    const pier=group('short-landing-tip',`<g filter="url(#${id}-near)"><path d="M1106 688L1119 686 1124 747 1111 749Z M1218 665L1231 666 1236 726 1223 722Z" fill="url(#${id}-plank)"/><path d="M995 755L1272 656 1271 667 997 768Z" fill="url(#${id}-plank)"/><path d="M995 755L1272 656 1271 667 997 768Z" fill="#17282b" opacity=".42"/><path d="M930 734L1191 642 1272 656 995 756Z" fill="url(#${id}-plank)"/><path d="M1001 708L1070 728M1066 685L1136 705M1130 664L1199 681" fill="none" stroke="#1d2928" stroke-width="3" opacity=".66"/></g>`);
    const table=group('small-ferryman-worktable',`<ellipse cx="388" cy="657" rx="127" ry="10" fill="#142125" opacity=".2"/>`+image('rest3Worktable',245,537,280,280*340/768,`filter="url(#${id}-near)"`));
    const stone=group('low-shore-stone',image('granite',1040,695,180,180*236/497,`filter="url(#${id}-near)"`));
    // The foreground buries the pine root fan and the pier's shore end. A
    // small upper soil pad supports all four feet of the complete work table.
    // The center stays broad and clear for the current party.
    const ground=group('descending-earth-road',`<path d="${bank}" fill="#42483b"/><g clip-path="url(#${id}-bank)"><rect x="-40" y="590" width="1680" height="340" fill="url(#${id}-soil)"/><path d="M350 646C529 672 646 726 823 730S1170 793 1440 835L1590 928C1195 865 959 816 803 808S495 747 304 733Z" fill="#a09273" opacity=".17"/><rect x="-40" y="590" width="1680" height="340" fill="url(#${id}-earth)"/><g clip-path="url(#${id}-rim)">${image('forestRock',-80,480,1800,1200)}<rect x="-40" y="790" width="1680" height="160" fill="url(#${id}-rim-shade)"/></g></g>`);
    let props=campProps(id).replace(/^<g data-art-layer="resting-circle"[^>]*>[\s\S]*?(?=<ellipse cx="800")/,'<g data-art-layer="resting-circle">').replace(/<g data-art-layer="wayfinding-signpost"[^>]*>[\s\S]*$/,'');
    props=props.replaceAll('fill="#5c5a4b"',`fill="url(#${id}-stone)"`).replace('fill="#0c171a" opacity=".7"','fill="#0c171a" opacity=".42"');
    const light=group('fire-ground-light',glow(800,758,300,103,`${id}-fire-ground`),'data-rest-motion="fire-ground"');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-journey-art="stage3-painted" data-journey-layer="surface">${defs}${far}${pine}${river}${pier}${stone}${ground}${table}${weather('river',false)}${light}${props}</svg>`;
    cache.set(key,svg);return svg;
  }
  function paintedRest4(){
    const a=G.HONRO_PAINTED_PILOTS,id='honro-rest4-painted',key=`rest4-painted:${a.revision}`;
    if(cache.has(key))return cache.get(key);
    const image=(name,x,y,w,h,extra='')=>`<image href="${a.images[name]}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
    const land='M-40 705Q70 687 190 690H660C799 694 858 710 1017 707Q1158 710 1240 703T1420 689L1640 704V930H-40Z';
    const defs=`<defs>
      <clipPath id="${id}-land"><path d="${land}"/></clipPath>
      <filter id="${id}-far" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".46"/><feComponentTransfer><feFuncR type="linear" slope=".73" intercept=".17"/><feFuncG type="linear" slope=".73" intercept=".17"/><feFuncB type="linear" slope=".73" intercept=".17"/></feComponentTransfer></filter>
      <filter id="${id}-near" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".7"/><feComponentTransfer><feFuncR type="linear" slope=".86" intercept=".025"/><feFuncG type="linear" slope=".86" intercept=".025"/><feFuncB type="linear" slope=".86" intercept=".025"/></feComponentTransfer></filter>
      <filter id="${id}-tree" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".55"/><feComponentTransfer><feFuncR type="linear" slope=".76" intercept=".04"/><feFuncG type="linear" slope=".76" intercept=".04"/><feFuncB type="linear" slope=".76" intercept=".04"/></feComponentTransfer></filter>
      <pattern id="${id}-soil" width="520" height="520" patternUnits="userSpaceOnUse">${image('forestSoil',0,0,520,520,'opacity=".67"')}</pattern>
      <pattern id="${id}-stone" width="384" height="256" patternUnits="userSpaceOnUse">${image('forestRock',0,0,384,256)}</pattern>
      <linearGradient id="${id}-far-fade" x2="0" y2="1"><stop stop-color="#2c3d47" stop-opacity="0"/><stop offset="1" stop-color="#2c3d47"/></linearGradient>
      <linearGradient id="${id}-earth" x2="0" y2="1"><stop stop-color="#69563b38"/><stop offset=".38" stop-color="#403e2e66"/><stop offset="1" stop-color="#111d22"/></linearGradient>
      <radialGradient id="${id}-fire-ground"><stop stop-color="#c29659" stop-opacity=".3"/><stop offset=".5" stop-color="#b17d43" stop-opacity=".13"/><stop offset="1" stop-color="#ab703d" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-fire-halo"><stop stop-color="#edb65c" stop-opacity=".3"/><stop offset=".35" stop-color="#d29748" stop-opacity=".11"/><stop offset="1" stop-color="#d29748" stop-opacity="0"/></radialGradient>
    </defs>`;
    const far=group('stage4-open-mountain-shadow',`<rect x="-1600" y="-900" width="4800" height="2700" fill="#2c3d47"/>`+image('gateFar',-800,-155,3200,1067,`filter="url(#${id}-far)"`)+`<rect x="-800" y="-155" width="3200" height="1067" fill="#344b55" opacity=".1"/><rect x="-800" y="410" width="3200" height="340" fill="url(#${id}-far-fade)"/>`,'data-rest-backdrop="stage4-painted"');
    // The intact source is uniformly scaled beyond the left panorama edge.
    // Only a gate corner and its low wall face the road; the fire stays clear.
    const gate=group('north-gate-edge-and-low-wall',image('gate4',-415,695-1150*503/1280,1150,1150*503/1280,`filter="url(#${id}-near)"`));
    const pine=group('one-static-roadside-pine',image('pineA',1320,256,334,334*685/488,`filter="url(#${id}-tree)"`));
    const stones=group('local-roadside-stone',image('granite',1430,669,142,142*236/497,`filter="url(#${id}-near)"`));
    const ground=group('earth-road-outside-north-gate',`<path d="${land}" fill="#514a3b"/><g clip-path="url(#${id}-land)"><rect x="-40" y="650" width="1680" height="280" fill="url(#${id}-soil)"/><path d="M145 694C357 698 542 742 733 747S1079 715 1255 705L1470 844C1184 812 976 841 751 830S367 761 125 747Z" fill="#9a8864" opacity=".17"/><rect x="-40" y="650" width="1680" height="280" fill="url(#${id}-earth)"/></g>`);
    let props=campProps(id).replace(/^<g data-art-layer="resting-circle"[^>]*>[\s\S]*?(?=<ellipse cx="800")/,'<g data-art-layer="resting-circle">').replace(/<g data-art-layer="wayfinding-signpost"[^>]*>[\s\S]*$/,'');
    props=props.replaceAll('fill="#5c5a4b"',`fill="url(#${id}-stone)"`).replace('fill="#0c171a" opacity=".7"','fill="#0c171a" opacity=".42"');
    const light=group('fire-ground-light',glow(800,758,300,103,`${id}-fire-ground`),'data-rest-motion="fire-ground"');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-journey-art="stage4-painted" data-journey-layer="surface">${defs}${far}${gate}${pine}${stones}${ground}${light}${props}</svg>`;
    cache.set(key,svg);return svg;
  }
  function paintedRest5(){
    const a=G.HONRO_PAINTED_PILOTS,id='honro-rest5-painted',key=`rest5-painted:${a.revision}`;
    if(cache.has(key))return cache.get(key);
    const image=(name,x,y,w,h,extra='')=>`<image href="${a.images[name]}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
    // The dry shelf is a new resting place above the plunge pool, not a crop
    // of the combat map. The fire and people keep their established anchors.
    const shelf='M-40 708Q54 685 140 693L230 684 320 701Q415 697 483 689Q581 690 659 704L760 701Q863 693 950 701L1045 714 1112 744 1190 766 1253 809 1330 838 1452 881 1640 907V950H-40Z';
    const face='M-80-200H452L478-34 465 73 502 160 485 248 521 326 509 429 550 510 541 581 592 683 536 733H-80Z';
    const water='M-40 652Q235 640 410 652T754 657Q1010 653 1240 645T1640 656V940H-40Z';
    const defs=`<defs>
      <clipPath id="${id}-shelf"><path d="${shelf}"/></clipPath><clipPath id="${id}-face"><path d="${face}"/></clipPath><clipPath id="${id}-water"><path d="${water}"/></clipPath>
      <clipPath id="${id}-fall"><path d="M421-60Q438 123 436 280T428 470Q418 575 395 644Q477 659 589 646Q554 549 554 450T570 260Q574 105 577-60Z"/></clipPath>
      <filter id="${id}-far" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".46"/><feComponentTransfer><feFuncR type="linear" slope=".65" intercept=".055"/><feFuncG type="linear" slope=".65" intercept=".055"/><feFuncB type="linear" slope=".65" intercept=".055"/></feComponentTransfer></filter>
      <filter id="${id}-near" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".63"/><feComponentTransfer><feFuncR type="linear" slope=".83" intercept=".025"/><feFuncG type="linear" slope=".83" intercept=".025"/><feFuncB type="linear" slope=".83" intercept=".025"/></feComponentTransfer></filter>
      <filter id="${id}-back-rock" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".48"/><feComponentTransfer><feFuncR type="linear" slope=".65" intercept=".025"/><feFuncG type="linear" slope=".65" intercept=".025"/><feFuncB type="linear" slope=".65" intercept=".025"/></feComponentTransfer></filter>
      <pattern id="${id}-soil" width="650" height="650" patternUnits="userSpaceOnUse">${image('forestSoil',0,0,650,650)}</pattern>
      <pattern id="${id}-hearth" width="384" height="256" patternUnits="userSpaceOnUse">${image('forestRock',0,0,384,256)}</pattern>
      <linearGradient id="${id}-far-fade" x2="0" y2="1"><stop stop-color="#293d45" stop-opacity="0"/><stop offset="1" stop-color="#293d45"/></linearGradient>
      <linearGradient id="${id}-rock-depth" x2="0" y2="1"><stop stop-color="#192d2d" stop-opacity="0"/><stop offset=".5" stop-color="#172c2e" stop-opacity=".35"/><stop offset="1" stop-color="#111d22"/></linearGradient>
      <linearGradient id="${id}-soil-fade" x2="0" y2="1"><stop stop-color="white"/><stop offset=".45" stop-color="white" stop-opacity=".9"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>
      <mask id="${id}-dry-pad"><path d="M350 687Q612 695 757 706T1040 714L1155 850Q944 819 762 833T336 793Z" fill="url(#${id}-soil-fade)"/></mask>
      <linearGradient id="${id}-water-tone" x2="0" y2="1"><stop stop-color="#496a72"/><stop offset=".14" stop-color="#2a4b5c"/><stop offset=".6" stop-color="#173543"/><stop offset="1" stop-color="#102a35"/></linearGradient>
      <linearGradient id="${id}-fall-shade" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#294950" stop-opacity=".24"/><stop offset=".5" stop-color="#a3bcb6" stop-opacity="0"/><stop offset="1" stop-color="#163c48" stop-opacity=".22"/></linearGradient>
      <radialGradient id="${id}-mist"><stop stop-color="#c7d8cc" stop-opacity=".3"/><stop offset=".6" stop-color="#aec6bd" stop-opacity=".13"/><stop offset="1" stop-color="#aec6bd" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-fire-ground"><stop stop-color="#c29659" stop-opacity=".3"/><stop offset=".5" stop-color="#b17d43" stop-opacity=".13"/><stop offset="1" stop-color="#ab703d" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-fire-halo"><stop stop-color="#edb65c" stop-opacity=".3"/><stop offset=".35" stop-color="#d29748" stop-opacity=".11"/><stop offset="1" stop-color="#d29748" stop-opacity="0"/></radialGradient>
    </defs>`;
    const far=group('stage5-open-wet-valley',`<rect x="-1600" y="-900" width="4800" height="2700" fill="#293d45"/>`+image('valleyFar',-800,-155,3200,1067,`filter="url(#${id}-far)"`)+`<rect x="-800" y="410" width="3200" height="340" fill="url(#${id}-far-fade)"/>`,'data-rest-backdrop="stage5-painted"');
    const cliff=group('partial-wet-wall-behind-fall',`<g clip-path="url(#${id}-face)">${image('cliff5',-90,-260,700,1050,`filter="url(#${id}-back-rock)"`)}<path d="${face}" fill="#14333b" opacity=".17"/></g>`);
    const pool=group('low-pool-below-dry-shelf',`<path d="${water}" fill="url(#${id}-water-tone)"/><g clip-path="url(#${id}-water)"><path d="M351 665Q442 655 584 663L555 669 412 670Z M391 679Q498 668 611 675L571 682 429 684Z M425 696Q512 687 580 692L549 700 454 702Z" fill="#afc8be" opacity=".14"/><path d="M1153 676Q1278 666 1431 674M1290 695L1507 697M1374 729Q1460 721 1580 729M484 675Q529 672 582 676" fill="none" stroke="#aec6bd" stroke-width="2" data-rest-motion="ripples"/></g>`);
    const fall=group('waterfall-part-behind-shelf',`<g clip-path="url(#${id}-fall)">${image('water5',377,-60,240,720,'opacity=".79"')}<path d="M395-60H617V662H395Z" fill="url(#${id}-fall-shade)"/><path d="M460-170C448 55 477 230 456 440T449 850" fill="none" stroke="#d6e3d8" stroke-width="3" stroke-dasharray="34 68 113 92" opacity=".25" data-rest-motion="rest5-fall" data-rest-phase="0"/><path d="M512-190Q535 87 515 310T535 850" fill="none" stroke="#e3e9dd" stroke-width="2" stroke-dasharray="55 107 87 66" opacity=".2" data-rest-motion="rest5-fall" data-rest-phase=".7"/></g>`);
    const contact=group('small-fall-contact',`<path d="M403 648Q421 634 443 643Q461 627 486 643Q510 630 533 646Q553 637 575 651Q530 662 489 657T403 648Z" fill="#c9d9cf" data-rest-motion="rest5-foam"/>`+glow(494,656,186,38,`${id}-mist`)+`<g data-rest-motion="mist">${glow(514,647,203,51,`${id}-mist`)}</g>`);
    const ground=group('dry-mixed-rock-shelf',`<path d="${shelf}" fill="#343c34"/><g clip-path="url(#${id}-shelf)">${image('forestRock',-80,355,1800,1200,`filter="url(#${id}-near)"`)}<g mask="url(#${id}-dry-pad)"><rect x="310" y="680" width="890" height="200" fill="url(#${id}-soil)" opacity=".85"/></g><path d="M400 729Q601 721 797 748T1119 781L1190 857Q980 817 780 820T386 777Z" fill="#9e8e6b" opacity=".1"/><rect x="-40" y="690" width="1680" height="260" fill="url(#${id}-rock-depth)"/></g>`);
    let props=campProps(id).replace(/^<g data-art-layer="resting-circle"[^>]*>[\s\S]*?(?=<ellipse cx="800")/,'<g data-art-layer="resting-circle">').replace(/<g data-art-layer="wayfinding-signpost"[^>]*>[\s\S]*$/,'');
    props=props.replaceAll('fill="#5c5a4b"',`fill="url(#${id}-hearth)"`).replace('fill="#0c171a" opacity=".7"','fill="#0c171a" opacity=".42"');
    const light=group('fire-ground-light',glow(800,758,300,103,`${id}-fire-ground`),'data-rest-motion="fire-ground"');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-journey-art="stage5-painted" data-journey-layer="surface">${defs}${far}${cliff}${pool}${fall}${contact}${ground}${light}${props}</svg>`;
    cache.set(key,svg);return svg;
  }
  function paintedRest6(){
    const a=G.HONRO_PAINTED_PILOTS,id='honro-rest6-painted',key=`rest6-painted:${a.revision}`;
    if(cache.has(key))return cache.get(key);
    const image=(name,x,y,w,h,extra='')=>`<image href="${a.images[name]}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
    const land='M-40 813Q108 796 244 802L368 792Q451 771 518 750L580 725 650 700Q732 701 806 710T1010 710Q1142 698 1260 704T1460 696L1640 709V940H-40Z';
    const defs=`<defs>
      <clipPath id="${id}-land"><path d="${land}"/></clipPath>
      <filter id="${id}-far" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".42"/><feComponentTransfer><feFuncR type="linear" slope=".65" intercept=".055"/><feFuncG type="linear" slope=".65" intercept=".055"/><feFuncB type="linear" slope=".65" intercept=".055"/></feComponentTransfer></filter>
      <filter id="${id}-near" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".7"/><feComponentTransfer><feFuncR type="linear" slope=".86" intercept=".025"/><feFuncG type="linear" slope=".86" intercept=".025"/><feFuncB type="linear" slope=".86" intercept=".025"/></feComponentTransfer></filter>
      <filter id="${id}-tree" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".55"/><feComponentTransfer><feFuncR type="linear" slope=".76" intercept=".04"/><feFuncG type="linear" slope=".76" intercept=".04"/><feFuncB type="linear" slope=".76" intercept=".04"/></feComponentTransfer></filter>
      <pattern id="${id}-soil" width="520" height="520" patternUnits="userSpaceOnUse">${image('forestSoil',0,0,520,520,'opacity=".67"')}</pattern>
      <pattern id="${id}-stone" width="384" height="256" patternUnits="userSpaceOnUse">${image('forestRock',0,0,384,256)}</pattern>
      <linearGradient id="${id}-far-fade" x2="0" y2="1"><stop stop-color="#2c3d47" stop-opacity="0"/><stop offset="1" stop-color="#2c3d47"/></linearGradient>
      <linearGradient id="${id}-earth" x2="0" y2="1"><stop stop-color="#69563b38"/><stop offset=".38" stop-color="#403e2e66"/><stop offset="1" stop-color="#111d22"/></linearGradient>
      <radialGradient id="${id}-fire-ground"><stop stop-color="#c29659" stop-opacity=".3"/><stop offset=".5" stop-color="#b17d43" stop-opacity=".13"/><stop offset="1" stop-color="#ab703d" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-fire-halo"><stop stop-color="#edb65c" stop-opacity=".3"/><stop offset=".35" stop-color="#d29748" stop-opacity=".11"/><stop offset="1" stop-color="#d29748" stop-opacity="0"/></radialGradient>
    </defs>`;
    const far=group('stage6-open-mountain-shadow',`<rect x="-1600" y="-900" width="4800" height="2700" fill="#2c3d47"/>`+image('valleyFar',-800,-155,3200,1067,`filter="url(#${id}-far)"`)+`<rect x="-800" y="-155" width="3200" height="1067" fill="#344b55" opacity=".1"/><rect x="-800" y="410" width="3200" height="600" fill="url(#${id}-far-fade)"/>`,'data-rest-backdrop="stage6-painted"');
    // Only the original bridge approach end enters this panorama. Its broken
    // main spans remain beyond the left edge; the bridge is not restored.
    const bridge=group('bridge-approach-end-and-abutment',image('bridge6',-1850,560,2500,2500*400/2172,`filter="url(#${id}-near)"`));
    const ground=group('earth-and-gravel-bridge-shoulder',`<path d="${land}" fill="#514a3b"/><g clip-path="url(#${id}-land)"><rect x="-40" y="650" width="1680" height="280" fill="url(#${id}-soil)"/><path d="M145 694C357 698 542 742 733 747S1079 715 1255 705L1470 844C1184 812 976 841 751 830S367 761 125 747Z" fill="#9a8864" opacity=".17"/><rect x="-40" y="650" width="1680" height="280" fill="url(#${id}-earth)"/></g>`);
    let props=campProps(id).replace(/^<g data-art-layer="resting-circle"[^>]*>[\s\S]*?(?=<ellipse cx="800")/,'<g data-art-layer="resting-circle">').replace(/<g data-art-layer="wayfinding-signpost"[^>]*>[\s\S]*$/,'');
    props=props.replaceAll('fill="#5c5a4b"',`fill="url(#${id}-stone)"`).replace('fill="#0c171a" opacity=".7"','fill="#0c171a" opacity=".42"');
    const light=group('fire-ground-light',glow(800,758,300,103,`${id}-fire-ground`),'data-rest-motion="fire-ground"');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-journey-art="stage6-painted" data-journey-layer="surface">${defs}${far}${bridge}${ground}${light}${props}</svg>`;
    cache.set(key,svg);return svg;
  }
  function paintedRest7(){
    const a=G.HONRO_PAINTED_PILOTS,id='honro-rest7-painted',key=`rest7-painted:${a.revision}`;
    if(cache.has(key))return cache.get(key);
    const image=(name,x,y,w,h,extra='')=>`<image href="${a.images[name]}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
    const land='M-70 729Q106 709 271 718T533 725Q675 735 814 728T1090 724Q1235 711 1370 686T1660 647V950H-70Z';
    const hill='M1057 730C1114 680 1191 688 1259 625S1370 578 1429 501Q1509 445 1660 414V950H1057Z';
    const wall='M-45 710Q108 703 242 719L436 724 465 747Q240 732 101 740L-45 743Z';
    const bank='M-70 245C110 290 204 348 294 398S475 466 564 511Q641 536 698 607T845 730V950H-70Z';
    const defs=`<defs>
      <clipPath id="${id}-land"><path d="${land}"/></clipPath><clipPath id="${id}-hill"><path d="${hill}"/></clipPath><clipPath id="${id}-wall"><path d="${wall}"/></clipPath><clipPath id="${id}-root-bank"><path d="${bank}"/></clipPath>
      <filter id="${id}-far" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".39"/><feComponentTransfer><feFuncR type="linear" slope=".62" intercept=".063"/><feFuncG type="linear" slope=".62" intercept=".063"/><feFuncB type="linear" slope=".62" intercept=".063"/></feComponentTransfer></filter>
      <filter id="${id}-near" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".69"/><feComponentTransfer><feFuncR type="linear" slope=".87" intercept=".02"/><feFuncG type="linear" slope=".87" intercept=".02"/><feFuncB type="linear" slope=".87" intercept=".02"/></feComponentTransfer></filter>
      <filter id="${id}-tree" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".53"/><feComponentTransfer><feFuncR type="linear" slope=".73" intercept=".035"/><feFuncG type="linear" slope=".73" intercept=".035"/><feFuncB type="linear" slope=".73" intercept=".035"/></feComponentTransfer></filter>
      <pattern id="${id}-soil" width="580" height="580" patternUnits="userSpaceOnUse">${image('forestSoil',0,0,580,580,'opacity=".64"')}</pattern>
      <pattern id="${id}-stone" width="384" height="256" patternUnits="userSpaceOnUse">${image('forestRock',0,0,384,256)}</pattern>
      <linearGradient id="${id}-far-fade" x2="0" y2="1"><stop stop-color="#2d4149" stop-opacity="0"/><stop offset="1" stop-color="#2d4149"/></linearGradient>
      <linearGradient id="${id}-earth" x2="0" y2="1"><stop stop-color="#716146" stop-opacity=".08"/><stop offset=".5" stop-color="#444135" stop-opacity=".25"/><stop offset="1" stop-color="#18282b"/></linearGradient>
      <linearGradient id="${id}-hill-depth" x2="0" y2="1"><stop stop-color="#343e35" stop-opacity="0"/><stop offset=".5" stop-color="#273833" stop-opacity=".16"/><stop offset="1" stop-color="#203035"/></linearGradient>
      <radialGradient id="${id}-fire-ground"><stop stop-color="#c29659" stop-opacity=".3"/><stop offset=".5" stop-color="#b17d43" stop-opacity=".13"/><stop offset="1" stop-color="#ab703d" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-fire-halo"><stop stop-color="#edb65c" stop-opacity=".3"/><stop offset=".35" stop-color="#d29748" stop-opacity=".11"/><stop offset="1" stop-color="#d29748" stop-opacity="0"/></radialGradient>
    </defs>`;
    const far=group('stage7-quiet-mountain-opening',`<rect x="-1600" y="-900" width="4800" height="2700" fill="#2d4149"/>`+image('forestFar',-800,-155,3200,1067,`filter="url(#${id}-far)"`)+`<rect x="-800" y="-155" width="3200" height="1067" fill="#354b52" opacity=".13"/><rect x="-800" y="410" width="3200" height="600" fill="url(#${id}-far-fade)"/>`,'data-rest-backdrop="stage7-painted"');
    const slope=group('partial-hillside-toward-residents',`<path d="${hill}" fill="#354037"/><g clip-path="url(#${id}-hill)">${image('forestRock',1060,420,780,520,`filter="url(#${id}-near)" opacity=".79"`)}<path d="M1070 732C1140 681 1208 689 1270 635S1382 580 1438 508Q1534 457 1670 433" fill="none" stroke="url(#${id}-soil)" stroke-width="58"/><rect x="1030" y="430" width="650" height="520" fill="url(#${id}-hill-depth)"/></g>`);
    // Complete cutouts retain their own proportions. The camera sees only the
    // lower trunk/root crop and a house edge, rather than a miniature map.
    const bankArt=group('earth-bank-under-tree-roots',`<path d="${bank}" fill="#3b4034"/><g clip-path="url(#${id}-root-bank)"><rect x="-70" y="245" width="940" height="705" fill="url(#${id}-soil)"/>${image('forestRock',-180,390,850,567,`filter="url(#${id}-tree)" opacity=".52"`)}<rect x="-70" y="245" width="940" height="705" fill="url(#${id}-earth)"/></g>`);
    const tree=group('near-static-tree-base-and-root-fan',image('villageTree7',-740,-1090,1850*1073/1427,1850,`filter="url(#${id}-tree)"`));
    const home=group('partial-village-home',image('villageHome7',-90,735-600*672/1200,600,600*672/1200,`filter="url(#${id}-near)"`));
    const lowWall=group('low-house-edge-stones',`<g clip-path="url(#${id}-wall)">${image('forestRock',-70,449,620,413,`filter="url(#${id}-near)"`)}<path d="${wall}" fill="#25332d" opacity=".12"/></g>`);
    const ground=group('low-earth-courtyard',`<path d="${land}" fill="#4b4838"/><g clip-path="url(#${id}-land)"><rect x="-70" y="610" width="1740" height="340" fill="url(#${id}-soil)"/><path d="M106 733Q354 711 555 743T947 756Q1124 737 1289 707L1519 829Q1222 811 1006 845T536 824Q288 787 106 791Z" fill="#a18a63" opacity=".13"/><rect x="-70" y="610" width="1740" height="340" fill="url(#${id}-earth)"/></g>`);
    let props=campProps(id).replace(/^<g data-art-layer="resting-circle"[^>]*>[\s\S]*?(?=<ellipse cx="800")/,'<g data-art-layer="resting-circle">').replace(/<g data-art-layer="wayfinding-signpost"[^>]*>[\s\S]*$/,'');
    props=props.replaceAll('fill="#5c5a4b"',`fill="url(#${id}-stone)"`).replace('fill="#0c171a" opacity=".7"','fill="#0c171a" opacity=".42"');
    const light=group('fire-ground-light',glow(800,758,300,103,`${id}-fire-ground`),'data-rest-motion="fire-ground"');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-journey-art="stage7-painted" data-journey-layer="surface">${defs}${far}${slope}${bankArt}${tree}${lowWall}${home}${ground}${light}${props}</svg>`;
    cache.set(key,svg);return svg;
  }
  function paintedRest8(){
    const a=G.HONRO_PAINTED_PILOTS,id='honro-rest8-painted',key=`rest8-painted:${a.revision}`;
    if(cache.has(key))return cache.get(key);
    const image=(name,x,y,w,h,extra='')=>`<image href="${a.images[name]}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
    const land='M-70 729Q106 709 271 718T533 725Q675 735 814 728T1090 724Q1235 711 1370 686T1660 647V950H-70Z';
    const hill='M1100 728Q1180 701 1250 697T1390 664Q1530 626 1660 645V950H1100Z';
    const wall='M-70 718Q139 715 350 724L617 721 654 743Q410 735 180 741L-70 740Z';
    const defs=`<defs>
      <clipPath id="${id}-land"><path d="${land}"/></clipPath><clipPath id="${id}-hill"><path d="${hill}"/></clipPath><clipPath id="${id}-wall"><path d="${wall}"/></clipPath>
      <filter id="${id}-far" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".39"/><feComponentTransfer><feFuncR type="linear" slope=".62" intercept=".063"/><feFuncG type="linear" slope=".62" intercept=".063"/><feFuncB type="linear" slope=".62" intercept=".063"/></feComponentTransfer></filter>
      <filter id="${id}-near" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".69"/><feComponentTransfer><feFuncR type="linear" slope=".87" intercept=".02"/><feFuncG type="linear" slope=".87" intercept=".02"/><feFuncB type="linear" slope=".87" intercept=".02"/></feComponentTransfer></filter>
      <pattern id="${id}-soil" width="580" height="580" patternUnits="userSpaceOnUse">${image('forestSoil',0,0,580,580,'opacity=".64"')}</pattern>
      <pattern id="${id}-stone" width="384" height="256" patternUnits="userSpaceOnUse">${image('forestRock',0,0,384,256)}</pattern>
      <linearGradient id="${id}-far-fade" x2="0" y2="1"><stop stop-color="#2d4149" stop-opacity="0"/><stop offset="1" stop-color="#2d4149"/></linearGradient>
      <linearGradient id="${id}-earth" x2="0" y2="1"><stop stop-color="#716146" stop-opacity=".08"/><stop offset=".5" stop-color="#444135" stop-opacity=".25"/><stop offset="1" stop-color="#18282b"/></linearGradient>
      <linearGradient id="${id}-hill-depth" x2="0" y2="1"><stop stop-color="#343e35" stop-opacity="0"/><stop offset=".5" stop-color="#273833" stop-opacity=".16"/><stop offset="1" stop-color="#203035"/></linearGradient>
      <radialGradient id="${id}-fire-ground"><stop stop-color="#c29659" stop-opacity=".3"/><stop offset=".5" stop-color="#b17d43" stop-opacity=".13"/><stop offset="1" stop-color="#ab703d" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-fire-halo"><stop stop-color="#edb65c" stop-opacity=".3"/><stop offset=".35" stop-color="#d29748" stop-opacity=".11"/><stop offset="1" stop-color="#d29748" stop-opacity="0"/></radialGradient>
    </defs>`;
    const far=group('stage8-quiet-warehouse-approach',`<rect x="-1600" y="-900" width="4800" height="2700" fill="#2d4149"/>`+image('forestFar',-800,-155,3200,1067,`filter="url(#${id}-far)"`)+`<rect x="-800" y="-155" width="3200" height="1067" fill="#354b52" opacity=".13"/><rect x="-800" y="410" width="3200" height="600" fill="url(#${id}-far-fade)"/>`,'data-rest-backdrop="stage8-painted"');
    const slope=group('low-rock-ledge-opposite-warehouse',`<path d="${hill}" fill="#344038"/><g clip-path="url(#${id}-hill)">${image('forestRock',1050,598,850,566,`filter="url(#${id}-near)" opacity=".75"`)}<path d="M1100 730Q1180 704 1250 700T1390 667Q1530 629 1660 648" fill="none" stroke="url(#${id}-soil)" stroke-width="32"/><rect x="1030" y="610" width="700" height="340" fill="url(#${id}-hill-depth)"/></g>`);
    // The visible right-hand bay is closed; the open middle bay lies outside
    // the scene. The original aspect is retained; the lower foundation is
    // sunk 24 units into the unchanged foreground earth, hiding alpha gaps.
    const home=group('partial-funeral-warehouse',image('bierStore8',-880,749-1500*580/1536,1500,1500*580/1536,`filter="url(#${id}-near)"`));
    const lowWall=group('low-warehouse-foundation',`<g clip-path="url(#${id}-wall)">${image('forestRock',-70,440,760,507,`filter="url(#${id}-near)"`)}<path d="${wall}" fill="#25332d" opacity=".12"/></g>`);
    const ground=group('low-earth-courtyard',`<path d="${land}" fill="#4b4838"/><g clip-path="url(#${id}-land)"><rect x="-70" y="610" width="1740" height="340" fill="url(#${id}-soil)"/><path d="M106 733Q354 711 555 743T947 756Q1124 737 1289 707L1519 829Q1222 811 1006 845T536 824Q288 787 106 791Z" fill="#a18a63" opacity=".13"/><rect x="-70" y="610" width="1740" height="340" fill="url(#${id}-earth)"/></g>`);
    let props=campProps(id).replace(/^<g data-art-layer="resting-circle"[^>]*>[\s\S]*?(?=<ellipse cx="800")/,'<g data-art-layer="resting-circle">').replace(/<g data-art-layer="wayfinding-signpost"[^>]*>[\s\S]*$/,'');
    props=props.replaceAll('fill="#5c5a4b"',`fill="url(#${id}-stone)"`).replace('fill="#0c171a" opacity=".7"','fill="#0c171a" opacity=".42"');
    const light=group('fire-ground-light',glow(800,758,300,103,`${id}-fire-ground`),'data-rest-motion="fire-ground"');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-journey-art="stage8-painted" data-journey-layer="surface">${defs}${far}${slope}${lowWall}${home}${ground}${light}${props}</svg>`;
    cache.set(key,svg);return svg;
  }
  function paintedRest9(){
    const a=G.HONRO_PAINTED_PILOTS,id='honro-rest9-painted',key=`rest9-painted:${a.revision}`;
    if(cache.has(key))return cache.get(key);
    const image=(name,x,y,w,h,extra='')=>`<image href="${a.images[name]}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
    const land='M-70 729Q106 709 271 718T533 725Q675 735 814 728T1090 724Q1235 711 1370 686T1660 647V950H-70Z';
    const hill='M1100 728Q1180 701 1250 697T1390 664Q1530 626 1660 645V950H1100Z';
    const wall='M-70 685Q47 678 139 690L263 699 294 722Q171 728 53 730L-70 737Z';
    const defs=`<defs>
      <clipPath id="${id}-land"><path d="${land}"/></clipPath><clipPath id="${id}-hill"><path d="${hill}"/></clipPath><clipPath id="${id}-wall"><path d="${wall}"/></clipPath>
      <filter id="${id}-far" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".39"/><feComponentTransfer><feFuncR type="linear" slope=".62" intercept=".063"/><feFuncG type="linear" slope=".62" intercept=".063"/><feFuncB type="linear" slope=".62" intercept=".063"/></feComponentTransfer></filter>
      <filter id="${id}-near" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".69"/><feComponentTransfer><feFuncR type="linear" slope=".87" intercept=".02"/><feFuncG type="linear" slope=".87" intercept=".02"/><feFuncB type="linear" slope=".87" intercept=".02"/></feComponentTransfer></filter>
      <pattern id="${id}-soil" width="580" height="580" patternUnits="userSpaceOnUse">${image('forestSoil',0,0,580,580,'opacity=".64"')}</pattern>
      <pattern id="${id}-stone" width="384" height="256" patternUnits="userSpaceOnUse">${image('forestRock',0,0,384,256)}</pattern>
      <linearGradient id="${id}-far-fade" x2="0" y2="1"><stop stop-color="#2d4149" stop-opacity="0"/><stop offset="1" stop-color="#2d4149"/></linearGradient>
      <linearGradient id="${id}-earth" x2="0" y2="1"><stop stop-color="#716146" stop-opacity=".08"/><stop offset=".5" stop-color="#444135" stop-opacity=".25"/><stop offset="1" stop-color="#18282b"/></linearGradient>
      <linearGradient id="${id}-hill-depth" x2="0" y2="1"><stop stop-color="#343e35" stop-opacity="0"/><stop offset=".5" stop-color="#273833" stop-opacity=".16"/><stop offset="1" stop-color="#203035"/></linearGradient>
      <radialGradient id="${id}-fire-ground"><stop stop-color="#c29659" stop-opacity=".3"/><stop offset=".5" stop-color="#b17d43" stop-opacity=".13"/><stop offset="1" stop-color="#ab703d" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-fire-halo"><stop stop-color="#edb65c" stop-opacity=".3"/><stop offset=".35" stop-color="#d29748" stop-opacity=".11"/><stop offset="1" stop-color="#d29748" stop-opacity="0"/></radialGradient>
    </defs>`;
    const far=group('stage9-quiet-lower-courtyard',`<rect x="-1600" y="-900" width="4800" height="2700" fill="#2d4149"/>`+image('forestFar',-800,-155,3200,1067,`filter="url(#${id}-far)"`)+`<rect x="-800" y="-155" width="3200" height="1067" fill="#354b52" opacity=".13"/><rect x="-800" y="410" width="3200" height="600" fill="url(#${id}-far-fade)"/>`,'data-rest-backdrop="stage9-painted"');
    const slope=group('low-rock-ledge-opposite-warehouse',`<path d="${hill}" fill="#344038"/><g clip-path="url(#${id}-hill)">${image('forestRock',1050,598,850,566,`filter="url(#${id}-near)" opacity=".75"`)}<path d="M1100 730Q1180 704 1250 700T1390 667Q1530 629 1660 648" fill="none" stroke="url(#${id}-soil)" stroke-width="32"/><rect x="1030" y="610" width="700" height="340" fill="url(#${id}-hill-depth)"/></g>`);
    // A complete corridor cutout keeps its own aspect. Only the broken end
    // and last post enter the frame; their feet start buried in the earth.
    const home=group('partial-ruined-gallery',image('ritualCorridor9',-900,760-1550*486/1536,1550,1550*486/1536,`filter="url(#${id}-near)"`));
    const lowWall=group('low-gallery-wall-trace',`<g clip-path="url(#${id}-wall)">${image('forestRock',-70,440,760,507,`filter="url(#${id}-near)"`)}<path d="${wall}" fill="#25332d" opacity=".12"/></g>`);
    const well=group('dry-well-at-path-edge',image('rest9Well',1140,730-180*0.3125,180,180*0.3125,`filter="url(#${id}-near)"`));
    const ground=group('low-earth-courtyard',`<path d="${land}" fill="#4b4838"/><g clip-path="url(#${id}-land)"><rect x="-70" y="610" width="1740" height="340" fill="url(#${id}-soil)"/><path d="M106 733Q354 711 555 743T947 756Q1124 737 1289 707L1519 829Q1222 811 1006 845T536 824Q288 787 106 791Z" fill="#a18a63" opacity=".13"/><rect x="-70" y="610" width="1740" height="340" fill="url(#${id}-earth)"/></g>`);
    let props=campProps(id).replace(/^<g data-art-layer="resting-circle"[^>]*>[\s\S]*?(?=<ellipse cx="800")/,'<g data-art-layer="resting-circle">').replace(/<g data-art-layer="wayfinding-signpost"[^>]*>[\s\S]*$/,'');
    props=props.replaceAll('fill="#5c5a4b"',`fill="url(#${id}-stone)"`).replace('fill="#0c171a" opacity=".7"','fill="#0c171a" opacity=".42"');
    const light=group('fire-ground-light',glow(800,758,300,103,`${id}-fire-ground`),'data-rest-motion="fire-ground"');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-journey-art="stage9-painted" data-journey-layer="surface">${defs}${far}${slope}${lowWall}${home}${well}${ground}${light}${props}</svg>`;
    cache.set(key,svg);return svg;
  }
  function paintedRest10(){
    const a=G.HONRO_PAINTED_PILOTS,id='honro-rest10-painted',key=`rest10-painted:${a.revision}`;
    if(cache.has(key))return cache.get(key);
    const image=(name,x,y,w,h,extra='')=>`<image href="${a.images[name]}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
    const land='M-70 729Q106 709 271 718T533 725Q675 735 814 728T1090 724Q1235 711 1370 686T1660 647V950H-70Z';
    const hill='M1100 728Q1180 701 1250 697T1390 664Q1530 626 1660 645V950H1100Z';
    const defs=`<defs>
      <clipPath id="${id}-land"><path d="${land}"/></clipPath><clipPath id="${id}-hill"><path d="${hill}"/></clipPath>
      <filter id="${id}-far" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".31"/><feComponentTransfer><feFuncR type="linear" slope=".48" intercept=".049"/><feFuncG type="linear" slope=".48" intercept=".049"/><feFuncB type="linear" slope=".48" intercept=".049"/></feComponentTransfer></filter>
      <filter id="${id}-near" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".69"/><feComponentTransfer><feFuncR type="linear" slope=".87" intercept=".02"/><feFuncG type="linear" slope=".87" intercept=".02"/><feFuncB type="linear" slope=".87" intercept=".02"/></feComponentTransfer></filter>
      <pattern id="${id}-soil" width="580" height="580" patternUnits="userSpaceOnUse">${image('forestSoil',0,0,580,580,'opacity=".64"')}</pattern>
      <pattern id="${id}-stone" width="384" height="256" patternUnits="userSpaceOnUse">${image('forestRock',0,0,384,256)}</pattern>
      <linearGradient id="${id}-far-fade" x2="0" y2="1"><stop stop-color="#23343e" stop-opacity="0"/><stop offset="1" stop-color="#23343e"/></linearGradient>
      <linearGradient id="${id}-earth" x2="0" y2="1"><stop stop-color="#716146" stop-opacity=".08"/><stop offset=".5" stop-color="#444135" stop-opacity=".25"/><stop offset="1" stop-color="#18282b"/></linearGradient>
      <linearGradient id="${id}-hill-depth" x2="0" y2="1"><stop stop-color="#343e35" stop-opacity="0"/><stop offset=".5" stop-color="#273833" stop-opacity=".16"/><stop offset="1" stop-color="#203035"/></linearGradient>
      <radialGradient id="${id}-fire-ground"><stop stop-color="#c29659" stop-opacity=".3"/><stop offset=".5" stop-color="#b17d43" stop-opacity=".13"/><stop offset="1" stop-color="#ab703d" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-fire-halo"><stop stop-color="#edb65c" stop-opacity=".3"/><stop offset=".35" stop-color="#d29748" stop-opacity=".11"/><stop offset="1" stop-color="#d29748" stop-opacity="0"/></radialGradient>
    </defs>`;
    const far=group('stage10-upper-courtyard-approach',`<rect x="-1600" y="-900" width="4800" height="2700" fill="#23343e"/>`+image('forestFar',-800,-155,3200,1067,`filter="url(#${id}-far)"`)+`<rect x="-800" y="-155" width="3200" height="1067" fill="#283e49" opacity=".13"/><rect x="-800" y="410" width="3200" height="600" fill="url(#${id}-far-fade)"/>`,'data-rest-backdrop="stage10-painted"');
    const slope=group('low-rock-ledge-opposite-warehouse',`<path d="${hill}" fill="#344038"/><g clip-path="url(#${id}-hill)">${image('forestRock',1050,598,850,566,`filter="url(#${id}-near)" opacity=".75"`)}<path d="M1100 730Q1180 704 1250 700T1390 667Q1530 629 1660 648" fill="none" stroke="url(#${id}-soil)" stroke-width="32"/><rect x="1030" y="610" width="700" height="340" fill="url(#${id}-hill-depth)"/></g>`);
    // A close root/stair group and one gallery end frame the entrance. Their
    // bottom contact pixels begin below the same foreground earth contour.
    const home=group('partial-guardian-gallery',image('guardianHall10',1210,739-1350*536/1536,1350,1350*536/1536,`filter="url(#${id}-near)"`));
    const roots=group('guardian-root-stairs',image('rest10RootSteps',-75,751-740*512/1536,740,740*512/1536,`filter="url(#${id}-near)"`));
    const thread=group('distant-taut-thread',`<path d="M1210 579Q1370 557 1570 552" fill="none" stroke="#9b5753" stroke-width="1.3" opacity=".42"/>`);
    const ground=group('low-earth-courtyard',`<path d="${land}" fill="#4b4838"/><g clip-path="url(#${id}-land)"><rect x="-70" y="610" width="1740" height="340" fill="url(#${id}-soil)"/><path d="M106 733Q354 711 555 743T947 756Q1124 737 1289 707L1519 829Q1222 811 1006 845T536 824Q288 787 106 791Z" fill="#a18a63" opacity=".13"/><rect x="-70" y="610" width="1740" height="340" fill="url(#${id}-earth)"/></g>`);
    let props=campProps(id).replace(/^<g data-art-layer="resting-circle"[^>]*>[\s\S]*?(?=<ellipse cx="800")/,'<g data-art-layer="resting-circle">').replace(/<g data-art-layer="wayfinding-signpost"[^>]*>[\s\S]*$/,'');
    props=props.replaceAll('fill="#5c5a4b"',`fill="url(#${id}-stone)"`).replace('fill="#0c171a" opacity=".7"','fill="#0c171a" opacity=".42"');
    const light=group('fire-ground-light',glow(800,758,300,103,`${id}-fire-ground`),'data-rest-motion="fire-ground"');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-journey-art="stage10-painted" data-journey-layer="surface">${defs}${far}${slope}${home}${thread}${roots}${ground}${light}${props}</svg>`;
    cache.set(key,svg);return svg;
  }
  function scene(variant, layer = 'surface', stage = 0) {
    variant = variants.includes(variant) ? variant : 'forest';
    layer = variant === 'cave' || layer === 'underground' ? 'underground' : 'surface';
    const underground = layer === 'underground';
    if(stage===1&&!underground&&G.HONRO_PAINTED_PILOTS?.images?.rest1Inn)return paintedRest1();
    if(stage===2&&!underground&&G.HONRO_PAINTED_PILOTS?.images?.valleyFar)return paintedRest2();
    if(stage===3&&!underground&&G.HONRO_PAINTED_PILOTS?.images?.rest3Worktable)return paintedRest3();
    if(stage===4&&!underground&&G.HONRO_PAINTED_PILOTS?.images?.gate4)return paintedRest4();
    if(stage===5&&!underground&&G.HONRO_PAINTED_PILOTS?.images?.water5)return paintedRest5();
    if(stage===6&&!underground&&G.HONRO_PAINTED_PILOTS?.images?.bridge6)return paintedRest6();
    if(stage===7&&!underground&&G.HONRO_PAINTED_PILOTS?.images?.villageHome7)return paintedRest7();
    if(stage===8&&!underground&&G.HONRO_PAINTED_PILOTS?.images?.bierStore8)return paintedRest8();
    if(stage===9&&!underground&&G.HONRO_PAINTED_PILOTS?.images?.ritualCorridor9)return paintedRest9();
    if(stage===10&&!underground&&G.HONRO_PAINTED_PILOTS?.images?.rest10RootSteps)return paintedRest10();
    const key = `scene:${variant}:${layer}:${stage}:${!!G.HONRO_ACT1_FAR_DATA}`;
    if (cache.has(key)) return cache.get(key);
    const p = underground ? {...palettes[variant], sky:'#101f28', horizon:'#38565d', ridge:'#223d48', mist:'#83a4a5'} : palettes[variant];
    const id = `honro-journey-${variant}-${layer}`;
    const defs = `<defs>` +
      gradient(`${id}-sky`, p.sky, p.horizon) + gradient(`${id}-mountain`, p.ridge, p.horizon) +
      gradient(`${id}-ground`, p.land, '#111d22') +
      `<linearGradient id="${id}-granite" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${p.light}" stop-opacity=".7"/><stop offset="1" stop-color="${p.ridge}" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="${id}-mist" x2="0" y2="1"><stop offset="0" stop-color="${p.mist}" stop-opacity="0"/><stop offset=".6" stop-color="${p.mist}" stop-opacity=".32"/><stop offset="1" stop-color="${p.mist}" stop-opacity="0"/></linearGradient>` +
      gradient(`${id}-water`, underground ? '#45686e' : '#698582', '#2b454d') +
      `<radialGradient cx="50%" cy="50%" r="50%" id="${id}-halo"><stop offset="0" stop-color="${p.mist}" stop-opacity=".22"/><stop offset="1" stop-color="${p.mist}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient cx="50%" cy="50%" r="50%" id="${id}-fire-ground"><stop offset="0" stop-color="#c29659" stop-opacity=".3"/><stop offset=".5" stop-color="#b17d43" stop-opacity=".13"/><stop offset="1" stop-color="#ab703d" stop-opacity="0"/></radialGradient>` +
      `<radialGradient cx="50%" cy="50%" r="50%" id="${id}-fire-halo"><stop offset="0" stop-color="#edb65c" stop-opacity=".3"/><stop offset=".35" stop-color="#d29748" stop-opacity=".11"/><stop offset="1" stop-color="#d29748" stop-opacity="0"/></radialGradient></defs>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-journey-art="${variant}" data-journey-layer="${layer}">` + defs +
      (underground ? cavernBackdrop(p, id) : campaignBackdrop(stage,id)||farLandscape(p, id, variant)) + placeLandscape(variant, p, id, underground) + (stage===8&&!underground?warehouseApproach(p):'') + weather(variant, underground) + campGround(p, id) + campProps(id) + '</svg>';
    cache.set(key, svg);
    return svg;
  }

  function weather(variant, underground){
    if(underground)return group('cave-condensation',path('M613 273l-2 18m447-1-2 20m196 112-2 17','none','stroke="#b2c5bd" stroke-width="2" stroke-linecap="round" opacity=".24"'),'data-rest-motion="rain" data-rest-phase=".36"');
    if(variant!=='river')return '';
    return group('passing-fine-rain',path('M982 375l-13 42m67-103-11 37m108 27-12 42m80-97-9 32m82 27-12 39m70-125-9 27m64 69-9 32m-423 64-8 28m161-8-8 29m281-4-8 29','none','stroke="#c6cfc0" stroke-width="2" stroke-linecap="round" opacity=".22"'),'data-rest-motion="rain" data-rest-phase=".15"');
  }

  // Deterministic, presentation-only motion. Only retained transforms/opacity
  // change: no path regeneration, filters, random particles or camera parallax.
  // The same attributes can be rasterized by the Native proof harness.
  function motionFrame(kind, seconds = 0, phase = 0) {
    const t = Math.max(0, Number(seconds) || 0), s = Math.sin;
    const n = v => Number(v.toFixed(4));
    const around = (x, y, sx, sy, angle = 0) => `translate(${x} ${y}) rotate(${n(angle)}) scale(${n(sx)} ${n(sy)}) translate(${-x} ${-y})`;
    const flicker = s(t * 8.1) * .62 + s(t * 13.7 + .8) * .25 + s(t * 4.3 + 2) * .13;
    switch (kind) {
      case 'flame-outer': return {transform:around(800,758,1 + flicker * .07,1 + s(t * 7.3) * .11 + flicker * .035,s(t * 5.4) * 2.1),opacity:String(n(.93 + flicker * .06))};
      case 'flame-inner': return {transform:around(800,758,1 - flicker * .10,1 + s(t * 9.2 + .5) * .13,-s(t * 6.7) * 2.8)};
      case 'flame-core': return {transform:around(803,756,1 + s(t * 11.1) * .09,1 + s(t * 8.4 + 1) * .12),opacity:String(n(.91 + s(t * 7.8) * .08))};
      case 'fire-ground': return {transform:around(800,758,1 + flicker * .045,1 + flicker * .07),opacity:String(n(.86 + flicker * .13))};
      case 'fire-halo': return {transform:around(800,737,1 + flicker * .09,1 + flicker * .11),opacity:String(n(.88 + flicker * .11))};
      case 'ember': {const u = ((t / 2.8 + phase) % 1 + 1) % 1;return {transform:`translate(${n(s(u * 5 + phase * 8) * 9)} ${n(-u * 78)})`,opacity:String(n(s(Math.PI * u) * .72))};}
      case 'rest5-fall': return {'stroke-dashoffset':String(n(-t*110-phase*137))};
      case 'rest5-foam': return {opacity:String(n(.65+s(t*2.1)*.09))};
      case 'pine-crown': return {transform:`rotate(${n(s(t * .85 + phase) * .42)} 0 -255)`};
      case 'grass': return {transform:`translate(${n(s(t * .65 + phase) * 1.7)} ${n(s(t * .91 + phase) * .4)})`};
      case 'rain': {const u=((t/8+phase)%1+1)%1;return {transform:`translate(${n(u*12)} ${n(u*55)})`,opacity:String(n(.35+s(Math.PI*u)*.65))};}
      case 'lantern': return {transform:`rotate(${n(s(t * 1.15) * 1.4)} 273 516)`,opacity:String(n(.92 + s(t * 2.3) * .06))};
      case 'cloud': return {transform:`translate(${n(s(t * .14) * 12)} 0)`};
      case 'mist': return {transform:`translate(${n(s(t * .23) * 9)} ${n(s(t * .31) * 1.6)})`,opacity:String(n(.94 + s(t * .39) * .06))};
      case 'ripples': return {transform:`translate(${n(s(t * .8) * 4)} ${n(s(t * 1.2) * .6)})`,opacity:String(n(.25 + s(t * .9) * .045))};
      default: return {};
    }
  }

  function atlasRelief(id) {
    // Individually drawn, landscape-scale mountain systems. The empty river
    // basin belongs to the route/pin layer; this painting never knows progress.
    const wash = `url(#${id}-ridge)`, face = `url(#${id}-stone)`, ink = `url(#${id}-ink)`;
    return group('painted-mountain-systems',
      group('northwestern-folds',
        path('M-35 221C17 205 36 164 72 154Q111 148 138 119Q160 92 174 91L190 95Q201 109 204 124L224 130L253 123Q269 90 300 89L321 63 340 69Q359 110 387 113L418 106Q450 63 482 64Q491 42 504 44L522 51 524 72Q541 91 567 98L594 89Q621 69 640 87C667 112 669 146 704 157Q749 181 801 195L833 246Q706 270 654 266C582 284 531 255 450 275S296 258 223 269 63 257-35 292Z', wash) +
        path('M20 242C57 228 62 193 94 183L136 169 156 142 180 123Q193 144 217 157L254 153Q264 125 289 124L309 106 326 111Q342 151 374 158L423 144Q436 123 460 116L492 80 507 82Q521 120 552 138L592 133 620 113 638 121C659 152 647 174 690 195L737 232Q621 239 568 253L458 269 358 254 241 280 131 260 20 281Z', wash, 'opacity=".42"') +
        path('M174 91L190 95Q207 137 229 150L247 153C225 166 209 180 197 207L171 225Q172 188 164 175L176 148 166 142 138 176 107 185 80 215 58 223 76 183 119 156 138 119Z M321 63L340 69Q349 99 373 113L384 129 362 120 341 104 326 92 313 130 288 159 279 194 251 223 262 174 274 147 292 126 300 89Z M504 44L522 51Q527 90 554 114L575 121 589 147 566 143 541 125 526 102 511 88C500 128 490 151 463 169L452 202 427 218 439 177 471 136 482 98Z M620 113L638 121Q649 144 652 165L676 187 651 183 628 163 619 147 605 170 578 185 565 213 542 224 555 188 592 158Z', face) +
        path('M187 101Q200 140 192 166L180 185Q192 215 214 225L250 239C202 234 174 223 163 200L175 169Z M331 83C348 117 333 139 340 164L357 192 381 208Q348 205 329 181L312 156 322 132Z M510 68C524 107 507 146 515 173L542 207 581 224Q530 221 507 199L486 177 490 149Z M639 135C644 166 671 187 684 204L722 216 690 218 658 204 635 183 621 169Z', ink) +
        path('M37 255C109 229 152 244 203 241M247 248C314 220 367 250 412 240M429 252C505 227 569 244 606 235M587 255C649 236 710 250 769 239', 'none', 'stroke="#91a08a" stroke-width="3" stroke-opacity=".12" stroke-linecap="round"')) +
      group('northern-granite-spine',
        path('M842 253C884 235 901 206 935 202L959 180 987 183Q1005 154 1032 145L1051 108 1077 108 1093 128 1112 122 1136 83 1155 80 1173 107 1198 102 1219 69Q1219 42 1231 44L1248 39 1262 56 1264 80 1274 99 1298 117 1320 118 1339 141 1366 150 1383 134 1403 139 1422 171 1451 174 1480 201 1516 213 1530 239 1571 255 1590 285C1505 308 1451 287 1388 305S1261 281 1190 286 1071 267 993 284 893 279 842 289Z', wash) +
        path('M963 240L993 222 1014 182 1039 171 1063 134 1079 140 1082 166 1111 166 1149 112 1161 121 1170 150 1211 146 1245 84 1265 139 1301 150 1327 181 1359 191 1387 173 1403 192 1431 209 1465 233 1504 244 1557 281C1457 293 1401 283 1360 285L1260 295 1169 272 1098 288 1026 273 946 277Z', wash, 'opacity=".4"') +
        path('M1051 108L1077 108 1093 128 1080 140 1067 123 1058 151 1043 184 1018 197 1002 227 975 245 1000 205 1011 174 1032 145Z M1136 83L1155 80 1173 107 1172 126 1155 108 1146 117 1131 151 1102 184 1088 224 1067 236 1077 199 1110 154Z M1219 69L1231 44 1248 39 1262 56 1274 99 1298 117 1320 118 1339 141 1322 152 1295 137 1277 128 1252 79 1240 69 1229 111 1208 149 1201 185 1166 221 1145 230 1163 192 1185 153 1198 102Z M1383 134L1403 139 1422 171 1451 174 1480 201 1471 211 1445 193 1415 190 1393 162 1381 177 1356 212 1329 234 1348 204 1366 150Z', face) +
        path('M1248 54C1261 102 1251 129 1269 164L1300 193 1310 230 1341 256Q1284 248 1264 219L1255 185 1236 152 1240 114Z M1157 99L1172 126 1170 160 1151 186 1149 220 1127 246 1130 207 1145 171Z M1403 149L1418 176 1412 207 1440 242 1463 256 1420 247 1394 221 1390 190Z', ink) +
        path('M953 274C1028 250 1117 281 1161 268M1195 272Q1271 257 1328 275M1378 290C1444 267 1497 282 1545 278', 'none', 'stroke="#acb195" stroke-opacity=".1" stroke-width="3" stroke-linecap="round"')) +
      group('eastern-stone-escarpment',
        path('M1368 591C1402 566 1418 525 1457 509L1480 475 1477 452 1508 425 1523 389 1542 386 1566 409 1576 444 1603 458 1628 436 1652 443 1672 481 1697 496 1716 532 1737 531 1767 564 1822 582V698Q1730 667 1678 695C1633 711 1597 672 1542 688S1437 656 1371 670Z', wash) +
        path('M1508 425Q1519 385 1542 386L1566 409 1576 444 1603 458 1594 483 1567 467 1555 432 1536 408 1527 447 1505 478 1496 516 1463 551 1444 556 1465 518 1477 474 1477 452Z M1628 436L1652 443 1672 481 1697 496 1716 532 1692 523 1661 493 1641 465 1631 489 1604 516 1585 561 1558 582 1575 532 1604 491Z', face) +
        path('M1541 403C1550 445 1535 473 1550 508L1575 540 1561 588 1592 628 1539 612 1526 579 1533 549 1517 512 1518 469Z M1655 456L1672 481 1697 496 1716 532 1746 552 1757 589 1791 610 1741 599 1720 569 1686 552 1666 518Z', ink) +
        path('M1432 631Q1510 603 1599 647T1781 649', 'none', 'stroke="#8a9d8a" stroke-opacity=".11" stroke-width="3"')) +
      group('southwestern-wooded-ridges',
        path('M-25 781C18 763 24 728 55 718Q84 716 107 689L135 681 154 698 176 691Q188 652 215 646L239 626 256 633Q275 669 307 677L330 675 355 704 379 705 392 738 416 749 435 780C481 785 495 827 526 836L558 829 588 843 608 868 641 874 660 905 710 928 730 984Q639 1002 548 982T367 996 198 969 65 948L-25 944Z', wash) +
        path('M107 689L135 681 154 698 143 711 125 705 105 736 84 748 69 775 34 794 55 757 79 739Z M239 626L256 633Q263 666 282 680L307 677 330 675 355 704 348 718 318 699 290 710 267 694 250 664C239 706 219 722 209 753L180 780 153 788 178 754 195 714 215 689 215 646Z M435 780Q478 787 501 818L526 836 558 829 577 842 550 848 522 858 497 843 482 822 460 808 449 842 417 873 400 905 371 919 386 879 412 843Z M608 868L641 874 660 905 689 919 679 935 649 920 629 898 612 891 593 916 571 940 541 949 564 919Z', face) +
        path('M250 649C264 689 246 718 260 748L290 775 314 786 283 799 250 777 230 748 234 711Z M454 798C468 833 447 858 468 887L496 912 532 928 491 931 457 910 437 881 440 848Z', ink) +
        path('M25 869C117 822 201 856 272 833S379 838 424 868M221 929C291 902 344 938 391 927M448 969C524 941 622 969 689 958', 'none', 'stroke="#a4ac8b" stroke-opacity=".1" stroke-width="3" stroke-linecap="round"')) +
      group('southeastern-long-ridge',
        path('M1238 977C1295 959 1305 925 1344 916L1371 885 1392 889 1419 862 1443 857 1461 828 1487 818 1506 829 1520 860 1561 868 1583 890 1624 896 1643 918 1676 922 1710 947 1761 951 1824 981V1069H1198Z', wash) +
        path('M1461 828L1487 818 1506 829 1520 860 1561 868 1583 890 1550 892 1519 877 1494 849 1478 852 1467 881 1436 905 1424 935 1388 953 1401 925 1423 893 1443 857Z M1624 896L1643 918 1676 922 1710 947 1685 950 1654 936 1634 931 1613 919 1594 944 1568 959 1537 967 1562 942 1583 921Z', face) +
        path('M1498 839L1520 860 1531 892 1516 921 1543 947 1574 959 1525 957 1498 937 1505 909 1493 880Z', ink)) +
      // Continuous, translucent valley veils dissolve the ink into the map.
      // Large low-contrast shapes replace repeated decorative contour noise.
      group('atlas-valley-mist',
        path('M-30 222C110 205 208 254 322 237S538 230 686 218L811 239 850 283C692 261 622 296 478 275S217 288 116 267L-30 289Z', `url(#${id}-mist)`) +
        path('M831 256C958 235 1043 269 1167 253S1381 272 1519 259L1579 283C1424 296 1328 307 1208 289S1007 291 831 294Z', `url(#${id}-mist)`) +
        path('M1397 595C1495 566 1548 627 1648 607S1773 613 1829 625V687C1711 646 1648 681 1552 657S1461 661 1397 641Z', `url(#${id}-mist)`) +
        path('M-30 900C115 844 245 903 363 886S551 939 713 923L753 974C572 945 521 983 365 948S127 963-30 961Z', `url(#${id}-mist)`) +
        path('M47 302C179 279 227 305 338 294S550 308 659 293M974 315C1078 306 1119 325 1210 313M1435 700C1536 675 1644 703 1743 684M107 977C204 957 274 983 335 976', 'none', 'stroke="#aab49b" stroke-opacity=".1" stroke-width="2" stroke-linecap="round"')));
  }
  function atlasStoneStrata(id) {
    // Underground retains its chamber geography, without outdoor peak stamps.
    return group('subterranean-stone-strata',
      path('M379 147C425 130 438 105 474 100L513 84 542 91 574 75 602 88 614 106 651 111 682 143 722 154Q625 160 591 148L553 162 491 150 427 170Z M826 669L853 631 889 623 918 598 940 607 956 640 989 656 960 669 917 658 890 675Z M1326 981L1370 950 1405 946 1448 914 1482 926 1520 911 1553 933 1572 952 1628 967 1681 988 1576 1001 1519 986 1446 1003Z', `url(#${id}-ridge)`, 'opacity=".48"') +
      path('M474 100L513 84 542 91 574 75 602 88 614 106 651 111 644 123 602 117 575 97 547 112 515 102 485 121 451 126Z M889 623L918 598 940 607 956 640 938 632 920 616 906 637 879 643Z M1405 946L1448 914 1482 926 1520 911 1553 933 1572 952 1548 945 1522 929 1485 942 1450 933 1420 955Z', `url(#${id}-stone)`, 'opacity=".42"'));
  }
  function atlas(layer) {
    if(layer==='city'&&G.HonroAct3Journey)return G.HonroAct3Journey.atlas();
    layer = layers.includes(layer) ? layer : 'surface';
    const key = `atlas:${layer}`;
    if (cache.has(key)) return cache.get(key);
    const underground = layer === 'underground', id = `honro-atlas-${layer}`;
    const base = `<defs>` +
      `<linearGradient id="${id}-ridge" x2=".14" y2="1"><stop stop-color="#617366" stop-opacity=".70"/><stop offset=".48" stop-color="#455b50" stop-opacity=".65"/><stop offset="1" stop-color="#30483f" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="${id}-stone" x2=".2" y2="1"><stop stop-color="#adb095" stop-opacity=".57"/><stop offset=".52" stop-color="#91a08a" stop-opacity=".29"/><stop offset="1" stop-color="#91a08a" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="${id}-ink" x2=".2" y2="1"><stop stop-color="#142b2e" stop-opacity=".76"/><stop offset=".65" stop-color="#1b3233" stop-opacity=".63"/><stop offset="1" stop-color="#233a37" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="${id}-mist" x2="0" y2="1"><stop stop-color="#aab49b" stop-opacity="0"/><stop offset=".48" stop-color="#aab49b" stop-opacity=".10"/><stop offset="1" stop-color="#aab49b" stop-opacity="0"/></linearGradient>` +
      `${gradient(`${id}-paper`, underground ? '#15272d' : '#28382f', underground ? '#101b22' : '#172a2b')}<radialGradient cx="50%" cy="50%" r="50%" id="${id}-wash"><stop offset="0" stop-color="${underground ? '#698380' : '#b4aa7c'}" stop-opacity=".2"/><stop offset="1" stop-color="#768573" stop-opacity="0"/></radialGradient></defs>` +
      path('M0 0H1800V1050H0Z', `url(#${id}-paper)`) +
      glow(800, 500, 850, 540, `${id}-wash`) +
      path('M43 99Q365 42 685 77T1331 75L1758 104V954Q1426 1000 1147 969T523 985L41 951Z', 'none', 'stroke="#879580" stroke-opacity=".11" stroke-width="2"');
    const geography = underground ? group('subterranean-landforms',
      // Large chamber mouths are centered on the authored map anchors. Passage
      // branches describe adjacency; the host adds progress-sensitive routes.
      path('M0 0H1800V1050H0Z', '#293b3e') +
      path('M0 18L193 73 382 43 557 126 727 91 939 139 1117 71 1332 116 1516 79 1800 143V0H0Z M0 1004L188 974 332 1004 546 948 697 988 891 965 1091 1003 1264 949 1491 972 1651 934 1800 969V1050H0Z', '#4c5b54', 'opacity=".4"') +
      path('M230 200C389 221 435 374 580 400S925 294 1080 300 1216 420 1320 490 1301 657 1290 765M580 400C620 520 711 610 670 740S398 850 270 890M670 740C914 760 1054 857 1290 765', 'none', 'stroke="#829180" stroke-opacity=".2" stroke-width="132" stroke-linecap="round"') +
      path('M230 200C389 221 435 374 580 400S925 294 1080 300 1216 420 1320 490 1301 657 1290 765M580 400C620 520 711 610 670 740S398 850 270 890M670 740C914 760 1054 857 1290 765', 'none', 'stroke="#142a32" stroke-width="98" stroke-linecap="round"') +
      group('stone-gate-chamber', path('M113 131L164 99 253 108 299 147 330 192 302 257 249 286 179 268 118 230 99 172Z', '#162b33') + path('M113 131L164 99 253 108 299 147 318 178 285 155 247 127 174 119 130 150 109 190 99 172Z', '#68766b', 'opacity=".42"')) +
      group('village-chamber', path('M377 385L414 308 482 289 530 267 612 282 703 302 756 360 739 453 703 495 622 522 537 492 461 508 390 461 365 418Z', '#172e35') + path('M377 385L414 308 482 289 530 267 612 282 703 302 756 360 724 347 687 325 611 306 533 295 490 311 440 333 411 391Z', '#708071', 'opacity=".29"')) +
      group('waterworks-chamber', path('M495 702L536 634 599 616 683 623 750 654 791 717 769 796 701 832 630 844 558 812 492 770 478 738Z', '#19343d') + path('M495 702L536 634 599 616 683 623 750 654 767 687 737 678 676 649 607 640 551 655 520 703Z', '#687e73', 'opacity=".31"')) +
      group('temple-chamber', path('M909 284L947 215 1012 176 1091 183 1180 216 1230 282 1218 345 1170 384 1099 405 1010 380 934 386 894 343Z', '#172c34') + path('M909 284L947 215 1012 176 1091 183 1180 216 1230 282 1200 267 1164 241 1084 206 1018 200 968 235 943 282Z', '#778072', 'opacity=".32"')) +
      group('hoist-chamber', path('M1201 470L1237 416 1311 381 1369 403 1445 430 1479 489 1443 561 1378 589 1307 572 1242 552 1186 512Z', '#192f35')) +
      group('bell-vault', path('M1075 747L1114 673 1189 633 1261 640 1321 664 1405 661 1470 713 1503 799 1481 863 1420 918 1332 930 1262 910 1184 924 1100 870 1070 812Z', '#13282f') + path('M1075 747L1114 673 1189 633 1261 640 1321 664 1405 661 1470 713 1487 751 1453 735 1395 688 1313 691 1254 667 1199 658 1137 695 1107 750Z', '#6c796e', 'opacity=".32"')) +
      group('exit-chamber', path('M124 848L181 806 251 811 298 832 353 834 389 883 369 940 304 970 224 959 164 974 112 931 97 885Z', '#1c343b')) +
      path('M604 461C636 531 693 589 699 643S702 725 670 740 567 790 514 813 371 858 255 905 184 942 151 958', 'none', 'stroke="#628e94" stroke-width="29" stroke-opacity=".18"') +
      path('M604 461C636 531 693 589 699 643S702 725 670 740 567 790 514 813 371 858 255 905 184 942 151 958', 'none', 'stroke="#95b0a5" stroke-width="3" stroke-opacity=".24"') +
      path('M811 499L854 457 905 460 941 522 922 576 864 588 829 554Z M879 811L920 853 970 862 1007 824 986 783 938 761Z', '#627164', 'opacity=".22"') +
      path('M797 517L815 577 858 607 903 592 911 626 875 651 811 608 778 555Z M1537 344L1581 365 1626 336 1634 382 1594 400 1549 389Z', '#819080', 'opacity=".14"') +
      atlasStoneStrata(id) +
      path('M471 375H530V383H471Z M478 375V351H483V375Z M519 375V351H524V375Z M460 351Q480 357 501 331 520 353 541 349L535 359H467Z M1040 276H1131V286H1040Z M1051 277V236H1058V277Z M1115 277V236H1122V277Z M1026 236Q1053 245 1085 212 1117 239 1145 232L1135 249H1037Z', '#b5ac84', 'opacity=".28"')) :
      group('surface-geography',
        path('M-30 258C159 249 162 339 308 377S420 501 551 519 639 655 755 682 810 794 956 825 1136 880 1215 1069', 'none', 'stroke="#93b8af" stroke-opacity=".07" stroke-width="143"') +
        path('M-30 258C159 249 162 339 308 377S420 501 551 519 639 655 755 682 810 794 956 825 1136 880 1215 1069', 'none', 'stroke="#7b9c97" stroke-opacity=".37" stroke-width="35"') +
        path('M-30 258C159 249 162 339 308 377S420 501 551 519 639 655 755 682 810 794 956 825 1136 880 1215 1069', 'none', 'stroke="#c3cbb0" stroke-opacity=".19" stroke-width="3"') +
        path('M551 519C580 452 668 476 677 392S761 327 788 227M810 748C921 702 980 727 1038 663S1164 647 1214 544', 'none', 'stroke="#91b1a4" stroke-opacity=".23" stroke-width="8"') +
        atlasRelief(id) +
        path('M-30 401Q182 398 215 443T407 486M839 892Q1047 862 1088 929T1303 958M1302 352Q1457 316 1506 364T1778 365M845 97Q925 82 996 108', 'none', 'stroke="#aab49b" stroke-opacity=".09" stroke-width="2"') +
        path('M444 470L471 444 493 451 528 481 518 488 487 462 473 460 454 480Z M1208 521H1299V533H1208Z M1218 524V482H1226V524Z M1283 524V482H1291V524Z M1193 482Q1223 491 1252 457 1281 484 1313 477L1303 494H1203Z', '#d1c199', 'opacity=".3"'));
    const compass = group('map-compass', `<g transform="translate(1643 158)">` +
      `<circle r="53" fill="none" stroke="#b5ae8b" stroke-opacity=".18"/>` +
      path('M0-66L10-10 0-17-10-10Z M0 66L-10 10 0 17 10 10Z', '#b5b295', 'opacity=".6"') +
      path('M-66 0L-10-7-17 0-10 7Z M66 0L10 7 17 0 10-7Z', '#b5b295', 'opacity=".3"') +
      `<circle r="5" fill="#b5b295" opacity=".6"/></g>`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 1050" width="1800" height="1050" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-journey-atlas="${layer}">` + base + geography + compass + '</svg>';
    cache.set(key, svg);
    return svg;
  }
  // Expanded paper keeps authored places in their original world coordinates.
  // The surrounding landscape is painted, not a CSS gutter or stretched bitmap.
  const bookFrame = Object.freeze({ x: -180, y: -105, width: 2160, height: 1260 });
  function bookAtlas(layer) {
    const key = `book:${layer}`;
    if (cache.has(key)) return cache.get(key);
    let svg = atlas(layer).replace('viewBox="0 0 1800 1050"', 'viewBox="-180 -105 2160 1260"')
      .replace('width="1800" height="1050"', 'width="2160" height="1260"');
    const city = layer === 'city', underground = layer === 'underground';
    const paper = city ? 'city-paper' : `honro-atlas-${layer}-paper`;
    // Extend the existing paper gradient itself, avoiding a visible join.
    svg = svg.replace(/M0 0H1800V1050H0Z|M0 0h1800v1050H0z/g, 'M-180 -105H1980V1155H-180Z')
      .replace(/<path d="M43 99[^>]+\/>/, '');
    // Move only clipping-edge endpoints outward; authored peaks, settlements
    // and route landmarks keep their exact positions.
    if (!city && !underground) svg = svg
      .replaceAll('M-35 221', 'M-190 221').replaceAll('63 257-35 292Z', '63 257-190 292Z')
      .replaceAll('M-25 781', 'M-190 781').replaceAll('L-25 944Z', 'L-190 944Z')
      .replaceAll('1822 582V698', '1990 582V698').replaceAll('1824 981V1069', '1990 981V1165')
      .replaceAll('M-30 258', 'M-190 258').replaceAll('1215 1069', '1261 1168')
      .replaceAll('M-30 222', 'M-190 222').replaceAll('L-30 289Z', 'L-190 289Z')
      .replaceAll('M-30 900', 'M-190 900').replaceAll('963-30 961Z', '963-190 961Z');
    if (underground) svg = svg
      .replace('M0 18L193', 'M-180 18L193').replace('1800 143V0H0Z M0 1004', '1980 143V-105H-180Z M-180 1004')
      .replace('1800 969V1050H0Z', '1980 969V1155H-180Z');
    if (city) svg = svg
      .replace('M0 270l126', 'M-180 270L0 270l126').replace('v303H0z', 'h180v303H-180z')
      .replace('M0 326q274', 'M-180 326L0 326q274').replace('v244H0z', 'h180v244H-180z')
      .replace('M-30 796q231', 'M-180 796L-30 796q231').replace('v300H-30z', 'h180v410H-180z')
      .replace('M-30 813q235', 'M-180 813L-30 813q235').replace('v251H-30z', 'h180v361H-180z')
      .replace('M-25 800q227', 'M-180 800L-25 800q227').replace('162 22 357-12"', '162 22 537-12"');
    const outer = group('expanded-atlas-landscape',
      path('M-190 -48C43 12 102-83 286-59S576-10 769-69 1054-29 1265-61 1630 38 1990-31V-115H-190Z', underground ? '#526358' : '#536757', 'opacity=".23"') +
      path('M-190 1118C14 1054 119 1126 287 1102S577 1153 744 1106 1039 1165 1244 1119 1539 1161 1719 1097 1870 1131 1990 1094V1165H-190Z', underground ? '#617264' : '#657767', 'opacity=".18"') +
      path('M-163 881Q-103 852-32 873M1841 953Q1902 929 1971 952M274 1095Q404 1078 502 1102M1351-57Q1476-32 1583-51', 'none', 'stroke="#aab49b" stroke-opacity=".12" stroke-width="2"'));
    // The city sheet's original paper lives inside a named group, so place a
    // full sheet behind it as well. IDs and original paths remain unchanged.
    svg = svg.replace('</defs>', `</defs><path d="M-180 -105H1980V1155H-180Z" fill="url(#${paper})"/>`)
      .replace('</svg>', outer + '</svg>');
    cache.set(key, svg);
    return svg;
  }
  G.HonroJourneyArt = Object.freeze({
    scene, atlas, bookAtlas, bookFrame, variants, layers, motionFrame,
    anchors: Object.freeze({
      fire: Object.freeze({ x: 800, y: 745, groundY: 765 }),
      signpost: Object.freeze({ x: 1370, y: 628, groundY: 769 }),
      gathering: Object.freeze({ x: 800, y: 760, left: 480, right: 1130 }),
      scene: Object.freeze({ width: 1600, height: 900 }),
      atlas: Object.freeze({ width: 1800, height: 1050 })
    })
  });
})(globalThis);

})();
await yieldIfNeeded();
