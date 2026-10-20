/** The release entry point; ordinary build remains usable for candidate captures. */
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkArtReview} from './art-review.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export async function prepareRelease({root = ROOT, runBuild = () => spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {cwd: root, stdio: 'inherit'})} = {}) {
  const review = await checkArtReview({root});
  if (review.status === 'blocked') return {...review, build: 'not-run', exitCode: 1};
  const build = runBuild();
  return {...review, build: build.error || build.status !== 0 ? 'failed' : 'completed', exitCode: build.error ? 1 : build.status ?? 1};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareRelease();
  console.log(JSON.stringify(result, null, 2)); process.exitCode = result.exitCode;
}
