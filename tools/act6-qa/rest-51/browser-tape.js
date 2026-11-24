// Returns a generator. For UI actions, stop outside the page and use real
// mouse/touch targeting the text button. No profile/state setters here.
(tape)=>{
 const app=globalThis.HonroApp,e=app.engine,b=e.b;
 const body=u=>[u.id,u.cls,u.hp,u.maxHp,u.focus,u.maxFocus,u.shield,u.level,u.loadout,u.ranks,u.equipmentState??null];
 const snap=()=>({stage:b.stageId,mode:b.mode,phase:b.phase,round:b.round,shot:b.shot,units:b.units.filter(u=>u.side===0&&!u.summoned).map(body)});
 const cmp=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 if(b.mode!=='campaign'||app.profile!==app.normalProfile||app.training||app.debugMode||app.customMap||b.honroCustom||!cmp(snap(),tape.initial)) throw Error('FIRST_NORMAL_CAMPAIGN_MOUNT_REQUIRED '+JSON.stringify(snap()));
 return (function*(){
  let index=0,elapsed=0,prior=null;
  const timeline=[];
  const trace=op=>{
   const mage=e.unit('p-mage');
   const state=[b.phase,b.round,b.shot,b.teamEnds.slice(),mage.shield,mage.shieldUntil??null];
   const sig=JSON.stringify(state);
   if(sig!==prior){timeline.push({index,elapsed,op,state});prior=sig;}
  };
  trace('start');
  for(const [k,args,expected] of tape.ops){
   index++;
   if(k==='action'){
    // Failed checks use real absent/disabled controls, never fake a vital/goal.
    const witnessed=yield {kind:'visibleAction',id:args[0],args:args.slice(1),expected,index,shot:b.shot,actor:e.active?.id,round:b.round};
    if(witnessed!==expected)throw Error('actual UI action differs '+index+' '+args[0]);
   }else if(k==='tick'){for(let i=0;i<expected;i++){e.tick(args[0]);elapsed++;trace('tick');}}
   else if(['move','jump','fire','wait','defend'].includes(k)){
    const v=k==='jump'?e.jump(e.unit(args[0])):e[k](...args);
    if(typeof expected==='boolean'&&expected!==v)throw Error('native input outcome differs '+index+' '+k);
   }else throw Error('forbidden command '+k);
   trace(k);
  }
  const final=snap();
  if(final.phase!=='won'||final.round!==4||final.shot!==5||e.b!==b||app.engine!==e||app.profile!==app.normalProfile)throw Error('unexpected physical terminal '+JSON.stringify(final));
  const observed=structuredClone(tape.final);
  // Official R3 native browser witness. No HP, identity, ranks, equipment,
  // focus or other shield is wildcarded. This is not an input or new seed.
  observed.units.find(u=>u[0]==='p-mage')[6]=0;
  const variant=cmp(final,observed)?'browser-r3':cmp(final,tape.final)?'native-vm':null;
  if(!variant)throw Error('terminal differs from both exact witnessed profiles '+JSON.stringify({final,timeline}));
  return {final,variant,timeline};
 })();
}
