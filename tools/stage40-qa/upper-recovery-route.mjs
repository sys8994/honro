/** Pursue a previously engaged upper foe through actual support connections.
 * Never steer horizontally toward an upper target while standing below it. */
export function upperConnectionGoal(u,support){
 if(support==='a4-return-deck')return{x:2350,deckJoin:true,kind:'upper-recovery-deck-join'};
 if(support==='approved40-departure-stair')return{x:1460,jumpLanding:'approved40-dock',kind:'upper-recovery-land-on-dock'};
 if(support==='approved40-dock')return{x:1900,jumpLanding:'approved40-dock-stair',kind:'upper-recovery-land-on-stair'};
 if(support==='approved40-dock-stair')return{x:2660,jumpLanding:'approved40-coast-west',kind:'upper-recovery-land-on-coast'};
 return null;
}

export function upperRecoveryGoal(u,{support,foes,surface}){if(!foes.length||!foes.every(v=>surface(v)==='approved40-coast-west'&&v.y<=2500))return null;return upperConnectionGoal(u,support);}
