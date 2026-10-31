// Exact ordered compound import. No Boolean geometry operations.
export function preserveCompound(d,{partChars=55000,totalChars=240000,maxParts=32}={}){
 if(typeof d!=='string'||d.length>totalChars)throw Error('Compound exceeds bounded total');
 if(d.length<=60000)return {d};
 const subpaths=d.match(/[Mm][^Mm]*/g);
 if(!subpaths||subpaths.join('')!==d.trimStart())throw Error('Cannot split without changing authored path');
 // Preserve insignificant leading whitespace as well as every authored command.
 subpaths[0]=d.slice(0,d.length-d.trimStart().length)+subpaths[0];
 const parts=[];let current='';
 for(const subpath of subpaths){if(subpath.length>partChars)throw Error('Single subpath exceeds import limit; simplify with bounded visual error');if(current.length+subpath.length>partChars){parts.push(current);current='';}current+=subpath;}
 if(current)parts.push(current);if(parts.length>maxParts)throw Error('Compound part count exceeds limit');
 return {dParts:parts};
}
