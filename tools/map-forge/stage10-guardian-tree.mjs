/** Three alternating living boughs above a low root, only on new stage10 maps.
 * Preserve IDs, one-way flags, resistance and breakability. Old saves never run
 * authoring. The open ground route, boss, receivers and entry cues do not move. */
export const GUARDIAN_BRANCH_POINTS=Object.freeze({
 'altar-step-1':[[2100,2200],[2210,2192],[2340,2165],[2450,2155],[2510,2170],[2480,2240],[2400,2228],[2320,2205],[2190,2209]],
 'altar-step-2':[[2390,2030],[2500,2026],[2620,1992],[2750,1978],[2860,1984],[2850,1994],[2740,2004],[2640,2032],[2540,2082],[2460,2100],[2400,2080]],
 'altar-step-3':[[2060,1890],[2190,1878],[2320,1900],[2450,1882],[2560,1870],[2560,1950],[2450,1960],[2340,1942],[2220,1910],[2100,1908]],
 'altar-platform':[[2410,1740],[2530,1744],[2640,1713],[2780,1690],[2930,1686],[2920,1696],[2790,1720],[2680,1760],[2570,1810],[2470,1812],[2410,1800]]
});
export function applyGuardianBranches(project){const s=project.stages.find(s=>s.id==='stage-10'&&s.metadata?.stageId===10);if(!s)return project;for(const t of s.terrains){const ps=GUARDIAN_BRANCH_POINTS[t.id];if(ps)t.points=ps.map(([x,y])=>({x,y}));}return project;}
