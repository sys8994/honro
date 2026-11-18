# Registered J versus5b: contracts pass, performance regression remains

CI44297700532SUCCESS/researche24f94557646dfd9a8ec974d425be382d250401f. Artifact14423319423 ZIP SHA2566eda05779fef842ef00a437ed141fa0b5c73c3661b3f7562d80a1c54acae11ec. Download hash,16captures and local checker verified. Baseline5b2edf0b868a6f4ab656574b036586304eb12808 vs registered Jaf5b77e15accea03470fdfd0c6cb00a0bb12c5e9; own official default builds and runtime, no helper override. Helper6823eda0/pilotded8ef2 exact. This is the actual registered comparison that prior126 override8c trial could not establish.

## Costs (milliseconds,5b→J)
|Condition|First median|Cold median|Hpan median/p95|Vpan median/p95|
|---|---:|---:|---:|---:|
|Desktopcached.6|142.75→330.0|59.60→130.20|2.20/4.50→2.30/3.20|2.30/2.90→2.40/3.00|
|Desktopnative1.65|55.45→30.90|2.10→7.55|1.10/1.70→5.30/5.90|1.10/1.40→5.20/5.40|
|Phone-sizeDPR3native1.65|51.0→37.5|1.95→11.80|.80/1.00→7.80/8.80|1.00/1.20→7.70/8.50|

10cold and60samples peraxis/variant; twoABBA blocks. Cached pan median nearbaseline but horizontal maximum33.2→67.2ms. Desktopnative maximum7.9H/16.6V; phone11.3H/10.2V. Native J pan medians by repeat block5.20/5.15desktop and7.70/7.80phone, not isolated noisy samples.

rAF120 horizontal desktop: callback gapmedian16.7→16.7ms,p9516.7→33.4;submitmedian.8→4.1,p951.0→4.6;loop1970.9→2394.2ms;finalreadback12.8→17ms. Phone:gapmedian16.7→33.3,p9533.4→33.4;submitmedian.6→6.15,p951.0→6.8;loop2277.9→3737ms;readback18.6→22.5. Longmaximumgaps216.7→266.7desktop,266.7→299.9phone remain. These are CIChrome scheduling/submission, not physicalphone FPS or measured GPU presentation.

## Interpretation
The previous8c→6823 improvement is real, but **does not remove the deployed5b regression**. Especially cached first/cold and sustained phone/native pan remain materially heavier. No invented agreed frame budget is used. Do not mark performance accepted or recommend release from this run. This is evidence to continue optimization or consciously decide a documented visual/cost tradeoff, not green-CI equivalence.

Native per60pan frames:material60rerasterizations,SS0; helperlogicalbytes4,062,224desktop/9,771,852phone. No screen targetROI allocation: offline face work removed that cost, but camera-keyed material redraw/ordered native drawing remain. Cached pan builds3material rasters and2SS calls across60frames; cached first/cold still pay SS and other tile preparation. Direct pass timing/GPU cost not independently isolated here. Do not blindly disable SS or blame only memory resize. Cached finalhelperlogical4,918,512bytes; includes retained buffers, not all Scene/JS/Path2D/native/GPU memory. Normal lifecycle release is a separate App test.

## Fairness and contracts
Exact registered six-file scope, Stage3source and referencedassets, nonvisual runtime modules,32compiledphysics/units/camera/sourceclips/pathcount, owncodec and0personalstorage pass. Raw25path strings differ from baseline optimized representation; independently applying baseline's official optimizer to a clone reproduces original optimizedBODY exactly. Actual renderer receives unmodified rawcandidate, not normalized for cost. Formal visualequivalence of all AA from this proof alone is not claimed.

Both ownbuild actual flagsACT4/ACT5/PHASE_A=true with no HONRO environmentoverride. Game/Workshop default build sourceprovenance recorded. Explicit campaignorigin supplied both. Those policy corrections differ from olderC harness but are documented; same3camera16page matrix retained. DPR3 actual1170×2088, desktop1331×763, same-backend sixcomponent BODYmatrix proof passes.16page includes12ABBA+4rAF, cleanH30/V15up15down, rAFhorizontalonly. Purityfreeze after officialinitialization but beforefirstrender, allrenderstrict. Manualcoldclear notnormalrelease.

Directly inspected J desktopmaximum and DPR3 screenshots; intended material visible, not a placeholder/no-op. This cost trial does not replace separate registered visual/fullforeground/all50/save/lifecycle gates or final live deployment verification.5b is the lastverifiedPages reference in this study, not a liveHTTPbyte assertion. No deployment performed.
