/** Production Scene and actual vector pixels; CSS sizes are supplied fixtures,
 * not browser layout/input or mobile GPU evidence. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createCanvas} from '@napi-rs/canvas';
import {guidanceRuntime} from './act2-guidance-helpers.mjs';
const g=await guidanceRuntime(),out='_local/reports/camera-resize';await mkdir(out,{recursive:true});
g.devicePixelRatio=1.25;const rows=[];
function setup({header=false}={}){
 const b=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[2],g.HONRO_PROJECT);g.HonroStageRules.sanitizeStageBattle(b);
 const e=new g.HONRO_CORE.Engine(b,()=>{},true),u=e.active,css={width:400,height:390},cv=createCanvas(400,390),ctx=cv.getContext('2d');
 cv.getContext=()=>ctx;cv.getBoundingClientRect=()=>({left:0,top:0,...css});Object.defineProperties(cv,{clientWidth:{get:()=>css.width},clientHeight:{get:()=>css.height}});
 const dom={reads:0};if(header)cv.closest=()=>({querySelector:selector=>({getBoundingClientRect(){dom.reads++;const left=selector==='.battle-info'?60:10,right=selector==='.battle-info'?(css.width<600?274:334):50,top=6,bottom=selector==='.battle-info'?(css.width<600?90:57.6):46;return{left,right,top,bottom,width:right-left,height:bottom-top};}})});
 const s=new g.HonroScene(cv);Object.assign(s,{x:u.x,y:u.y-170,scale:.82,time:2});s.render(e,0,'A01',.55,false,0);
 return{b,e,u,css,cv,s,dom};
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
 const q=setup({header:true}),{s,u,b,e}=q;let expected=1.65;
 if(mode==='manual')s.manual=true;
 if(mode==='story'){s.storyTween={kind:'static',start:performance.now(),duration:1000,from:{x:400,y:500,scale:.7},to:{x:400,y:500,scale:.7}};expected=.7;}
 if(mode==='goal')s.goalFocus={x:600,y:700,label:'Resize target',kind:'interact'};
 if(mode==='speaker'){s.speakerId=u.id;s.speakerUntil=performance.now()+10000;}
 if(mode==='focus'){s.focusId=u.id;s.focusUntil=performance.now()+10000;}
 if(mode==='projectile'){e.fire('A01',.5);assert(b.projectiles.length);}
 if(mode==='editor'){s.editorView=true;expected=.82;}
 if(mode==='preview'){s.skillPreview=true;expected=.82;}
 const saved=JSON.stringify(b),previousX=s.x;Object.assign(q.css,{width:944,height:232});s.render(e,0,'A01',.55,false,0);assert.equal(s.scale,expected,mode+' retains its camera zoom ownership');if(!['story','goal'].includes(mode))assert.equal(s.x,previousX,mode+' is never shifted away from the HUD');assert.equal(JSON.stringify(b),saved);rows.push({kind:'camera-owner-preserved',mode,scale:s.scale});dispose(q);
}
// Actual browser-measured header: info panel ends at x334/y57.6. Compare
// the production marker's opaque pixels, not just body/collision bounds.
const avoid=g.HonroCamera.avoidHeaderX;
for(const enabled of [false,true]){
 g.HonroCamera.avoidHeaderX=enabled?avoid:(_u,x)=>x;const q=setup({header:true}),{s,u,e,css,cv}=q;
 s.x=u.x+Math.min(170,css.width/s.scale*.19);s.y=g.HonroCamera.followY(u,css.height,s.scale);Object.assign(css,{width:944,height:232});s.render(e,0,'A01',.55,false,0);
 const reads=q.dom.reads;assert.equal(reads,4,'header measured only once per initial layout and resize');s.render(e,1,'A01',.55,false,0);assert.equal(q.dom.reads,reads,'steady frames never read HUD layout');
 assert(Math.abs(s.scale-.9082059254116547)<1e-9,'HUD avoidance never adds zoom-out');const center=g.HonroCamera.screen(s,944,232,u).x,base=472-170*s.scale;assert(Math.abs(center-base)<50,'smallest lateral clearance stays below 50 CSS pixels');
 const metrics=[];for(const time of [0,Math.PI/2,Math.PI/6]){
  s.time=time;const marker=createCanvas(944,232),c=marker.getContext('2d');c.setTransform(s.scale,0,0,s.scale,472-s.x*s.scale,116-s.y*s.scale);s.activeMarker(c,u,u.y-g.HonroPartyPresentationHeight(u)-12);
  const data=c.getImageData(0,0,944,232).data;let count=0,overlap=0;for(let y=0;y<232;y++)for(let x=0;x<944;x++)if(data[(y*944+x)*4+3]>160){count++;if(x>=10&&x<334&&y>=6&&y<58)overlap++;}
  assert(count>200);if(enabled)assert.equal(overlap,0,'the complete arrow and stroke clear the opaque header');else assert(overlap>100,'reference must reproduce the reported arrow occlusion');metrics.push({time,count,overlap});marker.width=1;
 }
 await writeFile(out+`/stage3-marker-header-${enabled?'fixed':'reference'}.png`,cv.toBuffer('image/png'));rows.push({kind:'actual-marker-header-pixels',enabled,center,shift:center-base,scale:s.scale,metrics});dispose(q);
}
g.HonroCamera.avoidHeaderX=avoid;
await writeFile(out+'/summary.json',JSON.stringify({passed:true,rows,limits:['Actual production Scene and Native Canvas pixels; supplied CSS geometry, not browser layout/input.','No mobile GPU performance claim.']},null,2)+'\n');console.log('PASS',rows.length,'production resize framing, painted bounds and camera ownership cases');
