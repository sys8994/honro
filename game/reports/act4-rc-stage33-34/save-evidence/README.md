# Stage 33–34 UI export evidence

Executed source: `2577ef15e1c9b81fbb824ffd68f3f265ca9086b2`; disposable QA build, same Chromium contexts. This archive contains the four unmodified **UI download** files, not localStorage snapshots and not states reconstructed from logs. The actual stage-33 localStorage strings immediately before and after its reload were not captured and are unavailable. In particular, these downloads do not establish when localStorage was last updated.

`ui-exports.tar.xz` SHA-256: `32885c72b4ad9497f221b6b2fc889f8d50d31f33190f4db688ab701d9cb1f16d`. Its included relative `SHA256SUMS` was verified after extraction into a fresh directory:

| File | SHA-256 | Download file mtime UTC |
| --- | --- | --- |
| `stage33-before-ui-export.json` | `3ec2a0574c49ac80ebb53f82f38d1d06125aca560aab0c77e51cc8f796c411b4` | 2026-10-31 17:31:11.818 |
| `stage33-after-ui-export.json` | `16e0009877213a0ae3d04749473f30a09faa982b3cdb4b73f585fda09702dc37` | 2026-10-31 17:32:20.079 |
| `stage34-before-ui-export.json` | `9f96357c20c051286561bf5aa2b127a93d9224044f9dfed1944c5b75cd6415c3` | 2026-10-31 17:00:23.807 |
| `stage34-after-ui-export.json` | `c0019d2dd837aa6bce7cbe1dc2b638bfb8e7475cd73b5c956821fa5e16522c12` | 2026-10-31 17:01:10.672 |

These are filesystem modification times of Chromium's completed download files, not precise timestamps for every input or an independently captured localStorage write time.

Stage 33 sequence: during the scoped round-9 run, the active mage walked and jumped twice; at (753.374,2488.350), with 1701.126 movement remaining and action still unused, Escape opened Pause → Settings → Records → JSON export. The page was then reloaded while in that menu; the normal Continue button resumed round 9 at (189,2224.69), movement 2580. Escape → Settings → Records → JSON export produced the second file. No explicit separate save action was invoked between the two downloads. The other party members and enemies are detailed in the parent report. These observations are real but the missing localStorage snapshots prevent establishing the last underlying save write or the precise cause.

Stage 34 sequence: the round-12 optional-cave/boss scope was exported through the same Pause → Settings → Records → JSON export UI; the same context was reloaded and normal Continue used; another UI export followed. The two download snapshots match on the fields listed in the parent report, while `honroAct4PreviewState.clock` is 820.2029 before and 803.3668 after. Earlier/later times and UI pauses are not a measured play duration.

Source inspection at the executed commit shows `export()` clones the current live battle into the exported profile and calls `HonroProgression.persist`, but does not directly call `profileStore.save` in that method. `pause()` opens the menu and cancels input. This is a source observation, not proof that no other asynchronous save occurred. No live battle fields or receipts were injected. Unrelated later stage-34 localStorage originals are preserved separately under `/workspace/honro-snapshots/`; they are not substitutes for the missing stage-33 pre/post localStorage values.
