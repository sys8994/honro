/** Encode existing background-only paintings; never author or eager-decode art. */
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {REST_BACKDROPS} from '../../shared/assets/environment/vector-kit/rest.mjs';
let encoded;
export function restBackdropData(){
 return encoded??=Promise.all(Object.entries(REST_BACKDROPS).map(async([key,spec])=>{
  const source=await readFile(new URL('../../shared/assets/environment/'+spec.file,import.meta.url));
  const bytes=await sharp(source).resize({width:2048,withoutEnlargement:true}).webp({quality:82,effort:5}).toBuffer();
  return[key,'data:image/webp;base64,'+bytes.toString('base64')];
 })).then(async entries=>{
  const guardian=await readFile(new URL('../../shared/assets/environment/rest-stage10/root-stairs.webp',import.meta.url));
  return{revision:1,images:Object.fromEntries(entries),landmarks:{guardianRootSteps:'data:image/webp;base64,'+guardian.toString('base64')}};
 });
}
