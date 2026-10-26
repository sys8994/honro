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
function spirit(b,id){if(!active(b))return null;const i=names.indexOf(id),m=i>=0?marker(b,'separate-'+(i+1)):id==='종 안의 혼'?marker(b,'old-soul'):null;if(!m)return null;return{id:i>=0?'farewell-spirit-'+(i+1):'farewell-old-spirit',name:G.HonroAct23V4?.active(b)?'19.soul.'+(i>=0?i+1:'transport'):id,side:2,h:116,r:25,hp:1,maxHp:1,x:m.x+(i>=0?38:62),y:m.y,honroVisualOnly:true};}
function actor(b,id){if(!active(b))return null;const i=/^farewell-spirit-([123])$/.exec(id);if(i)return spirit(b,names[+i[1]-1]);if(id==='farewell-old-spirit')return spirit(b,'종 안의 혼');return b.units.find(u=>u.honroFarewellNPC&&u.cls===id)||null;}
function camera(b,meta){if(!active(b))return null;const match=/^19\.beats\.(route|separate-[123]|send-[123]|old-soul):/.exec(meta.rowId||'');if(!match)return null;const key=match[1],old=key==='old-soul',site=old?'old-soul':key.startsWith('send-')?key.replace('send-','separate-'):key;return{intent:'object-introduction',targets:[{marker:site}],padding:old?95:90,maxScale:.8,speakerPolicy:'context-portrait'};}
// This one landscape scene needs its real silhouettes, not a padded marker point.
// Portraits and every other story camera retain the common framing verbatim.
function landscapeFrame(scene,e,frame){const b=e.b,{camera,app}=frame,{w,h}=scene.size();if(!active(b)||w<=h||!/^19\.beats\.old-soul:/.test(camera.id||''))return null;
 const m=marker(b,'old-soul'),u=b.units.find(u=>u.id==='p-occultist');if(!m||!u)return null;
 // Continue can carry a return snapshot from another Scene. Keep its view,
 // but bind that stale owner to this Scene once; later live user intent still wins.
 scene.farewellOldLandscape=true;
 const owner=G.HonroAttackCamera?.snapshot(scene);if(app.storyCamera&&owner&&app.storyCamera.cameraToken!==owner.cameraToken)Object.assign(app.storyCamera,{cameraToken:owner.cameraToken,cameraIntent:owner.cameraIntent});
 if(frame.farewellLayout!==frame.layout){const cv=scene.canvas.getBoundingClientRect(),rect=selector=>G.document.querySelector(selector)?.getBoundingClientRect?.(),header=rect('.battle-info'),button=rect('.battle-head>button'),mini=rect('.minimap-dock'),panel=rect('#dialogue-root .story-scene,#dialogue-root .story-guide');
  const top=Math.max(14,...[header,button].filter(r=>r?.height).map(r=>r.bottom-cv.top+10)),bottom=Math.min(h-12,panel?.height?panel.top-cv.top-12:h-12),half=Math.max(80,Math.min(w/2-24,mini?.width?mini.left-cv.left-w/2-12:w/2-24));
  frame.farewellRect={x:w/2-half,y:top,w:half*2,h:Math.max(30,bottom-top)};frame.farewellLayout=frame.layout;
 }
 const height=G.HonroPartyPresentationHeight?.(u)||u.h,boxes=[{id:u.id,x:u.x-30,y:u.y-height-18,w:60,h:height+28},{id:'bell-base',x:m.x-55,y:m.y-42,w:108,h:42},{id:'opened-path',x:m.x-170,y:m.y-45,w:115,h:60}];
 for(const row of presentation(b,app.dialogue,0,true).filter(r=>r.asset==='bound')){const points=[],cos=Math.cos(row.rotation),sin=Math.sin(row.rotation);for(const x of [-65,90])for(const y of [-195,15]){const px=x*row.scale*row.mirror,py=y*row.scale;for(const drift of [0,row.id==='farewell-old-spirit'?28:10])points.push({x:row.x+cos*px-sin*py+drift,y:row.y+sin*px+cos*py});}const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y))-3;boxes.push({id:row.id,x,y,w:Math.max(...points.map(p=>p.x))-x,h:Math.max(...points.map(p=>p.y))-y+3});}
 const pad=6,x=Math.min(...boxes.map(p=>p.x))-pad,y=Math.min(...boxes.map(p=>p.y))-pad,right=Math.max(...boxes.map(p=>p.x+p.w))+pad,bottom=Math.max(...boxes.map(p=>p.y+p.h))+pad,rect=frame.farewellRect,scale=Math.min(.78,rect.w/(right-x),rect.h/(bottom-y));
 return{id:camera.id,intent:camera.intent,targets:camera.targets,missing:[],fallback:null,boxes,rect,boundary:{overscanX:false,overscanY:false},camera:{x:(x+right)/2-(rect.x+rect.w/2-w/2)/scale,y:(y+bottom)/2-(rect.y+rect.h/2-h/2)/scale,scale},chapter19Landscape:true};
}
// A chapter-end reader can open during the release tween. Keep its destination,
// rather than recapturing the temporary old-soul shot as the player's view.
function returnCamera(app){const scene=app.scene,t=scene?.storyTween;if(!active(app.engine?.b)||!scene.farewellOldLandscape||t?.kind!=='static')return null;const owner=G.HonroAttackCamera?.snapshot(scene);return{...t.to,manual:t.manual,cameraToken:owner?.cameraToken,cameraIntent:owner?.cameraIntent};}
function presentation(b,dialogue,time=0,reduced=false){if(!active(b))return[];const d=done(b),row=dialogue?.lines?.[dialogue.index]?.[2]?.rowId||'',rows=[];
 for(let i=1;i<=3;i++){const sending=row.startsWith('19.beats.send-'+i+':');if(d['send-'+i]&&!sending)continue;const m=marker(b,'separate-'+i);if(m)rows.push({id:'farewell-spirit-'+i,asset:'farewell',x:m.x+38,y:m.y,scale:[.60,.65,.57][i-1],alpha:d['separate-'+i]?.75:.34,mirror:i===2?-1:1,driftX:0,driftY:reduced?0:Math.sin(time*.75+i)*3});}
 if([1,2,3].every(i=>d['send-'+i])&&!row.startsWith('19.beats.send-')||row.startsWith('19.beats.old-soul:')){const m=marker(b,'old-soul');if(m){const phase=reduced?1:(Math.sin(time*.48)+1)*.5;// Only the bound echoes diverge; ordinary family farewells keep their upright pose.
 const poses=[{x:62,y:0,scale:.68,alpha:.68,mirror:-1,rotation:0},{x:125,y:-50,scale:.48,alpha:.40,mirror:1,rotation:-25*Math.PI/180},{x:165,y:5,scale:.42,alpha:.24,mirror:-1,rotation:28*Math.PI/180}];
 for(let i=0;i<3;i++){const pose=poses[i];rows.push({...pose,id:i?'farewell-old-'+i:'farewell-old-spirit',asset:'bound',x:m.x+pose.x,y:m.y+pose.y,driftX:(i?10:28)*phase,driftY:reduced?0:Math.sin(time*.6+i)*3,reachDirection:pose.mirror});}}}
 return rows;
}
G.HonroStage19Farewell={active,prepare,done,marker,spirit,actor,camera,landscapeFrame,returnCamera,presentation};
})(globalThis);
