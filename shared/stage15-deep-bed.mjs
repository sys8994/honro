// Stage 15 only. The compact traced plate's dark backing currently masks the
// native lower rock until an artificial full-width cut at y6400. Reassign the
// non-walkable backing to the exact existing deep-bed contact. Preserve both
// non-dark trace groups in full including their existing clip/warps.
const outerId='act2-compact:stage15-act2-stage15-traced-outer-v1-1';
const sourceKey='compact15-source-world';
const bedKey='native-deep-bed-contact';
const highlightKey='compact15-source-world-nonbase';
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
 const source=v.symbols[sourceKey],details=structuredClone(source),{base,colors}=check(source),h=check(details);
 h.base.children.shift();
 h.colors.children.shift();
 colors.children.splice(1);
 v.symbols[highlightKey]=details;
 // Keep all 11 original strip placements and canonical/contact clipping.
 const before=v.root.children;
 const after=before.map(g=>{if(g.children.length!==1||g.children[0].tag!=='use'||g.children[0].symbol!==sourceKey) throw Error('Unexpected Stage15 strip object'); const copy=structuredClone(g);copy.children[0].symbol=highlightKey;return copy;});
 v.clips[bedKey]=[`M-5010 -24000H10810V5080L${bed.slice().reverse().map(p=>p.join(',')).join('L')}L-5010,5123.33Z`];
 const backing={tag:'g',clipPath:bedKey,children:before};
 v.root={...v.root,children:[backing,...after]};
}
