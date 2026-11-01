// Visual motion QA for party art: renders every animation frame with the production
// canvas renderer and measures what a viewer sees, not rig math:
//  - fragments: painted islands detached from the main body (limb/cloth "dismemberment")
//  - holes: enclosed background pockets inside the silhouette (torn seams, exposed cuts)
// Each frame is compared with the idle drawing. Usage:
//   node tools/party-forge/motion-qa.mjs [id ...] [--out _local/reports/motion-qa] [--sheet]
import vm from 'node:vm';import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createCanvas,Path2D} from '@napi-rs/canvas';
const args=process.argv.slice(2),out=args.includes('--out')?args[args.indexOf('--out')+1]:'_local/reports/motion-qa',sheet=args.includes('--sheet');
const ids=args.filter((a,i)=>!a.startsWith('--')&&args[i-1]!=='--out');
const g={Path2D,console,Math,structuredClone};vm.createContext(g);
vm.runInContext(readFileSync('shared/assets/party/party.runtime.js','utf8'),g);vm.runInContext(readFileSync('shared/runtime/party-rig.js','utf8'),g);
const R=g.HonroVectorRig,W=360,H=520,HEIGHT=330,MIN=10;   // px; islands/holes below MIN px are anti-aliasing noise
function analyse(ctx,mark=false){
 const d=ctx.getImageData(0,0,W,H).data,ink=new Uint8Array(W*H);for(let i=0;i<W*H;i++)ink[i]=d[i*4+3]>96?1:0;
 const lab=new Int32Array(W*H).fill(-1),comps=[];const st=new Int32Array(W*H);
 for(let s=0;s<W*H;s++){if(lab[s]>=0)continue;const v=ink[s];let n=0,top=0,border=false;st[top++]=s;lab[s]=comps.length;
  while(top){const p=st[--top];n++;const x=p%W,y=(p/W)|0;if(x===0||y===0||x===W-1||y===H-1)border=true;
   for(const q of [x>0?p-1:-1,x<W-1?p+1:-1,y>0?p-W:-1,y<H-1?p+W:-1])if(q>=0&&lab[q]<0&&ink[q]===v){lab[q]=comps.length;st[top++]=q;}}
  comps.push({v,n,border});}
 comps.forEach((c,i)=>c.i=i);const inkC=comps.filter(c=>c.v===1).sort((a,b)=>b.n-a.n),holes=comps.filter(c=>c.v===0&&!c.border&&c.n>=MIN);
 const frag=inkC.slice(1).filter(c=>c.n>=MIN);
 if(mark){const img=ctx.getImageData(0,0,W,H),fs=new Set(frag.map(c=>c.i)),hs=new Set(holes.map(c=>c.i));for(let i=0;i<W*H;i++){const c=fs.has(lab[i])?[255,40,40]:hs.has(lab[i])?[255,220,0]:null;if(c){img.data[i*4]=c[0];img.data[i*4+1]=c[1];img.data[i*4+2]=c[2];img.data[i*4+3]=255;}}ctx.putImageData(img,0,0);}
 return {area:inkC.reduce((s,c)=>s+c.n,0),fragments:frag.length,fragmentArea:frag.reduce((s,c)=>s+c.n,0),holes:holes.length,holeArea:holes.reduce((s,c)=>s+c.n,0)};
}
function render(a,renderer,name,t){const c=createCanvas(W,H),ctx=c.getContext('2d');renderer.draw(ctx,{x:W/2,y:H-30,height:HEIGHT*a.canvas.visualHeight/(a.canvas.presentationHeight||a.canvas.visualHeight),animation:name,time:t,normalized:true,detail:2});return {c,ctx};}
mkdirSync(out,{recursive:true});const report={};
for(const id of ids.length?ids:Object.keys(g.HONRO_PARTY)){
 // the live bowstring/arrow close natural pockets (string-arm-bow triangle): measure the body without them
 const a=structuredClone(g.HONRO_PARTY[id]);if(a.constraints?.bowstring){a.constraints.bowstring.width=0;a.constraints.arrow.width=0;a.palette[a.constraints.bowstring.color]="rgba(0,0,0,0)";a.palette[a.constraints.arrow.color]="rgba(0,0,0,0)";}const renderer=R.createCanvasRenderer(a),rows=[],tiles=[];
 // baseline = the worst value over the idle loop (the drawing itself, e.g. the pocket between bow and string)
 const base={fragments:0,fragmentArea:0,holes:0,holeArea:0};for(let i=0;i<24;i++){const m=analyse(render(a,renderer,'idle',i/24).ctx);for(const k in base)base[k]=Math.max(base[k],m[k]);}
 for(const [name,clip] of Object.entries(a.animation.animations)){if(name==='idle'&&!args.includes('--idle'))continue;const n=Math.max(12,Math.round((clip.duration_ms||600)/1000*30));
  for(let i=0;i<n;i++){const t=clip.loop?i/n:i/(n-1),{c,ctx}=render(a,renderer,name,t),m=analyse(ctx,sheet);
   // failure: any new detached island, or new enclosed holes, beyond the idle drawing's own
   const bad=m.fragmentArea>base.fragmentArea+40||m.fragments>base.fragments+1||m.holeArea>base.holeArea+60;rows.push({name,t:+t.toFixed(3),...m,bad});if(sheet)tiles.push({c,bad,name,t});}}
 const fails=rows.filter(r=>r.bad);report[id]={idle:base,frames:rows.length,failed:fails.length,worst:[...rows].sort((x,y)=>(y.fragmentArea+y.holeArea)-(x.fragmentArea+x.holeArea)).slice(0,5),byAnimation:Object.fromEntries([...new Set(rows.map(r=>r.name))].map(n=>{const r=rows.filter(x=>x.name===n);return [n,{frames:r.length,failed:r.filter(x=>x.bad).length,maxFragmentArea:Math.max(...r.map(x=>x.fragmentArea)),maxHoleArea:Math.max(...r.map(x=>x.holeArea))}];}))};
 if(sheet){const cols=10,sc=.5,tw=W*sc,th=H*sc,rowsN=Math.ceil(tiles.length/cols),S=createCanvas(cols*tw,rowsN*th),x=S.getContext('2d');x.fillStyle='#3d4a5c';x.fillRect(0,0,S.width,S.height);
  tiles.forEach((tl,i)=>{const X=(i%cols)*tw,Y=((i/cols)|0)*th;x.drawImage(tl.c,X,Y,tw,th);x.fillStyle=tl.bad?'#ff5a4e':'#ffe08a';x.font='11px sans-serif';x.fillText(tl.name+' '+tl.t.toFixed(2),X+4,Y+th-6);if(tl.bad){x.strokeStyle='#ff5a4e';x.lineWidth=2;x.strokeRect(X+1,Y+1,tw-2,th-2);}});
  writeFileSync(`${out}/${id}.png`,S.toBuffer('image/png'));}
 console.log(`${id}: ${fails.length}/${rows.length} frames fail`,JSON.stringify(report[id].byAnimation));
}
writeFileSync(`${out}/report.json`,JSON.stringify(report,null,1));
