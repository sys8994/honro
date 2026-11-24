// Minimal synthetic test inputs; never Act6 products or real terrain.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {IDS,party} from '../transition-contract.mjs';
export const baseBytes=readFileSync(new URL('./campaign.87a0aa3d3cdf5dec.json',import.meta.url));
export const baseSHA256='87a0aa3d3cdf5dec48ab9384cd9adbabb0a259bc4cab6f0514dfab970a1c6289';
export function fixture(){
 const files=new Map(), token=(alias,ext,obj)=>{
   const bytes=Buffer.isBuffer(obj)?obj:Buffer.from(JSON.stringify(obj)+'\n');
   const sha256=createHash('sha256').update(bytes).digest('hex');
   const path=alias+'.'+sha256.slice(0,16)+'.'+ext;
   files.set(path,bytes);return {path,bytes:bytes.length,sha256};
 };
 const stages=IDS.map((id,i)=>{
  const name='fixture '+id, w=4000+i,h=2300, p=party(id);
  const content={id,act:6,actStage:i+1,name,w,h,requires:[id-1],playableRoster:p};
  const balance={id,act:6,actStage:i+1}, journey={stageId:id,anchorId:'fixture-'+id};
  const provider={id:'act6:'+id+':body'};
  const media=id===51?[token('web/data/fixture-new-media','bin',Buffer.from('isolated faux media'))]:[];
  if(media.length)provider.foo={$honroAsset:media[0].path};
  const assets=token('web/data/chapter-'+id+'-assets','json',[provider]);
  const scene={id:'stage-'+id,name,width:w,height:h,backdrop:'temple',metadata:{stageId:id,act:6,actStage:i+1,campaign:true},
    units:p.map(kind=>({id:'fixture-'+kind,kind,team:'player',x:150,y:400})),terrains:[{id:'fixture-solid',points:[[0,400],[4000,400],[4000,2300],[0,2300]]}],elements:[{id:'fixture-body',assetId:provider.id}]};
  const map=token('web/data/chapter-'+id,'json',scene);
  return {id,content,balance,journey,map,assets,catalogBackdrop:scene.backdrop,media};
 });
 return {enabled:true,baseBytes,baseSHA256,stages,files,read:files.get.bind(files),token};
}
