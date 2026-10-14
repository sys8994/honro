import {dialogueInventory} from './dialogue-clarity-inventory-helpers.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
const data=await dialogueInventory(),dir=process.env.HONRO_DIALOGUE_OUT||'_local/reports/dialogue-clarity';await mkdir(dir,{recursive:true});await writeFile(dir+'/inventory.json',JSON.stringify(data,null,2)+'\n');await writeFile(dir+'/read-through.txt',data.lines.map(l=>`${l.path}\n${l.who}: ${l.text}\n`).join('\n'));console.log(JSON.stringify({chapters:data.stages.length,rests:data.rests.length,occurrences:data.lines.length,dir}));
