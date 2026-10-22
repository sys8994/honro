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
 function ribbons(id,knots,cutRows,colors,{fraction=false,accents=[],relief=[]}={}){
  const t=byId.get(id),xs=[...new Set(t.points.map(p=>p.x))].sort((a,b)=>a-b),left=xs[0],right=xs.at(-1);
  const lines=knots.map(kn=>[...new Set([...xs,...kn.map(p=>p[0])])].sort((a,b)=>a-b).map(x=>{const[a,b]=section(t,x),d=interpolate(kn,x);return[x,a+(fraction?(b-a)*d:d)];}));
  base(t);beds.set(id,lines);
  for(let row=0;row<lines.length-1;row++){
   const upper=lines[row],lower=lines[row+1],cuts=[{a:left,b:left},...cutRows[row].map(c=>typeof c==='number'?{a:c,b:c}:({a:c[0],b:c[1],bend:c.slice(2)})),{a:right,b:right}];
   const boundary=c=>{const a=[c.a,interpolate(upper,c.a)],b=[c.b,interpolate(lower,c.b)],dy=b[1]-a[1];return[a,...(c.bend?.length?[ [c.bend[0],a[1]+dy*.36],[c.bend[1]??c.bend[0],a[1]+dy*.69] ]:[]),b];};
   for(let i=1;i<cuts.length;i++){
    const a=cuts[i-1],b=cuts[i],ps=[...span(upper,a.a,b.a),...boundary(b).slice(1),...span(lower,a.b,b.b).reverse().slice(1),...boundary(a).reverse().slice(1)];
    const tone=shade(colors[row],accents[row]?.[i-1]||0),cut=relief.find(q=>q.row===row&&q.column===i);
    if(!cut){add(id,id+'-bed-'+row+'-'+i,ps,tone);continue;}
    // Replace a selected existing face with two interlocking faces. Both use
    // the same authored broken contact and the original neighbour perimeter.
    const contact=cut.line.map(([f,q])=>{const x=(a.a+(b.a-a.a)*f)*(1-q)+(a.b+(b.b-a.b)*f)*q;return[x,interpolate(upper,x)*(1-q)+interpolate(lower,x)*q];}),head=contact[0][0],foot=contact.at(-1)[0];
    add(id,id+'-cut-left-'+row+'-'+i,[...span(upper,a.a,head),...contact.slice(1),...span(lower,a.b,foot).reverse().slice(1),...boundary(a).reverse().slice(1)],shade(tone,cut.light));
    add(id,id+'-cut-right-'+row+'-'+i,[...span(upper,head,b.a),...boundary(b).slice(1),...span(lower,foot,b.b).reverse().slice(1),...contact.slice().reverse().slice(1)],shade(tone,cut.dark));
    if(cut.joint){const seam=contact.slice(1,4),width=cut.joint;add(id,id+'-short-joint-'+row+'-'+i,[...seam,...seam.map(([x,y],j)=>[x+[0,width,width*.27][j],y+[0,7,3][j]]).reverse()],'#2b4655');}
   }
  }
 }
 // Wide A/B body: the outer hill, inhabited shoulder, steep east nose and
 // entire underbody share the same unequal, stepped geological packages.
 ribbons('v14-upper-hamlet',[
  [[-6000,24],[4100,24]],
  [[-6000,360],[-4400,440],[-2900,340],[-2420,430],[-2300,470],[-2190,320],[-1940,330],[-1550,480],[-700,410],[0,450],[200,460],[260,310],[460,300],[580,350],[1040,470],[1290,500],[1380,390],[1580,380],[2130,450],[2670,310],[2780,290],[2830,410],[3020,390],[3180,390],[3700,270],[4100,160]],
  [[-6000,880],[-4300,1010],[-2550,860],[-2310,900],[-2180,1120],[-1930,1140],[-1820,950],[-1550,980],[-1100,1050],[0,920],[500,1080],[1100,900],[1230,930],[1300,1070],[1510,1100],[1700,1140],[1870,1110],[1930,880],[2120,900],[2290,890],[2900,1080],[3100,1060],[3180,850],[3340,870],[3500,900],[4100,700]],
  [[-6000,1600],[-4500,1770],[-2900,1510],[-2670,1530],[-2540,1770],[-2220,1810],[-2120,1620],[-1840,1660],[-1740,1870],[-1400,1780],[-200,1610],[450,1760],[620,1750],[700,1540],[860,1530],[1080,1530],[1680,1810],[1890,1800],[1990,1570],[2160,1540],[2300,1520],[2920,1700],[3070,1710],[3170,1550],[3350,1570],[3500,1500],[4100,1450]],
  [[-6000,2410],[-4100,2640],[-2500,2320],[-2290,2360],[-2150,2530],[-1840,2540],[-1690,2320],[-1430,2360],[-1320,2640],[-900,2680],[-750,2650],[-630,2400],[-370,2380],[-280,2510],[0,2440],[190,2440],[260,2560],[450,2530],[620,2620],[1260,2360],[1840,2700],[2460,2350],[3100,2490],[4100,2300]],
  [[-6000,3550],[4100,3550]]
 ],[
  [[-4300,-4520],[-2600,-2850],[-1100,-1350],[400,240,360,280],[1010,900],[1530,1430,1480,1510],[2130,2260],[2690,2550,2670,2590],[3220,3110],[3710,3790]],
  [[-4600,-4300],[-2800,-2600],[-1500,-1200],[-180,80],[560,400,510,450],[1120,1260],[1680,1590,1650,1570],[2240,2340],[2810,2690,2780,2720],[3370,3500]],
  [[-4200,-4490],[-2600,-2800],[-1000,-1260],[220,30],[760,890],[1350,1190,1320,1240],[1940,2090],[2500,2400,2490,2430],[3150,3300]],
  [[-4600,-4200],[-2850,-2500],[-1250,-900],[100,300],[820,650,790,700],[1400,1560],[2100,1950,2070,1990],[2700,2810],[3350,3500]],
  [[-4300,-4600],[-2700,-2900],[-1100,-1400],[0,180],[720,900],[1430,1270,1380,1300],[2150,2340],[2850,2730],[3550,3750]]
 ],['#60787d','#58727b','#4f6b77','#435f6e','#385666'],{relief:[
  {row:0,column:3,line:[[.56,0],[.39,.24],[.52,.41],[.36,.7],[.62,1]],light:4,dark:-5},
  {row:1,column:3,line:[[.41,0],[.55,.25],[.43,.47],[.64,.73],[.51,1]],light:6,dark:-8,joint:19},
  {row:2,column:4,line:[[.63,0],[.47,.21],[.59,.4],[.38,.69],[.48,1]],light:-7,dark:6},
  {row:3,column:3,line:[[.46,0],[.62,.27],[.51,.43],[.69,.7],[.56,1]],light:7,dark:-8,joint:25},
  {row:3,column:4,line:[[.67,0],[.53,.2],[.62,.48],[.42,.71],[.5,1]],light:5,dark:-9},
  {row:4,column:3,line:[[.37,0],[.51,.25],[.4,.5],[.59,.76],[.48,1]],light:5,dark:-6},
  {row:4,column:4,line:[[.62,0],[.48,.29],[.6,.46],[.37,.69],[.53,1]],light:6,dark:-8,joint:22},
  {row:4,column:5,line:[[.34,0],[.51,.22],[.41,.49],[.61,.73],[.46,1]],light:-4,dark:6},
  {row:0,column:4,line:[[.65,0],[.55,.25],[.60,.4],[.38,.7],[.50,1]],light:5,dark:-5},
  {row:0,column:6,line:[[.3,0],[.44,.2],[.32,.48],[.58,.7],[.7,1]],light:9,dark:-8,joint:18},
  {row:0,column:8,line:[[.66,0],[.52,.24],[.61,.43],[.37,.73],[.42,1]],light:4,dark:-7},
  {row:1,column:4,line:[[.35,0],[.52,.21],[.42,.44],[.61,.68],[.55,1]],light:7,dark:-8,joint:21},
  {row:1,column:6,line:[[.58,0],[.47,.27],[.61,.49],[.49,.71],[.72,1]],light:-5,dark:7},
  {row:1,column:8,line:[[.33,0],[.48,.19],[.38,.46],[.57,.7],[.61,1]],light:8,dark:-9,joint:16},
  {row:1,column:10,line:[[.7,0],[.55,.26],[.66,.44],[.46,.78],[.53,1]],light:-4,dark:5},
  {row:2,column:3,line:[[.42,0],[.62,.2],[.53,.47],[.69,.64],[.58,1]],light:4,dark:-7},
  {row:2,column:5,line:[[.68,0],[.52,.24],[.61,.39],[.35,.74],[.41,1]],light:7,dark:-9,joint:24},
  {row:2,column:7,line:[[.32,0],[.53,.28],[.42,.46],[.65,.7],[.57,1]],light:-6,dark:7},
  {row:3,column:6,line:[[.62,0],[.44,.23],[.58,.42],[.37,.72],[.49,1]],light:6,dark:-7,joint:19},
  {row:3,column:8,line:[[.31,0],[.48,.2],[.39,.52],[.61,.76],[.52,1]],light:-4,dark:6}
 ],accents:[[0,3,-2,2,-4,7,0,-3,4,-2,0],[1,-3,2,-2,4,0,-4,3,0,-2,1],[-2,2,0,4,-2,3,0,-3,2,0],[-1,2,-2,1,3,-2,1,0,-3,0],[0,-2,2,0,-2,1,0,-2,1,0]]});
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
 function ledge(id,row,l,r,depth,light=false,profile=null){const line=beds.get(id)[row],top=span(line,l,r),surface=profile?[...new Set([...top.map(p=>p[0]),...profile.map(p=>l+(r-l)*p[0])])].sort((a,b)=>a-b).map(x=>[x,interpolate(line,x)]):top,shadow=surface.map(([x,y])=>[x,y+depth*(profile?interpolate(profile,(x-l)/(r-l)):Math.sin(Math.PI*(x-l)/(r-l)))]);add(id,id+'-recess-'+row+'-'+l,[...surface,...shadow.reverse()],'#294858');if(light){const end=l+(r-l)*.72,lip=span(line,l,end);add(id,id+'-seat-'+row+'-'+l,[...lip,...lip.map(([x,y])=>[x,y-9]).reverse()],'#88978f');}}
 ledge('v14-upper-hamlet',2,-2360,-1820,53,false,[[0,0],[.17,.27],[.29,.82],[.67,.65],[.88,.12],[1,0]]);
 ledge('v14-upper-hamlet',3,-2350,-1830,61,true,[[0,0],[.2,.4],[.44,.9],[.76,.58],[.84,.13],[1,0]]);
 ledge('v14-upper-hamlet',4,-830,-250,62,false,[[0,0],[.12,.2],[.31,.84],[.61,.75],[.82,.3],[1,0]]);
 ledge('v14-upper-hamlet',1,120,640,45,true,[[0,0],[.15,.2],[.21,.72],[.7,.85],[.78,.28],[1,0]]);
 ledge('v14-upper-hamlet',1,1190,1600,49,false,[[0,0],[.28,.38],[.36,1],[.68,.68],[.86,.15],[1,0]]);
 ledge('v14-upper-hamlet',1,2690,3050,38,true,[[0,0],[.24,.6],[.64,.78],[.72,.2],[1,0]]);
 ledge('v14-upper-hamlet',2,1780,2200,67,false,[[0,0],[.15,.17],[.3,.92],[.67,.73],[.8,.25],[1,0]]);
 ledge('v14-upper-hamlet',2,3000,3440,58,true,[[0,0],[.12,.15],[.38,.6],[.51,.91],[.86,.48],[1,0]]);
 ledge('v14-upper-hamlet',3,420,910,64,false,[[0,0],[.2,.25],[.39,1],[.7,.8],[.9,.27],[1,0]]);
 ledge('v14-upper-hamlet',3,1710,2190,51,true,[[0,0],[.18,.5],[.61,.73],[.8,.21],[1,0]]);
 ledge('v14-market',1,4510,4870,34,true);ledge('v14-family-yard',2,3770,4240,55,true);ledge('v14-family-yard',1,4470,4830,43);
 ledge(ground.id,1,940,1570,55);ledge(ground.id,2,4000,4580,72,true);ledge(ground.id,3,5220,5850,77);
 space.terrainPlanes=[...planes,...contacts];
 // Replace the enclosing oval vault with staggered, overlapping rear piers.
 // The central inhabited mother rock, exact lower contacts and old atmosphere
 // stay in this same cached Library SVG. These have no walk rims/collision.
 const rear=project.library.find(a=>a.id==='stage14:vertical-cavern-depth');
 let source=rear.vector.source.replace(/<g id="v14-finish-rear-strata">[\s\S]*?<\/g>/g,'');
 const retired=new Set(['continuous-deep-cavern-vault','broad-oblique-vault-plane-above-homes','open-middle-hollow-with-irregular-shoulders','sloping-cavern-ceiling-east-plane','west-dwelling-cove-broad-sidewall','lower-valley-fold-behind-houses','west-cavern-shoulder','west-large-lit-face','west-one-deep-cleft','east-high-asymmetric-rock','east-broad-rock-plane','east-deep-return-recess']);
 source=source.replace(/<path\b[^>]*id="([^"]+)"[^>]*\/>/g,(path,id)=>retired.has(id)?'':path).replace(/<linearGradient id="(?:v14-cave-depth|v14-rear-vault-wash)"[\s\S]*?<\/linearGradient>/g,'');
 let rearBody='';
 function pier(id,tone,outline,inner,faces){const v=[...outline,...inner];rearBody+=svgPoly(id+'-mass',outline,tone);for(const[label,color,indices]of faces)rearBody+=svgPoly(id+'-'+label,indices.map(i=>v[i]),color);}
 // Far west pillar: the outer boundary is interrupted at unequal heights.
 pier('west-far','#142b38',[
  [-650,1000],[-260,620],[430,710],[990,1260],[870,2080],[1320,2650],[1190,3460],[1450,4190],[1200,4890],[1540,5650],[1430,6500],[1770,7250],[1560,8170],[960,8780],[80,9000],[-430,8500],[-290,7640],[-500,6890],[-300,6060],[-560,5250],[-340,4350],[-570,3480],[-350,2610],[-640,1800]
 ],[[120,1850],[700,3100],[450,4550],[970,6020],[720,7560],[400,8600]],[
  ['crown','#223946',[0,1,2,3,4,24,23]],['upper-return','#1b313f',[24,4,5,6,25]],['mid-face','#263d47',[25,6,7,8,26]],['lower-return','#1c3341',[26,8,9,10,27,28,17,18,19,20,21,25]],['foot-face','#29404a',[27,10,11,12,13,29,28]]
 ]);
 // A separate ceiling shoulder ends before the eastern pillars: no circular
 // top band joins the two sides in the whole-village view.
 pier('upper-shoulder','#1c303d',[
  [900,940],[1540,450],[2230,590],[2840,360],[3590,730],[3970,1290],[4460,1910],[4330,2580],[4770,3110],[4500,3940],[3850,4330],[3410,3760],[3190,2820],[2620,2370],[2290,1680],[1550,1760]
 ],[[1990,1010],[3050,1330],[3670,2210],[3980,3170],[3440,3470]],[
  ['west-cut','#2b414b',[0,1,2,16,15]],['crown-cut','#273d48',[2,3,4,5,17,16]],['descending-face','#233945',[16,17,18,13,14,15]],['east-return','#1e3441',[17,5,6,7,18]],['lower-face','#304550',[18,7,8,9,19]],['inner-return','#243b46',[13,18,19,9,10,11,12]]
 ]);
 // Deeper eastern pier starts lower than the upper shoulder and is partly
 // covered by a nearer column; offsets, not a stretched ellipse, carry depth.
 pier('east-far','#132b38',[
  [5860,2200],[6300,1620],[6890,1900],[7160,2770],[7600,3260],[7470,4140],[7800,4780],[7530,5590],[7710,6200],[7340,6980],[6880,7190],[6500,6580],[6620,5690],[6200,5130],[6380,4330],[5990,3670],[6130,2910]
 ],[[6630,2850],[6970,3920],[6940,5210],[7170,6150]],[
  ['upper-cut','#203743',[0,1,2,3,17,16]],['outer-face','#263d48',[17,3,4,5,18]],['return','#192f3d',[17,18,19,13,14,15,16]],['mid-face','#263e49',[18,5,6,7,19]],['lower-cut','#1e3542',[19,7,8,9,20]],['foot','#29404a',[19,20,9,10,11,12,13]]
 ]);
 pier('west-near','#1b3340',[
  [1320,3510],[1940,3250],[2450,3800],[2350,4520],[2760,5070],[2570,5850],[2910,6430],[2720,7190],[2920,7730],[2500,8350],[1530,8650],[1350,7860],[1370,7130],[1270,6360],[1000,5610],[1050,4830],[950,4270]
 ],[[1840,4230],[2010,5520],[2160,6780],[2100,7900]],[
  ['upper-face','#2b424c',[0,1,2,3,17,16]],['inner-return','#243b47',[17,3,4,5,18]],['mid-face','#304650',[18,5,6,7,19]],['lower-face','#273f4a',[19,7,8,9,20]],['west-return','#1e3643',[17,18,19,20,9,10,11,12,13,14,15,16]]
 ]);
 pier('east-near','#233b46',[
  [5510,4180],[6120,3900],[6520,4550],[6400,5270],[6880,5830],[6740,6490],[7110,7040],[6980,7700],[7460,section(ground,7460)[0]],[6880,section(ground,6880)[0]],[6220,8270],[6410,7560],[5990,7010],[6180,6380],[5750,5840],[5910,5150],[5390,4660]
 ],[[5980,4640],[6150,5760],[6470,6950],[6550,7880]],[
  ['crown','#304752',[0,1,2,3,17,16]],['outer-face','#29414c',[17,3,4,5,18]],['inner-return','#203845',[17,18,19,20,10,11,12,13,14,15,16]],['mid-face','#334a54',[18,5,6,7,19]],['foot-face','#2a424d',[19,7,8,9,10,20]]
 ]);
 source=source.replace('<path id="central-inhabited-mother-rock"','<g id="v14-finish-rear-strata">'+rearBody+'</g><path id="central-inhabited-mother-rock"');
 rear.vector=compileSVG(source);rear.params={...rear.params,vectorFinishRevision:1,rearComposition:'five offset rock piers; central inhabited contacts retained; no enclosing oval',broadRockMasses:5,nodeCount:1+(function count(n){return(n.children||[]).reduce((s,c)=>s+1+count(c),0);})(rear.vector.root)};
 stage.design.vertical14Art.terrainPlaneIds=space.terrainPlanes.map(p=>p.id);
 stage.design.vertical14Finish={revision:1,shapeRevision:2,source:'tools/environment/stage14-vector-finish.mjs',scope:'Visual only; live terrain, 17 routes, actors, quests, pacing and narrative unchanged',planeCount:space.terrainPlanes.length,rearAssetId:rear.id};
 return project;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file='shared/data/campaign.json',p=JSON.parse(readFileSync(file,'utf8'));applyStage14VectorFinish(p);writeFileSync(file,JSON.stringify(p)+'\n');console.log('Authored Stage14 whole-body bedding and subordinate rear folds only.');}
