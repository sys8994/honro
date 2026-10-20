/** Candidate captures only: all generated output stays below _local/preview/. */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildWeb} from '../../shared/web-build.mjs';

const ROOT=fileURLToPath(new URL('../../',import.meta.url));
export async function buildPreview({outputRoot=path.join(ROOT,'_local/preview/vector-art')}={}){
  return buildWeb({outputRoot,preview:true});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=process.argv.slice(2);
    if(args.length!==0&&!(args.length===2&&args[0]==='--output'))throw Error('Usage: npm run build:preview -- [--output _local/preview/name]');
    await buildPreview(args.length?{outputRoot:path.resolve(ROOT,args[1])}:{});
    console.log('Candidate preview only; public output and art approval are unchanged.');
  }catch(error){console.error(error.message);process.exitCode=1;}
}
