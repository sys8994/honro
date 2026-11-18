# Stage7 visual regression exclusion candidate
Based on e8d8aa8865c832e831d6d221223356b440652e5f. Production change is only stage7 body author call returning original bodyCollage and removing stage7's extended optimizer registration. Stage3, all other registration rows, common culling and readability, and original source art stay unchanged. The rejected helper remains defined but unused to keep this narrowly reversible.

This does NOT repair the remaining original lower exterior. It deliberately excludes the visually rejected extended columns. Existing stage7 extension tests and integration-manifest assertions are not edited. Their actual exit statuses are saved as diagnostics; any failure remains an integration conflict, not a pass. New full-original BODY/stage equality, shared-codec baseline diagnosis, exact roundtrip and three-way Chrome comparisons are added. Four views per baseline/public7d, rejected/e8d8 and safe candidate. No user saves, existing battle, public UI, devices or formal performance acceptance. No master/Pages deployment.

Unaccepted native art studies are documented separately at ebe71819fa68fc9508869d58ade51c137db3f2fa. Human Chrome art review remains pending.
