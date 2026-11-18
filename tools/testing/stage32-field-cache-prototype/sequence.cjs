const fs=require('fs'),vm=require('vm'),{createCanvas,Path2D}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const body=JSON.parse(fs.readFileSync('stage32-gray-diagnostic/review/source-evidence.json')).body,field=JSON.parse(fs.readFileSync('stage32-internal-boundary-review/foundation.json')),fl={asset:field,x:-5500,y:-1950,scale:1,rotation:0},bl={asset:body,x:0,y:0,scale:1,rotation:0},battle={honroStage:32,honroLandmarks:[fl,bl]},reports=[];
for(const pose of [{name:'desktop',d:1,w:1331,h:763},{name:'phone3',d:3,w:1170,h:2088}]){
 const variants={};for(const name of ['baseline','candidate']){const g=vm.createContext({Path2D,performance,document:{createElement:()=>createCanvas(1,1)}});vm.runInContext(fs.readFileSync(__dirname+'/'+name+'.js','utf8'),g);variants[name]={g,c:createCanvas(pose.w,pose.h).getContext('2d')};}
 for(const [i,xy] of [[320,1650],[336,1650],[352,1666],[320,1650],[640,1650],[320,1650]].entries()){
 const imgs={},stats={};for(const[name,{g,c}]of Object.entries(variants)){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,pose.w,pose.h);c.fillStyle=i===5?'#da70d6':'#142433';c.fillRect(0,0,pose.w,pose.h);const z=1.65*pose.d;c.setTransform(z,0,0,z,pose.w/2-xy[0]*z,pose.h/2-xy[1]*z);let t=performance.now();for(const l of[fl,bl])g.HonroStage32FoundationArt.draw(c,l,battle,false,{sceneScale:1.65,nativeLive:true});const submit=performance.now()-t;imgs[name]=c.getImageData(0,0,pose.w,pose.h).data;stats[name]={submit,stats:g.HonroStage32FoundationArt.stats()};}
 let changed=0,alpha=0,max=0;for(let k=0;k<imgs.baseline.length;k+=4){alpha+=imgs.baseline[k+3]!==imgs.candidate[k+3];if([0,1,2].some(j=>imgs.baseline[k+j]!==imgs.candidate[k+j])){changed++;max=Math.max(max,...[0,1,2].map(j=>Math.abs(imgs.baseline[k+j]-imgs.candidate[k+j])));}}
 if(stats.candidate.stats.totalLogicalBytes>48*1024*1024)throw Error('logical budget');reports.push({pose:pose.name,frame:i,xy,changed,alpha,max,...stats});
 }
 variants.candidate.g.HonroStage32FoundationArt.clear();reports.push({pose:pose.name,afterClear:variants.candidate.g.HonroStage32FoundationArt.stats()});
}
fs.writeFileSync(__dirname+'/sequence.json',JSON.stringify({scope:'Native only; pixel readback after timing; not actual Chrome or clean performance',reports},null,2));
