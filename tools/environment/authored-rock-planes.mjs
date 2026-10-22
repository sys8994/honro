/** Build-time geometry primitives shared by stage authors; never bundled.
 * Keep stage-specific geology, topology and palette in each authored source. */
export const roundPlaneCoordinate=v=>Math.round(v*100)/100;
export const shadeRock=(hex,n)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(hex.slice(i,i+2),16)+n)).toString(16).padStart(2,'0')).join('');
export function solidSection(t,x,direction=1){
 const ys=[];for(let i=0;i<t.points.length;i++){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(a.x!==b.x&&x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x))ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}
 if(!ys.length)throw Error('No solid section: '+t.id+' x='+x);
 return direction>0?Math.min(...ys):Math.max(...ys);
}
export function createPlaneWriter(planes,terrainId,{prefix,flag}){
 return(name,points,fill)=>{if(points.length<3||points.some(p=>p.length!==2||p.some(v=>!Number.isFinite(v))))throw Error('Invalid authored plane '+prefix+name);planes.push({id:prefix+name,terrainId,[flag]:true,fill,points:points.map(p=>p.map(roundPlaneCoordinate))});};
}
/** Divide an authored contact at a fractional segment position. */
export function dividePolyline(ps,f){
 const k=f*(ps.length-1),j=Math.min(ps.length-2,Math.floor(k)),v=k-j,a=ps[j],b=ps[j+1],point=[a[0]+(b[0]-a[0])*v,a[1]+(b[1]-a[1])*v];return{point,up:[...ps.slice(0,j+1),point],down:[point,...ps.slice(j+1)]};
}

/** Static shared-contact mesh compiler; each stage owns its profile data. */
export function appendSectionRock(planes,t,{columns,levels,colors,prefix,flag,direction=1,finite=false,seams={},beds={},drifts={},crosscuts={},joints=[],lights=[],motherColor,deepColors}){
  const id=t.id;
  const add=createPlaneWriter(planes,id,{prefix,flag}),left=Math.min(...t.points.map(p=>p.x)),right=Math.max(...t.points.map(p=>p.x));
  const worldX=x=>finite?left+(right-left)*x:x,at=([x,d])=>{x=worldX(x);const top=solidSection(t,x,direction),depth=finite?Math.abs(solidSection(t,x,-direction)-top):1;return[x,top+direction*d*depth];};
  const row=levels.map((ds,r)=>columns.map((x,i)=>[x+(drifts[r]?.[i]||0),ds[i]]));for(const r of row)for(let i=1;i<r.length;i++)if(r[i][0]<=r[i-1][0])throw Error('Crossing authored row '+id);const knots=[...new Set(t.points.map(p=>p.x))].sort((a,b)=>a-b);
  function horizontal(r,j){const a=row[r][j],b=row[r][j+1],custom=beds[r+':'+j];if(custom)return[at(a),...custom.map(at),at(b)];const ax=worldX(a[0]),bx=worldX(b[0]),local=x=>finite?(x-left)/(right-left):x;return[at(a),...knots.filter(x=>x>ax&&x<bx).map(x=>at([local(x),a[1]+(b[1]-a[1])*(x-ax)/(bx-ax)])),at(b)];}
  const sides={};for(let r=0;r<row.length-1;r++)for(let j=0;j<columns.length;j++)sides[r+':'+j]=[at(row[r][j]),...(seams[r+':'+j]||[]).map(at),at(row[r+1][j])];
  add('mother',t.points.map(p=>[p.x,p.y]),motherColor||(finite?'#344c57':direction>0?'#304b55':'#223b47'));
  for(let r=0;r<row.length-1;r++)for(let j=0;j<columns.length-1;j++){
   const l=sides[r+':'+j],z=sides[r+':'+(j+1)],tone=colors[r][j%colors[r].length],cut=crosscuts[r+':'+j];
   if(cut){const left=dividePolyline(l,cut[0]),right=dividePolyline(z,cut[1]),joint=[left.point,...cut[2].map(at),right.point];add('cut-upper'+r+'-'+j,[...horizontal(r,j),...right.up.slice(1),...joint.slice().reverse().slice(1),...left.up.slice().reverse().slice(1)],shadeRock(tone,3));add('cut-lower'+r+'-'+j,[...joint,...right.down.slice(1),...horizontal(r+1,j).reverse().slice(1),...left.down.slice().reverse().slice(1)],shadeRock(tone,-3));}
   else add('bed'+r+'-'+j,[...horizontal(r,j),...z.slice(1),...horizontal(r+1,j).reverse().slice(1),...l.slice().reverse().slice(1)],tone);
  }
  if(!finite){const last=row.length-1,bound=direction>0?Math.max(...t.points.map(p=>p.y)):Math.min(...t.points.map(p=>p.y));for(let j=0;j<columns.length-1;j++){const edge=horizontal(last,j);add('deep'+j,[...edge,[edge.at(-1)[0],bound],[edge[0][0],bound]],deepColors?deepColors[j%deepColors.length]:direction>0?(j%3?'#304b55':'#344e58'):(j%3?'#223b47':'#263f4b'));}}
  for(const[key,w]of joints){const ps=sides[key].slice(1,-1);if(ps.length<2)throw Error('Joint missing authored turns '+id+'/'+key);add('joint'+key,[...ps,...ps.map(([x,y],i)=>[x+(i===1?w:2),y]).reverse()],direction>0?'#293f49':'#19323e');}
  for(const[r,j,w]of lights){const ps=horizontal(r,j);add('short-seat'+r+'-'+j,[...ps,...ps.map(([x,y],i)=>[x,y-direction*(i===0||i===ps.length-1?1:w)]).reverse()],finite?'#82908a':'#758a87');}
 }
