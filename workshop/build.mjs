import {readFile,writeFile} from 'node:fs/promises';
import {runtimeParts,root} from '../shared/build.mjs';
import {buildGame} from '../game/build.mjs';
import {packPlaytestTemplate} from '../shared/playtest-template.mjs';
import {writeGenerated} from '../shared/write-generated.mjs';
import path from 'node:path';
const read=p=>readFile(path.join(root,p),'utf8');
const game=await buildGame();
const runtime=await runtimeParts();
// The app:false tail is stage-rules; all preceding parts are identical in Game.
const packed=packPlaytestTemplate(game,runtime.slice(0,-1));
const parts=[packed.shared,runtime.at(-1),packed.restore];
parts.push(await read('workshop/src/app.js'));
const html=(await read('workshop/src/index.html')).replace('/*STYLE*/',await read('workshop/src/style.css'))
 .replace('/*SCRIPT*/',()=>parts.join('\n').replace(/<\/script/gi,'<\\/script'));
await writeGenerated(path.join(root,'HONRO_WORKSHOP.html'),html);
await writeFile(path.join(root,'workshop/HONRO_MAP_WORKSHOP.html'),'<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../HONRO_WORKSHOP.html"><a href="../HONRO_WORKSHOP.html">HONRO Workshop</a>');
console.log('Built HONRO.html and HONRO_WORKSHOP.html with one shared runtime');
