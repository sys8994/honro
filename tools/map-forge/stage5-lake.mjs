/** Revision 1 lake layout: fresh entries only; the preceding waterfall contract stays intact. */
export function authorStage5Lake(s,old,g){
 const clone=v=>JSON.parse(JSON.stringify(v)),pts=a=>a.map(([x,y])=>({x,y})),dx=900;
 s.environment.zones.at(-1).to=5000;
 for(const sf of s.environment.surfaces){sf.points[0].x=Math.min(sf.points[0].x,-30000);sf.points.at(-1).x=Math.max(sf.points.at(-1).x,35000);sf.bottom=Math.max(sf.bottom,32000);}
 const base=clone(s.terrains.find(t=>t.id==='valley-floor'));
 const solid=(id,p,oneWay=false)=>({...clone(base),id,name:id,points:pts(p),oneWay,playProjection:undefined});
 s.width=5300;s.height=5000;s.initialState.honroStage5LakeRevision=1;
 const top=[[0,2520],[500,2520],[730,2610],[900,2610],[1100,2490],[1230,2490],[1450,2710],[1740,2710],[1930,2590],[2180,2590],[2380,2790],[2640,3300],[3000,3700],[3500,4200],[4200,4280],[4700,4010],[5000,3770],[5300,3770]];
 const floor=solid('valley-floor',[...top,[5300,5000],[0,5000]]);
 const cliff=s.terrains.find(t=>t.id==='waterfall-cliff');for(const p of cliff.points)p.x+=dx;
 const veil=s.terrains.find(t=>t.id==='waterfall-veil');for(const p of veil.points)p.x+=dx;for(const p of veil.properties.honroWaterFluidVertices)p.x+=dx;
 const target=s.terrains.find(t=>t.id==='cliff-cleat');for(const p of target.points)p.x+=old.initialState.honroStage5LakeRevision?0:dx;
 s.terrains=[floor,solid('west-overlook',[[730,2440],[1060,2440],[1060,2470],[730,2470]],true),solid('ritual-overlook',[[1470,2535],[1770,2535],[1770,2565],[1470,2565]],true),cliff,veil,target];
 const y=x=>{for(let i=1;i<top.length;i++){let a=top[i-1],b=top[i];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}throw Error('Outside land');};
 const anchor=(x,support='valley-floor',yy=y(x))=>({x,y:yy,support});
 Object.assign(s.anchors,{start:anchor(330),receiver:anchor(1590),basin:anchor(1760),shotGap:anchor(2120),waterfallFoot:{x:3890,y:3300,support:'valley-floor'},cleat:{x:4220,y:2404,support:'waterfall-cliff'},roost:anchor(1650,'ritual-overlook',2535),exit:anchor(2120)});
 const positions={'foe-0':[850,y(850)],'foe-4':[1050,y(1050)],'foe-8':[1180,y(1180)],'foe-1':[1760,y(1760)],'foe-5':[1830,y(1830)],'foe-9':[2020,y(2020)],'foe-2':[1410,2180],'foe-6':[2250,2240],'foe-3':[1630,2535],'foe-7':[2170,y(2170)]};
 for(const u of s.units){[u.x,u.y]=positions[u.id]||[u.x,y(u.x)];u.spawnX=u.x;u.spawnY=u.y;}
 s.markers=s.markers.filter(m=>m.id!=='marker-6');
 const map={'marker-0':'start','marker-1':'receiver','marker-3':'shotGap','marker-5':'cleat','receiver-5':'receiver','habitat-5-0':'basin','habitat-5-1':'roost'};
 for(const m of s.markers){const a=map[m.id];if(a)Object.assign(m,s.anchors[a]);else if(m.type==='rest'){m.x=m.id==='marker-2'?1370:2240;m.y=y(m.x);}}
 const bottom=[[2640,3300],[3000,3700],[3500,4200],[4200,4280],[4700,4010],[4800,3930]];
 s.materials=s.materials.filter(m=>m.id==='stage5-headwater');const head=s.materials[0];head.x1+=dx;head.x2+=dx;
 s.materials.push({id:'stage5-plunge-pool',terrainId:'valley-floor',kind:'water-pool',x1:2640,x2:4800,surfaceY:3300,surface:[[2640,3300],[4800,3300]],bottom,points:[[2640,3300],[4800,3300],...bottom.slice().reverse()],honroCarvedBasin:true,depth:0,alpha:.94,conductive:true,step:18});
 for(const e of s.elements){if(e.kind==='waterfall'||e.id.includes('crest'))e.x+=dx;else if(e.id==='landmark-1'){e.x=1590;e.y=y(1590);}else if(e.id.includes('pine'))e.y=y(e.x);}
 s.elements=s.elements.filter(e=>!['landmark-2','landmark-4'].includes(e.id));
 s.design.title='넓은 소 너머의 주박목';s.design.question='능선 뒤 낮은 길과 두 선택 사격대를 오가며 물길진을 지키고, 호수 건너 열린 동굴에 곡사한다.';
 s.design.gameplay=['ritual-gate','accessible-western-terraces','deep-plunge-pool','remote-cave-target'];s.design.waterfall.lakeRevision=1;
 for(const k of ['headwater','lip','pool'])s.design.waterfall[k].x+=dx;
 const ev=s.events.find(e=>e.id==='lower-beasts');if(ev){ev.when.progress=1750;Object.assign(ev.action,{x:2100,y:y(2100),support:'valley-floor',spacing:110});ev.entry={x:2100,y:y(2100)};}
 const warning=s.events.find(e=>e.id==='lower-beasts-warning');if(warning){warning.when.progress=1550;warning.text='호숫가 풀숲에서 발굽 소리가 들린다. 한 라운드 뒤 사슴들이 물길진 쪽으로 올라온다.';}
}
