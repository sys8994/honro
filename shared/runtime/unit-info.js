(function(G){'use strict';
const eligible=u=>u&&!u.dead&&(u.side===1||u.side===2||u.summoned);
const available=a=>a.screen==='battle'&&a.engine&&a.scene&&!a.dialogue&&!a.done&&!a.modal.classList.contains('open');
const clamp=(v,min,max)=>Math.max(min,Math.min(Math.max(min,max),v));
const S=G.HonroScene.prototype;
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
 // Nearest body wins at dense spawn points; tapping does not change the active combatant.
 return a.engine.b.units.filter(u=>eligible(u)&&(!G.HonroAct2||G.HonroAct2.visible(a.engine.b,u))).map(u=>{
  const visualHeight=G.HonroPartyPresentationHeight?.(u)??u.h,half=Math.max(u.r,u.h*.24)+padding,cy=u.y-visualHeight*.5,hh=visualHeight*.55+padding;
  return {u,d:Math.pow((w.x-u.x)/half,2)+Math.pow((w.y-cy)/hh,2)};
 }).filter(x=>x.d<=1).sort((a,b)=>a.d-b.d)[0]?.u||null;
}
function close(a){if(!a.scene)return;a.scene.inspectUnitId=null;const el=document.getElementById('unit-info');if(el)el.hidden=true;}
function hover(a,p){if(!a.scene)return;a.scene.inspectPointer=p;const u=p&&pick(a,p);a.scene.hoverUnitId=u?.id||null;a.scene.canvas.style.cursor=u?'pointer':'';}
function bind(a){
 const el=document.createElement('aside');el.id='unit-info';el.className='unit-info';el.hidden=true;el.setAttribute('aria-label','대상 정보');
  el.innerHTML='<button class="unit-info-close" type="button" aria-label="대상 정보 닫기">'+G.HonroFA.icon('xmark','',14)+'</button><div class="unit-info-side"></div><h3></h3><div class="unit-info-health" role="meter" aria-label="체력"><i></i><span></span></div><div class="unit-info-existence"></div><p class="unit-info-desc"></p><div class="unit-info-skills"></div><div class="unit-info-status"></div>';
 a.scene.canvas.parentElement.append(el);el.querySelector('button').onclick=()=>close(a);
 // Activating the card's close button must not also start a Space-key shot.
 for(const type of ['keydown','keyup'])el.addEventListener(type,e=>{if(['Space','Enter'].includes(e.code))e.stopPropagation();});
 const cv=a.scene.canvas;
 cv.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||a.contacts.size){hover(a,null);return;}const r=cv.getBoundingClientRect();hover(a,{x:e.clientX-r.left,y:e.clientY-r.top});});
 cv.addEventListener('pointerleave',()=>hover(a,null));
 cv.addEventListener('pointercancel',()=>{hover(a,null);close(a);});
}
function tap(a,p,touch){
 const u=pick(a,p,touch);if(!u){close(a);return false;}
 a.scene.inspectUnitId=u.id;tick(a);return true;
}
function tick(a){
 const scene=a.scene,el=document.getElementById('unit-info');if(!scene||!el)return;
 if(!available(a)){close(a);hover(a,null);return;}
 if(scene.inspectPointer)hover(a,scene.inspectPointer);
 const u=a.engine.unit(scene.inspectUnitId);if(!eligible(u)||G.HonroAct2&&!G.HonroAct2.visible(a.engine.b,u)){close(a);return;}
 el.hidden=false;el.dataset.unitId=u.id;el.dataset.side=u.side===1?'enemy':'ally';
 const side=u.side===1?'적군':u.summoned?'동맹군 · 소환귀':'동맹군';
 const skills=(u.loadout||[]).map(id=>G.HONRO_CORE.SKILLS[id]).filter(s=>s&&!s.passive).slice(0,2);
 const text=(selector,value)=>{const n=el.querySelector(selector);if(n.textContent!==value)n.textContent=value;};
 text('.unit-info-side',`${side}${u.honroFinalBoss?' · 최종 우두머리':u.honroMidboss?' · 중간 우두머리':u.boss?' · 우두머리':u.elite?' · 정예':''}`);
 text('h3',`${u.name} · Lv. ${u.level||1}`);
 text('.unit-info-health span',`${Math.ceil(u.hp)} / ${Math.ceil(u.maxHp)}`);
 const health=el.querySelector('.unit-info-health');health.setAttribute('aria-valuemin','0');health.setAttribute('aria-valuemax',u.maxHp);health.setAttribute('aria-valuenow',Math.ceil(u.hp));
  health.querySelector('i').style.width=clamp(u.hp/u.maxHp*100,0,100)+'%';
  const existence=el.querySelector('.unit-info-existence'),response=G.HONRO_CORE.effectiveDefenseForUnit(u),key=[u.id,response.form,response.qi,response.soul].join(':');
  if(existence.dataset.key!==key){existence.innerHTML=G.HONRO_CORE.existenceDefenseView(u);existence.dataset.key=key;}
 text('.unit-info-desc',u.intent||G.HonroWorld.archetypes[u.honroType]?.intent||(u.summoned?'소환자를 도와 동맹군 턴에 행동합니다.':u.allyRole==='civilian'?'전투에 휘말린 동행인. 안전하게 호위해야 합니다.':'함께 적을 상대하는 동행입니다.'));
 text('.unit-info-skills',skills.length?'주요 기예 · '+skills.map(s=>s.name).join(' / '):'');
 const states=G.HonroCombatStatus.effects(a.engine.b,u);
 text('.unit-info-status',states.join(' · '));
 const r=scene.canvas.getBoundingClientRect(),hud=document.querySelector('.honro-compact-hud')?.getBoundingClientRect();
 const bottom=Math.min(r.bottom,hud?.top??innerHeight)-10,top=Math.max(76,r.top+8);
 el.style.maxHeight=Math.max(90,bottom-top)+'px';
 const rect=el.getBoundingClientRect(),x=r.left+r.width/2+(u.x-scene.x)*scene.scale,y=r.top+r.height/2+(u.y-(G.HonroPartyPresentationHeight?.(u)??u.h)-scene.y)*scene.scale;
 let left=x+Math.max(18,u.r*scene.scale)+12;if(left+rect.width>innerWidth-12)left=x-rect.width-Math.max(18,u.r*scene.scale)-12;
 el.style.left=(innerWidth<=600?(innerWidth-rect.width)/2:clamp(left,12,innerWidth-rect.width-12))+'px';
 el.style.top=(innerWidth<=600?Math.max(top,bottom-rect.height):clamp(y,top,bottom-rect.height))+'px';
}
document.addEventListener('pointerdown',e=>{const a=G.HonroApp;if(!a?.scene)return;if(!e.target.closest('#unit-info,#battlecanvas'))close(a);});
G.HonroUnitInfo={bind,pick,tap,hover,close,tick};
})(globalThis);
