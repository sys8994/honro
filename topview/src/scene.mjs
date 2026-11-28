import {center} from './terrain.mjs';
import {buildGround,bakePropShadows} from './ground.mjs';
import {sceneryParts,drawScenery} from './canopy.mjs';
import {cameraView} from './space.mjs';
import {actorBody,bowPlane} from './body.mjs';
import {fieldActors,fieldBreeze,drawWoodArrow} from './field-art.mjs';

export function groundScene(Base, space, images, projection) {
  const {map,cell}=space;
  const ground=buildGround(map,id=>images.get(id+'_texture'));
  const props=map.objects.map(o=>({...o,x:o.x*cell,y:o.y*cell}));
  bakePropShadows(ground,props,images,projection);
  const scenery=props.map(o=>{const at=projection.forward(o.x,o.y);return {o,at,parts:sceneryParts(o,at,images)};});
  const breeze=fieldBreeze(map), worldScale=projection.forward(1,1);
  const drawImage=(ctx,img,x,y,h,flip=false)=>{
    const w=h*img.width/img.height;ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.drawImage(img,-w/2,-h,w,h);ctx.restore();
  };
  return class TopviewScene extends Base {
    constructor(canvas){super(canvas);this.zoomLevel=1.4;this.panOffset={x:0,y:0};this.fieldFocus={x:ground.width/2,y:ground.height/2};this.departures=new Map();this.actorArt=fieldActors(images,projection);this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');}
    event(ev){
      if(ev.type!=='fx'||ev.damage>0&&ev.targetId)return super.event(ev);
      const p=projection.forward(ev.x,ev.y),end=Number.isFinite(ev.x2)?projection.forward(ev.x2,ev.y2):null;
      const projected={...ev,...p,y:p.y-bowPlane,size:ev.name==='text'?ev.size:ev.size*.45,...(end?{x2:end.x,y2:end.y}:{})};
      super.event(projected);
    }
    world(x,y){const r=this.canvas.getBoundingClientRect(),k=this.zoomLevel;
      return projection.inverse((x-r.width*.5)/k+this.cx,(y-r.height*.5)/k+this.cy);}
    screenPoint(x,y){const p=projection.forward(x,y),r=this.canvas.getBoundingClientRect();
      return {x:(p.x-this.cx)*this.zoomLevel+r.width*.5,y:(p.y-this.cy)*this.zoomLevel+r.height*.5};}
    damageNumberAnchor(u,ev){
      if(!u){const p=this.screenPoint(ev.x,ev.y);return {x:p.x,y:p.y-bowPlane*this.zoomLevel};}
      const b=actorBody(u),foot=center(u),p=this.screenPoint(foot.x,foot.y);
      return {x:p.x,y:p.y-(b.size+b.lift+4)*this.zoomLevel};
    }
    placeCamera(x,y,zoom=this.zoomLevel,rememberPan=true){
      const r=this.canvas.getBoundingClientRect(),v=cameraView(ground.width,ground.height,r.width,r.height,zoom,x,y);
      this.cx=v.x;this.cy=v.y;this.scale=this.zoomLevel=v.zoom;if(rememberPan)this.panOffset={x:v.x-this.fieldFocus.x,y:v.y-this.fieldFocus.y};
    }
    pan(x,y){this.placeCamera(this.cx+x,this.cy+y);}
    centerAt(x,y){const p=projection.forward(x,y);this.placeCamera(p.x,p.y);}
    zoom(f,x,y){const before=this.world(x,y);this.placeCamera(this.cx,this.cy,this.zoomLevel*f);
      const after=this.world(x,y),d=projection.forward(before.x-after.x,before.y-after.y);this.pan(d.x,d.y);}
    storyFocusPoint(x,y){this.tvStory={x,y};}
    storyFocus(id){const u=this.lastEngine?.unit(id);if(u)this.tvStory=center(u);}
    storyRelease(){this.tvStory=null;}
    focusUnit(id,duration,speaker){if(speaker)this.storyFocus(id);}
    render(e,dt,selected,power,charging){
      this.lastEngine=e;const c=this.ctx,b=e.b,{w,h,d:dpr}=this.size(b);
      const hero=b.units.find(u=>!u.side&&!u.dead)||b.units[0];
      const focus=this.storyFrozen&&this.tvStory?this.tvStory:center(hero),p=projection.forward(focus.x,focus.y);
      this.fieldFocus=p;this.placeCamera(p.x+this.panOffset.x,p.y+this.panOffset.y,this.zoomLevel,false);const k=this.zoomLevel;
      this.x=focus.x;this.y=focus.y;
      c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#202d27';c.fillRect(0,0,w,h);
      c.translate(w*.5-this.cx*k,h*.5-this.cy*k);c.scale(k,k);
      c.drawImage(ground,0,0);
      const time=this.reducedMotion.matches?0:this.time;
      const view={x:this.cx-w/(2*k),right:this.cx+w/(2*k),y:this.cy-h/(2*k),bottom:this.cy+h/(2*k)};
      breeze(c,time,view);
      const paintPoint=(v)=>projection.forward(v.x,v.y);
      const ring=(p,rx,color,fill)=>{c.beginPath();c.ellipse(p.x,p.y,rx,rx*.52,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}c.strokeStyle=color;c.lineWidth=1.25;c.stroke();};
      const label=(p,text,color)=>{c.font='600 10px sans-serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#17221eef';c.strokeText(text,p.x,p.y);c.fillStyle=color;c.fillText(text,p.x,p.y);};
      const line=(pts,color,width=1.5,dash=[])=>{if(!pts.length)return;c.beginPath();c.setLineDash(dash);pts.forEach((v,i)=>{const a=paintPoint(v);if(i)c.lineTo(a.x,a.y);else c.moveTo(a.x,a.y);});c.strokeStyle=color;c.lineWidth=width;c.stroke();c.setLineDash([]);};
      const drawables=[],visibleParts=[],actors=[];
      for(const {o,at,parts} of scenery){
        if(Math.abs(at.x-this.cx)>w/(2*k)+o.width||Math.abs(at.y-this.cy)>h/(2*k)+o.height)continue;
        for(const part of parts){visibleParts.push(part);drawables.push({depth:part.depth,draw(){drawScenery(c,part,time);}});}
      }
      for(const [id,img] of [['cart','cart']]){
        const a=paintPoint(space.point(id));drawables.push({depth:a.y,draw(){drawImage(c,images.get(img),a.x,a.y,76);}});
      }
      for(const m of b.honroMarkers.filter(m=>m.type==='exit'||m.type==='rest'&&!m.collected)){
        const a=paintPoint(m);ring(a,m.type==='exit'?19:8,m.type==='exit'?'#eed38b':'#e3a35a','#d8b66628');
        if(m.type==='exit')label({x:a.x,y:a.y-9},m.label,'#f0d999');
      }
      const wind=space.point('crosswind');
      for(let i=0;i<5;i++){const a={x:wind.x+(i-2)*.54*cell,y:wind.y+(i%2)*50};
        line([a,{x:a.x-50,y:a.y+145}],'#b6e4c7a6',1.5,[4,3]);}
      for(const u of b.units){
        if(u.dead&&!this.departures.has(u.id))this.departures.set(u.id,this.time);
        if(!u.dead)this.departures.delete(u.id);
        const elapsed=u.dead?this.time-this.departures.get(u.id):0;if(elapsed>1.45)continue;
        const p=center(u),at=paintPoint(p),body=actorBody(u);
        if(at.x<view.x-60||at.x>view.right+60||at.y<view.y-10||at.y>view.bottom+100)continue;
        const art=this.actorArt.frame(u,charging,b.active===u.id,time);
        const visible=u.dead?Math.max(0,Math.min(1,(1.45-elapsed)/.6)):1;
        const hit=this.hitFlashVisible(u)?(this.reducedMotion.matches ? .38 : .24+.55*(.5+.5*Math.cos(u.hurt*23))):0;
        const entry={depth:at.y,at,body,u,art};
        if(!u.dead)actors.push(entry);
        drawables.push({depth:at.y,draw:()=>{
          c.save();c.globalAlpha=visible;this.actorArt.actor(c,art,at,hit);c.restore();
        }});
      }
      for(const item of actors)this.actorArt.shadow(c,item.art,item.at,item.body);
      drawables.sort((a,b)=>a.depth-b.depth);for(const item of drawables)item.draw();
      c.save();c.setTransform(dpr,0,0,dpr,0,0);
      const clock=globalThis.HonroTimeOfDay,grade=clock?.grade(this,b);
      if(grade?.g)clock.apply(c,w,h,{...grade.g,hor:null},1);
      c.restore();
      for(const {at,body,u,art,depth} of actors){
        const near=visibleParts.filter(part=>part.depth>depth&&part.x<at.x+body.size*.58&&part.x+part.width>at.x-body.size*.58&&part.y<at.y&&part.y+part.height>at.y-body.size-body.lift);
        this.actorArt.outline(c,art,at,body,near,u.side!==1,time);
        if(u.side===0||u.awake||u.hurt>0){
          const y=at.y-body.size-body.lift-6;c.fillStyle='#19211de0';c.fillRect(at.x-15,y,30,3);
          c.fillStyle=u.side===0?'#a5bd85':'#bd806e';c.fillRect(at.x-15,y,30*Math.max(0,u.hp/u.maxHp),3);
        }
      }
      const u=e.active,sk=globalThis.HONRO_CORE.SKILLS[selected];
      if(e.canAct()&&sk&&!this.storyFrozen){
        const a=center(u),targetPower=charging?power:(u.lastPower??power);
        this.pred=globalThis.HONRO_CORE.guidePrediction(e,u,sk,targetPower);
        c.save();c.translate(0,-bowPlane);c.scale(worldScale.x,worldScale.y);
        this.arcFx.time=this.time;this.arcFx.scale=k*Math.sqrt(worldScale.x*worldScale.y);
        this.arcFx.predictionGuide(c,e,u,selected,power,charging);
        c.restore();
        if(u.tvPath?.length)line([a,...u.tvPath],'#a4d8ae',1.2,[2,4]);
      }
      for(const shot of b.projectiles){
        const v=projection.forward(shot.vx,shot.vy),pos=paintPoint(shot);
        pos.y-=bowPlane;
        if(!shot.body&&['A01','A14'].includes(shot.skill)){drawWoodArrow(c,pos,v);continue;}
        const q={...shot,...pos,vx:v.x,vy:v.y,trail:(shot.trail||[]).map(point=>{const p=paintPoint(point);p.y-=bowPlane;return p;})};
        if(this.arcFx){this.arcFx.time=this.time;this.arcFx.scale=k;if(q.body)this.arcFx.bodyTrail(c,q);else this.arcFx.projectile(c,q);}
        else this.projectile(c,q);
      }
      if(this.arcFx)this.arcFx.worldFx(c,dt,false,dt);
      else{for(const f of this.effects){f.life+=dt;this.effect(c,f);}this.effects=this.effects.filter(f=>f.life<(f.name==='text'?1.6:.9));}
      this.drawDamageNumbers(e);
      this.time+=dt;
    }
  };
}
