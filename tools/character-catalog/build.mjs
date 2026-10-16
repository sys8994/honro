import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {runtimeParts,root} from '../../shared/build.mjs';
import {inventory} from './inventory.mjs';
const read=p=>readFile(new URL(p,import.meta.url),'utf8');
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const sourceDirty=execFileSync('git',['status','--porcelain','--','shared','game/src','game/config','game/templates','game/vendor','workshop/build.mjs'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
const uiOnly=process.argv.includes('--ui-only');
const runtime=uiOnly?await readFile(root+'/_local/reports/character-catalog/runtime.js','utf8'):(await runtimeParts({app:false})).join('\n');
// No App, audio host, iframe, storage or simulation loop is constructed.
const g=vm.createContext({console,performance,structuredClone,Path2D:class {constructor(){return new Proxy(this,{get:(t,k)=>k in t?t[k]:()=>{}});}}});
vm.runInContext(runtime,g);
console.log('Collecting fresh campaign, hidden/convoy cast and conditional factories…');
const data=uiOnly?JSON.parse(await readFile(root+'/_local/reports/character-catalog/base-inventory.json','utf8')):inventory(g),reviews=JSON.parse(await read('reviews.json')),references=JSON.parse(await read('references.json'));
await mkdir(root+'/_local/reports/character-catalog',{recursive:true});
if(!uiOnly){await writeFile(root+'/_local/reports/character-catalog/runtime.js',runtime);await writeFile(root+'/_local/reports/character-catalog/base-inventory.json',JSON.stringify(data));}
const sourceCache=new Map();
for(const row of data.rows){row.review=reviews[row.id]||{verdict:'검수 대기',note:'실제 픽셀 검수 전'};for(const route of row.routes){if(!sourceCache.has(route.file))sourceCache.set(route.file,(await readFile(root+'/'+route.file,'utf8')).split('\n'));route.line=sourceCache.get(route.file).findIndex(s=>s.includes(route.token))+1;if(!route.line)throw Error('Missing evidence: '+route.file+' '+route.token);}}
Object.assign(data,{sourceCommit,sourceDirty,sourceSha256:createHash('sha256').update(runtime).digest('hex'),references,reviewDate:'2026-10-16'});
await mkdir(root+'/_local/reports/character-catalog',{recursive:true});
await writeFile(root+'/_local/reports/character-catalog/inventory.json',JSON.stringify(data,null,2)+'\n');
const escape=s=>s.replace(/<\/script/gi,'<\\/script');
const html=(await read('template.html')).replace('/* CATALOG_STYLE */',await read('catalog.css')).replace('/* CATALOG_RUNTIME */',escape(runtime)).replace('/* CATALOG_DATA */','globalThis.HONRO_CATALOG='+escape(JSON.stringify(data))+';').replace('/* CATALOG_ADAPTER */',await read('adapter.js')).replace('/* CATALOG_APP */',await read('app.js'));
await writeFile(root+'/tools/character-catalog.html',html);
console.log(JSON.stringify({output:'tools/character-catalog.html',bytes:Buffer.byteLength(html),...data.counts,rows:data.rows.length,usage:data.rows.reduce((n,r)=>n+r.usage.length,0),sourceCommit,sourceSha256:data.sourceSha256}));
