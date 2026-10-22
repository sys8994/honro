(function(G){'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const content=id=>G.HONRO_ACT_ENDINGS[id],stamp=id=>'act-ending-v1:'+id;
const normal=app=>!app.debugMode&&!app.training&&!app.customMap&&!G.HONRO_EMBEDDED;
// Called by outcome after its exactly-once guard, for first and repeat wins.
// Keep the first argument contract for outcome/report integrations; presentation
// never owns rewards, recruitment, XP, visits or completion.
function prepare(app,b,first){if(!normal(app)||b.honroCustom||b.phase!=='won'||!content(b.honroStage))return false;app.profile.honroActEnding={stage:b.honroStage,index:0};return true;}
function pending(app){const s=app.profile.honroActEnding;return normal(app)&&s&&content(s.stage)&&app.profile.cleared[s.stage]?s:null;}
const current=app=>app.endingGallery||pending(app);
function canReplay(app,id){return normal(app)&&!!content(id)&&!!app.profile.cleared[id];}
// Journal integration: one small optional button in the selected-place text.
function replayButton(app,id){return canReplay(app,id)?`<button type="button" class="journey-ending-replay" data-action="act-ending-replay" data-id="${Number(id)}">막 엔딩 다시보기</button>`:'';}
function replay(app,id){if(app.screen!=='journey'||app.dialogue||app.modal.classList.contains('open')||app.endingGallery||!canReplay(app,id))return false;
 const book=G.HonroRestJourney.captureBook(app);if(!book)return false;
 // Deliberately memory-only. Reload/navigation drops the gallery and resumes
 // the untouched campaign save. Browser Back returns the retained journal DOM.
 const s=app.endingGallery={stage:Number(id),index:0,book};
 if(G.history?.pushState){s.historyToken='ending:'+performance.now();G.history.pushState({...G.history.state,honroEndingGallery:s.historyToken},'');s.onBack=()=>finishGallery(app);G.addEventListener('popstate',s.onBack);}
 return show(app);
}
function finishGallery(app){const s=app.endingGallery;if(!s)return false;
 delete app.endingGallery;if(s.onBack)G.removeEventListener('popstate',s.onBack);
 G.HonroRestJourney.restoreBook(app,s.book);
 if(s.historyToken&&G.history?.state?.honroEndingGallery===s.historyToken)G.history.back();
 return true;
}
// At most two orientations per ending, shared by preloading and display. No
// requests are made until outcome/show; profile and saved cut remain untouched.
const orientation=G.matchMedia?.('(orientation: portrait)'),artCache=new Map();
const source=d=>orientation?.matches&&d.portraitImage?d.portraitImage:d.image;
function loadArt(src){
 if(artCache.has(src))return artCache.get(src);
 const img=new Image();img.decoding='async';
 const record={src,img,ready:new Promise(resolve=>{img.onload=async()=>{try{await img.decode?.();}catch(_){}resolve(true);};img.onerror=()=>resolve(false);})};
 artCache.set(src,record);img.src=src;return record;
}
function preload(app,id){const d=content(id);if(!d)return;app.endingArt={id,...loadArt(source(d))};}
async function displayArt(node,d){
 const src=source(d),revision=(node.artRevision||0)+1;node.artRevision=revision;
 let record=loadArt(src),ok=await record.ready;
 if(!node.isConnected||node.artRevision!==revision)return;
 // A failed portrait may fall back to its original landscape; both failing
 // still leave readable text on the reserved, full-screen dark surface.
 if(!ok&&src!==d.image){record=loadArt(d.image);ok=await record.ready;}
 if(!node.isConnected||node.artRevision!==revision)return;
 const image=node.querySelector('img');image.hidden=!ok;
 if(ok){node.dataset.art=record.src===d.portraitImage?'portrait':'landscape';if(image.getAttribute('src')!==record.src)image.src=record.src;}
}
orientation?.addEventListener('change',()=>{const node=document.getElementById('act-ending'),d=node&&content(node.dataset.stage);if(d)displayArt(node,d);});
function show(app){const s=current(app);if(!s)return false;const gallery=!!app.endingGallery;app.close();app.cancelInput();app.dialogue=null;app.acc=0;app.screen='act-ending';app.endingInputAfter=performance.now()+350;preload(app,s.stage);
 let node=document.getElementById('act-ending');if(!node){app.root.innerHTML='<main id="act-ending" class="act-ending" tabindex="0" aria-label="막 끝 장면 · 화면 또는 Enter, Space로 계속"><img class="act-ending-art" alt=""><div class="act-ending-shade"></div><p class="act-ending-copy" aria-live="polite"></p></main>';node=document.getElementById('act-ending');
  // pointerup is the sole pointer advance. Its compatibility click is consumed;
  // keyboard/assistive clicks (detail=0) remain supported. A down must start here.
  let down=null;node.addEventListener('pointerdown',e=>{if(e.target.closest('[data-ending-return]')){down=null;return;}e.preventDefault();e.stopPropagation();if(e.isPrimary!==false)down={id:e.pointerId,at:performance.now()};});
  node.addEventListener('pointercancel',()=>{down=null;});
  node.addEventListener('pointerup',e=>{if(e.target.closest('[data-ending-return]'))return;e.preventDefault();e.stopPropagation();const valid=down?.id===e.pointerId&&down.at>=app.endingInputAfter;down=null;if(valid)next(app);});
  node.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(e.target.closest('[data-ending-return]'))finishGallery(app);else if(e.detail===0)next(app);});
  node.addEventListener('keydown',e=>{e.stopPropagation();if(e.code==='Escape'&&app.endingGallery){e.preventDefault();finishGallery(app);return;}if(e.target.closest('[data-ending-return]'))return;if(['Space','Enter'].includes(e.code)){e.preventDefault();if(!e.repeat)next(app);}});
 }
 node.dataset.mode=gallery?'gallery':'completion';if(gallery&&!node.querySelector('[data-ending-return]'))node.insertAdjacentHTML('beforeend','<button type="button" class="act-ending-return" data-ending-return>여정첩으로 돌아가기</button>');
 const d=content(s.stage),title=s.index>=d.lines.length;node.dataset.stage=s.stage;node.dataset.cut=title?'title':s.index+1;node.classList.toggle('act-ending-title',title);displayArt(node,d);
 const text=node.querySelector('p');text.innerHTML=title?`${esc(d.nextTitle)}${gallery?'<small>화면을 누르면 여정첩으로 돌아갑니다</small>':s.stage===30&&G.HONRO_CONTENT.nextAct?.available===false?'<small>다음 여정 · 준비 중</small>':''}`:esc(d.lines[s.index]);text.classList.remove('cut-fade');void text.offsetWidth;text.classList.add('cut-fade');node.focus({preventScroll:true});if(!gallery)app.persist();return true;
}
function next(app){const s=current(app);if(!s||app.screen!=='act-ending'||performance.now()<app.endingInputAfter)return false;app.endingInputAfter=performance.now()+240;const d=content(s.stage);if(s.index<d.lines.length){s.index++;show(app);return true;}
 if(app.endingGallery)return finishGallery(app);
 // Clear pending and mark seen in one profile save, before entering the rest.
 // Continuing/reloading this presentation never calls the reward/recruit path.
 app.profile.seen[stamp(s.stage)]=true;delete app.profile.honroActEnding;app.engine=null;app.done=true;app.debugRestStage=null;app.profile.honroBattle=null;if(app.profile.honroJourney)delete app.profile.honroJourney.pendingDirect;app.persist();app.showRest();return true;
}
G.HonroActEndings={prepare,pending,preload,show,next,canReplay,replayButton,replay,finishGallery};
})(globalThis);
