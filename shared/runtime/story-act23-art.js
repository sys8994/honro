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
 if(id===30&&!G.HonroEvidenceQuests?.active(b))rows=[at('transport-map','transport-map')];
 return rows.filter(Boolean);
}
// Closed, human-scale bundles identify an investigation without publishing its text.
// The authored marker, target radius and acquisition policy remain untouched.
const documents=new Set(['paired-records','cargo-tag','folded-plan','family-tags','investigation','amounts','family-manifest','shared-evidence','petition','approval','suppression','signed-letter','torn-record','work-log','transport-map']);
function bundle(c,x,y,kind){
 c.save();c.translate(x,y);c.fillStyle='#101b19aa';c.beginPath();c.ellipse(0,0,25,5,0,0,Math.PI*2);c.fill();
 const folded=kind==='folded-plan'||kind==='transport-map';
 c.fillStyle=folded?'#69634e':'#3c4941';c.strokeStyle='#92947a';c.lineWidth=1;
 c.beginPath();c.moveTo(-20,-3);c.lineTo(-18,-17);c.lineTo(17,-19);c.lineTo(21,-5);c.closePath();c.fill();c.stroke();
 c.strokeStyle='#b1a682';c.beginPath();c.moveTo(-17,-5);c.lineTo(18,-7);c.moveTo(-17,-8);c.lineTo(17,-10);c.stroke();
 c.strokeStyle='#716147';c.lineWidth=3;c.beginPath();c.moveTo(0,-18);c.lineTo(2,-5);c.stroke();
 c.fillStyle='#99715b';c.fillRect(-2,-15,6,5);c.restore();
}
function draw(scene,e){const b=e.b,rows=evidence(b);if(!rows.length)return;const c=scene.ctx;c.save();c.lineCap='round';for(const d of rows){const x=d.x,y=d.y-5;if(Number.isFinite(scene.viewLeft)&&x<scene.viewLeft-350||Number.isFinite(scene.viewRight)&&x>scene.viewRight+350)continue;
  if(['mourning-hammer','mourning-bowl','farewell-place'].includes(d.kind)){c.strokeStyle='#b6b09b';c.lineWidth=2;c.beginPath();c.ellipse(x,y-1,32,5,0,0,Math.PI*2);c.stroke();if(d.kind==='mourning-hammer'){c.save();c.translate(x,y);c.scale(.43,.43);c.translate(-x,-y);c.strokeStyle='#bca075';c.lineWidth=12;c.beginPath();c.moveTo(x-24,y-8);c.lineTo(x+14,y-72);c.stroke();c.fillStyle='#7e9293';c.strokeStyle='#c3cbba';c.lineWidth=2;c.beginPath();c.moveTo(x-17,y-93);c.lineTo(x+48,y-77);c.lineTo(x+41,y-48);c.lineTo(x-24,y-65);c.closePath();c.fill();c.stroke();c.restore();}if(d.kind==='mourning-bowl'){c.save();c.translate(x,y);c.scale(.35,.35);c.translate(-x,-y);c.fillStyle='#c8b17c';c.strokeStyle='#e1d6ae';c.lineWidth=2;c.beginPath();c.moveTo(x-40,y-25);c.quadraticCurveTo(x-30,y+2,x,y+1);c.quadraticCurveTo(x+31,y+1,x+40,y-25);c.closePath();c.fill();c.stroke();c.fillStyle='#5b6354';c.beginPath();c.ellipse(x,y-25,40,12,0,0,Math.PI*2);c.fill();c.stroke();c.restore();}continue;}
  if(d.kind==='transport-traces'){c.strokeStyle='#706b55';c.lineWidth=5;c.beginPath();c.moveTo(x-110,y-8);c.lineTo(x-79,y-33);c.moveTo(x-91,y-4);c.lineTo(x-63,y-29);c.stroke();c.strokeStyle='#b7b199';c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(x-107+i*9,y-12);c.lineTo(x-96+i*9,y-28);c.stroke();}c.strokeStyle='#a98f64';c.lineWidth=9;c.beginPath();c.moveTo(x+17,y-4);c.lineTo(x+43,y-32);c.moveTo(x+53,y-45);c.lineTo(x+74,y-69);c.stroke();c.strokeStyle='#d1bd83';c.lineWidth=3;c.beginPath();c.moveTo(x+40,y-30);c.lineTo(x+49,y-32);c.moveTo(x+48,y-43);c.lineTo(x+58,y-43);c.stroke();}
  if(d.kind==='released-soul'){c.save();c.globalAlpha=.42;c.fillStyle='#c0d3c2';c.beginPath();c.ellipse(x,y-65,17,28,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(x-21,y-40);c.quadraticCurveTo(x-42,y-5,x,y-8);c.quadraticCurveTo(x+35,y-12,x+21,y-40);c.fill();c.restore();continue;}
  if(d.kind==='family-tags'||d.kind==='cargo-tag'){
   // Household tools are evidence in their own right; only their open labels move into the reader.
   c.strokeStyle='#8c795a';c.lineWidth=8;c.beginPath();c.moveTo(x-84,y-1);c.lineTo(x-44,y-64);c.moveTo(x-69,y-27);c.lineTo(x-22,y-43);c.stroke();c.fillStyle='#aaa07f';c.beginPath();c.ellipse(x+64,y-13,30,10,0,0,Math.PI*2);c.fill();
  }
  if(documents.has(d.kind))bundle(c,x,y,d.kind);
 }
 c.restore();}
G.HonroAct23StoryArt={draw,evidence};
})(globalThis);
