/** Controller state only. Never reads/writes combat actors, HP or resources. */
export function stalledUpperSupport(state,{round,npcX,npcY,heroY}){
 if(state.supportObservation?.round===round)return false;
 const prior=state.supportObservation;
 const stationary=prior&&Math.abs(npcX-prior.npcX)<80;
 const separated=heroY<npcY-600;
 state.supportStalls=stationary&&separated?(state.supportStalls||0)+1:0;
 state.supportObservation={round,npcX};
 return state.supportStalls>=2;
}
