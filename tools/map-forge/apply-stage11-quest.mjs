import{readFile,writeFile}from'node:fs/promises';import{runtime}from'../../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),file='shared/data/campaign.json',raw=await readFile(file,'utf8');
await writeFile(file,JSON.stringify(g.HonroStage11Quest.author(JSON.parse(raw)),null,raw.includes('\n  ')?2:0)+'\n');
console.log('Applied Stage11 rescue and automatic trace quest; terrain/art and other29 chapters retained.');
