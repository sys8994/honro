/** Stage14 visual author only: connected bedrock through complete live solids.
 * No renderer, collision, path, actor, objective or narrative authoring. */
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {compileSVG} from './build-act2-art.mjs';
const N=v=>Math.round(v*100)/100;
const interpolate=(ps,x)=>{for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]||1);}return x<ps[0][0]?ps[0][1]:ps.at(-1)[1];};
const section=(t,x)=>{const ys=t.points.flatMap((a,i)=>{const b=t.points[(i+1)%t.points.length];return b.x!==a.x&&x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x)?[a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x)]:[];});return[Math.min(...ys),Math.max(...ys)];};
const span=(line,l,r)=>[[l,interpolate(line,l)],...line.filter(p=>p[0]>l&&p[0]<r),[r,interpolate(line,r)]];
const shade=(hex,n)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(hex.slice(i,i+2),16)+n)).toString(16).padStart(2,'0')).join('');
const svgPoly=(id,ps,fill)=>`<path id="${id}" fill="${fill}" d="M${ps.map(p=>p.map(N).join(' ')).join('L')}Z"/>`;
export function applyStage14VectorFinish(project){
 const stage=project.stages.find(s=>s.metadata?.stageId===14),space=stage.design.space;
 if(stage.initialState.honroVerticalStage14Revision!==1)throw Error('Requires current Stage14 vertical geography');
 // Domestic contacts/real timber are retained; the old huge reference stamps
 // and their outlines are replaced, not buried under another material layer.
 const contacts=(space.terrainPlanes||[]).filter(p=>!p.stage14VectorFinish&&(
  /-contact-|C-plane-(shop-contact|shop-stone-|shop-foundation|house-contact|house-stone-|house-top-edge|house-bottom-contact)/.test(p.id)||
  /^v14-art-stone-(lintel-|bridge-timber-|bridge-real-board-)/.test(p.id)||p.terrainId==='gate-bridge'));
 const planes=[],byId=new Map(stage.terrains.map(t=>[t.id,t])),beds=new Map();
 const add=(terrainId,id,points,fill)=>planes.push({terrainId,id:'v14-finish-'+id,stage14VectorFinish:true,points:points.map(p=>p.map(N)),fill});
 const base=t=>add(t.id,t.id+'-mother-rock',t.points.map(p=>[p.x,p.y]),t.id==='v14-refuge-ground'?'#334f60':'#425e6d');
 function ribbons(id,knots,cutRows,colors,{fraction=false,accents=[]}={}){
  const t=byId.get(id),xs=[...new Set(t.points.map(p=>p.x))].sort((a,b)=>a-b),left=xs[0],right=xs.at(-1);
  const lines=knots.map(kn=>[...new Set([...xs,...kn.map(p=>p[0])])].sort((a,b)=>a-b).map(x=>{const[a,b]=section(t,x),d=interpolate(kn,x);return[x,a+(fraction?(b-a)*d:d)];}));
  base(t);beds.set(id,lines);
  for(let row=0;row<lines.length-1;row++){
   const upper=lines[row],lower=lines[row+1],cuts=[{a:left,b:left},...cutRows[row].map(c=>typeof c==='number'?{a:c,b:c}:({a:c[0],b:c[1],bend:c.slice(2)})),{a:right,b:right}];
   const boundary=c=>{const a=[c.a,interpolate(upper,c.a)],b=[c.b,interpolate(lower,c.b)],dy=b[1]-a[1];return[a,...(c.bend?.length?[ [c.bend[0],a[1]+dy*.36],[c.bend[1]??c.bend[0],a[1]+dy*.69] ]:[]),b];};
   for(let i=1;i<cuts.length;i++){
    const a=cuts[i-1],b=cuts[i],ps=[...span(upper,a.a,b.a),...boundary(b).slice(1),...span(lower,a.b,b.b).reverse().slice(1),...boundary(a).reverse().slice(1)];
    add(id,id+'-bed-'+row+'-'+i,ps,shade(colors[row],accents[row]?.[i-1]||0));
   }
  }
 }
 // Wide A/B body: the outer hill, inhabited shoulder, steep east nose and
 // entire underbody share the same unequal, stepped geological packages.
 ribbons('v14-upper-hamlet',[
  [[-6000,24],[4100,24]],
  [[-6000,360],[-4400,440],[-2900,340],[-1550,480],[-700,410],[0,450],[580,350],[1040,470],[1580,380],[2130,450],[2670,310],[3180,390],[3700,270],[4100,160]],
  [[-6000,880],[-4300,1010],[-2550,860],[-1100,1050],[0,920],[500,1080],[1100,900],[1700,1140],[2290,890],[2900,1080],[3500,900],[4100,700]],
  [[-6000,1600],[-4500,1770],[-2900,1510],[-1400,1780],[-200,1610],[450,1760],[1080,1530],[1680,1810],[2300,1520],[2920,1700],[3500,1500],[4100,1450]],
  [[-6000,2410],[-4100,2640],[-2500,2320],[-900,2680],[0,2440],[620,2620],[1260,2360],[1840,2700],[2460,2350],[3100,2490],[4100,2300]],
  [[-6000,3550],[4100,3550]]
 ],[
  [[-4300,-4520],[-2600,-2850],[-1100,-1350],[400,240,360,280],[1010,900],[1530,1430,1480,1510],[2130,2260],[2690,2550,2670,2590],[3220,3110],[3710,3790]],
  [[-4600,-4300],[-2800,-2600],[-1500,-1200],[-180,80],[560,400,510,450],[1120,1260],[1680,1590,1650,1570],[2240,2340],[2810,2690,2780,2720],[3370,3500]],
  [[-4200,-4490],[-2600,-2800],[-1000,-1260],[220,30],[760,890],[1350,1190,1320,1240],[1940,2090],[2500,2400,2490,2430],[3150,3300]],
  [[-4600,-4200],[-2850,-2500],[-1250,-900],[100,300],[820,650,790,700],[1400,1560],[2100,1950,2070,1990],[2700,2810],[3350,3500]],
  [[-4300,-4600],[-2700,-2900],[-1100,-1400],[0,180],[720,900],[1430,1270,1380,1300],[2150,2340],[2850,2730],[3550,3750]]
 ],['#60787d','#58727b','#4f6b77','#435f6e','#385666'],{accents:[[0,3,-2,2,-4,7,0,-3,4,-2,0],[1,-3,2,-2,4,0,-4,3,0,-2,1],[-2,2,0,4,-2,3,0,-3,2,0],[-1,2,-2,1,3,-2,1,0,-3,0],[0,-2,2,0,-2,1,0,-2,1,0]]});
 // Finite inhabited shelves and unequal descending roads. Each section has
 // its own authored breaks; no boulder outlines or repeated wedge stamps.
 const finite=[
  ['v14-market',[.02,.24,.61,1.12],[[[4480,4560],[4800,4740]],[[4510,4440],[4820,4900]],[[4460,4540],[4800,4740]]]],
  ['v14-mineral-way',[.02,.34,.72,1.15],[[2480,2810,3180,3540,3860],[2530,2920,3260,3640],[2450,2760,3150,3510,3840]]],
  ['v14-west-family-road',[.025,.40,.80,1.12],[[2040,2370,2710,3100],[2110,2510,2900,3270],[1990,2300,2740,3140]]],
  ['v14-east-crown-road',[.025,.36,.75,1.12],[[5530,5830,6230,6590],[5610,5950,6400,6740],[5490,5800,6170,6580]]],
  ['v14-east-steps',[.025,.31,.68,1.12],[[5340,5610],[5270,5530,5760],[5390,5660]]],
  ['v14-east-shoulder',[.02,.30,.65,1.12],[[5900,6200,6600,6960],[6020,6410,6820],[5870,6260,6650,7030]]],
  ['v14-east-family-road',[.025,.40,.79,1.12],[[5490,5870,6290,6700,7160],[5610,6050,6500,6960,7370],[5420,5810,6230,6660,7100]]],
  ['v14-family-shoulders',[.02,.32,.70,1.12],[[4740,5050,5390],[4820,5170,5480],[4690,5010,5310]]],
  ['v14-family-yard',[.02,.27,.63,1.12],[[2780,3150,3560,3920,4310,4680],[2900,3320,3760,4150,4560,4860],[2770,3200,3610,3980,4400,4780]]]
 ];
 for(const[id,levels,cuts]of finite){const t=byId.get(id),left=Math.min(...t.points.map(p=>p.x)),right=Math.max(...t.points.map(p=>p.x));ribbons(id,levels.map((v,i)=>[[left,v],[left+(right-left)*.31,v*(i===1?1.13:1)],[left+(right-left)*.72,v*(i===2?.91:1)],[right,v]]),cuts,['#637c82','#54717c','#425f70'],{fraction:true,accents:[[0,5,-3,2,0,-2,3],[2,-3,1,4,-2,1],[0,2,-2,0,3,-1]]});}
 // Lower ground includes the complete v6 west/east extension; a new camera
 // position must not reveal the beginning of a rectangular paint sheet.
 const ground=byId.get('v14-refuge-ground');
 ribbons(ground.id,[
  [[-6000,24],[13600,24]],
  [[-6000,390],[-3800,520],[-1600,430],[0,470],[900,370],[1750,500],[2600,390],[3400,510],[4250,400],[5050,520],[5900,390],[6800,480],[8300,410],[10400,550],[13600,430]],
  [[-6000,1010],[-4200,1220],[-1900,1020],[200,1150],[1100,980],[2070,1190],[3000,970],[3900,1210],[4800,1050],[5750,1230],[6800,980],[8500,1160],[10800,1040],[13600,1200]],
  [[-6000,1900],[-3500,2170],[-1000,1920],[900,2100],[2000,1850],[3200,2180],[4400,1920],[5600,2130],[6900,1880],[9000,2200],[11500,1940],[13600,2100]],
  [[-6000,3100],[-3000,3380],[0,3100],[1450,3410],[3000,3180],[4550,3370],[6100,3090],[8000,3400],[11000,3150],[13600,3310]],
  [[-6000,5100],[0,5300],[2400,5000],[4800,5400],[7200,5110],[10000,5300],[13600,5100]],
  [[-6000,10100],[13600,10100]]
 ],[
  [[-4300,-4460],[-2200,-1970],[-700,-840],[500,360,460,390],[1200,1370],[1900,1770,1880,1810],[2650,2820],[3300,3130],[4000,4210,4070,4160],[4700,4590],[5400,5560],[6150,5980],[6900,7120],[8100,7890],[10400,10700]],
  [[-4600,-4290],[-2500,-2720],[-950,-770],[250,410],[990,840,940,890],[1640,1830],[2360,2210],[3000,3190,3080,3150],[3750,3590],[4500,4710],[5250,5110,5220,5150],[5960,6110],[6660,6500],[7520,7780],[9500,9290],[11700,12000]],
  [[-4200,-4470],[-2100,-1890],[-450,-660],[650,480],[1390,1580],[2170,1990,2110,2040],[2860,3100],[3560,3390],[4340,4540],[5070,4890,5010,4940],[5840,6040],[6570,6390],[7350,7540],[8700,8480],[11000,11260]],
  [-4500,-2600,-800,300,1120,2010,2760,3510,4260,4980,5700,6420,7200,8500,10600],
  [-4300,-2200,-600,650,1530,2440,3260,4170,5070,5980,6940,8400,10800],
  [-4600,-2800,-1100,300,1600,2900,4100,5400,6700,8200,10200]
 ],['#5b7680','#4f6d79','#435f6f','#3c596a','#355364','#304e60'],{accents:[[0,3,-2,1,4,-2,0,5,-2,1,0,3,-2,1],[1,-2,0,3,-1,2,0,-2,3,0,2,-1],[0,2,-1,0,3,-2,1,0,-2,1],[0,-2,1,0,2,-1,0,1],[0,1,-1,0,2,-1],[0,-1,0,1,-1,0]]});
 // A few interrupted bed contacts, not caps around every polygon. They taper
 // into the shared geological boundary and cannot alter the walking outline.
 function ledge(id,row,l,r,depth,light=false){const line=beds.get(id)[row],top=span(line,l,r),shadow=top.map(([x,y])=>[x,y+depth*Math.sin(Math.PI*(x-l)/(r-l))]);add(id,id+'-recess-'+row+'-'+l,[...top,...shadow.reverse()],'#294858');if(light){const end=l+(r-l)*.72,lip=span(line,l,end);add(id,id+'-seat-'+row+'-'+l,[...lip,...lip.map(([x,y])=>[x,y-9]).reverse()],'#88978f');}}
 ledge('v14-upper-hamlet',1,470,1020,52,true);ledge('v14-upper-hamlet',2,1470,2080,75);ledge('v14-upper-hamlet',3,230,850,68,true);ledge('v14-upper-hamlet',3,2150,2710,70);
 ledge('v14-market',1,4510,4870,34,true);ledge('v14-family-yard',2,3770,4240,55,true);ledge('v14-family-yard',1,4470,4830,43);
 ledge(ground.id,1,940,1570,55);ledge(ground.id,2,4000,4580,72,true);ledge(ground.id,3,5220,5850,77);
 space.terrainPlanes=[...planes,...contacts];
 // Low-value connected folds in the existing rear SVG, below foreground tone.
 // Keep its original silhouette, supports and atmosphere; the group has no rim,
 // black passage holes or collision. Existing SVG preparation caches it once.
 const rear=project.library.find(a=>a.id==='stage14:vertical-cavern-depth');
 let source=rear.vector.source.replace(/<g id="v14-finish-rear-strata">[\s\S]*?<\/g>/g,'');
 // Actual minimum-zoom outer pans expose the old SVG's x=-700/8050
 // vertical card ends. Author those existing rear silhouettes as rock returns;
 // no camera clamp, added collider, image mask or per-frame edge work.
 const pathD=(id,fn)=>{const re=new RegExp('(<path id="'+id+'" d=")([^"]+)(")');source=source.replace(re,(_,a,d,z)=>a+fn(d)+z);};
 const westReturn='L-500 8460L-590 7910L-350 7360L-490 6760L-280 6180L-430 5600L-220 4970L-390 4360L-170 3740L-340 3120L-150 2510L-330 1920L-470 1320';
 const eastReturn='L7860 3860L7940 4440L7730 5050L7890 5630L7600 6210L7730 6840L7460 7380L7580 7900L7460 8410L7800 8810';
 pathD('continuous-deep-cavern-vault',()=> 'M-700 800Q1850 200 3830 840Q6380 580 8050 3220'+eastReturn+'L-500 9030'+westReturn+'Z');
 pathD('west-cavern-shoulder',d=>d.slice(0,d.indexOf('L420 '))+`L420 ${section(ground,420)[0]}L-500 ${section(ground,420)[0]+350}`+westReturn+'Z');
 pathD('east-high-asymmetric-rock',()=>`M5450 2900Q6160 2530 6880 3050L7940 4650L7730 5050L7890 5630L7600 6210L7730 6840L7460 7380L7580 7900L7460 8410L7800 8858L7460 ${section(ground,7460)[0]}L6880 ${section(ground,6880)[0]}Q7180 7360 6510 6340Q6200 5800 6430 5070Q6150 3470 5450 2900Z`);
 pathD('east-deep-return-recess',()=>`M7230 3640L7860 4940L7770 5490L7500 6120L7630 6710L7370 7300L7470 7870L7280 8410L7950 ${section(ground,7460)[0]+160}L7460 ${section(ground,7460)[0]}Q7730 7210 7410 6500Q7170 5380 7230 3640Z`);
 const rearLines=[[[1800,1150],[2600,1270],[3450,1080],[4300,1430],[5200,1620],[6100,2390],[7050,3400]],[[1800,2350],[2600,2500],[3450,2200],[4300,2560],[5200,2300],[6100,2930],[7050,3650]],[[1700,3500],[2580,3300],[3460,3670],[4320,3390],[5250,3620],[6200,3580],[7210,4020]],[[1850,4540],[2750,4750],[3500,4430],[4430,4690],[5330,4460],[6240,4760],[7230,4500]],[[2040,5700],[2850,5420],[3720,5850],[4510,5540],[5430,5830],[6270,5500],[7270,5890]],[[2280,6830],[3000,7110],[3850,6790],[4700,7180],[5550,6830],[6400,7120],[7280,6860]],[[2500,8300],[3300,8190],[4120,8340],[4930,8170],[5710,8330],[6500,8210],[7300,8320]]];
 // Entry follow sees the west upper vault at normal .82, not only the
 // central village. Its folds use offset shared contacts, not a giant lit stamp.
 const entryLines=[
  [[-520,1000],[60,890],[540,950],[980,820],[1450,960],[1910,850],[2370,1080],[2850,1020],[3350,1270],[3830,1440]],
  [[-400,1450],[140,1290],[470,1360],[1060,1200],[1370,1430],[2000,1300],[2290,1500],[2940,1500],[3250,1780],[3830,1940]],
  [[-330,2520],[10,2380],[610,2570],[910,2440],[1560,2680],[1820,2470],[2500,2770],[2780,2910],[3450,3050],[3830,3300]]
 ];let entryBody='';
 for(let r=0;r<2;r++)for(let i=1;i<entryLines[r].length;i++){
  const a=entryLines[r][i-1],b=entryLines[r][i],c=entryLines[r+1][i],d=entryLines[r+1][i-1];
  entryBody+=svgPoly('v14-rear-entry-'+r+'-'+i,[a,b,c,d],shade(r?'#203743':'#263b46',[0,3,-2,1,-3,2,0,-2,1][i-1]));
 }
 const rearTones=['#243944','#263d48','#2a404b','#253d49','#2b414c','#263e49'];let rearBody=entryBody;
 for(let row=0;row<rearLines.length-1;row++)for(let i=1;i<rearLines[row].length;i++){
  const edge=j=>{const a=rearLines[row][j],b=rearLines[row+1][j];return[a,...((j+row)%3===0?[[a[0]-100,a[1]+(b[1]-a[1])*.4],[b[0]+80,a[1]+(b[1]-a[1])*.7]]:[]),b];};
  const a=rearLines[row][i-1],b=rearLines[row][i],d=rearLines[row+1][i-1];
  rearBody+=svgPoly('v14-rear-bed-'+row+'-'+i,[a,b,...edge(i).slice(1),d,...edge(i-1).reverse().slice(1)],shade(rearTones[row],i===3?3:i===5?-2:0));
 }
 source=source.replace('<g id="middle-depth-soft-recession"','<g id="v14-finish-rear-strata">'+rearBody+'</g><g id="middle-depth-soft-recession"');rear.vector=compileSVG(source);rear.params={...rear.params,vectorFinishRevision:1,nodeCount:1+(function count(n){return(n.children||[]).reduce((s,c)=>s+1+count(c),0);})(rear.vector.root)};
 stage.design.vertical14Art.terrainPlaneIds=space.terrainPlanes.map(p=>p.id);
 stage.design.vertical14Finish={revision:1,source:'tools/environment/stage14-vector-finish.mjs',scope:'Visual only; live terrain, 17 routes, actors, quests, pacing and narrative unchanged',planeCount:space.terrainPlanes.length,rearAssetId:rear.id};
 return project;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file='shared/data/campaign.json',p=JSON.parse(readFileSync(file,'utf8'));applyStage14VectorFinish(p);writeFileSync(file,JSON.stringify(p)+'\n');console.log('Authored Stage14 whole-body bedding and subordinate rear folds only.');}
