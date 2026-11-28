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
    if(pose==='walk')return frame(row===0?'seolo-front':'seolo',Math.floor(stride/45)%4,row===0?0:row,144,168);
    if(pose==='prepare'||pose==='attack')return frame('seolo-bow',row%4,Math.floor(row/4)+(pose==='attack'?2:0),160,160);
    return frame('seolo-states',row,{idle:0,recover:1,hurt:2,dead:3}[pose]??0,160,160);
  }
  const direction=row>4?8-row:row;
  const col=pose==='walk'?1+Math.floor(stride/42)%2:{idle:0,prepare:3,attack:4,recover:3,hurt:5,dead:6}[pose];
  return {...frame('turns-'+kind,col,direction,144,128),flip:row>4};
}
export function paintSprite(c,images,kind,pose,row,stride,x,y,size){
  const f=spriteFrame(kind,pose,row,stride),im=images.get(f.image);
  const width=size*f.width/f.height;
  c.save();c.translate(x,y);if(f.flip)c.scale(-1,1);
  c.drawImage(im,f.col*f.width,f.row*f.height,f.width,f.height,-width/2,-size,width,size);c.restore();
}
