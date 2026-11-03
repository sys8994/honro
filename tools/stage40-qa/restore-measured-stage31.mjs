/** Byte-exact captured evidence only. Never mint/rebind a measured claim. */
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const bytes=execFileSync('xz',['-dc','tools/stage40-qa/records/41595651979-stage31-package.json.xz'],{maxBuffer:2*1024*1024});
const sha=createHash('sha256').update(bytes).digest('hex');if(sha!=='1e673fcc98af5ab56b91b792260b2cc122826daf0c42eedf3d9bf408ae6c59db')throw Error('Captured package bytes changed');
const p=JSON.parse(bytes),rows=p.production.probeResults[p.stageId],o=rows.find(r=>r.id==='boarding-objective');if(p.stageId!=='stage-31'||o?.sourceRunId!==41595651979||o.sourceCommit!=='74265f8722a7ba74ab6ebc16f0015c9ce9ce6c35'||rows.some(r=>r.result!=='pass'||r.runtimeSha256!=='c7367c91e8046a595eed4b552f382a09254035123bb754e5c2223f106b5386a8'))throw Error('Captured provenance mismatch');
await fs.writeFile('tools/stage31/production-package.json',bytes);console.log(JSON.stringify({sourceRunId:41595651979,sourceArtifactId:13215393920,inspectionArtifactId:13216067325,packageSha256:sha,scope:'Unchanged genuine package; normal current runtime/payload gate still required'}));
