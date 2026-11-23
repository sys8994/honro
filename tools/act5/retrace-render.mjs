// Render the fill leaves of a native vector asset (without its clips) to PNG at K px/unit.
// usage: node tools/act5/retrace-render.mjs ASSET.json OUT.png K [--path vector.root]
import fs from 'node:fs';import{createCanvas,Path2D}from'@napi-rs/canvas';
const [src,out,K]=process.argv.slice(2),k=+K,asset=JSON.parse(fs.readFileSync(src,'utf8'));
const pathArg=process.argv.indexOf('--path'),rootPath=pathArg>0?process.argv[pathArg+1]:'vector.root';
let vec=asset;for(const key of rootPath.split('.').slice(0,-1))vec=vec[key];const root=rootPath.split('.').reduce((o,key)=>o[key],asset);
const [vx,vy,vw,vh]=vec.viewBox,W=Math.ceil(vw*k),H=Math.ceil(vh*k),cv=createCanvas(W,H),c=cv.getContext('2d');
c.setTransform(k,0,0,k,-vx*k,-vy*k);
const walk=(n,m)=>{if(!n)return;c.save();if(n.transform)c.transform(...n.transform);const d=n.d??n.sourcePath??(n.dParts?n.dParts.join(''):null);
 if(d&&n.fill&&n.fill!=='none'){c.globalAlpha=n.opacity??1;c.fillStyle=n.fill;c.fill(new Path2D(d),n.fillRule==='evenodd'?'evenodd':'nonzero');}
 for(const ch of n.children||[])walk(ch);c.restore();};
walk(root);fs.writeFileSync(out,cv.toBuffer('image/png'));console.log(JSON.stringify({W,H,k,viewBox:vec.viewBox}));
