(function(G){'use strict';
const F=G.HonroAct3V4ReviewedCore,V=G.HonroAct23V4,W=G.HonroAct3V4ReviewedWaterworks,mark=V.marker;let R;const mem=b=>R.memory(b),ids=(s,n)=>Array.from({length:n},(_,i)=>'A3.S25.'+s+'.0'+(i+1)),all=b=>W.total(b,5)===5;
const goods=b=>W.team(b).some(u=>W.ground(b,u)&&V.near(u,mark(b,'household-tally'),470));
const exit=b=>all(b)&&W.team(b).length===2&&W.team(b).every(u=>W.ground(b,u)&&V.near(u,mark(b,'waterworks-exit'),200));
R=F.register({stage:25,
 author(map){map.initialState.honroReviewed25Goods={...map.markers.find(m=>m.id==='household-tally'),tags:['household-3','household-8'],items:['bowl','door-handle','hoe']};},
 attach(app,e){W.attach(app,e,R);},
 observe(app){const b=app.engine.b,q=mem(b);W.observe(app,R);if(goods(b))q.proof.goods={items:b.honroReviewed25Goods.items,tags:b.honroReviewed25Goods.tags};},
 facts(app,r){const b=app.engine.b;if(r.id==='A3.S25.WINDOW.01')return b.units.some(u=>V.alive(u)&&u.side===1&&W.visible(app,u,950));if(r.id==='A3.S25.FAR_SIDE.02'||r.id==='A3.S25.DEPTH.02')return W.returnLink(app);if(r.id.startsWith('A3.S25.LINK_DANGER.'))return W.workDanger(app,R);return true;},
 events:[{key:'arrival',ids:['EDGE.ARRIVALS_25_0'],when:app=>W.team(app.engine.b).length===2},{key:'intro',ids:ids('INTRO',2),when:app=>W.team(app.engine.b).length===2},
 {key:'east',ids:ids('EAST',2),when:app=>W.arrived(app.engine.b,1)},
 {key:'window',ids:ids('WINDOW',1),when:app=>W.arrived(app.engine.b,2)},
 {key:'link',ids:ids('LINK_DANGER',2),when:app=>W.workDanger(app,R)},
 {key:'water',ids:ids('WATER',2),when:app=>!!mem(app.engine.b).proof.water},
 {key:'households',ids:ids('HOUSEHOLDS',3),when:app=>!!mem(app.engine.b).proof.goods},
 {key:'far',ids:ids('FAR_SIDE',2),when:app=>W.arrived(app.engine.b,4)},
 {key:'depth',ids:ids('DEPTH',2),when:app=>W.arrived(app.engine.b,5)},
 {key:'available',ids:['A3.S25.GUIDE.01'],when:app=>(app.engine.b.stakes||[]).some(s=>s.skill==='M09'&&s.active!==false&&s.side===0)},
 {key:'unsafe',ids:['A3.S25.GUIDE.02'],when:app=>W.unsafe(app,R)},
 {key:'exit',ids:ids('EXIT',2),when:app=>exit(app.engine.b)}],
 journals:[{id:'A3.S25.JOURNAL.01',when:app=>{const q=mem(app.engine.b);return !!q.proof.goods&&!!q.proof.water&&!!q.proof.recess;}}],
 complete:b=>exit(b)&&F.closed(mem(b).events.exit),objective:b=>'A3.S25.OBJ.0'+(all(b)?2:1),progress:b=>all(b)?'':'안전 도착 '+W.total(b,5)+'/5',
 camera(app,key){const b=app.engine.b;return{id:'v4.25.'+key,intent:'situation',targets:[key==='water'?b.honroStoryAnomalyEnvironment.drip:key==='households'?mark(b,'household-tally'):W.team(b)[0]],padding:130,maxScale:.8};},
 draw(scene,c,b){W.draw(scene,c,b,R);const p=b.honroReviewed25Goods;c.save();c.translate(p.x,p.y);for(let i=0;i<2;i++){c.fillStyle=i?'#625e47':'#77765c';c.fillRect(i*140-110,-50,110,40);c.strokeStyle='#c2b890';c.lineWidth=3;c.strokeRect(i*140-106,-47,20,23);for(let j=0;j<(i?4:3);j++){c.beginPath();c.moveTo(i*140-102+j*4,-43);c.lineTo(i*140-102+j*4,-30);c.stroke();}c.beginPath();c.ellipse(i*140-45,-54,24,10,0,0,Math.PI);c.stroke();c.beginPath();c.moveTo(i*140-30,-65);c.lineTo(i*140+2,-65);c.lineTo(i*140+2,-40);c.stroke();}c.restore();}
});G.HonroAct23V4Chapter25Reviewed=R;
})(globalThis);
