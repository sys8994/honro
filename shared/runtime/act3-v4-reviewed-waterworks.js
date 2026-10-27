(function(G){'use strict';
const F=G.HonroAct3V4ReviewedCore,V=G.HonroAct23V4,C=G.HONRO_CORE;
const ground=(b,u)=>V.alive(u)&&C.validTerrainContactPose(b.terrain,u),team=b=>V.heroes(b).filter(u=>['archer','mage'].includes(u.cls));
function visible(app,p,range=700){const b=app.engine.b,s=app.scene,z=s?.scale,size=s?.size?.();return !!p&&!!size&&z>0&&Math.abs(p.x-s.x)<size.w/z/2+50&&Math.abs(p.y-s.y)<size.h/z/2+50&&team(b).some(u=>ground(b,u)&&Math.hypot(u.x-p.x,(u.y-p.y)*.75)<range);}
function pair(app){const b=app.engine.b,z=(b.stakes||[]).filter(s=>s.skill==='M09'&&s.side===0&&s.active!==false&&(s.expires===undefined||s.expires>b.round));return z.length===2?z:null;}
function returnLink(app){const z=pair(app);return !!z&&team(app.engine.b).some(u=>z.some(s=>V.near(u,s,160)))&&app.engine.gateResolution?.().ok===true;}
const arrived=(b,i)=>!!G.HonroAct23V4City.memory(b).arrivals['stake-arrival-'+i];
const total=(b,n)=>Array.from({length:n},(_,i)=>arrived(b,i+1)).filter(Boolean).length;
function observe(app,R){const b=app.engine.b,q=R.memory(b),env=b.honroStoryAnomalyEnvironment,s=app.scene,t=G.HonroStoryAnomalyArt?.time?.(s)??s?.time??0;
 if(env?.recess&&visible(app,env.recess))q.proof.recess={source:'authored-recess',x:env.recess.x,y:env.recess.y};
 const p=env?.drip;if(p&&visible(app,{x:p.x,y:p.y+150})){const phase=(t%5.8)/5.8,progress=Math.min(1,phase*2.7),side=p.turn*Math.max(0,Math.min(1,(progress-.58)/.42));if(phase<=.49&&side>0){q.waterStart??={x:p.x+side,time:t};if(Math.abs(p.x+side-q.waterStart.x)>=8)q.proof.water={source:'authored-drip',from:q.waterStart.x,to:p.x+side,time:t};}}
 const work=q.linkWork;if(work){work.remaining=Math.max(0,work.remaining-.025);const mage=team(b).find(u=>u.cls==='mage');if(!mage||!V.near(mage,work.from,170)||app.engine.gateResolution?.().ok)work.remaining=0;}
}
function attach(app,e,R){const use=e.useGate?.bind(e);if(!use)return;e.useGate=function(...args){const b=e.b,q=R.memory(b),z=pair(app),u=e.active,res=e.gateResolution?.(),physical=res&&z&&ground(b,u)&&e.canAct()&&!res.ok&&!/사용|차례|행동|한 번|진목.*필요|연결할/.test(res.reason||'');const out=use(...args);if(!out&&physical){q.unsafe={from:F.copy(res.from||z[0]),to:F.copy(res.to||z[1]),reason:res.reason};if(u.cls==='mage')q.linkWork={from:{x:u.x,y:u.y},to:{x:(res.to||z[1]).x,y:(res.to||z[1]).y},remaining:.8};}return out;};}
function workDanger(app,R){const b=app.engine.b,w=R.memory(b).linkWork,mage=team(b).find(u=>u.cls==='mage');return !!w&&w.remaining>0&&!!mage&&V.near(mage,w.from,170)&&b.units.some(u=>V.alive(u)&&u.side===1&&V.near(u,mage,360));}
function unsafe(app,R){const q=R.memory(app.engine.b);return !!q.unsafe&&!!pair(app)&&app.engine.gateResolution?.().ok===false;}
function draw(scene,c,b,R){const w=R.memory(b).linkWork;if(w?.remaining>0){c.save();c.strokeStyle='#a8b6a2';c.lineWidth=2;c.beginPath();c.moveTo(w.from.x,w.from.y-50);c.lineTo(w.to.x,w.to.y-22);c.stroke();c.restore();}}
// Retry preserves only terminal presentation and actually witnessed scenery.
// Arrival receipts, resources, enemies and terrain remain checkpoint-owned.
function captureRetry(b){const R=F.providers.get(b.honroStage);if(!R?.active(b)||![25,27].includes(b.honroStage))return null;const q=R.memory(b);return{stage:b.honroStage,events:F.copy(Object.fromEntries(Object.entries(q.events).filter(([,v])=>F.closed(v)))),journals:F.copy(q.journals),proof:F.copy(q.proof)};}
function restoreRetry(b,s){const R=s&&F.providers.get(s.stage);if(!R?.active(b))return;const q=R.memory(b);Object.assign(q.events,s.events);Object.assign(q.journals,s.journals);Object.assign(q.proof,s.proof);}
G.HonroAct3V4ReviewedWaterworks={ground,team,visible,pair,returnLink,arrived,total,observe,attach,workDanger,unsafe,draw,captureRetry,restoreRetry};
})(globalThis);
