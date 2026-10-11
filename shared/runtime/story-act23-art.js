(function(G){'use strict';
// Read-only evidence on actual authored supports. No counters, scene requests,
// actors or combat state are created by this presentation pass.
const marker=(b,id)=>b.honroMarkers?.find(m=>m.id===id),done=b=>b.honroState?.[b.honroStage<=20?'act2':'act3']?.done||{};
function evidence(b){if(b.honroCustom||b.honroNarrativeRevision!==1)return[];const id=b.honroStage,d=done(b),at=(key,kind,extra={})=>{const m=marker(b,key);return m?{key,kind,x:m.x,y:m.y,...extra}:null;};let rows=[];
 if(id===15)rows=[at('groove','transport-traces')];
 if(id===16)rows=[at('record','torn-record')];
 if(id===17)rows=[at('notes','work-log')];
 if(id===19)rows=[at('separate-1','mourning-hammer'),at('separate-2','mourning-bowl'),at('separate-3','farewell-place'),...[1,2,3].filter(i=>d['separate-'+i]&&!d['send-'+i]).map(i=>at('separate-'+i,'released-soul'))];
 if(id===22)rows=[at('compare-ledgers','paired-records')];
 if(id===23)rows=[at('dispatch-bundle','cargo-tag')];
 if(id===24)rows=[at('land-register','folded-plan')];
 if(id===25)rows=[at('household-tally','family-tags')];
 if(id===26)rows=[at('investigation-record','investigation'),at('casting-tally','amounts')];
 if(id===27)rows=[at('family-manifest','family-manifest')];
 if(id===28&&d['party-reunion'])rows=[at('party-reunion','shared-evidence'),...(d['petition-record']?[at('petition-record','petition')]:[]),...(d['closure-order']?[at('closure-order','approval')]:[]),...(d['suppression-order']?[at('suppression-order','suppression')]:[])];
 if(id===29&&d['old-seal'])rows=[at('hyeonmuk-letter','signed-letter')];
 if(id===30)rows=[at('transport-map','transport-map')];
 return rows.filter(Boolean);
}
function label(c,text,x,y,size=15){c.font=`500 ${size}px "Noto Serif KR",serif`;c.textAlign='center';c.fillStyle='#252d2b';c.fillText(text,x,y);}
function paper(c,x,y,w=150,h=100,torn=false){c.fillStyle='#bbb49b';c.strokeStyle='#565d52';c.lineWidth=2;c.beginPath();c.moveTo(x-w/2,y);c.lineTo(x-w/2+5,y-h);c.lineTo(x+w/2,y-h+4);if(torn){for(let i=0;i<5;i++)c.lineTo(x+w/2+(i%2?-9:0),y-h+12+i*(h-15)/5);}else c.lineTo(x+w/2-3,y);c.closePath();c.fill();c.stroke();}
function seal(c,x,y,size=16,color='#8c5145'){c.strokeStyle=color;c.lineWidth=2;c.strokeRect(x-size/2,y-size/2,size,size);c.beginPath();c.moveTo(x-4,y-5);c.lineTo(x+4,y+5);c.moveTo(x-4,y+5);c.lineTo(x+4,y-5);c.stroke();}
function crest(c,x,y,crossed=false){c.strokeStyle='#865749';c.lineWidth=2;c.beginPath();c.moveTo(x,y-13);c.lineTo(x+13,y);c.lineTo(x,y+13);c.lineTo(x-13,y);c.closePath();c.moveTo(x-4,y-7);c.lineTo(x-4,y+7);c.moveTo(x+4,y-7);c.lineTo(x+4,y+7);c.stroke();if(crossed){c.strokeStyle='#303b39';c.lineWidth=4;c.beginPath();c.moveTo(x-16,y+12);c.lineTo(x+16,y-12);c.stroke();}}
function arrow(c,x1,y1,x2,y2,color='#4b6863'){c.strokeStyle=color;c.fillStyle=color;c.lineWidth=3;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();const a=Math.atan2(y2-y1,x2-x1);c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-9*Math.cos(a-.4),y2-9*Math.sin(a-.4));c.lineTo(x2-9*Math.cos(a+.4),y2-9*Math.sin(a+.4));c.closePath();c.fill();}
function tag(c,x,y){paper(c,x,y,44,60);c.strokeStyle='#766149';c.lineWidth=3;c.beginPath();c.moveTo(x,y-60);c.quadraticCurveTo(x-24,y-90,x+20,y-86);c.stroke();for(let i=0;i<3;i++){c.beginPath();c.moveTo(x-9,y-42+i*11);c.lineTo(x+10,y-42+i*11);c.stroke();}}
function amounts(c,x,y){paper(c,x,y,225,120);label(c,'수거 / 주조',x,y-94);c.fillStyle='#68684e';c.fillRect(x-82,y-76,156,12);c.fillRect(x-82,y-51,150,12);label(c,'거의 같은 양',x,y-15,14);}
function map(c,x,y,transport=false){paper(c,x,y,300,172);c.strokeStyle='#878973';c.lineWidth=1;c.beginPath();c.moveTo(x-50,y-165);c.lineTo(x-50,y-4);c.moveTo(x+50,y-165);c.lineTo(x+50,y-4);c.stroke();
 if(transport){label(c,'저문골',x-95,y-128);label(c,'무명사',x,y-80);label(c,'잠운사',x+97,y-128);arrow(c,x-76,y-119,x-19,y-89);arrow(c,x+20,y-90,x+78,y-120);label(c,'시신·금속',x-74,y-68,12);label(c,'묵종',x+86,y-68,12);c.setLineDash([5,5]);arrow(c,x,y-60,x-20,y-25,'#8a584b');c.setLineDash([]);label(c,'옛길 봉쇄',x+44,y-19,12);
 }else{label(c,'묘역 기록실',x-65,y-121);label(c,'공방',x+82,y-121);label(c,'물길',x-69,y-40);label(c,'뒤뜰',x+83,y-40);arrow(c,x-60,y-107,x-60,y-55);arrow(c,x+80,y-107,x+80,y-55);arrow(c,x-28,y-40,x+52,y-40);}}
function draw(scene,e){const b=e.b,rows=evidence(b);if(!rows.length)return;const c=scene.ctx;c.save();c.lineCap='round';for(const d of rows){const x=d.x,y=d.y-5;if(Number.isFinite(scene.viewLeft)&&x<scene.viewLeft-350||Number.isFinite(scene.viewRight)&&x>scene.viewRight+350)continue;
  if(['mourning-hammer','mourning-bowl','farewell-place'].includes(d.kind)){c.strokeStyle='#b6b09b';c.lineWidth=2;c.beginPath();c.ellipse(x,y-1,32,5,0,0,Math.PI*2);c.stroke();if(d.kind==='mourning-hammer'){c.save();c.translate(x,y);c.scale(.43,.43);c.translate(-x,-y);c.strokeStyle='#bca075';c.lineWidth=12;c.beginPath();c.moveTo(x-24,y-8);c.lineTo(x+14,y-72);c.stroke();c.fillStyle='#7e9293';c.strokeStyle='#c3cbba';c.lineWidth=2;c.beginPath();c.moveTo(x-17,y-93);c.lineTo(x+48,y-77);c.lineTo(x+41,y-48);c.lineTo(x-24,y-65);c.closePath();c.fill();c.stroke();c.restore();}if(d.kind==='mourning-bowl'){c.save();c.translate(x,y);c.scale(.35,.35);c.translate(-x,-y);c.fillStyle='#c8b17c';c.strokeStyle='#e1d6ae';c.lineWidth=2;c.beginPath();c.moveTo(x-40,y-25);c.quadraticCurveTo(x-30,y+2,x,y+1);c.quadraticCurveTo(x+31,y+1,x+40,y-25);c.closePath();c.fill();c.stroke();c.fillStyle='#5b6354';c.beginPath();c.ellipse(x,y-25,40,12,0,0,Math.PI*2);c.fill();c.stroke();c.restore();}continue;}
  if(d.kind==='transport-traces'){c.strokeStyle='#706b55';c.lineWidth=5;c.beginPath();c.moveTo(x-110,y-8);c.lineTo(x-79,y-33);c.moveTo(x-91,y-4);c.lineTo(x-63,y-29);c.stroke();c.strokeStyle='#b7b199';c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(x-107+i*9,y-12);c.lineTo(x-96+i*9,y-28);c.stroke();}c.strokeStyle='#a98f64';c.lineWidth=9;c.beginPath();c.moveTo(x+17,y-4);c.lineTo(x+43,y-32);c.moveTo(x+53,y-45);c.lineTo(x+74,y-69);c.stroke();c.strokeStyle='#d1bd83';c.lineWidth=3;c.beginPath();c.moveTo(x+40,y-30);c.lineTo(x+49,y-32);c.moveTo(x+48,y-43);c.lineTo(x+58,y-43);c.stroke();}
  if(d.kind==='released-soul'){c.save();c.globalAlpha=.42;c.fillStyle='#c0d3c2';c.beginPath();c.ellipse(x,y-65,17,28,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(x-21,y-40);c.quadraticCurveTo(x-42,y-5,x,y-8);c.quadraticCurveTo(x+35,y-12,x+21,y-40);c.fill();c.restore();continue;}
  if(d.kind==='paired-records'){paper(c,x-92,y,150,105);paper(c,x+80,y,150,105);label(c,'사건 보고',x-92,y-77);label(c,'제압 중 사망',x-92,y-47,13);label(c,'같은 해 호적',x+80,y-77);label(c,'농가 · 아이 · 노인',x+80,y-47,12);seal(c,x-63,y-21,15);seal(c,x+108,y-21,15);}
  if(d.kind==='folded-plan'){map(c,x,y);crest(c,x,y-80);}
  if(d.kind==='transport-map')map(c,x,y,true);
  if(d.kind==='amounts')amounts(c,x,y);
  if(d.kind==='family-tags'||d.kind==='cargo-tag'){c.strokeStyle='#8c795a';c.lineWidth=8;c.beginPath();c.moveTo(x-84,y-1);c.lineTo(x-44,y-64);c.moveTo(x-69,y-27);c.lineTo(x-22,y-43);c.stroke();c.fillStyle='#aaa07f';c.beginPath();c.ellipse(x+64,y-13,30,10,0,0,Math.PI*2);c.fill();tag(c,x+8,y-4);tag(c,x+68,y-34);if(d.kind==='cargo-tag'){paper(c,x,y-89,215,67);label(c,'저문골 → 무명사',x,y-126,14);label(c,'시신 · 생활 금속',x,y-104,13);crest(c,x+124,y-111);}}
  if(d.kind==='family-manifest'){paper(c,x,y,268,140);label(c,'이름 / 가족 번호 / 물품',x,y-109,15);c.strokeStyle='#77785e';c.lineWidth=1;c.beginPath();c.moveTo(x-48,y-88);c.lineTo(x-48,y-15);c.moveTo(x+42,y-88);c.lineTo(x+42,y-15);c.stroke();for(let i=0;i<3;i++){c.strokeStyle=i===1?'#8f6746':'#8b8b71';c.lineWidth=i===1?5:2;c.beginPath();c.moveTo(x-111,y-72+i*23);c.lineTo(x+107,y-72+i*23);c.stroke();}tag(c,x+141,y-9);}
  if(['petition','approval','suppression'].includes(d.kind)){paper(c,x,y,232,125);label(c,{'petition':'조사 청원','approval':'폐쇄·제압 승인','suppression':'학살 보고 뒤'}[d.kind],x,y-91,17);label(c,{'petition':'작위 박탈 · 추방','approval':'고위 관리 결재','suppression':'조사 차단'}[d.kind],x,y-59,15);if(d.kind==='petition')crest(c,x+73,y-22,true);else seal(c,x+73,y-22,21,d.kind==='approval'?'#8c5145':'#475b60');}
  if(d.kind==='shared-evidence'){paper(c,x-70,y,140,90);tag(c,x-109,y-3);amounts(c,x+105,y-7);label(c,'이름 · 가족 번호',x-63,y-60,12);c.strokeStyle='#79684c';c.lineWidth=4;c.beginPath();c.moveTo(x-133,y-17);c.quadraticCurveTo(x+7,y+16,x+202,y-22);c.stroke();}
  if(['signed-letter','torn-record','work-log','investigation'].includes(d.kind)){paper(c,x,y,180,118,d.kind==='torn-record');label(c,{'signed-letter':'현묵','torn-record':'대종 이송','work-log':'종지기 작업일지','investigation':'현장 조사'}[d.kind],x,y-85,16);for(const dy of[62,46]){c.strokeStyle='#6c705d';c.lineWidth=3;c.beginPath();c.moveTo(x-56,y-dy);c.lineTo(x+44,y-dy+2);c.stroke();}seal(c,x+51,y-22,20);if(d.kind==='torn-record')label(c,'출처 [잘려 나감]',x-13,y-15,12);}
 }
 c.restore();}
G.HonroAct23StoryArt={draw,evidence};
})(globalThis);
