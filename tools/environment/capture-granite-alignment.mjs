/** Native common-renderer evidence only. No browser/GPU or normal-play claim. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
const runtimeArg=process.argv.find(a=>a.startsWith('--runtime-root='));
const runtimeRoot=path.resolve(runtimeArg?.slice('--runtime-root='.length)||'.');
const {guidanceRuntime,canvas}=await import(pathToFileURL(path.join(runtimeRoot,'tests/act2-guidance-helpers.mjs')));
const g=await guidanceRuntime(),out='_local/reports/granite-visual-alignment';await mkdir(out,{recursive:true});
const baseline=JSON.parse(await readFile('tests/fixtures/granite-visual-baseline.json','utf8'));
const source=JSON.parse(await readFile('shared/data/campaign.json','utf8')),ids=new Set(baseline.assets.map(a=>a.id));
const projects={before:structuredClone(g.HONRO_PROJECT),after:structuredClone(g.HONRO_PROJECT)};
for(const mode of ['before','after'])for(const old of baseline.assets){const a=projects[mode].library.find(a=>a.id===old.id),current=source.library.find(a=>a.id===old.id);a.visual=structuredClone(mode==='before'?old.visual:current.visual);}
const results=[],pixels=[];
function polygon(c,points){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}
// Sixteen exact production transforms, presented in pairs at the mobile 0.4
// scale. Cyan is an explicit diagnostic overlay, not an added game outline.
const cardW=400,cardH=230,sheet=canvas(cardW*2,cardH*baseline.instances.length),sc=sheet.getContext('2d');
for(const [index,record] of baseline.instances.entries())for(const mode of ['before','after']){
 const {stageId,...inst}=record,a=projects[mode].library.find(a=>a.id===inst.assetId),cv=canvas(cardW,cardH),c=cv.getContext('2d'),scale=.4,box=a.reference.bounds;
 c.fillStyle='#172226';c.fillRect(0,0,cardW,cardH);c.translate(cardW/2,cardH/2+20);c.scale(scale,scale);c.translate(-inst.x,-inst.y-(box.y+box.h/2)*inst.scale);
 g.HonroElements.draw(c,a,inst,null);
 const points=g.HonroGeometry.collision(a,inst)[0].vertices;polygon(c,points);c.strokeStyle='#77d9d9';c.lineWidth=1/scale;c.stroke();c.resetTransform();
 c.font='13px sans-serif';c.fillStyle='#d8ddd5';c.fillText(`${mode} | ${stageId} | ${inst.id}`,12,22);
 sc.drawImage(cv,mode==='before'?0:cardW,index*cardH);cv.width=1;
}
await writeFile(`${out}/sixteen-instances-before-after.png`,sheet.toBuffer('image/png'));sheet.width=1;
// Independent raster masks through the real element painter. Multiple opaque
// faces may compound edge antialiasing; no fully covered pixel may escape the
// canonical mask, and no canonical interior pixel may be missing.
for(const id of ids)for(const scale of [.25,.4,1.5]){
 const a=projects.after.library.find(a=>a.id===id),b=a.reference.bounds,w=Math.ceil(b.w*scale+20),h=Math.ceil(b.h*scale+20),cv=canvas(w,h),mask=canvas(w,h),c=cv.getContext('2d'),m=mask.getContext('2d'),inst={id,x:10-b.x*scale,y:10-b.y*scale,scale,rotation:0};
 g.HonroElements.draw(c,a,inst,null);m.fillStyle='#fff';polygon(m,g.HonroGeometry.collision(a,inst)[0].vertices);m.fill();
 const art=c.getImageData(0,0,w,h).data,solid=m.getImageData(0,0,w,h).data;let escaped=0,missing=0;
 for(let i=3;i<art.length;i+=4){if(art[i]>220&&solid[i]===0)escaped++;if(solid[i]===255&&art[i]<255)missing++;}
 assert.equal(escaped,0,id+' opaque pixels outside solid at '+scale);assert.equal(missing,0,id+' missing solid interior at '+scale);pixels.push({id,scale,escaped,missing});cv.width=mask.width=1;
}
const stage=projects.after.stages[0],anchor=stage.anchors.start;
const fixtures=[{name:'original-start',x:anchor.x+230,y:anchor.y-220,scale:.4},{name:'original-start-low-zoom',x:anchor.x+230,y:anchor.y-220,scale:.25},{name:'large-contact',x:910,y:1370,scale:.4,elementId:'forest-boulder-a',localX:-248.268},{name:'small-contact',x:1630,y:1420,scale:.65,elementId:'forest-boulder-b',localX:-65.718}];
for(const fixture of fixtures){const originals={};for(const mode of ['before','after']){const project=projects[mode],b=g.HonroMaps.createBattle(project.stages[0],project);g.HonroStageRules.sanitizeStageBattle(b);originals[mode]=b;}
 // Equal diagnostic hero poses on the unchanged real physical surface.
 if(fixture.elementId)for(const b of Object.values(originals)){const inst=stage.elements.find(e=>e.id===fixture.elementId),t=b.terrain.find(t=>t.id===inst.id+':collision:0'),x=inst.x+fixture.localX*inst.scale,hit=g.HONRO_CORE.terrainSurfaces(t,x).sort((a,z)=>a.y-z.y)[0],hero=b.units.find(u=>u.side===0&&!u.summoned);assert(hit);Object.assign(hero,{x,y:hit.y,vx:0,vy:0});b.active=hero.id;}
 for(const mode of ['before','after']){const b=originals[mode],e=new g.HONRO_CORE.Engine(b,()=>{},true),cv=canvas(400,760),s=new g.HonroScene(cv);Object.assign(s,{x:fixture.x,y:fixture.y,scale:fixture.scale,manual:true,time:2,skillPreview:true});const state=JSON.stringify(b);
  s.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,20));s.render(e,0,'',.6,false,0);assert.equal(JSON.stringify(b),state,'Native scene changed saved battle');
  const file=`${mode}-${fixture.name}-400.png`;await writeFile(`${out}/${file}`,cv.toBuffer('image/png'));results.push({mode,...fixture,file,pure:true,readability:typeof s.terrainReadability==='function',stats:s.renderCacheStats()});console.log(file);
  for(const tile of s._domainTiles?.tiles.values()||[])tile.canvas.width=1;s._domainTiles?.tiles.clear();s._staticWorldCache=null;cv.width=1;
 }
}
const sha=cwd=>execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim();
await writeFile(`${out}/native-manifest.json`,JSON.stringify({sourceCommit:sha('.'),runtimeCommit:sha(runtimeRoot),runtimeRoot,scope:'Native common element painter and Scene; diagnostic contact poses, no browser/GPU/performance/normal-play claim',pixels,instances:baseline.instances.length,results},null,2)+'\n');
console.log('PASS Native granite masks at 3 zooms, 16 paired placements, 8 mobile scenes');
