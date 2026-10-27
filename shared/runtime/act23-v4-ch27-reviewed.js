(function(G){'use strict';
const F=G.HonroAct3V4ReviewedCore,V=G.HonroAct23V4,W=G.HonroAct3V4ReviewedWaterworks,C=G.HONRO_CORE;let R;const q=b=>R.memory(b),ids=(s,n)=>Array.from({length:n},(_,i)=>'A3.S27.'+s+'.0'+(i+1)),all=b=>W.total(b,4)===4,exit=b=>all(b)&&W.team(b).length===2&&W.team(b).every(u=>W.ground(b,u)&&V.near(u,V.marker(b,'deep-depot-exit'),220));
const returnIds=[0,1,2].map(i=>'EDGE.SCENES_27_VOID_RETURNLINES_'+i),voidIds=[0,1,2,3].map(i=>'EDGE.SCENES_27_VOID_SCENELINES_'+i).concat([1,2,3,4].map(i=>'EDGE.VOID27.TIME_BELL.0'+i),'EDGE.SCENES_27_VOID_SCENELINES_4');
R=F.register({stage:27,
 attach(app,e){W.attach(app,e,R);},
 observe(app){const b=app.engine.b;W.observe(app,R);const p=V.marker(b,'family-manifest');if(p&&W.visible(app,p))q(b).proof.tags={source:'world-family-tags',x:p.x,y:p.y};},
 facts(app,r){if(r.id==='A3.S27.OPPOSITE.01')return W.returnLink(app);if(returnIds.includes(r.id))return W.team(app.engine.b).length===2&&!!q(app.engine.b).proof.void?.returned;return true;},
 events:[{key:'arrival',ids:['EDGE.ARRIVALS_27_0'],when:app=>W.team(app.engine.b).length===2},{key:'intro',ids:ids('INTRO',2),when:app=>W.team(app.engine.b).length===2},
 {key:'first',ids:ids('FIRST_STAKE',2),when:app=>(app.engine.b.stakes||[]).some(s=>s.skill==='M09'&&s.active!==false&&s.side===0)},
 {key:'loading',ids:ids('LOADING',1),when:app=>W.arrived(app.engine.b,1)},
 {key:'opposite',ids:ids('OPPOSITE',1),when:app=>W.arrived(app.engine.b,2)&&W.returnLink(app)},
 {key:'recovery',ids:ids('RECOVERY',1),when:app=>W.arrived(app.engine.b,3)},
 {key:'upper',ids:ids('UPPER',2),when:app=>W.arrived(app.engine.b,4)},
 {key:'return',ids:returnIds,when:app=>!!q(app.engine.b).proof.void?.returned},
 {key:'recovered',ids:['A3.S27.GUIDE.01'],when:app=>q(app.engine.b).voidRecovered===true},
 {key:'exit',ids:ids('EXIT',2),when:app=>exit(app.engine.b)}],
 journals:[{id:'EDGE.RUNTIME.JOURNAL.EVIDENCE27.MANIFEST',when:app=>!!q(app.engine.b).proof.tags},{id:'A3.S27.JOURNAL.01',when:app=>exit(app.engine.b)&&F.closed(q(app.engine.b).events.exit)},{id:'A3.S27.JOURNAL.PRIVATE',when:app=>{const b=app.engine.b;return b.honroAct3Void?.state==='RESOLVED'&&b.honroVoidWitness===true&&!!q(b).proof.void?.returned;}}],
 complete:b=>exit(b)&&F.closed(q(b).events.exit),objective:b=>'A3.S27.OBJ.0'+(all(b)?2:1),progress:b=>all(b)?'':'안전 도착 '+W.total(b,4)+'/4',
 camera(app,key){return{id:'v4.27.'+key,intent:'situation',targets:W.team(app.engine.b).map(u=>({actor:u.id})),padding:140,maxScale:.8};},
 draw(scene,c,b){W.draw(scene,c,b,R);const p=V.marker(b,'family-manifest');if(!p)return;c.save();c.translate(p.x,p.y);c.fillStyle='#66654b';c.fillRect(-90,-42,180,35);c.strokeStyle='#c6b995';c.lineWidth=3;for(let i=0;i<4;i++){c.strokeRect(-76+i*44,-46,18,22);c.beginPath();c.moveTo(-71+i*44,-42);c.lineTo(-71+i*44,-27);c.moveTo(-64+i*44,-42);c.lineTo(-64+i*44,-27);c.stroke();}c.restore();}
});
R.voidLines=app=>R.active(app.engine?.b)?voidIds.map(id=>{const r=R.row(id);return{...F.copy(r),rowId:id,align:r.speaker==='설오'?'near':'far',owner:'설오',party_shared:false};}):null;
R.voidResolved=(app,session)=>{if(!R.active(app.engine?.b)||!session?.lines?.every(l=>voidIds.includes(l.rowId)))return;const b=app.engine.b,u=W.team(b).find(u=>u.cls==='archer');if(!u||!W.ground(b,u)||b.honroAct3Void?.state!=='RESOLVED')return;q(b).proof.void={returned:true,owner:'설오',party_shared:false,source:G.HonroAct3Void.KEY,rowIds:session.lines.map(l=>l.rowId)};};
R.voidRecovery=b=>{if(R.active(b)&&b.honroAct3Void?.recovered===true)q(b).voidRecovered=true;};
G.HonroAct23V4Chapter27Reviewed=R;
})(globalThis);
