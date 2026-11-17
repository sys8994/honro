/** Source-scale vector renders used solely to derive a geological partition. */
import vm from'node:vm';import{createCanvas,Path2D,DOMMatrix}from'@napi-rs/canvas';import{readFile,writeFile,mkdir}from'node:fs/promises';
const g=vm.createContext({Path2D,DOMMatrix,console});vm.runInContext(await readFile('shared/map/vector-art.js','utf8'),g);
await mkdir('_local/reports/stage48-region',{recursive:true});
for(const [name,file]of [['deep','stage48-continuous-v11-bleed.json'],['joint','stage48-joint-v12.json']]){const a=JSON.parse(await readFile('shared/assets/environment/act5/'+file)),c=createCanvas(1118,650),x=c.getContext('2d');x.scale(.5,.5);x.translate(350,-300);g.HonroVectorArt.draw(x,a,{});await writeFile('_local/reports/stage48-region/'+name+'.png',c.toBuffer('image/png'));}
