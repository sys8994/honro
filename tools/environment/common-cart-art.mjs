/** Metadata for the existing common rc18Cart painter's single empty variant. */
const bounds={x:-60,y:-59,w:168,h:79};
export const COMMON_SINGLE_CART={id:'builtin:singleRefugeeCart',name:'버려진 빈 나무 수레',category:'prop',renderer:'landmark',kind:'singleRefugeeCart',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:['shared','cart','empty'],params:{sourceRenderer:'art-dark.js:rc18Cart',cartCount:1,empty:true},bounds,reference:{heightM:79/60,bounds,foot:{x:0,y:20},scaleRange:[.7,2.4],backgroundRange:[.7,1.3]}};
export function applyCommonCartArt(project){let a=project.library.find(a=>a.id===COMMON_SINGLE_CART.id);if(!a){a={};project.library.push(a);}Object.assign(a,structuredClone(COMMON_SINGLE_CART));return project;}
