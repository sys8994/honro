from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[2]
S={31:('_local/reports/sea-silhouette-v3/coastal31-final360294/31/manifest.json','normal'),32:('_local/reports/sea-silhouette-v3/bank-wood32-cameras-v2/32/manifest.json','normal'),33:('_local/reports/act4-silhouette33/connected-soil-joined-actual/33/manifest.json','normal'),34:('_local/reports/stage34-production/coherent-v4-after1/manifest.json','normal'),35:('_local/reports/stage35-bank-v4/foreground-supported-actual/35/manifest.json','normal'),36:('_local/reports/stage36-bank-v4/base-clip-actual/36/manifest.json','house-normal'),37:('_local/reports/sea-silhouette-v3/coastal37-wall-final-v5/37/manifest.json','normal'),38:('_local/reports/stage38-production/coherent-v4-after3/manifest.json','normal'),39:('_local/reports/stage39-bank-v4/quiet-rescue-actual/39/manifest.json','rescue'),40:('_local/reports/sea-silhouette-v3/coastal40-final-v4/40/manifest.json','normal')}
D={'purpose':'External fixed inspection cameras; not game/project data. Existing reviewed camera positions, no actor or event mutation.','stages':{}}
for n,(p,view) in S.items():
 b=(R/p).read_bytes();j=json.loads(b)
 if isinstance(j,list):
  v=next(x['view'] for x in j if x['view']['name']==view); v={'id':view,'x':v['x'],'y':v['y'],'scale':v['scale'],'width':v['w'],'height':v['h']}
 else: v=next(x['requested'] for x in j['frames'] if x['requested']['id']==view)
 D['stages'][f'stage-{n}']={'views':[v],'cameraOrigin':p,'cameraOriginSHA256':hashlib.sha256(b).hexdigest()}
(R/'tools/act4-visual-packet/cameras.json').write_text(json.dumps(D,ensure_ascii=False,indent=2)+'\n')
C={
31:[('좌측 지형','art/act4-silhouette-v3/sea/bank31/play-left/concept.png'),('목재 발판','art/act4-silhouette-v3/sea/wood31/concept.png'),('우측 지형','art/act4-silhouette-v3/sea/bank31/play-right/concept.png'),('부두 짐','art/act4-silhouette-v3/sea/cargo/concept.png')],
32:[('지형','art/act4-silhouette-v3/sea/bank32/ground-concept.png'),('바위 엄폐물','art/act4-silhouette-v3/sea/stone-ramp-cover-concept.png'),('우측 지형','art/act4-silhouette-v3/sea/bank32/ground-right-concept.png'),('목재 발판','art/act4-silhouette-v3/sea/wood32/concept.png')],
33:[('중앙 지형 윤곽','art/stage33-bank-silhouette-v1/concept.png'),('석조 갯길','art/stage33-causeway-silhouette-v5/concept.png'),('양측 지형 윤곽','art/stage33-bank-silhouette-v2/concept.png'),('내부 지층 재사용','art/act4-silhouette-v3/sea/bank32/ground-concept.png')],
34:[('절벽 위쪽 돌출부','art/stage34-silhouette-v4/concept.png'),('상승 지형','art/stage34-floor-silhouette-v4/concept.png')],
35:[('서쪽 지형','art/stage35-bank-silhouette-v4/play-west-concept-v2.png'),('동쪽 지형','art/stage35-bank-silhouette-v4/play-east-concept-v2.png')],
36:[('서쪽 지형','art/stage36-bank-silhouette-v4/play-west-concept-v2.png'),('동쪽 지형','art/stage36-bank-silhouette-v4/play-east-concept-v2.png')],
37:[('좌측 지형','art/act4-silhouette-v3/sea/bank37/play-left/concept.png'),('목재 발판','art/act4-silhouette-v3/sea/wood37/concept.png'),('우측 지형','art/act4-silhouette-v3/sea/bank37/play-right/concept.png'),('부서진 돌벽','art/act4-silhouette-v3/sea/wall37/concept.png')],
38:[('동굴 천장','art/stage38-silhouette-v4/roof-concept-shallow.png'),('서쪽 바닥','art/stage38-floor-silhouette-v4/concept.png')],
39:[('서쪽 지형','art/stage39-bank-silhouette-v4/play-west-concept-v2.png'),('상부 돌 발판','art/stage39-upper-ledge-v4/concept.png'),('동쪽 지형','art/stage39-bank-silhouette-v4/play-east-concept-v2.png')],
40:[('좌측 지형','art/act4-silhouette-v3/sea/bank40/play-left/concept.png'),('목재 발판','art/act4-silhouette-v3/sea/wood40/concept.png'),('우측 지형','art/act4-silhouette-v3/sea/bank40/play-right/concept.png')]
}
T={31:('강 끝의 갈대','기복이 있는 강둑 윤곽과 목재 발판을 분리하고 내부 지층을 정돈했습니다.'),32:('빈 포구','경사면의 모호한 바위 형상을 낮고 분명한 엄폐물로 교체했습니다.'),33:('물 빠진 갯길','돌길은 구조가 읽히게 다듬고 지형 내부는 연결된 지층으로 정리했습니다.'),34:('파도에 깎인 절벽','천장 아래쪽과 상승 지형의 윤곽을 시안에서 가져왔습니다.'),35:('대숲의 옛길','계단과 자연 지형을 연결하고 근경 대나무 뿌리에 바닥을 붙였습니다.'),36:('쇠가 없는 마을','집 앞 기능 구간을 유지하면서 주변 지형의 윤곽과 지층을 연결했습니다.'),37:('곶의 뒤편','큰 바위와 목재 경사로의 구조를 살리고 장식의 밝기와 밀도를 낮췄습니다.'),38:('어긋난 해식굴','천장 굴곡과 바닥의 변화를 살리고 동굴 내부의 잔무늬는 줄였습니다.'),39:('돌아오는 물','상부 돌 발판과 뒤쪽 바위를 정리하고, 호위 인물이 걸어갈 경사로를 완만하게 보정했습니다.'),40:('돌아가는 배','수로 지형과 목재 다리를 분리하고 내부 지층을 조용하게 정리했습니다.')}
I=[]
for n,cs in C.items():
 arr=[]
 for label,p in cs:
  b=(R/p).read_bytes(); arr.append({'label':label,'path':p,'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)})
 I.append({'stage':n,'name':T[n][0],'change':T[n][1],'concepts':arr})
(R/'tools/act4-visual-packet/source-inventory.json').write_text(json.dumps(I,ensure_ascii=False,indent=2)+'\n')
print('Prepared10 camera views and',sum(len(x['concepts']) for x in I),'actual source concepts')
