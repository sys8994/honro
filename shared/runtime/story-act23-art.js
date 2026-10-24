(function(G){'use strict';
// Read-only evidence on actual authored supports. No counters, scene requests,
// actors or combat state are created by this presentation pass.
const marker=(b,id)=>b.honroMarkers?.find(m=>m.id===id),done=b=>b.honroState?.[b.honroStage<=20?'act2':'act3']?.done||{};
function evidence(b){if(b.honroCustom||b.honroNarrativeRevision!==1)return[];const id=b.honroStage,d=done(b),at=(key,kind,extra={})=>{const m=marker(b,key);return m?{key,kind,x:m.x,y:m.y,...extra}:null;};let rows=[];
 if(id===15)rows=[at('groove','transport-traces')];
 if(id===16&&(!G.HonroStage16Temple?.pilot(b)||d.hall))rows=[at('record','torn-record')];
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
 const f=b.honroState?.fieldEvidence;
 if(G.HonroEvidenceQuests?.fieldActive(b)){
  if(id===22)rows=[at('ledger-case','paired-records'),at('upper-register','paired-records')];
  if(id===25)rows=[1,2,3,4,5].map(i=>at('stake-arrival-'+i,'household-cargo',{item:i,progress:f?.events['stake-arrival-'+i]?.progress||0}));
  if(id===19&&d['send-3'])rows.push(at('old-soul','old-inscription',{progress:f?.events['old-soul']?.progress||0}));
  if(id===26){rows=[at('investigation-record','investigation')];const npc=b.units.find(u=>u.id==='act3-resident');if(npc&&!d['artisan-resident'])rows.push({key:'artisan-resident',kind:'amounts',x:npc.x+22,y:npc.y-npc.h*.4});}
 }
 const custody=f?.cargo||{};
 rows=rows.filter(r=>r&&(r.kind==='household-cargo'||!Object.values(custody).some(q=>q.source===r.key)));
 for(const [key,q]of Object.entries(custody)){if(q.phase==='dropped'){rows.push({key,kind:'carried-case',x:q.x,y:q.y,phase:q.phase});continue;}if(id===25&&q.id==='25:household-tally'&&(f.events['stake-arrival-5']?.progress||0)<1)continue;const u=b.units.find(u=>u.id===q.actor);if(!u||u.dead&&q.phase!=='dropped')continue;const p=['placing','packing'].includes(q.phase)?q.progress:q.phase==='laid'||q.phase==='dropped'?1:0;rows.push({key,kind:'carried-case',x:p?(u.x+(u.facing||1)*24)*(1-p)+q.x*p:u.x+(u.facing||1)*24,y:p?(u.y-u.h*.44)*(1-p)+q.y*p:u.y-u.h*.44,phase:q.phase});}

 return G.HonroStage19Farewell?.active(b)?rows.filter(r=>!['released-soul','old-inscription'].includes(r.kind)):rows;
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
function household(c,d){const x=d.x,y=d.y,p=d.progress||0,n=d.item;
 c.save();c.translate(x,y);c.fillStyle='#303b32';c.strokeStyle='#97896a';c.lineWidth=2;c.fillRect(-44,-26,88,25);c.strokeRect(-44,-26,88,25);
 // Identical cut marks belong to the boxes, not a giant readable label.
 c.strokeStyle='#c8b68a';for(let i=0;i<2;i++){c.beginPath();c.moveTo(-35+i*7,-18);c.lineTo(-35+i*7,-8);c.stroke();}
 c.save();c.beginPath();c.rect(-43,-70,86,70);c.clip();c.fillStyle='#a79370';c.strokeStyle='#d0c3a1';
 if(n===1||n===5){c.beginPath();c.ellipse(3,-35,22,14,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#434d3e';c.beginPath();c.ellipse(3,-43,18,5,0,0,Math.PI*2);c.fill();}
 if(n===2||n===4){c.lineWidth=5;c.beginPath();c.moveTo(-20,-20);c.lineTo(13,-60);c.stroke();c.fillStyle='#8c9b8b';c.fillRect(2,-62,27,12);}
 if(n===3){c.fillStyle='#858171';c.beginPath();c.moveTo(-28,-23);c.lineTo(-22,-48);c.lineTo(18,-43);c.lineTo(29,-23);c.closePath();c.fill();c.stroke();c.strokeStyle='#cfbe93';c.beginPath();c.moveTo(-18,-33);c.lineTo(18,-30);c.stroke();}
 c.restore();c.save();c.translate(p*54,-p*16);c.rotate(p*.35);c.fillStyle='#4e5947';c.beginPath();c.moveTo(-47,-28);c.lineTo(-40,-59);c.lineTo(39,-57);c.lineTo(47,-28);c.closePath();c.fill();c.strokeStyle='#969177';c.stroke();c.restore();c.restore();
}
function inscription(c,d){const x=d.x,y=d.y,p=d.progress||0;c.save();c.translate(x,y);c.fillStyle='#59615a';c.strokeStyle='#8a9280';c.lineWidth=2;c.beginPath();c.moveTo(-46,0);c.lineTo(-38,-35);c.lineTo(40,-32);c.lineTo(48,0);c.closePath();c.fill();c.stroke();c.strokeStyle='#cabda0';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.moveTo(-24+i*22,-25);c.lineTo(-24+i*22,-10);c.lineTo(-16+i*22,-10);c.stroke();}c.fillStyle='#354c3e';c.fillRect(-36+p*76,-31,76*(1-p),25);
 // The surviving soul wears a long crossed robe, unlike the short work coats of the recently released.
 c.globalAlpha=.45+p*.2;c.translate(75-p*18,-6);c.fillStyle='#c1cec0';c.beginPath();c.ellipse(0,-88,9,12,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(-12,-74);c.lineTo(12,-74);c.lineTo(22,-6);c.quadraticCurveTo(0,6,-25,-6);c.closePath();c.fill();c.strokeStyle='#63796d';c.beginPath();c.moveTo(-10,-72);c.lineTo(8,-54);c.lineTo(-5,-29);c.moveTo(10,-72);c.lineTo(-6,-55);c.stroke();c.strokeStyle='#c1cec0';c.lineWidth=6;c.beginPath();c.moveTo(-9,-64);c.lineTo(-15-p*22,-42-p*7);c.stroke();c.restore();}

function draw(scene,e){const b=e.b,rows=evidence(b);if(!rows.length)return;const c=scene.ctx;c.save();c.lineCap='round';for(const d of rows){const x=d.x,y=d.y-5;if(Number.isFinite(scene.viewLeft)&&x<scene.viewLeft-350||Number.isFinite(scene.viewRight)&&x>scene.viewRight+350)continue;
  if(d.kind==='household-cargo'){household(c,{...d,y});continue;}
  if(d.kind==='old-inscription'){inscription(c,{...d,y});continue;}
  if(['mourning-hammer','mourning-bowl','farewell-place'].includes(d.kind)){c.strokeStyle='#b6b09b';c.lineWidth=2;c.beginPath();c.ellipse(x,y-1,32,5,0,0,Math.PI*2);c.stroke();if(d.kind==='mourning-hammer'){c.save();c.translate(x,y);c.scale(.43,.43);c.translate(-x,-y);c.strokeStyle='#bca075';c.lineWidth=12;c.beginPath();c.moveTo(x-24,y-8);c.lineTo(x+14,y-72);c.stroke();c.fillStyle='#7e9293';c.strokeStyle='#c3cbba';c.lineWidth=2;c.beginPath();c.moveTo(x-17,y-93);c.lineTo(x+48,y-77);c.lineTo(x+41,y-48);c.lineTo(x-24,y-65);c.closePath();c.fill();c.stroke();c.restore();}if(d.kind==='mourning-bowl'){c.save();c.translate(x,y);c.scale(.35,.35);c.translate(-x,-y);c.fillStyle='#c8b17c';c.strokeStyle='#e1d6ae';c.lineWidth=2;c.beginPath();c.moveTo(x-40,y-25);c.quadraticCurveTo(x-30,y+2,x,y+1);c.quadraticCurveTo(x+31,y+1,x+40,y-25);c.closePath();c.fill();c.stroke();c.fillStyle='#5b6354';c.beginPath();c.ellipse(x,y-25,40,12,0,0,Math.PI*2);c.fill();c.stroke();c.restore();}continue;}
  if(d.kind==='transport-traces'){c.strokeStyle='#706b55';c.lineWidth=5;c.beginPath();c.moveTo(x-110,y-8);c.lineTo(x-79,y-33);c.moveTo(x-91,y-4);c.lineTo(x-63,y-29);c.stroke();c.strokeStyle='#b7b199';c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(x-107+i*9,y-12);c.lineTo(x-96+i*9,y-28);c.stroke();}c.strokeStyle='#a98f64';c.lineWidth=9;c.beginPath();c.moveTo(x+17,y-4);c.lineTo(x+43,y-32);c.moveTo(x+53,y-45);c.lineTo(x+74,y-69);c.stroke();c.strokeStyle='#d1bd83';c.lineWidth=3;c.beginPath();c.moveTo(x+40,y-30);c.lineTo(x+49,y-32);c.moveTo(x+48,y-43);c.lineTo(x+58,y-43);c.stroke();}
  if(d.kind==='released-soul'){c.save();c.globalAlpha=.42;c.fillStyle='#c0d3c2';c.beginPath();c.ellipse(x,y-65,17,28,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(x-21,y-40);c.quadraticCurveTo(x-42,y-5,x,y-8);c.quadraticCurveTo(x+35,y-12,x+21,y-40);c.fill();c.restore();continue;}
  if(d.kind==='family-tags'||d.kind==='cargo-tag'){
   // Household tools remain visible physical evidence; no world text or reader.
   c.strokeStyle='#8c795a';c.lineWidth=8;c.beginPath();c.moveTo(x-84,y-1);c.lineTo(x-44,y-64);c.moveTo(x-69,y-27);c.lineTo(x-22,y-43);c.stroke();c.fillStyle='#aaa07f';c.beginPath();c.ellipse(x+64,y-13,30,10,0,0,Math.PI*2);c.fill();
  }
  if(documents.has(d.kind)||d.kind==='carried-case')bundle(c,x,y,d.kind);
 }
 c.restore();}
G.HonroAct23StoryArt={draw,evidence};
})(globalThis);
