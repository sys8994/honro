// Run with the actually published commit before building the next release.
// This records immutable client dependencies; it never changes active runtime links.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const commit=process.argv[2];if(!/^[a-f0-9]{7,40}$/.test(commit||''))throw Error('Pass the published Git commit SHA');
const source=JSON.parse(execFileSync('git',['show',commit+':web/manifest.json'],{encoding:'utf8',maxBuffer:8*1024*1024}));
const current=JSON.parse(await readFile('web/manifest.json','utf8'));
const signature=files=>files.map(f=>f.path).sort().join('\n');
const keep=[{commit,files:source.files},...(current.publishedGenerations||[])].filter((g,i,all)=>all.findIndex(q=>signature(q.files)===signature(g.files))===i).slice(0,2);
let restored=0;
for(const generation of keep)for(const file of generation.files){
 if(!/^web\/(runtime|entries|data|styles|graphics)\/[\w.-]+$/.test(file.path))throw Error('Unsafe retained asset path');
 let bytes,missing=false;try{bytes=await readFile(file.path);}catch(e){if(e.code!=='ENOENT')throw e;bytes=execFileSync('git',['show',generation.commit+':'+file.path],{maxBuffer:40*1024*1024});missing=true;}
 if(createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw Error('Immutable asset hash mismatch: '+file.path);
 if(missing){await mkdir(file.path.slice(0,file.path.lastIndexOf('/')),{recursive:true});await writeFile(file.path,bytes);restored++;}
}
current.publishedGenerations=keep;await writeFile('web/manifest.json',JSON.stringify(current,null,2)+'\n');
console.log(JSON.stringify({publishedGraphs:keep.map(g=>g.commit),restored}));
