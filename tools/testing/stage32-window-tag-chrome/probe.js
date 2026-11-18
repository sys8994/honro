function run(INPUT){const outputsPNG={};function nodes(n,a=[]){if(n.tag==='path')a.push(n);for(const c of n.children||[])nodes(c,a);return a;}
const {body,field}=INPUT;
const frames=[['first',320,1650],['cold',320,1650],['pan0',336,1650],['pan1',352,1650],['pan2',352,1666],['pan3',320,1650],['pan4',480,1650],['pan5',496,1666],['edge',1689.6,1342]],rows=[];
for(const kind of ['grass','pale','road']){
 const selected=i=>kind==='grass'?i>=12&&i<=17:kind==='pale'?i>=1&&i<=4:i>=21;
 const white=new Set(nodes(body.vector.root).filter((n,i)=>selected(i)).map(n=>n.fill));const black=new Set(nodes(body.vector.root).filter((n,i)=>!selected(i)).map(n=>n.fill));for(const color of white)if(black.has(color))throw Error('ambiguous palette');
 const ba=structuredClone(body),fa=structuredClone(field);nodes(ba.vector.root).forEach((n,i)=>n.fill=selected(i)?'#ffffff':'#000000');nodes(fa.vector.root).forEach(n=>n.fill='#000000');
 const fl={asset:fa,x:-5500,y:-1950,scale:1,rotation:0},bl={asset:ba,x:0,y:0,scale:1,rotation:0},battle={honroStage:32,honroLandmarks:[fl,bl]},outputs={};
 for(const variant of ['baseline','candidate']){
 const key='__tag_'+kind+'_'+variant; const helper=globalThis[key];if(!helper)throw Error('tag construction');const cvs=document.createElement('canvas');cvs.width=1331;cvs.height=763;const c=cvs.getContext('2d');outputs[variant]={};
 for(const[name,x,y]of frames){if(name==='cold')helper.clear();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,1331,763);c.setTransform(1.65,0,0,1.65,1331/2-x*1.65,763/2-y*1.65);for(const l of [fl,bl])if(!helper.draw(c,l,battle,false,{sceneScale:1.65,nativeLive:true}))throw Error('fallback');outputs[variant][name]=c.getImageData(0,0,1331,763).data;outputsPNG[variant+'-'+kind+'-'+name]=cvs.toDataURL('image/png');}helper.clear();
 }
 for(const[name]of frames){const a=outputs.baseline[name],b=outputs.candidate[name];let positive=0,full=0,changed=0,fullChanged=0,partialChanged=0,alpha=0,max=0;for(let i=0;i<a.length;i+=4){positive+=a[i]>0;full+=a[i]===255;alpha+=a[i+3]!==b[i+3];if(a[i]!==b[i]){changed++;fullChanged+=a[i]===255;partialChanged+=a[i]>0&&a[i]<255;max=Math.max(max,Math.abs(a[i]-b[i]));}}rows.push({kind,name,positive,full,changed,fullChanged,partialChanged,alpha,max});}
}
return {ok:true,rows,masks:outputsPNG,width:1331,height:763,scope:"Same sequential cameras, Native Canvas API in Chrome; original source primitive and offline gradient start-color role model. Both variants tagged, field black. Not actual-color arithmetic or all-space foreground proof."};}