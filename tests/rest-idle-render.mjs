/** Real shared party rig + retained SVG rasterized in Native Canvas. This is
 * pixel evidence, not a browser screenshot, CSS/input QA or GPU benchmark. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createCanvas,Path2D,loadImage} from '@napi-rs/canvas';
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
for(const cls of people){const c=createCanvas(220,300),ctx=c.getContext('2d');const draw=time=>{ctx.clearRect(0,0,220,300);ctx.save();ctx.translate(110,282);ctx.scale(2.5,2.5);R.drawActor(ctx,cls,time);ctx.restore();return pixels(c);},first=draw(0),later=draw(1.49);
 check(`${cls}: shared idle changes real body pixels while keeping the soles planted`,()=>{const d=differences(first,later,220);assert(d.changed>50);const [id,phase]=specs[cls],rig=g.HonroVectorRig,asset=g.HONRO_PARTY[id],before=rig.sampleAnimation(asset,'idle',phase),after=rig.sampleAnimation(asset,'idle',phase+1.49);const footDrift=Math.max(...['rear','front'].map(side=>Math.hypot(...before.guide.joints[side+'_foot'].map((v,i)=>v-after.guide.joints[side+'_foot'][i]))));assert(footDrift<.03,'idle may not slide planted boots');assert(first.some((v,i)=>i%4===3&&v>0));return {...d,footDrift};});
 await writeFile(`${out}/actor-${cls}-1490.png`,c.toBuffer('image/png'));c.width=c.height=1;
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
for(const t of [0,.73,1.49]){const c=await raster('forest','surface',t),ctx=c.getContext('2d');for(let i=0;i<people.length;i++){ctx.save();ctx.translate([576,704,976,1120][i],765);ctx.scale(1.75,1.75);R.drawActor(ctx,people[i],t);ctx.restore();}const file=`${out}/rest-idle-${Math.round(t*1000).toString().padStart(4,'0')}.png`;await writeFile(file,c.toBuffer('image/png'));frames.push({seconds:t,file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')});c.width=c.height=1;}
await writeFile(`${out}/summary.json`,JSON.stringify({completedAt:new Date().toISOString(),status:'passed',source:hashes,checks,frames,limits:['Native Canvas rasterization of the production SVG/party drawing functions.','Scene composition is a fixed evidence harness, not browser CSS layout.','Browser input, actual Pages appearance and mobile GPU performance remain separate.']},null,2)+'\n');
