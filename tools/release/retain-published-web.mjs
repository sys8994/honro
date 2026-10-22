// Register attested successful publications, never intermediate build outputs.
// All source blobs/local files are checked before any restore or manifest write.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {graphSha256,validateAsset,publicationTime,selectPublishedGenerations,intermediateGenerations,planWebAssetRetention,publishedRetention} from '../../shared/web-retention.mjs';
const args=process.argv.slice(2),value=flag=>{const i=args.indexOf(flag);return i<0?undefined:args[i+1];};
const history=value('--history'),sourceSha=args[0];
let facts;
if(history)facts=JSON.parse(await readFile(history,'utf8'));
else{
  const day=value('--published-day'),instant=value('--published-at');
  if(!sourceSha||(!day&&!instant)||!value('--evidence'))throw Error('Use --history <chronological JSON> or <published SHA> --published-at <ISO timestamp> (or --published-day YYYY-MM-DD) --evidence <success reference>');
  facts=[{sourceSha,publishedAt:day||instant,publishedAtPrecision:day?'day':'instant',publicationOrder:Number(value('--publication-order')||0),evidence:value('--evidence')}];
}
if(!Array.isArray(facts)||!facts.length)throw Error('Publication history is empty');
const current=JSON.parse(await readFile('web/manifest.json','utf8')),sources=new Map();
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const incoming=facts.map(fact=>{
  if(!/^[a-f0-9]{7,40}$/.test(fact.sourceSha||''))throw Error('Published source Git SHA required');
  const sha=execFileSync('git',['rev-parse','--verify',fact.sourceSha+'^{commit}'],{encoding:'utf8'}).trim();
  const source=JSON.parse(execFileSync('git',['show',sha+':web/manifest.json'],{encoding:'utf8',maxBuffer:16*1024*1024}));
  const g={sourceSha:sha,publishedAt:fact.publishedAt,publishedAtPrecision:fact.publishedAtPrecision,publicationOrder:fact.publicationOrder||0,evidence:fact.evidence,graphSha256:graphSha256(source.files),files:source.files};
  publicationTime(g);sources.set(sha,source);return g;
});
const prior=(current.publishedGenerations||[]).filter(g=>{
  if(g.publishedAt)return true;
  // Legacy undated records may migrate only when explicitly covered by attestation.
  if(!incoming.some(n=>n.graphSha256===graphSha256(g.files)))throw Error('Legacy publication lacks timestamp/evidence: '+(g.sourceSha||g.commit));
  return false;
});
const now=Date.now(),keep=selectPublishedGenerations([...incoming.reverse(),...prior],{now});
// Recover the two distinct intermediate snapshots recorded by actual published
// manifests as well. Published graphs do not consume these separate build slots.
const candidates=[...(current.previousGenerations||[]),...[...sources.values()].reverse().flatMap(m=>m.previousGenerations||[])];
const previousGenerations=intermediateGenerations(candidates,current.files,[...incoming,...prior]);
const originals=new Map();
for(const file of current.files){validateAsset(file);const bytes=await readFile(file.path);if(bytes.length!==file.bytes||digest(bytes)!==file.sha256)throw Error('Active immutable asset mismatch: '+file.path);}
for(const g of keep)for(const file of g.files){const prior=originals.get(file.path);if(prior&&prior.file.sha256!==file.sha256)throw Error('Published immutable path collision: '+file.path);originals.set(file.path,{file,sourceSha:g.sourceSha});}
for(const files of previousGenerations)for(const file of files){
  if(originals.has(file.path))continue;
  const source=[...sources].reverse().find(([,m])=>[...m.files,...(m.previousFiles||[])].some(f=>f.path===file.path&&f.sha256===file.sha256));
  if(source)originals.set(file.path,{file,sourceSha:source[0]});
  else{
    // Existing intermediate files can stay without pretending they were published.
    const bytes=await readFile(file.path);if(digest(bytes)!==file.sha256||bytes.length!==file.bytes)throw Error('Intermediate immutable asset mismatch: '+file.path);
  }
}
const groups=new Map();for(const row of originals.values()){if(!groups.has(row.sourceSha))groups.set(row.sourceSha,[]);groups.get(row.sourceSha).push(row.file);}
const restores=[];
for(const [sha,files] of groups){
  const batch=execFileSync('git',['cat-file','--batch'],{input:files.map(f=>sha+':'+f.path).join('\n')+'\n',maxBuffer:256*1024*1024});let offset=0;
  for(const file of files){
    const end=batch.indexOf(10,offset),header=batch.subarray(offset,end).toString();
    if(!/^[a-f0-9]{40} blob \d+$/.test(header))throw Error('Published source blob unavailable: '+sha+':'+file.path);
    const length=Number(header.split(' ')[2]),bytes=batch.subarray(end+1,end+1+length);offset=end+1+length+1;
    if(bytes.length!==file.bytes||digest(bytes)!==file.sha256)throw Error('Published source hash mismatch: '+file.path);
    try{const local=await readFile(file.path);if(local.length!==file.bytes||digest(local)!==file.sha256)throw Error('Local immutable asset mismatch; refusing overwrite: '+file.path);}
    catch(error){if(error.code!=='ENOENT')throw error;restores.push({path:file.path,bytes:Buffer.from(bytes)});}
  }
}
const next={...current,publishedRetention,publishedGenerations:keep,previousGenerations};
const plan=planWebAssetRetention(next,current.files,{now});// Leave cleanup candidates tracked until the next normal build prunes them.
next.previousFiles=[...new Map([...(current.previousFiles||[]),...plan.previousFiles].map(f=>[f.path,f])).values()];
for(const item of restores){await mkdir(item.path.slice(0,item.path.lastIndexOf('/')),{recursive:true});await writeFile(item.path,item.bytes);}
await writeFile('web/manifest.json',JSON.stringify(next,null,2)+'\n');
console.log(JSON.stringify({publishedGraphs:keep.map(g=>({sourceSha:g.sourceSha,publishedAt:g.publishedAt,graphSha256:g.graphSha256})),restored:restores.map(r=>r.path),restoredBytes:restores.reduce((n,r)=>n+r.bytes.length,0)}));
