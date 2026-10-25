(function(G){'use strict';
const D=G.document;if(!D?.addEventListener||!D.createElement)return;
// Shared descriptions are resolved on demand, so recreated HUD/dialog buttons
// need no registration pass. Explicit data-tooltip/data-shortcut always win.
const actions={
 pause:['잠시 멈추고 여정과 설정을 살펴봅니다.','Escape'],close:['현재 창을 닫고 돌아갑니다.','Escape'],
 settings:['소리·화면·플레이 설정을 바꿉니다.'],fullscreen:['게임 화면을 전체화면으로 전환합니다.'],
 'retry-menu':['다시 걸을 구간을 고릅니다.'],rest:['진행 중인 전투를 남기고 휴식터로 갑니다.'],
 'training-reset':['표적과 지형을 처음 상태로 되돌리고 같은 구성으로 수련합니다.'],
 'battle-help':['현재 목표와 조작 방법을 확인합니다.'],'settings-help':['목표와 조작 방법을 확인합니다.'],
 'journey-book':['여정첩을 열어 다음 행선지를 살펴봅니다.'],camp:['모닥불에서 동행의 기예를 준비합니다.'],
 'dialogue-next':['다음 말을 듣습니다.','Space / Enter'],'dialogue-prev':['앞의 말을 다시 봅니다.'],
 'dialogue-skip':['이번 대화를 건너뜁니다.'],defend:['방어하며 기력을 회복하고 행동을 마칩니다.','F'],
 drop:['통과 가능한 발판 아래로 내려갑니다. 단단한 땅에서는 사용할 수 없습니다.','Alt'],
 'menu-cancel':['변경을 취소하고 돌아갑니다.','Escape'],'settings-back':['앞의 설정으로 돌아갑니다.','Escape'],
 'select-hero':['행동 가능한 동행을 고르고 화면을 따라갑니다.','Tab'],
 'train':['SP를 써서 이 기예의 경지를 높입니다.'],'rank-minus-detail':['이 기예의 경지를 낮추고 쓴 SP를 돌려받습니다.'],
 'talent-plus':['이 기예의 경지를 높입니다.'],'talent-minus':['이 기예의 경지를 낮추고 SP를 돌려받습니다.'],
 'talent':['이 기예의 효과와 경지를 살펴봅니다.'],'skill':['이 기예를 선택합니다.'],
 'invest-stat':['SP를 써서 기초 단련을 높입니다.'],'refund-stat':['기초 단련을 되돌리고 SP를 돌려받습니다.'],
 'auto-train':['사용 가능한 SP로 기예를 자동 수련합니다.'],'reset-talents':['이 동행의 수련을 되돌리는 확인 창을 엽니다.'],
 'equip-prompt':['갖출 기예 칸을 고릅니다.'],'equip-apply':['선택한 칸에 이 기예를 갖춥니다.'],
 'unequip-slot':['이 칸의 기예를 내려놓습니다.'],'camp-branch':['이 계통의 기예를 살펴봅니다.'],
 'journey-fit':['여정첩의 전체 경로를 봅니다.'],'journey-enter':['선택한 장소로 출발합니다.'],
 'journey-travel':['이 행선지로 이동합니다.'],'journey-select':['이 장소의 경로와 기록을 살펴봅니다.'],
 'rest-talk':['이 동행과 이야기를 나눕니다.'],training:['허공터에서 동행의 기예를 자유롭게 수련합니다.'],
 'retry-confirm':['선택한 구간을 다시 걷는 확인 창을 엽니다.'],'sound-test':['현재 음량으로 효과음을 들어봅니다.'],
 'menu-confirm':['표시된 변경을 실행합니다.'],newgame:['현재 여정과 성장·완료 기록을 지우는 확인 창을 엽니다.'],
 export:['현재 여정 기록을 파일로 내보냅니다.'],import:['기존 기록 파일을 가져오는 확인 창을 엽니다.']
};
const selector='[data-tooltip],button,[role="button"]';
let suppressFocus=false;
let owner=null,tip=null,mode='',frame=0,observer=null,lastPointer='';
const desktop=()=>G.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
function describe(el){
 const a=el.dataset.action,base=actions[a],training=el.dataset.trainingAction;
 let text=el.dataset.tooltip||base?.[0];
 if(!text&&training)text=({open:'동행·기예·경지를 바꿉니다. 전장의 현재 상태는 유지됩니다.',apply:'선택한 구성으로 돌아갑니다. 전장의 현재 상태는 유지됩니다.',rank:'이 경지의 효과를 살펴봅니다.',hero:'이 동행의 수련 기예를 고릅니다.',branch:'이 계통의 기예를 살펴봅니다.',skill:'이 기예의 효과와 경지를 살펴봅니다.',passive:'이 상시 기예의 적용을 바꿉니다.',close:'수련 설정을 닫습니다.'})[training];
 if(!text)text=el.getAttribute('aria-label')||el.textContent?.trim().replace(/\s+/g,' ');
 if(!text)return null;
 const disabled=el.disabled||el.getAttribute('aria-disabled')==='true';
 if(disabled){const why=el.dataset.disabledReason||(el.id==='drop'?'지금은 내려갈 수 있는 발판 위가 아닙니다.':el.id==='jump'?'착지와 남은 이동도가 필요합니다.':el.id==='fire'?D.getElementById('combat-action-reason')?.textContent:'');text+=' '+(why||'현재 상태에서는 사용할 수 없습니다.');}
 let shortcut=el.dataset.shortcut||base?.[1]||'';
 if(el.classList.contains('skill-button')){const buttons=[...el.parentElement.querySelectorAll('.skill-button')],i=buttons.indexOf(el);if(i>=0&&i<4)shortcut=String(i+1);}
 if(a==='hero'&&G.HonroApp?.screen==='battle')shortcut='Tab';
 return {text,shortcut};
}
function hide(suppress=false){
 if(suppress===true){suppressFocus=true;queueMicrotask(()=>{suppressFocus=false;});}
 if(frame){G.cancelAnimationFrame(frame);frame=0;}observer?.disconnect();observer=null;
 if(owner){const ids=(owner.getAttribute('aria-describedby')||'').split(/\s+/).filter(v=>v&&v!=='honro-tooltip');if(ids.length)owner.setAttribute('aria-describedby',ids.join(' '));else owner.removeAttribute('aria-describedby');}
 tip?.remove();tip=null;owner=null;mode='';
}
function valid(){if(!owner?.isConnected||!owner.getClientRects().length)return false;const modal=D.querySelector('#modal.open');return !modal||modal.contains(owner);}
function position(){
 frame=0;if(!tip)return;if(!valid()){hide();return;}
 const root=D.fullscreenElement||D.body;if(tip.parentElement!==root)root.appendChild(tip);
 const vv=G.visualViewport,left=vv?.offsetLeft||0,top=vv?.offsetTop||0,w=vv?.width||G.innerWidth,h=vv?.height||G.innerHeight,pad=10;
 const scale=Math.max(.01,tip.getBoundingClientRect().width/Math.max(1,tip.offsetWidth));
 tip.style.maxWidth=Math.max(1,Math.min(340,(w-pad*2)/scale))+'px';tip.style.maxHeight=Math.max(1,(h-pad*2)/scale)+'px';
 const a=owner.getBoundingClientRect(),r=tip.getBoundingClientRect();let x=a.left+(a.width-r.width)/2,y=a.top-r.height-10;
 if(y<top+pad)y=a.bottom+10;
 x=Math.max(left+pad,Math.min(x,left+w-r.width-pad));y=Math.max(top+pad,Math.min(y,top+h-r.height-pad));
 // Fixed containing blocks (e.g. fullscreen game root) need local coordinates.
 tip.style.left='0px';tip.style.top='0px';const origin=tip.getBoundingClientRect();
 tip.style.left=((x-origin.left)/scale)+'px';tip.style.top=((y-origin.top)/scale)+'px';
}
function schedule(){if(tip&&!frame)frame=G.requestAnimationFrame(position);}
function show(el,source){
 if(!desktop()||!el)return hide();if(owner===el&&mode===source)return;
 const description=describe(el);hide();if(!description)return;
 owner=el;mode=source;if(!valid()){hide();return;}
 tip=D.createElement('div');tip.id='honro-tooltip';tip.className='honro-tooltip';tip.setAttribute('role','tooltip');
 const text=D.createElement('span');text.textContent=description.text;tip.appendChild(text);
 if(description.shortcut){const key=D.createElement('kbd');key.textContent=description.shortcut;tip.appendChild(key);}
 (D.fullscreenElement||D.body).appendChild(tip);
 owner.setAttribute('aria-describedby',[owner.getAttribute('aria-describedby'),tip.id].filter(Boolean).join(' '));position();
 // Observe only while visible; no per-frame scans or tooltip reconstruction.
 observer=new MutationObserver(()=>{if(!valid())hide();else schedule();});observer.observe(D.body,{childList:true,subtree:true});
 const modal=D.getElementById('modal');if(modal)observer.observe(modal,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
}
D.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse'){hide();return;}const el=e.target.closest?.(selector);if(el&&!el.contains(e.relatedTarget))show(el,'pointer');});
D.addEventListener('pointerout',e=>{if(mode==='pointer'&&owner&&!owner.contains(e.relatedTarget))hide();});
D.addEventListener('pointerdown',e=>{lastPointer=e.pointerType;hide();},true);
D.addEventListener('focusin',e=>{const el=e.target.closest?.(selector);if(!suppressFocus&&(lastPointer==='keyboard'||lastPointer!=='touch'&&el?.matches(':focus-visible')))show(el,'focus');});
D.addEventListener('focusout',()=>{if(mode==='focus')hide();});
D.addEventListener('keydown',e=>{lastPointer='keyboard';if(e.key==='Escape')hide();},true);
D.addEventListener('scroll',schedule,true);D.addEventListener('fullscreenchange',hide);
G.addEventListener?.('resize',schedule);G.addEventListener?.('blur',hide);G.visualViewport?.addEventListener('resize',schedule);G.visualViewport?.addEventListener('scroll',schedule);
G.HonroTooltips={hide,describe};
})(globalThis);
