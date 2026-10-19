/** Refresh only this study's inline SVG and approved still pose. No game build. */
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=fileURLToPath(new URL('../../../',import.meta.url)), dir=new URL('./',import.meta.url);
const source=await readFile(new URL('foreground.svg',dir),'utf8');
const file=new URL('index.html',dir), html=await readFile(file,'utf8');
const body=source.slice(source.indexOf('<defs>'),source.lastIndexOf('</svg>'));
await writeFile(file,html.replace(/(<svg id="scene"[^>]+)>[\s\S]*?<\/svg>/,(_,start)=>start+'>'+body+'</svg>'));
const rig=vm.createContext({});
vm.runInContext(await readFile(root+'shared/assets/party/party.runtime.js','utf8'),rig);
vm.runInContext(await readFile(root+'shared/runtime/party-rig.js','utf8'),rig);
await writeFile(new URL('seol-o-scale.svg',dir),rig.HonroVectorRig.poseSVG(rig.HONRO_PARTY.seol_o,'idle',0));
console.log('Updated study SVG and approved idle pose only.');
