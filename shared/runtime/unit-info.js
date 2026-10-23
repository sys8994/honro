(function(G){'use strict';
const portraitViews=new WeakMap();
const portraitOpen=a=>portraitViews.get(a)?.open&&a.modal.classList.contains('open')&&a.modalKind==='unit-portrait';
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
function close(a){if(portraitOpen(a)){a.close();return;}if(!a.scene)return;a.scene.inspectUnitId=null;const el=document.getElementById('unit-info');if(el){el.hidden=true;G.HonroPortraits?.release(el);}const v=portraitViews.get(a);if(v)v.visible=false;}
function portraitAsset(a,u){
 if(u.summoned||u.honroVisualOnly||u.eaterCapturedBy)return null;
 const options={portraitExpression:u.portraitExpression||'base'};
 return G.HonroPortraits?.approved(u,u.cls,options)||G.HonroNPCPortraits?.resolve(a,u.name,options,u)||null;
}
function portraitClosed(a){const v=portraitViews.get(a);if(!v?.open)return;v.open=false;a.modal.classList.remove('unit-portrait-open');a.modal.removeEventListener('click',v.backdrop);G.HonroPortraits.release(v.viewer);v.viewer.remove();}
function expandPortrait(a){
 const v=portraitViews.get(a);if(!v?.asset||!available(a)||document.getElementById('unit-info')?.hidden)return;
 if(!v.viewer){
  const node=document.createElement('section');node.className='dialog unit-portrait-dialog';node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');node.setAttribute('aria-labelledby','unit-portrait-title');
  node.innerHTML='<header><h2 id="unit-portrait-title"></h2><button type="button" aria-label="초상화 확대 닫기">닫기</button></header><div class="unit-portrait-image"><canvas></canvas></div>';v.viewer=node;
  node.querySelector('button').onclick=e=>{e.stopPropagation();a.close();};
  node.addEventListener('keydown',e=>{e.stopPropagation();if(e.code==='Escape'){e.preventDefault();a.close();}else if(e.code==='Tab'){e.preventDefault();node.querySelector('button').focus();}});
  node.addEventListener('keyup',e=>e.stopPropagation());
 }
 v.backdrop??=e=>{if(e.target===a.modal){e.stopPropagation();a.close();}};a.modal.addEventListener('click',v.backdrop);
 v.open=true;a.cancelInput();a.modalKind='unit-portrait';a.modalReturnFocus=v.button;a.modal.replaceChildren(v.viewer);a.modal.classList.add('open','unit-portrait-open');
 v.viewer.querySelector('h2').textContent=v.unit.name;
 const canvas=v.viewer.querySelector('canvas'),scale=Math.min(1,1000/v.asset.height),width=Math.round(v.asset.width*scale),height=Math.round(v.asset.height*scale);
 if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;
 G.HonroPortraits.draw(canvas,v.unit,v.unit.cls,{npcAsset:v.asset,framing:'full',reopen:true});a.updateAudio();v.viewer.querySelector('button').focus({preventScroll:true});
}
function portrait(a,u,el){
 if(!G.HonroPortraits)return;const button=el.querySelector('.unit-info-portrait'),asset=portraitAsset(a,u);let v=portraitViews.get(a);
 if(!v){v={button,open:false};portraitViews.set(a,v);button.onclick=e=>{e.stopPropagation();expandPortrait(a);};}
 const key=asset?[u.id,asset.src,asset.revision,asset.expression].join('|'):'';button.hidden=!asset;el.classList.toggle('has-unit-portrait',!!asset);
 if(v.key===key&&v.visible)return;G.HonroPortraits.release(button);v.key=key;v.asset=asset;v.unit=u;v.visible=true;
 if(asset){button.setAttribute('aria-label',`${u.name} 초상화 크게 보기`);G.HonroPortraits.draw(button.querySelector('canvas'),u,u.cls,{npcAsset:asset,framing:'bust',reopen:true});}
}

function hover(a,p){if(!a.scene)return;a.scene.inspectPointer=p;const u=p&&pick(a,p);a.scene.hoverUnitId=u?.id||null;a.scene.canvas.style.cursor=u?'pointer':'';}
function bind(a){
 const previous=portraitViews.get(a);if(previous){if(previous.open)a.close();G.HonroPortraits?.release(previous.button);portraitViews.delete(a);}
 const el=document.createElement('aside');el.id='unit-info';el.className='unit-info';el.hidden=true;el.setAttribute('aria-label','대상 정보');
  el.innerHTML='<button class="unit-info-close" type="button" aria-label="대상 정보 닫기">'+G.HonroFA.icon('xmark','',14)+'</button><div class="unit-info-heading"><button class="unit-info-portrait" type="button" aria-haspopup="dialog" hidden><canvas width="120" height="144"></canvas></button><div><div class="unit-info-side"></div><h3></h3></div></div><div class="unit-info-health" role="meter" aria-label="체력"><i></i><span></span></div><div class="unit-info-progress" hidden><div class="unit-info-xp-label"></div><div class="unit-info-xp" role="progressbar" aria-label="경험치" aria-valuemin="0" aria-valuemax="100"><i></i></div><div class="unit-info-xp-detail"></div><div class="unit-info-xp-policy"></div></div><div class="unit-info-existence"></div><p class="unit-info-desc"></p><div class="unit-info-skills"></div><div class="unit-info-status"></div><p class="unit-info-reason status-reason" hidden></p>';
 a.scene.canvas.parentElement.append(el);el.querySelector('.unit-info-close').onclick=()=>close(a);
 // Activating the card's close button must not also start a Space-key shot.
 for(const type of ['keydown','keyup'])el.addEventListener(type,e=>{if(['Space','Enter'].includes(e.code))e.stopPropagation();});
 const cv=a.scene.canvas;
 cv.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||a.contacts.size){hover(a,null);return;}const r=cv.getBoundingClientRect();hover(a,{x:e.clientX-r.left,y:e.clientY-r.top});});
 cv.addEventListener('pointerleave',()=>hover(a,null));
 cv.addEventListener('pointercancel',()=>{hover(a,null);close(a);});
}
function show(a,u){
 if(portraitOpen(a))a.close();
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
 if(portraitOpen(a)){if(a.screen!=='battle'||a.dialogue||a.done){a.close();close(a);}return;}
 if(!available(a)){close(a);hover(a,null);return;}
 if(scene.inspectPointer)hover(a,scene.inspectPointer);
 const u=a.engine.unit(scene.inspectUnitId);if(!eligible(u)||G.HonroAct2&&!G.HonroAct2.visible(a.engine.b,u)){close(a);return;}
 portrait(a,u,el);
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
document.addEventListener('pointerdown',e=>{const a=G.HonroApp;if(!a?.scene)return;if(portraitOpen(a)&&a.modal.contains(e.target))return;if(!e.target.closest('#unit-info,#battlecanvas'))close(a);});
G.HonroUnitInfo={bind,pick,show,tap,hover,close,tick,description,portraitAsset,portraitClosed};
})(globalThis);
