import fs from 'node:fs';
const dir='rig-parts/grot_hanging',object=JSON.parse(fs.readFileSync(dir+'/parts.json'));
const clips={idle:{duration:3.6,tracks:[]},move:{duration:1.1,tracks:[]},attack:{duration:.8,tracks:[]},hit:{duration:.34,tracks:[]},jump_fall:{duration:.8,tracks:[]}};
const asset={id:'grot_hanging',name:'거꾸로 매달린 상주',family:'grotesque',baseHeight:288,viewBox:[-111,-290,222,292],parts:[],palette:{},clips};
const adj=(clip,part,channel,keys)=>clips[clip].tracks.push({part,channel,keys});
for(const layer of object){
 const {paths}=JSON.parse(fs.readFileSync(dir+'/'+layer.id+'/candidate.json'));
 const pivot=[layer.pivot[0]-111,layer.pivot[1]-290];
 asset.parts.push({...layer,pivot,paths:paths.map(({color,d},i)=>{
  const fill=layer.id+i; asset.palette[fill]=color;
  return {d,fill,width:0,lod:0};
 })});
}
adj('idle','garment','rotate',[[0,0],[.25,1.8],[.75,-1.8],[1,0]]);
adj('idle','face','rotate',[[0,0],[.27,-1.5],[.8,1],[1,0]]);
adj('move','garment','x',[[0,0],[.33,1.8],[.66,-1.8],[1,0]]);
adj('attack','garment','rotate',[[0,0],[.26,-5],[.60,6],[1,0]]);
adj('attack','face','rotate',[[0,0],[.28,-4],[.60,6],[1,0]]);
adj('attack','nearReach','rotate',[[0,0],[.28,-10],[.60,18],[1,0]]);
adj('attack','farReach','rotate',[[0,0],[.31,-6],[.62,10],[1,0]]);
adj('hit','garment','rotate',[[0,-9],[.36,5],[1,0]]);
adj('hit','face','rotate',[[0,-4],[.55,2],[1,0]]);
fs.writeFileSync(dir+'/candidate.runtime.js','globalThis.HONRO_ACTORS='+JSON.stringify({assets:{[asset.id]:asset}})+';\n');
