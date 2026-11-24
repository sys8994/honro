const palette={veil:'#563e4b',fold:'#664e59',deep:'#4d3946',dust:'#715962',ledge:'#65565c',crack:'#392d39',lamina:'#76565c',ash:'#574b51',stone:'#5b4b53'};
export const stageId='a6-09-playable-draft-noncampaign';
const idFor={near:'finale-cutout-near-body',west:'finale-cutout-west-terrace'};
const group={
 east:[
  ['tilted-seep-shoulder','veil',[[5960,509,6],[6122,492,51],[6402,443,104],[6518,379,61],[6653,392,47],[6808,335,17],[7046,284,0]]],
  ['tilted-seep-lamina','fold',[[6120,513,1],[6264,493,20],[6410,456,30],[6528,436,21],[6650,410,8],[6731,399,0]]],
  ['fault-split-clotted','deep',[[6570,236,1],[6648,184,34],[6701,206,28],[6738,151,12],[6776,153,9],[6858,88,1]]],
  ['fracture-right-wedge','ash',[[6903,533,0],[7090,430,64],[7208,411,98],[7310,372,77],[7440,379,38],[7608,317,3]]],
  ['ash-thin-segment','ledge',[[7054,506,0],[7191,488,14],[7294,459,19],[7408,437,5],[7450,427,0]]],
  ['hard-mineral-left-patch','dust',[[6260,155,0],[6317,142,27],[6394,165,23],[6457,143,13],[6570,180,0]]],
  ['half-buried-suture','deep',[[6437,699,0],[6650,623,36],[6875,565,76],[7000,511,48],[7110,477,13],[7250,459,0]]],
  ['late-shale-seam','fold',[[6173,312,0],[6300,316,20],[6364,292,18],[6476,284,10],[6528,308,2]]],
 ],
 yard:[
  ['fatigue-stratum','deep',[[3060,220,0],[3220,211,40],[3408,233,83],[3515,288,53],[3690,302,19],[3870,278,0]]],
  ['fatigue-neck','dust',[[3190,249,0],[3326,254,11],[3447,271,19],[3550,323,14],[3730,317,0]]],
  ['retaining-root','ash',[[3630,153,0],[3756,122,62],[3898,130,96],[3981,178,78],[4098,213,57],[4207,219,0]]],
  ['retaining-root-offset','ledge',[[3754,148,0],[3876,166,26],[3990,210,19],[4070,225,8],[4136,257,0]]],
  ['understep-abrasion','fold',[[3645,394,0],[3840,456,43],[3998,396,91],[4168,439,40],[4392,346,14],[4570,313,0]]],
 ],
 west:[
  ['saddle-grey-shelf','ash',[[699,184,0],[830,177,31],[965,205,58],[1050,190,26],[1189,232,7],[1299,246,0]]],
  ['saddle-broken-flake','ledge',[[781,282,0],[851,270,11],[950,290,22],[1028,267,31],[1105,279,6],[1140,299,0]]],
  ['west-foliation','deep',[[971,485,0],[1079,451,44],[1152,378,55],[1242,389,49],[1335,322,13],[1425,287,0]]],
  ['accretion-residue','dust',[[1134,186,0],[1249,189,17],[1309,204,28],[1362,211,10],[1478,253,0]]],
 ]
};
function contains(ps,x,y){
 let inside=false;
 for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],b=ps[j];if(((a.y>y)!==(b.y>y))&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}
 return inside;
}
const poly=(id,fill,pts)=>({id,fill,points:pts.map(([x,y])=>({x,y}))});
const buried=[
 ['footing-buried-mass','crack',[[3786,75],[3826,65],[3908,75],[3990,77],[4068,119],[4051,178],[4029,227],[3920,248],[3845,183],[3798,142]]],
 ['footing-front-stone','stone',[[3830,95],[3884,91],[3935,97],[3956,136],[3930,177],[3860,162],[3822,130]]],
 ['footing-right-stone','ash',[[3959,102],[3995,105],[4048,131],[4041,177],[4005,191],[3955,169],[3973,140]]],
 ['footing-base-stone','veil',[[3856,182],[3929,196],[3968,179],[4004,217],[3946,227],[3919,233],[3880,215]]],
 ['footing-mortar-scar','dust',[[3841,129],[3862,137],[3914,136],[3929,150],[3906,154],[3848,145]]]
];
export function stage59ArtPatch(B,C){
 if(B?.honroAuthoredId!==stageId||B?.honroStage!=='act6-local-native-09'||B.mode!=='scripted')throw Error('exact stage 59 authored reader only');
 const collect=[];
 function path(id,fill,pts,host){
  const p=poly(id,palette[fill],pts), hull=host.vertices;
  for(let i=0;i<p.points.length;i++){
   const a=p.points[i],b=p.points[(i+1)%p.points.length];
   for(let j=0;j<=6;j++){const x=a.x+(b.x-a.x)*j/6,y=a.y+(b.y-a.y)*j/6;
    if(!contains(hull,x,y)||C.topAt(host,x)+35>y)throw Error('paint may escape support '+id+': '+JSON.stringify([x,y]));
   }
  }
  collect.push(p);
 }
 for(const [area,layers] of Object.entries(group)){
  const host=B.terrain.find(x=>x.id===idFor[area==='west'?'west':'near']);
  for(const [id,fill,sections] of layers){
   const func=(a,down)=>[a[0],C.topAt(host,a[0])+(area==='west'?35+a[1]*.15+(down?a[2]*.48:0):a[1]+(down?a[2]:0))];
   path(id,fill,[...sections.map(a=>func(a,false)),...sections.slice().reverse().map(a=>func(a,true))],host);
  }
 }
 const host=B.terrain.find(x=>x.id===idFor.near);
 for(const [id,fill,pts] of buried) path(id,fill,pts.map(([x,depth])=>[x,C.topAt(host,x)+depth]),host);
 return B.honroLandmarks.map(m=>{
  if(m.id==='painted-coupled-bedrock'){
   if(m.asset.collision.length!==0||m.collisionIds.length!==0)throw Error('paint-only ownership required');
   return {...m,asset:{...m.asset,visual:[...m.asset.visual,...collect]}};
  }
  if(m.id==='authored-contact-rim'){
   if(m.asset.collision.length!==0||m.collisionIds.length!==0)throw Error('paint-only ownership required');
   const old=m.asset.visual;if(old.length!==72)throw Error('pinned 59 contact geometry required');
   const paints={'#8b665f':'#695054','#926967':'#6d5057','#9a716c':'#70555b','#a1776c':'#74575c'};
   return {...m,asset:{...m.asset,visual:old.map(q=>{if(!paints[q.fill])throw Error('unverified rim fill');return {...q,fill:paints[q.fill]};})}};
  }
  return m;
 });
}
export function matteReadability(scene,B,G){
 const orig=scene.terrainReadability, stats={toned:0,other:0};
 scene.terrainReadability=function(c,b,...rest){
  if(this!==scene||b!==B||b.honroAuthoredId!==stageId)return orig.call(this,c,b,...rest);
  const colors=new Set([G.HonroTerrainReadability.STYLE.topLight,G.HonroTerrainReadability.STYLE.woodLight].map(x=>x.toLowerCase()));
  const before=c.stroke;
  c.stroke=function(...args){
   if(!colors.has(String(this.strokeStyle).toLowerCase())){stats.other++;return before.apply(this,args);}
   const [alpha,width]=[this.globalAlpha,this.lineWidth];
   try{stats.toned++;this.globalAlpha=alpha*.24;this.lineWidth=width*.75;return before.apply(this,args);}
   finally{this.globalAlpha=alpha;this.lineWidth=width;}
  };
  try{return orig.call(this,c,b,...rest);}finally{c.stroke=before;}
 };
 return stats;
}
