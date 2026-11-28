import {center} from './terrain.mjs';
import {buildGround} from './ground.mjs';
import {extendGround} from './border.mjs';

export function groundScene(Base, space, images, projection) {
  const {map,cell}=space;
  const apron=extendGround(map),ground=buildGround(apron.map,id=>images.get(id+'_texture'));
  const props=[...map.objects,...apron.props].map(o=>({...o,x:o.x*cell,y:o.y*cell}));
  const sizes={hound:42,boar:51,stag:67,crow:46,bat:45,ghost:49,woodcutter:49,cart:76};
  const drawImage=(ctx,img,x,y,h,flip=false)=>{
    const w=h*img.width/img.height;ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.drawImage(img,-w/2,-h,w,h);ctx.restore();
  };
  return class TopviewScene extends Base {
    constructor(canvas){super(canvas);this.zoomLevel=1.45;this.panOffset={x:0,y:0};this.tvEffects=[];}
    event(ev){
      if(ev.type!=='fx')return;
      const p=projection.forward(ev.x,ev.y),end=Number.isFinite(ev.x2)?projection.forward(ev.x2,ev.y2):null;
      const projected={...ev,...p,size:ev.name==='text'?ev.size:ev.size*.45,...(end?{x2:end.x,y2:end.y}:{})};
      super.event(projected);
    }
    world(x,y){const r=this.canvas.getBoundingClientRect(),k=this.zoomLevel;
      return projection.inverse((x-r.width*.5)/k+this.cx,(y-r.height*.44)/k+this.cy);}
    screenPoint(x,y){const p=projection.forward(x,y),r=this.canvas.getBoundingClientRect();
      return {x:(p.x-this.cx)*this.zoomLevel+r.width*.5,y:(p.y-this.cy)*this.zoomLevel+r.height*.44};}
    zoom(f,x,y){const before=this.world(x,y);this.zoomLevel=Math.min(3.2,Math.max(.52,this.zoomLevel*f));
      const after=this.world(x,y),d=projection.forward(before.x-after.x,before.y-after.y);this.panOffset.x+=d.x;this.panOffset.y+=d.y;}
    storyFocusPoint(x,y){this.tvStory={x,y};}
    storyFocus(id){const u=this.lastEngine?.unit(id);if(u)this.tvStory=center(u);}
    storyRelease(){this.tvStory=null;}
    focusUnit(id,duration,speaker){if(speaker)this.storyFocus(id);}
    render(e,dt,selected,power,charging){
      this.lastEngine=e;const c=this.ctx,b=e.b,cv=this.canvas,r=cv.getBoundingClientRect(),w=r.width,h=r.height,dpr=Math.min(2,devicePixelRatio||1);
      if(!w||!h)return;
      if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}
      const hero=b.units.find(u=>!u.side&&!u.dead)||b.units[0];
      const focus=this.overview?{x:space.width/2,y:space.height/2}:this.storyFrozen&&this.tvStory?this.tvStory:center(hero),p=projection.forward(focus.x,focus.y),k=this.zoomLevel;
      this.cx=p.x+this.panOffset.x;this.cy=p.y+this.panOffset.y;this.x=focus.x;this.y=focus.y;this.scale=k;
      c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#202d27';c.fillRect(0,0,w,h);
      c.translate(w*.5-this.cx*k,h*.44-this.cy*k);c.scale(k,k);
      c.drawImage(ground.image,ground.left,ground.top-apron.offset);
      const paintPoint=(v)=>projection.forward(v.x,v.y);
      const ring=(p,rx,color,fill)=>{c.beginPath();c.ellipse(p.x,p.y,rx,rx*.52,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}c.strokeStyle=color;c.lineWidth=1.25;c.stroke();};
      const label=(p,text,color)=>{c.font='600 10px sans-serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#17221eef';c.strokeText(text,p.x,p.y);c.fillStyle=color;c.fillText(text,p.x,p.y);};
      const line=(pts,color,width=1.5,dash=[])=>{if(!pts.length)return;c.beginPath();c.setLineDash(dash);pts.forEach((v,i)=>{const a=paintPoint(v);if(i)c.lineTo(a.x,a.y);else c.moveTo(a.x,a.y);});c.strokeStyle=color;c.lineWidth=width;c.stroke();c.setLineDash([]);};
      const drawables=[];
      for(const o of props){const at=paintPoint(o);if(Math.abs(at.x-this.cx)>w/(2*k)+o.width||at.y<this.cy-h*.44/k-o.height||at.y>this.cy+h*.56/k+o.height)continue;drawables.push({depth:o.groundDecoration||o.asset==='bridge'?-1e6:at.y,draw(){
        const img=images.get(o.asset);const player=paintPoint(center(hero));c.save();
        if(at.y>player.y&&at.y-o.height<player.y&&Math.abs(at.x-player.x)<o.width*.31)c.globalAlpha=.47;
        c.drawImage(img,at.x-o.width*o.anchor[0],at.y-o.height*o.anchor[1],o.width,o.height);c.restore();
      }});}
      for(const [id,img] of [['cart','cart']]){
        const a=paintPoint(space.point(id));drawables.push({depth:a.y,draw(){drawImage(c,images.get(img),a.x,a.y,sizes[img]);}});
      }
      for(const m of b.honroMarkers.filter(m=>m.type==='exit'||m.type==='rest'&&!m.collected)){
        const a=paintPoint(m);ring(a,m.type==='exit'?19:8,m.type==='exit'?'#eed38b':'#e3a35a','#d8b66628');
        if(m.type==='exit')label({x:a.x,y:a.y-9},m.label,'#f0d999');
      }
      const wind=space.point('crosswind');
      for(let i=0;i<5;i++){const a={x:wind.x+(i-2)*.54*cell,y:wind.y+(i%2)*50};
        line([a,{x:a.x-50,y:a.y+145}],'#b6e4c7a6',1.5,[4,3]);}
      for(const u of b.units.filter(u=>!u.dead)){
        const p=center(u),at=paintPoint(p),flying=['crow','bat'].includes(u.honroVariant||u.honroType);
        drawables.push({depth:at.y,draw:()=>{
          const ally=!u.side,hd=u.tvHeading||{x:1,y:0},face=projection.forward(hd.x,hd.y);
          ring(at,ally?10:Math.max(7,u.r*.27),ally?'#d8c585':u.awake?'#af6257':'#4d635b','#17251d62');
          let ah=48;
          if(ally){const sheet=images.get('seolo'),a=Math.atan2(face.x,face.y),row=(8-Math.round(a/(Math.PI/4))+8)%8;
            const frame=u.moving>0?Math.floor((u.tvStride||0)/45)%4:0;
            c.drawImage(sheet,frame*144,row*168,144,168,at.x-23,at.y-51,46,53);
          }else{
            const kind=u.id==='npc-woodcutter'?'woodcutter':u.honroVariant||u.honroType,img=images.get(kind);
            if(!img)throw Error('Missing actor image '+kind);
            ah=sizes[kind]||45;drawImage(c,img,at.x,at.y-(flying?12:0),ah,face.x<0);
          }
          if(ally||u.awake||u.hurt>0){
            const y=at.y-ah-(flying?15:6);c.fillStyle='#19211de0';c.fillRect(at.x-15,y,30,3);c.fillStyle=ally?'#a5bd85':'#bd806e';c.fillRect(at.x-15,y,30*Math.max(0,u.hp/u.maxHp),3);
          }
        }});
      }
      drawables.sort((a,b)=>a.depth-b.depth);for(const item of drawables)item.draw();
      const u=e.active,sk=globalThis.HONRO_CORE.SKILLS[selected];
      if(e.canAct()&&sk&&!this.storyFrozen){
        const a=center(u),ang=u.angle,targetPower=charging?power:(u.lastPower||.62);
        const key=[u.id,u.x,u.y,ang,targetPower.toFixed(2),selected,b.sceneVersion,b.shot,b.round,b.physics.revision].join('|');
        if(this.predKey!==key){this.predKey=key;this.pred=e.predict(u,sk,ang,targetPower);}
        const pred=this.pred;if(pred){line([a,...pred.points],'#f2dea8ce',1.25,[4,4]);ring(paintPoint(pred),4,'#ffe4ac');}
        if(u.tvPath?.length)line([a,...u.tvPath],'#a4d8ae',1.2,[2,4]);
      }
      for(const shot of b.projectiles){
        const v=projection.forward(shot.vx,shot.vy),pos=paintPoint(shot);
        const q={...shot,...pos,vx:v.x,vy:v.y,trail:(shot.trail||[]).map(paintPoint)};
        if(this.arcFx){this.arcFx.time=this.time;this.arcFx.scale=k;if(q.body)this.arcFx.bodyTrail(c,q);else this.arcFx.projectile(c,q);}
        else this.projectile(c,q);
      }
      if(this.arcFx)this.arcFx.worldFx(c,dt,false,dt);
      else{for(const f of this.effects){f.life+=dt;this.effect(c,f);}this.effects=this.effects.filter(f=>f.life<(f.name==='text'?1.6:.9));}
      this.time+=dt;
    }
  };
}
