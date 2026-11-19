import fs from 'node:fs'; import crypto from 'node:crypto';
const f=process.argv[2], s=fs.readFileSync(f,'utf8');
if(crypto.createHash('sha256').update(s).digest('hex')!=='626fbd653c7efcf03a285e3b602a79b9303873550731c9a117b9af774a56b3ec')throw Error('Wrong signed Inspector input');
const anchor='setCamera:view=>{Object.assign(stageView,view);renderStage()},';
if(s.split(anchor).length!==2)throw Error('Camera anchor moved');
fs.writeFileSync(f,s.replace(anchor,anchor+'setNeutralTerrainElementFrame:view=>{const {x,y,zoom}=view;if(![x,y,zoom].every(Number.isFinite)||zoom<0.05||zoom>3)throw Error("Frame");Object.assign(elementView,{x,y,zoom});renderElement()},'));
