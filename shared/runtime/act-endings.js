(function(G){'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const content=id=>G.HONRO_ACT_ENDINGS[id],stamp=id=>'act-ending-v1:'+id;
function prepare(app,b,first){if(!first||b.honroJourneyReplay||b.honroCustom||app.training||!content(b.honroStage)||app.profile.seen[stamp(b.honroStage)])return false;app.profile.honroActEnding={stage:b.honroStage,index:0};return true;}
function pending(app){const s=app.profile.honroActEnding;return s&&content(s.stage)&&app.profile.cleared[s.stage]&&!app.profile.seen[stamp(s.stage)]?s:null;}
function preload(app,id){const d=content(id);if(!d||app.endingArt?.id===id)return;const img=new Image();img.decoding='async';app.endingArt={id,img};img.src=d.image;}
function show(app){const s=pending(app);if(!s)return false;app.close();app.cancelInput();app.dialogue=null;app.acc=0;app.screen='act-ending';app.endingInputAfter=performance.now()+350;preload(app,s.stage);
 let node=document.getElementById('act-ending');if(!node){app.root.innerHTML='<main id="act-ending" class="act-ending" tabindex="0" aria-label="막 끝 장면 · 화면 또는 Enter, Space로 계속"><img class="act-ending-art" alt=""><div class="act-ending-shade"></div><p class="act-ending-copy" aria-live="polite"></p></main>';node=document.getElementById('act-ending');
  // pointerup is the sole pointer advance. Its compatibility click is consumed;
  // keyboard/assistive clicks (detail=0) remain supported. A down must start here.
  let down=null;node.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(e.isPrimary!==false)down={id:e.pointerId,at:performance.now()};});
  node.addEventListener('pointercancel',()=>{down=null;});
  node.addEventListener('pointerup',e=>{e.preventDefault();e.stopPropagation();const valid=down?.id===e.pointerId&&down.at>=app.endingInputAfter;down=null;if(valid)next(app);});
  node.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(e.detail===0)next(app);});
  node.addEventListener('keydown',e=>{e.stopPropagation();if(['Space','Enter'].includes(e.code)){e.preventDefault();if(!e.repeat)next(app);}});
 }
 const d=content(s.stage),title=s.index>=d.lines.length;node.dataset.stage=s.stage;node.dataset.cut=title?'title':s.index+1;node.classList.toggle('act-ending-title',title);const image=node.querySelector('img');if(image.getAttribute('src')!==d.image){image.src=d.image;image.onerror=()=>{image.hidden=true;};}
 const text=node.querySelector('p');text.innerHTML=title?`${esc(d.nextTitle)}${s.stage===30&&G.HONRO_CONTENT.nextAct?.available===false?'<small>다음 여정 · 준비 중</small>':''}`:esc(d.lines[s.index]);text.classList.remove('cut-fade');void text.offsetWidth;text.classList.add('cut-fade');node.focus({preventScroll:true});app.persist();return true;
}
function next(app){const s=pending(app);if(!s||app.screen!=='act-ending'||performance.now()<app.endingInputAfter)return false;app.endingInputAfter=performance.now()+240;const d=content(s.stage);if(s.index<d.lines.length){s.index++;show(app);return true;}
 // Clear pending and mark seen in one profile save, before entering the rest.
 // Continuing/reloading this presentation never calls the reward/recruit path.
 app.profile.seen[stamp(s.stage)]=true;delete app.profile.honroActEnding;app.engine=null;app.done=true;app.debugRestStage=null;app.profile.honroBattle=null;if(app.profile.honroJourney)delete app.profile.honroJourney.pendingDirect;app.persist();app.showRest();return true;
}
G.HonroActEndings={prepare,pending,preload,show,next};
})(globalThis);
