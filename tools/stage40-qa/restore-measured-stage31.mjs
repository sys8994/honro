/** Byte-exact captured evidence only. Never mint/rebind a measured claim. */
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const bytes=execFileSync('xz',['-dc','tools/stage40-qa/records/41642048069-stage31-production-package.json.xz'],{maxBuffer:2*1024*1024});
const sha=createHash('sha256').update(bytes).digest('hex');if(sha!=='2368fa94d723b40e94e9d96437932f395d9239c2cedc113c6f3ef1062b7c32c1')throw Error('Captured package bytes changed');
const p=JSON.parse(bytes),rows=p.production.probeResults[p.stageId],o=rows.find(r=>r.id==='boarding-objective');if(p.stageId!=='stage-31'||o?.sourceRunId!==41642048069||o.sourceCommit!=='fbfee413d02901501c4104d57d51d45c274714e7'||rows.some(r=>r.result!=='pass'||r.runtimeSha256!=='7ae278319004dd73ce772abc042c2d6e33c22d9e4691feac740484254013f1ad'))throw Error('Captured provenance mismatch');
await fs.writeFile('tools/stage31/production-package.json',bytes);console.log(JSON.stringify({sourceRunId:41642048069,sourceArtifactId:13235351277,inspectionArtifactId:13235351277,packageSha256:sha,scope:'Unchanged genuine package; normal current runtime/payload gate still required'}));
