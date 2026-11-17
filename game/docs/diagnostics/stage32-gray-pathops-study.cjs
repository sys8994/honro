const fs=require('node:fs'),crypto=require('node:crypto');
const{Path2D}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const e=JSON.parse(fs.readFileSync('stage32-gray-diagnostic/review/source-evidence.json')),a=e.body,nodes=[];function walk(n){if(n.tag==='path')nodes.push(n);for(const c of n.children||[])walk(c);}walk(a.vector.root);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');const out=[];
for(const [key,ids] of Object.entries(a.params.stage32SharedMaterial.graySubpaths)){
 const i=+key,d=nodes[i].d,parts=d.match(/[Mm][^Mm]*/g),gray=ids.map(j=>parts[j]).join('');if(/[m]/.test(d))throw Error('Unexpected relative-m source');
 const start=performance.now(),full=new Path2D(d),selected=new Path2D(gray),intersection=new Path2D(full).op(selected,1),s=intersection.toSVGString(),leak=new Path2D(intersection).op(full,0).toSVGString();
 out.push({index:i,sourceSHA:sha(d),graySHA:sha(gray),selectedBytes:gray.length,intersectionBytes:s.length,sourceCommands:(gray.match(/[a-z]/ig)||[]).length,intersectionCommands:(s.match(/[a-z]/ig)||[]).length,sourceBounds:selected.computeTightBounds(),intersectionBounds:intersection.computeTightBounds(),differenceSVG:leak,ms:performance.now()-start,d:s});
}
fs.writeFileSync('stage32-gray-diagnostic/boolean-study.json',JSON.stringify({scope:'Native build-time PathOps INTERSECT study only; no production integration, no actual Chrome validation. Original source vectors unchanged. Float curve rewriting may alter AA; not an original geometry equality claim.',vectorSHA:sha(JSON.stringify(a.vector)),results:out},null,2));
console.log(JSON.stringify(out.map(({d,...r})=>r),null,2));
