// Story revision may replace only explicit prose. Every other authored field
// remains frozen, including quest IDs, classes, limits, difficulty and waves.
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export const plain=x=>JSON.parse(JSON.stringify(x));
export const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export async function content(){
 const g=vm.createContext({HONRO_CORE:{SKILLS:{}},HONRO_BALANCE:JSON.parse(await readFile('game/config/balance.json','utf8'))});
 for(const name of ['content','story-content','act2-content','act2-plan','act2-drama','journey-content'])vm.runInContext(await readFile(`shared/runtime/${name}.js`,'utf8'),g);
 return g;
}
export function gameplay(stage,proseFields){const s=plain(stage);for(const key of proseFields)delete s[key];for(const step of s.steps||[])delete step.label;for(const step of s.act2Plan?.sequence||[])if(typeof step==='object')delete step.label;return s;}
export function mapRules(project){const p=plain(project);for(const s of p.stages){delete s.name;if(s.design){delete s.design.title;delete s.design.description;}for(const m of s.markers||[])delete m.label;for(const m of s.initialState?.honroAct2Steps||[])delete m.label;if(s.meta)delete s.meta.notes;}return p;}
