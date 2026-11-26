import fs from 'node:fs';
const dir='rig-parts/boss_daedosa',layers=JSON.parse(fs.readFileSync(dir+'/parts.json'));
const clips={idle:{duration:4.6,tracks:[]},move:{duration:1.2,tracks:[]},attack:{duration:.9,tracks:[]},hit:{duration:.34,tracks:[]},jump_fall:{duration:.8,tracks:[]}};
const lift=0, asset={id:'boss_daedosa',name:'대도사',family:'human',baseHeight:198,viewBox:[-154,-202,308,204],parts:[{id:'core',pivot:[0,-118],parent:null,paths:[]}],palette:{},clips};
const create=(id,pivot,parent)=>{const part={id,pivot,parent,paths:[]};asset.parts.push(part);return part};
const path=(part,color,d,lod=0)=>{const fill='c'+color;asset.palette[fill]='#'+color;part.paths.push({d,fill,lod,width:0})};
const cp=(d)=>d.replace(/-?\d+(?:\.\d+)? +(-?\d+(?:\.\d+)?)/g,(m,v)=>m.slice(0,m.lastIndexOf(v))+(+v-lift).toFixed(2));
for(const l of layers){
 const part=create(l.id,[l.pivot[0]-152,l.pivot[1]-200-lift],l.parent||'core');
 const {paths}=JSON.parse(fs.readFileSync(dir+'/tailored/'+l.id+'/candidate.json'));
 // Backfill underneath rotating shoulder seams with the same cloth palette.
 if(l.id==='robe'){
  path(part,'29282a','M-58 -131 C-40 -143 -22 -140 -9 -123 C-20 -111 -42 -113 -57 -120Z');
  path(part,'353631','M21 -123 C29 -132 46 -125 63 -119 L58 -108 C45 -114 32 -122 21 -113Z');
  path(part,'28282a','M-15 -156 C-10 -162 5 -166 14 -151 L17 -135 L-6 -129 L-16 -144Z');
 }
 for(const p of paths)path(part,p.color.slice(1),cp(p.d));
}
const adj=(clip,part,channel,keys)=>clips[clip].tracks.push({part,channel,keys});
adj('idle','head','rotate',[[0,0],[.25,1.5],[.75,-1.5],[1,0]]);
adj('idle','ribbons','rotate',[[0,0],[.21,4],[.69,-4],[1,0]]);
adj('attack','head','rotate',[[0,0],[.3,-6],[.60,6],[1,0]]);
adj('attack','nearArm','rotate',[[0,0],[.28,-10],[.63,19],[1,0]]);
adj('attack','farArm','rotate',[[0,0],[.31,-12],[.65,20],[1,0]]);
adj('attack','ribbons','rotate',[[0,0],[.24,-9],[.67,14],[1,0]]);
adj('hit','core','rotate',[[0,-5],[.38,2],[1,0]]);
adj('hit','head','rotate',[[0,-10],[.35,4],[1,0]]);
fs.writeFileSync(dir+'/candidate.runtime.js','globalThis.HONRO_ACTORS='+JSON.stringify({assets:{[asset.id]:asset}})+';\n');
