// Deployment transport only. Canonical JSON and synchronous runtime APIs stay unchanged.
export function packJson(value){
 const nodes=[],seen=new Map();
 function visit(value){
  if(value===null||typeof value==='boolean')return value;
  if(typeof value==='number')return[value];
  const key=JSON.stringify(value);if(seen.has(key))return seen.get(key);
  const node=typeof value==='string'?value:Array.isArray(value)?[0,...value.map(visit)]:[1,...Object.entries(value).flatMap(([key,item])=>[visit(key),visit(item)])];
  const id=nodes.length;nodes.push(node);seen.set(key,id);return id;
 }
 const root=visit(value);return{version:1,nodes,root};
}
export function unpackJson(packet){
 if(packet?.version!==1||!Array.isArray(packet.nodes))throw Error('Unsupported JSON pool');
 function expand(ref,limit=packet.nodes.length){
  if(ref===null||typeof ref==='boolean')return ref;
  if(Array.isArray(ref))return ref[0];
  if(!Number.isInteger(ref)||ref<0||ref>=limit)throw Error('Invalid JSON pool reference');
  const node=packet.nodes[ref];if(typeof node==='string')return node;
  if(node[0]===0)return node.slice(1).map(child=>expand(child,ref));
  if(node[0]!==1||node.length%2!==1)throw Error('Invalid JSON pool node');
  // Expand each occurrence independently, matching JSON.parse object identity.
  return Object.fromEntries(Array.from({length:(node.length-1)/2},(_,i)=>[expand(node[1+2*i],ref),expand(node[2+2*i],ref)]));
 }
 return expand(packet.root);
}
