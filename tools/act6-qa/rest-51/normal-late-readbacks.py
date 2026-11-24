"""Audited, optional hosted-test-only render readbacks for the exact generated source."""
from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text()
hook="  const tenthRaw=await readFile("
pos=s.index(hook)
s=s[:pos]+r'''  if(env.HONRO_ACT6_QA_NORMAL_LATE_WITNESS==='1'){
    for(const id of [58,59]){
      const target='s.owner'+id+'.tick();const r=s.owner'+id+'.project();if(!r)return;';
      source=replaceOne(source,target,target+'if(s.button)s.button.dataset.act6LateState=JSON.stringify(r);');
    }
    const stamp='        if(terminal?.stage===58&&s.normal51)';
    const midStamp="        if([55,56,57].includes(terminal?.stage)&&s.normal51&&terminal.won===true&&terminal.settlement===false&&s.button)s.button.dataset['act6Normal'+terminal.stage+'Receipt']=JSON.stringify(terminal);\n";

    source=replaceOne(source,stamp,midStamp+"        if((terminal?.stage===58||terminal?.stage===59)&&s.normal51&&s.button){s.button.dataset.act6LateReceipt=JSON.stringify(terminal);if(terminal.stage===59)s.button.dataset.act6LateBoundary=JSON.stringify(s.owner59.boundaryProof(terminal));}\n"+stamp);
  }
'''+s[pos:]
pos=s.index("\n }\n return {source:replaceOne")
s=s[:pos]+r'''  if(env.HONRO_ACT6_QA_NORMAL_LATE_WITNESS==='1'){
    const escortLine="        a.notify('마지막 두 혼과 함께 천천히 이동하십시오.');return true;";
    source=replaceOne(source,escortLine,"        if(s.guide)s.guide.dataset.act6GuideConfirmed='yes';\n"+escortLine);
    const stamp="        if((terminal?.stage===58||terminal?.stage===59)";
    source=replaceOne(source,stamp,"        if(terminal?.stage===60&&s.normal51&&s.guide)s.guide.dataset.act6LateReceipt=JSON.stringify(terminal);\n"+stamp);
    const shot="        s.advance.hidden=view.scene";
    source=replaceOne(source,shot,"        s.advance.dataset.act6CurrentEnding=view.scene;\n"+shot);
  }
'''+s[pos:]
# Escape newline in the generated JS string, not inside the Python program.
p.write_text(s)
