(function (G) {
    const hero = { archer: { name: '설오', job: '궁수', color: '#b7c393', branch: ['절명', '곡사', '강궁', '궁도'], line: '사라진 고향 사람들의 흔적을 쫓고 있다.' }, mage: { name: '담허', job: '도사', color: '#86bab6', branch: ['호리병술', '파문술', '진법', '도법'], line: '죽은 자는 오래 붙잡아 둘수록 더 깊이 상한다.' }, knight: { name: '휘겸', job: '무사', color: '#b9b6ab', branch: ['돌파', '호위', '검기', '무예'], line: '지금은 산 사람부터 지키는 것이 먼저다.' }, occultist: { name: '소단', job: '영매', color: '#ba9abf', branch: ['혼행', '주박', '초혼', '영매술'], line: '보이지 않아도, 여기 있다는 건 알아요.' } };
    const N = { M01: '불씨', M02: '연화탄', M03: '서리결', M04: '우렛줄', M05: '낙성인', M06: '성화산개', M07: '폭뢰', M08: '한수진', M09: '빙벽', M10: '끌림진', M11: '쇄빙인', M12: '천뢰인', M13: '염화혜성', M14: '빙륜', M15: '우레등', M99: '천공심판', A01: '평사', A02: '파갑시', A03: '반향시', A04: '산개사격', A05: '풍향시', A06: '속박시', A07: '쇄갑시', A08: '지연인', A09: '견인시', A10: '추적인', A11: '낙우', A12: '귀환시', A13: '추혼시', A14: '질풍시', A15: '추격성좌', A99: '별사냥', S01: '도약참', S02: '파산격', S03: '회풍참', S04: '관문돌파', S05: '진각', S06: '호위진', S07: '승천격', S08: '갈고리', S09: '월영참', S10: '지맥파', S11: '회선방패', S12: '귀환격', S13: '쇄진돌격', S14: '쌍월참', S15: '비월', S99: '파성진', O01: '혼령탄', O02: '투과령', O03: '역천령', O04: '황천창', O05: '회귀망령', O06: '쇠망부', O07: '증오부', O08: '악령진', O09: '봉혼부', O10: '연쇄원한', O11: '배회령', O12: '등불귀', O13: '돌격귀', O14: '수호령', O15: '귀문', O99: '만혼행렬' };
    const stages = [
      {id:1,name:'연목 고갯길',level:1,theme:'forest',template:1,objective:'arrival',goal:'연목 나루로 가는 고갯길 통과',w:8200,h:2200,map:[420,330],requires:[],enemies:4,active:2,narrationArt:'road'},
      {id:2,name:'상여 위의 높은 길',level:2,theme:'valley',template:2,objective:'overwatch',goal:'능선 위에서 장례 행렬을 끝까지 엄호',w:3600,h:6000,map:[760,520],requires:[1],recruit:'mage',joinLevel:3,enemies:6,active:3,narrationArt:'cliff'},
      {id:3,name:'나루의 남은 장부',level:3,theme:'river',template:4,objective:'ledger',goal:'홍만의 나루 움막에서 장부 회수',w:9400,h:2500,map:[1080,760],requires:[2],enemies:6,active:3,narrationArt:'ferry'},
      {id:4,name:'문 밖에 남은 사람들',level:4,theme:'gate',template:3,objective:'defend',goal:'피란민이 빠져나갈 때까지 연목 입구를 방어',w:7600,h:2300,map:[1460,700],requires:[3],enemies:7,active:3,holdRounds:9,narrationArt:'gate'},
      {id:5,name:'폭포 틈의 한 발',level:5,theme:'valley',template:5,objective:'seals',goal:'받이진을 지키며 절벽 틈의 고리쇠 파괴',w:10800,h:3000,map:[1810,360],requires:[4],recruit:'knight',joinLevel:6,enemies:10,active:4,narrationArt:'waterfall'},
      {id:6,name:'끊어진 나무다리',level:6,theme:'bridge',template:6,objective:'rescue',goal:'부상자 운반대를 북문 쉼터까지 호송',w:10400,h:2800,map:[2040,760],requires:[5],enemies:10,active:4,narrationArt:'bridge'},
      {id:7,name:'살아 있는 사람을 꺼내는 법',level:7,theme:'tree',template:7,objective:'rescue3',goal:'들린 주민 셋을 죽이지 않고 구조',w:6000,h:5600,map:[2350,760],requires:[6],enemies:11,active:4,narrationArt:'terrace'},
      {id:8,name:'돌아오는 빈 상여',level:8,theme:'shrine',template:8,objective:'bierboss',goal:'빈 상여에 옮겨 붙는 원혼을 받이진 안에서 제압',w:10800,h:3200,map:[2600,590],requires:[7],enemies:10,active:4,narrationArt:'bier'},
      {id:9,name:'바람 없는 마당',level:9,theme:'forest',template:9,objective:'prepare',goal:'주민을 대피시키고 두 받이진 준비',w:7600,h:2700,map:[2840,400],requires:[8],enemies:12,active:4,narrationArt:'yard'},
      {id:10,name:'소단 — 놓지 못한 밤',level:10,theme:'shrine',template:10,objective:'sodan',goal:'소단의 주박을 비살상으로 풀고 밀려드는 원혼을 함께 막기',w:8800,h:3000,map:[3070,220],requires:[9],enemies:8,active:4,narrationArt:'upper-yard'}
    ];
    const hubs=[{id:'camp',name:'불씨터',x:1290,y:1080},{id:'training',name:'허공터',x:760,y:1080}];
    for(const s of Object.values(G.HONRO_CORE.SKILLS))if(s.redesigned)N[s.id]=s.name;
    G.HONRO_CONTENT={title:'혼로',version:'1.0.0-rc.20',hero,skillNames:N,stages,hubs,act:'첫째 막 · 연목의 매듭'};
})(globalThis);
