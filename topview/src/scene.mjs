import {center} from './terrain.mjs';
import {fieldLandscape} from './landscape.mjs';
import {sceneryParts,drawScenery} from './canopy.mjs';
import {cameraView,defaultZoom} from './space.mjs';
import {actorBody,bowPlane} from './body.mjs';
import {fieldActors,fieldBreeze,drawWoodArrow} from './field-art.mjs';

export function groundScene(Base, space, images, projection, field) {
  const {map,cell}=space;
  const props=map.objects.map(o=>({...o,x:o.x*cell,y:o.y*cell}));
  const scenery=props.map(o=>{const at=projection.forward(o.x,o.y);return {o,at,parts:sceneryParts(o,at,images).filter(p=>!o.deck||p.part!=='base')};});
  const breeze=fieldBreeze(map), worldScale=projection.forward(1,1);
  return class TopviewScene extends Base {
    constructor(canvas){super(canvas);this.landscape=fieldLandscape(canvas,map,field);this.zoomLevel=defaultZoom;this.panOffset={x:0,y:0};this.fieldFocus={x:field.width/2,y:field.height/2};this.departures=new Map();this.actorArt=fieldActors(images,projection);this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');}
    event(ev){
      if(ev.type!=='fx'||ev.damage>0&&ev.targetId)return super.event(ev);
      const p=projection.forward(ev.x,ev.y),end=Number.isFinite(ev.x2)?projection.forward(ev.x2,ev.y2):null;
      const projected={...ev,...p,y:p.y-bowPlane,size:ev.name==='text'?ev.size:ev.size*.45,...(end?{x2:end.x,y2:end.y}:{})};
      super.event(projected);
    }
    world(x,y){const {w:width,h:height}=this.viewport??this.size(),k=this.zoomLevel;
      return projection.inverse((x-width*.5)/k+this.cx,(y-height*.5)/k+this.cy);}
    screenPoint(x,y){const p=projection.forward(x,y),{w:width,h:height}=this.viewport??this.size();
      return {x:(p.x-this.cx)*this.zoomLevel+width*.5,y:(p.y-this.cy)*this.zoomLevel+height*.5};}
    pickScreenUnit(point,padding=2,actors=this.visibleActors){
      if(!actors?.length)return null;
      const world=this.world(point.x,point.y),p=projection.forward(world.x,world.y);
      for(let i=actors.length-1;i>=0;i--){
        const {art,at,u}=actors[i];
        if(!u.dead&&!u.eaterCapturedBy&&this.actorArt.hit(art,p.x-at.x,p.y-at.y,padding/this.zoomLevel))return u;
      }
      return null;
    }
    damageNumberAnchor(u,ev){
      if(!u){const p=this.screenPoint(ev.x,ev.y);return {x:p.x,y:p.y-bowPlane*this.zoomLevel};}
      const b=actorBody(u),foot=center(u),p=this.screenPoint(foot.x,foot.y);
      return {x:p.x,y:p.y-(b.size+b.lift+4)*this.zoomLevel};
    }
    placeCamera(x,y,zoom=this.zoomLevel,rememberPan=true){
      const {w,h}=this.viewport??this.size(),v=cameraView(field.width,field.height,w,h,zoom,x,y);
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
      this.lastEngine=e;const c=this.ctx,b=e.b,{w,h,d:dpr}=this.viewport=this.size(b);
      const hero=(e.active?.side===0&&!e.active.dead?e.active:null)||b.units.find(u=>!u.side&&!u.dead)||b.units[0];
      const focus=this.storyFrozen&&this.tvStory?this.tvStory:center(hero),p=projection.forward(focus.x,focus.y);
      this.fieldFocus=p;this.placeCamera(p.x+this.panOffset.x,p.y+this.panOffset.y,this.zoomLevel,false);const k=this.zoomLevel;
      this.x=focus.x;this.y=focus.y;
      this.landscape.place(this.cx,this.cy,k,w,h);
      c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
      c.translate(w*.5-this.cx*k,h*.5-this.cy*k);c.scale(k,k);
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
      for(const m of b.honroMarkers.filter(m=>m.type==='exit'||m.type==='rest'&&!m.collected)){
        const a=paintPoint(m);ring(a,m.type==='exit'?19:8,m.type==='exit'?'#eed38b':'#e3a35a','#d8b66628');
        if(m.type==='exit')label({x:a.x,y:a.y-9},m.label,'#f0d999');
      }
      if(map.meta.stage){
        for(const m of b.honroMarkers){
          if(m.collected||!m.action||m.action==='climbSite')continue;
          const target=m.target&&b.units.find(u=>u.id===m.target);if(target?.dead)continue;
          const a=paintPoint(target?center(target):m);
          ring(a,12,'#cbb67b','#b1964925');label({x:a.x,y:a.y+17},m.label||m.id,'#e0cda0');
        }
        if([2,6,10].includes(b.honroStage)){
          const a=paintPoint(space.point('exit'));ring(a,22,'#d2c090','#998b4724');
          label({x:a.x,y:a.y-12},({2:'나루로 가는 길',6:'북문 쉼터',10:'동쪽 외문'})[b.honroStage],'#dfc996');
        }
        if(b.honroStage===5){
          const course=b.tvWaterCourses?.[b.honroState.waterfallSight?'opened':'closed'];
          if(course){
            const vertices=course.map(paintPoint),ribbon=new Path2D();
            vertices.forEach((p,i)=>i?ribbon.lineTo(p.x,p.y):ribbon.moveTo(p.x,p.y));ribbon.closePath();
            c.save();c.clip(ribbon);c.fillStyle='#8cbdc35e';c.fill(ribbon);c.lineCap='round';
            const [a,bend,base,right,bendR,end]=vertices,lerp=(p,q,t)=>({x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t});
            for(let n=0;n<18;n++){
              const t=(n+.5)/18,top=lerp(a,end,t),mid=lerp(bend,bendR,t),foot=lerp(base,right,t);
              c.beginPath();c.moveTo(top.x,top.y);c.quadraticCurveTo(mid.x,mid.y,foot.x,foot.y);
              c.lineWidth=n%3?.65:1.3;c.strokeStyle=n%3?'#c3dee23d':'#d1e8e95e';c.stroke();
              c.lineWidth=.7+.65*Math.sin(n*8.2)**2;c.strokeStyle='#c3e5e65c';
              c.setLineDash([4+(n*17)%23,12+(n*23)%32]);c.lineDashOffset=-time*(36+n%5*5)-n*n*3;c.stroke();c.setLineDash([]);
            }c.restore();
          }
        }
      }
      const wind=!map.meta.stage&&space.point('crosswind');
      for(let i=0;wind&&i<5;i++){const a={x:wind.x+(i-2)*.54*cell,y:wind.y+(i%2)*50};
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
      this.visibleActors=actors.sort((a,b)=>a.depth-b.depth);
      this.hoverUnitId=this.mousePoint&&!this.uiBlocked?.()?this.pickScreenUnit(this.mousePoint,2,actors)?.id:null;
      const cursor=this.hoverUnitId?'pointer':'';if(this.canvas.style.cursor!==cursor)this.canvas.style.cursor=cursor;
      for(const item of actors)this.actorArt.shadow(c,item.art,item.at,item.body);
      // Two short ground marks bracket the active companion's boots. Scenery
      // covers them at the same depth as the feet. Projectile targets use no ring.
      const active=actors.find(item=>item.u.id===b.active&&item.u.side===0);
      if(active&&!this.storyFrozen){
        const {at}=active;
        drawables.push({depth:at.y-.2,draw(){
          c.save();c.lineWidth=1.2;c.strokeStyle='#dfc584c4';
          for(const angle of [-.52,Math.PI-.52]){
            c.beginPath();c.ellipse(at.x,at.y,12,4.7,0,angle,angle+1.04);c.stroke();
          }
          c.restore();
        }});
      }
      drawables.sort((a,b)=>a.depth-b.depth);for(const item of drawables)item.draw();
      this.landscape.grade(globalThis.HonroTimeOfDay?.grade(this,b)?.g);
      for(const {at,body,u,art,depth} of actors){
        const near=visibleParts.filter(part=>part.depth>depth&&part.x<at.x+body.size*.58&&part.x+part.width>at.x-body.size*.58&&part.y<at.y&&part.y+part.height>at.y-body.size-body.lift);
        this.actorArt.outline(c,art,at,body,near,u.side!==1,time,this.hoverUnitId===u.id||this.inspectUnitId===u.id);
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
