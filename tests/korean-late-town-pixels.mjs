/** Native VectorArt bounds/transparency evidence, not browser or gameplay QA. */
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {koreanRaisedCompound,koreanFoundry,koreanDock} from '../tools/environment/korean-late-town-art.mjs';
const n=createRequire(import.meta.url)('@napi-rs/canvas'),g=vm.createContext({Path2D:n.Path2D});vm.runInContext(fs.readFileSync('shared/map/vector-art.js','utf8'),g);
const feet=[{x:-400,y:380},{x:-120,y:390},{x:130,y:390},{x:400,y:380}];
const samples=[koreanRaisedCompound('office',{supports:feet}),koreanRaisedCompound('archive',{role:'archive',supports:feet}),koreanRaisedCompound('stone',{foundation:'masonry',baseDepth:700,supports:feet}),koreanRaisedCompound('pavilion',{role:'pavilion',foundation:'piers',supports:feet}),koreanFoundry('foundry',{supports:feet}),koreanDock('dock',{supports:feet})];
const report=[];
for(const a of samples)for(const scale of [.35,1]){const b=a.bounds,margin=24,cv=n.createCanvas(Math.ceil(b.w*scale)+margin*2,Math.ceil(b.h*scale)+margin*2),c=cv.getContext('2d'),x=margin-b.x*scale,y=margin-b.y*scale;
 g.HonroVectorArt.draw(c,a,{x,y,scale});const px=c.getImageData(0,0,cv.width,cv.height).data;let outside=0;
 for(let yy=0;yy<cv.height;yy++)for(let xx=0;xx<cv.width;xx++)if((xx<margin-1||yy<margin-1||xx>margin+b.w*scale+1||yy>margin+b.h*scale+1)&&px[(yy*cv.width+xx)*4+3]>8)outside++;
 const alpha=(xx,yy)=>px[(Math.round(y+yy*scale)*cv.width+Math.round(x+xx*scale))*4+3];
 const open=['pavilion','foundry','dock'].includes(a.id)?alpha(0,-130):null;
 report.push({id:a.id,scale,outside,openBayAlpha:open,paths:g.HonroVectorArt.prepare(a.vector).pathCount});assert.equal(outside,0,a.id+' paint bounds');if(open!==null)assert.equal(open,0,a.id+' open walking bay is visually empty');cv.width=1;cv.height=1;
}
fs.mkdirSync('_local/reports/act3-korean-late',{recursive:true});fs.writeFileSync('_local/reports/act3-korean-late/material-pixels.json',JSON.stringify(report,null,2)+'\n');console.log('PASS',report.length,'Native bounds/scale cases and six open-bay alpha samples');
