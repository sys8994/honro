import {center} from './terrain.mjs';
import {direction,steerHeading,preciseTurnRate} from './space.mjs';
import {strikeVolume,sweptTorso} from './body.mjs';
const flying=u=>!!globalThis.HonroWorld.archetypes[u.honroVariant||u.honroType]?.flying;
const angleTo=(a,z)=>Math.atan2(a.y-z.y,z.x-a.x)*180/Math.PI;
export function spatialEngine(C,space,projection) {
  return class GroundEngine extends C.Engine {
    grounded(u){return !u.dead&&!u.airborne&&Math.hypot(u.vx||0,u.vy||0)<3&&space.legal(center(u),u.r,flying(u));}
    damageAim(u){return strikeVolume(u,projection);}
    velocity(u,s,angle,power){
      if(u.side!==0||u.summoned||s.cls!=='archer')return super.velocity(u,s,angle,power);
      const full=super.velocity(u,s,angle,1),factor=1.32*(.5+.5*Math.min(1,Math.max(0,power)));
      return {vx:full.vx*factor,vy:full.vy*factor};
    }
    refreshActivation(){
      if(!this.b.honroTopview)return super.refreshActivation();
      const allies=this.b.honroStage>1?this.b.units.filter(v=>!v.dead&&v.hp>0&&(v.side===0||v.honroAlly||v.id==='objective')):this.heroesAlive();
      for(const foe of this.actors(1)){
        if(foe.awake)continue;
        const a=center(foe);
        if(foe.honroObjectiveTarget)continue;
        foe.awake=foe.aggroUntil>=this.b.round||allies.some(hero=>{
          const z=center(hero),d=Math.hypot(a.x-z.x,a.y-z.y);
          return d<180||d<900&&!space.nearest(a,z,2,true);
        });
      }
    }
    combatEnemies(){
      const foes=super.combatEnemies();
      if(!this.b.honroTopview)return foes;
      const allies=this.b.honroStage>1?this.b.units.filter(v=>!v.dead&&v.hp>0&&(v.side===0||v.honroAlly||v.id==='objective')):this.heroesAlive();
      return foes.filter(foe=>foe.aggroUntil>=this.b.round||allies.some(hero=>Math.hypot(hero.x-foe.x,center(hero).y-center(foe).y)<1320));
    }
    damageDistance(u,p){const c=this.damageAim(u);return Math.hypot(c.x-p.x,c.y-p.y);}
    damageSweep(u,a,z,r){return sweptTorso(a,z,this.damageAim(u),r);}
    origin(u,angle,body=false){const c=body?center(u):this.damageAim(u),a=angle*Math.PI/180,reach=body?4:Math.min(u.r+4,32);return {x:c.x+Math.cos(a)*reach,y:c.y-Math.sin(a)*reach};}
    projectileOrigin(u,s,angle){
      const a=this.damageAim(u),z=this.origin(u,angle),h=s.phase==='terrain'||s.phase==='all'?null:space.nearest(a,z,3,true);
      return h?{x:h.x+h.n.x*.05,y:h.y+h.n.y*.05}:z;
    }
    collision(a,z,r,owner,hit=[],units=true,skip=[],terrain=true,projectile=false,attack){
      let h=terrain?space.nearest(a,z,r,projectile,skip):null;
      if(units) for(const u of this.b.units){
        if(u.dead||u.id===owner||hit.includes(u.id)||!this.attackAllows(u,owner,attack))continue;
        const q=this.damageSweep(u,a,z,r);
        if(q&&(!h||q.t<h.t))h={...q,unit:u};
      }
      return h;
    }
    bodyFlightCollision(u,a,z){return space.nearest(a,z,u.r);}
    face(u,dx,dy){
      if(Math.hypot(dx,dy)<1e-6)return;
      u.tvHeading=direction(dx,dy);u.angle=Math.atan2(-dy,dx)*180/Math.PI;u.facing=dx>=0?1:-1;
    }
    walkVector(u,dx,dy,dt){
      const winged=this.b.honroStage>1&&u&&C.flyingEnemy(u);
      if(!u||u.fixed&&!winged||u.dead||u.bound>0&&u.moveLeft<=0||u.meleeFollow==='ready')return 0;
      const d=direction(dx,dy),a=center(u),budget=Math.min(u.moveLeft,u.walkSpeed*dt);
      if(budget<=0)return 0;
      const z=space.move(a,d.x*budget,d.y*budget,u.r,flying(u)),travel=Math.hypot(z.x-a.x,z.y-a.y);
      if(travel<.001)return 0;
      if(winged&&!C.flightClear(this,u,{x:z.x,y:z.y+u.h*.5})&&C.flightClear(this,u,u))return 0;
      u.x=z.x;u.y=z.y+u.h*.5;u.moveLeft=Math.max(0,u.moveLeft-travel);u.moving=.14;
      u.tvStride=(u.tvStride||0)+travel;this.face(u,d.x,d.y);
      return travel;
    }
    moveVector(dx,dy,dt){if(!this.canAct())return;const u=this.active;delete u.tvPath;
      this.walkVector(u,dx,dy,dt);this.refreshActivation();}
    finishAction(...args){if(this.active)delete this.active.tvPath;return super.finishAction(...args);}
    fire(...args){const ok=super.fire(...args);if(ok&&this.active)delete this.active.tvPath;return ok;}
    move(){} // The app's native side-view key path is replaced by one planar input below.
    walk(u,d,dt){const v=u.tvEnemyBearing||{x:d,y:0};return this.walkVector(u,v.x,v.y,dt)>0;}
    jump(){return false;}
    canDrop(){return false;}
    travelToward(u,to,dt){
      const a=center(u);let path=u.tvPath;
      if(!path?.length){path=space.route(a,to,u.r,flying(u));u.tvPath=path;}
      const g=path[0];if(!g)return false;
      const d=Math.hypot(g.x-a.x,g.y-a.y);
      if(d<=3){path.shift();return true;}
      const moved=this.walkVector(u,g.x-a.x,g.y-a.y,Math.min(dt,d/u.walkSpeed));
      if(moved<.01||d-moved<3)path.shift();return moved>.01;
    }
    integrateBody(u,dt){
      if(Math.hypot(u.vx||0,u.vy||0)<2){u.vx=u.vy=0;u.jumping=false;return false;}
      const a=center(u),z=space.move(a,u.vx*dt,u.vy*dt,u.r,flying(u)),damp=Math.exp(-9*dt);
      u.vx=Math.abs(z.x-a.x)<.001?0:u.vx*damp;u.vy=Math.abs(z.y-a.y)<.001?0:u.vy*damp;
      u.x=z.x;u.y=z.y+u.h*.5;u.jumping=false;return true;
    }
    tick(dt){
      const product=globalThis.HonroTopview,app=globalThis.HonroApp;
      if(app?.engine===this){const turn=this.b.round+'|'+this.b.active;
        if(this.controlTurn!==undefined&&this.controlTurn!==turn)app.cancelInput();this.controlTurn=turn;
      }
      if(this.canAct()&&app?.engine===this&&app.canInput()){
        const u=this.active,keys=product.controls,dx=keys.x,dy=keys.y;
        const locked=this.b.tvMoveLocked||keys.shift;
        if(dx||dy){
          const want=projection.inverse(dx,dy),prev=u.tvHeading||want;
          const steer=keys.source==='keyboard'&&(locked||app.charging||u.moving>0);
          const v=steer?steerHeading(prev,want,projection,(locked||app.charging?preciseTurnRate:7.8)*dt):want;
          delete u.tvPath;this.face(u,v.x,v.y);
          if(!locked&&!app.charging)this.moveVector(v.x,v.y,dt*Math.min(1,Math.hypot(dx,dy)));
        }else if(!locked&&!app.charging&&u.tvPath?.length&&u.moveLeft>0)this.travelToward(u,u.tvPath.at(-1),dt);
      }
      super.tick(dt);
    }
    bestShot(u,s,target){
      const a=this.damageAim(u),t=this.damageAim(target),base=angleTo(a,t);let best=null;
      for(const delta of [0,-3,3,-8,8]){const angle=base+delta,power=.78;
        const hit=this.predict(u,s,angle,power,target,false);
        const error=Math.hypot(hit.x-t.x,hit.y-t.y);
        if(!best||error<best.error)best={angle,power,error,hit,score:1000-error};
        if(error<=target.r+8)break;
      }
      return best;
    }
    enemyAction(){
      const b=this.b,u=this.active;if(!u||u.dead||u.aiAim||u.enemyEffectCast||u.enemyEffectRecovery)return super.enemyAction();
      if(b.turnAge<.22)return;
      if(b.honroStage>1&&C.monsterTurn(this,u))return;
      const t=(b.honroStage>1&&(C.monsterPriorityTarget(this,u)||C.targetFor(this,u)))||this.heroesAlive().sort((a,c)=>this.damageDistance(a,this.damageAim(u))-this.damageDistance(c,this.damageAim(u)))[0];
      if(!t)return this.checkEnd();
      const a=center(u),z=center(t),d=Math.hypot(z.x-a.x,z.y-a.y),v=direction(z.x-a.x,z.y-a.y);
      const available=(u.loadout||[]).map(id=>C.SKILLS[id]).filter(s=>s&&!s.passive&&this.manaCost(s,u)<=u.focus);
      if(!available.length){u.intent='기력 회복';this.finishAction();return;}
      const skill=available[(b.round+u.id.length)%available.length],melee=skill.mode.startsWith('beast');
      const blocked=space.nearest(a,z,3,true);
      if((d>(melee?u.r+t.r+20:820)||blocked)&&u.moveLeft>3){
        if(!this.travelToward(u,z,1/120)){u.intent='사선 찾기';this.finishAction();}
        return;
      }
      delete u.tvPath;u.tvEnemyBearing=v;u.tvHeading=v;u.facing=v.x>=0?1:-1;
      if(blocked||(melee?d>u.r+t.r+34:d>900)){u.intent='길목 경계';this.finishAction();return;}
      const shot=melee?{angle:angleTo(a,z),power:.7}:this.bestShot(u,skill,t);
      u.aiAim={skill:skill.id,angle:shot.angle,power:shot.power,age:0,targetId:t.id};
      u.intent=skill.name+' · 준비';this.emit('change');
    }
  };
}
