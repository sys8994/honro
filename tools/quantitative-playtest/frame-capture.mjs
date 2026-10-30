/** Capture the already-rendered Native Scene; no render, tick, pose or HUD injection. */
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function captureNativeFrame(canvas,file,identity){
 if(typeof canvas?.toBuffer!=='function'||typeof canvas?.data!=='function')throw Error('Actual NativeCanvas required for frame capture');
 const before=canvas.data(),pixelSHA256=sha(before),png=canvas.toBuffer('image/png');
 if(sha(canvas.data())!==pixelSHA256)throw Error('Frame capture changed rendered pixels');
 const receipt={kind:'actual-App-NativeCanvas-Scene-capture',...identity,file,width:canvas.width,height:canvas.height,pixelSHA256,pngSHA256:sha(png),bytes:png.length,scope:'Already-rendered Scene pixels only; HTML HUD/modal/DOM and browser GUI are not captured or certified. No extra render or simulation step.'};
 await writeFile(file,png,{flag:'wx'});await writeFile(file+'.receipt.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});return receipt;
}
