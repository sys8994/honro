import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {createCanvas,loadImage,Path2D} from '@napi-rs/canvas';
const dir=mkdtempSync(join(tmpdir(),'honro-svg-'));
const runtime={Path2D};vm.createContext(runtime);vm.runInContext(readFileSync('shared/map/vector-art.js','utf8'),runtime);
vm.runInContext(readFileSync('shared/map/environment.js','utf8'),runtime);
const config={id:'test:svg',bounds:{x:10,y:20,w:100,h:100},anchor:{x:0,y:0},foot:{x:60,y:120},semanticLayer:'REAR'};
const fixtures=[
 `<g fill="#246880" transform="translate(12 22) rotate(5 40 40)"><path fill-rule="evenodd" d="m0 0h70v70h-70z m10 10h50v50h-50z"/><path fill="#aa5544" d="m72 5 c10 0 10 10 0 10 q-5 0 -5 -5t5 -5z"/></g>`,
 `<g style="fill:#678abc;fill-rule:nonzero" transform="matrix(1 .1 -.1 1 15 22)"><path d="M0 0H65V65H0Z M10 10V55H55V10Z"/><g transform="translate(60 60) scale(.6)"><circle cx="20" cy="20" r="15" fill-opacity=".5"/><rect x="-60" y="20" width="30" height="15" rx="4"/></g></g>`,
 `<g fill="none" stroke="#352314" stroke-width="3" stroke-linejoin="round"><path d="M20 30l40 0 0 30z m10 50q10-20 30 0t20 0"/><ellipse cx="80" cy="45" rx="12" ry="8"/></g>`
];
function compile(body,cfg=config,args=[]){writeFileSync(join(dir,'source.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="10 20 100 100">${body}</svg>`);writeFileSync(join(dir,'config.json'),JSON.stringify(cfg));const result=spawnSync('python',['tools/vector-production/import-svg.py',join(dir,'source.svg'),'--config',join(dir,'config.json'),'--output',join(dir,'asset.json'),...args],{encoding:'utf8'});if(result.status!==0)throw Error(result.stderr);return JSON.parse(readFileSync(join(dir,'asset.json')));}
try{
 for(const [i,body]of fixtures.entries()){
  const asset=compile(body);const stage={id:'test-stage',width:100,height:100,layers:[{id:'back'}],elements:[{id:'piece',assetId:asset.id,scale:1,depthLayer:'L1',layer:'back'}],environment:{version:runtime.HonroEnvironment.VERSION,preset:'forest',atmosphere:{preset:'forest'},placements:[],groups:[],surfaces:[],zones:[{id:'zone',from:0,to:100,blend:10}]}};assert.equal(runtime.HonroEnvironment.validate({library:[asset],stages:[stage]}).length,0);assert.equal(runtime.HonroVectorArt.validate(asset.vector).length,0);
  const src=createCanvas(200,200),out=createCanvas(200,200);src.getContext('2d').drawImage(await loadImage(join(dir,'source.svg')),0,0);
  const ctx=out.getContext('2d');ctx.scale(2,2);ctx.translate(-10,-20);runtime.HonroVectorArt.draw(ctx,asset,{});
  const a=src.getContext('2d').getImageData(0,0,200,200).data,b=out.getContext('2d').getImageData(0,0,200,200).data;
  let sum=0,bad=0;for(let p=0;p<a.length;p+=4){let delta=0;for(let k=0;k<4;k++)delta+=Math.abs(a[p+k]-b[p+k]);sum+=delta;if(delta>100)bad++;}
  // SVG and Canvas antialias differently; gross geometric/color mismatch cannot pass.
  assert.ok(sum/a.length<1.8,`fixture ${i} MAE ${sum/a.length}`);assert.ok(bad/40000<.02,`fixture ${i} mismatch ${bad}`);
  console.log(`fixture ${i}: pixel MAE ${(sum/a.length).toFixed(3)}, differing pixels ${bad}`);
 }
 assert.throws(()=>compile('<path d="M0 0H10V10Z"/>',{...config,scaleRange:[2,1]}),/Invalid scaleRange/);
 assert.throws(()=>compile('<image href="x.png"/>'),/raster image forbidden/);
 assert.equal(compile('<image href="x.png"/><path d="M20 30h10v10z"/>',config,['--remove-reference-images']).params.removedReferenceImages.length,1);
 assert.throws(()=>compile('<g opacity=".5"><rect width="20" height="20"/></g>'),/isolated compositing/);
 assert.throws(()=>compile('<path d="M0 0L10 10"/>',{...config,bodyClip:['M0 0H20V20Z']}),/only for a separate BODY/);
 const clipped=compile('<path d="M10 20H110V120H10Z"/>',{...config,semanticLayer:'BODY',bodyClip:['M20 30H40V50H20Z']});assert.equal(runtime.HonroVectorArt.validate(clipped.vector).length,0);
 const cv=createCanvas(200,200);runtime.HonroVectorArt.draw(cv.getContext('2d'),clipped,{});assert.equal(cv.getContext('2d').getImageData(15,25,1,1).data[3],0);assert.equal(cv.getContext('2d').getImageData(30,40,1,1).data[3],255);
 // Force budget splitting on disjoint donut pairs; each hole must remain attached.
 execFileSync('python',['-c',`import importlib.util\ns=importlib.util.spec_from_file_location('imp','tools/vector-production/import-svg.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)\nm.LIMIT=40\nr=m.split_path('M0 0H20V20H0Z M5 5V15H15V5Z M30 0H50V20H30Z M35 5V15H45V5Z','donuts')\nassert len(r)==2 and all(x.count('M')==2 for x in r),r\ntry: m.split_path('M0 0H50V50H0Z M5 5V45H45V5Z M10 10H40V40H10Z','nested')\nexcept ValueError: pass\nelse: raise AssertionError('inseparable budget was not rejected')`]);
 console.log('PASS: source SVG vs actual runtime, hole-safe splitting, strict diagnostics, BODY-only clipping');
}finally{rmSync(dir,{recursive:true,force:true});}
