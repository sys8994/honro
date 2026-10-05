import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {applyAct2VectorArt,compileSVG,ACT2_VECTOR_FILES} from '../tools/environment/build-act2-art.mjs';
const require=createRequire(import.meta.url),native=require('@napi-rs/canvas'),g=vm.createContext({Path2D:native.Path2D,console});
vm.runInContext(await readFile('shared/map/vector-art.js','utf8'),g);
const project=await applyAct2VectorArt(JSON.parse(await readFile('shared/data/campaign.json','utf8'))),before=JSON.stringify(project);
await applyAct2VectorArt(project);assert.equal(JSON.stringify(project),before,'art compilation must be deterministic');
const rows=[],hash=b=>createHash('sha256').update(b).digest('hex');
for(const id of Object.keys(ACT2_VECTOR_FILES)){
 const a=project.library.find(a=>a.id===id);assert.equal(g.HonroVectorArt.validate(a.vector).length,0,id);assert.equal(a.collision.length,0,id+' art must remain non-collision');assert(!/<(?:image|script|foreignObject|use)\b/i.test(a.vector.source));
 const clone=JSON.parse(JSON.stringify(a));clone.id='renamed-'+id;const c1=native.createCanvas(800,800),c2=native.createCanvas(800,800),draw=(c,x)=>g.HonroVectorArt.draw(c.getContext('2d'),x,{x:390,y:700,scale:.7,rotation:.13});
 const snapshot=JSON.stringify(a);draw(c1,a);draw(c2,clone);assert.equal(hash(c1.toBuffer('image/png')),hash(c2.toBuffer('image/png')),id+' renamed/exported source must keep identical art');assert.equal(JSON.stringify(a),snapshot,id+' renderer mutation');assert(c1.getContext('2d').getImageData(0,0,800,800).data.some((x,i)=>i%4===3&&x>0),id+' empty drawing');
 assert.equal(g.HonroVectorArt.prepare(a.vector),g.HonroVectorArt.prepare(a.vector),'retained Path2D cache');
 rows.push({id,paths:g.HonroVectorArt.prepare(a.vector).pathCount,portable:true,collision:false});
}
for(const node of ['<image href="x"/>','<script>x</script>','<foreignObject/>','<path d="M0 0L1 1" onclick="x()"/>','<use href="#x"/>'])assert.throws(()=>compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${node}</svg>`));
const a=project.library.find(a=>a.vector);assert(g.HonroVectorArt.validate({...a.vector,version:999}).length);assert(g.HonroVectorArt.validate({...a.vector,source:'<svg><image/></svg>'}).length);
const inheritedPaint=structuredClone(a.vector);inheritedPaint.gradients={};inheritedPaint.root={tag:'path',d:'M0 0H10V10H0Z',fill:'url(#toString)'};assert(g.HonroVectorArt.validate(inheritedPaint).length,'prototype gradient names must not count as declared paints');
for(const id of ['constructor','__proto__']){const vector=compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><defs><linearGradient id="${id}" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#112233"/><stop offset="1" stop-color="#ddeeff"/></linearGradient></defs><path d="M0 0H20V20H0Z" fill="url(#${id})"/></svg>`);assert.equal(g.HonroVectorArt.validate(vector).length,0);const c=native.createCanvas(20,20);assert.doesNotThrow(()=>g.HonroVectorArt.draw(c.getContext('2d'),{vector,anchor:{x:0,y:0}},{x:0,y:0,scale:1}));assert(c.getContext('2d').getImageData(10,10,1,1).data[3]>0);}
const workshop=await readFile('workshop/src/app.js','utf8');assert(workshop.includes('SVG 원본 내보내기'));assert(workshop.includes("if(a.vector){const b=assetBounds(a)"),'vector selection must follow actual bounds');assert(workshop.includes('if(!a.vector&&selectedShapeIndex'));
await mkdir('_local/reports/act2-spatial',{recursive:true});await writeFile('_local/reports/act2-spatial/vector-assets.json',JSON.stringify({rows,checks:['deterministic SVG compilation','pure SVG safety and version rejection','actual native Canvas pixels','renamed and serialized asset identity','no draw mutation','retained path cache','no gameplay collision','workshop source integration'],limits:['Workshop browser selection/input not exercised','SVG and browser Canvas visual parity still requires browser verification']},null,2)+'\n');
console.log('PASS portable pure-SVG display lists, native Canvas identity, safety validation and workshop source contracts',rows.length);
