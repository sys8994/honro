import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const g=vm.createContext({});vm.runInContext(await readFile(new URL('../../shared/map/environment.js',import.meta.url),'utf8'),g);
const project=JSON.parse(await readFile(process.argv[2]||new URL('../../shared/data/campaign.json',import.meta.url),'utf8'));
const issues=g.HonroEnvironment.validate(project);
for(const s of project.stages)for(const note of s.environment?.migrationNotes||[])console.log('MIGRATED '+s.id+': '+note);
for(const issue of issues)console.log(issue.level.toUpperCase()+': '+issue.text);
console.log(`${project.stages.length} maps: ${issues.filter(i=>i.level==='err').length} environment errors`);
process.exitCode=issues.some(i=>i.level==='err')?1:0;
