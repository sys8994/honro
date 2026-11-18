# Static field tile prototype: local result, not accepted

Control is immutable helper 8c8fd33fc74ea89cca7895d01bd96b6a0928330b3b531a3c55671a181d3bbdc2. Original field geometry, BODY geometry and lower target background-copy/order remain unchanged. Native-only tile gather replaces field rerasterization; cached route remains exact. Original source and production registration are untouched.

Implementation: world-aligned 512-device-pixel tiles with two-pixel padding, actual scale/DPR, a bounded 24MiB LRU additionally constrained by 48MiB minus planned existing helper allocations. Evict before allocation, include cache logical bytes in stats, clear releases tiles to 1x1. It does not snap camera phases. Cached-route entry discards tiles. No cached destination/background image is reused.

Native local four poses: max 11,229 changed pixels, max RGB delta13; pan16 8,327/delta14; DPR3 15,263/delta12; cached exact0. All alpha/background changes0. These are not exact-output optimizations: field boundary raster AA is resampled instead of rerendered at each fractional phase. Direct maximum image inspection found the large terrain appearance intact but does not establish protected contribution or actual Chrome visual acceptance.

Six sequential frames each desktop and DPR3 exercise fractional horizontal/vertical movement, return, long tile crossing, and a different destination background. Alpha changes0 throughout. Maximum local logical totals: desktop21,491,032 bytes; phone37,997,360 bytes. clear leaves16 bytes. Tile reuse occurs, but DPR3 long movement evicts and rereads tiles. Return to same camera gives repeatable differences rather than accumulating corruption.

Native timings are diagnostic only, with pixel readback after each measurement and cold ordering/JIT effects. They do NOT demonstrate a benefit: later DPR3 control frames around131–139ms versus cached242–258ms show the extra gather can be slower in this backend. Original Chrome performance is not inferred from these numbers. A full Chrome suite is not justified as a presumed solution without narrower evidence on material cost and improved cache efficiency.

Decision: retain as an unaccepted isolated prototype. It uses substantially more memory, changes many field-boundary pixels and has no established speed gain. Do not register as product or weaken protection gates. A structural background-independent completed-material representation remains a separate design problem; blindly caching lowerTargetROI or resurrecting the rejected post-overlay is not valid.
