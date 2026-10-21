/** Run from a detached ee73add5 worktree to export actual baseline fixtures.
 * node /path/to/current/tools/testing/stage2-layered-baseline.mjs
 * Required dependencies must be available in that worktree. No source edits. */
import{writeFile,readFile,mkdir}from'node:fs/promises';
const root=process.cwd(),out=process.env.HONRO_STAGE2_BASELINE_DIR||'/tmp/stage2-layered-baseline',h=await(await import(root+'/tests/app-regression-helpers.mjs')).appHarness(),{battlefield}=await import(root+'/game/tests/helpers.mjs'),rows=[];
const normalize=b=>JSON.parse(JSON.stringify(b).split(b.session).join('SESSION'));for(let id=1;id<=30;id++)if(id!==2)rows.push({id,battle:normalize(battlefield(h.g,id).b)});
await mkdir(out,{recursive:true});await writeFile(out+'/other29.json',JSON.stringify(rows));const p=JSON.parse(await readFile(root+'/game/docs/stage-review/stage02-positioning/evidence/entry-profile.json')).profile,a=h.load(p);a.launch(2);h.finish(a);a.stopBattle();await writeFile(out+'/master-profile.json',JSON.stringify(a.profile));console.log('Baseline29 compiler snapshots and real master Stage2 Continue saved',a.profile.honroBattle.honroCampaignMapRevision);
