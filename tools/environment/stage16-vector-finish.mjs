/** Stage16 build-time author only: natural bedrock below worked temple stone.
 * Unequal shared contacts and two recessed rear abutments; no runtime pass. */
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {compileSVG} from './build-act2-art.mjs';
export const STAGE16_SUPPORT_ASSET='stage16:temple-recessed-foundation';
const n=v=>Math.round(v*100)/100;
const shade=(hex,d)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(hex.slice(i,i+2),16)+d)).toString(16).padStart(2,'0')).join('');
const poly=(ps,fill)=>`<path d="M${ps.map(p=>p.join(' ')).join('L')}Z" fill="${fill}"/>`;
export function applyStage16VectorFinish(project){
 const st=project.stages.find(s=>s.metadata?.stageId===16),space=st.design.space,planes=[];
 const splits={
  '0:5':[90,230,[[100,150],[-30,290],[210,410]]],
  '0:6':[920,1120,[[1030,140],[930,270],[1170,460]]],
  '0:8':[2450,2720,[[2570,180],[2460,370],[2750,580]]],
  '0:11':[4640,4860,[[4750,180],[4630,320],[4910,450]]],
  '0:12':[5320,5530,[[5430,180],[5320,350],[5520,540]]],
  '0:14':[6580,6840,[[6710,170],[6580,330],[6820,510]]],
  '0:16':[7860,8140,[[7970,180],[7830,370],[8080,570]]],
  '0:17':[8760,8860,[[8890,160],[8720,350],[9000,570]]],
  '0:19':[10600,10450,[[10470,170],[10610,310],[10420,470]]]
 };
 const layers={
  '0:7':[.55,.42,[[1660,250],[1790,210],[1940,340]]],
  '0:9':[.48,.58,[[3170,270],[3280,410],[3450,380]]],
  '0:10':[.48,.55,[[3800,350],[3940,290],[4100,380]]],
  '0:13':[.46,.59,[[5900,300],[6050,440],[6240,400]]],
  '0:15':[.56,.44,[[7260,280],[7410,230],[7580,350]]],
  '0:18':[.42,.6,[[9630,270],[9750,380],[9890,350]]]
 };
 function body(id,dir,rows,joins,tones,bends,clefts,ledges){
  const t=st.terrains.find(t=>t.id===id),surface=x=>{const ys=[];for(let i=0;i<t.points.length;i++){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(a.x!==b.x&&x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x))ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}return dir>0?Math.min(...ys):Math.max(...ys);},at=([x,d])=>[x,surface(x)+dir*d],v=rows.map(r=>r.map(at));
  const add=(key,ps,fill)=>planes.push({id:'v16-'+id+'-'+key,terrainId:id,stage16VectorFinish:true,fill,points:ps.map(p=>p.map(n))});
  add('mother',t.points.map(p=>[p.x,p.y]),dir>0?'#344e54':'#203a46');
  function edge(r,i){const a=rows[r][i],b=rows[r][i+1];return[v[r][i],...(r===0?[...new Set(t.points.map(p=>p.x))].filter(x=>x>a[0]&&x<b[0]).sort((a,b)=>a-b).map(x=>[x,surface(x)]):(bends['bed'+r+':'+i]||[]).map(at)),v[r][i+1]];}
  function span(r,l,h){const ps=[v[r][l]];for(let i=l;i<h;i++)ps.push(...edge(r,i).slice(1));return ps;}
  const contacts={};
  for(let r=0;r<joins.length;r++){
   const seams=joins[r].map(([i,j])=>{const k=r+':'+i,path=[v[r][i],...(bends[k]||[]).map(at),v[r+1][j]];contacts[k]=path;return{i,j,path};});
   for(let i=1;i<seams.length;i++){
    const a=seams[i-1],b=seams[i],upper=span(r,a.i,b.i),lower=span(r+1,a.j,b.j),tone=tones[r][(i-1)%tones[r].length],cut=id==='act2-floor'?splits[r+':'+i]:null,layer=id==='act2-floor'?layers[r+':'+i]:null;
    if(layer){
     const divide=(ps,f)=>{const k=f*(ps.length-1),j=Math.min(ps.length-2,Math.floor(k)),v=k-j,a=ps[j],b=ps[j+1],point=[a[0]+(b[0]-a[0])*v,a[1]+(b[1]-a[1])*v];return{point,up:[...ps.slice(0,j+1),point],down:[point,...ps.slice(j+1)]};},left=divide(a.path,layer[0]),right=divide(b.path,layer[1]),joint=[left.point,...layer[2].map(at),right.point];
     add('layer-upper'+r+'-'+i,[...upper,...right.up.slice(1),...joint.slice().reverse().slice(1),...left.up.slice().reverse().slice(1)],shade(tone,2));
     add('layer-lower'+r+'-'+i,[...joint,...right.down.slice(1),...lower.slice().reverse().slice(1),...left.down.slice().reverse().slice(1)],shade(tone,-4));continue;
    }
    if(!cut){add('plane'+r+'-'+i,[...upper,...b.path.slice(1),...lower.slice().reverse().slice(1),...a.path.slice().reverse().slice(1)],tone);continue;}
    const sample=(ps,x)=>{for(let j=1;j<ps.length;j++){const a=ps[j-1],b=ps[j];if(x>=a[0]&&x<=b[0])return[x,a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])];}throw Error('Split outside authored face '+id+'/'+r+':'+i);},part=(ps,l,h)=>[sample(ps,l),...ps.filter(p=>p[0]>l&&p[0]<h),sample(ps,h)],joint=[sample(upper,cut[0]),...cut[2].map(at),sample(lower,cut[1])];
    add('split-left'+r+'-'+i,[...part(upper,upper[0][0],cut[0]),...joint.slice(1),...part(lower,lower[0][0],cut[1]).reverse().slice(1),...a.path.slice().reverse().slice(1)],shade(tone,3));
    add('split-right'+r+'-'+i,[...part(upper,cut[0],upper.at(-1)[0]),...b.path.slice(1),...part(lower,cut[1],lower.at(-1)[0]).reverse().slice(1),...joint.slice().reverse().slice(1)],shade(tone,-3));
   }
  }
  const end=v.at(-1),bottom=dir>0?Math.max(...t.points.map(p=>p.y)):Math.min(...t.points.map(p=>p.y));for(let i=1;i<end.length;i++)add('deep'+i,[end[i-1],end[i],[end[i][0],bottom],[end[i-1][0],bottom]],dir>0?(i%3?'#344e54':'#384f55'):(i%3?'#203a46':'#253e49'));
  for(const[key,width]of clefts){const ps=contacts[key].slice(1,-1);if(ps.length<2)throw Error('Authored joint needs turns');add('joint'+key,[...ps,...ps.map(([x,y],i)=>[x+(i===1?width:3),y+dir*(i===1?8:0)]).reverse()],dir>0?'#2c464c':'#193440');}
  for(const[r,i,width,light]of ledges){const ps=edge(r,i);add('recess'+r+'-'+i,[...ps,...ps.map(([x,y],j)=>[x,y+dir*width*(j===0||j===ps.length-1?.1:1)]).reverse()],dir>0?'#3a5357':'#1d3743');if(light)add('seat'+r+'-'+i,[...ps,...ps.map(([x,y],j)=>[x,y-dir*(j===0||j===ps.length-1?1:8)]).reverse()],dir>0?'#84938a':'#526b70');}
 }
 const floor=[
  [-6000,-4400,-2900,-1500,-300,500,1320,2100,2850,3500,4250,4950,5560,6200,6910,7550,8140,8750,9490,10230,11000,12300,13800,15400,17000].map(x=>[x,0]),
  [[-6000,700],[-4300,950],[-2700,580],[-1380,870],[-420,540],[710,760],[1480,430],[2310,920],[3150,470],[3710,810],[4510,530],[5180,990],[5800,690],[6540,880],[7160,450],[7820,940],[8530,550],[9180,850],[9920,480],[10780,820],[11920,610],[13500,940],[15200,580],[17000,850]],
  [[-6000,1820],[-4200,2130],[-2400,1570],[-760,1900],[430,1370],[1640,1990],[2640,1520],[3540,1840],[4370,1420],[5320,1910],[6250,1570],[7100,2030],[7970,1450],[8890,1920],[9850,1490],[11100,2040],[12700,1620],[14700,2100],[17000,1700]],
  [[-6000,3900],[-3800,3500],[-1500,4210],[200,3280],[1920,3970],[3380,3300],[5010,4130],[6690,3380],[8300,3970],[10080,3400],[12000,4050],[14500,3500],[17000,4160]],
  [[-6000,6500],[-3400,5900],[-900,6700],[1350,5700],[3610,6400],[5770,5900],[8170,6700],[10300,5800],[12800,6600],[15000,6000],[17000,6400]]
 ];
 body('act2-floor',1,floor,[
  [[0,0],[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,8],[9,9],[10,10],[11,11],[12,12],[13,13],[14,14],[15,15],[16,16],[18,17],[19,18],[20,19],[21,20],[22,21],[23,22],[24,23]],
  [[0,0],[1,1],[2,2],[3,3],[4,4],[6,5],[7,6],[9,7],[10,8],[11,9],[13,10],[14,11],[16,12],[17,13],[18,14],[19,15],[21,16],[22,17],[23,18]],
  [[0,0],[1,1],[2,2],[4,3],[5,4],[7,5],[9,6],[11,7],[12,8],[14,9],[16,10],[17,11],[18,12]],
  [[0,0],[1,1],[2,2],[3,3],[5,4],[6,5],[8,6],[9,7],[10,8],[11,9],[12,10]]
 ],[
  ['#526a67','#617471','#4c6464','#677a72','#506865','#697a71','#4e6867','#5b726c','#496565','#64786e','#526e69','#6b7d73','#4e6967','#5e756f','#506b68','#667a70','#4d6765','#61776f','#506b69','#687b72','#4e6765','#5b726c','#4f6868'],
  ['#435e5f','#526a67','#3f5c5d','#5a706a','#456361','#576e67','#405d5e','#536b67','#436161','#5a716b','#466463','#546d67','#405e60','#566e68','#456261','#536b67','#425f60','#526a66'],
  ['#39575b','#466165','#3c595c','#4b6565','#3b5b5e','#496464','#3a585c','#496265','#3b585d','#456164','#3a585c','#466064'],
  ['#344f56','#3e595f','#35525a','#435c60','#36535b','#3f5960','#35515a','#415c60','#36525a','#3d565d']
 ],{
  '0:5':[[610,190],[520,320],[760,450]],'0:8':[[2980,160],[2860,320],[3120,370]],'0:11':[[5030,210],[4900,390],[5140,520]],'0:14':[[6980,180],[6850,270],[7050,360]],'0:16':[[8260,170],[8130,300],[8370,450]],'0:19':[[10340,210],[10230,340],[10590,530]],
  '1:4':[[-130,720],[-260,990],[170,1130]],'1:7':[[2400,1100],[2290,1220],[2500,1370]],'1:11':[[5390,1170],[5210,1330],[5480,1520]],'1:16':[[8570,890],[8410,1110],[8730,1290]],
  '2:5':[[1870,2210],[1750,2520],[2050,2800]],'2:11':[[6990,2250],[7140,2470],[6820,2930]],'3:6':[[5250,4470],[5090,4840],[5500,5380]],
  'bed1:5':[[940,680],[1120,500],[1260,550]],'bed1:9':[[3910,860],[4130,590],[4350,650]],'bed1:12':[[6050,720],[6160,540],[6370,600]],'bed1:16':[[8680,610],[8810,830],[9010,780]],
  'bed2:6':[[2920,1580],[3030,1770],[3310,1700]],'bed2:10':[[6510,1650],[6720,1880],[6890,1790]]
 },[['0:5',14],['0:11',19],['0:16',17],['1:7',20],['1:11',17],['2:11',23]],[[1,5,25,true],[1,9,32,false],[1,12,22,true],[2,6,35,false],[2,10,28,false]]);
 const roof=[
  [-6000,-4000,-2200,-700,550,1720,2850,3970,5050,6130,7250,8280,9340,10500,11700,13400,15200,17000].map(x=>[x,0]),
  [[-6000,820],[-3790,620],[-1990,980],[-460,540],[820,960],[1960,570],[3140,1120],[4250,680],[5340,1190],[6490,630],[7580,1050],[8620,590],[9750,1080],[10830,720],[12500,1000],[14600,660],[17000,930]],
  [[-6000,2310],[-3500,1850],[-1300,2540],[700,1780],[2320,2440],[3850,1880],[5580,2620],[7410,1820],[9210,2540],[11100,1920],[13900,2530],[17000,2040]],
  [[-6000,4700],[-2900,4050],[0,4860],[2670,3980],[5740,4760],[8760,4080],[12000,4870],[14800,4140],[17000,4680]]
 ];
 body('cave-roof',-1,roof,[
  [[0,0],[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,8],[9,9],[10,10],[11,11],[12,12],[13,13],[14,14],[16,15],[17,16]],
  [[0,0],[1,1],[2,2],[4,3],[5,4],[7,5],[8,6],[10,7],[12,8],[13,9],[15,10],[16,11]],
  [[0,0],[1,1],[3,2],[4,3],[6,4],[8,5],[9,6],[10,7],[11,8]]
 ],[
  ['#29434e','#354f57','#294550','#3b555c','#2d4952','#3c565b','#2e4954','#40595f','#2e4a54','#39545c','#2a4650','#3d565d','#2d4952','#3c555d','#2d4752','#354f58'],
  ['#243e4a','#304b55','#26414d','#344f58','#28434e','#36505a','#26414c','#334e57','#28434e','#324c56','#29434f'],
  ['#213c47','#2b4550','#233e49','#2e4953','#243f4a','#2d4852','#243e49','#2b4550']
 ],{'0:4':[[640,200],[490,390],[740,680]],'0:7':[[4090,250],[3940,420],[4210,510]],'0:10':[[7380,190],[7240,420],[7490,560]],'0:12':[[9460,210],[9300,460],[9590,740]],'1:5':[[2090,1070],[2240,1360],[2100,1720]],'1:10':[[7690,1480],[7510,1630],[7780,1760]],'bed1:6':[[3490,1070],[3690,880],[3910,910]],'bed1:9':[[6810,710],[7050,920],[7310,860]]},[['0:4',15],['0:7',19],['0:10',16],['1:5',22]],[[1,6,25,false],[1,9,28,true]]);
 space.terrainPlanes=[...planes,...space.terrainPlanes.filter(p=>!p.stage16VectorFinish&&!['act2-floor','cave-roof'].includes(p.terrainId))];
 // Recessed back-plane foundation: no top ledge, no collision, open center.
 let svg='';
 for(const [ps,color]of [
  [[[4880,5010],[5320,5100],[5400,5480],[5190,5810],[5050,6040],[4740,6040],[4860,5660],[4770,5360]],'#34494d'],
  [[[5320,5100],[5460,5110],[5420,5460],[5220,5800],[5050,6040],[5190,5810],[5400,5480]],'#2a4047'],
  [[[4880,5120],[5020,5200],[4940,5450],[5040,5640],[4860,5890],[4740,6040],[4860,5660],[4770,5360]],'#3b5153'],
  [[[6880,5030],[7190,5060],[7310,5340],[7200,5590],[7360,5900],[7010,6010],[6820,5680],[6940,5390]],'#34494e'],
  [[[7190,5060],[7280,5000],[7400,5330],[7300,5600],[7450,5890],[7360,5900],[7200,5590],[7310,5340]],'#293f47'],
  [[[6880,5030],[6960,5200],[7040,5380],[6910,5610],[7080,5800],[7010,6010],[6820,5680],[6940,5390]],'#3a5053'],
  [[[4880,5050],[5320,5120],[5310,5160],[4870,5100]],'#293f45'],
  [[[6880,5040],[7240,5080],[7250,5120],[6900,5080]],'#293f45']
 ])svg+=poly(ps,color);
 const bounds={x:4700,y:4990,w:2800,h:1100},asset={id:STAGE16_SUPPORT_ASSET,name:'잠운사 기단 뒤 낮은 대비의 지지 모암',category:'rock',environmentRole:'rock',visual:[],vector:compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="4700 4990 2800 1100">${svg}</svg>`),collision:[],anchor:{x:0,y:0},sockets:[],tags:['stage16-temple','visual-only','editable-native-vector','recessed-back-support'],params:{artRevision:1,collisionSource:'none-recessed-background'},bounds,reference:{heightM:1100/60,bounds,foot:{x:0,y:0},scaleRange:[.35,4],backgroundRange:[.35,4]}};
 const ai=project.library.findIndex(a=>a.id===STAGE16_SUPPORT_ASSET);if(ai<0)project.library.push(asset);else project.library[ai]=asset;
 st.elements=st.elements.filter(e=>e.id!=='s16-art-recessed-foundation');const ei=st.elements.findIndex(e=>e.id==='s16-art-great-hall');st.elements.splice(ei,0,{id:'s16-art-recessed-foundation',assetId:STAGE16_SUPPORT_ASSET,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back'});
 st.design.stage16VectorFinish={revision:1,source:'tools/environment/stage16-vector-finish.mjs',terrainIds:['act2-floor','cave-roof'],supportAssetId:STAGE16_SUPPORT_ASSET};return project;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file='shared/data/campaign.json',p=JSON.parse(readFileSync(file,'utf8'));applyStage16VectorFinish(p);writeFileSync(file,JSON.stringify(p)+'\n');console.log('Authored Stage16 natural bedrock and recessed visual foundation only.');}
