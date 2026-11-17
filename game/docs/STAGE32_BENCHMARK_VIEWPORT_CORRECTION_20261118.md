# Correction: Stage32 benchmark viewport, 2026-11-18

CI44192825865 preserved-prior PNG check failed because its independent off-DOM canvas became1x1 when constructed by HonroScene. This exposed the same defect in the older cold/pan benchmark canvas: it was off-DOM with no CSS size too. Previously reported timings must NOT be used as measurements for the claimed1331x763 viewport. Main visible scene PNGs are separate DOM-sized captures and are unaffected by this finding. No past failed report is erased.

New fixture attaches both independent benchmark and reference canvases offscreen in the DOM with explicit CSS dimensions and asserts actual width/height after every Scene construction. Output includes canvas and CSS dimensions; result parser asserts allfour. Re-measurement pending; not a performance pass. The runtime source is unchanged from f94395bf. Prior exactly hashed images and nonwalk/alpha protection checks remain strict.
