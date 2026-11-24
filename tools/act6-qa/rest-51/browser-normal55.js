// Use live engine commands and yield only the actual stage interaction button.
()=> {
 const app=HonroApp,e=app.engine,b=e.b,C=HONRO_CORE,dt=1/120;
 if(b.mode!=='campaign'||b.honroAuthoredId!=='stage-55'||e.stage.id!==55||app.profile!==app.normalProfile||app.training||app.debugMode||app.customMap||b.honroStage!==55||b.phase!=='aim'||b.round!==1||!(e instanceof C.Engine))throw Error('Stage55 App not mounted');
 const knight=e.active,v=e.unit('draft-pressure-0'),p=b.units.filter(u=>u.side===0&&!u.summoned);
 if(knight.cls!=='knight'||p.length!==3||p.some(u=>u.cls==='mage'))throw Error('wrong three bodies');
 const id=Object.fromEntries(p.map(u=>[u.cls,u.id]));let ticks=0,inputs=0,fires=0,interacts=0, path=[];
 const alive=u=>!u?.dead&&u.hp>0;
 const target=()=>{const btn=document.querySelector('[data-act6-qa-lookout]');return btn?{binding:btn.dataset.act6Binding,summary:btn.textContent}:null;};
 const goal=target;
 const done=()=>['won','lost'].includes(b.phase);
 const surface=u=>e.contactSurface(u.x,u.y-3,u.y+4)?.t.id;
 const mark=()=>({x:knight.x,y:knight.y,hp:knight.hp,round:b.round,support:surface(knight),phase:b.phase});
 const tick=()=>{e.tick(dt);app.missionTick(dt);ticks++; if(ticks>55000)throw Error('55 replay tick budget');};
 const near=(u,x,r)=>e.grounded(u)&&surface(u)==='arrival-core-terrace'&&Math.abs(u.x-x)<=r;
 function* action(id){const res=yield {kind:'interact',id,unit:e.active.id,round:b.round}; if(res){interacts++;path.push({id,round:b.round,x:e.active.x,goal:goal()});}return res;}
 function archer(){
  const a=e.active;if(a?.id!==id.archer||!alive(v)||!e.grounded(a))return false;
  for(let deg=2;deg<=80;deg+=2)for(let pow=.24;pow<=1.001;pow+=.02) if(e.predict(a,C.SKILLS.A01,deg,pow,v,true).unit===v.id&&e.fire('A01',deg,pow)){inputs++;fires++;return true;}
  return false;
 }
 function* turn(){
   const a=e.active,g=goal();if(!a)return false;
   if(a.id===id.occultist&&g?.binding==='frayed'&&near(a,2688,360)){
     const accepted=yield* action('rebind-bell');if(accepted){inputs++;return true;}
   }
   if(!archer()){inputs++;e.wait();}return true;
 }
 function* nextKn(){
   if(!e.canAct())return false;const sideEnd=b.teamEnds[1];yield* turn();
   for(let i=0;i<4200&&!(e.canAct()&&b.active===knight.id&&b.teamEnds[1]>sideEnd)&&!done();i++){if(b.side===0&&b.active!==knight.id&&e.canAct())yield* turn();tick();}
   return b.teamEnds[1]>sideEnd;
 }
 function* walk(){
  for(const [x,jump] of [[1200],[1456,true],[1560],[1888],[2688]]){
   let jumped=false,n=0;const d=Math.sign(x-knight.x),first=mark();
   while(d*(x-knight.x)>4&&n++<4200&&!done()){
    if(jump&&!jumped&&n>12&&e.grounded(knight))jumped=e.jump(knight);
    if(knight.moveLeft<15&&e.grounded(knight)&&e.canAct()&&b.side===0)yield* nextKn();
    if(e.canAct()&&b.side===0)e.move(d,dt);
    tick();
   }
   for(let i=0;i<420&&!e.grounded(knight)&&!done();i++)tick();
   path.push({waypoint:x,first,after:mark(),jumped});
   if(done()||Math.abs(x-knight.x)>24)break;
  }
 }
 const run=(function*(){
  yield* walk();
  const reached=!done()&&b.active===knight.id&&near(knight,2688,84)&&(yield* action('reach-bell'));
  if(!reached)throw Error('55 cannot reach bell: '+JSON.stringify({path,goal:goal()}));
  for(let i=0;i<12&&!done();i++){
   if(!alive(v)&&(yield* action('align-bell')))break;
   for(let k=0;k<42&&e.active===knight&&e.canAct()&&near(knight,2688,180)&&Math.abs(knight.x-2688)>12;k++){
     e.move(Math.sign(2688-knight.x),dt);tick();
   }
   yield* nextKn();
  }
  return {phase:b.phase,round:b.round,ticks,inputs,fires,interacts,path,goal:goal(),foes:b.units.filter(u=>u.side===1&&alive(u)).length,actors:p.map(u=>[u.id,u.cls,u.hp,u.focus,u.loadout])};
 })();
 return {next(ok){if(app.engine!==e)throw Error('Stage55 changed App');return run.next(ok);}};
}
