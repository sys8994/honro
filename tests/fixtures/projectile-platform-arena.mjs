/** Small authored project for browser input and shared-Scene review. */
export function projectilePlatformProject(g){
 const M=g.HonroMaps,p=structuredClone(g.HONRO_PROJECT),st=M.emptyStage('projectile-platform-arena','발판 사격 검수',3600,1800);
 const solid=(id,points,oneWay=false)=>({id,type:'solid',points:points.map(([x,y])=>({x,y})),baseMaterial:oneWay?'wood':'rock',oneWay,breakable:false,properties:{indestructible:true}});
 st.terrains=[solid('floor',[[0,1000],[3600,1000],[3600,1800],[0,1800]]),solid('platform',[[350,760],[2950,760],[2950,830],[350,830]],true)];
 st.units=['archer','mage','knight','occultist'].map((cls,i)=>g.HonroUnits.record(cls,'p-'+cls,800-i*70,1000));
 for(const u of st.units){const loadout=u.kind==='mage'?['M01','M11','M07','M12']:u.kind==='occultist'?['O01','O11','O13','O04']:u.kind==='archer'?['A01','A04','A15','A02']:['S00'];u.stageOverrides={loadout,ranks:Object.fromEntries(loadout.map(id=>[id,1])),focus:1000,maxFocus:1000};}
 st.units.push(g.HonroUnits.record('hound','distant-target',3300,1000,'enemy'));
 st.anchors={start:{x:800,y:1000},end:{x:3350,y:1000}};
 p.name='발판 사격 검수';p.library=[];p.stages=[st];p.activeStageId=st.id;
 return M.finalize(p);
}
export const projectilePlatformCases=[
 {id:'arrow',skill:'A01',angle:75,power:.6,label:'아래에서 상승 후 발판 윗면에 화살 착탄'},
 {id:'bounce',skill:'M11',angle:75,power:.6,label:'반탄파가 아래면을 통과하고 윗면에서 반사'},
 {id:'stake',skill:'M07',angle:75,power:.6,label:'진목이 발판 윗면에 설치'},
 {id:'summon',skill:'O11',angle:75,power:.6,label:'배회령이 발판 윗면에 소환'},
 {id:'ceiling',skill:'M11',angle:75,power:.6,solid:true,label:'고체 천장 아래면의 반사 유지'},
 {id:'slope',skill:'M12',angle:75,power:.6,slope:true,label:'삼재파의 경사 발판 윗면 반사'}
];
