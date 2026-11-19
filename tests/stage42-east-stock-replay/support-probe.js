async ()=>{
 const e=HonroApp.engine,b=e?.b;
 if(b?.honroStage!==42)throw Error('support probe requires official actual Stage42');
 const supply=[[4062.5,2075.68],[4386.23,1625],[5198.73,1548.83],[5541.5,1377.44],[5871.58,945.8],[6500,945.8]],
       palisade=[[4817.87,1180.66],[5560.55,971.19],[6500,945.8]];
 const probe=(x,y)=>{const s=e.contactSurface(x,y-4,y+4);return s?{surface:s.t.id,y:s.y,oneWay:!!s.t.oneWay}:null};
 // Only inspect the stock loaded battle. No set-position/movement/stat mutations.
 const take=(nodes,name)=>nodes.slice(1).flatMap(([x1,y1],i)=>{
   const [x0,y0]=nodes[i],m=(y1-y0)/(x1-x0);
   return [x0+.5,(x0+x1)/2,x1-.5].map(x=>{const y=y0+(x-x0)*m;return {name,x,expected_reference:y,actual:probe(x,y)}});
 });
 const plan=[...take(supply,'supply-road'),...take(palisade,'palisade')];
 // The pinned original compiler returns null in this narrow palisade band where
 // the upper routes converge. Compare that null too; do not certify tread registration.
 const knownNull=(p)=>p.name==='palisade'&&Math.abs(p.x-6030.275)<1e-6;
 for(const p of plan)if(knownNull(p)?p.actual!==null:(!p.actual||Math.abs(p.actual.y-p.expected_reference)>4||!['a5-supply-road','a5-palisade'].includes(p.actual.surface)))throw Error('Stock east contact differs from registered diagnostic: '+JSON.stringify(p));
 const outside=[6510,7000,7360,7389,7410,7440,7472,7500].map(x=>({x,contact:e.contactSurface(x,-2400,5061)?.t?.id??null}));
 if(outside.some(x=>x.contact!==null))throw Error('Unexpected outside physical support: '+JSON.stringify(outside));
 const sha=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x))))).map(x=>x.toString(16).padStart(2,'0')).join('');
 return {plan,outside,physics:await sha(b.terrain),terrainBounds:b.honroTerrainBounds,playBounds:b.honroPlayBounds??{width:b.width,height:b.height}};
}
