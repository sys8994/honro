async ({draftDigest,reopenedDigest,sha,run})=>{
 const p=HonroWorkshopAPI.getProject(),a=p.library.find(a=>a.id==='act5:near:42'),cap=a.edgeWall.params.authoredEastCapV1;
 const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
 const hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x),id=x=>typeof x==='string'&&/^[a-z][a-z0-9_-]{0,31}$/.test(x),keys=(o,ks)=>o&&Object.keys(o).length===ks.length&&ks.every(k=>Object.hasOwn(o,k));
 const sha256=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x)))).map(n=>n.toString(16).padStart(2,'0')).join('');
 const pinKeys=['projectSha256','stageSha256','ownerSha256','bodySourceSha256','clipsSha256'];
 const target={stageId:'stage-42',assetId:'act5:near:42',placementId:'a5-near',slot:'edgeWall',bodyId:'act5:stage42:registered-body',scale:3.2146389713155292};
 const point=q=>Array.isArray(q)&&q.length===2&&q.every(Number.isFinite)&&q[0]>=2298.5&&q[0]<=2324.2701&&q[1]>=685&&q[1]<=825;
 if(!hex(draftDigest)||!hex(reopenedDigest)||!/^[a-f0-9]{40}$/.test(sha)||!/^\d+$/.test(run)||await sha256(JSON.stringify(p))!==reopenedDigest)throw Error('Unverified reopened project');
 if(!keys(cap,['schema','version','target','pins','design'])||cap.schema!=='honro.stage42.east-cap'||cap.version!==1||canonical(cap.target)!==canonical(target)||!keys(cap.pins,pinKeys)||!pinKeys.every(k=>hex(cap.pins[k]))||await sha256(canonical(cap))!==draftDigest)throw Error('Observed record lacks verified manual draft provenance');
 const d=cap.design;
 if(!keys(d,['outline','seams','bands'])||!Array.isArray(d.outline)||d.outline.length<5||d.outline.length>24||!d.outline.every(v=>keys(v,['id','at'])&&id(v.id)&&point(v.at))||!Array.isArray(d.seams)||d.seams.length!==2||!d.seams.every(v=>keys(v,['outerId','atY','knots'])&&d.outline.some(o=>o.id===v.outerId)&&Number.isFinite(v.atY)&&v.atY>=685&&v.atY<=825&&Array.isArray(v.knots)&&v.knots.length<=6&&v.knots.every(point))||!Array.isArray(d.bands)||d.bands.length!==3||!d.bands.every((v,i)=>keys(v,['id','material'])&&v.id==='east-'+['upper','transition','basal'][i]&&v.material===['upper','transition','basal'][i]))throw Error('Non-native observed design');
 const text=canonical({schema:'honro.stage42.observed-east-cap',version:1,target,sourcePins:cap.pins,outline:d.outline,seams:d.seams,materials:d.bands.map(v=>v.material),provenance:{commit:sha,run,reopenedDigest,draftDigest}});
 if(new TextEncoder().encode(text).length>4096)throw Error('Oversized handoff');
 return {text,sha256:await sha256(text)};
}
