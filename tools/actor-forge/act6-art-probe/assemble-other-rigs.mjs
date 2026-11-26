import fs from 'node:fs';
const pass=process.env.HONRO_PAINT_PASS??'paint';
const names={grot_hands:'천수귀',grot_door:'입 벌린 문짝',gate_armor:'문턱 꼭두',forepaw:'혼류의 앞발',wonhon:'넘쳐온 원혼',wonhon_knotted:'맺힌 원혼'};
for(const id of process.argv.slice(2).length?process.argv.slice(2):Object.keys(names)){
 const dir='rig-parts/'+id;
 const {parts,origin:[ox,oy],size:[w,h]}=JSON.parse(fs.readFileSync(dir+'/parts.json'));
 const clips={idle:{duration:3.4,tracks:[]},move:{duration:1.2,tracks:[]},attack:{duration:.8,tracks:[]},hit:{duration:.34,tracks:[]},jump_fall:{duration:.8,tracks:[]}};
 const asset={id,name:names[id],family:'grotesque',baseHeight:h-4,viewBox:[-ox,-oy,w,h],parts:[{id:'core',pivot:[0,0],parent:null,paths:[]}],palette:{},clips};
 const move=(clip,part,channel,keys)=>clips[clip].tracks.push({part,channel,keys});
 const ox0=w/2,oy0=h-2,dx=ox0-ox,dy=oy0-oy;
 const cp=(d)=>d.replace(/(-?\d+(?:\.\d+)?) +(-?\d+(?:\.\d+)?)/g,(m,x,y)=>(+x+dx).toFixed(2)+' '+(+y+dy).toFixed(2));
 for(const {id:pid,pivot:[x,y],motion:[sway,stroke]} of parts){
  const seq=JSON.parse(fs.readFileSync(dir+'/'+pass+'/'+pid+'/candidate.json'));
  asset.parts.push({id:pid,pivot:[x-ox,y-oy],parent:'core',paths:seq.paths.map(({color,d})=>{
   const fill=color.replace('#','tone');asset.palette[fill]=color;
   return{d:cp(d),fill,width:0,lod:0};
  })});
  if(sway)move('idle',pid,'rotate',[[0,0],[.25,sway*.35],[.75,-sway*.35],[1,0]]);
  if(stroke)move('attack',pid,'rotate',[[0,0],[.27,-stroke*.45],[.63,stroke],[1,0]]);
  if(pid.endsWith('Leg')||pid.endsWith('Foot'))move('move',pid,'rotate',[[0,0],[.25,sway],[.7,-sway],[1,0]]);
 }
 move('hit','core','rotate',[[0,-3],[.38,1],[1,0]]);
 fs.writeFileSync(dir+'/'+(pass==='paint'?'candidate':pass)+'.runtime.js','globalThis.HONRO_ACTORS='+JSON.stringify({assets:{[id]:asset}})+';\n');
 console.log(id,asset.parts.length,asset.parts.reduce((n,p)=>n+p.paths.length,0),fs.statSync(dir+'/'+(pass==='paint'?'candidate':pass)+'.runtime.js').size);
}
