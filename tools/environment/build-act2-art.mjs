import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
// Deliberately small, auditable SVG vocabulary. External resources, executable
// nodes, CSS, filters, use/image, and unbounded effects cannot enter a map file.
const allowed=new Set(['svg','defs','g','path','linearGradient','radialGradient','stop','title','desc']);
const numbers=s=>String(s).trim().split(/[ ,]+/).map(Number);
function attributes(text){const out={},re=/([\w:-]+)\s*=\s*"([^"]*)"/g;let m;while((m=re.exec(text)))out[m[1]]=m[2];const rest=text.replace(re,'').trim();if(rest)throw Error('Unsupported SVG attributes: '+rest);return out;}
const paint=s=>s==='none'||/^#[\da-f]{6}([\da-f]{2})?$/i.test(s)||/^url\(#[\w-]+\)$/.test(s);
function matrix(text){if(!text)return[1,0,0,1,0,0];const m=/^(translate|scale|matrix)\(([^)]+)\)$/.exec(text);if(!m)throw Error('Unsupported transform '+text);const a=numbers(m[2]);if(a.some(n=>!Number.isFinite(n)))throw Error('Nonfinite transform');if(m[1]==='translate'&&a.length<3)return[1,0,0,1,a[0],a[1]||0];if(m[1]==='scale'&&a.length<3)return[a[0],0,0,a[1]??a[0],0,0];if(m[1]==='matrix'&&a.length===6)return a;throw Error('Invalid transform');}
export function compileSVG(source){
 if(source.length>300000||/<\?|<!|\bon\w+\s*=|href\s*=|style\s*=|<\s*(?:script|image|foreignObject|use)\b/i.test(source))throw Error('Unsafe or unsupported SVG source');
 const tree={tag:'g',children:[]},stack=[tree],gradients=Object.create(null),xml=[];let viewBox=null,inText=0,gradient=null,rootSeen=false;
 const tokens=source.match(/<[^>]+>|[^<]+/g)||[];
 for(const token of tokens){if(!token.startsWith('<')){if(token.trim()&&!inText)throw Error('Text outside title/desc');continue;}
  const m=/^<(\/)?([\w:]+)([^>]*?)(\/?)>$/.exec(token);if(!m||!allowed.has(m[2]))throw Error('Unsupported SVG node '+token.slice(0,70));const [,closing,tag,raw,self]=m;
  if(closing){if(xml.pop()!==tag)throw Error('Mismatched SVG closing tag '+tag);if(tag==='title'||tag==='desc'){inText--;continue;}if(tag==='linearGradient'||tag==='radialGradient'){gradient=null;continue;}if(tag==='g')stack.pop();continue;}
  if(!xml.length&&tag!=='svg')throw Error('SVG must be the document root');if(tag==='svg'){if(rootSeen||xml.length)throw Error('Multiple or nested SVG roots');rootSeen=true;}if(!self)xml.push(tag);
  const a=attributes(raw);if(tag==='title'||tag==='desc'){inText++;continue;}
  const permitted={svg:['xmlns','viewBox'],defs:[],g:['id','fill','stroke','stroke-width','opacity','transform','stroke-linejoin','stroke-linecap'],path:['id','d','fill','stroke','stroke-width','opacity','transform','fill-rule','stroke-linejoin','stroke-linecap'],linearGradient:['id','x1','y1','x2','y2','gradientUnits'],radialGradient:['id','cx','cy','r','fx','fy','gradientUnits'],stop:['offset','stop-color','stop-opacity']}[tag];
  for(const key of Object.keys(a))if(!permitted.includes(key))throw Error('Unsupported SVG attribute '+tag+'.'+key);
  if(tag==='svg'){viewBox=numbers(a.viewBox);if(viewBox.length!==4||viewBox.some(n=>!Number.isFinite(n))||viewBox[2]<=0||viewBox[3]<=0)throw Error('Invalid SVG viewBox');continue;}
  if(tag==='defs')continue;
  if(tag==='linearGradient'||tag==='radialGradient'){if(a.gradientUnits!=='userSpaceOnUse'||!a.id)throw Error('Gradient must declare user space');gradient={type:tag==='linearGradient'?'linear':'radial',stops:[]};for(const key of tag==='linearGradient'?['x1','y1','x2','y2']:['cx','cy','r','fx','fy'])if(a[key]!==undefined)gradient[key]=Number(a[key]);gradients[a.id]=gradient;continue;}
  if(tag==='stop'){if(!gradient||!/^#[\da-f]{6}$/i.test(a['stop-color']))throw Error('Invalid gradient stop');gradient.stops.push({offset:Number(a.offset),color:a['stop-color'],opacity:Number(a['stop-opacity']??1)});continue;}
  if(tag==='g'&&a.opacity!==undefined&&Number(a.opacity)!==1)throw Error('Group opacity requires isolated compositing and is not supported');
  const node={tag};for(const key of ['fill','stroke'])if(a[key]){if(!paint(a[key]))throw Error('Unsupported paint '+a[key]);node[key]=a[key];}if(a.opacity!==undefined)node.opacity=Number(a.opacity);if(a['stroke-width'])node.lineWidth=Number(a['stroke-width']);if(a.transform)node.transform=matrix(a.transform);if(a['fill-rule'])node.fillRule=a['fill-rule'];if(a['stroke-linejoin'])node.lineJoin=a['stroke-linejoin'];if(a['stroke-linecap'])node.lineCap=a['stroke-linecap'];if(a.id)node.id=a.id;
  if(tag==='g')node.children=[];else{if(!a.d||a.d.length>60000||/[^mMzZlLhHvVcCsSqQtTaA0-9.eE+\-,\s]/.test(a.d))throw Error('Invalid path');node.d=a.d;}
  stack.at(-1).children.push(node);if(tag==='g'&&!self)stack.push(node);
 }
 if(!viewBox||stack.length!==1||inText||xml.length)throw Error('Unbalanced SVG');
 for(const gradient of Object.values(gradients)){const coords=gradient.type==='linear'?['x1','y1','x2','y2']:['cx','cy','r'];if(coords.some(k=>!Number.isFinite(gradient[k]))||gradient.stops.length<2)throw Error('Invalid SVG gradient');for(const stop of gradient.stops)if(!Number.isFinite(stop.offset)||stop.offset<0||stop.offset>1||!Number.isFinite(stop.opacity)||stop.opacity<0||stop.opacity>1)throw Error('Invalid SVG stop');}
 return{version:1,viewBox,gradients,root:tree,source};
}
export const ACT2_VECTOR_FILES={
 'act2:pine':'act2-pine.svg','act2:cave-house':'act2-cave-home.svg','act2:cave-house-lean':'act2-cave-home-lean.svg','act2:cave-house-ruin':'act2-cave-home-lean.svg',
 'act2:temple':'act2-temple-hall.svg','act2:bell':'act2-wedged-bell.svg','act2:hoist-frame':'act2-hoist-frame.svg','act2:lamp':'act2-stone-lamp.svg','act2:sluice':'act2-sluice.svg'
};
export async function applyAct2VectorArt(project){
 // v5 advertises portable vector capability so older clients reject, rather than silently hide, these assets.
 if(project.version>=4)project.version=Math.max(5,project.version);
 for(const [id,file]of Object.entries(ACT2_VECTOR_FILES)){
  const source=await readFile(path.join(root,'shared/assets/environment',file),'utf8'),vector=compileSVG(source),[x,y,w,h]=vector.viewBox;
  let a=project.library.find(a=>a.id===id);if(!a){a={id,name:id==='act2:pine'?'비대칭 먹빛 소나무':'돌 수문',category:id==='act2:pine'?'tree':'architecture',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:['act2'],params:{},reference:{heightM:h/60,foot:{x:0,y:0},scaleRange:[.4,4],backgroundRange:[.7,1.3]}};project.library.push(a);}
  a.vector=vector;a.bounds={x,y,w,h};a.reference={...a.reference,bounds:{x,y,w,h},foot:{x:0,y:0}};
  // Old polygon art remains as a legacy editor fallback, never as collision.
 }
 return project;
}
