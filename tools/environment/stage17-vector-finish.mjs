/** Build-time only: exposed worksite bedrock, with all timber/machinery intact. */
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {solidSection,createPlaneWriter} from './authored-rock-planes.mjs';
export const STAGE17_ROCK_IDS=['act2-floor','cave-roof','ws-west-work-buttress','ws-west-machine-plinth','ws-east-hoist-buttress','ws-west-upper-rock','ws-east-upper-rock','ws-axle-footing'];
export function applyStage17VectorFinish(project){
 const st=project.stages.find(s=>s.metadata?.stageId===17),planes=[];
 // Each section edge is authored once and reused by both touching faces.
 // Finite rock depths are fractions of the CURRENT original solid, not boxes.
 function strata(id,columns,levels,colors,{direction=1,finite=false,seams={},beds={},joints=[],lights=[]}={}){
  const t=st.terrains.find(t=>t.id===id);if(!t)throw Error('Missing worksite rock '+id);
  const add=createPlaneWriter(planes,id,{prefix:'v17-'+id+'-',flag:'stage17VectorFinish'}),left=Math.min(...t.points.map(p=>p.x)),right=Math.max(...t.points.map(p=>p.x));
  const worldX=x=>finite?left+(right-left)*x:x,at=([x,d])=>{x=worldX(x);const top=solidSection(t,x,direction),depth=finite?Math.abs(solidSection(t,x,-direction)-top):1;return[x,top+direction*d*depth];};
  const row=levels.map(ds=>columns.map((x,i)=>[x,ds[i]])),knots=[...new Set(t.points.map(p=>p.x))].sort((a,b)=>a-b);
  function horizontal(r,j){const a=row[r][j],b=row[r][j+1],custom=beds[r+':'+j];if(custom)return[at(a),...custom.map(at),at(b)];const ax=worldX(a[0]),bx=worldX(b[0]),local=x=>finite?(x-left)/(right-left):x;return[at(a),...knots.filter(x=>x>ax&&x<bx).map(x=>at([local(x),a[1]+(b[1]-a[1])*(x-ax)/(bx-ax)])),at(b)];}
  const sides={};for(let r=0;r<row.length-1;r++)for(let j=0;j<columns.length;j++)sides[r+':'+j]=[at(row[r][j]),...(seams[r+':'+j]||[]).map(at),at(row[r+1][j])];
  add('mother',t.points.map(p=>[p.x,p.y]),finite?'#344c57':direction>0?'#304b55':'#223b47');
  for(let r=0;r<row.length-1;r++)for(let j=0;j<columns.length-1;j++){
   const l=sides[r+':'+j],z=sides[r+':'+(j+1)];add('bed'+r+'-'+j,[...horizontal(r,j),...z.slice(1),...horizontal(r+1,j).reverse().slice(1),...l.slice().reverse().slice(1)],colors[r][j%colors[r].length]);
  }
  if(!finite){const last=row.length-1,bound=direction>0?Math.max(...t.points.map(p=>p.y)):Math.min(...t.points.map(p=>p.y));for(let j=0;j<columns.length-1;j++){const edge=horizontal(last,j);add('deep'+j,[...edge,[edge.at(-1)[0],bound],[edge[0][0],bound]],direction>0?(j%3?'#304b55':'#344e58'):(j%3?'#223b47':'#263f4b'));}}
  for(const[key,w]of joints){const ps=sides[key].slice(1,-1);if(ps.length<2)throw Error('Joint missing authored turns '+id+'/'+key);add('joint'+key,[...ps,...ps.map(([x,y],i)=>[x+(i===1?w:2),y]).reverse()],direction>0?'#293f49':'#19323e');}
  for(const[r,j,w]of lights){const ps=horizontal(r,j);add('short-seat'+r+'-'+j,[...ps,...ps.map(([x,y],i)=>[x,y-direction*(i===0||i===ps.length-1?1:w)]).reverse()],finite?'#82908a':'#758a87');}
 }
 const floorX=[-6000,-4200,-2600,-1100,0,900,1700,2220,3000,3800,4550,5250,6020,6770,7510,8120,8560,9280,10010,10800,11950,13600,15400,17200];
 strata('act2-floor',floorX,[
  floorX.map(()=>0),[600,820,470,730,490,810,400,700,460,850,520,760,430,880,510,720,460,800,540,870,590,820,520,740],
  [1690,1350,1900,1420,1210,1630,1430,1810,1360,1690,1270,1740,1450,1850,1390,1620,1290,1710,1460,1820,1350,1760,1480,1900],
  [3300,3700,2990,3500,2790,3250,2920,3700,3040,3560,2890,3490,3140,3750,2960,3450,2800,3690,3080,3520,2900,3700,3170,3500],
  [5900,6500,5600,6280,5500,6100,5700,6700,5840,6320,5600,6210,5710,6580,5840,6300,5580,6600,5790,6240,5600,6500,5850,6250]
 ],[
  ['#52686a','#607374','#4c6468','#657776','#4d666b','#5e7273','#49636a','#627575','#526c70','#647775','#4b656c','#5b7275','#4d686e','#607577','#4b656c','#627573','#4c666c','#5e7475','#4e686c','#627775','#50696e','#5d7476','#4b656b'],
  ['#405a64','#4d656c','#3d5964','#526a70','#415e66','#506a70','#3d5964','#4e6870','#405d66','#526b71','#3e5964','#4c6570','#405c65','#506970','#405a65','#4e6870','#3d5863','#4d666e','#405a65','#506970','#3f5964','#4c656d','#3e5864'],
  ['#344f5c','#405b66','#36515d','#445f68','#36525f','#425c67','#344f5c','#425d67','#35525f','#415c66','#354f5d','#405b65','#36525e','#425d67','#35515e','#405c67','#34505d','#425b66','#35515d','#405b66','#35505d','#415c65','#35515e'],
  ['#304b57','#395460','#304c59','#3c5661','#314c59','#3b5460','#304b58','#3b5560','#314d59','#3a5460','#314c58','#3a5460','#314c59','#3b5560','#304c59','#3a5460','#304b58','#3b5460','#314d59','#3a5560','#314c59','#3b5460','#304b58']
 ],{seams:{'0:5':[[1000,180],[850,300],[1100,510]],'0:8':[[3110,170],[2980,300],[3240,380]],'0:11':[[5370,180],[5210,370],[5440,520]],'0:14':[[7640,160],[7520,320],[7780,460]],'0:18':[[10130,200],[9980,370],[10270,510]],'1:6':[[1840,760],[1730,980],[1930,1220]],'1:10':[[4680,880],[4510,1110],[4750,1200]],'1:15':[[8250,940],[8100,1180],[8370,1320]],'2:9':[[3950,2030],[3820,2360],[4070,2690]],'3:12':[[6150,3740],[6000,4180],[6280,4760]]},beds:{'1:4':[[260,520],[470,700],[690,650]],'1:9':[[4020,830],[4190,630],[4400,670]],'1:12':[[6260,480],[6410,700],[6590,640]],'1:16':[[8770,520],[8950,740],[9120,660]],'2:7':[[2420,1620],[2640,1410],[2820,1490]],'2:13':[[6950,1770],[7180,1550],[7370,1640]]},joints:[['0:5',14],['0:8',18],['0:14',16],['1:6',18],['1:10',22],['2:9',23]],lights:[[1,4,7],[1,12,8],[2,13,6]]});
 const roofX=[-6000,-3700,-1750,-200,1150,2320,3510,4650,5700,6850,7930,9020,10120,11400,13100,15100,17200];
 strata('cave-roof',roofX,[roofX.map(()=>0),[750,510,880,560,930,620,1050,560,900,580,1020,650,940,600,1050,650,850],[1930,2380,1700,2150,1760,2420,1890,2300,1790,2450,1810,2310,1760,2350,1870,2420,1900],[4100,3540,4350,3700,4600,3650,4250,3500,4470,3710,4300,3560,4570,3680,4400,3590,4200]],[
  ['#2c4652','#38535d','#294450','#3b555f','#2e4955','#3c565e','#2b4652','#3d5760','#2d4853','#3b555e','#2c4752','#3b555e','#2c4753','#3b555e','#2c4653','#37525c'],
  ['#263f4d','#304b57','#25414e','#344e59','#28434f','#344e59','#25404d','#334e59','#28434f','#344e58','#26414e','#334d58','#28424f','#324c57','#26414e','#314b57'],
  ['#233c49','#2b4552','#243e4b','#2d4753','#243e4c','#2c4652','#233e4b','#2d4653','#243f4b','#2b4552','#243e4b','#2c4653','#243e4b','#2b4552','#243e4b','#2b4552']
 ],{direction:-1,seams:{'0:4':[[1260,200],[1140,400],[1390,680]],'0:7':[[4760,150],[4600,270],[4860,430]],'0:10':[[8070,190],[7900,420],[8190,690]],'1:6':[[3630,1240],[3480,1530],[3760,1740]]},beds:{'1:5':[[2640,740],[2910,940],[3200,860]],'1:9':[[7150,720],[7390,960],[7660,850]]},joints:[['0:4',16],['0:7',18],['0:10',17],['1:6',21]]});
 const rocks=[
  ['ws-west-work-buttress',[0,.16,.34,.57,.76,1],[[0,0,0,0,0,0],[.38,.27,.49,.32,.53,.4],[.8,.67,.76,.61,.8,.7],[1,1,1,1,1,1]],['#667779','#566c73','#697a7b','#4a626b','#5f7479'],{'0:2':[[.37,.15],[.31,.28],[.36,.37]],'1:3':[[.60,.47],[.54,.55],[.59,.61]]}],
  ['ws-west-machine-plinth',[0,.21,.48,.7,1],[[0,0,0,0,0],[.29,.4,.25,.46,.32],[.68,.59,.73,.64,.8],[1,1,1,1,1]],['#6a7978','#566e72','#627775','#48636d'],{'0:2':[[.51,.1],[.46,.17],[.50,.23]]}],
  ['ws-east-hoist-buttress',[0,.13,.31,.48,.69,.85,1],[[0,0,0,0,0,0,0],[.38,.26,.44,.31,.48,.35,.42],[.77,.65,.75,.6,.79,.67,.8],[1,1,1,1,1,1,1]],['#5c7278','#6d7d7d','#536b72','#64797c','#48636d','#5c7278'],{'0:3':[[.5,.13],[.45,.22],[.49,.29]],'1:4':[[.72,.54],[.66,.62],[.71,.72]]}],
  ['ws-west-upper-rock',[0,.24,.43,.71,1],[[0,0,0,0,0],[.35,.5,.31,.46,.42],[.79,.66,.78,.62,.8],[1,1,1,1,1]],['#5d7379','#6d7e7f','#4d6772','#61767b'],{'0:2':[[.46,.1],[.4,.2],[.45,.29]]}],
  ['ws-east-upper-rock',[0,.18,.4,.63,.84,1],[[0,0,0,0,0,0],[.42,.27,.46,.34,.5,.38],[.78,.62,.76,.6,.8,.7],[1,1,1,1,1,1]],['#657a7d','#516c75','#6d7d7e','#486470','#5c747b'],{'0:3':[[.66,.14],[.59,.24],[.64,.32]]}],
  ['ws-axle-footing',[0,.23,.51,.76,1],[[0,0,0,0,0],[.3,.46,.31,.48,.4],[.74,.61,.78,.65,.8],[1,1,1,1,1]],['#657977','#536e72','#6b7d7a','#4b656e'],{}]
 ];
 for(const[id,xs,ds,top,seams]of rocks){const lower=top.map((hex,i)=>['#3c5663','#45616b','#3b5664','#49636d','#3b5663','#425f69'][i]),deep=top.map((hex,i)=>['#314b5a','#3a5663','#314d5c','#3b5664','#324f5d','#395460'][i]);strata(id,xs,ds,[top,lower,deep],{finite:true,seams,joints:[],lights:[]});}
 st.design.space.terrainPlanes=[...planes,...st.design.space.terrainPlanes.filter(p=>!p.stage17VectorFinish&&!STAGE17_ROCK_IDS.includes(p.terrainId))];
 st.design.stage17VectorFinish={revision:1,source:'tools/environment/stage17-vector-finish.mjs',terrainIds:STAGE17_ROCK_IDS};return project;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file='shared/data/campaign.json',p=JSON.parse(readFileSync(file,'utf8'));applyStage17VectorFinish(p);writeFileSync(file,JSON.stringify(p)+'\n');console.log('Authored Stage17 exposed solid rock only.');}
