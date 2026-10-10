/** Native production Canvas / Engine evidence, not browser or normal play. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {guidanceRuntime,canvas} from './act2-guidance-helpers.mjs';
const g=await guidanceRuntime(),D=g.HonroObjectDamage,C=g.HONRO_CORE,out='_local/reports/object-damage';
await mkdir(out,{recursive:true});
const hash=v=>createHash('sha256').update(v).digest('hex'),rows=[];
const template={id:'damage-fixture',x:0,y:0,w:260,h:80,hp:210,maxHp:210,mat:'wood'};
for(const [hp,level] of [[210,0],[211,0],[209,1],[141,1],[140,2],[71,2],[70,3],[1,3],[0,3],[-10,3]])assert.equal(D.stage({...template,hp}),level);
for(const change of [{broken:true},{indestructible:true},{hp:9999},{maxHp:0},{maxHp:undefined},{hp:NaN}])assert.equal(D.stage({...template,hp:70,...change}),0);
for(const [mat,kind] of [['wood','wood'],['support','wood'],['barrel','wood'],['stone','stone'],['rock','stone'],['iron','metal'],['ice','crystal'],['crystal','crystal'],['earth','earth']])assert.equal(D.material({...template,mat}),kind);
const ratios=[1,.85,2/3,1/3],mats=['wood','stone','iron','ice','barrel','earth'];
const oldG={HONRO_CONTENT:g.HONRO_CONTENT,HONRO_CORE:C};vm.createContext(oldG);
vm.runInContext(execFileSync('git',['show','d00c7bb7341d8dcf66558464c8584e8969e9498c:shared/runtime/renderer.js'],{encoding:'utf8'}),oldG);
vm.runInContext(execFileSync('git',['show','d00c7bb7341d8dcf66558464c8584e8969e9498c:shared/runtime/stage8-bier-art.js'],{encoding:'utf8'}),oldG);
const oldHealth=oldG.HonroScene.prototype.terrainHealth;
// Material matrix uses the actual shared painter at three gameplay zooms.
for(const zoom of [.2,.5,1]){
 const cv=canvas(1280,1040),c=cv.getContext('2d'),scene=new g.HonroScene(cv);scene.scale=zoom;
 c.fillStyle='#263638';c.fillRect(0,0,cv.width,cv.height);c.fillStyle='#eee2cb';c.font='22px sans-serif';c.fillText(`Material damage / zoom ${zoom} / Native production Canvas`,22,30);
 for(let col=0;col<4;col++){c.font='17px sans-serif';c.fillText(['0: intact','1: worn > 67%','2: split 34–67%','3: severe ≤ 33%'][col],col*320+20,66);}
 for(let row=0;row<mats.length;row++)for(let col=0;col<4;col++){
  const t={...template,mat:mats[row],hp:210*ratios[col]},state=JSON.stringify(t),x=col*320+30,y=110+row*148;
  c.fillStyle='#d3d8cd';c.font='15px sans-serif';c.fillText(mats[row],x,y-12);c.save();c.translate(x,y);c.scale(zoom,zoom);scene.terrain(c,t);D.draw(c,t,zoom);c.restore();assert.equal(JSON.stringify(t),state);
 }
 await writeFile(`${out}/materials-${zoom}.png`,cv.toBuffer('image/png'));cv.width=1;
}
// Pixel equality: full health exactly preserves the original art, repairs
// immediately restore each previous stage, and time never changes cracks.
for(const mat of mats){const cv=canvas(300,120),c=cv.getContext('2d'),scene=new g.HonroScene(cv),t={...template,x:20,y:15,mat};scene.scale=1;
 const render=()=>{c.clearRect(0,0,300,120);scene.terrain(c,t);D.draw(c,t,1);return hash(c.getImageData(0,0,300,120).data);};
 c.clearRect(0,0,300,120);scene.terrain(c,t);const original=hash(c.getImageData(0,0,300,120).data);assert.equal(render(),original);
 const hashes=ratios.map(r=>{t.hp=210*r;return render();});assert.equal(new Set(hashes).size,4,mat+' visibly distinguishes every state');
 for(let i=3;i>=0;i--){t.hp=210*ratios[i];assert.equal(render(),hashes[i]);scene.time+=17;assert.equal(render(),hashes[i]);}
 rows.push({mat,hashes,healingReverses:true,stableFrames:true,fullHealthIdentical:true});cv.width=1;
}
const inventory=[];
for(const st of g.HONRO_PROJECT.stages){const b=g.HonroMaps.createBattle(st,g.HONRO_PROJECT);g.HonroStageRules.sanitizeStageBattle(b);for(const t of b.terrain)if(!t.indestructible&&t.hp<9999)inventory.push({stage:b.honroStage,id:t.id,mat:t.mat,maxHp:t.maxHp});}
// Same real campaign object/camera across old bar, intact, three damage states,
// repair and real Engine destruction. No map or combat balancing is changed.
for(const [stage,id] of [[1,'pine-branch-west'],[3,'ferry-side-gangway'],[5,'cliff-cleat'],[8,'bier-knot-0'],[18,'upper-chain']]){
 const st=g.HONRO_PROJECT.stages[stage-1],b=g.HonroMaps.createBattle(st,g.HONRO_PROJECT);g.HonroStageRules.sanitizeStageBattle(b);
 const t=b.terrain.find(t=>t.id===id),cv=canvas(900,560),scene=new g.HonroScene(cv),e=new C.Engine(b,()=>{},true);
 assert(t);Object.assign(scene,{x:t.x+t.w/2,y:t.y+t.h/2-80,scale:stage===1?.8:1,manual:true,time:2,skillPreview:true});
 const sheet=canvas(1800,1680),sc=sheet.getContext('2d');
 const states=[['before',2/3],['intact',1],['worn',.85],['cracked',2/3],['severe',1/3],['repaired',1]];
 let builds;
 for(let i=0;i<states.length;i++){
  const [name,ratio]=states[i];t.hp=t.maxHp*ratio;scene.objectDamage=name==='before'?()=>{}:g.HonroScene.prototype.objectDamage;scene.terrainHealth=name==='before'?oldHealth:g.HonroScene.prototype.terrainHealth;
  const pure=JSON.stringify(b);scene.render(e,0);await new Promise(r=>setTimeout(r,20));scene.render(e,0);assert.equal(JSON.stringify(b),pure);
  const cache=scene.renderCacheStats();if(builds==null)builds=cache.worldBuilds;else assert.equal(cache.worldBuilds,builds,'Nonlethal HP changes do not rebuild scenery');
  sc.drawImage(cv,(i%2)*900,Math.floor(i/2)*560);sc.fillStyle='#102227ed';sc.fillRect((i%2)*900,Math.floor(i/2)*560,900,38);sc.fillStyle='#eddbb7';sc.font='20px sans-serif';sc.fillText(`Stage ${stage} · ${id} · ${name}`,(i%2)*900+15,Math.floor(i/2)*560+26);
 }
 await writeFile(`${out}/scene-${stage}.png`,sheet.toBuffer('image/png'));sheet.width=1;
 t.hp=1;if(stage===5)b.honroState.ritual={active:true};e.damageTerrain(t,10);assert(t.broken);assert.equal(D.stage(t),0);assert(!scene.terrainHealthTargets(b).some(row=>row.id===t.id));scene.render(e,0);
 await writeFile(`${out}/destroyed-${stage}.png`,cv.toBuffer('image/png'));
 for(const tile of scene._domainTiles?.tiles.values()||[])tile.canvas.width=1;scene._domainTiles?.tiles.clear();cv.width=1;
}
// No rectangles, numbers or bars for destructible objects, including the
// stage8 override. Objective names and prerequisites are still present.
const scene=Object.create(g.HonroScene.prototype);Object.assign(scene,{x:130,y:40,scale:1});
const calls=[],ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});
scene.terrainHealth(ctx,{terrain:[{...template,hp:140}]},600,400);assert.equal(calls.length,0);
scene.terrainHealth(ctx,{terrain:[{...template,hp:140,device:'ward'}]},600,400);assert(calls.some(c=>c[0]==='fillText'&&c[1]==='결계 장치'));assert(!calls.some(c=>c[0]==='fillRect'||c[0]==='strokeRect'));
// Enemy/NPC rendering paths are byte-identical to the accepted baseline.
const current=await readFile('shared/runtime/renderer.js','utf8'),baseline=execFileSync('git',['show','d00c7bb7341d8dcf66558464c8584e8969e9498c:shared/runtime/renderer.js'],{encoding:'utf8'});
assert(current.indexOf('        tacticalUnitMarkers(')>0);
assert.equal(current.slice(current.indexOf('        tacticalUnitMarkers(')),baseline.slice(baseline.indexOf('        tacticalUnitMarkers(')));
await writeFile(`${out}/summary.json`,JSON.stringify({passed:true,thresholds:'Intact 100%; worn (2/3,1); cracked (1/3,2/3]; severe [0,1/3]; broken hidden',rows,inventory,scope:'Native production Canvas, real Engine destruction, render state purity and isolated HP fixtures. No browser/HUD input, full verify or normal play claim.'},null,2)+'\n');
console.log(`PASS object damage: ${inventory.length} campaign objects inventoried; six materials × four states × three zooms; repair, real destruction, cache stability, no object bars, unchanged unit renderer.`);
