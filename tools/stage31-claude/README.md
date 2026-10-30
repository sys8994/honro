# Stage 31 — direct vector authoring (Claude)

User-approved test (2026-10-30): no generated concept image; terrain is authored
directly as vector shapes against the verified skeleton and the approved style
reference (`art/style-reference/act4-user-approved-20261030.png`).

Pipeline
1. `tools/act4-pilot/layouts/stage31-v5-supported.json` — the user-liked varied
   layout kept, every walkway given a structural reason (scree banks, landing
   scaffold, rope bridge, rock-face gallery, lookout deck, stair tower) plus a
   scaffold recovery from the shore pit. See `supportRationale`.
2. `python3 tools/stage31-claude/author.py` — paints REAR/STRUCT/BODY/SURFACE/FORE
   layers (`art/act4-stage31-claude-v1/`) and writes
   `stage31-v6-claude.json`, whose solid outlines are the painted outlines.
3. `node tools/act4-pilot/build-skeleton.mjs 31 _local/reports/act4-pilot/stage31/v6 tools/act4-pilot/layouts/stage31-v6-claude.json`
   then `probe-skeleton.mjs 31 --dir=...` (v6: edges 76/76, main route 4/4 bodies).
   The `pit-recovery` continuous row starts at the spawn by tool design and is
   expected to fail there; its links pass in the edge probes.
4. `import-svg.py` per layer → `_local/reports/stage31-claude/assets/*.asset.json`.
5. `node tools/stage31-claude/inspect.mjs --tag=...` — composes nativeArt elements
   and renders the production Scene on Native Canvas (Act4 hooks loaded).

Status: art candidate accepted in spirit by the user; enemies, events and
gameplay verification pending; not merged to master/Pages.
