/** Stage31 route-specific controller plan; geometry unchanged. */
export function landingWaypoints({x,support},goal){
 if(support==='approved31-low-flank'&&x<5085&&goal>5085)return[5030,Math.min(5200,goal),goal].filter((v,i,a)=>i===0||v!==a[i-1]);
 return[goal];
}
