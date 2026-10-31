/** Controller safety guard only: fail closed rather than walk off from wrong support. */
export function routeGuard({support,y,hp,dead},phase){
 if(dead||hp<=0)return {ok:false,reason:'actor-dead'};
 if(y>3600)return {ok:false,reason:'unsafe-descent'};
 if(phase==='east'&&support&&!['approved31-low-flank','approved31-east-return','approved31-upper-east','approved31-upper-west','approved31-boarding'].includes(support))return{ok:false,reason:'unexpected-support:'+support};
 return{ok:true};
}
export function supportedTankReady(allies){return allies.some(u=>u.cls==='knight'&&!u.dead&&u.hp>0&&u.x>=5100&&u.support==='approved31-east-return');}
