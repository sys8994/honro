/** Public release preparation uses the same mandatory gate as ordinary build. */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkArtReview} from './art-review.mjs';
import {buildWeb} from '../../shared/web-build.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export async function prepareRelease({root = ROOT, runBuild} = {}) {
  // Injection is only used by isolated schema tests. Production calls buildWeb
  // directly, so it checks the public gate once and never recurses through npm.
  if(runBuild){
    const review=await checkArtReview({root});
    if(review.status!=='records-consistent')return {...review,build:'not-run',exitCode:1};
    const build=await runBuild();
    return {...review,build:build.error||build.status!==0?'failed':'completed',exitCode:build.error?1:build.status??1};
  }
  try{await buildWeb();return {build:'completed',exitCode:0};}
  catch(error){
    if(error.code==='HONRO_ART_REVIEW_BLOCKED')return {...error.review,build:'not-run',exitCode:1};
    return {build:'failed',exitCode:1,errors:[error.message]};
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareRelease();
  console.log(JSON.stringify(result, null, 2)); process.exitCode = result.exitCode;
}
