(function(G){'use strict';
// Preserve synchronous entry APIs. Deferred calls return without changing combat
// or saves, then resume once, only while their original UI/profile still owns them.
const pending=new WeakMap();let serial=0;
function cancel(app){const task=pending.get(app);if(!task)return;pending.delete(app);task.node.remove();}
function defer(app,id,run){
 const loader=G.HonroCampaignLoader;
 if(!loader||G.HONRO_EMBEDDED||app.customMap)return false;
 if(loader.has(id)){cancel(app);return false;}
 const previous=pending.get(app);if(previous?.id===id&&previous.profile===app.profile&&previous.running){previous.run=run;return true;}
 cancel(app);
 const node=document.createElement('aside');node.className='campaign-loading';node.setAttribute('role','status');
 const task={id,run,node,profile:app.profile,screen:app.screen,owner:app.root.firstElementChild,serial:++serial,running:false};pending.set(app,task);document.body.append(node);
 const owns=()=>pending.get(app)===task&&app.profile===task.profile&&app.screen===task.screen&&app.root.firstElementChild===task.owner;
 const start=()=>{if(!owns()){cancel(app);return;}task.running=true;node.replaceChildren(document.createTextNode('길을 준비하고 있습니다… '));const button=document.createElement('button');button.textContent='취소';button.onclick=()=>cancel(app);node.append(button);
  loader.ensureStage(id).then(()=>{if(!owns()){if(pending.get(app)===task)cancel(app);return;}pending.delete(app);node.remove();task.run();loader.prewarmNext(id);},()=>{if(!owns()){if(pending.get(app)===task)cancel(app);return;}task.running=false;node.replaceChildren(document.createTextNode('길을 불러오지 못했습니다. '));const retry=document.createElement('button');retry.textContent='다시 시도';retry.onclick=start;const back=document.createElement('button');back.textContent='취소';back.onclick=()=>cancel(app);node.append(retry,back);});
 };start();return true;
}
function next(app){return G.HonroJourneyContent?.next(app.profile)?.stageId||G.HonroCampaignLoader?.destination(app.profile)||1;}
G.HonroCampaignEntry={defer,cancel,next};
})(globalThis);

