// Only a marked, bounded *static domain cell* can be the destination.
// No Scene/global frame buffer, no fallback to an overlay.
export function copyOpaqueOwnerRuns(ctx,{x,y,w,h,rim,source,isolated,newPaint,authorized,compose}){
 if(!authorized||ctx.canvas.width!==516||ctx.canvas.height!==516||![x,y,w,h].every(Number.isSafeInteger)||x<0||y<0||w<=0||h<=0||x+w>516||y+h>516||w*h>262144)return {used:false,reason:'unapproved static domain cell'};
 const span=[];
 let old,compiled,staged,original,fullyCovered=0,oldInkChanged=0;
 try{
  original=ctx.getImageData(x,y,w,h);old=original.data;
  for(let row=0;row<h;row++){
   let from=-1;
   for(let col=0;col<=w;col++){
    const i=4*(row*w+col),m=col<w&&rim[i+3];
    if(m){
     if(isolated[i+3]!==255||old[i+3]!==255||[0,1,2].some(k=>isolated[i+k]!==old[i+k]))return {used:false,reason:'Owner not independently opaque or shared sample differs'};
     if(rim[i+3]===255){fullyCovered++;if([0,1,2].some(k=>newPaint[i+k]!==old[i+k]))oldInkChanged++;}
     if(from<0)from=col;
    }else if(from>=0){span.push([from,row,col-from]);from=-1;}
   }
  }
  if(!span.length)return {used:false,reason:'empty'};
  compiled=compose({width:w,height:h,old,newPaint,rim,source});
  if(!compiled.ok)return {used:false,reason:compiled.reason};
  staged=new ImageData(compiled.rgba,w,h);
 }catch(e){return {used:false,reason:String(e.message??e)};}
 const matrix=ctx.getTransform();
 try{
  ctx.resetTransform();
  for(const [i,j,n] of span)ctx.putImageData(staged,x,y,i,j,n,1);
  const check=ctx.getImageData(x,y,w,h).data;
  if(check.some((v,i)=>v!==compiled.rgba[i]))throw Error('Browser tile readback mismatch');
 }catch(e){
  // The entire saved ROI is restored only on unexpected backend/write mismatch.
  // On ordinary capability refusal no pixels are ever written.
  ctx.putImageData(original,x,y);
  if(ctx.getImageData(x,y,w,h).data.some((v,i)=>v!==original.data[i]))throw Error('QA opaque-owner copyback rollback was not exact');
  return {used:false,reason:String(e.message??e)};
 }finally{ctx.setTransform(matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f);}
 return {used:true,spans:span.length,fullyCovered,oldInkChanged,pixels:span.reduce((s,x)=>s+x[2],0)};
}
