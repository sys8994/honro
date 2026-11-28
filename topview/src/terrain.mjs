import {makeShore} from './shore.mjs';
import {sweepBox,sweepDisc,slide} from './space.mjs';

export const center = u => ({x:u.x,y:u.y-u.h*.5});
export function terrainSpace(map) {
  const cell=map.cell, width=cell*map.width, height=cell*map.height;
  const records=new Map();
  function solid(id, mat='rock'){
    if (!records.has(id)) records.set(id,{id,mat,hp:99999,maxHp:99999,route:false,broken:false});
    return records.get(id);
  }
  const shore=makeShore(map.blockedWater,map);
  const foundations=map.objects.flatMap(obj=>(obj.foundations||(obj.foundation?[obj.foundation]:[])).map(ring=>({body:makeShore([[ring]],map),obj})));
  const props=map.objects.filter(o=>!o.foundations&&!o.foundation&&(o.blocksMovement||o.blocksProjectile)).map(o=>({
    ...o,x:o.x*cell,y:o.y*cell,r:o.radius*cell,terrain:solid(o.id)
  }));
  const walls=[{x:-cell,y:-cell,w:cell,h:height+2*cell},{x:width,y:-cell,w:cell,h:height+2*cell},{x:0,y:-cell,w:width,h:cell},{x:0,y:height,w:width,h:cell}];
  const mapEdge=solid('map-edge'),bank=solid('bank');
  function nearest(a,z,r,flight=false,skip=[]){
    let hit=null;
    function add(h,t){if(h&&!skip.includes(t.id)&&(!hit||h.t<hit.t))hit={...h,terrain:t};}
    const left=Math.min(a.x,z.x)-r,right=Math.max(a.x,z.x)+r,top=Math.min(a.y,z.y)-r,bottom=Math.max(a.y,z.y)+r;
    if(left<=0||right>=width||top<=0||bottom>=height)
      for(const wall of walls)add(sweepBox(a,z,wall,r),mapEdge);
    if(!flight)add(shore.first(a,z,r),bank);
    for(const f of foundations)if(flight?f.obj.blocksProjectile:f.obj.blocksMovement)add(f.body.first(a,z,r),solid(f.obj.id));
    for(const o of props){
      if(o.x+o.r<left||o.x-o.r>right||o.y+o.r<top||o.y-o.r>bottom)continue;
      if(flight?o.blocksProjectile:o.blocksMovement)add(sweepDisc(a,z,o,o.r+r),o.terrain);
    }
    return hit;
  }
  function legal(p,r,flight=false){
    if(p.x<r||p.y<r||p.x>width-r||p.y>height-r)return false;
    if(!flight&&shore.contains(p,r))return false;
    if(foundations.some(f=>(flight?f.obj.blocksProjectile:f.obj.blocksMovement)&&f.body.contains(p,r)))return false;
    return props.every(o=>!(flight?o.blocksProjectile:o.blocksMovement)||(p.x-o.x)**2+(p.y-o.y)**2>(r+o.r)**2);
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
  // Only the two endpoints vary between orders. Interior navigation edges
  // belong to immutable chapter geometry and to this exact collision radius.
  const nav=new Map(),step=cell/2,cols=map.width*2,rows=map.height*2;
  const adjacent=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]];
  const pos=i=>({x:(i%cols+.5)*step,y:(Math.floor(i/cols)+.5)*step});
  function route(start,goal,r,flight=false){
    if(!legal(goal,r,flight))return [];
    if(!nearest(start,goal,r,flight))return [goal];
    const cacheKey=r+'|'+flight;
    if(!nav.has(cacheKey)){
      if(nav.size>=12)nav.delete(nav.keys().next().value);
      nav.set(cacheKey,new Uint8Array(cols*rows*adjacent.length));
    }
    const edges=nav.get(cacheKey);
    const index=p=>Math.floor(p.y/step)*cols+Math.floor(p.x/step);
    const startIdx=index(start),end=index(goal),parent=new Map([[startIdx,-1]]),queue=[startIdx];
    for(let n=0;n<queue.length&&!parent.has(end);n++){
      const i=queue[n],from=i===startIdx?start:pos(i);
      for(let dir=0;dir<adjacent.length;dir++){
        const [x,y]=adjacent[dir];
        const col=i%cols+x,row=Math.floor(i/cols)+y;
        if(col<0||row<0||col>=cols||row>=rows)continue;
        const j=row*cols+col,to=j===end?goal:pos(j);
        if(parent.has(j))continue;
        const key=i*adjacent.length+dir,interior=i!==startIdx&&j!==end;
        let pass=interior?edges[key]:0;
        if(!pass){
          pass=legal(to,r,flight)&&!nearest(from,to,r,flight)?1:2;
          if(interior)edges[key]=pass;
        }
        if(pass!==1)continue;
        parent.set(j,i);queue.push(j);
      }
    }
    if(!parent.has(end))return [];
    const result=[goal];for(let i=parent.get(end);i!==startIdx&&i!==-1;i=parent.get(i))result.unshift(pos(i));
    const smooth=[];let at=start;
    for(let n=0;n<result.length;){let j=result.length-1;while(j>n&&nearest(at,result[j],r,flight))j--;smooth.push(result[j]);at=result[j];n=j+1;}
    return smooth;
  }
  function landing(p,r,flight=false,units=[]){
    let best=null,distance=Infinity;
    for(let row=0;row<map.height;row++)for(let col=0;col<map.width;col++){
      const q={x:(col+.5)*cell,y:(row+.5)*cell},d=Math.hypot(q.x-p.x,q.y-p.y);
      if(d>=distance||!legal(q,r,flight)||units.some(u=>!u.dead&&Math.hypot(u.x-q.x,center(u).y-q.y)<=r+u.r+4))continue;
      best=q;distance=d;
    }
    return best;
  }
  return {map,cell,width,height,nearest,legal,free,landing,route,point:id=>({x:map.anchors[id].x*cell,y:map.anchors[id].y*cell}),
    move:(p,dx,dy,r,flight=false)=>slide(p,dx,dy,(a,z)=>nearest(a,z,r,flight))};
}
