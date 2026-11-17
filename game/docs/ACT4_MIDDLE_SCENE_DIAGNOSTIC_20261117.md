# Act4 middle-stage Chrome diagnostic

Test-only files. Place four .mjs files under tests/, workflow under .github/workflows/. Intended branch base: clean396bac79, no Stage33 or Stage32 art candidate dependency. The fixture/result template was read from8300336e; runtime source references checked at that ref. No production code/artwork changed here.

34: focus-desktop-3 (6464,4336,1331/6800);37: edge-detail (1201,1552,.6);38: edge-desktop-4 (3456,2304,1331/6800). All1331x763,DPR1. These are targeted Native-comparison views, not whole-stage acceptance.

Source: act4-coast-events.js411 receipt wrapper returns if app.scene differs.34/38 use only synthetic{engine}, sufficient for their initial liveWater pass;38 asserts connectionProbe/connected inactive.37 liveWater446 needs app.scene via inView. It gets the actual Scene, a real hidden/non-open modal element, and document.body as root for unobscured DOM checks. No method stub or real App launch.

37 first completed render may only add observed={} and signalExposure=0 (source411/415). Existing values, receipt keys, gesture markers, nonzero exposure, physics, clocks and every other battle field must be unchanged. Frames2–4 each compare the full serialized battle to the settled first-frame snapshot.34/38 allow no first-frame mutation. Result explicitly distinguishes first initialization from full render purity.

Storage getters throw, App-ready promise stays unresolved, no tick/event progression or user battle used. Actual local Chrome not run. node--check all four files PASS; first-frame contract positive/negative unit PASS. Full fixture generation and Chrome remain CI work. Workflow default branch inspect/act4-middle-scene-20261117 is configurable by coordinator, plus workflow_dispatch.
