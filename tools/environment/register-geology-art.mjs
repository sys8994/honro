/** Adapt shared registration metadata to the existing environment contract.
 * The owned SVGs and builder remain byte-identical to their reviewed source. */
import {applyGeologyArt,GEOLOGY_ASSETS} from './build-geology-art.mjs';
export async function registerGeologyArt(project){
 await applyGeologyArt(project);
 for(const id of Object.keys(GEOLOGY_ASSETS)){
  const r=project.library.find(a=>a.id===id).reference;
  // backgroundRange must be a subset of the authored native scaleRange.
  r.backgroundRange=[Math.max(r.scaleRange[0],r.backgroundRange[0]),Math.min(r.scaleRange[1],r.backgroundRange[1])];
 }
 return project;
}
