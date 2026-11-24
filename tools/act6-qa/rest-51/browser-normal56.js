(function*(){
 const a=HonroApp,e56=a.engine,b56=e56.b,live56=e56.active,C=HONRO_CORE;
 const assert=(q,msg)=>{if(!q)throw Error(msg??'56 live input');};
 assert(b56.mode==='campaign'&&e56.stage.id===56&&live56.cls==='mage'&&a.profile===a.normalProfile);
 const dt56=1/120;
let ticks56=0;
const acts56=[],enemyActive56=[];let enemyLast56=null;
function tick56(){if(b56.side===1&&b56.phase==='enemy'&&b56.active!==enemyLast56){enemyLast56=b56.active;enemyActive56.push([ticks56,b56.round,b56.active,live56.x,live56.y]);}e56.tick(dt56);a.missionTick(dt56);ticks56++;}
const anchor56=()=>[b56.round,live56.x,live56.y,live56.hp,live56.focus,live56.shield,b56.phase,b56.active];
function go56(x,{jump=false,tol=2}={}){
 const old=anchor56();let j=0;
 if(jump)assert(e56.jump(live56));
 while(Math.abs(x-live56.x)>tol&&b56.phase==='aim'&&e56.active===live56&&j++<2200){
  if(live56.moveLeft<15&&e56.grounded(live56)&&e56.canAct())enemy56();
  e56.move(Math.sign(x-live56.x),dt56);tick56();
 }
 acts56.push(['go',x,old,anchor56()]);
 if(b56.phase!=='won')assert(Math.abs(x-live56.x)<=tol+2,JSON.stringify(acts56.at(-1)));
}
function land56(){for(let i=0;i<400&&!e56.grounded(live56)&&b56.phase==='aim';i++)tick56();return e56.grounded(live56);}
function* evt56(k){const result=yield {id:k,actor:live56.id,round:b56.round};acts56.push(['mark',k,result,anchor56()]);assert(result===true,JSON.stringify(acts56.at(-1)));}
function enemy56({fire=false}={}){
 assert(e56.canAct()&&e56.active===live56);
 const begins=b56.round;let fired=false;
 if(fire){
  const target=b56.units.find(u=>u.side===1&&!u.dead&&u.id==='draft-pressure-0');
  if(target) outer:for(let degree=2;degree<=80;degree+=2)for(let power=.22;power<=1.001;power+=.02){
    const p=e56.predict(live56,C.SKILLS.M01,degree,power,target,true);
    if(p.unit===target.id&&e56.fire('M01',degree,power)){fired=[degree,power,target.id];break outer;}
  }
 }
 if(!fired)assert(e56.wait()!==false);
 for(let i=0;i<6000&&(b56.round<=begins||!e56.canAct()||e56.active!==live56)&&!['won','lost'].includes(b56.phase);i++)tick56();
 acts56.push(['opposite',begins,fired,anchor56()]);assert(e56.canAct()&&e56.active===live56,JSON.stringify(acts56.at(-1)));
}

 assert(document.querySelector('[data-act6-qa-lookout]').dataset.act6Mission!=='activate');
 go56(1872);yield* evt56('stakeA');go56(3040,{tol:4});land56();go56(3280,{tol:4});land56();go56(3600,{tol:4});land56();yield* evt56('stakeB');
 go56(4032,{tol:4});land56();go56(4176,{tol:4});land56();go56(5200,{tol:4});land56();yield* evt56('activate');go56(5090,{tol:4});land56();yield* evt56('readNarrowing');
 go56(3584,{tol:4});land56();go56(3265,{tol:4});land56();yield* evt56('warnShelf');go56(3058);enemy56({fire:true});go56(3176);yield* evt56('open');
 go56(3268,{tol:4});land56();go56(3600,{jump:true,tol:4});land56();go56(4040,{tol:4});land56();go56(4176,{tol:4});land56();go56(5200,{tol:4});land56();yield* evt56('returnEast');go56(6400);land56();a.missionTick(dt56);

 return {phase:b56.phase,round:b56.round,ticks56,acts56,enemyActive56};
})
