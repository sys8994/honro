// Reference compositor for one bounded, same-device-pixel owned vector ROI.
// Pure helper: it does not change Canvas state, global renderers or source data.
export function compositeOwnedReplacement({width,height,old,newPaint,rim,source,maxPixels=262144}){
 const area=width*height;
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<=0||height<=0||area>maxPixels||!Number.isSafeInteger(area)||![old,newPaint,rim,source].every(a=>a instanceof Uint8ClampedArray&&a.length===4*area))return {ok:false,reason:'invalid or over-budget ROI'};
 // Validate everything before writing, including pre-existing source holes and
 // antialias fringe. User paint can't be introduced across a source-mask edge.
 for(let i=3;i<old.length;i+=4){
  if(rim[i]&&(source[i]!==255||newPaint[i]!==255))return {ok:false,reason:'rim meets original source boundary/hole or incomplete new body'};
 }
 const rgba=new Uint8ClampedArray(old);
 for(let i=0;i<old.length;i+=4){
  const m=rim[i+3];if(!m)continue;
  if(m===255){rgba[i]=newPaint[i];rgba[i+1]=newPaint[i+1];rgba[i+2]=newPaint[i+2];rgba[i+3]=255;continue;}
  const wa=old[i+3]*(255-m),wb=255*m,total=wa+wb;
  rgba[i]=Math.round((old[i]*wa+newPaint[i]*wb)/total);
  rgba[i+1]=Math.round((old[i+1]*wa+newPaint[i+1]*wb)/total);
  rgba[i+2]=Math.round((old[i+2]*wa+newPaint[i+2]*wb)/total);
  rgba[i+3]=Math.round(total/255);
 }
 return {ok:true,rgba,outputBytes:rgba.byteLength,rawInputBytes:4*rgba.byteLength,pixels:area};
}
