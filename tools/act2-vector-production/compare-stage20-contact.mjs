/** Raw authoring reference vs validated production VectorArt; no runtime limits bypassed. */
import {createHash} from 'node:crypto';import vm from 'node:vm';import assert from 'node:assert/strict';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createCanvas,Path2D} from '@napi-rs/canvas';
const base='_local/stage20-contact-v3',out='_local/reports/stage20-contact-precision';await mkdir(out,{recursive:true});const raw=JSON.parse(await readFile(base+'/high-precision-reference.json')),g=vm.createContext({Path2D});g.globalThis=g;vm.runInContext(await readFile('shared/map/vector-art.js','utf8'),g);
const parts=['outer-v1','west-v2','east-v2'],assets=[];
for(const part of parts){const a=JSON.parse(await readFile(`_local/reports/stage20-dense-final/${part}-baked.json`));assert.deepEqual(Array.from(g.HonroVectorArt.validate(a.vector)),[]);assets.push(a);}
// The high-precision SVG-like authoring tree is drawn directly only as reference,
// not inserted into an Engine or passed to/through a weakened validator.
const referenceAssets=structuredClone(assets);
function group(nodes){const groups=new Map;for(const n of nodes)groups.set(n.fill,(groups.get(n.fill)||'')+n.d);return [...groups].map(([fill,d])=>({tag:'path',fill,d,stroke:'none',fillRule:'nonzero'}));}
referenceAssets[0].vector.root.children[0].children.at(-1).children=group(raw.macro[0]);
referenceAssets[1].vector.root.children[0].children.at(-1).children=group(raw.macro[1]);
referenceAssets[2].vector.root.children[0].children.at(-1).children=raw.contact.flatMap(group);
function reference(c){for(const a of referenceAssets){
 const walk=(n,style={fill:'#000000',stroke:'none'})=>{c.save();if(n.transform)c.transform(...n.transform);if(n.clipPath)c.clip(new Path2D(a.vector.clips[n.clipPath].join(' ')));style={...style,...n};if(n.tag==='path'){c.fillStyle=style.fill;c.fill(new Path2D(n.d??n.dParts.join('')),style.fillRule||'nonzero');}else for(const child of n.children)walk(child,style);c.restore();};walk(a.vector.root);
}}
const views=[['entry',400,4550,1],['entry-2x',400,4520,2],['shelf',5100,3650,1],['shelf-2x',5100,3570,2],['exit',8450,2650,1],['exit-2x',8450,2560,2],['roof',2100,1000,.35],['deep',4500,8200,.25]];let rows=[];
for(const [name,x,y,scale]of views){for(const mode of ['raw','final']){const cv=createCanvas(1440,900),c=cv.getContext('2d');c.translate(720,450);c.scale(scale,scale);c.translate(-x,-y);if(mode==='raw')reference(c);else for(const a of assets)g.HonroVectorArt.draw(c,a,{x:0,y:0,scale:1});await writeFile(`${out}/${name}-${mode}.png`,cv.toBuffer('image/png'));}rows.push({name,x,y,scale,width:1440,height:900});}
await writeFile(out+'/vector-sha256.json',JSON.stringify(assets.map(a=>({id:a.id,sha256:createHash('sha256').update(JSON.stringify(a.vector)).digest('hex')})),null,2));await writeFile(out+'/views.json',JSON.stringify(rows));console.log(out);
