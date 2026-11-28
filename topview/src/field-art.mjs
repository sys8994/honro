import {paintSprite,angleRow,poseOf,spriteFrame} from './actors.mjs';
import {actorBody} from './body.mjs';
import {drawScenery} from './canopy.mjs';
import {riverPath} from './ground.mjs';

function surface(w=160,h=160){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}

// Keep painted bodies at native atlas density through maximum desktop zoom.
// Occlusion and contact shadows use their own smaller monochrome surfaces.
const bodySample=2.6;

function silhouette(ctx,image,color){
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.drawImage(image,0,0,ctx.canvas.width,ctx.canvas.height);
  ctx.globalCompositeOperation='source-in';ctx.fillStyle=color;ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.globalCompositeOperation='source-over';
}
export function fieldActors(images,projection){
  const expanded=images.has('empty_bier'),span=expanded?168:100,pad=expanded?115:88,sample=160/span;
  const stamp=(ctx,canvas,x,y)=>ctx.drawImage(canvas,x-span/2,y-pad,span,span);
  const actors=new Map(),clip=surface(),flash=surface();
  const contact=surface(96,36),g=contact.getContext('2d');g.scale(48,18);
  const ao=g.createRadialGradient(1,1,0,1,1,1);
  ao.addColorStop(0,'#10191bcc');ao.addColorStop(.44,'#101a1c85');ao.addColorStop(1,'#14202700');
  g.fillStyle=ao;g.fillRect(0,0,2,2);
  const rimOffsets=[[-2,0],[2,0],[0,-2],[0,2],[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]];
  function frame(u,charging,active,time){
    let item=actors.get(u.id);
    if(!item){
      item={art:surface(span*bodySample,span*bodySample),ink:surface(),phase:[...u.id].reduce((n,c)=>(n*31+c.charCodeAt(0))%1009,0)/181};actors.set(u.id,item);
    }
    const b=actorBody(u),heading=u.tvHeading||{x:1,y:0},v=projection.forward(heading.x,heading.y);
    const row=angleRow(v.x,v.y),pose=poseOf(u,charging,active),stride=u.tvStride||0;
    const animation=pose==='idle'?Math.floor((time+item.phase)*14):pose==='walk'&&b.kind!=='woodcutter'?(Math.floor(stride/42)%8):0;
    const key=[row,pose,animation,b.kind].join('|');
    if(item.key!==key){
      item.key=key;const c=item.art.getContext('2d');c.clearRect(0,0,item.art.width,item.art.height);c.save();c.scale(bodySample,bodySample);
      paintSprite(c,images,b.kind,pose,row,stride,span/2,pad-b.lift,b.size,animation/14);c.restore();
      const wing=pose==='idle'&&b.lift?Math.round(3*Math.sin(animation/14*(b.kind==='bat'?8:5.3))):0;
      const inkKey=pose==='idle'?[row,pose,wing,b.kind].join('|'):key;
      if(inkKey!==item.inkKey){
        item.inkKey=inkKey;silhouette(item.ink.getContext('2d'),item.art,'#091318');
        item.cast??=surface();const cast=item.cast.getContext('2d');cast.clearRect(0,0,160,160);
        cast.filter=b.lift?'blur(3px)':'blur(1.35px)';cast.drawImage(item.ink,0,0);cast.filter='none';
        item.hitArgs=[b.kind,pose,row,stride,span/2,pad-b.lift,b.size,animation/14];
      }
    }
    return item;
  }
  function hit(item,dx,dy,tolerance){
    const x=Math.round(dx+span/2),y=Math.round(dy+pad),r=Math.ceil(tolerance),w=span,h=span;
    if(x<-r||y<-r||x>=w+r||y>=h+r)return false;
    if(item.maskPose!==item.inkKey){
      // Pick on a CPU-backed pose mask; reading the GPU body would synchronize
      // the whole battlefield every time the cursor crossed a breathing unit.
      item.pick??=surface(w,h).getContext('2d',{willReadFrequently:true});
      item.pick.clearRect(0,0,w,h);paintSprite(item.pick,images,...item.hitArgs);
      item.alpha=item.pick.getImageData(0,0,w,h).data;item.maskPose=item.inkKey;
    }
    for(let j=Math.max(0,y-r);j<Math.min(h,y+r+1);j++)for(let i=Math.max(0,x-r);i<Math.min(w,x+r+1);i++){
      if((i-x)**2+(j-y)**2<=r*r&&item.alpha[4*(j*w+i)+3]>=78)return true;
    }
    return false;
  }
  function shadow(c,item,at,b){
    c.save();c.translate(at.x+.5,at.y+.4);
    if(!b.lift){
      const wide=b.rx*1.1,deep=Math.max(2.7,b.rx*.38);c.drawImage(contact,-wide,-deep,wide*2,deep*2);
    }
    c.globalAlpha=b.lift?.36:.52;c.transform(.88,.04,-.49,-.25,0,0);stamp(c,item.cast,0,0);c.restore();
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
    if(item.rimPose!==item.inkKey||item.rimAlly!==ally){
      item.rim??=surface();const edge=item.rim.getContext('2d');
      edge.clearRect(0,0,160,160);
      for(const [dx,dy] of rimOffsets)edge.drawImage(item.ink,dx,dy);
      edge.globalCompositeOperation='destination-out';edge.drawImage(item.ink,0,0);
      edge.globalCompositeOperation='source-in';edge.fillStyle=ally?'#e9d3a1':'#d2a093';edge.fillRect(0,0,160,160);
      edge.globalCompositeOperation='source-over';item.rimPose=item.inkKey;item.rimAlly=ally;
    }
    if(highlight){stamp(c,item.rim,at.x,at.y);return;}
    const wind=near.some(p=>p.part==='crown')?Math.floor(time*12):0;
    const prior=item.cover;
    if(!prior||prior.pose!==item.inkKey||prior.ally!==ally||prior.x!==at.x||prior.y!==at.y||
        prior.wind!==wind||prior.near.length!==near.length||near.some((p,i)=>p!==prior.near[i])){
      const m=clip.getContext('2d');m.clearRect(0,0,160,160);m.save();m.scale(sample,sample);m.translate(span/2-at.x,pad-at.y);
      for(const part of near)drawScenery(m,part,time);m.restore();
      item.hidden??=surface();const r=item.hidden.getContext('2d');r.clearRect(0,0,160,160);r.drawImage(item.rim,0,0);
      r.globalCompositeOperation='destination-in';r.drawImage(clip,0,0);r.globalCompositeOperation='source-over';
      item.cover={x:at.x,y:at.y,wind,near,ally,pose:item.inkKey};
    }
    stamp(c,item.hidden,at.x,at.y);
  }
  return {frame,shadow,actor,outline,hit};
}
export function fieldBreeze(map){
  const shore=riverPath(map.river),grass=[],ctx=surface(1,1).getContext('2d');
  let seed=14171;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let n=0;n<1550;n++){
    const x=rand()*map.width*map.tileWidth,y=rand()*map.height*map.tileHeight,phase=rand()*6.28;
    if(!ctx.isPointInPath(shore,x,y,'evenodd')&&map.terrain[Math.floor(y/map.tileHeight)*map.width+Math.floor(x/map.tileWidth)]==='grass'&&rand()<.42)grass.push({x,y,phase,length:2+rand()*3});
  }
  return function draw(c,time,view){
    const visible=p=>p.x>=view.x-20&&p.x<=view.right+20&&p.y>=view.y-10&&p.y<=view.bottom+10;
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

// The two rim pairs come from the same open/closed water volume that bends arrows.
// Quiet gaps between the ribbons show the underlying current and its true width.
export function drawWaterfall(c,vertices,closedRim,images,time){
  const [left,bend,base,right,bendR,end]=vertices;
  const blend=(p,q,t)=>({x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t});
  const crest=blend(left,end,.5),pool=blend(base,right,.5),width=Math.hypot(end.x-left.x,end.y-left.y);
  const lip=images.get('fall_lip'),foam=images.get('fall_foam');
  // This rock is part of the east bank. Deflecting the water leaves it in place.
  const rock=blend(closedRim[0],closedRim[5],.5),lipWidth=width*4.5,lipHeight=lipWidth*lip.height/lip.width*.8;
  c.save();
  c.drawImage(lip,rock.x-lipWidth*.34,rock.y-lipHeight*.70,lipWidth,lipHeight);
  c.globalAlpha=.33;c.drawImage(foam,crest.x-width*.65,crest.y-width*.13,width*1.36,width*.26);c.globalAlpha=1;
  const river=new Path2D();
  vertices.forEach((p,i)=>i?river.lineTo(p.x,p.y):river.moveTo(p.x,p.y));river.closePath();
  c.save();c.clip(river);c.lineCap='round';
  for(let i=0;i<14;i++){
    const offset=(i+.32+.25*Math.sin(i*5.17))/14;
    const a=blend(left,end,offset),m=blend(bend,bendR,offset),f=blend(base,right,offset);
    const stream=new Path2D();
    stream.moveTo(a.x,a.y+1.5*Math.cos(i));
    stream.bezierCurveTo(a.x+3*Math.sin(i),a.y+(m.y-a.y)*.58,m.x-1.8*Math.sin(i),m.y-5,m.x,m.y);
    stream.quadraticCurveTo(m.x+(f.x-m.x)*.6+3*Math.sin(i*.9),m.y+(f.y-m.y)*.63,f.x,f.y);
    const light=c.createLinearGradient(a.x,a.y,f.x,f.y);
    light.addColorStop(0,'#ecf0db46');light.addColorStop(.10,'#e1e4cf60');light.addColorStop(.5,'#94bdba35');light.addColorStop(1,'#d9e3d64b');
    c.strokeStyle=light;c.lineWidth=1.7+(i*7%4)*.62;c.stroke(stream);
    c.strokeStyle='#c7dbd75c';c.lineWidth=.6;
    c.setLineDash([3+i*11%23,17+i*7%28]);c.lineDashOffset=-time*(29+i%4*6)-i*i*1.8;c.stroke(stream);c.setLineDash([]);
  }
  c.restore();
  const swell=1+.025*Math.sin(time*2.8),fw=width*2.4*swell,fh=fw*.32;
  c.globalAlpha=.76;c.drawImage(foam,pool.x-fw*.5,pool.y-fh*.55,fw,fh);
  c.restore();
}
