"""Read-only CDP witness for exact signedEdge source. No app or source injection."""
from hashlib import sha256
import re

MARKERS = {
    "direct": "c.stroke(filtered)",
    "tile": "c.drawImage(s,lx,ly,ww,hh,L,T,ww,hh)",
}


def _u16index(s, index):
    return len(s[:index].encode("utf-16-le")) // 2


def counter(session, records, solved_url, expected_sha):
    """Apply to a drained precise-coverage interval local to one real render."""
    chunks = [s for s in records if s["url"] == solved_url]
    if not chunks:
        return None  # No candidate wrapper executed this interval, not a positive witness.
    assert len(chunks) == 1, "Expected one exact compiled readability module script"
    hit = chunks[0]
    raw = session.send("Debugger.getScriptSource", {"scriptId": hit["scriptId"]})["scriptSource"]
    assert sha256(raw.encode()).hexdigest() == expected_sha, "CDP script differs from loaded fixed QA graph"
    found = [fn for fn in hit["functions"] if fn["functionName"] == "signedEdge"]
    if not found:
        return None
    assert len(found) == 1 and found[0]["isBlockCoverage"] is True, "Expected exact block coverage, not only function entry"
    ranges = found[0]["ranges"]
    bound = max(ranges, key=lambda r: r["endOffset"] - r["startOffset"])
    result = {}
    for role, marker in MARKERS.items():
        occurrences = list(re.finditer(r"(?<![\w$.])" + re.escape(marker), raw))
        assert len(occurrences) == 1, ("Expected exactly one phase marker in pinned compiled source", role)
        start = _u16index(raw, occurrences[0].start())
        end = start + len(marker)
        assert bound["startOffset"] <= start < end <= bound["endOffset"]
        matching = [r for r in ranges if r["startOffset"] <= start and r["endOffset"] >= end]
        # V8 coalesces ranges whose count equals the parent; range hierarchy still
        # gives the count at this statement, tested against direct/tile/early.
        assert matching
        r = min(matching, key=lambda p: p["endOffset"] - p["startOffset"])
        result[role] = {"count": r["count"], "start": start, "end": end, "range": r}
    return {"functionCalls":bound["count"],**result}
