/** Four-actor portrait framing proof using production renderers and Native Canvas.
 * Does not claim browser CSS geometry or normal gameplay. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createCanvas} from '@napi-rs/canvas';
import {guidanceRuntime} from './act2-guidance-helpers.mjs';
const out='_local/reports/portrait-framing';await mkdir(out,{recursive:true});
const g=await guidanceRuntime();
function canvas(w=400,h=400){const cv=createCanvas(w,h),ctx=cv.getContext('2d');cv.getContext=()=>ctx;Object.defineProperties(cv,{clientWidth:{get:()=>cv.width},clientHeight:{get:()=>cv.height}});cv.getBoundingClientRect=()=>({left:0,top:0,width:cv.width,height:cv.height});return cv;}
g.document.createElement=()=>canvas();
const roles=[['camp-phone',27,34,44,54],['camp-desktop',44,46,56,68],['summary-desktop',66,77,78,94],['story-narrow',64,90,84,100],['story-phone',96,126,112,132],['story-desktop',220,242,240,264],['story-landscape',140,154,140,154],['training-phone',54,64,64,76],['training-desktop',76,92,88,108],['toolbar-phone',34,48,40,48],['hud-phone',27,34,27,34],['hud-landscape',24,30,24,30]];
const actors=['archer','mage','knight','occultist'];let before,after;const images={before:{},after:{}};
function bounds(cv){const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let left=cv.width,top=cv.height,right=0,bottom=0,count=0;for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++)if(d[(y*cv.width+x)*4+3]>24){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);count++;}return{left,top,right,bottom,count};}
function headPixels(head,crop,w,h){return {left:(head.left-crop.x)/crop.width*w,right:(head.right-crop.x)/crop.width*w,top:(head.top-crop.y)/crop.height*h,bottom:(head.bottom-crop.y)/crop.height*h};}
function collect(phase){const rows=[];for(const cls of actors)for(const[role,bw,bh,aw,ah]of roles){
 const[w,h]=phase==='before'?[bw,bh]:[aw,ah],cv=canvas(w,h),isStory=role.startsWith('story'),isHud=role.startsWith('hud'),[sw,sh]=isStory?[400,440]:isHud?[88,108]:[160,192],source=canvas(sw,sh);
 const actor={cls,side:0,id:`portrait-${cls}`,h:88,r:20,x:10,y:20,hp:1,mp:2},original=JSON.stringify(actor),{crop,head}=g.HonroPortraits.draw(source,actor,cls);
 // Match the real cached image/canvas dimensions and CSS contain + top alignment.
 // HUD canvases stretch to their compact box; cards/dialogue preserve aspect ratio.
 const scale=Math.min(w/sw,h/sh),sx=isHud?w/sw:scale,sy=isHud?h/sh:scale,dx=isHud?0:(w-sw*scale)/2,dy=0;
 cv.getContext('2d').drawImage(source,dx,dy,sw*sx,sh*sy);
 const native=headPixels(head,crop,sw,sh),pixel={left:dx+native.left*sx,right:dx+native.right*sx,top:dy+native.top*sy,bottom:dy+native.bottom*sy},pad=Math.min(w,h)*.025;
 assert(pixel.left>pad&&pixel.right<w-pad&&pixel.top>pad&&pixel.bottom<h-pad,`${phase}/${cls}/${role}: protect entire head: ${JSON.stringify(pixel)}`);assert.equal(JSON.stringify(actor),original);
 images[phase][`${cls}-${role}`]=cv;rows.push({cls,role,w,h,crop,head:pixel,ink:bounds(cv)});
 }return rows;}
vm.runInContext(await readFile('tests/fixtures/portraits-before-ui.js','utf8'),g);before=collect('before');
vm.runInContext(await readFile('shared/runtime/portraits.js','utf8'),g);after=collect('after');
const metrics=after.map((a,i)=>{const b=before[i],ratio=(a.head.bottom-a.head.top)/(b.head.bottom-b.head.top);assert(ratio>=.99,`${a.cls}/${a.role}: face must not shrink`);return{cls:a.cls,role:a.role,beforeBox:[b.w,b.h],afterBox:[a.w,a.h],headHeightBefore:b.head.bottom-b.head.top,headHeightAfter:a.head.bottom-a.head.top,headScale:ratio,head:a.head,ink:a.ink};});
for(const cls of actors){const phone=metrics.find(r=>r.cls===cls&&r.role==='camp-phone');assert(phone.headScale>1.5,'camp phone: visibly enlarge every character');}
for(const role of ['camp-phone','story-phone','hud-phone','training-phone','story-landscape']){const sheet=canvas(1040,320),c=sheet.getContext('2d');c.fillStyle='#14262b';c.fillRect(0,0,sheet.width,sheet.height);for(const[ci,cls]of actors.entries()){c.fillStyle='#e8d9b4';c.font='14px sans-serif';c.fillText(cls,ci*260+12,24);for(const[phase,x]of [['before',ci*260+18],['after',ci*260+137]]){const cv=images[phase][`${cls}-${role}`];c.fillStyle='#e8d9b4';c.fillText(phase,x,48);c.drawImage(cv,x,65);}}await writeFile(`${out}/${role}-before-after.png`,sheet.toBuffer('image/png'));}
for(const actor of [{id:'npc-woodcutter',name:'나무꾼',cls:'knight',side:2,honroAlly:true,allyRole:'guard'},{id:'resident-1',name:'연실',cls:'mage',side:2,honroCivilian:true,honroType:'civilian'},{id:'boss',name:'소단',cls:'occultist',side:1,boss:true,honroFinalBoss:true},{id:'summon',cls:'occultist',side:0,summoned:true,summonKind:'stalker'}]){const cv=canvas(200,240),original=JSON.stringify(actor);assert(g.HonroPortraits.draw(cv,actor,actor.cls));assert.equal(JSON.stringify(actor),original);}
await writeFile(`${out}/summary.json`,JSON.stringify({status:'passed',mode:'Native Canvas production portraits, DOM layout not verified',checks:metrics.length*2+4,metrics},null,2)+'\n');
console.log('PASS 96 head-safety/non-shrinking comparisons and 4 non-party identities');console.log(JSON.stringify(metrics.filter(x=>['camp-phone','story-phone','hud-phone'].includes(x.role)),null,2));
