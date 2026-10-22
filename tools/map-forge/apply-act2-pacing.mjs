/** Idempotent final overlay; called after all geography/encounter authors. */
import{readFile,writeFile}from'node:fs/promises';import{runtime}from'../../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),path='shared/data/campaign.json',source=await readFile(path,'utf8'),raw=JSON.parse(source);
const out=g.HonroAct2Pacing.author(raw);await writeFile(path,JSON.stringify(out,null,source.includes('\n  ')?2:0)+'\n');console.log('Applied scoped Act2 pacing overlay.');
