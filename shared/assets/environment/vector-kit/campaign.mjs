/** Explicit presentation choices only. Story, collision, roster and events stay authored elsewhere. */
const style=(place,palette,ground,pieces,keep,far=null)=>({place,palette,ground,pieces,keep,far,maxParts:48});
export const STAGE_STYLES={
 1:style('고갯길 산림','forest','earth',['rock.shoulder','earth.gully','earth.mantle','grass.sedge'],['옛 고갯문·추적 흔적'],'quietFar'),
 2:style('상여길과 높은 사격턱','dry','earth',['rock.upright','rock.swept','earth.mantle'],['상여·공중 적·높은 사격턱'],'quietFar'),
 3:style('나루와 장부 보관처','wet','earth',['rock.swept','stone.flat','grass.sedge'],['나루 건축·장부·전도 물'],'quietFar'),
 4:style('피란문과 탄 회랑','ash','rock',['rock.shoulder','stone.split','earth.mantle'],['피란문·화재·파괴 회랑'],'quietFar'),
 5:style('폭포 암벽과 물 틈','wet','rock',['rock.upright','rock.swept','stone.flat'],['기존 벡터 폭포 모션·표적·진목'],'valleyFar'),
 6:style('끊어진 목교','cool','rock',['rock.swept','stone.split','earth.mantle'],['목교 잔해·낙차·발판'],'valleyFar'),
 7:style('뿌리 사이 산비탈 마을','forest','earth',['earth.gully','earth.mantle','rock.shoulder'],['고목 마을·집·구조 주민'],'forestFar'),
 8:style('빈 상여가 돌아오는 마당','dry','earth',['rock.swept','earth.mantle','stone.flat'],['상여·운반 경로·보관채'],'forestFar'),
 9:style('바람 없는 의식 마당','cool','earth',['rock.shoulder','stone.flat','earth.mantle'],['의식 회랑·제단·진목'],'forestFar'),
 10:style('주술목과 마지막 밤','forest','earth',['earth.gully','rock.upright','earth.mantle'],['주술목·소단·의식 대상'],'forestFar'),
 11:style('산길과 깊은 계곡','cool','rock',['rock.upright','rock.swept','grass.sedge'],['흔적·고도차·출구']),
 12:style('되돌아온 산길과 채석터','dry','rock',['rock.shoulder','rock.upright','earth.mantle'],['채석 시설·기록·매복']),
 13:style('숨은 석문','cave','rock',['rock.upright','rock.swept','stone.split'],['석문·통로·매복']),
 14:style('동굴마을과 수직 생활터','cave','rock',['rock.shoulder','rock.swept','stone.flat'],['기존 동굴 집·시장·가족 거처']),
 15:style('물 아래 수로','wet','rock',['rock.swept','stone.flat','stone.split'],['수로·수위·물 기믹']),
 16:style('잠운사 사찰','cave','rock',['rock.shoulder','stone.flat','rock.swept'],['사찰 건축·범종 구조·의식']),
 17:style('벽을 두드리는 작업굴','cave','rock',['rock.upright','rock.swept','stone.split'],['작업장 목재·채굴 장치']),
 18:style('묵종의 큰 동굴','cave','rock',['rock.upright','rock.shoulder','stone.flat'],['묵종·봉인·지지대·전투 상태']),
 19:style('종 안의 사람들','ink','rock',['rock.swept','stone.split','rock.shoulder'],['묵종 내부·생존자·호송']),
 20:style('동굴 출구와 하늘','cool','earth',['rock.shoulder','earth.mantle','grass.blades'],['출구·호송·합류']),
 21:style('읍성 성문 아래','city','rock',['rock.shoulder','stone.flat','stone.split'],['기존 읍성·성문·시장 지붕']),
 22:style('관청의 옛 장부','city','rock',['rock.swept','stone.flat','stone.split'],['관청·서가·기록 목표']),
 23:style('하역장과 사라진 짐','dry','earth',['rock.swept','earth.mantle','stone.flat'],['하역장·수레·호송·목표 짐']),
 24:style('문장이 남은 사당','city','rock',['rock.shoulder','stone.flat','stone.split'],['사당·휘겸 문장·문']),
 25:style('지하 수문과 묶인 이름','wet','rock',['rock.upright','rock.swept','stone.flat'],['지하 천장·수문·권양기·수로']),
 26:style('지상 공방과 증언','city','rock',['rock.swept','earth.mantle','stone.split'],['공방·증언자·작업 기구']),
 27:style('검은 지하 집하장','cave','rock',['rock.shoulder','rock.upright','stone.flat'],['집하장 구조·천장·연결 왜곡']),
 28:style('불타는 기록 마당','ash','rock',['rock.swept','earth.mantle','stone.split'],['화재 모션·명령 기록·탈출']),
 29:style('현묵의 기록 공간','ink','rock',['rock.upright','rock.shoulder','stone.flat'],['기록 건축·공간왜곡·보스']),
 30:style('남겨진 길과 마지막 나루','wet','earth',['rock.shoulder','rock.swept','grass.sedge'],['나루·배 정착 상태·최종 출구']),
};

// The four former image-only stages removed their vector scenery and bounded
// their display mass to the paintings. These are explicit, non-colliding joins.
Object.assign(STAGE_STYLES[1],{foundations:['forest-floor','forest-middle-floor','forest-exit-floor'],scenery:[
 {id:'entry-pine',assetId:'pine.small',x:850,support:'forest-floor',scale:.9},
 {id:'choice-pine',assetId:'pine.landmark',anchor:'shrine',support:'forest-middle-floor',scale:1,breakLinks:{'pine-branch-east':['middle-right','middle-right-crown','right-fork-crown']}},
 {id:'ridge-pine',assetId:'pine.small',anchor:'ridge',support:'forest-exit-floor',scale:.9}]});
Object.assign(STAGE_STYLES[2],{foundations:['canyon-ground'],scenery:[
 {id:'basin-pine',assetId:'pine.small',anchor:'leftBasin',support:'canyon-ground',scale:.8}]});
Object.assign(STAGE_STYLES[3],{foundations:['ferry-ground'],scenery:[
 {id:'cargo-shelter',assetId:'hanok.shelter',anchor:'cargo',support:'ferry-ground',scale:.85}]});
Object.assign(STAGE_STYLES[4],{foundations:['gate-basin'],scenery:[
 {id:'gate-left-post',assetId:'hanok.column',x:425,support:'gate-basin',scale:1},
 {id:'gate-right-post',assetId:'hanok.column',x:690,support:'gate-basin',scale:1}]});
