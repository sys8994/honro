/** Read-only replay of the official Stage22 regeneration schema boundary.
 * No replacement author/validator/normalizer; observe the exact thrown Error.
 * The caller supplies canonical bytes over stdin to use the same raw-file parse.
 */
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';

const sameFinalizeStack = stack => {
 const frames=String(stack).split(/\r?\n/).filter(x=>/^\s+at\s/.test(x));
 return /^\s+at (Object\.)?finalize \(evalmachine\.<anonymous>:\d+:\d+\)\s*$/.test(frames[0]||'') &&
        /^\s+at (?:Module\.)?authorStage22Vertical \(/.test(frames[1]||'') &&
        /\/tools\/map-forge\/apply-stage22-vertical\.mjs:/.test(frames[1]||'');
};
const hash=b=>createHash('sha256').update(b).digest('hex');
async function run(){
 const root=resolve(process.argv[2]||'.');
 process.chdir(root);
 const href=(p)=>pathToFileURL(resolve(root,p)).href;
 const {runtime}=await import(href('game/tests/helpers.mjs'));
 const {authorStage22Vertical}=await import(href('tools/map-forge/apply-stage22-vertical.mjs'));
 // Identical to tests/stage22-vertical-regeneration.mjs, which defaults
 // productionStory:false through the same helper.
 const g=await runtime({legacyMaps:false});
 const bytes=await readFile('/dev/stdin');
 const raw=JSON.parse(bytes);
 let result;
 try {
  await authorStage22Vertical(structuredClone(raw),g);
  result={kind:'finalized-and-returned',errors:[]};
 } catch(e){
  if(sameFinalizeStack(e?.stack)&&typeof e.message==='string'&&e.message.length) {
   // The pinned finalize() uses errors.map(x=>x.text).join('\n'). The
   // aggregate is preserved on Error.message; unlike first-line grep.
   result={kind:'strict-finalize-rejected',errors:e.message.split('\n')};
  } else {
   // Do not expose stack, Node assert values, raw data, or unrelated output.
   // A later author invariant failure is explicitly not a schema pass.
   result={kind:'non-schema-rejected',errors:null,errorName:String(e?.name||'Error'),errorDigest:hash(String(e?.message??''))};
  }
 }
 console.log('QA_CANONICAL_INVENTORY_PRIVATE:'+JSON.stringify({rawSizeBytes:bytes.length,rawSHA256:hash(bytes),...result}));
}
if (process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
 try{await run();}catch(e){
  console.error('Observer bootstrap failed: '+String(e?.name||'Error')+'; message SHA256 '+hash(String(e?.message??'')));
  process.exitCode=1;
 }
}
export {sameFinalizeStack};
