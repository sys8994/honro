import vm from'node:vm';import ts from'../../game/node_modules/typescript/lib/typescript.js';import{readFile}from'node:fs/promises';
const compile=code=>ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,strict:true},fileName:'math.ts'}).outputText;
const baseline=await readFile('shared/engine/src/math.ts','utf8'),source=process.env.CANDIDATE_MATH?await readFile('_local/collision-index/math-candidate.ts','utf8'):baseline;
const counters=`
export function beginCollisionCounters(){
 const counts:any={};
 for(const [name,original] of [['segmentTerrain',segmentTerrain],['segmentPlatformSurface',segmentPlatformSurface]] as const){
 const fn=(a:Vec,b:Vec,t:Terrain,pad=0,skipEdges?:number[])=>{const vertices=t.vertices?.length||4,length=Math.hypot(b.x-a.x,b.y-a.y),bucket=length<1?'under1':length<5?'under5':length<20?'under20':'20plus',key=name+':'+vertices+':'+bucket;counts[key]=(counts[key]||0)+1;return original(a,b,t,pad,skipEdges);};
 if(name==='segmentTerrain')segmentTerrain=fn;else segmentPlatformSurface=fn;
 (exports as any)[name]=fn;
 }
 return counts;
}
`;
const original=compile(baseline),replacement=compile(source+counters),run=vm.runInContext;let replacements=0;
vm.runInContext=function(code,...args){if(code.includes(original)){code=code.replace(original,replacement);replacements++;}return run.call(this,code,...args);};process.on('exit',()=>{console.error('isolated diagnostic math replacements:',replacements);if(!replacements)process.exitCode=1;});
