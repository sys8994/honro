(function(G){'use strict';
// Evidence lives on the current map and reacts to saved mission state. This is a
// bounded world pass: no geometry, actors, combat timers or progress are written.
const alive=u=>u&&!u.dead&&u.hp>0;
const actor=(b,id)=>b.units.find(u=>u.id===id)||b.units.find(u=>u.cls===id&&u.side===0&&!u.summoned);
const anchor=(b,id)=>b.honroMapAnchors?.[id];
const marker=(b,id)=>b.honroMarkers?.find(m=>m.id===id);
function time(scene,b){const s=b.honroStory?.staging;return scene.time+(s?.cue?.elapsed||s?.elapsed||0)/1000;}
function curve(c,a,z,bend,col='#b45f54',width=3){c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo((a.x+z.x)/2,(a.y+z.y)/2+bend,z.x,z.y);c.strokeStyle='#181d24dd';c.lineWidth=width+4;c.stroke();c.strokeStyle=col;c.lineWidth=width;c.stroke();}
function knot(c,p,open=0,color='#d2846c'){c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.ellipse(p.x-6-open,p.y,11,6,-.5,0,Math.PI*2);c.ellipse(p.x+6+open,p.y,11,6,.5,0,Math.PI*2);c.stroke();}
function pulse(c,a,z,bend,t,count=4){for(let i=0;i<count;i++){const p=(t*.19+i/count)%1,q=1-p,x=q*q*a.x+2*q*p*(a.x+z.x)/2+p*p*z.x,y=q*q*a.y+2*q*p*((a.y+z.y)/2+bend)+p*p*z.y;c.fillStyle='#f0d9a9';c.beginPath();c.ellipse(x,y,3.5,2.5,0,0,Math.PI*2);c.fill();}}
function ring(c,p,t,lit){c.strokeStyle=lit?'#d9bf85':'#6e7668';c.lineWidth=lit?3:2;c.beginPath();c.ellipse(p.x,p.y-5,58,15,0,0,Math.PI*2);c.stroke();if(lit){c.globalAlpha=.55+.2*Math.sin(t*2);c.beginPath();c.ellipse(p.x,p.y-5,67,20,0,0,Math.PI*2);c.stroke();c.globalAlpha=1;}}
function floorArray(c,p,t,lit){c.save();c.lineCap='round';
 c.fillStyle=lit?'#b9b98215':'#101d2644';c.beginPath();c.ellipse(p.x,p.y-4,125,30,0,0,Math.PI*2);c.fill();
 c.strokeStyle=lit?'#d6c48c':'#8c9780';c.lineWidth=lit?3:2;
 for(const [rx,ry]of [[125,30],[92,22]]){c.beginPath();c.ellipse(p.x,p.y-4,rx,ry,0,0,Math.PI*2);c.stroke();}
 for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(p.x+Math.cos(a)*92,p.y-4+Math.sin(a)*22);c.lineTo(p.x+Math.cos(a)*125,p.y-4+Math.sin(a)*30);c.stroke();}
 c.beginPath();c.moveTo(p.x-27,p.y-4);c.lineTo(p.x,p.y-13);c.lineTo(p.x+27,p.y-4);c.lineTo(p.x,p.y+5);c.closePath();c.stroke();
 if(lit){c.globalAlpha=.55+.18*Math.sin(t*2);for(const x of [-65,0,65]){c.fillStyle='#eedda4';c.beginPath();c.ellipse(p.x+x,p.y-5,3,3,0,0,Math.PI*2);c.fill();}}
 c.restore();}
function cleatDamageStage(a){
 // Share the existing durability thresholds. The fallback keeps isolated art
 // previews identical without introducing a saved state or a second rule.
 if(G.HonroObjectDamage)return G.HonroObjectDamage.stage(a);
 if(a.broken||a.indestructible||!Number.isFinite(a.hp)||a.hp>=9999||!Number.isFinite(a.maxHp)||a.maxHp<=0||a.hp>=a.maxHp)return 0;
 return a.hp/a.maxHp>2/3?1:a.hp/a.maxHp>1/3?2:3;
}
function cleat(c,a){if(a.broken)return;const x=a.x,y=a.y,w=a.w,h=a.h,level=cleatDamageStage(a);c.save();c.lineJoin='round';c.lineCap='round';
 // Always show the whole unchanged collision rectangle as a solid backing
 // plate, including behind the open ring. Damage deforms metal, not hitboxes.
 c.fillStyle=['#424c4d','#465051','#3b4548','#323e42'][level];c.fillRect(x,y,w,h);c.fillStyle='#798887';c.fillRect(x+2,y+2,w-4,5);c.fillRect(x+2,y+7,4,h-9);c.fillStyle='#202c31';c.fillRect(x+w-7,y+7,5,h-9);c.fillRect(x+6,y+h-7,w-8,5);
 for(const [xx,yy]of [[x+12,y+14],[x+w-12,y+14],[x+12,y+h-14],[x+w-12,y+h-14]]){c.fillStyle='#a9b4ad';c.beginPath();c.arc(xx,yy,4,0,Math.PI*2);c.fill();}
 const path=points=>{c.beginPath();points.forEach(([u,v],i)=>i?c.lineTo(x+w*u,y+h*v):c.moveTo(x+w*u,y+h*v));};
 if(level){
  // Broad rubbed facets remain legible at the normal camera zoom.
  path([[.15,.28],[.40,.22],[.58,.39],[.45,.52],[.20,.43]]);c.closePath();c.fillStyle='#b1b6a88c';c.fill();
  path([[.20,.43],[.45,.52],[.58,.39]]);c.strokeStyle='#17272d';c.lineWidth=5;c.stroke();
 }
 if(level>=2){path([[.42,.51],[.80,.37],[.88,.72],[.59,.88],[.37,.72]]);c.closePath();c.fillStyle='#1a2a31';c.fill();path([[.44,.53],[.80,.40],[.85,.65]]);c.strokeStyle='#c3c5af';c.lineWidth=5;c.stroke();}
 if(level>=3){path([[.56,.07],[.70,.17],[.59,.40],[.72,.62],[.59,.91],[.47,.81],[.54,.60],[.44,.34]]);c.closePath();c.fillStyle='#14232b';c.fill();path([[.68,.18],[.56,.40],[.68,.62],[.56,.87]]);c.strokeStyle='#d2c6a9';c.lineWidth=4;c.stroke();}
 const loop=()=>{
  c.beginPath();
  if(level<2)c.ellipse(x+w/2,y+h*.54,w*.33,h*.30,0,0,Math.PI*2);
  else if(level===2){c.moveTo(x+w*.52,y+h*.24);c.bezierCurveTo(x+w*.14,y+h*.25,x+w*.11,y+h*.68,x+w*.38,y+h*.82);c.bezierCurveTo(x+w*.71,y+h*.96,x+w*.88,y+h*.61,x+w*.69,y+h*.48);c.lineTo(x+w*.77,y+h*.34);c.quadraticCurveTo(x+w*.72,y+h*.23,x+w*.52,y+h*.24);}
  else{c.moveTo(x+w*.71,y+h*.35);c.bezierCurveTo(x+w*.65,y+h*.17,x+w*.23,y+h*.22,x+w*.21,y+h*.44);c.bezierCurveTo(x+w*.10,y+h*.68,x+w*.23,y+h*.84,x+w*.47,y+h*.84);c.lineTo(x+w*.72,y+h*.76);}
 };
 loop();c.strokeStyle='#18252d';c.lineWidth=14;c.stroke();c.strokeStyle=level>=2?'#bcc1b4':'#adb8b1';c.lineWidth=8;c.stroke();c.strokeStyle='#e0dcc0';c.lineWidth=2;c.stroke();
 c.fillStyle='#bac1b1';c.fillRect(x+w*.34,y+h*.18,w*.32,10);
 if(level>=3){for(const [u,v]of [[.71,.35],[.72,.76]]){c.fillStyle='#e5d6b5';c.beginPath();c.arc(x+w*u,y+h*v,4,0,Math.PI*2);c.fill();}}
 c.restore();}
function markerArt(scene,m){const b=scene.battle;if(b?.honroNarrativeRevision!==1||b.honroCustom)return false;
 // Drawing happens in the world pass, including already-collected arrays.
 if(m.type==='receiver')return true;
 if(b.honroStage===3&&m.type==='ledger'){const c=scene.ctx;c.save();c.fillStyle='#40352f';c.fillRect(m.x-28,m.y-15,56,13);c.fillStyle='#d2c8aa';c.fillRect(m.x-22,m.y-26,42,13);c.strokeStyle='#71654c';c.lineWidth=2;c.strokeRect(m.x-22,m.y-26,42,13);c.beginPath();c.moveTo(m.x-14,m.y-26);c.lineTo(m.x-14,m.y-13);c.stroke();c.restore();return true;}return false;}
function replacedLandmark(b,l){if(b?.honroNarrativeRevision!==1||b.honroCustom)return false;const kind=l.asset?.kind||l.kind;
 if(kind==='receiverStone'&&(b.honroMarkers||[]).some(m=>m.type==='receiver'&&Math.hypot(m.x-l.x,m.y-l.y)<5))return true;
 if(b.honroStage===5&&['cliffShrine','spiritKnot'].includes(kind)){const t=G.HonroQuestTargets.records(b).find(t=>t.id==='cliff-cleat');return !!t&&Math.hypot(l.x-(t.x+t.w/2),l.y-(t.y+t.h))<5;}return false;}
function evidence(b){const s=b.honroState||{},id=b.honroStage;
 if(id===3){const a=anchor(b,'ledger');if(!a)return null;return{kind:'eave',at:{x:a.x-65,y:a.y-185}};}
 if(id===4){const a=anchor(b,'gate');if(!a)return null;return{kind:'village',at:{x:a.x-120,y:a.y-178}};}
 if(id===5){const seal=G.HonroQuestTargets.records(b).find(t=>t.id==='cliff-cleat'),r=marker(b,'receiver-5');if(!seal||!r)return null;return{kind:'waterfall',at:{x:seal.x+seal.w/2,y:seal.y+seal.h*.4},broken:!!seal.broken,receiving:!!s.ritual?.active||!!seal.broken&&!!r.collected,receiver:r,seal};}
 if(id===7){return{kind:'rescue',residents:(b.honroMarkers||[]).filter(m=>m.action==='rescue').map(m=>({marker:m,unit:actor(b,m.target)}))};}
 if(id===8){const mage=actor(b,'mage'),boss=actor(b,'boss'),seals=G.HonroQuestTargets.records(b).filter(t=>t.honroSeal);return{kind:'bier',mage,boss,seals,receiving:seals.some(t=>t.broken&&mage&&Math.hypot(t.x+t.w/2-mage.x,t.y-mage.y)<600)||!!boss?.dead&&mage&&Math.hypot(boss.x-mage.x,boss.y-mage.y)<600};}
 if(id===9){const v=actor(b,'npc-sodan')||b.honroStaging?.hidden?.['npc-sodan'];if(!alive(v))return null;return{kind:'receivers',at:{x:v.x-8,y:v.y-v.h*.58},receivers:(b.honroMarkers||[]).filter(m=>m.action==='receiver')};}
 if(id===10){const binding=G.HonroQuestTargets.records(b).find(t=>t.id==='sodan-binding'),v=actor(b,'boss');if(!binding||!alive(v)||s.sodanCoop)return null;return{kind:'binding',binding,boss:v,phase:s.sodanBinding?.phase||'bound',hitCount:s.sodanBinding?.hitCount||0,receivers:(b.honroMarkers||[]).filter(m=>m.action==='receiver')};}
 return null;
}
function bindingBody(c,a,hitCount=0,t=0){if(a.broken)return;const p={x:a.x+a.w/2,y:a.y+a.h/2};
   const wobble=Math.sin(t*9)*Math.min(7,2+hitCount),ratio=Math.max(0,Math.min(1,a.hp/(a.maxHp||a.hp||1)));
   c.save();c.translate(p.x+wobble,p.y);c.strokeStyle='#d48475';c.lineWidth=4;
   for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,0,31+i*4,48-i*5,i*Math.PI/3,0,Math.PI*2);c.stroke();}
   knot(c,{x:0,y:0},Math.max(0,(1-ratio)*13));c.restore();
}
function draw(scene,e){const b=e.b;if(G.HonroStage5Waterfall?.active(b))return G.HonroStage5WaterfallArt?.evidence(scene,e);if(b.honroCustom||b.honroNarrativeRevision!==1)return;const d=evidence(b);if(!d)return;const c=scene.ctx,t=time(scene,b);c.save();c.lineCap='round';
 for(const m of b.honroMarkers||[])if(m.type==='receiver')floorArray(c,m,t,m.action==='ritual'?d.receiving:!!m.collected);
 if(d.kind==='eave'){const p=d.at,w=Math.sin(t*10)*5;curve(c,{x:p.x-90,y:p.y-10},{x:p.x+100,y:p.y-4},w);knot(c,{x:p.x,y:p.y+w/2});curve(c,{x:p.x,y:p.y},{x:p.x+5+w,y:p.y+45},4);}
 if(d.kind==='village'){const p=d.at;curve(c,{x:p.x-74,y:p.y+32},p,-8);knot(c,p);curve(c,p,{x:p.x+455,y:p.y-84},Math.sin(t*9)*7);}
 if(d.kind==='waterfall'){if(!d.seal.honroQuestTarget)cleat(c,d.seal);const p=d.at,home={x:p.x-210,y:p.y-15},side={x:p.x+320,y:p.y-70};
  // The near split knot visibly opens before intervention. Breaking only its
  // iron anchor relaxes this local line while the other line remains strained.
  const shake=d.broken?0:Math.sin(t*10)*7;
  curve(c,{x:home.x-260,y:home.y+15},home,d.broken?66:shake);
  curve(c,home,{x:p.x,y:p.y+(d.broken?72:0)},d.broken?75:shake);
  knot(c,{x:home.x,y:home.y+shake*.4},d.broken?0:9+Math.sin(t*4)*3);
  if(!d.broken){for(const q of [-1,1])curve(c,{x:home.x+q*15,y:home.y},{x:home.x+q*25,y:home.y+32},q*9,'#e1a38b',1.5);}
  curve(c,{x:p.x+22,y:p.y},side,d.broken?Math.sin(t*12)*9:12,'#a65352');
  if(d.receiving){const to={x:d.receiver.x,y:d.receiver.y-12};curve(c,{x:p.x-25,y:p.y+30},to,-90,'#ad997366',1.5);if(d.broken)pulse(c,{x:p.x-25,y:p.y+30},to,-90,t);}
 }
 if(d.kind==='rescue')for(const {marker:m,unit:u}of d.residents){if(!alive(u))continue;const p={x:u.x,y:u.y-u.h*.6};if(!m.collected){knot(c,p);curve(c,p,{x:u.x+45,y:u.y-16},4);}else{ring(c,{x:u.x+45,y:u.y},t,true);pulse(c,p,{x:u.x+45,y:u.y-16},10,t,2);}}
 if(d.kind==='bier'){
  // The attackable straps are broad cloth lashings, distinct from fine red
  // protective thread. Loose ends are attached to their actual terrain targets.
  for(const a of d.seals){const p={x:a.x+a.w/2,y:a.y+a.h*.5},z={x:p.x+90,y:p.y+(a.broken?85:8)};curve(c,{x:p.x-90,y:p.y-8},z,a.broken?45:5,'#c0a77d',8);if(!a.broken)knot(c,p,0,'#d7bd91');}
  // Damheo already carries his gourd in the shared party rig. Do not paint
  // a second, oversized hand prop (or particles aimed at that absent prop).
 }
 if(d.kind==='receivers'){for(const m of d.receivers){const to={x:m.x,y:m.y-17},loose=m.collected;curve(c,d.at,to,loose?115:Math.sin(t*12)*11,loose?'#a58363':'#b25751');if(loose)pulse(c,d.at,to,115,t,4);}knot(c,{x:d.at.x,y:d.at.y-28});}
 if(d.kind==='binding'){const a=d.binding,p={x:a.x+a.w/2,y:a.y+a.h/2},v=d.boss,hand={x:v.x-8,y:v.y-v.h*.58};
  curve(c,p,hand,24,'#a54f56');
  if(!a.broken){
   if(!a.honroQuestTarget)bindingBody(c,a,d.hitCount,t);
   if(!a.honroQuestTarget){const ratio=Math.max(0,Math.min(1,a.hp/(a.maxHp||a.hp||1)));
   c.fillStyle='#171c24';c.fillRect(p.x-56,p.y-82,112,8);c.fillStyle='#be8aaf';c.fillRect(p.x-55,p.y-81,110*ratio,6);
   c.font=`600 ${12/scene.scale}px sans-serif`;c.textAlign='center';c.fillStyle='#efd7bf';if(!scene.missionTargets?.some(t=>t.id===a.id)&&scene.goalFocus?.id!==a.id)c.fillText('바깥 주박',p.x,p.y-96);}
  }
  const offering=d.phase==='offering'||d.phase==='accepted',s=b.honroStory;
  // Gold reaches a real receiving stone during the small trial, before the
  // character accepts and before the protection mission changes her team.
  const row=s?.lines?.[s.index],trialRow=row?.[2]?.storyId?.includes('cooperation')&&!row?.[2]?.storyId?.includes('defense');
  const hasOffered=d.phase==='accepted'||offering&&trialRow&&s.lines.slice(0,s.index+1).some(l=>l[0]==='담허'&&l[1].includes('받았네'));
  for(const m of d.receivers){const to={x:m.x,y:m.y-15};curve(c,hand,to,hasOffered?100:Math.sin(t*10)*6,hasOffered?'#b29c77':'#874f55',2);if(hasOffered)pulse(c,hand,to,100,t,3);}
 }
 c.restore();}
// The fresh cleat is drawn once in the live world pass before actors, never
// cached: nonlethal HP changes and repairs must update its ring silhouette.
// Narrow fresh-only replacements; the old saved scene retains all its props.
if(G.HonroScene){const S=G.HonroScene.prototype,damage=S.objectDamage,terrain=S.terrain,landmark=S.landmark;
 const fresh=b=>b?.honroNarrativeRevision===1&&!b.honroCustom;
 S.terrain=function(c,t,...args){if(fresh(this.battle)&&this.battle.honroStage===5&&t.id==='cliff-cleat'){return;}return terrain.call(this,c,t,...args);};
 S.landmark=function(c,l,...args){if(replacedLandmark(this.battle,l))return;return landmark.call(this,c,l,...args);};
 S.objectDamage=function(c,b,...args){const replaced=t=>b.honroStage===10&&t.id==='sodan-binding'||b.honroStage===5&&t.id==='cliff-cleat';return damage.call(this,c,fresh(b)?{...b,terrain:G.HonroQuestTargets.records(b).filter(t=>!replaced(t))}:b,...args);};
}
G.HonroAct1StoryArt={draw,evidence,marker:markerArt,replacedLandmark,cleat,cleatDamageStage,floorArray,bindingBody};
})(globalThis);

