/** Production Scene and actual vector pixels; CSS sizes are supplied fixtures,
 * not browser layout/input or mobile GPU evidence. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createCanvas} from '@napi-rs/canvas';
import {guidanceRuntime} from './act2-guidance-helpers.mjs';
const g=await guidanceRuntime(),out='_local/reports/camera-resize';await mkdir(out,{recursive:true});
g.devicePixelRatio=1.25;const rows=[];
function setup(){
 const b=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[2],g.HONRO_PROJECT);g.HonroStageRules.sanitizeStageBattle(b);
 const e=new g.HONRO_CORE.Engine(b,()=>{},true),u=e.active,css={width:400,height:390},cv=createCanvas(400,390),ctx=cv.getContext('2d');
 cv.getContext=()=>ctx;cv.getBoundingClientRect=()=>({left:0,top:0,...css});Object.defineProperties(cv,{clientWidth:{get:()=>css.width},clientHeight:{get:()=>css.height}});
 const s=new g.HonroScene(cv);Object.assign(s,{x:u.x,y:u.y-170,scale:.82,time:2});s.render(e,0,'A01',.55,false,0);
 return{b,e,u,css,cv,s};
}
function dispose({s,cv}){for(const t of s._domainTiles?.tiles.values()||[])t.canvas.width=1;s._domainTiles?.tiles.clear();s._staticWorldCache=null;cv.width=1;}
function assertFit(s,u,w,h){const height=g.HonroPartyPresentationHeight(u),foot=g.HonroCamera.screen(s,w,h,u),top=g.HonroCamera.screen(s,w,h,{x:u.x,y:u.y-height-16});assert(top.y>=h*.3-1e-6,JSON.stringify({top,foot,h}));assert(foot.y<=h*.78+1e-6);return{scale:s.scale,foot:foot.y,top:top.y};}
const f=setup(),before=JSON.stringify(f.b);Object.assign(f.css,{width:944,height:232});f.s.render(f.e,0,'A01',.55,false,0);
rows.push({kind:'portrait-to-short-landscape-paused',...assertFit(f.s,f.u,944,232)});assert(f.s.scale<1.65);assert.equal(JSON.stringify(f.b),before);
await writeFile(out+'/stage3-short-landscape-fixed.png',f.cv.toBuffer('image/png'));
// Inspect full, unclipped production actor pixels with vertical padding. This
// would still detect an oversized head/weapon if collision-height math passed.
for(const cls of ['archer','mage','knight','occultist']){
 const actor={...f.u,cls},s=f.s; s.scale=g.HonroCamera.fitFollowScale(actor,232,1.65);s.y=g.HonroCamera.followY(actor,232,s.scale);
 const cv=createCanvas(944,432),c=cv.getContext('2d');c.setTransform(s.scale,0,0,s.scale,472-s.x*s.scale,216-s.y*s.scale);s.unitBody(c,actor,0);
 const data=c.getImageData(0,0,944,432).data;let top=432,bottom=-1,count=0;for(let y=0;y<432;y++)for(let x=0;x<944;x++)if(data[(y*944+x)*4+3]>24){top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}
 assert(count>500);assert(top-100>=232*.3,'painted head/weapon must clear the header band: '+cls);assert(bottom-100<232*.82,'painted feet remain above the HUD: '+cls);
 rows.push({kind:'actual-painted-bounds',cls,top:top-100,bottom:bottom-100,pixels:count});cv.width=1;
}
dispose(f);
// Width-unchanged height loss and repeated orientation changes must also fit.
for(const heightOnly of [false,true]){const q=setup();if(heightOnly){q.s.scale=1.65;q.css.height=232;}else Object.assign(q.css,{width:944,height:232});q.s.render(q.e,0,'A01',.55,false,0);const first=assertFit(q.s,q.u,q.css.width,q.css.height);
 for(let i=0;i<3;i++){Object.assign(q.css,{width:400,height:390});q.s.render(q.e,0,'A01',.55,false,0);Object.assign(q.css,{width:944,height:232});q.s.render(q.e,0,'A01',.55,false,0);assertFit(q.s,q.u,944,232);}rows.push({kind:heightOnly?'height-only-resize':'repeated-rotation',first});dispose(q);}
for(const mode of ['manual','story','goal','speaker','focus','projectile','editor','preview']){
 const q=setup(),{s,u,b,e}=q;let expected=1.65;
 if(mode==='manual')s.manual=true;
 if(mode==='story'){s.storyTween={kind:'static',start:performance.now(),duration:1000,from:{x:400,y:500,scale:.7},to:{x:400,y:500,scale:.7}};expected=.7;}
 if(mode==='goal')s.goalFocus={x:600,y:700,label:'Resize target',kind:'interact'};
 if(mode==='speaker'){s.speakerId=u.id;s.speakerUntil=performance.now()+10000;}
 if(mode==='focus'){s.focusId=u.id;s.focusUntil=performance.now()+10000;}
 if(mode==='projectile'){e.fire('A01',.5);assert(b.projectiles.length);}
 if(mode==='editor'){s.editorView=true;expected=.82;}
 if(mode==='preview'){s.skillPreview=true;expected=.82;}
 const saved=JSON.stringify(b);Object.assign(q.css,{width:944,height:232});s.render(e,0,'A01',.55,false,0);assert.equal(s.scale,expected,mode+' retains its camera zoom ownership');assert.equal(JSON.stringify(b),saved);rows.push({kind:'camera-owner-preserved',mode,scale:s.scale});dispose(q);
}
await writeFile(out+'/summary.json',JSON.stringify({passed:true,rows,limits:['Actual production Scene and Native Canvas pixels; supplied CSS geometry, not browser layout/input.','No mobile GPU performance claim.']},null,2)+'\n');console.log('PASS',rows.length,'production resize framing, painted bounds and camera ownership cases');
