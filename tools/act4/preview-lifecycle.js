(function(G){'use strict';
const P=G.HonroAct4TerrainPreview,key='honro.act4.review.v1',copy=x=>JSON.parse(JSON.stringify(x)),proto=Object.getPrototypeOf(G.HonroApp),memory=P.previewMemory;
const active=app=>!!app.engine?.b?.honroCustom&&!!app.engine.b.honroAct4Preview;
const order=[31,32,33,34,35,36,37,38,39,40];let checkpoint=null;
P.campaignProof??={};
function save(app=G.HonroApp){if(!active(app))return false;const b=P.snapshot(app),q=memory(b);const payload={version:1,revision:2,battle:b,profile:copy(app.profile),camera:{x:app.scene.x,y:app.scene.y,scale:app.scene.scale},proof:copy(P.campaignProof)};try{G.localStorage.setItem(key,JSON.stringify(payload));return true;}catch(e){P.storageError=e.message;return false;}}
function resume(app=G.HonroApp){let p;try{p=JSON.parse(G.localStorage.getItem(key));}catch(e){P.storageError=e.message;return false;}if(p?.version!==1||p.revision!==2||!p.battle?.honroAct4Preview)return false;P.campaignProof=copy(p.proof||{});const r=P.restore(p.battle);app.profile=copy(p.profile);Object.assign(app.scene,p.camera);app.done=false;app.updateHUD(true);return r;}
function restart(app=G.HonroApp){if(!active(app))return false;const n=app.engine.b.honroAct4Preview,profile=copy(app.profile);const r=P.launch(n);app.profile=profile;app.done=false;app.updateHUD(true);save(app);return r;}
const launch=P.launch;P.launch=function(n){const r=launch(n);checkpoint=copy(r.b);G.HonroApp.done=false;return r;};
const originalOutcome=proto.outcome;proto.outcome=function(...args){if(!active(this))return originalOutcome.apply(this,args);const b=this.engine.b,q=memory(b);if(this.done||!['won','lost'].includes(b.phase))return;this.done=true;this.cancelInput();this.resultDismissed=false;if(q.complete){if(q.safeSeven)P.campaignProof.safeSeven=copy(q.safeSeven);if(q.rescued)P.campaignProof.rescued=copy(q.rescued);P.campaignProof.completed??=[];if(!P.campaignProof.completed.includes(b.honroAct4Preview))P.campaignProof.completed.push(b.honroAct4Preview);}save(this);
 const title=b.phase==='won'?'완료':'재시작',button=G.document.createElement('button');button.textContent=b.phase==='won'?'이어 걷기':'재시작';button.onclick=()=>b.phase==='won'?this.resultContinue():restart(this);
 this.open(`<h2>${title}</h2><div id="act4-result-controls"></div>`,'result');G.document.getElementById('act4-result-controls')?.append(button);};
const result=proto.resultContinue;proto.resultContinue=function(...args){if(!active(this))return result.apply(this,args);const b=this.engine.b;if(b.phase!=='won')return restart(this);const n=order[order.indexOf(b.honroAct4Preview)+1];this.close();if(n){const r=P.launch(n);save(this);return r;}save(this);return true;};
const retry=proto.retry;proto.retry=function(...args){return active(this)?restart(this):retry.apply(this,args);};
const cont=proto.continue;proto.continue=function(...args){return active(this)?resume(this):cont.apply(this,args);};
const interact=P.interact;P.interact=function(app=G.HonroApp){const ok=interact(app);if(!ok)return false;const b=app.engine.b,q=memory(b);if(q.complete){if(b.honroAct4Preview===31)P.coast.fact(b,'eq_se_t3b',{boarded:true,party:b.units.filter(u=>u.side===0&&!u.dead).map(u=>u.id)});b.phase='won';save(app);}return true;};
G.document.addEventListener('keydown',e=>{if(e.code==='KeyE'&&active(G.HonroApp)&&!G.HonroApp.dialogue)P.interact();});
Object.assign(P,{save,resume,restart,saveKey:key});
})(globalThis);
