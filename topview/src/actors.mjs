// Image row order is clockwise from screen south towards the west.
export const directions=['S','SW','W','NW','N','NE','E','SE'];
export const animals=['hound','boar','stag','crow','bat','ghost'];
export const actionNames=['idle','walk','prepare','attack','recover','hurt','dead'];
const frame=(image,col,row,width,height)=>({image,col,row,width,height,flip:false});
export function angleRow(x,y){return (8-Math.round(Math.atan2(x,y)/(Math.PI/4)))%8;}
export function poseOf(u,charging,active){
  if(u.dead)return 'dead';
  if(u.hurt>.3)return 'hurt';
  if(u.beastAction){const t=u.beastAction.elapsed;return t<.42?'prepare':t<.64?'attack':'recover';}
  if(active&&charging||u.aiAim)return 'prepare';
  if(u.anim>.72)return 'attack';
  if(u.anim>.13)return 'recover';
  return u.moving>0?'walk':'idle';
}
export function spriteFrame(kind,pose,row,stride){
  if(kind==='seolo'){
    if(pose==='walk')return frame(row===0?'seolo-front':'seolo',Math.floor(stride/76)%4,row===0?0:row,144,168);
    if(pose==='prepare'||pose==='attack'){
      if(directions[row]==='NE')return frame('seolo-bow-ne',pose==='attack'?1:0,0,160,160);
      return frame('seolo-bow',row%4,Math.floor(row/4)+(pose==='attack'?2:0),160,160);
    }
    return frame('seolo-states',row,{idle:0,recover:1,hurt:2,dead:3}[pose]??0,160,160);
  }
  const direction=row>4?8-row:row;
  const col=pose==='walk'?1+Math.floor(stride/42)%2:{idle:0,prepare:3,attack:4,recover:3,hurt:5,dead:6}[pose];
  return {...frame('turns-'+kind,col,direction,144,128),flip:row>4};
}
// Register the walk by the torso and shoe contact, not the edges of the bow or quiver.
const registrations=new WeakMap();
function registerWalk(image){
  if(registrations.has(image))return registrations.get(image);
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const {data}=ctx.getImageData(0,0,image.width,image.height),result=[];
  for(let row=0;row<image.height/168;row++)for(let col=0;col<4;col++){
    let top=168,bottom=0,sum=0,count=0;
    const opaque=(x,y)=>data[((row*168+y)*image.width+col*144+x)*4+3]>110;
    for(let y=0;y<168;y++)for(let x=0;x<144;x++)if(opaque(x,y)){top=Math.min(y,top);bottom=Math.max(y,bottom);}
    for(let y=Math.round(top+(bottom-top)*.15);y<top+(bottom-top)*.39;y++)for(let x=0;x<144;x++)if(opaque(x,y)){sum+=x;count++;}
    result.push({axis:sum/(count||1),foot:bottom,span:Math.max(1,bottom-top)});
  }
  registrations.set(image,result);return result;
}
function idleBody(c,im,f,kind,x,y,width,size,t){
  const bird=kind==='crow'||kind==='bat',speed=kind==='ghost'?1.85:kind==='hound'?2.9:kind==='boar'?2.4:1.95;
  const breath=Math.sin(t*speed),tilt=Math.sin(t*.89+.6),sx=f.col*f.width,sy=f.row*f.height;
  if(bird){
    // The tips flex about the breast; the body keeps its place over its shadow.
    const flap=Math.sin(t*(kind==='bat'?8:5.3)),n=10;
    for(let i=0;i<n;i++){
      const a=i/n,b=(i+1)/n,dy=v=>Math.pow(Math.abs(2*v-1),1.6)*size*.12*flap;
      const left=dy(a),right=dy(b);
      c.save();c.translate(x-width*.5+a*width,y+left);c.transform(1,(right-left)/(width/n),0,1,0,0);
      c.drawImage(im,sx+a*f.width,sy,f.width/n,f.height,0,-size,width/n+.08,size);c.restore();
    }return;
  }
  if(kind==='seolo'){
    // The top of the head and boot soles stay fixed. Only the shoulder and
    // bow-hand bands shift by a fraction of a map pixel during a breath.
    const cuts=[0,.21,.37,.55,.70,1],side=[0,0,.008*breath,.012*tilt,0,0],rise=[0,0,-.006*breath,-.004*breath,0,0];
    for(let i=0;i<cuts.length-1;i++){
      const a=cuts[i],span=cuts[i+1]-a;
      c.save();c.translate(x+side[i]*size,y-size+(a+rise[i])*size);
      c.transform(1,0,(side[i+1]-side[i])/span,1+(rise[i+1]-rise[i])/span,0,0);
      c.drawImage(im,sx,sy+a*f.height,f.width,span*f.height,-width/2,0,width,span*size+.07);c.restore();
    }
    return;
  }
  const bend=kind==='ghost'?.032:kind==='woodcutter'?.017:.014;
  const levels=[0,.28,.53,.76,1],dx=[tilt*size*bend,breath*size*.009,0,0,0],dy=[-breath*size*.023,-breath*size*.028,-breath*size*.012,0,0];
  for(let i=0;i<4;i++){
    const a=levels[i],h=(levels[i+1]-a)*size;
    c.save();c.translate(x+dx[i],y-size+a*size+dy[i]);
    c.transform(1,0,(dx[i+1]-dx[i])/h,1+(dy[i+1]-dy[i])/h,0,0);
    c.drawImage(im,sx,sy+a*f.height,f.width,h/size*f.height,-width/2,0,width,h+.08);c.restore();
  }
}
export function paintSprite(c,images,kind,pose,row,stride,x,y,size,time=0){
  const npc=kind==='woodcutter',imNpc=npc&&images.get(kind);
  const f=npc?frame(kind,0,0,imNpc.width,imNpc.height):spriteFrame(kind,pose,row,stride),im=images.get(f.image);
  const width=size*f.width/f.height;
  c.save();c.translate(x,y);if(f.flip)c.scale(-1,1);
  if(kind==='seolo'&&pose!=='walk')c.translate(0,5*size/160);
  if(pose==='idle')idleBody(c,im,f,kind,0,0,width,size,time);
  else if(kind==='seolo'&&pose==='walk'){
    const m=registerWalk(im)[f.row*4+f.col],scale=size*(150/160)/m.span;
    const breath=Math.cos(stride/152*Math.PI*2)*size*.007;
    c.drawImage(im,f.col*f.width,f.row*f.height,f.width,f.height,-m.axis*scale,-m.foot*scale-1+breath,f.width*scale,f.height*scale);
  }else c.drawImage(im,f.col*f.width,f.row*f.height,f.width,f.height,-width/2,-size,width,size);
  c.restore();
}
