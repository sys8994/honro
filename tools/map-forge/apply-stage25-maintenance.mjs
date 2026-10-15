import {readFileSync,writeFileSync} from 'node:fs';
import {refineMaintenance25} from './stage25-maintenance.mjs';
const file=process.argv[2]||'shared/data/campaign.json';
const p=JSON.parse(readFileSync(file,'utf8'));
p.library=p.library.filter(a=>!a.id.startsWith('a3-maintenance25:'));
refineMaintenance25(p,p.stages.find(s=>s.metadata.stageId===25));
writeFileSync(file,JSON.stringify(p,null,2)+'\n');
