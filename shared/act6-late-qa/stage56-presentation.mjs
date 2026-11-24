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
// No DOM installation in this module; App binds a preformatted known action with a private closure.
export function dispatchStage56(mission,row,event){
 if(event?.isTrusted!==true||!row?.action||!Object.hasOwn(actions,row.action))return false;
 return mission.act(row.action)===true;
}
