async ({enabled,lane,source,pin,painterSHA})=>{
 if(enabled!==true||!['A0','B'].includes(lane)||pin.experimentalOnly!==true||pin.asset!=='approved40:body')throw Error('diagnostic disabled');
 const a=HonroApp,s=a.scene,b=a.engine.b,api=HonroVectorArt;
 if(b.honroStage!==40||b.mode!=='campaign'||!b.honroCanonical||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||s.battle!==b)throw Error('wrong native campaign scene');
 const hash=async text=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(await hash(source)!==painterSHA)throw Error('wrong stock painter source');
 const own=HonroTerrainDomain.materialLandmarks(b).filter(e=>e.asset?.id===pin.asset&&e.layer==='mid'&&!e.x&&!e.y&&e.scale===1&&!e.rotation);
 if(own.length!==1||own[0].asset.params?.silhouetteUnderpaint!==false||await hash(JSON.stringify(own[0].asset.vector))!==pin.hash)throw Error('wrong signed Stage40 renderer identity');
 const asset=own[0].asset;
 for(const [name,def] of Object.entries(pin.candidates))if(!def.alwaysPreserve&&await hash(asset.vector.clips[name].join(' '))!==def.clipSourceSHA)throw Error('missing closed clip authority '+name);
 let tileDepth=0;
 const stats={nearestCandidates:0,skipped:0,bodyDraws:0,direct:0};
 function gate(c,node){
  const clip=pin.candidates[node.clipPath];if(tileDepth!==1||!clip||clip.alwaysPreserve||node.snapRect||!node.clip)return false;
  const [x,y,x1,y1]=clip.nativeSourceAABB,m=c.getTransform();
  if(m.b!==0||m.c!==0||!m.a||!m.d||![m.a,m.d,m.e,m.f].every(Number.isFinite))return false;
  const u=x*m.a+m.e,v=x1*m.a+m.e,w=y*m.d+m.f,z=y1*m.d+m.f;
  const empty=Math.max(u,v)<-2||Math.min(u,v)>c.canvas.width+2||Math.max(w,z)<-2||Math.min(w,z)>c.canvas.height+2;
  if(empty){stats.nearestCandidates++;if(lane==='B'){stats.skipped++;return true;}}
  return false;
 }
 const marker='const walk=(node,inherited={fill:',needle='if(node.transform)c.transform(...node.transform);applyClip(c,node);';
 const i=source.indexOf(marker),j=source.indexOf(needle,i);
 if(i<0||j<i)throw Error('unexpected approved painter block');
 const changed=source.slice(0,j)+needle.replace('applyClip(c,node);','if(empty(c,node)){c.restore();return;}applyClip(c,node);')+source.slice(j+needle.length);
 const exact=new Function('globalThis','empty',changed+';return globalThis.HonroVectorArt;')({HonroVisualStyle},gate);
 api.prepare(asset.vector);exact.prepare(asset.vector);
 const orig=api.draw,old=s._drawTerrainDomainTiles,originalTile=Object.getOwnPropertyDescriptor(s,'_drawTerrainDomainTiles');
 s._drawTerrainDomainTiles=function(...args){if(this!==s||args[1]!==b)throw Error('diagnostic scene changed');tileDepth++;try{return old.apply(this,args);}finally{tileDepth--;}};
 api.draw=function(c,v,inst){
  if(v!==asset)return orig.call(this,c,v,inst);
  if(tileDepth!==1||c.canvas===s.canvas||c.canvas.width!==516||c.canvas.height!==516){stats.direct++;return orig.call(this,c,v,inst);}
  if(inst.x||inst.y||inst.rotation||inst.scale!==1||inst.honroTerrainMaterialClip)throw Error('protected draw scope mismatch');
  stats.bodyDraws++;return exact.draw(c,v,inst);
 };
 window.__honroStage40ClipReadonly={
  read:()=>({...stats}),
  restore(){api.draw=orig;if(originalTile)Object.defineProperty(s,'_drawTerrainDomainTiles',originalTile);else delete s._drawTerrainDomainTiles;delete window.__honroStage40ClipReadonly;}
 };
 return true;
}
