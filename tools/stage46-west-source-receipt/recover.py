"""Read-only exact Stage46 W46-A1490 source extraction from an existing Git object DB."""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

PIN="2939958cc87407ef60b58720bb6e086b8559031b"
TREE="08e22a8cc0ab608e125ad73f8e8e1c288d8c4c74"
BASE="shared/assets/environment/act5/"
NEAR=BASE+"near-import.json"
PART=BASE+"stage46-exterior-part-2.json"
PROTECT=BASE+"stage46-protected-clips.json"
CAMPAIGN="web/data/campaign.fa9a5e8d3cb0a7e5.json"
DESCRIPTOR="web/data/chapter-46-assets-parts.44d5eab7aa305416.json"
MAP="web/data/chapter-46.2806e485c4c1e1b4.json"
PACK_SHA="120aa444cdf1094a9d3d081d1691d803ba0e46dd2cc1bbf989a5f1b59e930855"
PACK_BYTES=16590634
# For large author sources no separate SHA256 was available before checkout.
# Pin their independently looked-up exact Git blob and byte size, record SHA256 from those bytes.
FILES={
  NEAR:("938069390ced7f76242a81f008200d5f9b63a950",5732126,None),
  PART:("d148eee3e06e6d97ef150fc932284c1278b5a5ec",2659727,None),
  PROTECT:("3c64087c5fe91819f0bda694a51f5df8e91314dd",60439,"31c2de2322230ee09f4709ed2bb7fddd4edb3a09dd86f17818f0325e273b8a60"),
  "web/manifest.json":("dc5abd1657aa70245e456988202e1460f211fbf2",6421884,"cc22d45754173a212ab3ce05d7bc5b3faf211c13e7ad5ba08f252f8e10f56304"),
  CAMPAIGN:("983f72f8a1966bf33739d160b523249bc79f7d54",54885,"fa9a5e8d3cb0a7e54e7dd62130f61d93735f61fd4d56c9cb3b27874619ef4f3c"),
  MAP:("81c9f1d0538b795ce0ff76f80d90899b60481742",24682,"2806e485c4c1e1b4d94174b8324a2d534291c22c481c94960883a29643e9da02"),
  DESCRIPTOR:("4e477a37960585d9dc0babb85347b5350ccf1219",765,"44d5eab7aa305416e2d0d9ffec53ad210901e8271d216f0e9cab045cb7b04f1f"),
  "web/data/chapter-46-assets-part-000.aa1ac6564d0c2d99.bin":("80cce5cb2a6e504214b7c28fbc788d236d920d30",4194304,"aa1ac6564d0c2d99eaa561ff53b1712c5493bf11950a487526971bf1e2ff49bb"),
  "web/data/chapter-46-assets-part-001.78b6b5493616db85.bin":("76217098cf2cf334fbea3a84a80ebb4365213e42",4194304,"78b6b5493616db8581849645b13cff819928ac8eb2c1ee25e0f90cb41d2224c5"),
  "web/data/chapter-46-assets-part-002.8ec3bcfd1e3724d1.bin":("971b890c26fd12f76fd1beac87fb63d3242a9d13",4194304,"8ec3bcfd1e3724d10de3867c33c05a705fb7ccdc87bcbfde8228fc57caf9d8de"),
  "web/data/chapter-46-assets-part-003.e0accdc32bf303c0.bin":("c9a593151c401fb8cdae9350b0d22b98ae5acaf3",4007722,"e0accdc32bf303c08ea94737f9d8d662e568dd7e0b9b80c05374098d02b815fc"),
}
PARTS=tuple(k for k in FILES if k.endswith(".bin"))
ID="act5:near:46"
PART_ID="act5:stage46:exterior-body:2"
K="native-source-alpha"
def require(v,msg):
    if not v:raise ValueError(msg)

def sha(b):return hashlib.sha256(b).hexdigest()
def gp(b):return hashlib.sha1(f"blob {len(b)}\0".encode()+b).hexdigest()
def canon(v):return json.dumps(v,ensure_ascii=False,separators=(",",":"),allow_nan=False).encode()
def as_json(v):return canon(v)+b"\n"

def exact_stage46_member(raw):
    # Preserve the matching source object token literally, including its original JSON key/number bytes.
    # No other Stage41–50 member is emitted.
    text=raw.decode("utf-8"); dec=json.JSONDecoder()
    p=re.match(r"\s*\[",text).end()
    whitespace=re.compile(r"\s*")
    allids=[]; selected=None
    while True:
        p=whitespace.match(text,p).end()
        item,end=dec.raw_decode(text,p)
        require(type(item) is dict and type(item.get("id")) is int,"Invalid near-import member")
        allids.append(item["id"])
        if item["id"]==46:
            start_byte=len(text[:p].encode("utf-8"))
            end_byte=len(text[:end].encode("utf-8"))
            raw_slice=raw[start_byte:end_byte]
            require(json.loads(raw_slice)==item,"Near source token slice differs")
            selected=item,raw_slice,[start_byte,end_byte]
        q=whitespace.match(text,end).end()
        if text[q]=="]":
            require(not text[q+1:].strip(),"Unexpected bytes after near-import array")
            break
        require(text[q]==",","Unexpected near-import delimiter")
        p=q+1
    require(allids==list(range(41,51)) and selected is not None,"Unexpected stage member order")
    return selected

