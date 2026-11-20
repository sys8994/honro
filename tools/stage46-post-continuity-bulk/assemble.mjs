import fs from 'node:fs';import{preserveCompound}from './preserve-compound.mjs';
const dir=new URL('.',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,dir),'utf8'));
const source=read('near-import.json')[5];if(source.id!==46||source.vector.viewBox[2]!==1024)throw Error('Stage46 source mismatch');
function vectorPaths(node){const{sourcePath,children,...rest}=node;if(sourcePath)return{...rest,...preserveCompound(sourcePath)};return children?{...rest,children:children.map(vectorPaths)}:rest}
for(const mode of ['original']){
const vector=source.vector,a={id:'act5:near:46',name:'하늘우물의 가장자리',category:'rock',visual:[],collision:[],sockets:[],tags:['terrain','act5'],anchor:{x:0,y:0},params:{sourceSha256:source.sha256},bounds:{x:0,y:0,w:1024,h:1536},vector:{...vector,root:vectorPaths(vector.root),symbols:Object.fromEntries(Object.entries(vector.symbols).map(([k,n])=>[k,vectorPaths(n)]))},shaftExterior:read(`${mode}/stage46-exterior-body.json`),shaftExteriorParts:[1,2,3,4,5].map(i=>read(`${mode}/stage46-exterior-part-${i}.json`)),shaftProtected:read('original/stage46-protected-clips.json'),shaftTree:read('original/stage46-tree-completion.json')};
fs.writeFileSync(new URL(mode+'-assembled.json',dir),JSON.stringify(a));}
