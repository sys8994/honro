import {readFileSync} from 'node:fs';
export const openStructurePolicy=JSON.parse(readFileSync(new URL('../../shared/data/open-structures.json',import.meta.url),'utf8'));
const assets=new Set(openStructurePolicy.rows.filter(r=>r.kind==='asset').map(r=>r.id));
const terrains=new Set(openStructurePolicy.rows.filter(r=>r.kind==='terrain').map(r=>r.id));
export const openStructureAsset=id=>assets.has(id);
export function openStructureTerrain(t){if(terrains.has(t.id)){t.oneWay=true;delete t.properties.honroCeiling;delete t.properties.honroLocationCeiling;}return t;}
// Explicit authoring only. Never call this for arbitrary Workshop imports.
export function applyOpenStructures(project,{minStage=1,maxStage=30}={}){const selected=openStructurePolicy.rows.filter(r=>r.stage>=minStage&&r.stage<=maxStage),ids=new Set(selected.filter(r=>r.kind==='asset').map(r=>r.id));for(const a of project.library)if(ids.has(a.id))a.oneWay=true;for(const s of project.stages)for(const t of s.terrains)if(selected.some(r=>r.kind==='terrain'&&r.stage===s.metadata?.stageId&&r.id===t.id))openStructureTerrain(t);return project;}
