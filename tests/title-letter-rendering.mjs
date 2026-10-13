/** Actual SVG raster/color/alpha diagnostics; never a Chromium layout or art-approval substitute. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='shared/assets/environment/title/',main=await readFile('shared/runtime/main.js','utf8');
const defs=main.match(/<defs><filter id="honro-title-ink"[\s\S]*?<\/defs>/)[0];
const expected={
 'hanja-wordmark.png':'4bc7d957ebc4d57be206a70070cc53e9921822c865a30ada027456c2f5857111',
 'wordmark.png':'696d0c688d361feefa4a66902ac0e8c327d77a1c05a4c45593e01683d9f8d5c0',
};
const results=[];
for(const [file,expectedSha] of Object.entries(expected)){
 const bytes=await readFile(root+file),sha=createHash('sha256').update(bytes).digest('hex');assert.equal(sha,expectedSha,'Approved source pixels remain byte-identical');
 const {data:original,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${info.width}" height="${info.height}">${defs}<image xlink:href="data:image/png;base64,${bytes.toString('base64')}" width="${info.width}" height="${info.height}" filter="url(#honro-title-ink)"/></svg>`;
 const output=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
 let maxAlphaDelta=0,maskDifferences=0,samples=0,sourceLuma=0,luma=0,min=255,max=0;
 for(let i=0;i<original.length;i+=4){const a=original[i+3],b=output[i+3];maxAlphaDelta=Math.max(maxAlphaDelta,Math.abs(a-b));if((a===0)!==(b===0))maskDifferences++;if(a===255){const before=(original[i]+original[i+1]+original[i+2])/3,after=(output[i]+output[i+1]+output[i+2])/3;samples++;sourceLuma+=before;luma+=after;min=Math.min(min,after);max=Math.max(max,after);}}
 assert.equal(maskDifferences,0,'No missing strokes, opaque halo or alpha background introduced');assert(maxAlphaDelta<=1,'Only raster-rounding alpha difference allowed');
 assert(luma/samples<sourceLuma/samples*.65,'Ink is substantially darker than the approved ivory source');assert(luma/samples>95,'Dark lettering retains a readable ash midtone');assert(max-min>20&&max-min<110,'Broad organic wash has restrained tonal variation');
 results.push({file,sha256:sha,width:info.width,height:info.height,maxAlphaDelta,maskDifferences,sourceMean:sourceLuma/samples,ashMean:luma/samples,inkRange:[min,max]});
}
// Complementary native-coordinate clipping covers every source pixel once, including the long 혼 brush tip.
for(let y=0;y<550;y++)for(let x=0;x<1100;x++){const split=y<380?575:550;const hon=x<split,ro=x>=split;assert.notEqual(hon,ro);if(hon)assert(x<575);if(ro)assert(x>=525);}
const views=[];
for(const [w,h] of [[1440,900],[400,800],[333,740],[333,592],[844,390],[667,333]]){
 const p=h>w,compact=p&&h<=650,low=!p&&h<=540,tiny=low&&h<=380,mw=p?(compact?Math.min(225,w*.7):Math.min(295,w*.79)):(tiny?170:low?220:Math.min(390,w*.4));
 const mx=p?(w-mw)/2:(low?w*.06:Math.max(32,Math.min(130,w*.07))),mh=mw/1.85,kx=mx+mw*.97,ky=mh*.48,kh=mw*.115*550/575;
 assert(kx>=mx+mw*.95);assert(ky>(mw*846/1859)*.5);assert(kx+mw*.115<w);assert(ky+kh*2<mh);
 views.push({width:w,height:h,hanjaWidth:mw,hangulRight:kx+mw*.115,hangulEachHeight:kh,reservedHeight:mh});
}
await mkdir('_local/reports/title-ashen',{recursive:true});await writeFile('_local/reports/title-ashen/letter-rendering.json',JSON.stringify({results,views,scope:'librsvg pixel/alpha tests and CSS dimension equations; not browser/Pages verification'},null,2)+'\n');
console.log('PASS original PNG identity; actual SVG ash pixels/alpha; complementary upright syllable crops; six viewport bounds equations. Browser and art review are separate.');
