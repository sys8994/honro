/** Shared production Scene on Native Canvas. Not browser, GPU or HUD evidence. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {guidanceRuntime,canvas} from '../../tests/act2-guidance-helpers.mjs';
const g=await guidanceRuntime(),out='_local/reports/terrain-readability',results=[];
await mkdir(out,{recursive:true});
const hooks={backgroundReadability:g.HonroScene.prototype.backgroundReadability,terrainReadability:g.HonroScene.prototype.terrainReadability};
const fixtures=[{id:1,anchor:'start'},{id:2,anchor:'procession'},{id:8,anchor:'courtyard'},{id:14,anchor:'family-mid'},{id:15,anchor:'clear-gallery'},
 {id:1,anchor:'start',scale:.25,label:'zoom-out'},{id:1,anchor:'start',scale:1.5,label:'close'}];
for(const fixture of fixtures){const {id,anchor,label}=fixture,st=g.HONRO_PROJECT.stages[id-1],original=g.HonroMaps.createBattle(st,g.HONRO_PROJECT);g.HonroStageRules.sanitizeStageBattle(original);
 const a=st.anchors[anchor]||st.design?.space?.sites?.[anchor]?.standing||st.anchors.start||st.anchors.spawn;
 for(const mode of ['before','after']){
  const b=structuredClone(original),e=new g.HONRO_CORE.Engine(b,()=>{},true),cv=canvas(400,760),s=new g.HonroScene(cv);
  Object.assign(s,{x:a.x+230,y:a.y-220,scale:fixture.scale||.4,manual:true,time:2,skillPreview:true});
  for(const key in hooks)s[key]=mode==='after'?hooks[key]:()=>{};
  const state=JSON.stringify(b);s.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,20));s.render(e,0,'',.6,false,0);
  const built=s.renderCacheStats(),edges=s.terrainReadabilityStats?.builds,elapsed=[];
  for(let n=0;n<24;n++){const start=performance.now();s.render(e,0,'',.6,false,0);elapsed.push(performance.now()-start);}
  assert.equal(JSON.stringify(b),state,'renderer changed the battle');assert.equal(s.renderCacheStats().domainTileBuilds,built.domainTileBuilds,'warm view rebuilt tiles');assert.equal(s.terrainReadabilityStats?.builds,edges,'warm view rebuilt edge paths');
  const file=`${mode}-${id}-400${label?'-'+label:''}.png`;await writeFile(`${out}/${file}`,cv.toBuffer('image/png'));
  elapsed.sort((a,z)=>a-z);results.push({mode,stage:id,file,x:s.x,y:s.y,scale:s.scale,width:400,height:760,stats:s.renderCacheStats(),edges:s.terrainReadabilityStats,warmNative:{medianMs:elapsed[12],p95Ms:elapsed[22]},pure:true});console.log(file);
  for(const t of s._domainTiles?.tiles.values()||[])t.canvas.width=1;s._domainTiles?.tiles.clear();s._staticWorldCache=null;cv.width=1;
 }
}
// No colour-only promise: a paired edge must remain distinct in luminance at
// all three display scales, even with identical background and terrain hues.
const luma=rgb=>.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2],grayscale=[];
for(const scale of [.25,.4,1.5]){const cv=canvas(160,100),c=cv.getContext('2d'),s=new g.HonroScene(cv),b={sceneVersion:0,terrain:[{id:'flat',x:0,y:50/scale,w:160/scale,h:100/scale,mat:'rock',vertices:[{x:0,y:50/scale},{x:160/scale,y:50/scale},{x:160/scale,y:150/scale},{x:0,y:150/scale}]}]};
 c.fillStyle='#45555a';c.fillRect(0,0,160,100);s.scale=scale;c.scale(scale,scale);s.terrainReadability(c,b);const data=c.getImageData(80,45,1,12).data,values=[];for(let i=0;i<data.length;i+=4)values.push(luma(data.slice(i,i+3)));const delta=Math.max(...values)-Math.min(...values);assert(delta>45,`edge loses luminance separation at ${scale}: ${delta}`);grayscale.push({scale,luminanceRange:delta});cv.width=1;
}
await writeFile(`${out}/manifest.json`,JSON.stringify({sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'Native production Scene only; no browser/GPU/HUD validation',results,grayscale},null,2)+'\n');
