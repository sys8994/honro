import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
function draw(readback){const canvas=createCanvas(64,48),ctx=canvas.getContext('2d');for(let frame=0;frame<60;frame++){ctx.clearRect(0,0,64,48);ctx.fillStyle='#183145';ctx.fillRect(0,0,64,48);const layer=createCanvas(16,12),c=layer.getContext('2d');c.fillStyle=frame%2?'#bc8c64':'#82a69b';c.fillRect(0,0,16,12);ctx.save();ctx.translate(frame%31,frame%17);ctx.drawImage(layer,0,0);ctx.restore();layer.width=1;layer.height=1;if(readback)canvas.data();}return canvas.data();}
assert.deepEqual(draw(true),draw(false));console.log('PASS NativeCanvas readback preserves final pixels across moving composited/released layers (not game visual approval)');
