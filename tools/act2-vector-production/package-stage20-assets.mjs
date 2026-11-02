/** Package only hash-bound strictly passing native material candidates. */
import{readFileSync as read,writeFileSync as write,mkdirSync as mkdir,copyFileSync as copy}from'node:fs';import{createHash}from'node:crypto';import{gzipSync}from'node:zlib';import{stage20Digest}from'./apply-stage20-candidate.mjs';
const base=process.argv[2],preview=process.argv[3];if(!base||!preview)throw Error('Usage: package stage20-production final-native-preview');
const parts=['outer-v1','west-v2','east-v2'],report=JSON.parse(read(base+'/final-pack-report.json'));if(report.reductionPercent<30||!report.parts.every(r=>r.qualityPass))throw Error('Strict gates failed');
const dest='art/act2-near-vector-candidates/stage20-exit-v1',assets=[];mkdir(dest,{recursive:true});mkdir('shared/data/act2',{recursive:true});
for(const part of parts){const r=report.parts.find(x=>x.part===part);if(createHash('sha256').update(read(base+'/'+part+'/final.svg')).digest('hex')!==r.hashes['final.svg'])throw Error('Candidate drift');
 const asset=JSON.parse(read(preview+'/'+part+'-baked.json'));if(JSON.stringify(asset.vector.root.children[0].children.at(-1))!==JSON.stringify(JSON.parse(read(base+'/'+part+'/native.json')).vector.root))throw Error('Baked preview differs from measured final '+part);asset.params.previewOnly=false;const file='stage20-'+part+'.json';write('shared/data/act2/'+file,JSON.stringify(asset));assets.push({file,assetId:asset.id,sha256:stage20Digest(asset)});
 mkdir(dest+'/'+part,{recursive:true});for(const f of ['source.png','guide.png','submitted-prompt.json','placement.json','config.json','pixel-config.json','authored-raw.svg.gz','extraction.json','final.svg','final-report.json','native-comparison.json'])copy(base+'/'+part+'/'+f,dest+'/'+part+'/'+f);
 copy(base+'/'+part+'/trace/trace-report.json',dest+'/'+part+'/trace-report.json');write(dest+'/'+part+'/inkscape-raw.svg.gz',gzipSync(read(base+'/'+part+'/trace/raw.svg')));copy(base+'/'+part+'/palette/merged.svg',dest+'/'+part+'/palette.svg');
}
copy(base+'/final-pack-report.json',dest+'/final-pack-report.json');const source=JSON.parse(read(base+'/source/raw-stage.json'));write('tools/act2-vector-production/stage20-art-source.json',JSON.stringify({stage:20,rawStageSha256:stage20Digest(source),assets},null,2));
write(dest+'/README.md','# Stage20 cave exit near-terrain candidate\n\nStrict side-view, image-derived actual Inkscape trace. Original map9000×5800 and hero92 unchanged. Static rock only: no far scenery, people, dynamic convoy props or machinery. Source/provenance retained. Exact authored raw compressed losslessly; final optimized pack ≥30% smaller. Identical actual native canonicalSolid/contactInset composition at1×/2× tested. Native screenshots are visual previews, not browser/gameplay acceptance.\n\nEast source was refined and palette re-authored because threshold noise created spurious grain; original rejected source and trace remain archived. Continuous dark outer body retained exact, locals use bounded curve reduction and lossless path serialization. No threshold relaxed. Parent integrates build hook and owns actual browser/normal play acceptance.\n');
console.log(JSON.stringify({assets,dest},null,2));

copy(base+'/source-review.md',dest+'/source-review.md');
// Retain original source inputs and rejected traces without shipping them in runtime.
mkdir(dest+'/source',{recursive:true});for(const f of ['raw-stage.json','raw-hook-stage.json','effective-stage.json'])write(dest+'/source/'+f+'.gz',gzipSync(read(base+'/source/'+f)));
for(const part of parts){for(const f of ['revision.json','rejected-grain.svg']){try{copy(base+'/'+part+'/palette/'+f,dest+'/'+part+'/'+f);}catch(e){if(e.code!=='ENOENT')throw e;}}
 for(const rejected of ['trace-rejected-grain','trace-rejected-second','trace-before-mask-cleanup']){try{write(dest+'/'+part+'/'+rejected+'.svg.gz',gzipSync(read(base+'/'+part+'/'+rejected+'/raw.svg')));}catch(e){if(e.code!=='ENOENT')throw e;}}
}
mkdir(dest+'/east-v2/rejected-first',{recursive:true});for(const f of ['source.png','submitted-prompt.json'])copy(base+'/east-v2/rejected-first/'+f,dest+'/east-v2/rejected-first/'+f);
write(dest+'/east-v2/reference-provenance.json',JSON.stringify({submittedReferencePathAtGeneration:base+'/east-v2/source.png',immutableReferenceFile:'rejected-first/source.png',referenceSha256:createHash('sha256').update(read(base+'/east-v2/rejected-first/source.png')).digest('hex'),finalSourceSha256:createHash('sha256').update(read(base+'/east-v2/source.png')).digest('hex')},null,2));

for(const part of parts){const clean=[];for(let i=1;i<6;i++){try{clean.push(JSON.parse(read(base+'/'+part+'/trace/layer'+String(i).padStart(2,'0')+'/mask-cleanup.json')));}catch(e){if(e.code!=='ENOENT')throw e;}}write(dest+'/'+part+'/material-cleanup.json',JSON.stringify(clean,null,2));write(dest+'/'+part+'/authored-before-material-cleanup.svg.gz',gzipSync(read('_local/stage20-before-cleanup-input/'+part+'/authored-raw.svg')));}
copy(base+'/material-cleanup-report.json',dest+'/material-cleanup-report.json');
for(const part of parts)copy(base+'/'+part+'/trace-provenance.json',dest+'/'+part+'/trace-provenance.json');
