import {yieldIfNeeded} from "./load-data.0a232e94ad0af727.js";
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
