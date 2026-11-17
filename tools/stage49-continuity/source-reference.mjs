import vm from'node:vm';import{createCanvas,Path2D,DOMMatrix}from'@napi-rs/canvas';import{readFile,writeFile}from'node:fs/promises';
const v=JSON.parse(await readFile('shared/assets/environment/act5/near-import.json'))[8].vector;
const convert=n=>({...n,...(n.sourcePath?{d:n.sourcePath}:{}),...(n.children?{children:n.children.map(convert)}:{})});
const g=vm.createContext({Path2D,DOMMatrix,console});vm.runInContext(await readFile('shared/map/vector-art.js','utf8'),g);
const c=createCanvas(1024,1536),x=c.getContext('2d');g.HonroVectorArt.draw(x,{vector:{...v,root:convert(v.root)},anchor:{x:0,y:0}},{});await writeFile('_local/stage49/source-native.png',c.toBuffer('image/png'));
