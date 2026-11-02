/** Production HonroScene on native canvas, exact initial/terminal snapshots.
 * Static observation only; not browser UI or normal-input evidence. */
import vm from 'node:vm';import path from 'node:path';import{createRequire}from'node:module';import{readFile,writeFile,mkdir}from'node:fs/promises';import{createHash}from'node:crypto';import{runtimeParts}from'../shared/build.mjs';
const native=createRequire(import.meta.url)('@napi-rs/canvas');try{native.GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','sans-serif');}catch{}
const canvas=(w=300,h=150)=>{const c=native.createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;};
class Image extends native.Image{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
const g=vm.createContext({console,performance,structuredClone,Math,document:{createElement:()=>canvas()},Image,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'honro-native-act2-gameplay'},setTimeout,clearTimeout});g.window=g;
for(const part of await runtimeParts({vector:true,render:true,productionStory:true}))vm.runInContext(part,g);
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
for(const input of process.argv.slice(2)){const saved=JSON.parse(await readFile(input,'utf8')),b=saved.battle||saved.b,e=new g.HONRO_CORE.Engine(b,()=>{},false),id=b.honroStage;
 if(hash(g.HONRO_PROJECT)!==saved.provenance.projectSha256)throw Error('Production project differs from snapshot '+input);
 const heroes=e.heroesAlive(),hero=heroes[0],views=[{name:'entry',x:hero?.x+500||b.width/2,y:(hero?.y||b.height/2)-220,scale:.62},{name:'initial-roster-overview',x:b.width/2,y:b.height/2,scale:Math.min(1400/b.width,900/b.height)}],out=path.dirname(input)+'/native';await mkdir(out,{recursive:true});
 for(const view of views){const cv=canvas(1440,960),scene=new g.HonroScene(cv);Object.assign(scene,{...view,manual:true,time:2});scene.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,60));scene.render(e,0,'',.6,false,0);const filename=out+'/'+view.name+'.jpg',bytes=cv.toBuffer('image/jpeg',85);await writeFile(filename,bytes);await writeFile(filename+'.json',JSON.stringify({input,stage:id,view,round:b.round,phase:b.phase,projectSha256:saved.provenance.projectSha256,sha256:createHash('sha256').update(bytes).digest('hex'),scope:'Unmodified checkpoint in production HonroScene native canvas; not browser or human UI.'},null,2));console.log(filename);}
}
