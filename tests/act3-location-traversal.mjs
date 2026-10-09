// Location and production geometry share the exact30 historical boundary.
// Original30 is still traversed here. Fresh30 uses stage30-ferry-traversal.mjs
// (12 routes x 4 classes), registered in test:stage30-ferry/test:act3.
process.env.HONRO_GEOMETRY_REPORT_DIR??='_local/reports/act3-locations';
await import('./act3-production-maps.mjs');
