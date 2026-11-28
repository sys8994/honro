import {sweepBox,sweepDisc,slide} from './space.mjs';

export const center = u => ({x:u.x,y:u.y-u.h*.5});
export function terrainSpace(map) {
  const cell=map.cell, width=cell*map.width, height=cell*map.height;
  const records=new Map();
  function solid(id, mat='rock'){
    if (!records.has(id)) records.set(id,{id,mat,hp:99999,maxHp:99999,route:false,broken:false});
    return records.get(id);
  }
  const props=map.objects.filter(o=>o.blocksMovement||o.blocksProjectile).map(o=>({
    ...o,x:o.x*cell,y:o.y*cell,r:o.radius*cell,terrain:solid(o.id)
  }));
  const walls=[{x:-cell,y:-cell,w:cell,h:height+2*cell},{x:width,y:-cell,w:cell,h:height+2*cell},{x:0,y:-cell,w:width,h:cell},{x:0,y:height,w:width,h:cell}];
  function pass(x,y){return x>=0&&x<map.width&&y>=0&&y<map.height&&map.walkable[x+y*map.width];}
  function nearest(a,z,r,flight=false,skip=[]){
    let hit=null;
    function add(h,t){if(h&&!skip.includes(t.id)&&(!hit||h.t<hit.t))hit={...h,terrain:t};}
    for (const wall of walls) add(sweepBox(a,z,wall,r),solid('map-edge'));
    if (!flight) {
      const x0=Math.max(0,Math.floor((Math.min(a.x,z.x)-r)/cell)),x1=Math.min(map.width-1,Math.floor((Math.max(a.x,z.x)+r)/cell));
      const y0=Math.max(0,Math.floor((Math.min(a.y,z.y)-r)/cell)),y1=Math.min(map.height-1,Math.floor((Math.max(a.y,z.y)+r)/cell));
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(!pass(x,y))add(sweepBox(a,z,{x:x*cell,y:y*cell,w:cell,h:cell},r),solid('bank'));
    }
    for(const o of props) if(flight?o.blocksProjectile:o.blocksMovement) add(sweepDisc(a,z,o,o.r+r),o.terrain);
    return hit;
  }
  function legal(p,r,flight=false){
    if(p.x<r||p.y<r||p.x>width-r||p.y>height-r)return false;
    if(!flight){
      for(let y=Math.floor((p.y-r)/cell);y<=Math.floor((p.y+r)/cell);y++)
        for(let x=Math.floor((p.x-r)/cell);x<=Math.floor((p.x+r)/cell);x++){
          if(pass(x,y))continue;
          const dx=p.x-Math.max(x*cell,Math.min(p.x,(x+1)*cell)),dy=p.y-Math.max(y*cell,Math.min(p.y,(y+1)*cell));
          if(dx*dx+dy*dy<r*r)return false;
        }
    }
    return props.every(o=>!(flight?o.blocksProjectile:o.blocksMovement)||Math.hypot(p.x-o.x,p.y-o.y)>r+o.r);
  }
  function free(p,r,flight=false,units=[]){
    function ok(q){return legal(q,r,flight)&&units.every(u=>u.dead||Math.hypot(q.x-u.x,q.y-center(u).y)>r+u.r+4);}
    if(ok(p))return p;
    for(let ring=1;ring<=15;ring++)for(let n=0;n<16;n++){
      const a=n*Math.PI/8,q={x:p.x+Math.cos(a)*ring*cell/7,y:p.y+Math.sin(a)*ring*cell/7};
      if(ok(q))return q;
    }
    return null;
  }
  function route(start,goal,r,flight=false){
    if(!legal(goal,r,flight))return [];
    if(!nearest(start,goal,r,flight))return [goal];
    const index=p=>Math.floor(p.y/cell)*map.width+Math.floor(p.x/cell);
    const startIdx=index(start),end=index(goal),parent=new Map([[startIdx,-1]]),queue=[startIdx];
    const pos=i=>({x:(i%map.width+.5)*cell,y:(Math.floor(i/map.width)+.5)*cell});
    for(let n=0;n<queue.length&&!parent.has(end);n++){
      const i=queue[n],from=i===startIdx?start:pos(i);
      for(const [x,y] of [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]]){
        const col=i%map.width+x,row=Math.floor(i/map.width)+y;
        if(col<0||row<0||col>=map.width||row>=map.height)continue;
        const j=row*map.width+col,to=j===end?goal:pos(j);
        if(parent.has(j)||!legal(to,r,flight)||nearest(from,to,r,flight))continue;
        parent.set(j,i);queue.push(j);
      }
    }
    if(!parent.has(end))return [];
    const result=[goal];for(let i=parent.get(end);i!==startIdx&&i!==-1;i=parent.get(i))result.unshift(pos(i));
    const smooth=[];let at=start;
    for(let n=0;n<result.length;){let j=result.length-1;while(j>n&&nearest(at,result[j],r,flight))j--;smooth.push(result[j]);at=result[j];n=j+1;}
    return smooth;
  }
  return {map,cell,width,height,nearest,legal,free,route,point:id=>({x:map.anchors[id].x*cell,y:map.anchors[id].y*cell}),
    move:(p,dx,dy,r,flight=false)=>slide(p,dx,dy,(a,z)=>nearest(a,z,r,flight))};
}
