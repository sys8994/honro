import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const get=(x)=>readFile(new URL(x,import.meta.url));
const str=async n=>(await get(n)).toString('utf8');
const pin=(source)=>source.replace(/^import .*;\n/gm,'').replaceAll('export ','');
export async function normalLateFarSource(){
 const group=async (names,ret)=>'const {'+ret+'}=(()=>{\n'+(await Promise.all(names.map(async n=>pin(await str('normal-'+n+'.mjs'))))).join('\n')+'\nreturn {'+ret+'};})();\n';
 return (await group(['stage58-far-data','stage58-far'],'mountStage58Far'))+
 (await group(['stage58-camera'],'attachStage58Camera'))+
 (await group(['stage58-floor-facets'],'attachStage58FloorFacets'))+
 (await group(['stage59-visual-owner'],'attachStage59Visual'))+
 (await group(['stage59-matte-bound'],'attachStage59Matte'))+
 (await group(['giant-forepaw','stage59-forepaw-cue'],'attachStage59Forepaw'))+await str('normal-late-far.inc.js');
}
export async function loadNormalLateFar(){
 const table=[
   ['early-art/act6-far-58-wide.696fd1dfe489567e.webp','act6-far-58-wide',343208,'696fd1dfe489567e8032a3f2a2a8be45539ddae488e67baf01f37f82c382e22d'],
   ['stage59-far-q94-derived.webp','act6-qa-art-59',280846,'e1b0e699a8349a0af93f4717b06ef4a7ddffa5b4abf15261cd3881d3691383e1']
 ];
 const [a,b]=await Promise.all(table.map(async([file,stem,len,sha])=>{
   const bytes=await get(file);assert.equal(bytes.length,len);assert.equal(createHash('sha256').update(bytes).digest('hex'),sha);
   return {stem,bytes,plate:{path:'/web/graphics/'+stem+'.'+sha.slice(0,16)+'.webp',bytes:len,sha}};
 }));
 return {manifest:{plate59:b.plate},extras:[a,b]};
}
