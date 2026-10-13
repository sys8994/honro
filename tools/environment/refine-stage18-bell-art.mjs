/** Apply only the reviewed local bell vector. Never re-author any map. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createStage18HollowBell} from './stage18-bell-art.mjs';
export function refineStage18BellArt(project){
 const rows=project.library.filter(a=>a.id==='stage18:bell-hollow-body');assert.equal(rows.length,1,'One authored hollow bell');
 const current=rows[0],art=createStage18HollowBell();
 for(const k of ['bounds','anchor','collision','sockets','reference'])assert.deepEqual(current[k],art[k],'Preserve bell '+k);
 const before=structuredClone(current.params),after=structuredClone(art.params);delete before.nodeCount;delete after.nodeCount;assert.deepEqual(before,after,'Sound aperture and descent contracts unchanged');
 current.vector=art.vector;current.params.nodeCount=art.params.nodeCount;return project;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file=process.argv[2]||'shared/data/campaign.json',p=JSON.parse(await readFile(file,'utf8'));refineStage18BellArt(p);await writeFile(file,JSON.stringify(p,null,2)+'\n');console.log('Updated one hollow-bell vector; all stages and other assets preserved.');}
