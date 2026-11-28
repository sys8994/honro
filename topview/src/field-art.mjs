import {paintSprite,angleRow,poseOf} from './actors.mjs';
import {actorBody} from './body.mjs';
import {drawScenery} from './canopy.mjs';
import {riverPath} from './ground.mjs';

function surface(w=160,h=160){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
const span=100,pad=88,sample=1.6;
function stamp(ctx,canvas,x,y){ctx.drawImage(canvas,x-span/2,y-pad,span,span);}
function silhouette(ctx,image,color){
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.drawImage(image,0,0);
  ctx.globalCompositeOperation='source-in';ctx.fillStyle=color;ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.globalCompositeOperation='source-over';
}
export function fieldActors(images,projection){
  const actors=new Map(),clip=surface(),ring=surface(),flash=surface();
  const rimOffsets=[[-2,0],[2,0],[0,-2],[0,2],[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]];
  function frame(u,charging,active,time){
    let item=actors.get(u.id);
    if(!item){
      item={art:surface(),ink:surface(),phase:[...u.id].reduce((n,c)=>(n*31+c.charCodeAt(0))%1009,0)/181};actors.set(u.id,item);
    }
    const b=actorBody(u),heading=u.tvHeading||{x:1,y:0},v=projection.forward(heading.x,heading.y);
    const row=angleRow(v.x,v.y),pose=poseOf(u,charging,active),stride=u.tvStride||0;
    const animation=pose==='idle'?Math.floor((time+item.phase)*14):pose==='walk'?Math.floor(stride/8):0;
    const key=[row,pose,animation,b.kind].join('|');
    if(item.key!==key){
      item.key=key;const c=item.art.getContext('2d');c.clearRect(0,0,160,160);c.save();c.scale(sample,sample);
      paintSprite(c,images,b.kind,pose,row,stride,span/2,pad-b.lift,b.size,animation/14);c.restore();
      silhouette(item.ink.getContext('2d'),item.art,'#0d1819');
    }
    return item;
  }
  function hit(item,dx,dy,tolerance){
    const x=Math.round((dx+span/2)*sample),y=Math.round((dy+pad)*sample);
    const r=Math.ceil(tolerance*sample),w=item.art.width,h=item.art.height;
    if(x<-r||y<-r||x>=w+r||y>=h+r)return false;
    if(item.maskPose!==item.key){
      item.alpha=item.art.getContext('2d').getImageData(0,0,w,h).data;item.maskPose=item.key;
    }
    for(let j=Math.max(0,y-r);j<Math.min(h,y+r+1);j++)for(let i=Math.max(0,x-r);i<Math.min(w,x+r+1);i++){
      if((i-x)**2+(j-y)**2<=r*r&&item.alpha[4*(j*w+i)+3]>=78)return true;
    }
    return false;
  }
  function shadow(c,item,at,b){
    c.save();c.translate(at.x+1+b.lift*.46,at.y+.7+b.lift*.23);
    c.fillStyle=b.lift?'#14221f48':'#101a1acf';c.beginPath();c.ellipse(0,0,b.rx*.91,Math.max(2.2,b.rx*.32),0,0,2*Math.PI);c.fill();
    c.globalAlpha=b.lift ? .38 : .56;c.transform(.77,.06,-.46,-.23,0,0);stamp(c,item.ink,0,0);c.restore();
  }
  function actor(c,item,at,hit){
    stamp(c,item.art,at.x,at.y);
    if(hit>0){
      silhouette(flash.getContext('2d'),item.art,'#c73b2c');
      c.save();c.globalAlpha=hit;stamp(c,flash,at.x,at.y);c.restore();
    }
  }
  // Only ink hidden by a nearer opaque pixel is outlined. Transparent spaces
  // between branches and actors standing in front of the building stay clear.
  function outline(c,item,at,b,near,ally,time,highlight=false){
    if(!near.length&&!highlight)return;
    const m=clip.getContext('2d');m.clearRect(0,0,160,160);m.save();m.scale(sample,sample);m.translate(span/2-at.x,pad-at.y);
    for(const part of near)drawScenery(m,part,time);m.restore();
    if(item.rimPose!==item.key||item.rimAlly!==ally){
      item.rim??=surface();const edge=item.rim.getContext('2d');
      edge.clearRect(0,0,160,160);
      for(const [dx,dy] of rimOffsets)edge.drawImage(item.ink,dx,dy);
      edge.globalCompositeOperation='destination-out';edge.drawImage(item.ink,0,0);
      edge.globalCompositeOperation='source-in';edge.fillStyle=ally?'#e9d3a1':'#d2a093';edge.fillRect(0,0,160,160);
      edge.globalCompositeOperation='source-over';item.rimPose=item.key;item.rimAlly=ally;
    }
    if(highlight){stamp(c,item.rim,at.x,at.y);return;}
    const r=ring.getContext('2d');r.clearRect(0,0,160,160);r.drawImage(item.rim,0,0);
    r.globalCompositeOperation='destination-in';r.drawImage(clip,0,0);r.globalCompositeOperation='source-over';stamp(c,ring,at.x,at.y);
  }
  return {frame,shadow,actor,outline,hit};
}
export function fieldBreeze(map){
  const shore=riverPath(map.river),water=[],grass=[],ctx=surface(1,1).getContext('2d');
  let seed=14171;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let n=0;n<1550;n++){
    const x=rand()*map.width*map.tileWidth,y=rand()*map.height*map.tileHeight,phase=rand()*6.28;
    if(ctx.isPointInPath(shore,x,y,'evenodd'))water.push({x,y,phase,length:6+rand()*15});
    else if(map.terrain[Math.floor(y/map.tileHeight)*map.width+Math.floor(x/map.tileWidth)]==='grass'&&rand()<.42)grass.push({x,y,phase,length:2+rand()*3});
  }
  return function draw(c,time,view){
    const visible=p=>p.x>=view.x-20&&p.x<=view.right+20&&p.y>=view.y-10&&p.y<=view.bottom+10;
    c.save();c.clip(shore,'evenodd');c.lineCap='round';c.lineWidth=.95;
    for(const p of water){if(!visible(p))continue;const t=time*.86+p.phase,dx=3*Math.sin(t);c.strokeStyle='rgba(180,203,185,'+(.13+.13*Math.sin(t))+')';c.beginPath();c.moveTo(p.x+dx,p.y);c.quadraticCurveTo(p.x+p.length*.5+dx,p.y-1.2+Math.sin(t),p.x+p.length+dx,p.y-.6);c.stroke();}c.restore();
    c.save();c.lineWidth=.85;c.strokeStyle='#708366ab';c.beginPath();for(const p of grass){if(!visible(p))continue;const lean=Math.sin(time*1.25+p.phase)*1.65;for(const d of [-1,1]){c.moveTo(p.x+d,p.y);c.quadraticCurveTo(p.x+d*1.4,p.y-p.length*.55,p.x+d*2+lean,p.y-p.length);}}c.stroke();c.restore();
  };
}

// A wood shaft, a small iron head and bound grey fletching in a cached raster.
// Its strike point is the tip. Elemental and skill-specific effects keep their native art.
const arrow=surface(40,9),ink=arrow.getContext('2d');
ink.fillStyle='#493c2e';ink.fillRect(4,4,31,2);
ink.fillStyle='#99876b';ink.fillRect(5,4,28,1);
ink.fillStyle='#726c5a';ink.fillRect(0,1,5,2);ink.fillRect(3,3,5,1);ink.fillRect(1,6,5,1);
ink.fillStyle='#b1a996';ink.fillRect(6,4,3,2);ink.fillRect(32,3,3,3);
ink.fillStyle='#91968a';ink.fillRect(34,3,3,2);ink.fillRect(36,4,4,1);
export function drawWoodArrow(c,position,velocity){
  c.save();c.translate(position.x,position.y);c.rotate(Math.atan2(velocity.y,velocity.x));
  c.drawImage(arrow,-19,-2.15,19,4.3);c.restore();
}
