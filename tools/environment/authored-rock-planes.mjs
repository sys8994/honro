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
