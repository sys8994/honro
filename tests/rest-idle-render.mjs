/** Real shared party rig + retained SVG rasterized in Native Canvas. This is
 * pixel evidence, not a browser screenshot, CSS/input QA or GPU benchmark. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createCanvas,Path2D,loadImage} from '@napi-rs/canvas';
import {paintedBounds} from '../tools/party-forge/shape-bounds.mjs';
const out='_local/reports/rest-idle-render';await mkdir(out,{recursive:true});
const g=vm.createContext({console,Path2D,HONRO_CONTENT:{},HONRO_CORE:{},document:{},matchMedia:()=>({matches:false})});
const sources=['shared/runtime/party-rig.js','shared/assets/party/party.runtime.js','shared/runtime/journey-art.js','shared/runtime/rest-journey.js'];
const hashes={};for(const file of sources){const source=await readFile(file,'utf8');hashes[file]=createHash('sha256').update(source).digest('hex');vm.runInContext(source,g);}
const R=g.HonroRestJourney,A=g.HonroJourneyArt,checks=[],frames=[];
function check(name,fn){const detail=fn();checks.push({name,status:'passed',...detail});console.log('PASS',name,detail?JSON.stringify(detail):'');}
function motionSVG(variant,layer,time,only=null){return A.scene(variant,layer).replace(/<(?:g|path)\b[^>]*data-rest-motion="([^"]+)"[^>]*>/g,(tag,kind)=>{
 const phase=Number(/data-rest-phase="([^"]+)"/.exec(tag)?.[1])||0,attrs=A.motionFrame(kind,!only||only.includes(kind)?time:0,phase);
 for(const [key,value]of Object.entries(attrs)){const re=new RegExp(`\\s${key}="[^"]*"`);tag=re.test(tag)?tag.replace(re,` ${key}="${value}"`):tag.replace(/\/?>(?=$)/,ending=>` ${key}="${value}"${ending}`);}return tag;});}
async function raster(variant,layer,time,only){const c=createCanvas(1600,900),ctx=c.getContext('2d');const img=await loadImage(Buffer.from(motionSVG(variant,layer,time,only)));ctx.drawImage(img,0,0);return c;}
function pixels(c){return c.getContext('2d').getImageData(0,0,c.width,c.height).data;}
function differences(a,b,width,box=[0,0,width,a.length/4/width]){let changed=0,max=0;for(let y=box[1];y<box[3];y++)for(let x=box[0];x<box[2];x++){const i=(y*width+x)*4,d=Math.max(...[0,1,2,3].map(k=>Math.abs(a[i+k]-b[i+k])));if(d>2)changed++;max=Math.max(max,d);}return {changed,max};}
const people=['archer','mage','knight','occultist'],specs={archer:['seol_o',0],mage:['damheo',.73],knight:['hwigyeom',1.31],occultist:['sodan',2.03]};
check('Full-cycle vector bounds determine a shared framing scale without changing character proportions',()=>{const rows=[];let maxScale=2.5;for(const [id,asset]of Object.entries(g.HONRO_PARTY)){let bounds=[Infinity,Infinity,-Infinity,-Infinity];for(let i=0;i<=256;i++){const b=paintedBounds(asset,g.HonroVectorRig,{time:i/256});bounds=bounds.map((v,j)=>j<2?Math.min(v,b[j]):Math.max(v,b[j]));}const local=bounds.map((v,i)=>(v-asset.canvas.anchor[i%2])*102/asset.canvas.visualHeight),fit=Math.min((282-8)/-local[1],(110-8)/Math.max(Math.abs(local[0]),Math.abs(local[2])));maxScale=Math.min(maxScale,fit);rows.push({id,samples:257,bounds,local,maxScale:fit});}assert(maxScale>=2.21&&maxScale<2.22);return {uniformScale:2.21,maxAllowed:maxScale,rows};});
for(const cls of people){const c=createCanvas(220,300);c.dataset={restPerson:cls};const draw=time=>{R.drawPeople(time,[c]);return pixels(c);},first=draw(0),later=draw(1.49);
 check(`${cls}: shared idle changes real body pixels while keeping the soles planted`,()=>{const d=differences(first,later,220);assert(d.changed>50);const [id,phase]=specs[cls],rig=g.HonroVectorRig,asset=g.HONRO_PARTY[id],before=rig.sampleAnimation(asset,'idle',phase),after=rig.sampleAnimation(asset,'idle',phase+1.49);const footDrift=Math.max(...['rear','front'].map(side=>Math.hypot(...before.guide.joints[side+'_foot'].map((v,i)=>v-after.guide.joints[side+'_foot'][i]))));assert(footDrift<.03,'idle may not slide planted boots');assert(first.some((v,i)=>i%4===3&&v>0));return {...d,footDrift};});
 await writeFile(`${out}/actor-${cls}-1490.png`,c.toBuffer('image/png'));
 check(`${cls}: head, hat, staff and body stay inside the real rest canvas through a full idle cycle`,()=>{const bounds=[220,300,0,0],duration=g.HONRO_PARTY[specs[cls][0]].animation.animations.idle.duration_ms/1000;for(let i=0;i<=32;i++){const data=draw(duration*i/32);for(let y=0;y<300;y++)for(let x=0;x<220;x++)if(data[(y*220+x)*4+3]>1){bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);}}assert(bounds[0]>=6&&bounds[1]>=6&&bounds[2]<214&&bounds[3]<294,`${cls} clipped bounds: ${bounds}`);return {samples:33,bounds};});
 c.width=c.height=1;
}
const base=await raster('forest','surface',0),a=pixels(base);
for(const [label,kinds,box]of [
 ['flame',['flame-outer','flame-inner','flame-core'],[750,642,858,764]],
 ['embers',['ember'],[765,630,850,733]],
 ['firelight',['fire-ground','fire-halo'],[500,625,1100,865]],
 ['pine',['pine-crown'],[0,80,465,690]],
 ['lantern',['lantern'],[255,511,291,555]],
 ['mist',['mist'],[490,535,1190,670]],
 ['cloud',['cloud'],[125,180,1410,341]]]){
 const c=await raster('forest','surface',1.49,kinds),b=pixels(c);check(`${label}: isolated time change produces real SVG pixels`,()=>{const d=differences(a,b,1600,box);assert(d.changed>5);return d;});c.width=c.height=1;
}
base.width=base.height=1;
for(const variant of A.variants)for(const layer of ['surface','underground']){const first=await raster(variant,layer,0),later=await raster(variant,layer,1.49);check(`${variant}/${layer}: scenery stays renderable and campfire animates`,()=>{const d=differences(pixels(first),pixels(later),1600,[750,620,860,765]);assert(d.changed>100);return d;});first.width=first.height=later.width=later.height=1;}
for(const t of [0,.73,1.49]){const c=await raster('forest','surface',t),ctx=c.getContext('2d');for(let i=0;i<people.length;i++){const actor=createCanvas(220,300);actor.dataset={restPerson:people[i]};R.drawPeople(t,[actor]);const scale=144/220;ctx.drawImage(actor,[576,704,976,1120][i]-110*scale,765-282*scale,220*scale,300*scale);actor.width=actor.height=1;}const file=`${out}/rest-idle-${Math.round(t*1000).toString().padStart(4,'0')}.png`;await writeFile(file,c.toBuffer('image/png'));frames.push({seconds:t,file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')});c.width=c.height=1;}
await writeFile(`${out}/summary.json`,JSON.stringify({completedAt:new Date().toISOString(),status:'passed',source:hashes,checks,frames,limits:['Native Canvas rasterization of the production SVG/party drawing functions.','Scene composition is a fixed evidence harness, not browser CSS layout.','Browser input, actual Pages appearance and mobile GPU performance remain separate.']},null,2)+'\n');