def unpack(packet):
    # Contract of compiled load-data.248fb3aada6f16bb.js, unpackJson (version 1).
    require(set(packet)=={"version","nodes","root"} and packet["version"]==1 and type(packet["nodes"]) is list,
            "Not the exact supported JSON pool shape")
    rows=packet["nodes"]
    def expand(ref,limit):
        if ref is None or type(ref) is bool:return ref
        if type(ref) is list:
            require(len(ref)==1 and type(ref[0]) in (float,int),"Invalid scalar JSON-pool quote")
            return ref[0]
        require(type(ref) is int and 0<=ref<limit,"Invalid/cyclic JSON-pool node")
        n=rows[ref]
        if type(n) is str:return n
        require(type(n) is list and n and n[0] in (0,1),"Unknown JSON-pool opcode")
        if n[0]==0:return [expand(q,ref) for q in n[1:]]
        require(len(n)%2==1,"Incomplete JSON-pool object")
        keys=[expand(x,ref) for x in n[1::2]]
        require(all(type(k) is str for k in keys) and len(keys)==len(set(keys)),"Unexpected JSON-pool keys")
        return {k:expand(v,ref) for k,v in zip(keys,n[2::2])}
    return expand(packet["root"],len(rows))

def write_receipt(repo,out):
    def git(*args):return subprocess.check_output(
        ["git","--no-replace-objects","-C",str(repo),*args],stderr=subprocess.PIPE)
    require(git("rev-parse",PIN+"^{commit}").decode().strip()==PIN,"Public commit missing")
    require(git("rev-parse",PIN+"^{tree}").decode().strip()==TREE,"Public tree differs")
    inmeta={}
    def get(p):
        oid,size,dig=FILES[p]
        require(git("rev-parse",PIN+":"+p).decode().strip()==oid,"Wrong Git path/blob "+p)
        b=git("show",PIN+":"+p)
        actual=sha(b)
        require(len(b)==size and gp(b)==oid and (dig is None or actual==dig),"Wrong object bytes "+p)
        inmeta[p]={"git":oid,"bytes":len(b),"sha256":actual}
        return b
    m=json.loads(get("web/manifest.json")); manifests={row["path"]:row for row in m["files"]}
    require(len(m["files"])==len(manifests) and m["project"]==CAMPAIGN,"Wrong active manifest")
    campaign=json.loads(get(CAMPAIGN))
    require([i for i,x in enumerate(campaign["catalog"]) if x["metadata"]["stageId"]==46]==[45],"Stage index differs")
    require(campaign["stages"][45]==MAP and campaign["stageLibraries"][45]==DESCRIPTOR and
            campaign["assetEncodings"]["stageLibraries"][45]=="json-pool-v1" and
            campaign["assetPaths"]["stageLibraries"][45]==[] and campaign["stageLibraries"].count(DESCRIPTOR)==1,
            "Stage46 asset graph differs")
    mapraw=get(MAP); st=json.loads(mapraw)
    require(st["metadata"]=={"stageId":46,"act":5,"actStage":6,"campaign":True} and
            st["elements"]==[{"id":"a5-near","assetId":ID,"x":0,"y":0,"scale":4,"rotation":0,
                              "layer":"structural-back","depthLayer":"L1","visualRole":"scenery"}],"Map/placement differs")

    descriptor=get(DESCRIPTOR); desc=json.loads(descriptor)
    require(desc=={"$honroJsonParts":1,"bytes":PACK_BYTES,"sha256":PACK_SHA,"parts":[
            {"path":p,"bytes":FILES[p][1],"sha256":FILES[p][2]} for p in PARTS]},"Descriptor differs")
    for p in (CAMPAIGN,MAP,DESCRIPTOR,*PARTS):
        require(all(manifests[p][k]==v for k,v in zip(("bytes","sha256"),FILES[p][1:])),"Inactive or mismatched "+p)
    joined=b"".join(get(p) for p in PARTS)
    require(len(joined)==PACK_BYTES and sha(joined)==PACK_SHA,"Assembled exact active Stage46 bundle differs")
    library=unpack(json.loads(joined)); require(type(library) is list and [x["id"] for x in library]==[ID],"Unexpected packed owners")
    a=library[0]
    record,raw_near,span=exact_stage46_member(get(NEAR))
    require(re.fullmatch("[a-f0-9]{64}",record["sha256"]) and record["sha256"]==a["params"]["sourceSha256"],"Wrong raw author identity")
    vector=a["vector"]; rv=record["vector"]; ext=a["shaftExterior"]; west=a["shaftExteriorParts"][1]
    require(vector["viewBox"]==rv["viewBox"] and vector["viewBox"]==[0,0,1024,1536] and
            len(vector["root"]["children"])==len(rv["root"]["children"])==6 and
            rv["root"]["children"][0]["clipPath"]=="a" and vector["root"]["children"][0]["clipPath"]=="a",
            "Unexpected west original source structure")
    require(len(a["shaftExteriorParts"])==5 and west["id"]==PART_ID,"Unexpected active column order")
    raw_part=get(PART); author=json.loads(raw_part)
    require(author["id"]==PART_ID,"Wrong author part2 identity")
    mask_raw=get(PROTECT); m0=json.loads(mask_raw)
    require(set(m0)=={"a","b"} and m0==a["shaftProtected"],"Runtime protected mask differs from author")
    shared=ext["vector"]["clips"][K]; individual=west["vector"]["clips"].get(K)
    require(type(shared) is list and shared and all(type(x) is str for x in shared),"Missing active common alpha")
    # Export only the relevant active Stage46 nodes (not all huge components/parts).
    root=vector["root"]
    runtime={"id":ID,"params":{"sourceSha256":a["params"]["sourceSha256"]},"anchor":a["anchor"],
      "originalWest":{"pointer":"/0/vector/root/children/0","viewBox":vector["viewBox"],
       "rootMetadata":{k:v for k,v in root.items() if k!="children"},
       "child0":root["children"][0],"nativeA":vector["clips"]["a"]},
      "registeredExterior":{"part2Pointer":"/0/shaftExteriorParts/1","part2ID":west["id"],
       "bodyCommonMaskPointer":"/0/shaftExterior/vector/clips/native-source-alpha","bodyCommonMask":shared,
       "bodyAnchor":ext.get("anchor"),"bodyRootTransform":ext["vector"]["root"].get("transform")}}
    files={"author-stage46-near-import-member.raw.json":raw_near,
           "author-stage46-exterior-part-2.raw.json":raw_part,
           "active-stage46-descriptor.raw.json":descriptor,
           "active-stage46-protected-a-b.raw.json":mask_raw,
           "active-stage46-west-owners.decoded.json":as_json(runtime)}
    same=author==west
    if not same:files["active-stage46-exterior-part-2.decoded.json"]=as_json(west)
    proof={"scope":"Read-only immutable repository object extraction; Stage46 west W46-A1490; no renders, inference, changes or user state",
      "release":PIN,"tree":TREE,"active":"json-pool-v1/4 independent existing transport parts",
      "inputGitObjects":inmeta,"assembled":{"bytes":len(joined),"sha256":sha(joined)},
      "authorOriginalNearStage46":{"selectedArrayIndex":5,"memberByteStartEnd":span,"nativeSourceSHA256":record["sha256"]},
      "stage46Placement":st["elements"][0],"authorPart2EqualsRuntimePart2":same,
      "runtimePart2CompactSHA256":sha(canon(west)),"runtimePart2SourceIs":'author-stage46-exterior-part-2.raw.json' if same else 'active-stage46-exterior-part-2.decoded.json',
      "runtimePartIndividualClipEqualsShared":individual==shared,"protectedSourceEqualsActive":m0==a["shaftProtected"],
      "projectionWarning":"Subset JSON is derived from verified active bytes. Raw original selected member and author part2 are literal byte copies. Raw original 10-stage package, descriptor shards and other art were not uploaded.",
      "exports":{n:{"bytes":len(b),"sha256":sha(b)} for n,b in files.items()}}
    for n,b in files.items():
        require(n.startswith(("author-stage46-","active-stage46-")) and n.endswith(".json"),"Unapproved names")
        (out/n).write_bytes(b)
    (out/"source-receipt.json").write_bytes(as_json(proof))
    (out/"SHA256SUMS").write_text("".join(f"{sha((out/n).read_bytes())}  {n}\n" for n in sorted((*files,"source-receipt.json"))))
    return proof

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--repo",type=Path,required=True)
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args();repo=args.repo.resolve();out=args.output.resolve()
    require(not out.is_relative_to(repo) and not out.exists(),"Output must be fresh and outside checkout")
    out.mkdir(parents=True)
    try:
        proof=write_receipt(repo,out)
        print(json.dumps({"release":PIN,"exportNames":sorted(proof["exports"]),"verifiedActiveBundle":PACK_SHA,
                          "sourceMatchesActivePart2":proof["authorPart2EqualsRuntimePart2"]}))
    except Exception as exc:
        # Never attach partial object payloads or Git credentials/diagnostic env.
        for p in out.iterdir():
            if p.is_file():p.unlink()
        (out/"failure.json").write_bytes(as_json({"status":"source receipt not verified","type":type(exc).__name__,"message":str(exc),"release":PIN}))
        raise

if __name__=="__main__":main()
