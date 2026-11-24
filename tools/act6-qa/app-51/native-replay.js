/* QA driver, never part of shipped app or engine; legal native Engine method replay. */
(stage)=>{
const app=globalThis.HonroApp,e=app.engine,b=e.b;
const id=stage===51?'01':stage===52?'02':null;
if(!id||b.honroStage!==stage||b.round!==1||b.phase!=='aim'||!(e instanceof HONRO_CORE.Engine))throw Error('Wrong ordinary App scene');
const C=HONRO_CORE, q={k:{title:app.stage.name}};
const known=({"01":[{"p":{"id":"p-archer","x":6670.34,"y":1602.76,"hp":1085,"mv":1949.83,"support":"mountain-main","grounded":true,"round":5,"side":0},"target":{"id":"crest-champion","x":6312.36,"y":1757.68,"hp":758,"mv":550,"support":"mountain-main","grounded":true,"round":5,"side":0},"angle":197,"skill":"A01","power":0.54},{"p":{"id":"p-archer","x":6671.89,"y":1602.32,"hp":998,"mv":1949.83,"support":"mountain-main","grounded":true,"round":6,"side":0},"target":{"id":"crest-champion","x":6230.82,"y":1825.94,"hp":688,"mv":550,"support":"mountain-main","grounded":true,"round":6,"side":0},"angle":197,"skill":"A01","power":0.54},{"p":{"id":"p-occultist","x":6669.09,"y":1603.12,"hp":1324,"mv":1996.67,"support":"mountain-main","grounded":true,"round":6,"side":0},"target":{"id":"crest-champion","x":6230.82,"y":1825.94,"hp":621,"mv":550,"support":"mountain-main","grounded":true,"round":6,"side":0},"angle":197,"skill":"O06","power":0.625},{"p":{"id":"p-archer","x":6669.14,"y":1603.1,"hp":924,"mv":1946.29,"support":"mountain-main","grounded":true,"round":7,"side":0},"target":{"id":"crest-champion","x":6230.82,"y":1825.94,"hp":421,"mv":550,"support":"mountain-main","grounded":true,"round":7,"side":0},"angle":197,"skill":"A01","power":0.54},{"p":{"id":"p-occultist","x":6670.78,"y":1602.64,"hp":1251,"mv":2000.13,"support":"mountain-main","grounded":true,"round":7,"side":0},"target":{"id":"crest-champion","x":6230.82,"y":1825.94,"hp":265,"mv":550,"support":"mountain-main","grounded":true,"round":7,"side":0},"angle":197,"skill":"O06","power":0.625},{"p":{"id":"p-archer","x":6670.84,"y":1602.62,"hp":847,"mv":1949.83,"support":"mountain-main","grounded":true,"round":8,"side":0},"target":{"id":"crest-champion","x":6149.76,"y":1912.1,"hp":47,"mv":550,"support":"mountain-main","grounded":true,"round":8,"side":0},"angle":197,"skill":"A01","power":0.54}],"02":[{"p":{"id":"p-archer","x":1200,"y":1224.58,"hp":1085,"mv":1964,"support":"west-watch-and-descent","grounded":true,"round":1,"side":0},"target":{"id":"cliff-stone","x":1510,"y":1361.9,"hp":155,"mv":0,"support":"west-watch-and-descent","grounded":true,"round":1,"side":0},"angle":-17,"skill":"A01","power":0.54},{"p":{"id":"p-knight","x":3010.05,"y":2340.5,"hp":1673,"mv":17.34,"support":"broken-arch-west","grounded":true,"round":1,"side":0},"target":{"id":"bridge-keeper","x":3230,"y":2217.7,"hp":659,"mv":550,"support":"broken-arch-west","grounded":true,"round":1,"side":0},"angle":0,"skill":"S00","power":0.7},{"p":{"id":"p-archer","x":1200,"y":1224.58,"hp":1085,"mv":1964,"support":"west-watch-and-descent","grounded":true,"round":2,"side":0},"target":{"id":"cliff-stone","x":1510,"y":1361.9,"hp":85,"mv":0,"support":"west-watch-and-descent","grounded":true,"round":2,"side":0},"angle":-17,"skill":"A01","power":0.54},{"p":{"id":"p-knight","x":3289.8,"y":2175.68,"hp":1526,"mv":1748.38,"support":"broken-arch-west","grounded":true,"round":2,"side":0},"target":{"id":"bridge-keeper","x":3096.85,"y":2304.58,"hp":659,"mv":550,"support":"broken-arch-west","grounded":true,"round":2,"side":0},"angle":180,"skill":"S00","power":0.7},{"p":{"id":"p-archer","x":1200,"y":1224.58,"hp":1085,"mv":1964,"support":"west-watch-and-descent","grounded":true,"round":3,"side":0},"target":{"id":"cliff-stone","x":1510,"y":1361.9,"hp":32,"mv":0,"support":"west-watch-and-descent","grounded":true,"round":3,"side":0},"angle":-17,"skill":"A01","power":0.54},{"p":{"id":"p-knight","x":3290.27,"y":2175.35,"hp":1378,"mv":2074,"support":"broken-arch-west","grounded":true,"round":3,"side":0},"target":{"id":"bridge-keeper","x":3365.21,"y":2145.65,"hp":300,"mv":550,"support":"broken-arch-west","grounded":true,"round":3,"side":0},"angle":0,"skill":"S00","power":0.7}]})[id];
const assert=Object.assign((x,msg)=>{if(!x)throw Error(msg);},{fail:msg=>{throw Error(msg);}});
const expected=id==='01'?['overlook']:['cliff','bridge','bell','threshold'];
const drive=(function*(){
const events=[], motion=new Map(), actorArrival={}, dt=1/120;
let ticks=0, actions=0, roundsLimit=15,minHP={}; const completed=new Set();

const mark=(u=e.active)=>u?{id:u.id,x:+u.x.toFixed(2),y:+u.y.toFixed(2),hp:u.hp,mv:+u.moveLeft.toFixed(2),support:e.contactSurface(u.x,u.y-4,u.y+4)?.t.id??null,grounded:e.grounded(u),round:b.round,side:b.side}:null;
const record=(type,extra={})=>events.push({type,tick:ticks,phase:b.phase,...extra});
const enemy=i=>b.units.find(u=>u.id===i), state=u=>{if(!motion.has(u.id))motion.set(u.id,{phase:0,jumps:0});return motion.get(u.id);};
const ruleEnd=id==='01'?'crest-champion':'bridge-keeper';
const isDead=u=>u.dead||u.hp<=0;
function tick(){
 e.tick(dt);ticks++;
 for(const a of b.units)minHP[a.id]=Math.min(minHP[a.id]??a.maxHp,a.hp);
 if(ticks>30000)throw Error('replay physics limit');
}
function* interactTry(m){
 if(m!==expected[completed.size])return false;
 const ok=yield {kind:'interact',mark:m, actor:mark()};
 if(ok){completed.add(m);record('interact',{mark:m,actor:mark()});}
 return ok;
}


function walk(u,goal,reserve=18){
 const initial=mark(u);let stale=0;const d=Math.sign(goal-u.x);
 for(let n=0;n<3500&&d*(goal-u.x)>2&&u.moveLeft>reserve&&b.phase==='aim'&&e.active?.id===u.id;n++){
  const x=u.x;e.move(d,dt);tick();stale=Math.abs(u.x-x)<.005?stale+1:0;if(stale>100)break;
 }
 if(Math.abs(u.x-initial.x)>3)record('walk',{from:initial,goal,to:mark(u)});
 return Math.abs(u.x-goal)<8;
}
function settle(n){
 for(let i=0;i<n&&b.phase==='aim'&&!e.grounded(e.active);i++)tick();
}
function* strive02(u){
 const s=state(u);
 if(s.phase===0){if(walk(u,3290)&&e.grounded(u))s.phase=1;}
 if(s.phase===1){
  if(!isDead(enemy('bridge-keeper')))return;
  if(u.cls==='knight'&&!completed.has('bridge')){if(!(yield* interactTry('bridge')))return}
  if(walk(u,3510,185)&&u.moveLeft>=130&&!isDead(u)&&e.grounded(u)&&b.phase==='aim'){
   if(e.jump(u)){s.jumps++;record('ordinary-jump',{actor:mark(u)});for(let i=0;i<48;i++){e.move(1,dt);tick()}settle(230);if(mark(u).support==='landing-1')s.phase=2;}
  }
 }
 const down=[['landing-1',3860],['landing-2',3590],['landing-3',3830],['landing-4',4260],['landing-5',4400]];
 while(s.phase>=2&&s.phase<=6&&u.moveLeft>24&&b.phase==='aim'){
  const i=s.phase-2,[p,goal]=down[i],from=mark(u);
  if(from.support!==p){settle(260);if(mark(u).support!==p)break;}
  if(!walk(u,goal,18))break;
  settle(290);const at=mark(u);
  if(at.support===p)break;
  s.phase++;record('landing',{from,to:at});
 }
 if(s.phase>=7){
  if(Math.abs(u.x-4399)>25)walk(u,4399);
  settle(180); actorArrival[u.id]=mark(u);
  if(u.cls==='occultist')(yield* interactTry('bell'));
  if(u.cls==='mage')(yield* interactTry('threshold'));
 }
}
const skills=u=>u.loadout.map(i=>q.nativeArt.G.HONRO_CORE.SKILLS?.[i]??q.nativeArt.G.HONRO_SKILLS?.[i]).filter(Boolean);
function shoot(u,target,maxDistance=1600){
 if(!target||isDead(target)||Math.abs(u.x-target.x)>maxDistance||!e.canAct()||!e.grounded(u))return false;
 if(known){
  const command=known.find(c=>c.p.id===u.id&&c.p.round===b.round&&c.target.id===target.id);
  if(!command)return false;
  assert(Math.hypot(command.p.x-u.x,command.p.y-u.y)<8,'sealed-shot input pose changed');
  if(e.fire(command.skill,command.angle,command.power)){record('fire',{p:mark(u),target:mark(target),skill:command.skill,angle:command.angle,power:command.power});return true}
  assert.fail('previously legal shot no longer accepted');
 }

 return false;
}
for(let last=b.round;!['won','lost'].includes(b.phase)&&b.round<=roundsLimit;){
 if(b.round!==last){last=b.round; }
 if(b.phase==='aim'&&b.side===0&&e.canAct()){
  const u=e.active;actions++; const s=state(u);
  let fired=false;
  if(id==='01'){
   walk(u,6670);
   settle(160);
   if(u.x>=6480&&e.grounded(u))actorArrival[u.id]=mark(u);
   if(u.cls==='mage')(yield* interactTry('overlook'));
   fired=shoot(u,enemy(ruleEnd));
  }else{
   if(u.cls==='archer'&&!completed.has('cliff')){
    if(!(yield* interactTry('cliff'))){
     fired=shoot(u,enemy('cliff-stone'),1500);
     
    }
   }
   if(!fired){yield* strive02(u);fired=shoot(u,enemy(ruleEnd));}
  }
  if(!fired&&e.canAct()&&b.phase==='aim'){record('defend',{actor:mark()});e.wait();}
 }
 tick();
}
const evidence={stage:id,title:q.k.title,phase:b.phase,why:b.winnerReason,seed:b.seed,ticks,simSeconds:ticks*dt,round:b.round,heroActionStarts:actions,heroInputFires:events.filter(e=>e.type==='fire').length,stockTotalShots:b.shot,stockHits:b.hits,minimumHP:minHP,allUnits:b.units.map(u=>({...mark(u),dead:isDead(u),side:u.side})),actorArrival,remainingFoes:b.units.filter(u=>u.side===1&&!isDead(u)).map(u=>u.id),objectives:b.events,inputLog:events};

return evidence;

})();
let calls=0;
return {next(ok){if(++calls>120||app.engine!==e)throw Error('Replay replaced the live Engine');return drive.next(ok);}};
}
