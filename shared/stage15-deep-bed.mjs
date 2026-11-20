// Stage 15 only. The compact traced plate's dark backing currently masks the
// native lower rock until an artificial full-width cut at y6400. Reassign the
// non-walkable backing to the exact existing deep-bed contact. Preserve both
// non-dark trace groups in full including their existing clip/warps.
const outerId='act2-compact:stage15-act2-stage15-traced-outer-v1-1';
const sourceKey='compact15-source-world';
const bedKey='native-deep-bed-contact';

export function applyStage15DeepBed(pack){
 const asset=pack.assets.find(a=>a.id===outerId),v=asset?.vector;
 if(pack.stage?.metadata?.stageId!==15 || !v || asset.collision?.length || asset.params?.compactSourceAssetId!=='act2-traced:stage15-outer-v1' || v.root.children.length!==11 || v.root.clipPath || v.clips[bedKey]) throw Error('Unexpected Stage15 exterior owner');
 const faces=pack.stage.design.space.terrainPlanes.filter(p=>p.terrainId==='act2-floor'&&p.id?.startsWith('v15-finish-act2-floor-face-3-'));
 if(faces.length!==12 || !faces.every((f,i)=>f.id.endsWith('-'+(i+1))))throw Error('Unexpected Stage15 native deep bed owners');
 const bed=faces.flatMap((f,i)=>{
  if(i===faces.length-1)return f.points.slice(0,2);
  const next=faces[i+1].points[0],k=f.points.findIndex(([x,y])=>x===next[0]&&y===next[1]);
  if(k<1)throw Error('Discontinuous Stage15 native deep bed');
  return f.points.slice(0,k);
 });
 if(bed.length!==23||bed[0][0]!==-5000||bed.at(-1)[0]!==10800||bed.some(([x,y],i)=>i&&x<=bed[i-1][0]||y<4588||y>6318))throw Error('Unexpected Stage15 native bed boundary');
 const check=(symbol)=>{const base=symbol?.children?.[0]?.children?.[0],colors=base?.children?.[1]?.children?.[0];
  if(base?.clipPath!=='contactInset'||base.children[0]?.fill!=='#283b46'||colors?.children?.length!==3||colors.children.map(g=>g.children[0]?.fill).join(',')!=='#283b46,#38505b,#4d6570')throw Error('Unexpected Stage15 traced paint hierarchy');
  return{base,colors};
 };
 const source=v.symbols[sourceKey],{base,colors}=check(source);
 const traced=base.children[1],tx=traced.transform;
 if(source.transform.join(',')!=='1,0,0,1,0,0'||!Array.isArray(tx)||tx.length!==6||tx[1]||tx[2]||tx[0]<=0||tx[3]<=0)throw Error('Unexpected Stage15 source coordinate transform');
 const shared='native-deep-bed-original-';
 v.symbols[shared+'backing']=base.children[0];
 for(let i=0;i<3;i++)v.symbols[shared+'traced-'+i]=colors.children[i].children[0];
 const draw=(symbol,clipPath)=>clipPath?{tag:'use',symbol,clipPath}:{tag:'use',symbol};
 const mask=[[-5010,-24000],[10810,-24000],[10810,5080],...bed.slice().reverse(),[-5010,5123.33]];
 const path=points=>points.map((p,i)=>(i?'L':'M')+p.join(',')).join('')+'Z';
 // Preserve the original strip traversal and all original intermediate
 // transforms/clips. Each dark draw alone gets the bed in its local space.
 for(const [i,strip]of v.root.children.entries()){
  const originalUse=strip.children[0],m=strip.transform;
  if(strip.children.length!==1||originalUse.tag!=='use'||originalUse.symbol!==sourceKey||!Array.isArray(m)||m.length!==6||m[1]||m[2]||m[0]<=0||m[3]<=0)throw Error('Unexpected Stage15 strip object');
  const world=mask.map(([x,y])=>[(x-m[4])/m[0],(y-m[5])/m[3]]);
  const raw=world.map(([x,y])=>[(x-tx[4])/tx[0],(y-tx[5])/tx[3]]);
  const worldKey=bedKey+'-world-'+i,rawKey=bedKey+'-raw-'+i, key=sourceKey+'-native-'+i;
  v.clips[worldKey]=[path(world)];v.clips[rawKey]=[path(raw)];
  const s=structuredClone(source),parts=check(s);
  parts.base.children[0]=draw(shared+'backing',worldKey);
  parts.colors.children.forEach((g,j)=>{if(Object.keys(g).sort().join(',')!=='children,tag'||g.children.length!==1||g.children[0].tag!=='path')throw Error('Unexpected trace group');g.children[0]=draw(shared+'traced-'+j,j===0?rawKey:undefined);});
  v.symbols[key]=s;
  originalUse.symbol=key;
 }
 delete v.symbols[sourceKey];
}
