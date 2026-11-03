/** Controller only: retain one approach goal until support changes or a
 * deliberate drop resolves. Prevent nearest-enemy standoff oscillation. */
export function createRouteGoalLock(resolve){let goal=null,support=null;return{next(u,currentSupport){if(!goal||support!==currentSupport){goal=resolve(u);support=currentSupport;}return goal;},clear(){goal=null;support=null;}};}
