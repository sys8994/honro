// Returns a generator. For UI actions, stop outside the page and use real
// mouse/touch targeting the text button. No profile/state setters here.
(tape)=>{
 const app=globalThis.HonroApp,e=app.engine,b=e.b;
 const body=u=>[u.id,u.cls,u.hp,u.maxHp,u.focus,u.maxFocus,u.shield,u.level,u.loadout,u.ranks,u.equipmentState??null];
 const snap=()=>({stage:b.stageId,mode:b.mode,phase:b.phase,round:b.round,shot:b.shot,units:b.units.filter(u=>u.side===0&&!u.summoned).map(body)});
 const cmp=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 if(b.mode!=='campaign'||app.profile!==app.normalProfile||app.training||app.debugMode||app.customMap||b.honroCustom||!cmp(snap(),tape.initial)) throw Error('FIRST_NORMAL_CAMPAIGN_MOUNT_REQUIRED '+JSON.stringify(snap()));
 return (function*(){
  let index=0;
  for(const [k,args,expected] of tape.ops){
   index++;
   if(k==='action'){
    // Failed checks use real absent/disabled controls, never fake a vital/goal.
    const witnessed=yield {kind:'visibleAction',id:args[0],args:args.slice(1),expected,index,shot:b.shot,actor:e.active?.id,round:b.round};
    if(witnessed!==expected)throw Error('actual UI action differs '+index+' '+args[0]);
   }else if(k==='tick'){for(let i=0;i<expected;i++)e.tick(args[0]);}
   else if(['move','jump','fire','wait','defend'].includes(k)){
    const v=k==='jump'?e.jump(e.unit(args[0])):e[k](...args);
    if(typeof expected==='boolean'&&expected!==v)throw Error('native input outcome differs '+index+' '+k);
   }else throw Error('forbidden command '+k);
  }
  const final=snap();
  if(!cmp(final,tape.final))throw Error('terminal readback differs '+JSON.stringify(final));
  return final;
 })();
}
