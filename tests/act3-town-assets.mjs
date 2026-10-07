/** Draft-only geometry/portability checks; not gameplay or browser evidence. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {compileSVG} from '../tools/environment/build-act2-art.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),draft=path.join(root,'workshop/drafts/act3-town-assets');
const manifest=JSON.parse(await readFile(path.join(draft,'manifest.json'),'utf8'));
const require=createRequire(import.meta.url),native=require('@napi-rs/canvas');
const g=vm.createContext({Path2D:native.Path2D});vm.runInContext(await readFile(path.join(root,'shared/map/vector-art.js'),'utf8'),g);
assert.equal(manifest.status,'inactive-art-draft');assert.equal(manifest.runtimeRegistration,false);assert.deepEqual(manifest.collision,[]);assert.equal(manifest.assets.length,3);
const flat=node=>[node,...(node.children||[]).flatMap(flat)],rows=[];
const bound=(cv,offsetX,offsetY)=>{const pixels=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let left=cv.width,top=cv.height,right=-1,bottom=-1,count=0;for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++)if(pixels[(y*cv.width+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}assert(count>1000);return{x:left-offsetX,y:top-offsetY,w:right-left+1,h:bottom-top+1,pixels:count};};
for(const a of manifest.assets){
 const source=await readFile(path.join(draft,a.file),'utf8');assert(Buffer.byteLength(source)<14000);assert(!/<(?:image|script|foreignObject|filter|use|pattern|text)\b|\bhref\s*=|\bon\w+\s*=/i.test(source));
 execFileSync('python',['-c','import sys, xml.etree.ElementTree as ET; ET.parse(sys.argv[1])',path.join(draft,a.file)]);
 const vector=compileSVG(source);assert.deepEqual(JSON.parse(JSON.stringify(g.HonroVectorArt.validate(vector))),[]);
 const [x,y,w,h]=vector.viewBox;assert.deepEqual({x,y,w,h},a.reference.bounds);assert.equal(a.reference.heightM*60,h);assert.deepEqual(a.reference.foot,{x:0,y:0});assert.equal(a.candidateLayer,'L1-back');
 const cache=g.HonroVectorArt.prepare(vector);assert(cache.pathCount<80);assert.equal(g.HonroVectorArt.prepare(vector),cache);
 const cv=native.createCanvas(w+80,h+80),c=cv.getContext('2d'),ox=40-x,oy=40-y,asset={vector,anchor:a.reference.foot};
 g.HonroVectorArt.draw(c,asset,{x:ox,y:oy,scale:1});const actual=bound(cv,ox,oy),b=a.reference.bounds;
 assert(actual.x>=b.x&&actual.y>=b.y&&actual.x+actual.w<=b.x+b.w&&actual.y+actual.h<=b.y+b.h,`${a.id} paint exceeds reference bounds`);
 for(const [px,py] of a.groundContacts){assert.equal(py,0);assert(c.getImageData(ox+px,oy-3,1,1).data[3]>200,`${a.id} ground contact not painted`);assert.equal(c.getImageData(ox+px,oy+2,1,1).data[3],0,`${a.id} ground leaks below zero`);}
 for(const clear of a.clearRegions){const p=c.getImageData(ox+clear.x,oy+clear.y,clear.w,clear.h).data;for(let i=3;i<p.length;i+=4)assert.equal(p[i],0,`${a.id}/${clear.name} must stay transparent`);}
 const roof=flat(vector.root).find(n=>n.id===a.roof.groupId);assert(roof);const rv={...vector,root:{tag:'g',children:[roof]}};c.clearRect(0,0,cv.width,cv.height);g.HonroVectorArt.draw(c,{vector:rv},{x:ox,y:oy,scale:1});const rb=bound(cv,ox,oy),eb=a.roof.bounds;
 assert(rb.x>=eb.x&&rb.y>=eb.y&&rb.x+rb.w<=eb.x+eb.w&&rb.y+rb.h<=eb.y+eb.h,`${a.id} true roof paint exceeds declared roof bounds`);
 const mobile=native.createCanvas(390,250);g.HonroVectorArt.draw(mobile.getContext('2d'),asset,{x:195,y:230,scale:.24});const mb=bound(mobile,0,0);assert(mb.w>250&&mb.w<390);assert(mb.h>100);assert(mb.x>=0&&mb.x+mb.w<=390&&mb.y>=0&&mb.y+mb.h<=250);
 rows.push({id:a.id,bytes:Buffer.byteLength(source),paths:cache.pathCount,sha256:createHash('sha256').update(source).digest('hex'),paintBounds:actual,roofPaintBounds:rb,clearRegions:a.clearRegions.length,groundContacts:a.groundContacts.length,mobilePixelBounds:mb});cv.width=1;cv.height=1;mobile.width=1;mobile.height=1;
}
// Historical byte-identity evidence is opt-in: future legitimate production
// changes must not be rejected merely because this inactive draft still exists.
const checkBaseline=process.argv.includes('--check-baseline');
for(const file of ['shared/data/campaign.json','shared/data/elements.json','shared/build.mjs','HONRO.html','HONRO_WORKSHOP.html']){
 const current=await readFile(path.join(root,file));
 if(checkBaseline){const baseline=execFileSync('git',['show',manifest.baseCommit+':'+file],{cwd:root,maxBuffer:20*1024*1024});assert.deepEqual(current,baseline,file+' changed during draft art work');}
 for(const a of manifest.assets){assert(!current.includes(a.id),file+' unexpectedly registers draft asset');assert(!current.includes(a.file),file+' unexpectedly embeds draft asset');}
}
for(const file of ['shared/build.mjs','tools/environment/build-act1-art.mjs','tools/environment/build-act2-art.mjs']){const s=await readFile(path.join(root,file),'utf8');assert(!s.includes('drafts/act3-town-assets'));for(const a of manifest.assets)assert(!s.includes(a.file));}
const out=path.join(root,'_local/reports/act3-town-assets');await mkdir(out,{recursive:true});await writeFile(path.join(out,checkBaseline?'validation-baseline.json':'validation.json'),JSON.stringify({passed:true,rows,activeDraftRegistration:false,activeInputsUnchanged:checkBaseline?true:null,baselineCommit:checkBaseline?manifest.baseCommit:null,limits:['Native Canvas only','No map placement, collision, UI, browser, combat, final art approval or performance claim']},null,2)+'\n');
console.log('PASS 3 inactive town assets: XML, production vector compiler, paint/roof bounds, 4 transparent regions, 13 grounded contacts, mobile scale and active-source isolation');
