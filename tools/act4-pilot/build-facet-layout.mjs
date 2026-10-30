/** Apply explicit role-specific functional facet tops; no artwork generation. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const controls=JSON.parse(await readFile('tools/act4-pilot/layouts/stage31-v4-facets.json','utf8'));
const spec=JSON.parse(await readFile(controls.baseline,'utf8'));
for(const f of spec.surfaces)if(controls.profiles[f.id])f.top=controls.profiles[f.id];
const at=(id,x)=>{const ps=spec.surfaces.find(f=>f.id===id).top;for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i];if(a[0]<=x&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}throw Error(id+' missing support '+x);};
// Existing rooted collision masses must stay attached after changing the shore; no new skirt.
for(const id of ['west-ledge','ridge-court','east-overhang']){const f=spec.surfaces.find(f=>f.id===id);for(const i of [4,5])f.bottom[i][1]=Math.max(f.bottom[i][1],at('shore',f.bottom[i][0])+20);}
for(const c of spec.covers){const id={'court-cover':'ridge-court','low-cover':'shore','lookout-cover':'lookout'}[c.id];c.y=Math.max(...Array.from({length:11},(_,i)=>at(id,c.x+i*c.w/10)))+2;}
spec.spawn.y=at('shore',spec.spawn.x);spec.boarding.startY=spec.spawn.y-90;spec.version=4;spec.status=controls.status;spec.geometryNotes.facetAuthoring=controls;spec.activePlayBounds.bottom=Math.max(...spec.surfaces.flatMap(f=>f.top.map(p=>p[1])));
const maxSlopes=Object.fromEntries(spec.surfaces.map(f=>[f.id,Math.max(...f.top.slice(1).map((p,i)=>Math.abs((p[1]-f.top[i][1])/(p[0]-f.top[i][0]))))]));
if(Object.values(maxSlopes).some(x=>x>1.35))throw Error('unsafe slope '+JSON.stringify(maxSlopes));
const out='_local/reports/act4-pilot/stage31/skeleton-v4';await mkdir(out,{recursive:true});await writeFile(out+'/input.json',JSON.stringify(spec,null,2));
execFileSync(process.execPath,['tools/act4-pilot/build-skeleton.mjs','31',out,out+'/input.json'],{stdio:'inherit'});console.log(JSON.stringify({maxSlopes}));
