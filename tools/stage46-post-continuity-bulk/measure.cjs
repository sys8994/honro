'use strict';
const fs=require('fs'),path=require('path'),{chromium}=require('playwright'),{createHash}=require('crypto'),assert=require('assert/strict');
const out='./evidence/',stock='./';
const src=fs.readFileSync(stock+'original-assembled.json'),original=JSON.parse(src);
assert.equal(original.id,'act5:near:46');assert.equal(original.shaftExteriorParts.length,5);
const renderer=stock+'vector-art.js';
const bounds={full:[-5000,-400,9600,15200],terrainDomain:[-1800,-2400,5896,8704],play:[0,0,4096,6504]};
const digest=a=>createHash('sha256').update(a).digest('hex');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage();await page.setContent('<canvas></canvas>');
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.evaluate(()=>{globalThis.HonroScene=class {landmark(){throw Error('Unexpected fallback');}_landmarkPaintBounds(){return null;}
  _makeLayerCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}_releaseRasterCanvas(c){c.width=0;c.height=0;}};});
  for(const f of [renderer,stock+'visual-style.js',stock+'act5-edge-art.js'])await page.addScriptTag({content:fs.readFileSync(f,'utf-8')});
  await page.evaluate(a=>{globalThis.scene=new HonroScene;scene.battle={honroStage:46};globalThis.modes={
   'composite-all':a,
   'bulk-plus-protected-core':{...a,shaftTree:null,vector:{...a.vector,symbols:{},root:{...a.vector.root,children:a.vector.root.children.slice(0,2)}}},
  };},original);
  const res={};
  for(const mode of ['composite-all','bulk-plus-protected-core']){
   for(const [window,b] of Object.entries(bounds)){
    for(const z of [0.0625,0.125,0.25]){
     const r=await page.evaluate(({mode,z,b,witness})=>{
      const [x,y,right,bottom]=b,width=Math.round((right-x)*z),height=Math.round((bottom-y)*z),canvas=document.querySelector('canvas');
      canvas.width=width;canvas.height=height;const c=canvas.getContext('2d',{willReadFrequently:true}),sx=width/(right-x),sy=height/(bottom-y);
      c.setTransform(sx,0,0,sy,-x*sx,-y*sy);const asset=modes[mode];
      scene.landmark(c,{id:'a5-near',assetId:asset.id,asset,x:0,y:0,scale:4,rotation:0,layer:'structural-back',depthLayer:'L1',visualRole:'scenery'});
      const data=c.getImageData(0,0,width,height).data;let a=0,opaque=0,zero=0;
      for(let i=3;i<data.length;i+=4){a+=data[i];opaque+=(data[i]===255);zero+=(data[i]===0);}
      return {nominal_px_per_world:z,dims:[width,height],effective:[sx,sy],alpha_area_wu2:a/255/(sx*sy),opaque_area_wu2:opaque/(sx*sy),empty_world_area:zero/(sx*sy),...(witness?{png:canvas.toDataURL('image/png')}: {})};
     },{mode,z,b,witness:z===.125&&mode==='bulk-plus-protected-core'});
     if(r.png){fs.writeFileSync(out+'skywell-browser-'+window+'-mask.png',Buffer.from(r.png.split(',')[1],'base64'));delete r.png;}
     (res[mode+':'+window]??=[]).push(r);
    }
    console.log(mode,window,res[mode+':'+window].map(x=>Math.round(x.alpha_area_wu2)).join(','));
   }
  }
  assert.deepEqual(errors,[]);
  const allowedSpread=0.01;
  const conv=Object.fromEntries(Object.entries(res).map(([k,v])=>[k,(Math.max(...v.map(v=>v.alpha_area_wu2))-Math.min(...v.map(v=>v.alpha_area_wu2)))/v.at(-1).alpha_area_wu2]));
  fs.writeFileSync(out+'stage46-composed-bulk-browser.json',JSON.stringify({method:'Isolated exact verified Stage46 landmark compositor and original source/clip. Browser, no real campaign/camera. Full window=art artifact bounds; terrain domain and play bounds from pinned QA proof. Bulk mode uses six exterior bulk + protected roots, excludes explicit shaftTree and source interior symbols/props. Spatial outside-of-play = full area minus play-window area. Alpha weighted, no ground polygon claim. No alterations to project/runtime.',source_sha256:digest(src),renderer_git_blob:'6bce33f337c80db7be7f807fe8645561195115ec',compositor_git_blob:'09a70bccac0ede6bee32e57d893be6a0d63b51ef',convergence_guard:{allowedSpread,relativeSpread:conv,pass:Object.values(conv).every(v=>v<allowedSpread)},bounds,res},null,2));
  assert.ok(Object.values(conv).every(v=>v<allowedSpread),'Raster convergence guard failed; do not use for densities');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
