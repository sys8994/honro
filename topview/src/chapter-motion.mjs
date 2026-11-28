import {center} from './terrain.mjs';

const alive=u=>u&&!u.dead&&u.hp>0;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

// Story motion and escorted bodies use the same swept planar disk as player walking.
// Cinematics spend a distance budget, never a player's turn allowance.
export function installChapterMotion(product){
  function step(e,u,point,budget){
    if(budget<=0)return 0;
    const a=center(u),len=distance(a,point);if(len<.01)return 0;
    const travel=Math.min(len,budget),vx=(point.x-a.x)/len,vy=(point.y-a.y)/len;
    const dest=product.space.move(a,vx*travel,vy*travel,u.r,false),moved=distance(a,dest);
    if(moved<.001)return 0;
    u.x=dest.x;u.y=dest.y+u.h/2;u.tvStride=(u.tvStride||0)+moved;u.moving=.15;e.face(u,vx,vy);return moved;
  }
  function follow(e,u,goal,budget){
    if(!alive(u)||!goal||distance(center(u),goal)<2)return 0;
    if(!u.tvEscortPath?.length||!u.tvEscortGoal||distance(u.tvEscortGoal,goal)>26){
      u.tvEscortPath=product.space.route(center(u),goal,u.r);u.tvEscortGoal={...goal};
    }
    let traveled=0;
    while(budget>.01&&u.tvEscortPath.length){
      const p=u.tvEscortPath[0],n=step(e,u,p,budget);budget-=n;traveled+=n;
      if(distance(center(u),p)<2){u.tvEscortPath.shift();continue;}
      if(n<.01)delete u.tvEscortPath;
      break;
    }return traveled;
  }
  product.escortAdvance=(e,car,budget)=>{
    const route=product.space.map.convoy;
    if(!alive(car)||!route.length)return 0;
    car.tvConvoyStep??=0;
    while(car.tvConvoyStep<route.length-1&&distance(center(car),route[car.tvConvoyStep])<16)car.tvConvoyStep++;
    return follow(e,car,route[car.tvConvoyStep],budget);
  };
  product.carriageTurn=(e,u,q,dt)=>{
    const car=e.unit('objective'),b=e.b;if(!alive(car))return true;
    if(q.tvCarBudget==null){const threat=e.actors(1).some(v=>!v.honroObjectiveTarget&&distance(center(v),center(car))<690);
      q.tvCarBudget=threat||(b.honroState.carriagePauseUntilRound??-1)>=b.round?0:560;}
    const spent=product.escortAdvance(e,car,Math.min(q.tvCarBudget,dt*480));q.tvCarBudget-=spent;
    const at=center(car),target=product.space.free({x:at.x-78,y:at.y+40},u.r);
    if(target)follow(e,u,target,u.walkSpeed*dt);
    return q.tvCarBudget<2||distance(at,product.space.point('exit'))<24;
  };
  product.allyWalk=(e,u,q,dt)=>{
    const goal=e.unit(q.targetId),car=e.unit('objective'),friend=e.heroesAlive()[0],target=alive(goal)?goal:alive(car)?car:friend;
    if(!target)return true;
    const a=center(u),z=center(target),dist=distance(a,z),range=['healer','ritualist'].includes(u.allyRole)?390:u.allyRole==='guard'?145:690;
    if(dist<range+20||u.moveLeft<4)return true;
    const want={x:z.x+(a.x-z.x)*range/dist,y:z.y+(a.y-z.y)*range/dist};
    const p=product.space.free(want,u.r);if(!p)return true;
    const m=follow(e,u,p,Math.min(u.moveLeft,u.walkSpeed*dt));u.moveLeft-=m;return m<.01;
  };
  product.guideCarrier=(e,car,heroes,dt)=>{
    const exit=product.space.point('exit'),at=center(car);
    const escort=heroes.filter(u=>distance(center(u),at)<1450).sort((u,v)=>distance(center(u),exit)-distance(center(v),exit))[0];
    if(!escort)return;
    const h=center(escort),nearExit=distance(h,exit)<270;
    if(!nearExit&&distance(at,h)<110)return;
    const before={x:car.x,y:car.y};
    follow(e,car,nearExit?exit:h,dt*360);
    globalThis.HonroObjectiveContributions?.escort(e.b,'rescue-carrier',car,exit,[escort],before,0);
  };
  product.sodanWalk=(e,u,goal,dt)=>{follow(e,u,goal,310*dt);};
  product.bierRoute=app=>{
    const e=app.engine,u=e.unit('boss'),path=[],sites=product.space.map.convoy.slice(1);let a=center(u),len=0;
    for(const goal of sites){
      const route=product.space.route(a,goal,u.r);
      if(!route.length)return {blocked:[{kind:'route',id:'approach',label:'아래뜰로 꺾이는 통로'}]};
      for(const p of route){
        // Test narrow swept samples against actual occupants and lingering combat effects.
        const d=distance(a,p),n=Math.ceil(d/24);
        for(let i=1;i<=n;i++){
          const x=a.x+(p.x-a.x)*i/n,y=a.y+(p.y-a.y)*i/n;
          const blockers=globalThis.HonroStage8Bier.hazards(e.b,u,{x:x-u.r,y:y-u.h/2,w:u.r*2,h:u.h});
          if(blockers.length)return {blocked:blockers};
        }
        path.push({x:p.x,y:p.y+u.h/2});len+=d;a=p;
      }
    }
    return {points:path,distance:len,end:path.at(-1),targetVariant:'central-court',routeVersion:1};
  };
  product.bierStep=(e,u,target,budget)=>{
    const pose={...u},p={x:target.x,y:target.y-u.h/2};
    const moved=step(e,pose,p,budget);
    if(moved<.001&&distance(center(pose),p)>.15)return {blocked:[{kind:'terrain',id:'road',label:'아래뜰 통로'}]};
    const blockers=globalThis.HonroStage8Bier.hazards(e.b,u,{x:pose.x-u.r,y:pose.y-pose.h,w:u.r*2,h:pose.h});
    return blockers.length?{blocked:blockers}:{pose,distance:moved};
  };
  product.storyWalk=(app,u,to,dt,skip,speed)=>{
    const dest=product.space.free(to,u.r);if(!dest)return 'path-blocked';
    const len=distance(center(u),dest);if(len<3)return 'arrived';
    const n=follow(app.engine,u,dest,skip?product.space.width+product.space.height:speed*dt);
    return distance(center(u),dest)<3?'arrived':n<.01&&dt>0?'path-blocked':null;
  };
}
