/** Export the same shared geometry used by Canvas and the SVG catalog. No game build. */
import{readFile,writeFile}from'node:fs/promises';import{fileURLToPath}from'node:url';import vm from'node:vm';
import{compileScene,svgScene}from'../../../shared/runtime/environment-vector-kit.mjs';
import{STAGE1}from'./shared-kit/stage1.scene.mjs';
const dir=new URL('./',import.meta.url),root=fileURLToPath(new URL('../../../',import.meta.url));
await writeFile(new URL('foreground.svg',dir),svgScene(compileScene(STAGE1),{prefix:'stage1-export'})+'\n');
const rig=vm.createContext({});vm.runInContext(await readFile(root+'shared/assets/party/party.runtime.js','utf8'),rig);vm.runInContext(await readFile(root+'shared/runtime/party-rig.js','utf8'),rig);await writeFile(new URL('seol-o-scale.svg',dir),rig.HonroVectorRig.poseSVG(rig.HONRO_PARTY.seol_o,'idle',0));
console.log('Exported shared-kit Stage1 SVG and approved actor pose only.');
