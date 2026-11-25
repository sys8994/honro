import sys,re
from pathlib import Path
p=Path(sys.argv[1])/'smoke.py';s=p.read_text()
point="def trial(browser,label,w,h,mobile,arm,kind):"
s=s.replace(point,"""def collect_debug_fixture(page,seq,n,original):
    a=page.evaluate('''n=>{const app=HonroApp,k='honro-campaign-act6-boundary-v2:'+app.normalProfile.equipment.runId,
        raw=localStorage.getItem(k);if(!raw)return {k,n};
        const body=JSON.parse(raw).honroAct6ChapterBoundary?.body;
        return {n,body};
    }''',n)
    assert a.get('body',{}).get('to')==n,(n,list(a))
    seq[str(n)]={'body':a['body'],'profile':json.loads(original)}
"""+chr(10)+point+chr(10)+"    debug_fixtures={}",1)
for n in range(52,61):
 if n in (58,59):
  q=r"^( +)stage_late\(page,state,mobile,original,tap,out,key,'/'\+PACKETS\["+str(n)+r"\]\[0\],"+str(n)+r"\).*$"
 else:q=r"^( +)stage"+str(n)+r"\(page,state,mobile,original,tap,out,key,.*$"
 count=len(list(re.finditer(q,s,re.M)));assert count==1,(n,count)
 s=re.sub(q,lambda m:m[0]+chr(10)+m[1]+f'collect_debug_fixture(page,debug_fixtures,{n},original)',s,count=1,flags=re.M)
s=s.replace("        state['status']='PASS'","""        if arm=='ON' and kind=='fresh-pending':
            assert sorted(int(x) for x in debug_fixtures)==list(range(52,61)),list(debug_fixtures)
            (out/f'{label}-DEBUG-FIXTURES.json').write_text(json.dumps(debug_fixtures,ensure_ascii=False,separators=(',',':')))
        state['status']='PASS'""",1)
s=s.replace("        viewports=[('PC',1440,900,False)] if audio_only else [('PC',1440,900,False),('M',390,844,True)]","        viewports=[('PC',1440,900,False)]")
s=s.replace("            arms=[('ON','fresh-pending')] if audio_only else [('OFF','fresh-pending'),('ON','fresh-pending'),('ON','legacy-format')]","            arms=[('ON','fresh-pending')]")
p.write_text(s)
