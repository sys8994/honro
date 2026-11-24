import assert from 'node:assert/strict';
const facies=[
 ['body-dawn-furrow','#405261',[[6598,1430],[6718,1333],[6885,1250],[7059,1175],[7140,1096],[7138,1137],[7057,1234],[6905,1303],[6775,1403],[6665,1469]]],
 ['body-dawn-rake','#4e5d66',[[6580,1494],[6680,1453],[6796,1364],[6925,1320],[7007,1266],[7017,1280],[6918,1370],[6838,1393],[6707,1487],[6635,1518]]],
 ['slate-fold-warm','#656668',[[7015,1264],[7069,1228],[7134,1164],[7142,1126],[7197,1079],[7177,1139],[7126,1208],[7086,1245]]],
 ['slate-cut-shade','#36485a',[[6715,1603],[6788,1529],[6905,1484],[7031,1424],[7127,1321],[7147,1280],[7133,1370],[7047,1464],[6921,1521],[6841,1574]]],
 ['outer-lower-furrow','#465869',[[6582,1847],[6696,1832],[6804,1774],[6935,1675],[7027,1647],[7101,1537],[7145,1510],[7116,1599],[7045,1684],[6962,1723],[6837,1814],[6728,1869]]]
];
function baseRow(owner,id,fill,points){const template=owner.asset.visual[0].points[0];return {id,fill,points:points.map(([x,y])=>Array.isArray(template)?[x,y]:{x,y})};}
const rows=[
 [[6738,23],[6792,19],[6842,21],[6873,18],[6880,34],[6850,52],[6819,56],[6777,72],[6747,64]],
 [[6774,83],[6811,70],[6854,74],[6889,63],[6895,81],[6877,101],[6824,120],[6785,112]],
 [[6713,70],[6744,59],[6760,73],[6751,98],[6717,109],[6692,102]],
 [[6961,15],[7006,17],[7049,22],[7078,26],[7076,57],[7061,69],[7019,66],[6980,52],[6946,44]],
 [[6973,65],[7017,79],[7048,75],[7054,101],[7037,118],[7001,126],[6958,116],[6938,94]],
 [[7088,36],[7110,30],[7150,30],[7158,51],[7129,68],[7092,68]]
];
export function applyGateFace(b,topAt){
 const back=b.honroLandmarks.find(x=>x.id==='rear-only-nonsolid'),near=b.honroLandmarks.find(x=>x.id==='painted-coupled-bedrock'),ground=b.terrain.find(x=>x.id==='return-cutout-near-body');
 assert(back&&near&&ground&&[back,near].every(x=>x.collisionIds.length===0));
 const ts=[...(back.asset.visual.find(v=>v.id==='rear-eroded-bowl-0').points)].map(v=>Array.isArray(v)?v:[v.x,v.y]);
 const inside=([x,y])=>ts.reduce((n,a,i)=>{const z=ts[(i+1)%ts.length];return n+(Number((y>a[1])!==(y>z[1])&&x<(z[0]-a[0])*(y-a[1])/(z[1]-a[1])+a[0]));},0)%2===1;
 assert(facies.flatMap(row=>row[2]).every(inside),'nonphysical rear facet must stay in established rear mass');
 for(const [i,row] of rows.entries()){
  const p=row.map(([x,depth])=>[x,topAt(ground,x)+depth]);
  for(let k=0;k<p.length;k++)for(let n=0;n<=10;n++){const t=n/10,a=p[k],z=p[(k+1)%p.length],x=a[0]*(1-t)+z[0]*t,y=a[1]*(1-t)+z[1]*t;assert(y-topAt(ground,x)>=12);}
  const tone=['#536275','#4b596c','#4d5b6c','#586477','#4f5b6b','#526071'][i];
  near.asset.visual.push(baseRow(near,'gate10-footing-strata-'+i,tone,p));
 }
 for(const [id,tone,p] of facies)back.asset.visual.push(baseRow(back,id,tone,p));
 return {rearPatches:facies.length,foundationStones:rows.length,vertices:facies.reduce((n,r)=>n+r[2].length,0)+rows.reduce((n,r)=>n+r.length,0)};
}
