const actions=Object.freeze({
 stakeA:{key:'stakeA',label:'첫 진목 놓기',support:'A-upper-veranda',x:1872,radius:180},
 stakeB:{key:'stakeB',label:'둘째 진목 놓기',support:'B-02-center-lower-short-climb',x:3600,radius:180},
 activate:{key:'activate',label:'가름진 작동',support:'E-joined-ordinary-floor',x:5200,radius:180},
 readNarrowing:{key:'readNarrowing',label:'바뀐 흐름 살피기',support:'E-joined-ordinary-floor',x:5050,radius:150},
 warnShelf:{key:'warnShelf',label:'낮은 턱의 변화를 확인',support:'B-central-lower-floor',x:3264,radius:48},
 open:{key:'open',label:'임시 통로 열기',support:'B-central-lower-floor',x:3176,radius:180},
 returnEast:{key:'returnEast',label:'동쪽 돌길 확인',support:'E-joined-ordinary-floor',x:5200,radius:180}
});
export function stage56Display(mission,engine,core){
 const r=mission?.read?.();if(!r)return null;
 const f=r.flags, stage=r.done?'complete':!f.firstStake?'stakeA':!f.secondStake?'stakeB':!f.firstActivationComplete?'activate':!f.firstGarmjinFailed?'readNarrowing':!r.reflow||r.reflow==='inside-at-live-pressure'?'warnShelf':r.reflow==='warned'?'evade':!f.temporaryPassageOpen?'open':!f.eastReturnObserved?'returnEast':'exit';
 const row=actions[stage],goal=stage==='evade'?'왼쪽 낮은 턱으로 몸을 피하십시오.':stage==='exit'?'깊은 경계 출구로 나아가십시오.':row?.label??'';
 const terrain=row&&engine.b.terrain.find(t=>t.id===row.support);
 const y=terrain&&core.topAt(terrain,row.x,NaN);
 const marker=Number.isFinite(y)?Object.freeze({x:row.x,y}):null;
 return Object.freeze({stage,goal,action:row?.key??null,marker,scene:r.scopeFrame,blocksInput:false});
}

// Draw the distant soul path behind the approved stone and eaves. The
// same lights move through the cue and reflow without resetting position.
export function stage56FlowLayer(scene,phaseFor){
 const background=scene.backgroundReadability,span=440;
 let offset=0,lastTime=scene.time;
 scene.backgroundReadability=function(c,w,h,b){
  background?.call(this,c,w,h,b);
  const phase=phaseFor();
  const elapsed=Math.max(0,Math.min(.08,this.time-lastTime));
  lastTime=this.time;
  if(!['forward','slowing','reverse'].includes(phase))return;
  const direction=phase==='reverse'?-1:1;
  const slow=phase==='slowing',speed=slow?14:110;
  offset=(offset+elapsed*direction*speed+span)%span;
  c.save();
  c.translate(w/2,h/2);c.scale(this.scale,this.scale);c.translate(-this.x,-this.y);
  c.strokeStyle='#a7c0b7';c.fillStyle='#c6dbca';c.lineWidth=4;c.lineCap='round';
  for(let i=0;i<7;i++){
   const t=((offset+i*63)%span)/span;
   const x=4500+t*span,y=3580+Math.sin(t*Math.PI)*28+(i%2)*14;
   const tail=(slow?14:33)*direction;
   c.globalAlpha=.55*Math.sin(t*Math.PI);
   c.beginPath();c.moveTo(x-tail,y+6);c.quadraticCurveTo(x-tail*.45,y-5,x,y);c.stroke();
   c.beginPath();c.ellipse(x,y,4,2.5,0,0,2*Math.PI);c.fill();
  }
  c.restore();
 };
}
// No DOM installation in this module; App binds a preformatted known action with a private closure.
export function dispatchStage56(mission,row,event){
 if(event?.isTrusted!==true||!row?.action||!Object.hasOwn(actions,row.action))return false;
 return mission.act(row.action)===true;
}
