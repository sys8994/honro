/** Shared SVG/Canvas authoring renderer. Not registered in the game bundle yet. */
import {ASSETS,MATERIALS,PALETTES,HUMAN_H} from '../assets/environment/vector-kit/registry.mjs';
import {COMPOSITIONS} from '../assets/environment/vector-kit/compositions.mjs';
export {HUMAN_H};
const I=[1,0,0,1,0,0],paths=new WeakMap(),terrainPaths=new Map();
export function multiply(a,b){return[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
function matrix(t={},definition={}){
 if(t.sx!==undefined||t.sy!==undefined)throw Error('Kit parts use uniform scale; sx/sy are not supported.');
 const [s0,s1]=definition.scaleRange||[.1,10],[r0,r1]=definition.rotationRange||[-180,180];
 const s=Math.max(s0,Math.min(s1,t.scale??1)),r=Math.max(r0,Math.min(r1,t.rotation||0))*Math.PI/180,c=Math.cos(r),q=Math.sin(r),mx=t.mirror?-1:1;
 return[c*s*mx,q*s*mx,-q*s,c*s,t.x||0,t.y||0];
}
function transformedBounds(b,m){const points=[[b.x,b.y],[b.x+b.w,b.y],[b.x,b.y+b.h],[b.x+b.w,b.y+b.h]].map(([x,y])=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]);return{x:Math.min(...points.map(p=>p[0])),y:Math.min(...points.map(p=>p[1])),w:Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0])),h:Math.max(...points.map(p=>p[1]))-Math.min(...points.map(p=>p[1]))};}
export function spline(points,first='M'){
 let d=`${first}${points[0].join(' ')}`;
 for(let i=0;i<points.length-1;i++){const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],e=points[Math.min(points.length-1,i+2)];d+=`C${b[0]+(c[0]-a[0])/6} ${b[1]+(c[1]-a[1])/6} ${c[0]-(e[0]-b[0])/6} ${c[1]-(e[1]-b[1])/6} ${c.join(' ')}`;}return d;
}
export function surfaceAt(points,x){
 if(x<=points[0][0])return points[0][1];if(x>=points.at(-1)[0])return points.at(-1)[1];
 let i=0;while(points[i+1][0]<x)i++;
 const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],e=points[Math.min(points.length-1,i+2)];
 const p=[b,[b[0]+(c[0]-a[0])/6,b[1]+(c[1]-a[1])/6],[c[0]-(e[0]-b[0])/6,c[1]-(e[1]-b[1])/6],c];
 const cubic=(axis,t)=>p[0][axis]*(1-t)**3+3*p[1][axis]*t*(1-t)**2+3*p[2][axis]*t*t*(1-t)+p[3][axis]*t**3;
 let lo=0,hi=1;for(let n=0;n<28;n++){const t=(lo+hi)/2;if(cubic(0,t)<x)lo=t;else hi=t;}return cubic(1,(lo+hi)/2);
}
export function compileScene(scene,{assets=ASSETS,compositions=COMPOSITIONS}={}){
 const nodes=[];
 function expand(instance,parent=I,prefix='',inheritedPalette='forest',inheritedLayer='front',stack=[]){
  const definition=assets[instance.assetId]||compositions[instance.assetId];if(!definition)throw Error('Unknown asset '+instance.assetId);
  if(stack.includes(instance.assetId))throw Error('Cyclic assembly '+instance.assetId);
  const transform={...instance.transform};if(instance.support==='surface'){if(!scene.terrain)throw Error('Surface support needs terrain');transform.y=surfaceAt(scene.terrain.profile,transform.x||0)+(instance.dy||0);}
  const m=multiply(parent,matrix(transform,definition)),id=prefix+(instance.id||instance.assetId),palette=instance.palette||inheritedPalette,layer=instance.layer||inheritedLayer;
  if(definition.parts){
   const locals=new Map();
   for(const part of definition.parts){let basis=m;
    if(part.attach){const parentPart=locals.get(part.attach.instance);if(!parentPart)throw Error('Socket parent must precede child '+part.id);const socket=parentPart.definition.sockets?.[part.attach.socket];if(!socket)throw Error('Missing socket '+part.attach.socket);basis=multiply(parentPart.matrix,matrix({x:socket.at[0],y:socket.at[1],rotation:socket.angle||0}));}
    locals.set(part.id,expand(part,basis,id+'/',palette,layer,[...stack,instance.assetId]));
   }
   return {definition,matrix:m,id};
  }
  const node={id,assetId:instance.assetId,definition,matrix:m,palette,layer,opacity:instance.opacity??1,bounds:transformedBounds(definition.bounds,m)};nodes.push(node);return node;
 }
 for(const instance of scene.instances||[])expand(instance);
 let terrain=null;
 if(scene.terrain){const t=scene.terrain,profile=spline(t.profile),base=profile+`L${t.profile.at(-1)[0]} ${t.bottom}L${t.profile[0][0]} ${t.bottom}Z`,top=t.profile.map(([x,y],i)=>[x,y-(t.halfWidths?.[i]??12)]),bottom=t.profile.map(([x,y],i)=>[x,y+(t.halfWidths?.[i]??12)*1.15]);terrain={...t,profileD:profile,d:base,bandD:spline(top)+spline(bottom.reverse(),'L')+'Z'};}
 return {nodes,terrain,water:scene.water||[],assets,source:scene};
}
export function paintFor(asset,token,palette='forest'){
 if(token==='none'||token?.startsWith('#'))return{type:'color',value:token};
 const colors={...MATERIALS[asset.material].colors,...PALETTES[palette]?.[asset.material]},b=asset.bounds;
 if(token==='body')return{type:'linear',from:[b.x,b.y],to:[b.x+b.w*.85,b.y+b.h],stops:[[0,colors.light],[.42,colors.base],[1,colors.shade]]};
 if(token==='light')return{type:'linear',from:[b.x,b.y],to:[b.x+b.w*.5,b.y+b.h],stops:[[0,colors.light],[1,colors.base]]};
 if(!colors[token])throw Error('Unknown paint '+asset.id+'/'+token);return{type:'color',value:colors[token]};
}
function cachedPath(record){const old=paths.get(record);if(old?.d===record.d)return old.path;const path=new Path2D(record.d);paths.set(record,{d:record.d,path});return path;}
function terrainPath(d){if(!terrainPaths.has(d)){terrainPaths.set(d,new Path2D(d));if(terrainPaths.size>8)terrainPaths.delete(terrainPaths.keys().next().value);}return terrainPaths.get(d);}
function canvasPaint(c,p){if(p.type==='color')return p.value;const g=c.createLinearGradient(...p.from,...p.to);for(const [at,color]of p.stops)g.addColorStop(at,color);return g;}
function visible(a,b){return !b||a.x+a.w>=b.x&&a.x<=b.x+b.w&&a.y+a.h>=b.y&&a.y<=b.y+b.h;}
function terrainAsset(t){return {id:'terrain',material:'earth',bounds:t.paintBounds||{x:0,y:1400,w:5000,h:2200}};}
export function drawCanvas(c,compiled,{viewBounds,time=0,waterRenderer=globalThis.HonroEnvironmentArt,atmosphere}={}){
 const t=compiled.terrain;
 if(t){c.save();c.fillStyle=canvasPaint(c,paintFor(terrainAsset(t),'body',t.palette));c.fill(terrainPath(t.d));c.restore();}
 function drawNodes(layer){for(const node of compiled.nodes){if((node.layer==='terrain')!==layer||!visible(node.bounds,viewBounds))continue;c.save();if(t&&node.layer==='terrain')c.clip(terrainPath(t.d));c.transform(...node.matrix);c.globalAlpha*=node.opacity;
  for(const [i,shape]of node.definition.paths.entries()){c.save();if(i!==node.definition.clipToShape&&node.definition.clipToShape!==null&&node.definition.clipToShape!==undefined)c.clip(cachedPath(node.definition.paths[node.definition.clipToShape]));c.globalAlpha*=shape.opacity??1;const p=cachedPath(shape);if(shape.paint!=='none'){c.fillStyle=canvasPaint(c,paintFor(node.definition,shape.paint,node.palette));c.fill(p);}if(shape.stroke){c.strokeStyle=canvasPaint(c,paintFor(node.definition,shape.stroke,node.palette));c.lineWidth=shape.strokeWidth||1;c.lineCap='round';c.lineJoin='round';c.stroke(p);}c.restore();}c.restore();}}
 drawNodes(true);
 if(t){c.save();c.fillStyle='#a39173';c.fill(terrainPath(t.bandD));c.restore();}
 drawNodes(false);
 // Motion is delegated to the existing production pass, never copied into this kit.
 for(const water of compiled.water){if(!waterRenderer)throw Error('Load existing HonroEnvironmentArt for water');if(water.kind==='pool')waterRenderer.pool(c,water,atmosphere,time);else if(water.kind==='waterfall')waterRenderer.waterfall(c,water.x,water.y,water.width,water.height,atmosphere,time);}
}
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
export function svgBody(compiled,{prefix='kit'}={}){
 const defs=[],paintIds=new Map();let next=0;
 function fill(asset,token,palette){const p=paintFor(asset,token,palette);if(p.type==='color')return p.value;const key=JSON.stringify(p);if(paintIds.has(key))return`url(#${paintIds.get(key)})`;const id=prefix+'-paint-'+next++;paintIds.set(key,id);defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${p.from[0]}" y1="${p.from[1]}" x2="${p.to[0]}" y2="${p.to[1]}">${p.stops.map(([at,color])=>`<stop offset="${at}" stop-color="${color}"/>`).join('')}</linearGradient>`);return`url(#${id})`;}
 const body=[],t=compiled.terrain;
 if(t){defs.push(`<clipPath id="${prefix}-terrain"><path d="${esc(t.d)}"/></clipPath>`);body.push(`<path d="${esc(t.d)}" fill="${fill(terrainAsset(t),'body',t.palette)}"/>`);}
 function nodesSvg(layer){for(const node of compiled.nodes){if((node.layer==='terrain')!==layer)continue;let text=`<g data-instance="${esc(node.id)}" data-asset-id="${esc(node.assetId)}" transform="matrix(${node.matrix.join(' ')})" opacity="${node.opacity}">`;
  const clipIndex=node.definition.clipToShape,clipId=prefix+'-shape-'+next++;if(clipIndex!==null&&clipIndex!==undefined)defs.push(`<clipPath id="${clipId}"><path d="${esc(node.definition.paths[clipIndex].d)}"/></clipPath>`);
  for(const [i,shape]of node.definition.paths.entries()){const element=`<path d="${esc(shape.d)}" fill="${fill(node.definition,shape.paint,node.palette)}"${shape.opacity!==undefined?` opacity="${shape.opacity}"`:''}${shape.stroke?` stroke="${fill(node.definition,shape.stroke,node.palette)}" stroke-width="${shape.strokeWidth||1}" stroke-linecap="round" stroke-linejoin="round"`:''}/>`;text+=i!==clipIndex&&clipIndex!==null&&clipIndex!==undefined?`<g clip-path="url(#${clipId})">${element}</g>`:element;}
  text+='</g>';body.push(t&&node.layer==='terrain'?`<g clip-path="url(#${prefix}-terrain)">${text}</g>`:text);
 }}
 nodesSvg(true);if(t)body.push(`<path d="${esc(t.bandD)}" fill="#a39173"/>`);nodesSvg(false);

 return `<defs>${defs.join('')}</defs>${body.join('')}`;
}
export function svgScene(compiled,{viewBox=[0,0,6000,3000],prefix='kit',label='혼로 공유 벡터 환경'}={}){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.join(' ')}" role="img" aria-label="${esc(label)}">${svgBody(compiled,{prefix})}</svg>`;}
