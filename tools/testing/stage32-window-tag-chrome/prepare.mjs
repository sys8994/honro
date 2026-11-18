import fs from'node:fs';import{pathToFileURL}from'node:url';import path from'node:path';import crypto from'node:crypto';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';
const[product,harness,out]=process.argv.slice(2),here=path.dirname(new URL(import.meta.url).pathname),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:product,encoding:'utf8'}).trim(),'af5b77e15accea03470fdfd0c6cb00a0bb12c5e9');
const sources={baseline:fs.readFileSync(path.join(product,'shared/runtime/stage32-foundation-art.js'),'utf8'),candidate:fs.readFileSync(path.join(harness,'tools/testing/stage32-j-window-active/candidate.js'),'utf8')};
assert.equal(sha(sources.baseline),'6823eda0e8d3c5250396c857f09f96ee3eba8fbfba124af540d080a5a76d03c7');assert.equal(sha(sources.candidate),'25da935de1e35b9b3aa168c553642e4af505e4de9f948913bcefce2f6c545e74');
const pins=JSON.parse(fs.readFileSync(path.join(here,'input-pins.json')));for(const[f,h]of Object.entries(pins))assert.equal(sha(fs.readFileSync(path.join(here,f))),h);
const INPUT={...JSON.parse(fs.readFileSync(path.join(here,'assets.json'))),sources};
assert.deepEqual(INPUT.field,JSON.parse(fs.readFileSync(path.join(product,'shared/data/act4/handoff-art/32-foundation.json'))));
const oldCwd=process.cwd();let runtime;
try{process.chdir(path.resolve(product));const{runtimeEntries}=await import(pathToFileURL(path.resolve('shared/build.mjs')));runtime=await runtimeEntries({vector:true,render:true,app:true,productionStory:true});}finally{process.chdir(oldCwd);}
const projectEntry=runtime.find(e=>e.project);assert(projectEntry,'Official project missing');const officialBody=projectEntry.project.library.find(a=>a.id===INPUT.body.id);assert(officialBody,'Official shared BODY missing');assert.deepEqual(INPUT.body,officialBody,'Diagnostic BODY must exactly equal pinned J official builder asset');

const rawPaths=[];function visit(n){if(n.tag==='path')rawPaths.push(n);for(const child of n.children||[])visit(child);}visit(INPUT.body.vector.root);assert.equal(rawPaths.length,25);assert.equal(INPUT.body.id,'act4-handoff:32:body-shared-material');
const script=s=>'<script>'+s.replace(/<\/script/gi,'<\\/script')+'</script>';const code=fs.readFileSync(path.join(here,'probe.js'),'utf8');
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'tags.html'),'<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\';script-src \'unsafe-inline\';connect-src \'none\'"><pre id="result">pending</pre>'+script('const INPUT='+JSON.stringify(INPUT)+';'+code+`;for(const m of ['getItem','setItem','removeItem','clear'])Storage.prototype[m]=()=>{throw Error('Storage forbidden')};try{document.querySelector('#result').textContent=btoa(JSON.stringify(run(INPUT)))}catch(e){document.querySelector('#result').textContent=btoa(JSON.stringify({ok:false,error:e.stack}))}`));
fs.writeFileSync(path.join(out,'capture-list.json'),JSON.stringify([{variant:'tags',view:'sequence',file:'tags.html'}]));
