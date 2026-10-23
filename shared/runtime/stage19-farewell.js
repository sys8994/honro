(function(G){'use strict';
// Chapter-local roles. Profile roster, growth, equipment and turn preference stay owned by the campaign.
const active=b=>b?.honroStage===19&&!b.honroCustom&&b.mode==='campaign';
const done=b=>b.honroState?.act2?.done||{};
const marker=(b,id)=>b.honroMarkers?.find(m=>m.id===id);
function prepare(b){if(!active(b))return;const d=done(b),terminal=['won','lost'].includes(b.phase);
 for(const cls of ['archer','knight',...(d.route?['mage']:[])]){const u=b.units.find(u=>u.id==='p-'+cls);if(!u)continue;u.side=2;u.honroFarewellNPC=true;u.honroCivilian=true;u.fixed=true;u.acted=true;u.vx=u.vy=0;u.airborne=false;delete u.moveTarget;delete u.aiMove;delete u.meleeAction;delete u.meleeFollow;}
 const controlled=b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall&&!u.dead&&u.hp>0);
 if(!terminal){for(const u of controlled){u.acted=false;u.moveLeft=u.maxMove;delete u.aiMove;delete u.meleeAction;delete u.meleeFollow;u.airborne=false;}if(!controlled.some(u=>u.id===b.active))b.active=(controlled.find(u=>u.cls===(d.route?'occultist':'mage'))||controlled[0])?.id||b.active;b.side=0;b.phase='aim';b.queue=controlled.map(u=>u.id);b.projectiles=[];delete b.volley;delete b.summonTurn;delete b.reviewLeft;}
 b.honroStage19FarewellRevision=1;
}
const names=['동생의 혼','언니의 혼','이름 없는 혼'];
function spirit(b,id){if(!active(b))return null;const i=names.indexOf(id),m=i>=0?marker(b,'separate-'+(i+1)):id==='종 안의 혼'?marker(b,'old-soul'):null;if(!m)return null;return{id:i>=0?'farewell-spirit-'+(i+1):'farewell-old-spirit',name:id,side:2,h:116,r:25,hp:1,maxHp:1,x:m.x+(i>=0?38:62),y:m.y,honroVisualOnly:true};}
function actor(b,id){if(!active(b))return null;const i=/^farewell-spirit-([123])$/.exec(id);if(i)return spirit(b,names[+i[1]-1]);if(id==='farewell-old-spirit')return spirit(b,'종 안의 혼');return b.units.find(u=>u.honroFarewellNPC&&u.cls===id)||null;}
function camera(b,meta){if(!active(b))return null;const match=/^19\.beats\.(route|separate-[123]|send-[123]|old-soul):/.exec(meta.rowId||'');if(!match)return null;const key=match[1],old=key==='old-soul',site=old?'old-soul':key.startsWith('send-')?key.replace('send-','separate-'):key;return{intent:'object-introduction',targets:[{marker:site}],padding:old?95:90,maxScale:.8,speakerPolicy:'context-portrait'};}
function presentation(b,dialogue,time=0,reduced=false){if(!active(b))return[];const d=done(b),row=dialogue?.lines?.[dialogue.index]?.[2]?.rowId||'',rows=[];
 for(let i=1;i<=3;i++){const sending=row.startsWith('19.beats.send-'+i+':');if(d['send-'+i]&&!sending)continue;const m=marker(b,'separate-'+i);if(m)rows.push({id:'farewell-spirit-'+i,asset:'farewell',x:m.x+38,y:m.y,scale:[.60,.65,.57][i-1],alpha:d['separate-'+i]?.75:.34,mirror:i===2?-1:1,driftX:0,driftY:reduced?0:Math.sin(time*.75+i)*3});}
 if([1,2,3].every(i=>d['send-'+i])&&!row.startsWith('19.beats.send-')||row.startsWith('19.beats.old-soul:')){const m=marker(b,'old-soul');if(m){const phase=reduced?1:(Math.sin(time*.48)+1)*.5;for(let i=0;i<3;i++)rows.push({id:i?'farewell-old-'+i:'farewell-old-spirit',asset:'bound',x:m.x+62+i*28,y:m.y-i*11,scale:i?.52:.68,alpha:i?.26:.68,mirror:i===1?1:-1,driftX:(i?10:28)*phase,driftY:reduced?0:Math.sin(time*.6+i)*3,reachDirection:i===1?1:-1});}}
 return rows;
}
G.HonroStage19Farewell={active,prepare,done,marker,spirit,actor,camera,presentation};
})(globalThis);
