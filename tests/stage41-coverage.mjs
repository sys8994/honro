/** Stage41: exact source geometry/contacts retained, final coverage applied once. */
import assert from 'node:assert/strict';import fs from 'node:fs';import{createHash}from'node:crypto';import{Path2D,DOMMatrix,createCanvas}from'@napi-rs/canvas';import{makeAct5}from'../shared/act5-world.mjs';
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex'),project=await makeAct5(),a=project.library.find(a=>a.id==='act5:near:41');
assert.equal(hash(a.vector),'08a198f2886447609b6695435a1cd0bc6265e6e863cff79b9b0e275063c4d2c5','original source vector unchanged');
const proof=JSON.parse(fs.readFileSync('art/stage41-join/shadow-edit-proof.json')),raw=fs.readFileSync('shared/assets/environment/act5/camp-west-geology.json','utf8');
const west=JSON.parse(raw),rows=west.vector.root.children[0].children[0].children[0].children;assert.equal(rows[5].fill,'#3a3029');
// Native fill-only edit: restore exactly this node's serialized fill to compare.
const needle='"fill":"#3a3029"';let n=0;const before=raw.replace(/"fill":"#[0-9a-f]{6}"/g,s=>++n===6?'"fill":"#47372c"':s);
assert.equal(hash(before),proof.originalSHA256,'only one fill token changed; all paths/metadata preserved');
if(process.argv.includes('--baseline-all')){
 assert.equal(hash(project.stages),'461ef025638233c6173aa469cc3296b2ba104c2b28ea846f775f3769810e2538');
 assert.equal(hash(project.content),'9e5ea9e873358c9caea75fb306ad5586ec6e4d9eb47d41fd50315e14e9c53f42');
 assert.equal(hash(project.library.filter(x=>x.id!==a.id)),'84485d5e6b3250a5aa7f33fb1da8d2675df2c62b867095c97fc524d37265a293');
}
const c=createCanvas(1,1).getContext('2d'),path=d=>new Path2D(d),inPath=(p,x,y)=>c.isPointInPath(p,x,y),hole=path('M0 0H300V560L190 650Q200 720 300 750V827H0Z'),east=path('M0 0H1902V350H1796V428H1838V438Q1841 456 1820 466Q1790 476 1790 488Q1794 505 1820 514V530H1902V827H0Z'),overlay=path('M300 428H1838V438H300ZM300 514H1902V529H300ZM0 545Q35 546 70 548L130 555L220 562L280 566L300 557V565L280 574L220 570L130 563L70 556Q35 550 0 545Z');
let checks=0;
for(const phase of ['main','overlay'])for(const [i,key]of['a','b'].entries()){
 const native=path('');native.addPath(path(a.vector.clips[key].join(' ')),new DOMMatrix(a.vector.root.children[i].transform));
 const final=path(a.campSourceCoverage[phase][i].join(' ')),expected=(x,y)=>inPath(native,x,y)&&(phase==='main'?inPath(east,x,y)&&!inPath(hole,x,y):inPath(overlay,x,y));
 for(let y=1.1;y<827;y+=4)for(let x=1.3;x<1902;x+=4){const yes=expected(x,y);if(![[.05,0],[-.05,0],[0,.05],[0,-.05]].every(([dx,dy])=>expected(x+dx,y+dy)===yes))continue;assert.equal(inPath(final,x,y),yes,`${phase}-${key} interior ${x},${y}`);checks++;}
}
console.log(JSON.stringify({pass:true,coverageInteriorSamples:checks,originalSourceAndGeometry:true,onlyOneExistingShadowColorChanged:true,baselineAll:process.argv.includes('--baseline-all')}));
