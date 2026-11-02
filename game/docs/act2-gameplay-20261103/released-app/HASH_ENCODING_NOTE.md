# Helper-file hash encoding correction

The inherited `hash()` utility serializes non-string values as JSON. Earlier App runners correctly hash runner text (`readFile(...,'utf8')`) and object/project data, but newly added adapter/navigation/preview/planner fields passed raw Node Buffers. Those specific earlier values are SHA256 of JSON Buffer serialization, **not raw-file SHA256**. Original result files remain immutable; never silently relabel their fields as raw digests.

The current runner now hashes Buffers as raw bytes. Existing source Git commits/trees and archived raw evidence hashes remain independently valid. Stage19 sourcea40a and in-flight12 sourcea40a retain the old helper-hash encoding; comparison requires reproducing that encoding or resolving the exact source files by commit. The complex18 registration separately recorded correct raw hashes and likewise retains its in-flight result's historical field semantics. Future runs declare raw-byte encoding explicitly.
