// Browser verification only. Exact fixed-rate native command candidate from
// an independent native run. Compare actual live carry rather than rebasing
// HP / shields to the historical shot tape. Any command outcome drift fails.
(tape,carried)=>{
 const app=HonroApp,e=app.engine,b=e.b,sort=xs=>xs.slice().sort((a,z)=>a[0].localeCompare(z[0]));
 const body=u=>[u.id,u.cls,u.hp,u.maxHp,u.focus,u.maxFocus,u.shield,u.level,u.loadout,u.ranks,u.equipmentState??null];
 const units=()=>sort(b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAlly).map(body));
 const exact=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 const safe=()=>HonroApp===app&&app.engine===e&&e.b===b&&app.stageId===52&&b.honroStage===52&&b.stageId===52&&b.mode==='campaign'&&
  b.honroAuthoredId==='stage-52'&&b.honroCanonical===true&&b.honroCustom===false&&e.stage.id===52&&app.profile===app.normalProfile&&
  b.honroGrowth?.limit.total===0&&b.honroGrowth?.limit.combat===0;
 if(!safe()||!exact(units(),sort(carried))||b.phase!=='aim'||b.round!==1||b.shot!==0||
    b.units.some(u=>u.side===0&&!e.grounded(u)))throw Error('NORMAL_52_CARRY_MISMATCH '+JSON.stringify(units()));
 const initial=units();
 return (function*(){
  let index=0;
  for(const [k,args,wanted] of tape.ops){
   index++;
   if(!safe())throw Error('Stage52 owner no longer current '+index);
   if(k==='action'){
    const accepted=yield {id:args[0],wanted,index}, expect=['cliff','bridge','bell','threshold'].includes(args[0]);
    if(!expect||accepted!==wanted)throw Error('Actual 52 UI action differed '+JSON.stringify({index,id:args[0],accepted,wanted,phase:b.phase,round:b.round,actor:e.active?.id,x:e.active?.x}));
   }else if(k==='tick'){
    if(!Number.isInteger(wanted)||wanted>50000||args.length!==1||args[0]!==1/120)throw Error('Invalid tick-input '+index);
    for(let i=0;i<wanted;i++)e.tick(args[0]);
   }else if(['move','jump','fire','wait'].includes(k)){
    const value=k==='jump'?e.jump(e.unit(args[0])):e[k](...args);
    if(typeof wanted==='boolean'&&wanted!==value)throw Error('Native 52 input differed '+JSON.stringify({index,k,args,wanted,value,phase:b.phase,round:b.round,actor:e.active?.id,x:e.active?.x}));
   }else throw Error('Unexpected command '+k);
  }
  if(b.phase!=='won'||b.round!==tape.final.round||b.shot!==tape.final.shot||!b.units.some(u=>u.side===1&&u.hp>0&&!u.dead)||
   b.units.some(u=>u.side===0&&(u.hp<=0||u.dead||!e.grounded(u))))throw Error('Normal 52 terminal disagreed '+JSON.stringify({phase:b.phase,round:b.round,shot:b.shot,units:units()}));
  return {initial,final:units(),stage:52,phase:b.phase,round:b.round,shot:b.shot,operations:index,staticAuthorityNeverPatched:true};
 })();
}
