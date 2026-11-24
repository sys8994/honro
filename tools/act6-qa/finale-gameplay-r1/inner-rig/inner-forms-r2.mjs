// Smaller hurt-body readability study. The temporal traces are encounter UI,
// not extra body mass. The literal collider is still owned by game data.
import {retraceMourner, ferryman} from './inner-forms.mjs';
const r2=structuredClone(retraceMourner);
const old='last-print';
r2.id='a6-retrace-mourner-r2';
r2.parts=r2.parts.filter(v=>v.id!==old);
r2.viewBox=[-67,-160,162,168];
for(const c of Object.values(r2.clips)){
 c.tracks=c.tracks.filter(x=>x.part!==old);
}
r2.clips.idle.tracks.unshift({part:'root',channel:'scaleX',keys:[[0,.71],[1,.71]]});
export const retraceMournerR2=r2;
export const assets={[r2.id]:r2,[ferryman.id]:ferryman};
