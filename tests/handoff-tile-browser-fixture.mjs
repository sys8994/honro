/** Generates an isolated Canvas unit page; never opens a browser or game. */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {createCanvas,Path2D,DOMMatrix} from '@napi-rs/canvas';
const target=process.argv[2];if(!target)throw Error('Usage: node tests/handoff-tile-browser-fixture.mjs OUTPUT.html');
const runtime=await readFile(new URL('../shared/runtime/act3-handoff-art.js',import.meta.url),'utf8');
const vector=await readFile(new URL('../shared/map/vector-art.js',import.meta.url),'utf8');
const start=runtime.indexOf(' // Stage 21: resolve'),end=runtime.indexOf(" ctx.globalCompositeOperation='destination-in';\n const fade=",start);
if(start<0||end<start)throw Error('Expected Stage 21 scoped device branch');
const legacy=runtime.slice(0,start)+runtime.slice(end);
const extract=s=>s.slice(s.indexOf('function strips('),s.indexOf('\nS.landmark='));
const assets=[];for(const [id,piece]of [[21,'bedrock'],[23,'quay-west'],[26,'kiln-foundation'],[29,'west-bank']])assets.push(JSON.parse(await readFile(new URL(`../shared/assets/environment/act3-handoff/stage${id}-${piece}.json`,import.meta.url),'utf8')));
const hash=x=>createHash('sha256').update(x).digest('hex');
const metadata={runtimeSha256:hash(runtime),legacyRuntimeSha256:hash(legacy),vectorRuntimeSha256:hash(vector),assets:assets.map(a=>({id:a.id,sha256:hash(JSON.stringify(a))}))};
const script=vector+'\n'+`(()=>{const assets=${JSON.stringify(assets)},metadata=${JSON.stringify(metadata)};
const compile=source=>new Function('G','paths',source+';return {strips,faceTile};')(globalThis,new WeakMap());
const current=compile(${JSON.stringify(extract(runtime))}),legacy=compile(${JSON.stringify(extract(legacy))});
const pixels=t=>t.canvas.getContext('2d').getImageData(0,0,t.canvas.width,t.canvas.height).data;
function stats(t){const data=pixels(t);let nonzero=0,opaque=0,sum=0;for(let i=3;i<data.length;i+=4){const a=data[i];nonzero+=a>0;opaque+=a===255;sum+=a;}return{width:t.canvas.width,height:t.canvas.height,total:data.length/4,nonzero,opaque,alphaSum:sum,meanAlpha:sum/(data.length/4)};}
const rows=[],comparison21=[];
for(const asset of assets){const strips=current.strips(asset),old=legacy.strips(asset);for(let i=0;i<strips.length;i++)for(const density of [.72,1.15]){const t=current.faceTile(asset,strips[i],density),q={asset:asset.id,strip:i,density,x0:strips[i].x0,x1:strips[i].x1,...stats(t)};rows.push(q);
if(asset.id==='act3-handoff:21:bedrock'){const before=legacy.faceTile(asset,old[i],density),a=pixels(t),b=pixels(before);let differentPixels=0,maxDelta=0,sumDelta=0,alphaSumDelta=0;for(let k=0;k<a.length;k+=4){let diff=false;for(let j=0;j<4;j++){const d=Math.abs(a[k+j]-b[k+j]);maxDelta=Math.max(maxDelta,d);sumDelta+=d;diff=diff||d>0;if(j===3)alphaSumDelta+=d;}differentPixels+=diff;}comparison21.push({strip:i,density,width:t.canvas.width,height:t.canvas.height,current:q,legacy:stats(before),differentPixels,maxDelta,meanChannelDelta:sumDelta/a.length,meanAlphaDelta:alphaSumDelta/(a.length/4)});}
}}
const report={scope:'Isolated actual production strips/faceTile and vector assets, no game/profile/storage/network. Not public UI or gameplay acceptance.',userAgent:globalThis.navigator?.userAgent||'Node Native Canvas',metadata,rows,comparison21};globalThis.HANDOFF_TILE_RESULT=report;const p=document.getElementById?.('result');if(p)p.textContent=JSON.stringify(report);})();`;
const html='<!doctype html><meta charset="utf-8"><title>Independent handoff tile compositor unit</title><pre id="result">pending</pre><script>'+script.replaceAll('</script','<\\/script')+'</script>';
await writeFile(target,html);
const g=vm.createContext({Path2D,DOMMatrix,document:{createElement:()=>createCanvas(1,1)},console});vm.runInContext(script,g);
await writeFile(target+'.native.json',JSON.stringify(g.HANDOFF_TILE_RESULT,null,2)+'\n');
console.log(JSON.stringify({html:target,native:target+'.native.json',rows:g.HANDOFF_TILE_RESULT.rows.length,comparisons21:g.HANDOFF_TILE_RESULT.comparison21.length,metadata}));
