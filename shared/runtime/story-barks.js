(function(G){'use strict';
// Reviewed live speech reuses the existing noninteractive battle subtitle.
// Its cursor lives in the battlefield; no dialogue lock, action or camera move.
const copy=x=>JSON.parse(JSON.stringify(x)),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isBark=l=>Number.isInteger(l?.[2]?.reviewedStage)&&l[2].reviewedStage>=21&&l[2].delivery==='bark';
const state=b=>b.honroState.reviewedBarks??={revision:1,queue:[]};
const duration=l=>Math.max(2400,Math.min(6000,1800+Array.from(l[1]).length*75));
const host=()=>G.document?.getElementById('banter');
function hide(){const node=host();if(node){node.hidden=true;delete node.dataset.reviewedBark;}}
function pending(app,stage,key){return !!app.engine?.b.honroState.reviewedBarks?.queue.some(q=>q.session===app.engine.b.session&&q.options.reviewedStage===stage&&q.options.reviewedEvent===key);}
function finish(app,q){const b=app.engine.b;state(b).queue.shift();hide();G.HonroAct23V4Reviewed.finished(app,{...q.options,lines:q.lines,index:q.lines.length,liveBarkPresented:q.presented,delivery:'bark'});G.HonroStory.save(app);}
function tick(app,now=performance.now()){const b=app.engine?.b,previous=app.reviewedBarkClock;app.reviewedBarkClock=now;if(!b||app.screen!=='battle'){hide();return;}
 const s=b.honroState.reviewedBarks;if(!s?.queue?.length){hide();return;}
 if(app.dialogue||app.modal?.classList.contains('open')||G.document?.hidden||G.HonroAct3Void?.blocked(b)){hide();return;}
 let elapsed=previous===undefined?0:Math.max(0,Math.min(250,now-previous));
 for(let pass=0;pass<100&&s.queue.length;pass++){
  const q=s.queue[0];if(q.session!==b.session||q.options.reviewedStage!==b.honroStage||!G.HonroAct23V4Reviewed.rowsReviewed(q.lines)){s.queue.shift();hide();app.dirty=true;continue;}
  while(q.index<q.lines.length&&!G.HonroStory.allowed(app,q.lines[q.index][0],q.lines[q.index][2])){q.index++;q.elapsed=0;delete q.current;app.dirty=true;}
  if(q.index>=q.lines.length){finish(app,q);elapsed=0;continue;}
  const line=q.lines[q.index],id=line[2].rowId,node=host();if(!node){app.reviewedBarkClock=now;return;}
  if(q.current!==id){q.current=id;q.elapsed=0;}
  node.hidden=false;node.setAttribute('role','status');node.setAttribute('aria-live','polite');node.dataset.reviewedBark=id;
  if(node.dataset.reviewedBarkText!==id+'\n'+line[1]){node.innerHTML=`<strong>${esc(line[0])}</strong><span> ${esc(line[1])}</span>`;node.dataset.reviewedBarkText=id+'\n'+line[1];}
  if(!q.presented.includes(id)){q.presented.push(id);G.HonroStory.save(app);}
  q.elapsed+=elapsed;app.dirty=true;if(q.elapsed<duration(line))return;
  q.index++;q.elapsed=0;delete q.current;elapsed=0;G.HonroStory.save(app);
 }
}
function start(app,lines,options={}){const b=app.engine?.b;if(!b||app.screen!=='battle'||!lines.length||!lines.every(isBark)||!G.HonroAct23V4Reviewed.rowsReviewed(lines))return false;
 const s=state(b),stage=options.reviewedStage??lines[0][2].reviewedStage,key=options.reviewedEvent??lines[0][2].reviewedEvent;
 if(!pending(app,stage,key))s.queue.push({session:b.session,lines:copy(lines),options:{...copy(options),reviewedStage:stage,reviewedEvent:key},index:Math.max(0,Math.min(options.index||0,lines.length)),elapsed:0,presented:[]});
 b.honroStory=null;G.HonroStory.save(app);tick(app);return true;
}
G.HonroStoryBarks={isBark,start,tick,pending,duration};
})(globalThis);
