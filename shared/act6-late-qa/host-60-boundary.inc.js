function prepare60Boundary(G,descriptor){
 const issued=new WeakMap();
 const sha=async v=>Array.from(new Uint8Array(await G.crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)))),n=>n.toString(16).padStart(2,'0')).join('');
 const port=stage59Boundary({
  nativeScope:(app,e,owner,lease)=>lease.e===e&&lease.app===app&&lease.ops===owner&&issued.get(lease)?.active()===true,
  verifyGuard:(app,e,owner,lease)=>issued.get(lease)?.guard,
  ownerView:(app,e,owner,receipt,lease)=>readMounted59(owner,receipt,issued.get(lease))
 });
 async function bind({app,engine:e,owner,receipt,cap,lease,prior,live}){
  if(!live()||port.read(cap))return;
  const runId=app.profile?.equipment?.runId,prev=prior?.boundary;
  const g=prev?.guard, a=prev?.association, s=g?.spawn, t=g?.end;
  if(prior?.stage!==58||!runId||g?.ref!=='local-07-gwakjin-return-keeper'||g.anchor?.id!=='local-return-anchor-07'||
     s?.ground!==true||t?.ground!==true||s.support!==g.anchor.host||t.support!==g.anchor.host||t.x-s.x<=160||
     Math.abs(t.x-g.anchor.x)>=g.anchor.r||a?.seamReady!==true||a.id!==cap.crew.mage.id)return;
  const ids=[g.ref,'local-07-return-guard-shield','local-07-return-guard-relay'];
  const binding=await sha({proof:g,authoredSilhouettes:ids.slice(1)});
  const digest=await sha({stage:59,runId,row:descriptor.lateRows[59].sha256,receipt});
  if(!live())return;
  const state={guard:{anchor:g.anchor.id,ids,binding},digest,endingKey:'act6-ending:'+runId+':'+digest,active:live};
  issued.set(lease,state);
  try{return port.mint({app,engine:e,owner,receipt,cap,lease});}
  finally{issued.delete(lease);}
 }
 return Object.freeze({bind,read:port.read});
}
