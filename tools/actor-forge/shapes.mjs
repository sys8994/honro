export const palette={ink:'#1A282A',hair:'#292C29',hairLight:'#454B43',skin:'#BFA083',skinShade:'#987B62',feature:'#463C31',eye:'#DDD0B5',cloth:'#677064',light:'#969F88',shade:'#424D43',linen:'#C5BEA6',linenShade:'#96917B',leather:'#695640',wood:'#796247',woodLight:'#AA8D61',metal:'#778B86',metalLight:'#BECDC1',red:'#925C50',gold:'#BAA36F',soul:'#A5C6C0',glow:'#D5E6CC',purple:'#857391',deep:'#29353D'};
export function asset(d,height=108,viewBox=[-70,-124,140,134]){return{id:d.id,name:d.name,version:1,family:d.family,baseHeight:height,viewBox,palette:{...palette},brief:{reference:'같은 개체의 개선 전 게임 그림',silhouette:d.name,identity:[],materials:[]},parts:[],clips:Object.fromEntries([['idle',3],['move',.8],['attack',.6],['hit',.35],['jump_fall',.8]].map(([k,duration])=>[k,{duration,loop:['idle','move'].includes(k),tracks:[]}]))};}
export function part(a,id,pivot=[0,0],parent=null){const p={id,pivot,parent,paths:[]};a.parts.push(p);return p;}
export function shape(p,d,fill,stroke=null,width=.6,lod=0){p.paths.push({d,fill,stroke,width,lod});}
export function line(p,d,stroke='shade',width=.7,lod=1){shape(p,d,null,stroke,width,lod);}
export function oval(p,x,y,rx,ry,fill,stroke=null,width=.6,lod=0){shape(p,`M${x-rx} ${y} C${x-rx} ${y-ry*1.333} ${x+rx} ${y-ry*1.333} ${x+rx} ${y} C${x+rx} ${y+ry*1.333} ${x-rx} ${y+ry*1.333} ${x-rx} ${y}Z`,fill,stroke,width,lod);}
export function track(a,clip,id,channel,keys){a.clips[clip].tracks.push({part:id,channel,keys});}
export function sway(a,id,n=1){track(a,'idle',id,'rotate',[[0,0],[.25,n],[.75,-n],[1,0]]);}
export function react(a,id,angle=12){track(a,'attack',id,'rotate',[[0,0],[.22,-angle*.6],[.48,angle],[.72,angle*.3],[1,0]]);track(a,'hit',id,'rotate',[[0,-angle*.6],[.4,angle*.25],[1,0]]);}
export function paper(p,x,y,w=5,h=12){shape(p,`M${x} ${y} L${x+w} ${y+.5} ${x+w-.5} ${y+h} ${x-1} ${y+h-1}Z`,'linen');line(p,`M${x+1} ${y+3}L${x+w-1} ${y+3} ${x+2} ${y+6} ${x+w-1} ${y+8} M${x+w/2} ${y+2}L${x+w/2} ${y+h-2}`,'red',.6,1);}
