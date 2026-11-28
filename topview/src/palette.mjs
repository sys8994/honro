// Bake the chapter palette once per loaded sheet, before weather and time-of-day grading.
export function fieldPalette(id,image){
  let tone;
  if(id.startsWith('pine_')||id==='shrub')tone=[.79,10,.74];
  else if(id.startsWith('rock_')||id==='stone_lantern')tone=[.85,4,.80];
  else if(id.startsWith('seolo'))tone=[1.19,7,.94];
  else if(id.startsWith('turns-')||id==='woodcutter')tone=[1.09,3,.90];
  else return image;
  const [contrast,bias,chroma]=tone,canvas=document.createElement('canvas');
  canvas.width=image.width;canvas.height=image.height;
  const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
  const frame=ctx.getImageData(0,0,canvas.width,canvas.height),data=frame.data;
  for(let p=0;p<data.length;p+=4){
    if(!data[p+3])continue;
    const l=data[p]*.2126+data[p+1]*.7152+data[p+2]*.0722;
    for(let c=0;c<3;c++)data[p+c]=(l+(data[p+c]-l)*chroma)*contrast+bias;
  }
  ctx.putImageData(frame,0,0);return canvas;
}
