(function(G){'use strict';
const C=G.HONRO_CORE,H=G.HONRO_CONTENT;
// Font Awesome Free 6.7.2 xmark, CC BY 4.0, Copyright Fonticons, Inc.
// https://github.com/FortAwesome/Font-Awesome/blob/6.7.2/svgs/solid/xmark.svg
G.HonroFA.data.xmark={icon:[384,512,[], 'f00d', 'M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z']};
const translations=[[/용병/g,'동행'],[/스킬트리/g,'수련'],[/스킬/g,'기예'],[/궁극기/g,'비기'],[/패시브/g,'상시 기예'],[/액티브/g,'사용 기예'],[/마법사/g,'도사'],[/심령술사/g,'영매'],[/검사/g,'무사'],[/Lv\./g,'경지 '],[/MP 회복/g,'기력 회복'],[/\bHP\b/g,'체력'],[/\bMP\b/g,'기력'],[/\bSP\b/g,'수련점'],[/출전 기술/g,'갖춘 기예'],[/기술/g,'기예'],[/추천 분배/g,'고르게 익히기'],[/초기화/g,'돌려받기']];
const actionMap={'camp-branch':'branch','talent-plus':'rank-plus','talent-minus':'rank-minus','auto-train':'autotrain','choose-slot':'slot','ultimate-detail':'talent','equip-prompt':'equip'};
let portraitCache;
function portraits(){if(portraitCache)return portraitCache;portraitCache={};for(const cls of C.CLASS_IDS){const cv=document.createElement('canvas');cv.width=160;cv.height=192;const c=cv.getContext('2d'),sc=new G.HonroScene(cv);c.translate(79,181);c.scale(1.62,1.62);sc.human(c,{cls,side:0,facing:1,x:0,y:0,angle:35,h:92},H.hero[cls],false,0,0);portraitCache[cls]=cv.toDataURL('image/png');}return portraitCache;}
function localize(html,profile){const box=document.createElement('div');box.innerHTML=html;const walk=document.createTreeWalker(box,NodeFilter.SHOW_TEXT);while(walk.nextNode()){let n=walk.currentNode;for(const [a,b]of translations)n.nodeValue=n.nodeValue.replace(a,b);}
 for(const n of box.querySelectorAll('[aria-label],[title]')){for(const a of ['aria-label','title']){if(n.hasAttribute(a)){let v=n.getAttribute(a);for(const [x,y]of translations)v=v.replace(x,y);n.setAttribute(a,v);}}}
 for(const el of box.querySelectorAll('[data-action]')){if(actionMap[el.dataset.action])el.dataset.action=actionMap[el.dataset.action];if(el.dataset.talent)el.dataset.skill=el.dataset.talent;if(el.dataset.branch)el.dataset.id=el.dataset.branch;}
 // Same Arcfall geometry, less chrome: remove redundant prose, not information needed for decisions.
 for(const el of box.querySelectorAll('.micro-label,.section-caption h3>span,.section-caption>small,.ultimate-core p,.no-passives,.passive-caption>span'))el.remove();
 for(const tab of box.querySelectorAll('.hero-tab')){const cls=tab.dataset.class;const name=tab.querySelector('strong'),small=tab.querySelector('small');if(!profile.recruited.includes(cls)){tab.disabled=true;tab.setAttribute('aria-label','아직 만나지 못한 동행');name.textContent='미합류';small.textContent='';tab.querySelector('img')?.remove();tab.querySelector('.point-dot')?.remove();}}
 const nav=box.querySelector('.hero-tabs');if(nav)for(const c of ['archer','mage','knight','occultist']){const el=nav.querySelector(`[data-class=${c}]`);if(el)nav.appendChild(el);}
 return box.innerHTML;
}
function camp(profile,cls,header,branch){return localize(C.campView(profile,cls,portraits(),header,branch),profile);}
function talent(profile,id){const s=C.SKILLS[id];const text=localize(s.ultimate?C.ultimateView(profile,s.cls,''):C.talentView(profile,id,''),profile);return text.replace(/id="skill-preview"/g,'id="previewcanvas"');}
/** The original Arcfall battle-bottom geometry, localized to Honro. */
function bottom(){
 const I=G.HonroFA?.icon||((n,c,s)=>''),vitals=[['hp','체력',''],['mp','기력','mp'],['move','이동력','movement']];
 return `<footer class="battle-bottom arcfall-hud honro-compact-hud" id="battle-bottom">
 <div class="hud-roster"><div class="hero-switches" id="hero-switches"></div><div id="combat-status" class="combat-status" role="status" aria-live="polite"></div></div>
 <div class="hud-vitals">${vitals.map(([id,name,style])=>`<div class="hpmp"><span>${name}</span><div class="meter ${style}"><i id="${id}-fill"></i><label id="${id}-label"></label></div></div>`).join('')}<div class="hud-xp" aria-hidden="true"><i id="hud-xp-fill"></i></div></div>
 <div class="hud-controls-row">
 <div class="joystick" id="joystick" role="application" aria-label="좌우 이동·위아래 조준"><div class="joystick-ring"><i id="stick-knob"></i><span class="axis-h"></span><span class="axis-v"></span></div><span class="stick-value" id="move-left"></span></div>
 <div class="skill-strip" id="combat-skills"></div>
 <div class="radial-actions"><div class="shot-readout" id="read-aim"></div>
 <button class="icon-btn honro-defend" data-action="defend" aria-label="방어하며 기력 회복" title="방어">${I('shieldHalved','',18)}<span>방어</span></button>
 <button id="jump" class="fire-button jump-button" aria-label="도약"><span class="fire-inner">${I('arrowUp','',18)}<span>도약</span></span></button>
 <button id="fire" class="fire-button" aria-label="누른 채 충전, 손을 떼어 발사"><svg class="charge-dial" viewBox="0 0 100 100" aria-hidden="true"><circle class="charge-track" cx="50" cy="50" r="46"/><circle class="charge-history" cx="50" cy="50" r="37" pathLength="100"/><circle class="charge-live" cx="50" cy="50" r="46" pathLength="100"/></svg><span class="fire-inner">${I('crosshairs','',19)}<span class="fire-label">발사</span></span></button>
 </div></div></footer>`;
}
G.HonroUI={camp,talent,bottom,portraits,localize};
})(globalThis);
