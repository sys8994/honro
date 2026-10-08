import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const native=createRequire(import.meta.url)('@napi-rs/canvas'),before=execFileSync('git',['show','dbaa565:shared/runtime/environment-art.js'],{encoding:'utf8'}),after=await readFile('shared/runtime/environment-art.js','utf8');
const atmosphere={waterBaseColor:'#0c2631',waterHighlightColor:'#527771',shadowTint:'#091c27',keyLightColor:'#a6afa1',waterfallFoamColor:'#91a391'};
const E={mixColor(a,b,t){const rgb=x=>x.slice(1).match(/../g).map(x=>parseInt(x,16)),x=rgb(a),y=rgb(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('');}};
function render(source,reflections,time){const ctx=vm.createContext({Path2D:native.Path2D,Math,HonroEnvironment:E,matchMedia:()=>({matches:false})});vm.runInContext(source,ctx);const cv=native.createCanvas(500,420),c=cv.getContext('2d');c.fillStyle='#be21ab';c.fillRect(0,0,500,420);const z={points:[[50,40],[450,40],[450,380],[50,380]],surface:[[50,40],[450,40]],...(reflections?{reflections}: {})};ctx.HonroEnvironmentArt.pool(c,z,atmosphere,time);return c.getImageData(0,0,500,420).data;}
for(const t of [0,1.2,31])assert.deepEqual(render(after,null,t),render(before,null,t),'legacy water pixels unchanged');
const old=render(after,null,1.2),fresh=render(after,[{x:180,width:150,height:300}],1.2);assert.notDeepEqual(fresh,old);for(let y=0;y<420;y++)for(let x=0;x<500;x++)if(x<50||x>=450||y<40||y>=380){const i=(y*500+x)*4;assert.deepEqual(fresh.slice(i,i+4),old.slice(i,i+4),'reflection clipped');}
const p=JSON.parse(await readFile('shared/data/campaign.json','utf8'));for(const s of p.stages)if(s.materials.some(m=>m.reflections))assert([25,27].includes(s.metadata.stageId));
console.log('PASS optional water reflections: legacy pixel identity, bounded clip, only 25/27 opt in');
